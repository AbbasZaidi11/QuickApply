# ⚡ QuickApply — Job Application Autofill Extension

> Fill job applications in seconds. Your data never leaves your browser.

---

## The Problem

Every job application asks the same questions.

Name. Email. Phone. Current company. Years of experience. LinkedIn. GitHub. Notice period. Expected CTC.

You've typed this information hundreds of times. Across Workday, Greenhouse, Lever, iCIMS — each one making you start from scratch. Each one a small tax on your time and patience that adds up fast when you're applying at scale.

Browser autofill helps with name and email. It doesn't know what your notice period is. It doesn't know your current CTC. It doesn't know your GitHub URL.

Third-party tools like Simplify and Teal solve this — but they store your entire career history on their servers. Your employer, your salary, your personal details — all sitting in someone else's database.

**QuickApply solves the same problem without the tradeoff.**

---

## What It Does

QuickApply is a Chrome extension that:

- Stores your complete job application profile **locally in your browser** using `chrome.storage.local`
- Detects input fields on job application pages by scanning field names, labels, placeholders, and aria attributes
- Fills matched fields instantly with a single click
- Works across standard ATS platforms — tested on **Workday**
- Handles split first/last name fields automatically
- Supports export and import of your profile as JSON for backup

**No server. No account. No third party. Your data stays on your machine.**

---

## Fields Covered

| Section | Fields |
|---|---|
| Personal | Full Name, Email, Phone, Country Code |
| Address | Address Line 1, Address Line 2, Address Line 3, City, State, Postal Code, Country |
| Professional | Current Company, Job Title, Role Description, Years of Experience |
| Links | LinkedIn URL, GitHub URL, Portfolio URL |
| Education | Degree, College / University, Graduation Year |
| Compensation | Notice Period, Current CTC, Expected CTC |

---

## How It Works

**Field Detection**

The content script scans every `input`, `textarea`, and `select` element on the page. For each element, it extracts the `name`, `id`, `placeholder`, `aria-label`, and associated `<label>` text — then runs a substring match against a keyword map.

```
"city" field in profile
    ↕
keywords: ["city", "district", "town", "location", "current location"]
    ↕
matches placeholder="Current Location" on the job form
    ↕
fills with "Bangalore"
```

**React / Angular Compatibility**

After filling each field, the extension dispatches native `input` and `change` events using the React internal setter — ensuring framework-driven forms register the value change correctly, not just raw DOM forms.

**First / Last Name Splitting**

If a form has separate first and last name fields, QuickApply splits your stored full name automatically. No need to store them separately.

---

## Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome → go to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load Unpacked**
5. Select the project folder
6. Pin the QuickApply extension from the extensions menu

---

## Usage

1. Click the QuickApply icon in your toolbar
2. Fill in your profile (only needs to be done once)
3. Click **Save Profile**
4. Navigate to any job application page
5. Click **⚡ Fill** — done

**To update your profile:** Open the popup, edit any field, save again.

**Backup your data:** Use **Export JSON** to download your profile as a file. Use **Import JSON** to restore it.

---

## Folder Structure

```
quickapply/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   ├── content.js
│   └── fieldMap.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Tested On

| Platform | Status |
|---|---|
| Workday | ✅ Working |
| Greenhouse | 🔄 Untested |
| Lever | 🔄 Untested |
| iCIMS | 🔄 Untested |
| Taleo | 🔄 Untested |

Community testing and feedback welcome — see Contributing below.

---

## Limitations

- **Dropdown selects** (country, state, notice period) may not always auto-select correctly depending on how the ATS renders option values. Text fields work reliably.
- **Iframe-heavy forms** (some Workday configurations, Taleo) may partially fill depending on iframe sandboxing.
- **File upload** (resume) is intentionally not handled — browsers block programmatic file injection for security reasons.

---

## Privacy

QuickApply stores all data using `chrome.storage.local`. This means:

- Data is stored only on your local machine
- No data is sent to any server, ever
- No account, no login, no analytics
- Uninstalling the extension removes all stored data

---

## Contributing

This project is early. If you test it on a platform not listed above, open an issue with:
- The ATS platform name
- Which fields filled correctly
- Which fields were missed (and what the field label was)

This helps expand the keyword map for everyone.

---

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- `chrome.storage.local`
- No build step, no bundler, no dependencies

---

## Author

Built by **Abbas Raza Zaidi** — Systems Engineer, actively applying to product companies.  
GitHub: [@AbbasZaidi11](https://github.com/AbbasZaidi11)

---

*Built out of frustration. Tested on Workday. Open to feedback.*
