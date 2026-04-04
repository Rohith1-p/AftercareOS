# AftercareOS Landing Page

A validation landing page for the AftercareOS messaging platform, targeting medical aesthetics, med spas, and tattoo/PMU studios.

## Quick Start

Open `index.html` in your browser, or run a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Connecting the Waitlist Form

The waitlist form currently has `action="#"`. To collect signups, connect it to:

- **Formspree** – Add `action="https://formspree.io/f/YOUR_ID"` and `method="POST"`
- **Google Forms** – Embed or redirect to a Google Form
- **Your backend** – Point `action` to your API endpoint

## Files

- `index.html` – Main landing page
- `styles.css` – Styling (Supermi-inspired design)
- `README.md` – This file
