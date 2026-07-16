# Everyday Playground

Everyday Playground is a personal collection of small browser-based tools built with plain HTML, CSS, and JavaScript.

The project is designed to stay lightweight, easy to edit, and simple to run without a backend, database, framework, or build process.

## Current Tools

- Receipt Splitter
- Google Ads Search Term Waste Analyzer

## Project Overview

This site is a multi-page web project for useful everyday calculators and analysis tools. Each tool runs directly in the browser and uses shared navigation, shared styling, and page-specific JavaScript where needed.

The project is currently maintained as a personal tool collection. The existing tools may be updated or improved over time, but this repository is not currently intended for outside calculator submissions.

## Features

### Shared Site Structure

- Multi-page website
- Shared navigation across pages
- Responsive layout
- Shared stylesheet
- Shared navigation script
- Calculator directory page for organizing available tools

### Receipt Splitter

The Receipt Splitter helps divide shared meal costs between multiple people.

Features include:

- Add people by name
- Add receipt items and item prices
- Automatically create checkbox columns for each person
- Assign each item to one or more people
- Split shared items evenly between selected people
- Display each person’s total below their column
- Remove people or receipt items
- Reset the receipt

Example:

If three people share an appetizer, the appetizer is split three ways. If two people share one dish, that dish is split between only those two people.

### Google Ads Search Term Waste Analyzer

The Search Term Waste Analyzer helps review exported Google Ads search term reports and identify possible wasted spend based on user-defined KPI thresholds.

Features include:

- Import a Google Ads Search Terms CSV export
- Analyze search terms locally in the browser
- Set KPI thresholds for:
  - Target CPA
  - Target ROAS
  - CPA and ROAS together
- Flag search terms with:
  - Spend and no conversions
  - Clicks and no conversions
  - CPA above the target
  - ROAS below the target
- Include keyword and match type context when available
- Show a keyword alignment indicator
- Filter flagged results by reason
- Export flagged search terms to a CSV file

The tool is intended for review and analysis. It does not connect to Google Ads or make changes to an account.

## Project Structure

```text
everyday-playground/
├── index.html
├── calculators/
│   ├── index.html
│   ├── receipt-splitter.html
│   └── search-term-analyzer.html
└── assets/
    ├── css/
    │   └── styles.css
    ├── data/
    │   └── search-terms-sample.csv
    └── js/
        ├── nav.js
        ├── receipt-splitter.js
        └── search-term-analyzer.js
```

## Getting Started

### Option 1: Open Directly in a Browser

Clone or download the repository, then open `index.html` in your browser.

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME
```

Then open:

```text
index.html
```

### Option 2: Use VS Code Live Server

1. Open the project folder in Visual Studio Code.
2. Install the Live Server extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

Live Server is recommended while editing the project because it refreshes the browser as files change.

## How to Use the Receipt Splitter

1. Open the Receipt Splitter page.
2. Add each person’s name.
3. Add receipt items and prices.
4. Check the people who ordered or shared each item.
5. Review the total below each person’s column.

If more than one person is checked for an item, the item cost is split evenly between them.

## How to Use the Search Term Waste Analyzer

1. Export a Search Terms report from Google Ads as a CSV.
2. Open the Search Term Waste Analyzer page.
3. Upload the CSV file.
4. Set KPI thresholds, such as target CPA or target ROAS.
5. Click **Analyze Search Terms**.
6. Review flagged search terms.
7. Export the flagged results if needed.

## Recommended Google Ads Export Columns

The analyzer works best when the CSV export includes the following columns:

```text
Search term
Keyword
Match type
Campaign
Ad group
Clicks
Cost
Conversions
Conv. value
```

Required columns:

```text
Search term
Clicks
Cost
Conversions
```

Optional columns:

```text
Keyword
Match type
Campaign
Ad group
Conv. value
```

ROAS analysis requires conversion value data.

## Keyword Alignment

The Search Term Waste Analyzer includes a simple keyword alignment indicator. This compares words in the search term against words in the matched keyword.

Alignment labels:

- **High**: most or all keyword words appear in the search term
- **Medium**: some keyword words appear in the search term
- **Low**: few or no keyword words appear in the search term

This is only a review aid. It is not a replacement for manual judgment, intent review, landing page review, or Google Ads Quality Score.

## Privacy

This project runs in the browser. Uploaded CSV files are processed locally and are not sent to a server.

The site does not currently use:

- A backend
- A database
- User accounts
- Tracking
- External APIs

## Technologies Used

- HTML
- CSS
- JavaScript

No frameworks or build tools are required.

## Future Development

Future updates may include improvements to the existing tools, additional reporting features, better CSV handling, or new utilities added by the project owner.

At this time, outside submissions for new calculators are not being requested.

## Notes

This project is meant to be simple, practical, and easy to understand. The tools are intentionally built with vanilla JavaScript so they can be edited without a complex setup.
