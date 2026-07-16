# Everyday Playground

A multi-page vanilla HTML, CSS, and JavaScript starter site for practical calculators.

## Included pages

- `index.html`: homepage with global navigation and featured calculator
- `calculators/index.html`: calculators directory page
- `calculators/receipt-splitter.html`: functional receipt-splitting calculator

## Project structure

```text
playground-site/
├── index.html
├── calculators/
│   ├── index.html
│   └── receipt-splitter.html
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        ├── nav.js
        └── receipt-splitter.js
```

## Run locally

Open `index.html` directly in a browser, or use Visual Studio Code's Live Server extension.

## Receipt splitter features

- Add and remove people
- Add and remove receipt items with prices
- Assign any item to one or more people through checkbox columns
- Divide shared items evenly among selected people
- Reconcile fractional-cent splits so displayed totals always equal the subtotal
- Responsive table and mobile navigation

## Adding a future calculator

1. Create a new HTML file inside `calculators/`.
2. Copy the shared navigation/header and footer markup from an existing page.
3. Include `../assets/css/styles.css` and `../assets/js/nav.js`.
4. Add a card/link for the new tool in `calculators/index.html`.
5. Create a tool-specific JavaScript file in `assets/js/` when needed.
