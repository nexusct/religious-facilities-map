/* ════════════════════════════════════════════════════════════
   NexusCT — Religious Facilities Toolbox
   10 Sales Prospecting & Intelligence Tools
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── NexusCT AV / ICT Pricing Data ─────────────────────── */
  const AV_PRICING = {
    basic: { name: 'Basic Sound System', desc: 'Amplifier, 4 speakers, 2 wireless mics', base: 8500, perSeat: 12 },
    standard: { name: 'Standard AV Package', desc: 'Mixer, 8 speakers, projector, screen, mics', base: 22000, perSeat: 25 },
    premium: { name: 'Premium AV Suite', desc: 'Digital mixer, line array, dual projectors, PTZ camera, streaming', base: 55000, perSeat: 48 },
    broadcast: { name: 'Broadcast Studio', desc: 'Multi-camera, live switching, streaming, LED wall', base: 120000, perSeat: 85 },
  };

  const SECURITY_PRICING = {
    basic: { name: 'Basic Security', desc: '4 cameras, NVR, door sensor', base: 4500, perDoor: 350 },
    standard: { name: 'Standard Security', desc: '8 cameras, access control, alarm panel', base: 12000, perDoor: 550 },
    premium: { name: 'Premium Security', desc: '16+ cameras, biometric access, mass notification', base: 28000, perDoor: 850 },
  };

  const NETWORKING = {
    uaas: { perAP: 35, perCamera: 25, perDoor: 45 },
    capex: { ap: 450, switch: 1200, firewall: 800 },
  };

  const GRANT_PROGRAMS = [
    { name: 'FEMA Nonprofit Security Grant (NSGP)', type: 'Federal', match: f => true, maxAmount: '$150,000', eligibility: 'Nonprofits at risk of terrorist attack; houses of worship qualify', url: 'https://www.fema.gov/grants/preparedness/nonprofit-security' },
    { name: 'USDA Community Facilities Grant', type: 'Federal', match: f => true, maxAmount: '$100,000', eligibility: 'Rural communities under 20,000 population for essential facilities', url: 'https://www.rd.usda.gov/programs-services/community-facilities' },
    { name: 'Illinois Nonprofit Security Grant', type: 'State - IL', match: f => f.state === 'IL', maxAmount: '$100,000', eligibility: 'IL nonprofits for security improvements, cameras, access control', url: 'https://www2.illinois.gov/iema/' },
    { name: 'Indiana Secured School Safety Grant', type: 'State - IN', match: f => f.state === 'IN', maxAmount: '$50,000', eligibility: 'Indiana facilities with schools/daycares for safety upgrades', url: 'https://www.in.gov/dhs/' },
    { name: 'Wisconsin DOJ Security Grant', type: 'State - WI', match: f => f.state === 'WI', maxAmount: '$75,000', eligibility: 'WI nonprofits for security enhancements and threat assessments', url: 'https://www.doj.state.wi.us/' },
    { name: 'FCC E-Rate Program', type: 'Federal', match: f => true, maxAmount: '20-90% discount', eligibility: 'Schools and libraries (many churches with schools qualify) for telecom/internet', url: 'https://www.usac.org/e-rate/' },
    { name: 'Lilly Endowment (Indiana)', type: 'Foundation', match: f => f.state === 'IN', maxAmount: 'Varies', eligibility: 'Indiana faith-based organizations for facilities & technology', url: 'https://lillyendowment.org/' },
    { name: 'Community Foundation Grants', type: 'Foundation', match: f => true, maxAmount: '$25,000-100,000', eligibility: 'Local community foundations often fund technology upgrades for nonprofits', url: '' },
  ];

  /* ── Tool Definitions ──────────────────────────────────── */
  const TOOLS = [
    {
      id: 'av-estimator',
      name: 'AV System Estimator',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M6 16h6M9 13v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="9" cy="8.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>`,
      desc: 'Estimate audio, video, and live streaming system costs',
      color: '#22c55e',
    },
    {
      id: 'grant-finder',
      name: 'Grant & Subsidy Finder',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L11.5 7.5H16L12.5 10.5L14 16L9 13L4 16L5.5 10.5L2 7.5H6.5L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
      desc: 'Find federal, state, and foundation grants for nonprofits',
      color: '#f59e0b',
    },
    {
      id: 'denomination-hierarchy',
      name: 'Denomination Hierarchy',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="13" r="2" stroke="currentColor" stroke-width="1.2"/><circle cx="14" cy="13" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M9 6.5V9M9 9L4 11M9 9L14 11" stroke="currentColor" stroke-width="1.2"/></svg>`,
      desc: 'Explore denomination structures and parent organization networks',
      color: '#f97316',
    },
    {
      id: 'financial-990',
      name: '990 Financial Lookup',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 7h14" stroke="currentColor" stroke-width="1.4"/><path d="M5 10h3M5 12h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      desc: 'Access IRS Form 990 data for nonprofit financial transparency',
      color: '#3b82f6',
    },
    {
      id: 'building-assessment',
      name: 'Building Assessment',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 15V7l6-4 6 4v8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><rect x="7" y="10" width="4" height="5" stroke="currentColor" stroke-width="1.2"/><path d="M3 15h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      desc: 'Assess building technology readiness and infrastructure needs',
      color: '#8b5cf6',
    },
    {
      id: 'congregation-estimator',
      name: 'Congregation Estimator',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="5" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="5" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="9" cy="12" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 9c0-1.5 1-2.5 2-2.5M14 9c0-1.5-1-2.5-2-2.5M7 15c0-1.5 1-2.5 2-2.5" stroke="currentColor" stroke-width="1.1"/></svg>`,
      desc: 'Estimate congregation size from Apollo data and facility type',
      color: '#06b6d4',
    },
    {
      id: 'tech-readiness',
      name: 'Tech Readiness Scorer',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v2M14.5 5L13 6.5M16 9h-2M14.5 13L13 11.5M9 16v-2M3.5 13L5 11.5M2 9h2M3.5 5L5 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
      desc: 'Score a facility\'s technology maturity and upgrade potential',
      color: '#ec4899',
    },
    {
      id: 'security-estimator',
      name: 'Security System Estimator',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v4.5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 9l2 2 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      desc: 'Estimate security cameras, access control, and monitoring costs',
      color: '#ef4444',
    },
    {
      id: 'contact-enrichment',
      name: 'Contact Enrichment',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M2 15c0-3 2.5-5 5-5s5 2 5 5" stroke="currentColor" stroke-width="1.4"/><path d="M13 8l2 2 3-3" stroke="#22c55e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      desc: 'View Apollo.io enriched contacts for facility outreach',
      color: '#00b4d8',
    },
    {
      id: 'outreach-generator',
      name: 'Outreach Generator',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.4"/><path d="M2 4l7 5 7-5" stroke="currentColor" stroke-width="1.4"/></svg>`,
      desc: 'Generate personalized outreach based on facility profile',
      color: '#a78bfa',
    },
  ];

  /* ── Utility ────────────────────────────────────────────── */
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmt(n) { return n.toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function fmtCurrency(n) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function getFacilities() { return typeof FACILITIES !== 'undefined' ? FACILITIES : []; }
  function getSelectedFacility() {
    const sel = document.getElementById('toolFacilitySelect');
    if (!sel || !sel.value) return null;
    return getFacilities()[parseInt(sel.value)] || null;
  }

  function facilitySelector(id, label) {
    const facilities = getFacilities();
    const sorted = facilities.map((f, i) => ({ ...f, _idx: i })).sort((a, b) => (a.distance || 999) - (b.distance || 999));
    const options = sorted.map(f => {
      const dist = f.distance ? ` (${f.distance.toFixed(1)} mi)` : '';
      return `<option value="${f._idx}">${escHtml(f.name)}${dist}</option>`;
    }).join('');
    return `<div class="tool-field">
      <label class="tool-label">${escHtml(label || 'Select Facility')}</label>
      <select id="${id}" class="tool-select">
        <option value="">— Choose a facility —</option>
        ${options}
      </select>
    </div>`;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 1: AV System Estimator
     ══════════════════════════════════════════════════════════ */
  function renderAVEstimator() {
    return `
      <div class="tool-intro">Estimate audio/video system costs based on sanctuary size, streaming needs, and technology goals.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <div class="tool-field">
        <label class="tool-label">AV Package Level</label>
        <select id="avPackage" class="tool-select">
          <option value="basic">Basic Sound System — Mics + Speakers</option>
          <option value="standard" selected>Standard AV — Sound + Projection</option>
          <option value="premium">Premium AV Suite — Full A/V + Streaming</option>
          <option value="broadcast">Broadcast Studio — Multi-Camera Production</option>
        </select>
      </div>
      <div class="tool-field">
        <label class="tool-label">Estimated Seating Capacity</label>
        <input type="number" id="avSeats" class="tool-input" placeholder="e.g. 300" min="50" max="10000" value="300" />
      </div>
      <div class="tool-field">
        <label class="tool-label">Add-Ons</label>
        <div class="tool-checkbox-row">
          <label class="tool-check"><input type="checkbox" id="avStream" checked /> Live Streaming Setup <span class="tool-hint">(+$4,500)</span></label>
          <label class="tool-check"><input type="checkbox" id="avNetwork" /> Network Infrastructure <span class="tool-hint">(Wi-Fi + switching)</span></label>
          <label class="tool-check"><input type="checkbox" id="avDigSign" /> Digital Signage <span class="tool-hint">(+$2,800)</span></label>
        </div>
      </div>
      <button class="tool-btn" onclick="ChurchTools.calcAV()">Calculate Estimate</button>
      <div id="avResult" class="tool-result"></div>`;
  }

  function calcAV() {
    const f = getSelectedFacility();
    const pkg = AV_PRICING[document.getElementById('avPackage').value];
    const seats = parseInt(document.getElementById('avSeats').value) || 300;
    const addStream = document.getElementById('avStream').checked;
    const addNetwork = document.getElementById('avNetwork').checked;
    const addSign = document.getElementById('avDigSign').checked;

    let total = pkg.base + (seats * pkg.perSeat);
    let addons = 0;
    if (addStream) addons += 4500;
    if (addSign) addons += 2800;

    let networkCost = 0;
    if (addNetwork) {
      const aps = Math.ceil(seats / 75);
      networkCost = (aps * NETWORKING.capex.ap) + NETWORKING.capex.switch + NETWORKING.capex.firewall;
    }

    const grandTotal = total + addons + networkCost;
    const uaasMo = addNetwork ? Math.ceil(seats / 75) * NETWORKING.uaas.perAP : 0;

    let html = `<div class="result-header">${f ? escHtml(f.name) : 'AV Estimate'}</div>`;
    html += `<div class="result-subtitle">${seats} seats · ${escHtml(pkg.name)}</div>`;
    html += `<div class="result-grid">
      <div class="result-card accent"><div class="result-card-label">Total Project Cost</div><div class="result-card-value">${fmtCurrency(grandTotal)}</div></div>
      <div class="result-card"><div class="result-card-label">AV Package</div><div class="result-card-value">${fmtCurrency(total)}</div></div>
      <div class="result-card"><div class="result-card-label">Add-Ons</div><div class="result-card-value">${fmtCurrency(addons)}</div></div>
      <div class="result-card"><div class="result-card-label">Network Infra</div><div class="result-card-value">${networkCost ? fmtCurrency(networkCost) : '—'}</div></div>
      <div class="result-card"><div class="result-card-label">Per Seat Cost</div><div class="result-card-value">${fmtCurrency(Math.round(grandTotal / seats))}</div></div>
      <div class="result-card"><div class="result-card-label">UaaS Monthly</div><div class="result-card-value">${uaasMo ? fmtCurrency(uaasMo) + '/mo' : '—'}</div></div>
    </div>`;
    html += `<div class="result-section-title">Package Includes</div>
      <div class="result-note">${escHtml(pkg.desc)}</div>`;

    document.getElementById('avResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 2: Grant & Subsidy Finder
     ══════════════════════════════════════════════════════════ */
  function renderGrantFinder() {
    return `
      <div class="tool-intro">Find federal, state, and foundation grants available for houses of worship and religious nonprofits.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <button class="tool-btn" onclick="ChurchTools.checkGrants()">Check Eligibility</button>
      <div id="grantResult" class="tool-result"></div>`;
  }

  function checkGrants() {
    const f = getSelectedFacility();
    if (!f) { document.getElementById('grantResult').innerHTML = '<div class="result-empty">Select a facility to check grant eligibility.</div>'; return; }
    const matches = GRANT_PROGRAMS.filter(g => g.match(f));
    let html = `<div class="result-header">${escHtml(f.name)}</div>`;
    html += `<div class="result-subtitle">${escHtml(f.state || 'Unknown')} · ${escHtml(f.subtype || f.type)}</div>`;
    html += `<div class="result-badge green">${matches.length} Potential Grant${matches.length !== 1 ? 's' : ''}</div>`;
    matches.forEach(g => {
      html += `<div class="grant-card">
        <div class="grant-card-top"><span class="grant-name">${escHtml(g.name)}</span><span class="grant-type-badge">${escHtml(g.type)}</span></div>
        <div class="grant-amount">Up to ${escHtml(g.maxAmount)}</div>
        <div class="grant-eligibility">${escHtml(g.eligibility)}</div>
        ${g.url ? `<a href="${escHtml(g.url)}" target="_blank" rel="noopener noreferrer" class="grant-link">Learn More →</a>` : ''}
      </div>`;
    });
    document.getElementById('grantResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 3: Denomination Hierarchy
     ══════════════════════════════════════════════════════════ */
  function renderDenominationHierarchy() {
    const facilities = getFacilities();
    const denomCounts = {};
    const religionCounts = {};
    facilities.forEach(f => {
      if (f.denomination) denomCounts[f.denomination] = (denomCounts[f.denomination] || 0) + 1;
      if (f.religion) religionCounts[f.religion] = (religionCounts[f.religion] || 0) + 1;
    });

    const sortedDenoms = Object.entries(denomCounts).sort((a, b) => b[1] - a[1]);
    const sortedReligions = Object.entries(religionCounts).sort((a, b) => b[1] - a[1]);
    const maxDenom = sortedDenoms[0] ? sortedDenoms[0][1] : 1;

    let religionHtml = sortedReligions.map(([name, count]) => {
      return `<div class="denom-pill"><span class="denom-pill-name">${escHtml(name)}</span><span class="denom-pill-count">${fmt(count)}</span></div>`;
    }).join('');

    let denomTable = sortedDenoms.slice(0, 25).map(([name, count], i) => {
      const pct = (count / maxDenom * 100).toFixed(1);
      const states = [...new Set(facilities.filter(f => f.denomination === name).map(f => f.state).filter(Boolean))].sort().join(', ');
      return `<div class="denom-row">
        <span class="denom-rank">${i + 1}</span>
        <div class="denom-info">
          <span class="denom-name">${escHtml(name)}</span>
          <div class="denom-bar-track"><div class="denom-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <span class="denom-count">${fmt(count)}</span>
      </div>`;
    }).join('');

    return `
      <div class="tool-intro">Explore the denomination landscape and identify multi-site opportunities within religious networks.</div>
      <div class="result-section-title">Religions</div>
      <div class="denom-pills">${religionHtml}</div>
      <div class="result-section-title" style="margin-top:16px">Top Denominations</div>
      <div class="denom-list">${denomTable}</div>
      <div class="result-subtitle" style="margin-top:8px">${sortedDenoms.length} total denominations across ${fmt(facilities.length)} facilities</div>`;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 4: 990 Financial Lookup
     ══════════════════════════════════════════════════════════ */
  function renderFinancial990() {
    return `
      <div class="tool-intro">Look up IRS Form 990 data for nonprofit facilities. Revenue and asset data helps qualify prospects and size deals.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <button class="tool-btn" onclick="ChurchTools.lookup990()">Look Up Financial Data</button>
      <div id="fin990Result" class="tool-result"></div>`;
  }

  function lookup990() {
    const f = getSelectedFacility();
    if (!f) { document.getElementById('fin990Result').innerHTML = '<div class="result-empty">Select a facility.</div>'; return; }
    const org = f.apollo_org || {};

    let html = `<div class="result-header">${escHtml(f.name)}</div>`;
    html += `<div class="result-subtitle">${escHtml(f.subtype || f.type)} · ${escHtml(f.city)}, ${escHtml(f.state)}</div>`;

    if (org.employees || org.revenue) {
      html += `<div class="result-grid">`;
      if (org.employees) html += `<div class="result-card"><div class="result-card-label">Employees</div><div class="result-card-value">${fmt(org.employees)}</div></div>`;
      if (org.revenue) html += `<div class="result-card"><div class="result-card-label">Est. Revenue</div><div class="result-card-value">${escHtml(org.revenue)}</div></div>`;
      if (org.industry) html += `<div class="result-card" style="grid-column:1/-1"><div class="result-card-label">Classification</div><div class="result-card-value" style="font-family:var(--font-sans);font-size:12px">${escHtml(org.industry)}</div></div>`;
      html += `</div>`;
    }

    // External lookup links
    html += `<div class="result-section-title">External Resources</div>`;
    const searchName = encodeURIComponent(f.name);
    const searchState = encodeURIComponent(f.state || '');
    html += `<div class="result-links">
      <a href="https://www.guidestar.org/search?q=${searchName}" target="_blank" class="result-link-btn">GuideStar / Candid</a>
      <a href="https://projects.propublica.org/nonprofits/search?q=${searchName}&state%5Bid%5D=${searchState}" target="_blank" class="result-link-btn">ProPublica 990s</a>
      <a href="https://www.charitynavigator.org/search?q=${searchName}" target="_blank" class="result-link-btn">Charity Navigator</a>`;
    if (org.linkedin) html += `<a href="${escHtml(org.linkedin)}" target="_blank" class="result-link-btn">LinkedIn</a>`;
    html += `</div>`;

    html += `<div class="result-note">Most churches with annual revenue under $50K and churches in general are not required to file Form 990, but many larger churches and faith-based nonprofits do.</div>`;

    document.getElementById('fin990Result').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 5: Building Assessment
     ══════════════════════════════════════════════════════════ */
  function renderBuildingAssessment() {
    return `
      <div class="tool-intro">Evaluate a facility's building characteristics to determine technology infrastructure needs and project scope.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <div class="tool-field">
        <label class="tool-label">Building Age Estimate</label>
        <select id="bldgAge" class="tool-select">
          <option value="new">New Construction (< 5 years)</option>
          <option value="modern">Modern (5-20 years)</option>
          <option value="mid" selected>Mid-Century (20-50 years)</option>
          <option value="historic">Historic (50+ years)</option>
        </select>
      </div>
      <div class="tool-field">
        <label class="tool-label">Approx. Square Footage</label>
        <input type="number" id="bldgSqft" class="tool-input" placeholder="e.g. 15000" value="15000" />
      </div>
      <div class="tool-field">
        <label class="tool-label">Current Technology</label>
        <div class="tool-checkbox-row">
          <label class="tool-check"><input type="checkbox" id="bldgWifi" /> Has Wi-Fi</label>
          <label class="tool-check"><input type="checkbox" id="bldgAV" /> Has AV System</label>
          <label class="tool-check"><input type="checkbox" id="bldgSec" /> Has Security Cameras</label>
          <label class="tool-check"><input type="checkbox" id="bldgStream" /> Does Live Streaming</label>
        </div>
      </div>
      <button class="tool-btn" onclick="ChurchTools.assessBuilding()">Assess Building</button>
      <div id="bldgResult" class="tool-result"></div>`;
  }

  function assessBuilding() {
    const f = getSelectedFacility();
    const age = document.getElementById('bldgAge').value;
    const sqft = parseInt(document.getElementById('bldgSqft').value) || 15000;
    const hasWifi = document.getElementById('bldgWifi').checked;
    const hasAV = document.getElementById('bldgAV').checked;
    const hasSec = document.getElementById('bldgSec').checked;
    const hasStream = document.getElementById('bldgStream').checked;

    const ageFactors = { new: 1.0, modern: 1.15, mid: 1.35, historic: 1.6 };
    const ageFactor = ageFactors[age];
    const ageLabels = { new: 'New Construction', modern: 'Modern', mid: 'Mid-Century', historic: 'Historic' };

    let score = 0;
    let recommendations = [];
    let totalEstimate = 0;

    // Scoring
    if (hasWifi) score += 25; else { recommendations.push({ item: 'Wi-Fi Network', cost: Math.round((Math.ceil(sqft / 2500) * NETWORKING.capex.ap + NETWORKING.capex.switch) * ageFactor), priority: 'High' }); }
    if (hasAV) score += 25; else { recommendations.push({ item: 'AV System Upgrade', cost: Math.round(22000 * ageFactor), priority: 'High' }); }
    if (hasSec) score += 25; else { recommendations.push({ item: 'Security System', cost: Math.round(12000 * ageFactor), priority: 'Medium' }); }
    if (hasStream) score += 25; else { recommendations.push({ item: 'Live Streaming Setup', cost: Math.round(4500 * ageFactor), priority: 'Medium' }); }

    // Wiring cost estimate based on age
    if (age === 'historic' || age === 'mid') {
      recommendations.push({ item: 'Structured Cabling', cost: Math.round(sqft * 2.5 * (age === 'historic' ? 1.5 : 1)), priority: 'High' });
    }

    totalEstimate = recommendations.reduce((s, r) => s + r.cost, 0);

    let html = `<div class="result-header">${f ? escHtml(f.name) : 'Building Assessment'}</div>`;
    html += `<div class="result-subtitle">${ageLabels[age]} · ~${fmt(sqft)} sq ft</div>`;

    const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    html += `<div class="result-grid">
      <div class="result-card accent"><div class="result-card-label">Tech Readiness</div><div class="result-card-value" style="color:${scoreColor};font-size:20px">${score}/100</div></div>
      <div class="result-card"><div class="result-card-label">Cost Multiplier</div><div class="result-card-value">${ageFactor.toFixed(2)}x</div></div>
      <div class="result-card" style="grid-column:1/-1"><div class="result-card-label">Est. Total Investment</div><div class="result-card-value" style="font-size:18px">${fmtCurrency(totalEstimate)}</div></div>
    </div>`;

    if (recommendations.length > 0) {
      html += `<div class="result-section-title">Recommendations</div>`;
      recommendations.forEach(r => {
        const prColor = r.priority === 'High' ? '#ef4444' : '#f59e0b';
        html += `<div class="recommend-row">
          <span class="recommend-name">${escHtml(r.item)}</span>
          <span class="recommend-priority" style="color:${prColor}">${r.priority}</span>
          <span class="recommend-cost">${fmtCurrency(r.cost)}</span>
        </div>`;
      });
    }

    document.getElementById('bldgResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 6: Congregation Estimator
     ══════════════════════════════════════════════════════════ */
  function renderCongregationEstimator() {
    const facilities = getFacilities();
    const subtypeCounts = {};
    facilities.forEach(f => { subtypeCounts[f.subtype || 'Unknown'] = (subtypeCounts[f.subtype || 'Unknown'] || 0) + 1; });
    const sorted = Object.entries(subtypeCounts).sort((a, b) => b[1] - a[1]);

    const withEmployees = facilities.filter(f => f.apollo_org && f.apollo_org.employees);
    const avgEmp = withEmployees.length > 0 ? Math.round(withEmployees.reduce((s, f) => s + f.apollo_org.employees, 0) / withEmployees.length) : 0;

    // Estimate congregation size ranges
    const sizeCategories = [
      { label: 'Small (< 100)', min: 0, max: 5, count: 0 },
      { label: 'Medium (100-500)', min: 5, max: 25, count: 0 },
      { label: 'Large (500-2000)', min: 25, max: 100, count: 0 },
      { label: 'Mega (2000+)', min: 100, max: 99999, count: 0 },
    ];
    withEmployees.forEach(f => {
      const emp = f.apollo_org.employees;
      for (let cat of sizeCategories) {
        if (emp >= cat.min && emp < cat.max) { cat.count++; break; }
      }
    });

    let catHtml = sizeCategories.map(c => `
      <div class="result-card"><div class="result-card-label">${c.label}</div><div class="result-card-value">${c.count}</div></div>
    `).join('');

    let typeHtml = sorted.slice(0, 8).map(([type, count]) => `
      <div class="denom-row"><span class="denom-rank"></span><div class="denom-info"><span class="denom-name">${escHtml(type)}</span></div><span class="denom-count">${fmt(count)}</span></div>
    `).join('');

    return `
      <div class="tool-intro">Estimate congregation sizes using Apollo employee data as a proxy. Larger congregations = larger AV/IT budgets.</div>
      <div class="result-grid">
        <div class="result-card accent"><div class="result-card-label">Total Facilities</div><div class="result-card-value">${fmt(facilities.length)}</div></div>
        <div class="result-card"><div class="result-card-label">With Employee Data</div><div class="result-card-value">${fmt(withEmployees.length)}</div></div>
        <div class="result-card"><div class="result-card-label">Avg Staff Size</div><div class="result-card-value">${avgEmp}</div></div>
        <div class="result-card"><div class="result-card-label">Est. Avg Congregation</div><div class="result-card-value">${avgEmp > 0 ? '~' + fmt(avgEmp * 25) : '—'}</div></div>
      </div>
      <div class="result-section-title">Size Distribution (by employee count)</div>
      <div class="result-grid">${catHtml}</div>
      <div class="result-section-title">Facility Types</div>
      <div class="denom-list">${typeHtml}</div>`;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 7: Tech Readiness Scorer
     ══════════════════════════════════════════════════════════ */
  function renderTechReadiness() {
    return `
      <div class="tool-intro">Score a facility's technology maturity level. Higher scores indicate more sophisticated needs; lower scores indicate greenfield opportunities.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <button class="tool-btn" onclick="ChurchTools.scoreTech()">Score Facility</button>
      <div id="techResult" class="tool-result"></div>`;
  }

  function scoreTech() {
    const f = getSelectedFacility();
    if (!f) { document.getElementById('techResult').innerHTML = '<div class="result-empty">Select a facility.</div>'; return; }

    const org = f.apollo_org || {};
    const contacts = f.apollo_contacts || [];

    // Scoring logic
    let score = 0;
    let factors = [];

    // Website presence
    if (f.website) { score += 15; factors.push({ label: 'Has Website', score: 15, positive: true }); }
    else { factors.push({ label: 'No Website Found', score: 0, positive: false }); }

    // LinkedIn presence
    if (org.linkedin) { score += 10; factors.push({ label: 'LinkedIn Presence', score: 10, positive: true }); }

    // Employee count (proxy for size)
    if (org.employees > 50) { score += 15; factors.push({ label: 'Large Staff (50+)', score: 15, positive: true }); }
    else if (org.employees > 10) { score += 10; factors.push({ label: 'Medium Staff', score: 10, positive: true }); }
    else if (org.employees > 0) { score += 5; factors.push({ label: 'Small Staff', score: 5, positive: true }); }

    // Revenue
    if (org.revenue) { score += 10; factors.push({ label: 'Revenue Data Available', score: 10, positive: true }); }

    // Contact enrichment
    if (contacts.length >= 3) { score += 15; factors.push({ label: '3+ Key Contacts Found', score: 15, positive: true }); }
    else if (contacts.length > 0) { score += 10; factors.push({ label: contacts.length + ' Contact(s) Found', score: 10, positive: true }); }

    // Has email contacts
    const hasEmails = contacts.some(c => c.email);
    if (hasEmails) { score += 10; factors.push({ label: 'Email Addresses Available', score: 10, positive: true }); }

    // Tech-related titles
    const hasTechPerson = contacts.some(c => /tech|IT|media|digital|commun/i.test(c.title || ''));
    if (hasTechPerson) { score += 15; factors.push({ label: 'Has Tech/Media Staff', score: 15, positive: true }); }

    // Industry classification
    if (org.industry) { score += 5; factors.push({ label: 'Industry Classified', score: 5, positive: true }); }

    const maxScore = 100;
    const pct = Math.min(100, Math.round(score / maxScore * 100));
    const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : pct >= 20 ? 'D' : 'F';
    const gradeColor = pct >= 60 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const readiness = pct >= 60 ? 'Sophisticated' : pct >= 40 ? 'Moderate' : 'Greenfield Opportunity';

    let html = `<div class="result-header">${escHtml(f.name)}</div>`;
    html += `<div class="result-subtitle">${escHtml(f.subtype || f.type)}</div>`;
    html += `<div class="result-grid">
      <div class="result-card accent"><div class="result-card-label">Tech Score</div><div class="result-card-value" style="color:${gradeColor};font-size:22px">${pct}%</div></div>
      <div class="result-card"><div class="result-card-label">Grade</div><div class="result-card-value" style="color:${gradeColor};font-size:22px">${grade}</div></div>
      <div class="result-card" style="grid-column:1/-1"><div class="result-card-label">Assessment</div><div class="result-card-value" style="font-family:var(--font-sans);font-size:13px">${readiness}</div></div>
    </div>`;

    html += `<div class="result-section-title">Scoring Factors</div>`;
    factors.forEach(f => {
      html += `<div class="factor-row">
        <span class="factor-icon" style="color:${f.positive ? '#22c55e' : '#ef4444'}">${f.positive ? '✓' : '✗'}</span>
        <span class="factor-label">${escHtml(f.label)}</span>
        <span class="factor-score">+${f.score}</span>
      </div>`;
    });

    document.getElementById('techResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 8: Security System Estimator
     ══════════════════════════════════════════════════════════ */
  function renderSecurityEstimator() {
    return `
      <div class="tool-intro">Estimate security system costs including cameras, access control, and monitoring.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <div class="tool-field">
        <label class="tool-label">Security Package</label>
        <select id="secPackage" class="tool-select">
          <option value="basic">Basic — 4 Cameras + NVR</option>
          <option value="standard" selected>Standard — 8 Cameras + Access Control</option>
          <option value="premium">Premium — 16+ Cameras + Biometric + Mass Notification</option>
        </select>
      </div>
      <div class="tool-field">
        <label class="tool-label">Number of Exterior Doors</label>
        <input type="number" id="secDoors" class="tool-input" value="6" min="1" max="50" />
      </div>
      <div class="tool-field">
        <label class="tool-label">Add-Ons</label>
        <div class="tool-checkbox-row">
          <label class="tool-check"><input type="checkbox" id="secMonitor" checked /> 24/7 Monitoring <span class="tool-hint">($150/mo)</span></label>
          <label class="tool-check"><input type="checkbox" id="secPanic" /> Panic Buttons <span class="tool-hint">(+$800)</span></label>
          <label class="tool-check"><input type="checkbox" id="secAlert" /> Mass Alert System <span class="tool-hint">(+$3,200)</span></label>
        </div>
      </div>
      <button class="tool-btn" onclick="ChurchTools.calcSecurity()">Calculate Estimate</button>
      <div id="secResult" class="tool-result"></div>`;
  }

  function calcSecurity() {
    const f = getSelectedFacility();
    const pkg = SECURITY_PRICING[document.getElementById('secPackage').value];
    const doors = parseInt(document.getElementById('secDoors').value) || 6;
    const addMonitor = document.getElementById('secMonitor').checked;
    const addPanic = document.getElementById('secPanic').checked;
    const addAlert = document.getElementById('secAlert').checked;

    let capex = pkg.base + (doors * pkg.perDoor);
    if (addPanic) capex += 800;
    if (addAlert) capex += 3200;
    const monthly = addMonitor ? 150 : 0;
    const annual = monthly * 12;

    let html = `<div class="result-header">${f ? escHtml(f.name) : 'Security Estimate'}</div>`;
    html += `<div class="result-subtitle">${escHtml(pkg.name)} · ${doors} doors</div>`;
    html += `<div class="result-grid">
      <div class="result-card accent"><div class="result-card-label">Total Capital Cost</div><div class="result-card-value">${fmtCurrency(capex)}</div></div>
      <div class="result-card"><div class="result-card-label">Monthly Monitoring</div><div class="result-card-value">${monthly ? fmtCurrency(monthly) + '/mo' : '—'}</div></div>
      <div class="result-card"><div class="result-card-label">Per Door Cost</div><div class="result-card-value">${fmtCurrency(pkg.perDoor)}</div></div>
      <div class="result-card"><div class="result-card-label">Annual Cost</div><div class="result-card-value">${annual ? fmtCurrency(annual) + '/yr' : '—'}</div></div>
    </div>`;
    html += `<div class="result-note">FEMA Nonprofit Security Grant (NSGP) may cover up to ${fmtCurrency(150000)} for qualifying houses of worship. NexusCT can assist with grant applications.</div>`;

    document.getElementById('secResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 9: Contact Enrichment
     ══════════════════════════════════════════════════════════ */
  function renderContactEnrichment() {
    return `
      <div class="tool-intro">View Apollo.io enriched contacts for facility outreach and identify decision-makers.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <button class="tool-btn" onclick="ChurchTools.lookupContacts()">View Contacts</button>
      <div id="contactResult" class="tool-result"></div>`;
  }

  function lookupContacts() {
    const f = getSelectedFacility();
    if (!f) { document.getElementById('contactResult').innerHTML = '<div class="result-empty">Select a facility.</div>'; return; }
    const contacts = f.apollo_contacts || [];
    const org = f.apollo_org || {};

    let html = `<div class="result-header">${escHtml(f.name)}</div>`;
    html += `<div class="result-subtitle">${escHtml(f.subtype || f.type)} · ${escHtml(f.city)}, ${escHtml(f.state)}</div>`;

    if (org.employees || org.revenue) {
      html += `<div class="result-grid">`;
      if (org.employees) html += `<div class="result-card"><div class="result-card-label">Employees</div><div class="result-card-value">${fmt(org.employees)}</div></div>`;
      if (org.revenue) html += `<div class="result-card"><div class="result-card-label">Revenue</div><div class="result-card-value">${escHtml(org.revenue)}</div></div>`;
      html += `</div>`;
    }

    if (contacts.length === 0) {
      html += `<div class="result-empty" style="margin-top:12px">No enriched contacts available.</div>`;
    } else {
      html += `<div class="result-badge green">${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}</div>`;
      contacts.forEach(c => {
        let links = '';
        if (c.email) links += `<a href="mailto:${escHtml(c.email)}" class="contact-action-link">✉ ${escHtml(c.email)}</a>`;
        if (c.linkedin) links += `<a href="${escHtml(c.linkedin)}" target="_blank" class="contact-action-link li">LinkedIn →</a>`;
        if (c.phone) links += `<a href="tel:${escHtml(c.phone)}" class="contact-action-link">☎ ${escHtml(c.phone)}</a>`;
        html += `<div class="enriched-contact-card">
          <div class="ecc-name">${escHtml(c.name)}</div>
          <div class="ecc-title">${escHtml(c.title)}</div>
          <div class="ecc-links">${links}</div>
        </div>`;
      });
    }
    document.getElementById('contactResult').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════
     TOOL 10: Outreach Generator
     ══════════════════════════════════════════════════════════ */
  function renderOutreachGenerator() {
    return `
      <div class="tool-intro">Generate personalized outreach messages based on the facility's profile, denomination, and technology needs.</div>
      ${facilitySelector('toolFacilitySelect', 'Facility')}
      <div class="tool-field">
        <label class="tool-label">Outreach Focus</label>
        <select id="outreachFocus" class="tool-select">
          <option value="av">AV / Sound System Upgrade</option>
          <option value="security">Security & Safety</option>
          <option value="network">Network / Wi-Fi Infrastructure</option>
          <option value="streaming">Live Streaming & Digital Ministry</option>
        </select>
      </div>
      <button class="tool-btn" onclick="ChurchTools.generateOutreach()">Generate Outreach</button>
      <div id="outreachResult" class="tool-result"></div>`;
  }

  function generateOutreach() {
    const f = getSelectedFacility();
    if (!f) { document.getElementById('outreachResult').innerHTML = '<div class="result-empty">Select a facility.</div>'; return; }
    const focus = document.getElementById('outreachFocus').value;
    const contacts = f.apollo_contacts || [];
    const firstContact = contacts[0];
    const org = f.apollo_org || {};

    let greeting = firstContact ? `Dear ${escHtml(firstContact.name.split(' ')[0])}` : 'Dear Pastor';
    const fname = escHtml(f.name);
    let subject = '', body = '';

    if (focus === 'av') {
      subject = `AV Upgrade for ${fname} — Modern Sound & Projection`;
      body = `I'm reaching out to ${fname} regarding audio/video technology. Whether your current system is aging or you're looking to enhance your worship experience, NexusCT provides turnkey AV solutions designed for houses of worship.

Our packages include:
• <strong>Sound Systems</strong> — from basic speaker upgrades to full line array installations
• <strong>Projection & Displays</strong> — bright projectors, LED walls, and digital signage
• <strong>Live Streaming</strong> — professional multi-camera setups for online ministry
${f.denomination ? `\nWe work with many ${escHtml(f.denomination)} congregations in the ${escHtml(f.state || '')} area and understand the unique acoustics and aesthetics of worship spaces.` : ''}

For a typical sanctuary, packages range from $8,500 to $120,000+ depending on your needs and seating capacity.`;
    } else if (focus === 'security') {
      subject = `Protecting Your Congregation — Security Solutions for ${fname}`;
      body = `The safety of your congregation is paramount. NexusCT provides comprehensive security solutions specifically designed for houses of worship.

Our security packages include:
• <strong>Camera Systems</strong> — HD indoor/outdoor surveillance with remote viewing
• <strong>Access Control</strong> — keycard and biometric entry for staff areas
• <strong>Emergency Alert Systems</strong> — mass notification for your congregation
• <strong>24/7 Monitoring</strong> — professional monitoring service

Did you know? The <strong>FEMA Nonprofit Security Grant Program (NSGP)</strong> provides up to $150,000 for qualifying houses of worship. We can help with the application process.`;
    } else if (focus === 'network') {
      subject = `Reliable Wi-Fi & Network Infrastructure for ${fname}`;
      body = `In today's connected world, reliable internet and Wi-Fi is essential — from sermon streaming to church management software to guest connectivity.

NexusCT's UaaS (UniFi as a Service) provides:
• <strong>Enterprise Wi-Fi</strong> — full coverage across your facility
• <strong>Managed Networking</strong> — switches, firewall, and network security
• <strong>Remote Management</strong> — we monitor and manage everything 24/7
• <strong>Guest Wi-Fi</strong> — separate network for visitors and events

Our managed service starts at just $35/access point per month — no large upfront investment required.`;
    } else {
      subject = `Expand Your Ministry Online — Live Streaming for ${fname}`;
      body = `More than 80% of church attendees also watch services online. If ${fname} isn't streaming yet — or your current setup isn't professional quality — we can help.

NexusCT's streaming solutions include:
• <strong>PTZ Camera Systems</strong> — remote-controlled broadcast cameras
• <strong>Live Switching</strong> — professional multi-camera production
• <strong>Platform Integration</strong> — YouTube, Facebook, and custom apps
• <strong>On-Demand Archive</strong> — automatically record and publish sermons

Complete streaming setups start at $4,500, with full broadcast studio packages available for larger congregations.`;
    }

    let html = `<div class="result-header">Generated Outreach</div>`;
    html += `<div class="pitch-card">
      <div class="pitch-subject"><strong>Subject:</strong> ${subject}</div>
      <div class="pitch-body">
        <p>${greeting},</p>
        <p>${body}</p>
        <p>Would you have 15 minutes for a brief call? I'd be happy to visit ${fname} for a free assessment of your current technology setup.</p>
        <p>Best regards,<br/>Jim Mazzarella<br/>CEO, NexusCT<br/>jmazza@nexusct.com</p>
      </div>
    </div>`;
    html += `<button class="tool-btn copy-btn" onclick="ChurchTools.copyOutreach()">Copy to Clipboard</button>`;
    document.getElementById('outreachResult').innerHTML = html;
  }

  function copyOutreach() {
    const el = document.querySelector('.pitch-body');
    if (el) {
      navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy to Clipboard', 2000);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     TOOLBOX PANEL UI
     ══════════════════════════════════════════════════════════ */
  const RENDER_MAP = {
    'av-estimator': renderAVEstimator,
    'grant-finder': renderGrantFinder,
    'denomination-hierarchy': renderDenominationHierarchy,
    'financial-990': renderFinancial990,
    'building-assessment': renderBuildingAssessment,
    'congregation-estimator': renderCongregationEstimator,
    'tech-readiness': renderTechReadiness,
    'security-estimator': renderSecurityEstimator,
    'contact-enrichment': renderContactEnrichment,
    'outreach-generator': renderOutreachGenerator,
  };

  function openTool(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return;
    const panel = document.getElementById('toolboxPanel');
    const content = document.getElementById('toolboxContent');
    const title = document.getElementById('toolboxTitle');
    title.innerHTML = `${tool.icon}<span>${escHtml(tool.name)}</span>`;
    content.innerHTML = RENDER_MAP[toolId]();
    panel.classList.add('open');
    panel.dataset.view = 'tool';
  }

  function showToolGrid() {
    const panel = document.getElementById('toolboxPanel');
    panel.dataset.view = 'grid';
    document.getElementById('toolboxTitle').innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg><span>Sales Toolbox</span>`;
    document.getElementById('toolboxContent').innerHTML = TOOLS.map(t => `
      <div class="toolbox-card" onclick="ChurchTools.openTool('${t.id}')" style="--tool-accent:${t.color}">
        <div class="toolbox-card-icon">${t.icon}</div>
        <div class="toolbox-card-info">
          <div class="toolbox-card-name">${escHtml(t.name)}</div>
          <div class="toolbox-card-desc">${escHtml(t.desc)}</div>
        </div>
      </div>`).join('');
  }

  function toggleToolbox() {
    const panel = document.getElementById('toolboxPanel');
    if (panel.classList.contains('open')) { panel.classList.remove('open'); }
    else { showToolGrid(); panel.classList.add('open'); }
  }

  function closeToolbox() { document.getElementById('toolboxPanel').classList.remove('open'); }

  /* ── Initialize ─────────────────────────────────────────── */
  function init() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
      const btn = document.createElement('button');
      btn.id = 'toolboxBtn';
      btn.className = 'toolbox-trigger-btn';
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg> Toolbox`;
      btn.onclick = toggleToolbox;
      headerRight.insertBefore(btn, headerRight.firstChild);
    }

    const panel = document.createElement('div');
    panel.id = 'toolboxPanel';
    panel.className = 'toolbox-panel';
    panel.dataset.view = 'grid';
    panel.innerHTML = `
      <div class="toolbox-header">
        <button class="toolbox-back-btn" onclick="ChurchTools.showToolGrid()" title="Back to tools">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="toolbox-title" id="toolboxTitle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>
          <span>Sales Toolbox</span>
        </div>
        <button class="toolbox-close-btn" onclick="ChurchTools.closeToolbox()" title="Close">✕</button>
      </div>
      <div class="toolbox-content" id="toolboxContent"></div>`;
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

  window.ChurchTools = {
    openTool, showToolGrid, toggleToolbox, closeToolbox,
    calcAV, checkGrants, lookup990, assessBuilding, scoreTech,
    calcSecurity, lookupContacts, generateOutreach, copyOutreach,
  };

})();
