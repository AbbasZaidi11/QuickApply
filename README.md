# QuickApply

Job application autofill for Chrome.

QuickApply is a Manifest V3 Chrome extension that stores your job application profile locally and fills repeated application fields with one click.

Your data stays in your browser. There is no backend, no account, no analytics, and no external API.

## Why This Exists

Job applications ask for the same details again and again:

- Name
- Email
- Phone
- Address
- Current company
- Job title
- Years of experience
- Skills
- LinkedIn, GitHub, and portfolio links
- Education details
- Notice period
- Salary details
- Message to the hiring team or cover note

Browser autofill helps with basic contact information, but it does not understand job application specific fields like notice period, current CTC, GitHub URL, or a hiring team message.

QuickApply fills that gap while keeping everything local.

## Features

- Save your job application profile once
- Fill matching form fields on demand with the popup button
- Store profile data with `chrome.storage.local`
- Export your profile as JSON
- Import a saved JSON profile
- Detect fields using names, IDs, placeholders, labels, ARIA attributes, and nearby question text
- Handle split first name and last name fields
- Dispatch `input` and `change` events so React and Angular forms register updates
- Support common Workday style application questions

## Fields Covered

| Section | Fields |
| --- | --- |
| Personal | Full Name, Email, Phone, Country Code |
| Address | Address Line 1, Address Line 2, Address Line 3, City, State, Postal Code, Country |
| Professional | Current Company, Job Title, Role Description, Years of Experience, Skills, Message to Hiring Team / CV Note |
| Links | LinkedIn URL, GitHub URL, Portfolio URL |
| Education | Degree, College / University, Graduation Year, GPA |
| Compensation | Notice Period, Current CTC, Expected CTC |

## Project Structure

```text
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

## Installation

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `quickapply` folder.
6. Pin QuickApply from the Chrome extensions menu.

## Usage

1. Open the QuickApply popup.
2. Fill your profile fields.
3. Click **Save Profile**.
4. Open a job application page.
5. Click **Fill Page** in the QuickApply popup.

To update your profile, edit the popup fields and click **Save Profile** again.

To back up your profile, use **Export JSON**. To restore it, use **Import JSON**.

## How Field Detection Works

The content script scans these elements:

- `input`
- `textarea`
- `select`

For each element, it checks:

- `name`
- `id`
- `placeholder`
- `aria-label`
- `autocomplete`
- associated `<label>` text
- `aria-labelledby` text
- nearby headings
- nearby question text

It then compares that text with the keyword map in `content/fieldMap.js`.

Example:

```text
Profile field:
city

Keywords:
city, district, town, location, current location

Application field:
Current Location

Filled value:
Bangalore
```

## Supported Platforms

| Platform | Status |
| --- | --- |
| Workday | Tested |
| Greenhouse | Not fully tested |
| Lever | Not fully tested |
| iCIMS | Not fully tested |
| Taleo | Not fully tested |

## Limitations

- Some custom dropdowns may not fill if the site does not use a standard `select` element.
- Some ATS forms use iframes or shadow DOM, which can limit what a content script can access.
- Resume file upload is not supported because browsers block programmatic file injection for security reasons.
- Matching depends on the field labels and attributes exposed by the job application site.

## Privacy

QuickApply stores all profile data in `chrome.storage.local`.

- No server is used.
- No account is required.
- No data is sent to third parties.
- Uninstalling the extension removes the locally stored profile data.

## Tech Stack

- Chrome Manifest V3
- Vanilla JavaScript
- HTML
- CSS
- `chrome.storage.local`
- No npm
- No bundler
- No backend

## Development

After editing extension files:

1. Go to `chrome://extensions`.
2. Click reload on the QuickApply extension card.
3. Refresh the job application page you are testing.
4. Open the popup and click **Fill Page**.

## Contributing

If a field is missed on a job application page, note the exact field label or question text and add it to `content/fieldMap.js` under the right profile field.

Useful details for improvements:

- ATS platform name
- Field label or question text
- Expected QuickApply profile field
- Whether the field is an input, textarea, or dropdown

## Author

Built by **Abbas Raza Zaidi**.

GitHub: <https://github.com/AbbasZaidi11>
