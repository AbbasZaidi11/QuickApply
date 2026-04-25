# ⚡ QuickApply

**Job application autofill for Chrome. Your data never leaves your browser.**

---

## The Problem

Every job application asks the same questions.

Name. Email. Phone. Current company. Years of experience. LinkedIn. GitHub. Notice period. Expected CTC.

You have typed this a hundred times. Across Workday, Greenhouse, Lever each one making you start from scratch.

Browser autofill helps with your name and email. It does not know your notice period. It does not know your current CTC. It does not know your GitHub URL.

Existing tools solve this but they want you to sign up, pick a plan, and suddenly your entire career history  employer, salary, personal details  is sitting on someone else's server with newsletters landing in your inbox.

QuickApply solves the same problem without the tradeoff.

---

## What It Does

- Stores your complete job application profile locally using `chrome.storage.local`
- Scans job application pages and detects fields automatically
- Fills matched fields instantly with one click
- Handles split first name and last name fields
- Dispatches native `input` and `change` events so React and Angular driven forms register the fill correctly
- Lets you export and import your profile as a JSON backup

No server. No account. No emails. No third party. Zero.

---

## Fields Covered

| Section | Fields |
|---|---|
| Personal | Full Name, Email, Phone, Country Code |
| Address | Address Line 1, Address Line 2, Address Line 3, City, State, Postal Code, Country |
| Professional | Current Company, Job Title, Role Description, Years of Experience, Skills |
| Links | LinkedIn URL, GitHub URL, Portfolio URL |
| Education | Degree, College / University, Graduation Year |
| Compensation | Notice Period, Current CTC, Expected CTC |

---

## Installation

```
1. Open Chrome
2. Go to chrome://extensions
3. Enable Developer Mode (top right toggle)
4. Click Load Unpacked
5. Select the quickapply folder
6. Pin QuickApply from the extensions menu
```

---

## Usage

```
1. Click the QuickApply icon
2. Fill in your profile (one time only)
3. Click Save Profile
4. Open any job application page
5. Click Fill Page
```

To back up your profile, use **Export JSON**.
To restore it on another machine, use **Import JSON**.

---

## How Field Detection Works

The content script scans every `input`, `textarea`, and `select` on the page.

For each element it extracts:

- `name` attribute
- `id` attribute
- `placeholder` attribute
- `aria-label` attribute
- `autocomplete` attribute
- Associated `<label>` text
- `aria-labelledby` referenced text

It then runs a substring match against the keyword map in `content/fieldMap.js`.

```
Profile field    ->   city
Keywords         ->   city, district, town, location, current location
Field on page    ->   placeholder="Current Location"
Filled with      ->   Bangalore
```

---

## Project Structure

```
quickapply/
+-- manifest.json
+-- popup/
|   +-- popup.html
|   +-- popup.js
|   +-- popup.css
+-- content/
|   +-- content.js
|   +-- fieldMap.js
+-- icons/
    +-- icon16.png
    +-- icon48.png
    +-- icon128.png
```

---

## Platform Support

| Platform | Status |
|---|---|
| Workday | ✅ Tested |
| Greenhouse | 🔄 Not fully tested |
| Lever | 🔄 Not fully tested |
| iCIMS | 🔄 Not fully tested |
| Taleo | 🔄 Not fully tested |

---

## Limitations

- Custom dropdowns that do not use a native `select` element may not fill
- Iframe-heavy or shadow DOM forms can limit content script access
- Resume file upload is not supported  browsers block programmatic file injection by design
- Match quality depends on the labels and attributes the ATS exposes

---

## Privacy

All data is stored in `chrome.storage.local`.

- Nothing is sent to any server
- No account is required
- No analytics, no telemetry, no third party access
- Uninstalling the extension removes all stored data from your machine

---

## Development

After making changes to any file:

```
1. Go to chrome://extensions
2. Click the reload icon on the QuickApply card
3. Hard refresh the job application tab (Ctrl + Shift + R)
4. Open popup and click Fill Page
```

You only need to re-unpack if you change `manifest.json`.

---

## Contributing

If QuickApply misses a field on a platform you are testing, open an issue with:

- The ATS platform name
- The exact field label or placeholder text
- The QuickApply profile field it should map to
- Whether it is an input, textarea, or dropdown

New keyword additions go in `content/fieldMap.js` under the relevant profile field key.

---

## Tech Stack

- Chrome Manifest V3
- Vanilla JavaScript
- HTML + CSS
- `chrome.storage.local`
- No npm, no bundler, no backend, no dependencies

---

## Author

Built by **Abbas Raza Zaidi** out of frustration with the job application process.

GitHub: [AbbasZaidi11](https://github.com/AbbasZaidi11)

---

*Tested on Workday. Open to feedback on everything else.*
