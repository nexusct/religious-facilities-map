# NexusCT Religious Facilities Map

Interactive market intelligence map of religious facilities within 50 miles of Schaumburg, IL.

## Features

- **4,776 religious facilities** from OpenStreetMap (churches, synagogues, mosques, temples, chapels, cathedrals)
- **Apollo.io enrichment** — leadership contacts, org data (revenue, employees, industry), websites, LinkedIn profiles
- Dark-mode Leaflet map with marker clustering
- Filters by facility type, religion, denomination, distance, state
- Search by name, city, denomination, or contact info
- CSV export with full Apollo enrichment data
- Google & LinkedIn search links for each facility

## Data Sources

- **OpenStreetMap** — base facility locations, names, addresses, types
- **Apollo.io** — organizational data and leadership contacts

## Stack

- Leaflet.js with MarkerCluster plugin
- CARTO dark tile layer
- Vanilla JS, no build step
- Static deployment (S3)

## Center Point

Schaumburg, IL (42.0334, -88.0834) — NexusCT HQ
50-mile radius coverage

## Usage

Open `index.html` in any modern browser. No server required.
