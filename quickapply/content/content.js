(function () {
  const fieldMap = window.quickApplyFieldMap || {};
  const FILLABLE_SELECTOR = "input, textarea, select";

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
      "date"
    ]);

    return allowedTypes.has(type);
  }

  function hasExistingValue(element) {
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
      element.getAttribute("autocomplete")
    ];

    const labelText = getLabelText(element);
    if (labelText) {
      attributes.push(labelText);
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
    if (element.tagName.toLowerCase() === "select") {
      return fillSelect(element, value);
    }

    element.focus();
    setNativeValue(element, value);
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
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
})();
