(function () {
  const fieldMap = window.quickApplyFieldMap || {};
  const FILLABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";
  const TEXT_CONTEXT_SELECTOR = [
    "label",
    "legend",
    ".field",
    ".form-field",
    ".form-group",
    ".iCIMS_Field",
    ".iCIMS_InfoField",
    ".iCIMS_Question",
    ".iCIMS_QuestionField",
    ".iCIMS_FormField",
    ".iCIMS_FormFieldRow",
    ".iCIMS_TableRow",
    "li",
    "tr",
    "td"
  ].join(",");

  window.quickApplyFillCurrentPage = fillCurrentPage;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "FILL_FORM") {
      return false;
    }

    fillCurrentPage()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  });

  async function fillCurrentPage() {
    const { userProfile = {} } = await chrome.storage.local.get("userProfile");
    const elements = Array.from(document.querySelectorAll(FILLABLE_SELECTOR));
    let filledCount = 0;

    for (const element of elements) {
      if (!isFillable(element) || hasExistingValue(element)) {
        continue;
      }

      const targetField = detectField(element);
      if (!targetField) {
        continue;
      }

      const value = getProfileValue(targetField, userProfile);
      if (!value) {
        continue;
      }

      const didFill = fillElement(element, value);
      if (didFill) {
        filledCount += 1;
      }
    }

    return { filledCount };
  }

  function isFillable(element) {
    if (element.disabled || element.readOnly) {
      return false;
    }

    if (element.matches("[aria-disabled='true']")) {
      return false;
    }

    if (!isVisibleForFill(element) && element.tagName.toLowerCase() !== "select") {
      return false;
    }

    if (element.tagName.toLowerCase() !== "input") {
      return true;
    }

    const type = (element.getAttribute("type") || "text").toLowerCase();
    const allowedTypes = new Set([
      "text",
      "email",
      "tel",
      "url",
      "search",
      "number",
      "month",
      "date",
      "radio",
      "checkbox"
    ]);

    return allowedTypes.has(type);
  }

  function hasExistingValue(element) {
    if (element.isContentEditable) {
      return Boolean(element.textContent && element.textContent.trim());
    }

    if (isChoiceInput(element)) {
      return element.checked;
    }

    if (element.tagName.toLowerCase() === "select") {
      return Boolean(element.value);
    }

    return Boolean(element.value && element.value.trim());
  }

  function detectField(element) {
    const haystack = getElementText(element);

    if (matchesAny(haystack, fieldMap.firstName)) {
      return "firstName";
    }

    if (matchesAny(haystack, fieldMap.lastName)) {
      return "lastName";
    }

    const priorityFields = [
      "addressLine2",
      "addressLine3",
      "city",
      "state",
      "postalCode",
      "countryCode",
      "country",
      "addressLine1",
      "noticePeriod",
      "currentCTC",
      "expectedCTC",
      "currentCompany",
      "jobTitle",
      "roleDescription",
      "yearsOfExperience"
    ];

    for (const fieldName of priorityFields) {
      if (matchesAny(haystack, fieldMap[fieldName])) {
        return fieldName;
      }
    }

    for (const [fieldName, keywords] of Object.entries(fieldMap)) {
      if (
        fieldName === "firstName" ||
        fieldName === "lastName" ||
        priorityFields.includes(fieldName)
      ) {
        continue;
      }

      if (matchesAny(haystack, keywords)) {
        return fieldName;
      }
    }

    return null;
  }

  function getElementText(element) {
    const attributes = [
      element.getAttribute("name"),
      element.getAttribute("id"),
      element.getAttribute("placeholder"),
      element.getAttribute("aria-label"),
      element.getAttribute("autocomplete"),
      element.getAttribute("title"),
      element.getAttribute("data-automation-id"),
      element.getAttribute("data-automation"),
      element.getAttribute("data-testid"),
      element.getAttribute("data-field"),
      element.getAttribute("data-name")
    ];

    const labelText = getLabelText(element);
    if (labelText) {
      attributes.push(labelText);
    }

    const describedByText = getDescribedByText(element);
    if (describedByText) {
      attributes.push(describedByText);
    }

    const optionText = getChoiceOptionText(element);
    if (optionText) {
      attributes.push(optionText);
    }

    const containerText = getContainerText(element);
    if (containerText) {
      attributes.push(containerText);
    }

    const nearbyHeadingText = getNearbyHeadingText(element);
    if (nearbyHeadingText) {
      attributes.push(nearbyHeadingText);
    }

    const nearbyQuestionText = getNearbyQuestionText(element);
    if (nearbyQuestionText) {
      attributes.push(nearbyQuestionText);
    }

    return attributes.filter(Boolean).join(" ").replace(/[_-]+/g, " ").toLowerCase();
  }

  function getLabelText(element) {
    const labels = [];

    if (element.labels) {
      labels.push(...Array.from(element.labels).map((label) => label.innerText));
    }

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const labelElement = document.getElementById(id);
        if (labelElement) {
          labels.push(labelElement.innerText);
        }
      }
    }

    return labels.join(" ");
  }

  function getDescribedByText(element) {
    const describedBy = element.getAttribute("aria-describedby");
    if (!describedBy) {
      return "";
    }

    return describedBy
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((descriptionElement) => descriptionElement.innerText || descriptionElement.textContent)
      .join(" ");
  }

  function getChoiceOptionText(element) {
    if (!isChoiceInput(element)) {
      return "";
    }

    const directLabel = getLabelText(element);
    if (directLabel) {
      return directLabel;
    }

    const id = element.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${cssEscape(id)}"]`);
      if (label) {
        return label.innerText || label.textContent || "";
      }
    }

    const parentLabel = element.closest("label");
    return parentLabel ? parentLabel.innerText || parentLabel.textContent || "" : "";
  }

  function getContainerText(element) {
    const containers = [];
    let current = element.parentElement;

    for (let depth = 0; depth < 5 && current; depth += 1) {
      if (current.matches(TEXT_CONTEXT_SELECTOR)) {
        containers.push(current);
      }

      current = current.parentElement;
    }

    for (const container of containers) {
      const text = extractContainerPrompt(container, element);
      if (text) {
        return text;
      }
    }

    return "";
  }

  function extractContainerPrompt(container, element) {
    const clones = [];

    for (const fillable of Array.from(container.querySelectorAll(FILLABLE_SELECTOR))) {
      if (fillable === element) {
        continue;
      }

      const clone = document.createElement("span");
      fillable.replaceWith(clone);
      clones.push([clone, fillable]);
    }

    const text = normalizeNearbyText(container.innerText || container.textContent);

    for (const [clone, fillable] of clones.reverse()) {
      clone.replaceWith(fillable);
    }

    return text;
  }

  function getNearbyHeadingText(element) {
    let current = element;

    for (let depth = 0; depth < 5 && current.parentElement; depth += 1) {
      let sibling = current.parentElement.previousElementSibling;

      while (sibling) {
        const heading = findLastHeading(sibling);
        if (heading) {
          return heading.innerText;
        }

        sibling = sibling.previousElementSibling;
      }

      current = current.parentElement;
    }

    return "";
  }

  function getNearbyQuestionText(element) {
    let current = element;

    for (let depth = 0; depth < 5 && current.parentElement; depth += 1) {
      const text = getPreviousSiblingText(current.parentElement);
      if (text) {
        return text;
      }

      current = current.parentElement;
    }

    return "";
  }

  function getPreviousSiblingText(element) {
    let sibling = element.previousElementSibling;
    const pieces = [];

    while (sibling && pieces.length < 3) {
      if (!sibling.matches(FILLABLE_SELECTOR) && !sibling.querySelector(FILLABLE_SELECTOR)) {
        const text = normalizeNearbyText(sibling.innerText || sibling.textContent);
        if (text) {
          pieces.unshift(text);
        }
      }

      sibling = sibling.previousElementSibling;
    }

    return pieces.join(" ");
  }

  function normalizeNearbyText(text = "") {
    const normalized = text.replace(/\s+/g, " ").trim();

    if (!normalized || normalized.length > 220) {
      return "";
    }

    return normalized;
  }

  function findLastHeading(root) {
    if (isHeading(root)) {
      return root;
    }

    const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']");
    return headings[headings.length - 1] || null;
  }

  function isHeading(element) {
    return /^H[1-6]$/.test(element.tagName) || element.getAttribute("role") === "heading";
  }

  function matchesAny(haystack, keywords = []) {
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  }

  function getProfileValue(fieldName, profile) {
    if (fieldName === "firstName") {
      return splitName(profile.fullName).firstName;
    }

    if (fieldName === "lastName") {
      return splitName(profile.fullName).lastName;
    }

    return profile[fieldName];
  }

  function splitName(fullName = "") {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ")
    };
  }

  function fillElement(element, value) {
    if (element.isContentEditable) {
      element.focus();
      element.textContent = value;
      dispatchFieldEvents(element);
      return true;
    }

    if (isChoiceInput(element)) {
      return fillChoiceInput(element, value);
    }

    if (element.tagName.toLowerCase() === "select") {
      return fillSelect(element, value);
    }

    element.focus();
    setNativeValue(element, value);
    dispatchFieldEvents(element);
    return true;
  }

  function fillChoiceInput(element, value) {
    const type = (element.getAttribute("type") || "").toLowerCase();
    const normalizedValue = normalize(value);
    const optionText = normalize(getChoiceOptionText(element));
    const elementValue = normalize(element.value);

    if (type === "radio") {
      const shouldSelect =
        optionText === normalizedValue ||
        elementValue === normalizedValue ||
        optionText.includes(normalizedValue) ||
        normalizedValue.includes(optionText);

      if (!shouldSelect) {
        return false;
      }
    }

    if (type === "checkbox" && !isTruthyValue(value)) {
      return false;
    }

    element.focus();
    element.click();
    if (!element.checked) {
      element.checked = true;
    }
    dispatchFieldEvents(element);
    return true;
  }

  function fillSelect(select, value) {
    const normalizedValue = normalize(value);
    const option = Array.from(select.options).find((candidate) => {
      return (
        normalize(candidate.value) === normalizedValue ||
        normalize(candidate.textContent).includes(normalizedValue) ||
        normalizedValue.includes(normalize(candidate.textContent))
      );
    });

    if (!option) {
      return false;
    }

    setNativeValue(select, option.value);
    dispatchFieldEvents(select);
    syncSelectWidget(select, option);
    return true;
  }

  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
      return;
    }

    element.value = value;
  }

  function normalize(value = "") {
    return String(value).trim().toLowerCase();
  }

  function dispatchFieldEvents(element) {
    element.dispatchEvent(new Event("focus", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function syncSelectWidget(select, option) {
    const selectId = select.getAttribute("id");
    const select2Container = selectId
      ? document.getElementById(`s2id_${selectId}`) ||
        document.querySelector(`[id="select2-${cssEscape(selectId)}-container"]`)
      : null;

    if (!select2Container) {
      return;
    }

    const rendered = select2Container.querySelector(
      ".select2-chosen, .select2-selection__rendered"
    );
    if (rendered) {
      rendered.textContent = option.textContent.trim();
    }
  }

  function isChoiceInput(element) {
    if (element.tagName.toLowerCase() !== "input") {
      return false;
    }

    const type = (element.getAttribute("type") || "").toLowerCase();
    return type === "radio" || type === "checkbox";
  }

  function isTruthyValue(value) {
    return ["1", "true", "yes", "y", "checked", "agree"].includes(normalize(value));
  }

  function isVisibleForFill(element) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }
})();
