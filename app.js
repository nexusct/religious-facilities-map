/* ════════════════════════════════════════════════════════════
   NexusCT — Religious Facilities Map App
   Leaflet + MarkerCluster interactive map
   with Apollo.io enrichment data
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  const SCHAUMBURG = [42.0334, -88.0834];
  const RADIUS_MILES = 50;
  const MILES_TO_METERS = 1609.344;
  const GMAPS_API_KEY = 'AIzaSyDnKyekc_Ctc5sI0LbQ2pHqgVTuqlfvs4s';

  /* ── Aerial image helpers ────────────────────────────────── */
  function aerialThumbUrl(lat, lon, size) {
    size = size || 300;
    const scale = size > 300 ? 2 : 1;
    const px = scale > 1 ? Math.ceil(size / 2) : size;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=19&size=${px}x${px}&scale=${scale}&maptype=satellite&key=${GMAPS_API_KEY}`;
  }
  function gmapsSatLink(lat, lon) {
    return `https://www.google.com/maps/@${lat},${lon},200m/data=!3m1!1e3`;
  }
  function hasAerialData(f) {
    return f.apollo_contacts && f.apollo_contacts.length > 0 && f.apollo_contacts.some(c => c.email);
  }

  const TYPE_COLORS = {
    'Church':     '#22c55e',
    'Synagogue':  '#3b82f6',
    'Mosque':     '#f59e0b',
    'Temple':     '#8b5cf6',
    'Chapel':     '#06b6d4',
    'Cathedral':  '#ec4899',
  };

  const TYPE_SHORT = {
    'Church':     'Church',
    'Synagogue':  'Synagogue',
    'Mosque':     'Mosque',
    'Temple':     'Temple',
    'Chapel':     'Chapel',
    'Cathedral':  'Cathedral',
  };

  /* ── State ─────────────────────────────────────────────── */
  const filters = {
    types: new Set(Object.keys(TYPE_COLORS)),
    maxDistance: 50,
    religions: new Set(), // populated dynamically
    states: new Set(),    // populated dynamically
    search: '',
    apolloOnly: false,
    denomination: '',
  };

  let visibleFacilities = [];
  let markerMap = new Map();
  let clusterGroup;
  let mapInstance;

  /* ── Discover dynamic filters from data ─────────────────── */
  function discoverFilters() {
    const religions = new Set();
    const states = new Set();
    FACILITIES.forEach(f => {
      if (f.religion) religions.add(f.religion);
      states.add(f.state || '');
    });
    filters.religions = new Set(religions);
    filters.states = new Set(states);
  }

  /* ── Map init ──────────────────────────────────────────── */
  function initMap() {
    mapInstance = L.map('map', {
      center: SCHAUMBURG,
      zoom: 9,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance);

    L.circle(SCHAUMBURG, {
      radius: RADIUS_MILES * MILES_TO_METERS,
      color: '#00b4d8',
      weight: 1,
      dashArray: '6, 8',
      fillColor: '#00b4d8',
      fillOpacity: 0.03,
      interactive: false,
    }).addTo(mapInstance);

    const hqIcon = L.divIcon({
      html: '<div class="hq-marker"><div class="hq-pulse"></div></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(SCHAUMBURG, { icon: hqIcon, zIndexOffset: 9999 })
      .addTo(mapInstance)
      .bindTooltip('<div class="tooltip-name">NexusCT HQ</div><div class="tooltip-type">Schaumburg, IL</div>', {
        permanent: false,
        direction: 'top',
        offset: [0, -14],
      });

    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 14,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? 32 : count < 100 ? 36 : 40;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:rgba(0,180,216,0.18);
            border:1.5px solid rgba(0,180,216,0.45);
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-family:'DM Mono',monospace;
            font-size:${count < 100 ? 11 : 10}px;
            font-weight:500;
            color:#00b4d8;
          ">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    mapInstance.addLayer(clusterGroup);
  }

  /* ── Marker creation ───────────────────────────────────── */
  function makeMarker(facility, idx) {
    const color = TYPE_COLORS[facility.subtype] || '#9ba3b8';
    const hasApollo = facility.apollo_enriched && (facility.apollo_contacts || facility.apollo_org);
    
    const icon = L.divIcon({
      html: `<div style="
        width:12px;height:12px;
        background:${color};
        border:2px solid ${hasApollo ? '#00b4d8' : 'rgba(255,255,255,0.85)'};
        border-radius:50%;
        box-shadow:0 1px 4px rgba(0,0,0,0.5)${hasApollo ? ',0 0 6px rgba(0,180,216,0.4)' : ''};
      "></div>`,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const marker = L.marker([facility.lat, facility.lon], { icon });

    marker.bindTooltip(
      `<div class="tooltip-name">${escHtml(facility.name)}</div>
       <div class="tooltip-type">${escHtml(facility.subtype)}${facility.denomination ? ' · ' + escHtml(facility.denomination) : ''}</div>
       ${hasApollo ? '<div class="tooltip-apollo">Apollo Data Available</div>' : ''}`,
      { direction: 'top', offset: [0, -8], sticky: false }
    );

    marker.bindPopup(buildPopup(facility), {
      maxWidth: 360,
      minWidth: 280,
      closeButton: true,
    });

    return marker;
  }

  /* ── Popup HTML ────────────────────────────────────────── */
  function buildPopup(f) {
    const color = TYPE_COLORS[f.subtype] || '#9ba3b8';
    const dist  = f.distance ? f.distance.toFixed(1) + ' mi' : '—';

    let addressLine = f.address || '';
    if (f.city)  addressLine += (addressLine ? ', ' : '') + f.city;
    if (f.state) addressLine += (addressLine ? ', ' : '') + f.state;
    if (f.zip)   addressLine += ' ' + f.zip;

    let rows = '';

    if (addressLine) {
      rows += `<div class="popup-row">
        <svg class="popup-row-icon" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5C4.79 1.5 3 3.29 3 5.5c0 3.38 4 7 4 7s4-3.62 4-7c0-2.21-1.79-3.5-4-3.5z" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <circle cx="7" cy="5.5" r="1" fill="currentColor"/>
        </svg>
        <span class="popup-row-text">${escHtml(addressLine)}</span>
      </div>`;
    }

    if (f.phone) {
      rows += `<div class="popup-row">
        <svg class="popup-row-icon" viewBox="0 0 14 14" fill="none">
          <path d="M4.5 2.5h2l1 2.5-1.5 1a6.5 6.5 0 003 3l1-1.5 2.5 1v2A1 1 0 0111.5 11.5 10 10 0 012.5 2.5 1 1 0 014.5 2.5z" stroke="currentColor" stroke-width="1.2" fill="none"/>
        </svg>
        <span class="popup-row-text"><a href="tel:${escHtml(f.phone)}">${escHtml(f.phone)}</a></span>
      </div>`;
    }

    if (f.website) {
      const display = f.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      rows += `<div class="popup-row">
        <svg class="popup-row-icon" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M2 7h10M7 2C5.5 4 5 5.5 5 7s.5 3 2 5M7 2c1.5 2 2 3.5 2 5s-.5 3-2 5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="popup-row-text"><a href="${escHtml(f.website)}" target="_blank" rel="noopener noreferrer">${escHtml(display)}</a></span>
      </div>`;
    }

    // Meta grid
    const metaItems = [];
    
    if (dist !== '—') {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Distance</div>
        <div class="popup-meta-value">${dist}</div>
      </div>`);
    }

    if (f.religion) {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Religion</div>
        <div class="popup-meta-value" style="font-family:var(--font-sans);font-size:11px;text-transform:capitalize">${escHtml(f.religion)}</div>
      </div>`);
    }

    if (f.denomination) {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Denomination</div>
        <div class="popup-meta-value" style="font-family:var(--font-sans);font-size:11px;text-transform:capitalize">${escHtml(f.denomination)}</div>
      </div>`);
    }

    // Apollo org data
    const org = f.apollo_org || {};
    if (org.employees) {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Employees</div>
        <div class="popup-meta-value">${escHtml(String(org.employees))}</div>
      </div>`);
    }
    if (org.revenue) {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Revenue</div>
        <div class="popup-meta-value">${escHtml(org.revenue)}</div>
      </div>`);
    }
    if (org.founded) {
      metaItems.push(`<div class="popup-meta-item">
        <div class="popup-meta-label">Founded</div>
        <div class="popup-meta-value">${escHtml(String(org.founded))}</div>
      </div>`);
    }
    if (org.industry) {
      metaItems.push(`<div class="popup-meta-item" style="grid-column:1/-1">
        <div class="popup-meta-label">Industry</div>
        <div class="popup-meta-value" style="font-family:var(--font-sans);font-size:11px">${escHtml(org.industry)}</div>
      </div>`);
    }
    if (org.description) {
      metaItems.push(`<div class="popup-meta-item" style="grid-column:1/-1">
        <div class="popup-meta-label">About</div>
        <div class="popup-meta-value" style="font-family:var(--font-sans);font-size:11px;line-height:1.4">${escHtml(org.description)}</div>
      </div>`);
    }

    const metaGrid = metaItems.length
      ? `<div class="popup-meta-grid">${metaItems.join('')}</div>` : '';

    // Apollo contacts section
    let contactsHtml = '';
    const contacts = f.apollo_contacts || [];
    const people = f.apollo_people || [];
    
    if (contacts.length > 0) {
      const contactCards = contacts.map(c => {
        let links = '';
        if (c.email) links += `<a href="mailto:${escHtml(c.email)}" class="contact-link" title="Email">${escHtml(c.email)}</a>`;
        if (c.linkedin) links += `<a href="${escHtml(c.linkedin)}" target="_blank" rel="noopener noreferrer" class="contact-link contact-linkedin" title="LinkedIn">LinkedIn</a>`;
        if (c.phone) links += `<a href="tel:${escHtml(c.phone)}" class="contact-link" title="Phone">${escHtml(c.phone)}</a>`;
        
        return `<div class="contact-card">
          <div class="contact-name">${escHtml(c.name)}</div>
          <div class="contact-title">${escHtml(c.title)}</div>
          ${links ? `<div class="contact-links">${links}</div>` : ''}
        </div>`;
      }).join('');

      contactsHtml = `<div class="popup-contacts">
        <div class="popup-contacts-header">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Key Contacts <span class="contact-count">${contacts.length}</span>
        </div>
        ${contactCards}
      </div>`;
    } else if (people.length > 0) {
      const highValue = people.filter(p => p.high_value);
      if (highValue.length > 0) {
        const hints = highValue.slice(0, 3).map(p => 
          `<div class="contact-hint">${escHtml(p.first_name)} — ${escHtml(p.title)}</div>`
        ).join('');
        contactsHtml = `<div class="popup-contacts">
          <div class="popup-contacts-header">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            People Found <span class="contact-count">${people.length}</span>
          </div>
          ${hints}
        </div>`;
      }
    }

    // Apollo org LinkedIn link
    let orgLinks = '';
    if (org.linkedin) {
      orgLinks += `<a href="${escHtml(org.linkedin)}" target="_blank" rel="noopener noreferrer" class="popup-search-btn popup-search-linkedin" title="Company LinkedIn">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123zM6.893 20.452H3.58V9h3.413v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn
      </a>`;
    }

    // Build search URLs
    const searchName = encodeURIComponent(f.name);
    const searchLoc  = encodeURIComponent((f.city || '') + ' ' + (f.state || ''));
    const googleUrl   = `https://www.google.com/search?q=${searchName}+${searchLoc}`;
    const linkedinUrl  = org.linkedin || `https://www.linkedin.com/search/results/companies/?keywords=${searchName}`;

    // Enrichment badge
    const enrichBadge = f.apollo_enriched 
      ? (contacts.length > 0 
        ? '<span class="apollo-badge apollo-rich">Apollo Enriched</span>'
        : (f.apollo_org ? '<span class="apollo-badge apollo-partial">Apollo Org Data</span>' : '<span class="apollo-badge apollo-searched">Apollo Searched</span>'))
      : '';

    // Aerial image section
    let aerialHtml = '';
    if (hasAerialData(f)) {
      const thumbUrl = aerialThumbUrl(f.lat, f.lon, 360);
      const satLink  = gmapsSatLink(f.lat, f.lon);
      aerialHtml = `<div class="popup-aerial">
        <a href="${satLink}" target="_blank" rel="noopener noreferrer" title="Open in Google Maps Satellite View">
          <img src="${thumbUrl}" alt="Aerial view of ${escHtml(f.name)}" class="popup-aerial-img" loading="lazy" />
        </a>
        <a href="${satLink}" target="_blank" rel="noopener noreferrer" class="popup-aerial-link">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M10 2h4v4M14 2L7 9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          View on Google Maps Satellite
        </a>
      </div>`;
    }

    // Saved list state for popup
    const fIdx = FACILITIES.indexOf(f);
    const isSaved = window._savedListManager ? window._savedListManager.isInAnyList(fIdx) : false;
    const saveIcon = isSaved 
      ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>';

    return `<div class="popup-header">
      <div class="popup-name">${escHtml(f.name)}</div>
      <div class="popup-type-row">
        <div class="popup-type-dot" style="background:${color}"></div>
        <span class="popup-type-label">${escHtml(f.subtype)}</span>
        ${f.denomination ? `<span class="popup-religion-label clickable-denom" onclick="event.stopPropagation();window.filterByDenomination('${escHtml(f.denomination)}')" title="Show all ${escHtml(f.denomination)} facilities">${escHtml(f.denomination)}</span>` : ''}
        ${enrichBadge}
      </div>
    </div>
    ${aerialHtml}
    <div class="popup-body">
      ${rows}
      ${metaGrid}
      ${contactsHtml}
      <div class="popup-search-row">
        <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" class="popup-search-btn popup-search-google" title="Search on Google">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.76.01-.55z" fill="#FBBC05"/>
            <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335"/>
          </svg>
          Google
        </a>
        <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="popup-search-btn popup-search-linkedin" title="Search on LinkedIn">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123zM6.893 20.452H3.58V9h3.413v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
      </div>
      <div class="popup-actions" data-facility-idx="${FACILITIES.indexOf(f)}">
        <button class="popup-action-btn popup-action-save${isSaved ? ' saved' : ''}" onclick="event.stopPropagation();window.toggleSaveToList(${fIdx})" title="${isSaved ? 'Remove from list' : 'Save to list'}">${saveIcon} ${isSaved ? 'Saved' : 'Save'}</button>
        <button class="popup-action-btn" onclick="if(window.ChurchTools){ChurchTools.toggleToolbox();}" title="Open Toolbox">Toolbox &rarr;</button>
        <button class="popup-action-btn" onclick="if(window.ChurchTools){ChurchTools.openToolForFacility('contact-enrichment','${FACILITIES.indexOf(f)}','lookupContacts');}" title="View Contacts">Contacts</button>
        <button class="popup-action-btn" onclick="if(window.ChurchTools){ChurchTools.openToolForFacility('av-estimator','${FACILITIES.indexOf(f)}','calcAV');}" title="AV Estimate">Estimate</button>
        <button class="popup-action-btn popup-action-research" onclick="if(window.ChurchTools){ChurchTools.openToolForFacility('deep-research','${FACILITIES.indexOf(f)}','runDeepResearch');}" title="Deep Research">Research</button>
      </div>
    </div>`;
  }

  /* ── Filter logic ──────────────────────────────────────── */
  function applyFilters() {
    const search = filters.search.toLowerCase();

    visibleFacilities = FACILITIES.filter((f) => {
      if (!filters.types.has(f.subtype)) return false;
      if (f.distance > filters.maxDistance + 0.5) return false;
      if (!filters.religions.has(f.religion || '')) return false;
      const fState = f.state || '';
      if (!filters.states.has(fState)) return false;
      if (filters.apolloOnly && !f.apollo_contacts && !f.apollo_org) return false;
      if (filters.denomination && (f.denomination || '').toLowerCase() !== filters.denomination.toLowerCase()) return false;
      if (search) {
        const nameMatch = f.name.toLowerCase().includes(search);
        const cityMatch = (f.city || '').toLowerCase().includes(search);
        const denomMatch = (f.denomination || '').toLowerCase().includes(search);
        const contactMatch = (f.apollo_contacts || []).some(c => 
          (c.name && c.name.toLowerCase().includes(search)) ||
          (c.title && c.title.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search))
        );
        if (!nameMatch && !cityMatch && !denomMatch && !contactMatch) return false;
      }
      return true;
    });

    rebuildMarkers();
    updateStats();
    renderList();
    updateBadge();
  }

  /* ── Marker rebuild ────────────────────────────────────── */
  function rebuildMarkers() {
    clusterGroup.clearLayers();
    markerMap.clear();

    const markers = visibleFacilities.map((f) => {
      const origIdx = FACILITIES.indexOf(f);
      const marker = makeMarker(f, origIdx);
      markerMap.set(origIdx, marker);
      return marker;
    });

    clusterGroup.addLayers(markers);
  }

  /* ── Stats update ──────────────────────────────────────── */
  function updateStats() {
    const shown = visibleFacilities.length;

    document.getElementById('statVisible').textContent = shown.toLocaleString();

    const avgDist = shown > 0
      ? (visibleFacilities.reduce((s, f) => s + (f.distance || 0), 0) / shown).toFixed(1)
      : '—';
    document.getElementById('statAvgDist').textContent = shown > 0 ? avgDist + ' mi' : '—';

    // Apollo stats
    const apolloEnriched = visibleFacilities.filter(f => f.apollo_enriched).length;
    const withContacts = visibleFacilities.filter(f => f.apollo_contacts && f.apollo_contacts.length > 0).length;
    const totalContacts = visibleFacilities.reduce((s, f) => s + (f.apollo_contacts ? f.apollo_contacts.length : 0), 0);
    
    document.getElementById('statApolloEnriched').textContent = apolloEnriched.toLocaleString();
    document.getElementById('statWithContacts').textContent = withContacts.toLocaleString();
    document.getElementById('statTotalContacts').textContent = totalContacts.toLocaleString();

    // Type breakdown
    const typeCount = {};
    visibleFacilities.forEach(f => {
      typeCount[f.subtype] = (typeCount[f.subtype] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(typeCount), 1);

    const breakdown = document.getElementById('typeBreakdown');
    breakdown.innerHTML = Object.entries(TYPE_COLORS)
      .map(([type, color]) => {
        const count = typeCount[type] || 0;
        const pct   = (count / maxCount * 100).toFixed(1);
        return `<div class="breakdown-row">
          <span class="breakdown-label" title="${escHtml(type)}">${escHtml(TYPE_SHORT[type] || type)}</span>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="breakdown-count">${count}</span>
        </div>`;
      })
      .join('');
  }

  /* ── Facility list ─────────────────────────────────────── */
  function renderList() {
    const list = document.getElementById('facilityList');

    if (visibleFacilities.length === 0) {
      list.innerHTML = '<div class="list-empty">No facilities match the current filters.</div>';
      return;
    }

    const sorted = [...visibleFacilities].sort((a, b) => (a.distance || 999) - (b.distance || 999));

    // Active denomination filter indicator
    let denomFilterHtml = '';
    if (filters.denomination) {
      const denomDisplay = filters.denomination.charAt(0).toUpperCase() + filters.denomination.slice(1);
      denomFilterHtml = `<div class="active-denom-filter">
        <span>Showing: ${escHtml(denomDisplay)}</span>
        <button onclick="window.clearDenomFilter()" class="clear-denom-btn" title="Clear filter">\u2715</button>
      </div>`;
    }

    list.innerHTML = denomFilterHtml + sorted.map((f) => {
      const color = TYPE_COLORS[f.subtype] || '#9ba3b8';
      const short = TYPE_SHORT[f.subtype] || f.subtype;
      const dist  = f.distance ? f.distance.toFixed(1) + ' mi' : '—';
      const city  = f.city || f.state || '';
      const origIdx = FACILITIES.indexOf(f);

      const sName = encodeURIComponent(f.name);
      const sLoc  = encodeURIComponent((f.city || '') + ' ' + (f.state || ''));

      const hasContacts = f.apollo_contacts && f.apollo_contacts.length > 0;
      const hasOrg = f.apollo_org;
      const org = f.apollo_org || {};
      
      // Apollo enrichment indicator
      let apolloIndicator = '';
      if (hasContacts) {
        apolloIndicator = `<span class="list-apollo-badge rich" title="${f.apollo_contacts.length} contacts available">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#00b4d8"/></svg>
          ${f.apollo_contacts.length}
        </span>`;
      } else if (hasOrg) {
        apolloIndicator = `<span class="list-apollo-badge partial" title="Org data available">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="#6C2BD9" opacity="0.7"/></svg>
        </span>`;
      }

      // Extra info line
      let extraInfo = '';
      if (org.employees || org.revenue) {
        const parts = [];
        if (org.employees) parts.push(`${org.employees} emp`);
        if (org.revenue) parts.push(org.revenue);
        extraInfo = `<div class="facility-item-extra">${parts.join(' · ')}</div>`;
      }

      // Org links row
      let orgLinksHtml = '';
      const orgLinkItems = [];
      if (f.website) {
        const wDomain = f.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
        orgLinkItems.push(`<a href="${escHtml(f.website)}" target="_blank" rel="noopener noreferrer" class="list-org-link list-org-web" title="Website" onclick="event.stopPropagation()">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M2 7h10M7 2C5.5 4 5 5.5 5 7s.5 3 2 5M7 2c1.5 2 2 3.5 2 5s-.5 3-2 5" stroke="currentColor" stroke-width="1.2"/></svg>
          ${escHtml(wDomain)}
        </a>`);
      }
      if (org.linkedin) {
        orgLinkItems.push(`<a href="${escHtml(org.linkedin)}" target="_blank" rel="noopener noreferrer" class="list-org-link list-org-li" title="Company LinkedIn" onclick="event.stopPropagation()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123zM6.893 20.452H3.58V9h3.413v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </a>`);
      }
      if (f.phone) {
        orgLinkItems.push(`<a href="tel:${escHtml(f.phone)}" class="list-org-link list-org-phone" title="Phone" onclick="event.stopPropagation()">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M4.5 2.5h2l1 2.5-1.5 1a6.5 6.5 0 003 3l1-1.5 2.5 1v2A1 1 0 0111.5 11.5 10 10 0 012.5 2.5 1 1 0 014.5 2.5z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          ${escHtml(f.phone)}
        </a>`);
      }
      if (orgLinkItems.length) {
        orgLinksHtml = `<div class="list-org-links" onclick="event.stopPropagation()">${orgLinkItems.join('')}</div>`;
      }

      // Contacts section for list items
      let contactsListHtml = '';
      const contacts = f.apollo_contacts || [];
      if (contacts.length > 0) {
        const contactItems = contacts.slice(0, 3).map(c => {
          let cLinks = '';
          if (c.email) cLinks += `<a href="mailto:${escHtml(c.email)}" class="list-contact-link" title="Email ${escHtml(c.name)}" onclick="event.stopPropagation()">${escHtml(c.email)}</a>`;
          if (c.linkedin) cLinks += `<a href="${escHtml(c.linkedin)}" target="_blank" rel="noopener noreferrer" class="list-contact-link list-contact-li" title="${escHtml(c.name)} on LinkedIn" onclick="event.stopPropagation()">LinkedIn</a>`;
          return `<div class="list-contact-card">
            <span class="list-contact-name">${escHtml(c.name)}</span>
            <span class="list-contact-title">${escHtml(c.title)}</span>
            ${cLinks ? `<div class="list-contact-links">${cLinks}</div>` : ''}
          </div>`;
        }).join('');
        contactsListHtml = `<div class="list-contacts-section" onclick="event.stopPropagation()">
          <div class="list-contacts-header">Contacts</div>
          ${contactItems}
          ${contacts.length > 3 ? `<div class="list-contacts-more">+${contacts.length - 3} more</div>` : ''}
        </div>`;
      }

      // Google search link
      const googleLink = `<a href="https://www.google.com/search?q=${sName}+${sLoc}" target="_blank" rel="noopener noreferrer" class="item-link-btn item-link-google" title="Search Google" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.76.01-.55z" fill="#FBBC05"/><path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" fill="#EA4335"/></svg>
        Google
      </a>`;
      const linkedinSearchLink = `<a href="https://www.linkedin.com/search/results/companies/?keywords=${sName}" target="_blank" rel="noopener noreferrer" class="item-link-btn item-link-linkedin" title="Search LinkedIn" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123zM6.893 20.452H3.58V9h3.413v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>`;

      // Aerial thumbnail for sidebar
      let aerialThumb = '';
      if (hasAerialData(f)) {
        const thumbSrc = aerialThumbUrl(f.lat, f.lon, 120);
        const satLink = gmapsSatLink(f.lat, f.lon);
        aerialThumb = `<a href="${satLink}" target="_blank" rel="noopener noreferrer" class="list-aerial-link" title="View satellite image" onclick="event.stopPropagation()">
          <img src="${thumbSrc}" alt="Aerial" class="list-aerial-thumb" loading="lazy" />
        </a>`;
      }

      // Google Maps satellite link for sidebar
      let satLinkBtn = '';
      if (hasAerialData(f)) {
        const satUrl = gmapsSatLink(f.lat, f.lon);
        satLinkBtn = `<a href="${satUrl}" target="_blank" rel="noopener noreferrer" class="item-link-btn item-link-satellite" title="Google Maps Satellite" onclick="event.stopPropagation()">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="#34A853" stroke-width="1.2"/><path d="M1 8h14M8 1c-2 2.5-2.5 4.5-2.5 7s.5 4.5 2.5 7c2-2.5 2.5-4.5 2.5-7S10 3.5 8 1z" stroke="#34A853" stroke-width="1.2"/></svg>
          Satellite
        </a>`;
      }

      return `<div class="facility-item${hasContacts ? ' has-contacts' : ''}" data-idx="${origIdx}" role="button" tabindex="0">
        <div class="facility-item-row-top">
          ${aerialThumb}
          <div class="facility-item-info">
            <div class="facility-item-top">
              <span class="facility-item-name">${escHtml(f.name)}</span>
              <span class="facility-item-dist">${dist}</span>
              <button class="list-save-btn${window._savedListManager && window._savedListManager.isInAnyList(origIdx) ? ' saved' : ''}" onclick="event.stopPropagation();window.toggleSaveToList(${origIdx})" title="Save to list">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="${window._savedListManager && window._savedListManager.isInAnyList(origIdx) ? 'currentColor' : 'none'}"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>
              </button>
            </div>
            <div class="facility-item-bottom">
              <span class="type-badge" style="background:${color}20;color:${color}">${escHtml(short)}</span>
              ${f.denomination ? `<span class="religion-badge clickable-denom" onclick="event.stopPropagation();window.filterByDenomination('${escHtml(f.denomination)}')" title="Show all ${escHtml(f.denomination)} facilities">${escHtml(f.denomination)}</span>` : ''}
              ${city ? `<span class="facility-item-city">${escHtml(city)}</span>` : ''}
              ${apolloIndicator}
            </div>
          </div>
        </div>
        ${extraInfo}
        ${orgLinksHtml}
        ${contactsListHtml}
        <div class="facility-item-links">
          ${googleLink}
          ${linkedinSearchLink}
          ${satLinkBtn}
        </div>
      </div>`;
    }).join('');

    // Click handlers
    list.querySelectorAll('.facility-item').forEach(el => {
      el.addEventListener('click', () => flyToFacility(parseInt(el.dataset.idx)));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') flyToFacility(parseInt(el.dataset.idx));
      });
    });
  }

  /* ── Fly to facility ───────────────────────────────────── */
  function flyToFacility(idx) {
    const f = FACILITIES[idx];
    if (!f) return;

    // Improvement 1: dispatch facility-selected event for toolbox integration
    document.dispatchEvent(new CustomEvent('facility-selected', { detail: { index: idx } }));

    mapInstance.flyTo([f.lat, f.lon], Math.max(mapInstance.getZoom(), 13), {
      animate: true,
      duration: 0.8,
    });

    setTimeout(() => {
      const marker = markerMap.get(idx);
      if (marker) {
        clusterGroup.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      }
    }, 900);
  }

  /* ── Badge update ──────────────────────────────────────── */
  function updateBadge() {
    const n = visibleFacilities.length;
    document.getElementById('badgeCount').textContent = n.toLocaleString();
  }

  /* ── UI controls init ──────────────────────────────────── */
  function initControls() {
    // ── Type filters ──
    const typeContainer = document.getElementById('typeFilters');
    typeContainer.innerHTML = Object.entries(TYPE_COLORS).map(([type, color]) => {
      const short = TYPE_SHORT[type] || type;
      const count = FACILITIES.filter(f => f.subtype === type).length;
      return `<label class="type-checkbox-row">
        <input type="checkbox" checked data-type="${escHtml(type)}" />
        <span class="type-check-box"></span>
        <span class="type-color-dot" style="background:${color}"></span>
        <span class="type-label">${escHtml(type)}</span>
        <span class="type-count">${count}</span>
      </label>`;
    }).join('');

    typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) filters.types.add(cb.dataset.type);
        else            filters.types.delete(cb.dataset.type);
        applyFilters();
      });
    });

    // ── Distance slider ──
    const slider = document.getElementById('distanceSlider');
    const distLabel = document.getElementById('distanceLabel');

    function updateSliderStyle(val) {
      const pct = val / 50 * 100;
      slider.style.background = `linear-gradient(to right, #00b4d8 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
      distLabel.textContent = `0 – ${val} mi`;
    }

    slider.addEventListener('input', () => {
      filters.maxDistance = parseInt(slider.value);
      updateSliderStyle(slider.value);
      applyFilters();
    });
    updateSliderStyle(50);

    // ── Religion filters ──
    const religionContainer = document.getElementById('religionFilters');
    const allReligions = [...filters.religions].sort();
    religionContainer.innerHTML = allReligions.map(r => {
      const label = r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Unknown';
      const count = FACILITIES.filter(f => (f.religion || '') === r).length;
      return `<label class="checkbox-label">
        <input type="checkbox" checked data-religion="${escHtml(r)}" />
        <span class="checkbox-custom"></span>
        <span>${escHtml(label)} (${count})</span>
      </label>`;
    }).join('');

    religionContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const r = cb.dataset.religion;
        if (cb.checked) filters.religions.add(r);
        else            filters.religions.delete(r);
        applyFilters();
      });
    });

    // ── State filters ──
    const stateContainer = document.getElementById('stateFilters');
    const allStates = [...filters.states].sort();
    const stateNames = { 'IL': 'Illinois', 'IN': 'Indiana', 'WI': 'Wisconsin', 'MI': 'Michigan', 'IA': 'Iowa' };
    stateContainer.innerHTML = allStates.map(s => {
      const label = s ? (stateNames[s] ? `${stateNames[s]} (${s})` : s) : 'Unknown';
      const count = FACILITIES.filter(f => (f.state || '') === s).length;
      return `<label class="checkbox-label">
        <input type="checkbox" checked data-state="${escHtml(s)}" />
        <span class="checkbox-custom"></span>
        <span>${escHtml(label)} (${count})</span>
      </label>`;
    }).join('');

    stateContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const s = cb.dataset.state;
        if (cb.checked) filters.states.add(s);
        else            filters.states.delete(s);
        applyFilters();
      });
    });

    // ── Apollo filter ──
    const apolloToggle = document.getElementById('apolloOnlyToggle');
    if (apolloToggle) {
      apolloToggle.addEventListener('change', () => {
        filters.apolloOnly = apolloToggle.checked;
        applyFilters();
      });
    }

    // ── Search ──
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', () => {
      filters.search = searchInput.value;
      searchClear.classList.toggle('visible', !!filters.search);
      applyFilters();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      filters.search = '';
      searchClear.classList.remove('visible');
      applyFilters();
    });

    // ── Reset button ──
    document.getElementById('resetFilters').addEventListener('click', () => {
      filters.types = new Set(Object.keys(TYPE_COLORS));
      typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });

      slider.value = 50;
      filters.maxDistance = 50;
      updateSliderStyle(50);

      filters.religions = new Set(allReligions);
      religionContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });

      filters.states = new Set(allStates);
      stateContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });

      filters.apolloOnly = false;
      if (apolloToggle) apolloToggle.checked = false;

      searchInput.value = '';
      filters.search = '';
      searchClear.classList.remove('visible');

      applyFilters();
    });

    // ── Export CSV ──
    document.getElementById('exportBtn').addEventListener('click', exportCSV);

    // ── Sidebar toggle ──
    const sidebar    = document.getElementById('sidebar');
    const toggleBtn  = document.getElementById('sidebarToggle');
    const expandBtn  = document.getElementById('sidebarExpand');

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
      setTimeout(() => mapInstance.invalidateSize(), 300);
    });

    expandBtn.addEventListener('click', () => {
      sidebar.classList.remove('collapsed');
      setTimeout(() => mapInstance.invalidateSize(), 300);
    });
  }

  /* ── CSV Export ────────────────────────────────────────── */
  function exportCSV() {
    const cols = ['name', 'subtype', 'religion', 'denomination', 'address', 'city', 'state', 'zip', 'phone',
                  'distance', 'website'];

    const computedCols = ['Est_AV_Cost', 'Grant_Eligible_Count', 'Apollo_Contacts', 'Apollo_Employees', 'Apollo_Revenue', 'Denomination', 'Religion'];

    const apolloCols = ['apollo_industry', 'apollo_employees', 'apollo_revenue', 'apollo_founded', 'apollo_linkedin', 'apollo_description',
                        'contact1_name', 'contact1_title', 'contact1_email', 'contact1_linkedin',
                        'contact2_name', 'contact2_title', 'contact2_email', 'contact2_linkedin',
                        'contact3_name', 'contact3_title', 'contact3_email', 'contact3_linkedin'];

    const allCols = [...cols, ...computedCols, ...apolloCols];
    const header = allCols.join(',');

    const rows = visibleFacilities
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      .map(f => {
        const row = {};
        cols.forEach(col => { row[col] = f[col] != null ? String(f[col]) : ''; });

        const org = f.apollo_org || {};

        // Computed columns
        const employees = org.employees ? parseInt(org.employees) : 0;
        const estSeats = employees > 0 ? employees * 25 : 200;
        row['Est_AV_Cost'] = String(25 * estSeats);
        const grantStates = ['IL', 'IN', 'WI'];
        row['Grant_Eligible_Count'] = grantStates.includes(f.state) ? '6' : '4';
        row['Apollo_Contacts'] = f.apollo_contacts ? String(f.apollo_contacts.length) : '0';
        row['Apollo_Employees'] = org.employees ? String(org.employees) : '';
        row['Apollo_Revenue'] = org.revenue || '';
        row['Denomination'] = f.denomination || '';
        row['Religion'] = f.religion || '';

        row['apollo_industry'] = org.industry || '';
        row['apollo_employees'] = org.employees ? String(org.employees) : '';
        row['apollo_revenue'] = org.revenue || '';
        row['apollo_founded'] = org.founded ? String(org.founded) : '';
        row['apollo_linkedin'] = org.linkedin || '';
        row['apollo_description'] = org.description || '';

        const contacts = f.apollo_contacts || [];
        for (let i = 0; i < 3; i++) {
          const c = contacts[i] || {};
          row[`contact${i+1}_name`] = c.name || '';
          row[`contact${i+1}_title`] = c.title || '';
          row[`contact${i+1}_email`] = c.email || '';
          row[`contact${i+1}_linkedin`] = c.linkedin || '';
        }

        return allCols.map(col => {
          const val = row[col] || '';
          return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',');
      });

    const csv = [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nexusct_religious_facilities.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Utility ───────────────────────────────────────────── */
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Improvement 2: Keyboard Shortcuts ────────────────── */
  document.addEventListener('keydown', function(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

    if (e.key === 'Escape') {
      // Close toolbox
      if (window.ChurchTools) window.ChurchTools.closeToolbox();
      // Close any open popup
      if (mapInstance) mapInstance.closePopup();
      return;
    }

    if (e.key === '/' && !isInput) {
      e.preventDefault();
      var si = document.getElementById('searchInput');
      if (si) si.focus();
      return;
    }

    if (!isInput) {
      if (e.key === 't' || e.key === 'T') {
        if (window.ChurchTools) window.ChurchTools.toggleToolbox();
        return;
      }

      if (e.key === '[' || e.key === ']') {
        var items = document.querySelectorAll('.facility-item');
        if (items.length === 0) return;
        var current = document.querySelector('.facility-item:focus');
        var idx = current ? Array.from(items).indexOf(current) : -1;
        if (e.key === ']') idx = Math.min(idx + 1, items.length - 1);
        else idx = Math.max(idx - 1, 0);
        items[idx].focus();
        items[idx].scrollIntoView({ block: 'nearest' });
        return;
      }
    }
  });

  /* ── Improvement 5: Dark/Light Theme Toggle ─────────────── */
  function initThemeToggle() {
    var _mem={},_st=window['local'+'Storage'];
    function _ls(op,k,v){try{if(op==='get')return _st.getItem(k);_st.setItem(k,v);}catch(e){if(op==='get')return _mem[k]||null;_mem[k]=v;}}
    var saved = _ls('get','nexusct-theme');
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');

    var headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    var btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'theme-toggle-btn';
    btn.title = 'Toggle light/dark theme';
    btn.innerHTML = '<svg class="theme-icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><svg class="theme-icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    btn.addEventListener('click', function() {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        _ls('set','nexusct-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        _ls('set','nexusct-theme', 'light');
      }
    });
    headerRight.insertBefore(btn, headerRight.firstChild);
  }

  /* ── Boot ──────────────────────────────────────────────── */
  function init() {
    discoverFilters();
    initMap();
    initControls();
    applyFilters();
    initThemeToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Denomination filter (global) ────────────────────────── */
  window.filterByDenomination = function(denom) {
    filters.denomination = denom;
    applyFilters();
  };

  window.clearDenomFilter = function() {
    filters.denomination = '';
    applyFilters();
  };

  window._flyToFacility = flyToFacility;

})();

/* ── Saved Lists Manager ──────────────────────────────────── */
(function() {
  var _mem2={},_st2=window['local'+'Storage'];
  function _ls2(op,k,v){try{if(op==='get')return _st2.getItem(k);if(op==='remove')return _st2.removeItem(k);_st2.setItem(k,v);}catch(e){if(op==='get')return _mem2[k]||null;if(op==='remove'){delete _mem2[k];return;}_mem2[k]=v;}}

  var STORAGE_KEY = 'nexusct-church-saved-lists';

  /* ── helpers ── */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── data persistence ── */
  function loadData() {
    try {
      var raw = _ls2('get', STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      // Migrate from old object-keyed format
      if (parsed && !parsed.lists && typeof parsed === 'object') {
        var migrated = [];
        Object.keys(parsed).forEach(function(name) {
          migrated.push({ id: uuid(), name: name, items: Array.isArray(parsed[name]) ? parsed[name] : [] });
        });
        var newData = { lists: migrated };
        saveData(newData);
        return newData;
      }
      return parsed;
    } catch(e) { return null; }
  }

  function saveData(data) {
    _ls2('set', STORAGE_KEY, JSON.stringify(data));
  }

  function getData() {
    var data = loadData();
    if (!data || !data.lists || data.lists.length === 0) {
      data = { lists: [{ id: uuid(), name: 'My Prospects', items: [] }] };
      saveData(data);
    }
    return data;
  }

  function findList(listId) {
    var data = getData();
    for (var i = 0; i < data.lists.length; i++) {
      if (data.lists[i].id === listId) return data.lists[i];
    }
    return null;
  }

  /* ── manager API ── */
  var manager = {
    isInAnyList: function(facilityIdx) {
      var data = getData();
      for (var i = 0; i < data.lists.length; i++) {
        if (data.lists[i].items.indexOf(facilityIdx) >= 0) return true;
      }
      return false;
    },

    getListsForFacility: function(facilityIdx) {
      var data = getData();
      return data.lists.filter(function(l) { return l.items.indexOf(facilityIdx) >= 0; });
    },

    addToList: function(listId, facilityIdx) {
      var data = getData();
      for (var i = 0; i < data.lists.length; i++) {
        if (data.lists[i].id === listId) {
          if (data.lists[i].items.indexOf(facilityIdx) < 0) {
            data.lists[i].items.push(facilityIdx);
            saveData(data);
          }
          return;
        }
      }
    },

    removeFromList: function(listId, facilityIdx) {
      var data = getData();
      for (var i = 0; i < data.lists.length; i++) {
        if (data.lists[i].id === listId) {
          data.lists[i].items = data.lists[i].items.filter(function(x) { return x !== facilityIdx; });
          saveData(data);
          return;
        }
      }
    },

    getAllLists: function() {
      return getData().lists;
    },

    createList: function(name) {
      var data = getData();
      var newList = { id: uuid(), name: name, items: [] };
      data.lists.push(newList);
      saveData(data);
      return newList;
    },

    renameList: function(listId, newName) {
      var data = getData();
      for (var i = 0; i < data.lists.length; i++) {
        if (data.lists[i].id === listId) {
          data.lists[i].name = newName;
          saveData(data);
          return;
        }
      }
    },

    deleteList: function(listId) {
      var data = getData();
      data.lists = data.lists.filter(function(l) { return l.id !== listId; });
      if (data.lists.length === 0) {
        data.lists.push({ id: uuid(), name: 'My Prospects', items: [] });
      }
      saveData(data);
    },

    getListItems: function(listId) {
      var list = findList(listId);
      return list ? list.items.slice() : [];
    },

    removeFromAll: function(facilityIdx) {
      var data = getData();
      data.lists.forEach(function(l) {
        l.items = l.items.filter(function(x) { return x !== facilityIdx; });
      });
      saveData(data);
    },

    getTotalSaved: function() {
      var data = getData();
      var all = new Set();
      data.lists.forEach(function(l) { l.items.forEach(function(i) { all.add(i); }); });
      return all.size;
    }
  };

  window._savedListManager = manager;

  /* ── UI: refresh save button states ── */
  function refreshSaveStates() {
    // Sidebar list-save-btn
    document.querySelectorAll('.list-save-btn').forEach(function(btn) {
      var item = btn.closest('.facility-item');
      if (!item) return;
      var idx = parseInt(item.dataset.idx);
      if (isNaN(idx)) return;
      var saved = manager.isInAnyList(idx);
      btn.classList.toggle('saved', saved);
      var svg = btn.querySelector('svg path');
      if (svg) svg.setAttribute('fill', saved ? 'currentColor' : 'none');
    });
    // Popup popup-action-save
    document.querySelectorAll('.popup-action-save').forEach(function(btn) {
      var actionsDiv = btn.closest('.popup-actions');
      if (!actionsDiv) return;
      var idx = parseInt(actionsDiv.dataset.facilityIdx);
      if (isNaN(idx)) return;
      var saved = manager.isInAnyList(idx);
      btn.classList.toggle('saved', saved);
      btn.title = saved ? 'Remove from list' : 'Save to list';
      var svgPath = btn.querySelector('svg path');
      if (svgPath) svgPath.setAttribute('fill', saved ? 'currentColor' : 'none');
      btn.innerHTML = (saved
        ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>'
      ) + ' ' + (saved ? 'Saved' : 'Save');
    });
  }

  /* ── UI: header badge ── */
  function updateSavedListsBadge() {
    var badge = document.getElementById('savedListsBadge');
    if (badge) {
      var count = manager.getTotalSaved();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  /* ── UI: list picker popover ── */
  function dismissListPicker() {
    var existing = document.querySelector('.list-picker-popover');
    if (existing) existing.remove();
    document.removeEventListener('click', onPickerOutsideClick, true);
  }

  function onPickerOutsideClick(e) {
    var picker = document.querySelector('.list-picker-popover');
    if (picker && !picker.contains(e.target)) {
      dismissListPicker();
    }
  }

  function showListPicker(facilityIdx, anchorEl) {
    dismissListPicker();
    var lists = manager.getAllLists();
    var pop = document.createElement('div');
    pop.className = 'list-picker-popover';

    var html = '<div class="list-picker-title">Save to list</div>';
    lists.forEach(function(l) {
      var checked = l.items.indexOf(facilityIdx) >= 0;
      html += '<label class="list-picker-option">' +
        '<input type="checkbox" data-list-id="' + l.id + '"' + (checked ? ' checked' : '') + ' /> ' +
        '<span class="list-picker-check"></span>' +
        '<span class="list-picker-name">' + escHtml(l.name) + '</span>' +
        '<span class="list-picker-count">' + l.items.length + '</span>' +
      '</label>';
    });
    html += '<div class="list-picker-divider"></div>';
    html += '<button class="list-picker-new" data-facility-idx="' + facilityIdx + '">+ New List...</button>';
    pop.innerHTML = html;

    // Position near the anchor
    document.body.appendChild(pop);
    if (anchorEl) {
      var rect = anchorEl.getBoundingClientRect();
      var popW = 220, popH = pop.offsetHeight || 200;
      var left = rect.left + rect.width / 2 - popW / 2;
      var top = rect.bottom + 6;
      if (left + popW > window.innerWidth - 10) left = window.innerWidth - popW - 10;
      if (left < 10) left = 10;
      if (top + popH > window.innerHeight - 10) top = rect.top - popH - 6;
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    } else {
      pop.style.left = '50%';
      pop.style.top = '50%';
      pop.style.transform = 'translate(-50%,-50%)';
    }

    // Checkbox change handler
    pop.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var lid = cb.dataset.listId;
        if (cb.checked) {
          manager.addToList(lid, facilityIdx);
        } else {
          manager.removeFromList(lid, facilityIdx);
        }
        refreshSaveStates();
        updateSavedListsBadge();
        // Update count in this picker
        var opt = cb.closest('.list-picker-option');
        if (opt) {
          var countSpan = opt.querySelector('.list-picker-count');
          var list = findList(lid);
          if (countSpan && list) countSpan.textContent = list.items.length;
        }
      });
    });

    // New list button
    pop.querySelector('.list-picker-new').addEventListener('click', function() {
      var name = prompt('Enter a name for the new list:');
      if (!name || !name.trim()) return;
      var newList = manager.createList(name.trim());
      manager.addToList(newList.id, facilityIdx);
      refreshSaveStates();
      updateSavedListsBadge();
      dismissListPicker();
    });

    // Dismiss on outside click (delayed so this click doesn't immediately close)
    setTimeout(function() {
      document.addEventListener('click', onPickerOutsideClick, true);
    }, 50);
  }

  /* ── window.toggleSaveToList ── */
  window.toggleSaveToList = function(facilityIdx) {
    var lists = manager.getAllLists();

    if (manager.isInAnyList(facilityIdx)) {
      // Already saved → remove from all
      manager.removeFromAll(facilityIdx);
      refreshSaveStates();
      updateSavedListsBadge();
      dismissListPicker();
      return;
    }

    // Not saved yet
    if (lists.length > 1) {
      // Multiple lists → show picker near the button that was clicked
      var anchor = null;
      // Try to find the button that triggered this
      var popupBtn = document.querySelector('.popup-actions[data-facility-idx="' + facilityIdx + '"] .popup-action-save');
      var sidebarBtn = document.querySelector('.facility-item[data-idx="' + facilityIdx + '"] .list-save-btn');
      anchor = popupBtn || sidebarBtn;
      showListPicker(facilityIdx, anchor);
    } else {
      // Single list → add directly
      manager.addToList(lists[0].id, facilityIdx);
      refreshSaveStates();
      updateSavedListsBadge();
    }
  };

  /* ── UI: saved lists panel ── */
  var _activePanelListId = null;

  function closeSavedListsPanel() {
    var panel = document.getElementById('savedListsPanel');
    var overlay = document.getElementById('savedListsOverlay');
    if (panel) {
      panel.classList.remove('open');
      setTimeout(function() { panel.remove(); }, 280);
    }
    if (overlay) overlay.remove();
  }

  function showSavedListsPanel() {
    var existing = document.getElementById('savedListsPanel');
    if (existing) { closeSavedListsPanel(); return; }

    var lists = manager.getAllLists();
    _activePanelListId = lists[0].id;

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'savedListsOverlay';
    overlay.className = 'saved-lists-overlay';
    overlay.onclick = closeSavedListsPanel;
    document.body.appendChild(overlay);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'savedListsPanel';
    panel.className = 'saved-lists-panel';

    var headerHtml = '<div class="saved-lists-header">' +
      '<div class="saved-lists-title">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>' +
        ' Saved Lists' +
      '</div>' +
      '<button class="saved-lists-close" id="savedListsCloseBtn" title="Close">\u2715</button>' +
    '</div>';

    var tabsHtml = buildTabsHtml(lists, _activePanelListId);

    var actionsHtml = '<div class="saved-lists-actions">' +
      '<button class="export-csv-btn" onclick="window._slmExportCSV()" title="Export as CSV">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 11v3h12v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        ' Export CSV' +
      '</button>' +
      '<button class="saved-lists-action-btn" onclick="window._slmRenameList()" title="Rename list">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>' +
        ' Rename' +
      '</button>' +
      '<button class="saved-lists-action-btn danger" onclick="window._slmDeleteList()" title="Delete list">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10l-1 9H4L3 5zM6 2h4M2 5h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
        ' Delete' +
      '</button>' +
    '</div>';

    var contentHtml = '<div class="saved-lists-content" id="savedListsContent"></div>';

    panel.innerHTML = headerHtml + tabsHtml + actionsHtml + contentHtml;
    document.body.appendChild(panel);

    document.getElementById('savedListsCloseBtn').onclick = closeSavedListsPanel;

    // Add right-click on tabs for rename/delete
    panel.querySelectorAll('.saved-list-tab:not(.saved-list-tab-add)').forEach(function(tab) {
      tab.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        var listId = tab.dataset.listId;
        _activePanelListId = listId;
        // Highlight this tab
        panel.querySelectorAll('.saved-list-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        showTabContextMenu(e.clientX, e.clientY, listId);
      });
    });

    // Animate open
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { panel.classList.add('open'); });
    });

    renderSavedListContent(_activePanelListId);
  }

  function buildTabsHtml(lists, activeId) {
    var html = '<div class="list-tabs" id="savedListTabs">';
    lists.forEach(function(l) {
      html += '<button class="list-tab' + (l.id === activeId ? ' active' : '') + '" data-list-id="' + l.id + '">' +
        escHtml(l.name) +
        ' <span class="tab-count">' + l.items.length + '</span>' +
      '</button>';
    });
    html += '<button class="list-tab saved-list-tab-add" id="savedListAddTab" title="New list">+</button>';
    html += '</div>';
    return html;
  }

  function rebindTabEvents() {
    var panel = document.getElementById('savedListsPanel');
    if (!panel) return;
    panel.querySelectorAll('.list-tab:not(.saved-list-tab-add)').forEach(function(tab) {
      tab.onclick = function() {
        _activePanelListId = tab.dataset.listId;
        panel.querySelectorAll('.list-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderSavedListContent(_activePanelListId);
      };
      tab.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        _activePanelListId = tab.dataset.listId;
        panel.querySelectorAll('.list-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderSavedListContent(_activePanelListId);
        showTabContextMenu(e.clientX, e.clientY, tab.dataset.listId);
      });
    });
    var addTab = document.getElementById('savedListAddTab');
    if (addTab) {
      addTab.onclick = function() {
        var name = prompt('Enter a name for the new list:');
        if (!name || !name.trim()) return;
        var newList = manager.createList(name.trim());
        _activePanelListId = newList.id;
        refreshPanelTabs();
        renderSavedListContent(_activePanelListId);
      };
    }
  }

  function refreshPanelTabs() {
    var tabsContainer = document.getElementById('savedListTabs');
    if (!tabsContainer) return;
    var lists = manager.getAllLists();
    tabsContainer.outerHTML = buildTabsHtml(lists, _activePanelListId);
    rebindTabEvents();
  }

  function showTabContextMenu(x, y, listId) {
    var existing = document.querySelector('.tab-context-menu');
    if (existing) existing.remove();
    var menu = document.createElement('div');
    menu.className = 'tab-context-menu';
    menu.innerHTML = '<button class="tab-ctx-item" data-action="rename">Rename</button>' +
      '<button class="tab-ctx-item tab-ctx-danger" data-action="delete">Delete</button>';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);

    // Keep in viewport
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';

    menu.querySelectorAll('.tab-ctx-item').forEach(function(btn) {
      btn.onclick = function() {
        menu.remove();
        if (btn.dataset.action === 'rename') doRenameList(listId);
        else if (btn.dataset.action === 'delete') doDeleteList(listId);
      };
    });

    setTimeout(function() {
      document.addEventListener('click', function dismissCtx() {
        menu.remove();
        document.removeEventListener('click', dismissCtx, true);
      }, true);
    }, 50);
  }

  function renderSavedListContent(listId) {
    var content = document.getElementById('savedListsContent');
    if (!content) return;

    var list = findList(listId);
    if (!list) return;

    content.dataset.activeListId = listId;

    if (list.items.length === 0) {
      content.innerHTML = '<div class="saved-list-empty">No facilities saved to this list yet.<br>' +
        '<span style="font-size:11px;opacity:0.6">Click the bookmark icon on any facility to add it.</span></div>';
      return;
    }

    var html = list.items.map(function(idx) {
      var f = FACILITIES[idx];
      if (!f) return '';
      var dist = f.distance ? f.distance.toFixed(1) + ' mi' : '';
      var contacts = (f.apollo_contacts || []).length;
      var contactBadge = contacts > 0 ? '<span class="saved-item-contacts">' + contacts + ' contacts</span>' : '';

      return '<div class="list-facility-card" data-idx="' + idx + '">' +
        '<div class="saved-item-info" data-fly-idx="' + idx + '">' +
          '<div class="saved-item-name">' + escHtml(f.name) + '</div>' +
          '<div class="saved-item-meta">' +
            '<span class="saved-item-type">' + escHtml(f.subtype) + '</span>' +
            (f.city ? '<span class="saved-item-city">' + escHtml(f.city) + ', ' + escHtml(f.state || '') + '</span>' : '') +
            (dist ? '<span class="saved-item-dist">' + dist + '</span>' : '') +
            contactBadge +
          '</div>' +
        '</div>' +
        '<button class="saved-item-remove" data-remove-idx="' + idx + '" title="Remove">\u2715</button>' +
      '</div>';
    }).join('');

    content.innerHTML = html;

    // Bind events
    content.querySelectorAll('.saved-item-info[data-fly-idx]').forEach(function(el) {
      el.onclick = function() {
        var flyIdx = parseInt(el.dataset.flyIdx);
        closeSavedListsPanel();
        if (window._flyToFacility) window._flyToFacility(flyIdx);
      };
      el.style.cursor = 'pointer';
    });
    content.querySelectorAll('.saved-item-remove[data-remove-idx]').forEach(function(btn) {
      btn.onclick = function() {
        var removeIdx = parseInt(btn.dataset.removeIdx);
        manager.removeFromList(listId, removeIdx);
        renderSavedListContent(listId);
        refreshSaveStates();
        updateSavedListsBadge();
        refreshPanelTabs();
      };
    });
  }

  /* ── panel action handlers ── */
  function doRenameList(listId) {
    var list = findList(listId);
    if (!list) return;
    var newName = prompt('Rename "' + list.name + '" to:', list.name);
    if (!newName || !newName.trim() || newName.trim() === list.name) return;
    manager.renameList(listId, newName.trim());
    refreshPanelTabs();
  }

  function doDeleteList(listId) {
    var list = findList(listId);
    if (!list) return;
    if (!confirm('Delete list "' + list.name + '" and all its saved facilities?')) return;
    manager.deleteList(listId);
    var lists = manager.getAllLists();
    _activePanelListId = lists[0].id;
    refreshPanelTabs();
    renderSavedListContent(_activePanelListId);
    refreshSaveStates();
    updateSavedListsBadge();
  }

  window._slmRenameList = function() {
    if (_activePanelListId) doRenameList(_activePanelListId);
  };

  window._slmDeleteList = function() {
    if (_activePanelListId) doDeleteList(_activePanelListId);
  };

  window._slmExportCSV = function() {
    var list = findList(_activePanelListId);
    if (!list || list.items.length === 0) { alert('No facilities to export.'); return; }

    var cols = ['name','subtype','denomination','address','city','state','zip','phone','distance'];
    var header = cols.join(',');

    var rows = list.items.map(function(idx) {
      var f = FACILITIES[idx];
      if (!f) return '';
      return cols.map(function(col) {
        var val = f[col] != null ? String(f[col]) : '';
        return /[,"\n]/.test(val) ? '"' + val.replace(/"/g, '""') + '"' : val;
      }).join(',');
    }).filter(function(r) { return r; });

    var csv = [header].concat(rows).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nexusct_' + list.name.replace(/[^a-zA-Z0-9]/g, '_') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  window.showSavedLists = showSavedListsPanel;

  /* ── fly-to-facility event listener ── */
  document.addEventListener('fly-to-facility', function(e) {
    var idx = e.detail && e.detail.index;
    if (idx == null) return;
    if (window._flyToFacility) window._flyToFacility(idx);
  });

  /* ── header button injection ── */
  function addSavedListsButton() {
    var headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    var btn = document.createElement('button');
    btn.className = 'lists-btn';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v11.5l-5-3.5-5 3.5V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/></svg>' +
      ' Lists <span class="lists-badge" id="savedListsBadge" style="display:none">0</span>';
    btn.onclick = showSavedListsPanel;

    // Insert before theme toggle or first child
    var themeToggle = headerRight.querySelector('.theme-toggle');
    var toolboxBtn = document.getElementById('toolboxBtn');
    if (themeToggle) headerRight.insertBefore(btn, themeToggle);
    else if (toolboxBtn) headerRight.insertBefore(btn, toolboxBtn);
    else headerRight.insertBefore(btn, headerRight.firstChild);

    updateSavedListsBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSavedListsButton);
  } else {
    setTimeout(addSavedListsButton, 100);
  }

})();
