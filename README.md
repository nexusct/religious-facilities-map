# NexusCT Religious Facilities Map

Interactive market intelligence map of **4,776 religious facilities** within 50 miles of Schaumburg, IL. Built as a sales prospecting tool for NexusCT's AV, networking, and managed services business targeting churches and religious organizations.

## Features

- **4,776 religious facilities** — churches, synagogues, mosques, temples, chapels, cathedrals
- **Apollo.io enrichment** — 2,467 organizations matched, 12,243 leadership contacts
- **Aerial satellite imagery** — 1,712 aerial photos organized by city, viewable in popup and sidebar
- **Google Maps satellite links** for every facility
- **Filters** by facility type, religion, denomination, distance, state
- **Full-text search** by name, city, denomination, or contact info
- **Detail popups** — address, phone, contacts, org data, aerial photo, satellite link
- **CSV export** with full Apollo enrichment data
- **Statistics panels** — enrichment coverage, contact counts, type/denomination breakdown

## Data Sources

- **OpenStreetMap / Overpass API** — base facility locations, names, addresses, types, denominations
- **Apollo.io** — organizational data (revenue, employees, industry) and leadership contacts
- **Google Maps Static API** — aerial satellite imagery

## Tech Stack

- Leaflet.js + MarkerCluster (CDN)
- CARTO dark tile layer
- Vanilla HTML/CSS/JS — no build step
- Static deployment

## Coverage

- **Center:** Schaumburg, IL (42.0334, -88.0834) — NexusCT HQ
- **Radius:** 50 miles

## Usage

Open `index.html` in any modern browser. No server required.

---

© Nexus Communications Technology | Schaumburg, IL
