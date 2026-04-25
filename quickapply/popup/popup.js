const PROFILE_KEY = "userProfile";
const PROFILE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "countryCode",
  "addressLine1",
  "addressLine2",
  "addressLine3",
  "city",
  "state",
  "postalCode",
  "country",
  "currentCompany",
  "jobTitle",
  "roleDescription",
  "yearsOfExperience",
  "coverLetter",
  "linkedinUrl",
  "githubUrl",
  "portfolioUrl",
  "degree",
  "college",
  "graduationYear",
  "gpa",
  "skills",
  "noticePeriod",
  "currentCTC",
  "expectedCTC"
];

const form = document.getElementById("profileForm");
const importFile = document.getElementById("importFile");
const toast = document.getElementById("toast");

document.addEventListener("DOMContentLoaded", loadProfile);
form.addEventListener("submit", saveProfile);
document.getElementById("exportJson").addEventListener("click", exportJson);
document.getElementById("importJson").addEventListener("click", () => importFile.click());
document.getElementById("fillPage").addEventListener("click", fillPage);
importFile.addEventListener("change", importJson);

async function loadProfile() {
  const { [PROFILE_KEY]: profile = {} } = await chrome.storage.local.get(PROFILE_KEY);
  populateForm(profile);
}

async function saveProfile(event) {
  event.preventDefault();
  const profile = readForm();
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });
  showToast("Profile saved");
}

async function exportJson() {
  const profile = readForm();
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });

  const blob = new Blob([JSON.stringify(profile, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quickapply-profile.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Profile exported");
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedProfile = JSON.parse(text);
    const profile = normalizeProfile(importedProfile);
    await chrome.storage.local.set({ [PROFILE_KEY]: profile });
    populateForm(profile);
    showToast("Profile imported");
  } catch (error) {
    showToast("Import failed: invalid JSON");
  } finally {
    importFile.value = "";
  }
}

async function fillPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    showToast("No active tab found");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "FILL_FORM" }, (response) => {
    if (chrome.runtime.lastError) {
      showToast("Refresh the page, then try again");
      return;
    }

    if (!response || !response.ok) {
      showToast("Could not fill this page");
      return;
    }

    showToast(`Filled ${response.filledCount} field${response.filledCount === 1 ? "" : "s"}`);
  });
}

function readForm() {
  return PROFILE_FIELDS.reduce((profile, fieldName) => {
    const field = form.elements[fieldName];
    profile[fieldName] = field ? field.value.trim() : "";
    return profile;
  }, {});
}

function populateForm(profile) {
  const normalizedProfile = normalizeProfile(profile);
  for (const fieldName of PROFILE_FIELDS) {
    if (form.elements[fieldName]) {
      form.elements[fieldName].value = normalizedProfile[fieldName];
    }
  }
}

function normalizeProfile(profile) {
  return PROFILE_FIELDS.reduce((normalized, fieldName) => {
    normalized[fieldName] = typeof profile[fieldName] === "string" ? profile[fieldName] : "";
    return normalized;
  }, {});
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}
