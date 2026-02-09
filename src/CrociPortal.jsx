import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Configuration ────────────────────────────────────────────────────
const OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE";
const WEATHER_ENABLED = OPENWEATHER_API_KEY !== "YOUR_API_KEY_HERE";
const WEATHER_CACHE_TTL = 30 * 60 * 1000;
const USE_MOCK_DATA = false;

// ── Google Sheets Configuration (UK) ─────────────────────────────────
const MASTER_TRACKER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSl_qewLiD5ZN1BOMxHJlTUUe2jt1bohmSjiJ9hPEHJN2YvNvZzghKO5Mix-IgiudjAR-rGwFCctzC/pub?gid=0&single=true&output=csv";
const SALES_PUBHTML_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjExpxy5r3r3hWi4Oe1ne8u_tu0BVqPzRPWIh0k2zwsgR0btJu1gbXHZoDp97Gz8AE0d3Ms9CeD1rL/pubhtml";
const SALES_CSV_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjExpxy5r3r3hWi4Oe1ne8u_tu0BVqPzRPWIh0k2zwsgR0btJu1gbXHZoDp97Gz8AE0d3Ms9CeD1rL/pub";
const REFRESH_INTERVAL = 2.5 * 60 * 1000;

// ── Map Region Configuration (UK & Ireland only) ─────────────────────
const MAP_REGIONS = {
  UK: { center: [54.0, -4.0], zoom: 5, label: "UK & Ireland" },
  IE: { center: [53.3, -7.5], zoom: 6.5, label: "Ireland" },
};
const MAP_ROTATION_INTERVAL = 20000;

// ── Password Protection ─────────────────────────────────────────────
const PASSWORD_PROTECTED = true;
const SITE_PASSWORD = "CrociTeam2025";

// ── Venue Coordinate Registry (UK & Ireland) ─────────────────────────
const VENUE_COORDINATES = {
  // UK venues
  "The O2 Arena, London": { lat: 51.5033, lng: 0.0032 },
  "Manchester Central": { lat: 53.4762, lng: -2.2467 },
  "NEC Birmingham": { lat: 52.4539, lng: -1.7246 },
  "NEC": { lat: 52.4539, lng: -1.7246 },
  "SEC Glasgow": { lat: 55.8607, lng: -4.2872 },
  "Olympia London": { lat: 51.4960, lng: -0.2098 },
  "ExCeL London": { lat: 51.5085, lng: 0.0295 },
  "ExCeL": { lat: 51.5085, lng: 0.0295 },
  "Brighton Centre": { lat: 50.8218, lng: -0.1392 },
  "EventCity Manchester": { lat: 53.4680, lng: -2.3474 },
  "AECC Aberdeen": { lat: 57.1647, lng: -2.0863 },
  "P&J Live": { lat: 57.1647, lng: -2.0863 },
  "Edinburgh International Conference Centre": { lat: 55.9476, lng: -3.2069 },
  "EICC": { lat: 55.9476, lng: -3.2069 },
  "ICC Wales": { lat: 51.5866, lng: -2.9938 },
  "Arena Birmingham": { lat: 52.4801, lng: -1.9083 },
  "London Olympia": { lat: 51.4960, lng: -0.2098 },
  "Farnborough International": { lat: 51.2758, lng: -0.7702 },
  "Harrogate Convention Centre": { lat: 53.9926, lng: -1.5345 },
  "Telford International Centre": { lat: 52.6793, lng: -2.4489 },
  "Yorkshire Event Centre": { lat: 53.9930, lng: -1.5370 },
  "Sandown Park": { lat: 51.3764, lng: -0.3567 },
  "Stoneleigh Park": { lat: 52.3558, lng: -1.5109 },
  "NAEC Stoneleigh": { lat: 52.3558, lng: -1.5109 },
  "Bath & West Showground": { lat: 51.1454, lng: -2.7093 },
  "Three Counties Showground": { lat: 52.0566, lng: -2.2373 },
  "Kent Event Centre": { lat: 51.2547, lng: 0.5376 },
  "Kent Showground": { lat: 51.2547, lng: 0.5376 },
  "Royal Highland Centre": { lat: 55.9412, lng: -3.3810 },
  "Alexandra Palace": { lat: 51.5936, lng: -0.1306 },
  "Olympia Grand": { lat: 51.4960, lng: -0.2098 },
  "ICC Birmingham": { lat: 52.4796, lng: -1.9085 },
  "Liverpool Arena": { lat: 53.3960, lng: -2.9874 },
  "M&S Bank Arena": { lat: 53.3960, lng: -2.9874 },
  "Leeds First Direct Arena": { lat: 53.7985, lng: -1.5490 },
  "Motorpoint Arena Nottingham": { lat: 52.9504, lng: -1.1428 },
  "Bournemouth International Centre": { lat: 50.7173, lng: -1.8741 },
  "BIC": { lat: 50.7173, lng: -1.8741 },
  "Cardiff City Hall": { lat: 51.4837, lng: -3.1764 },
  "Westpoint Exeter": { lat: 50.7058, lng: -3.4760 },
  "Great Yorkshire Showground": { lat: 53.9930, lng: -1.5370 },
  "FIVE": { lat: 51.5085, lng: 0.0295 },
  // Ireland venues
  "RDS Dublin": { lat: 53.3270, lng: -6.2290 },
  "Cork City Hall": { lat: 51.8969, lng: -8.4707 },
  "Galway Racecourse": { lat: 53.2830, lng: -8.9890 },
  "Convention Centre Dublin": { lat: 53.3478, lng: -6.2388 },
  "CCD": { lat: 53.3478, lng: -6.2388 },
  "Limerick Milk Market": { lat: 52.6610, lng: -8.6303 },
  "Citywest Hotel": { lat: 53.2920, lng: -6.4322 },
  "Croke Park": { lat: 53.3633, lng: -6.2514 },
  "Leopardstown Racecourse": { lat: 53.2668, lng: -6.2056 },
  "Thomond Park": { lat: 52.6629, lng: -8.6259 },
  "3Arena Dublin": { lat: 53.3478, lng: -6.2276 },
  "Punchestown Racecourse": { lat: 53.1810, lng: -6.6744 },
  "Wexford Racecourse": { lat: 52.3420, lng: -6.4578 },
};

// ── UK Region Coordinates (fallback by region name) ──────────────────
const REGION_COORDINATES = {
  "London": { lat: 51.5074, lng: -0.1278 },
  "South East": { lat: 51.3, lng: 0.5 },
  "South West": { lat: 50.9, lng: -3.2 },
  "East Anglia": { lat: 52.5, lng: 1.0 },
  "East Midlands": { lat: 52.8, lng: -1.2 },
  "West Midlands": { lat: 52.5, lng: -1.9 },
  "North West": { lat: 53.6, lng: -2.5 },
  "North East": { lat: 54.9, lng: -1.6 },
  "Yorkshire": { lat: 53.9, lng: -1.5 },
  "Wales": { lat: 52.1, lng: -3.6 },
  "Scotland": { lat: 56.5, lng: -4.2 },
  "Northern Ireland": { lat: 54.6, lng: -6.7 },
  "Ireland": { lat: 53.3, lng: -7.5 },
  "Dublin": { lat: 53.3498, lng: -6.2603 },
  "Cork": { lat: 51.8969, lng: -8.4863 },
  "Galway": { lat: 53.2707, lng: -9.0568 },
  "Limerick": { lat: 52.6638, lng: -8.6267 },
};

// ── Active Countries ─────────────────────────────────────────────────
const COUNTRIES = ["United Kingdom", "Ireland"];
const ACTIVE_COUNTRIES = COUNTRIES;
const FLAGS = { "United Kingdom": "\u{1F1EC}\u{1F1E7}", "Ireland": "\u{1F1EE}\u{1F1EA}" };

// ── Currency Helper ──────────────────────────────────────────────────
function getCurrencySymbol(country) {
  return country === "Ireland" ? "\u20ac" : "\u00a3";
}

// ── Mock Data Constants (not used in live mode) ──────────────────────
const CAMPAIGNS = ["Spring Wellness Push", "Summer Box Blitz", "Pet Nutrition Drive", "Starter Kit Promo"];
const PRODUCTS = {
  feedingPlans: ["Puppy Growth Plan", "Adult Maintenance", "Senior Vitality", "Weight Management", "Raw Boost"],
  boxTypes: ["Starter Box", "Premium Box", "Family Pack", "Trial Box", "Mega Bundle"],
};
const NAMES_UK = ["James Hartley", "Sophie Brennan", "Liam O'Connor", "Chloe Watts", "Aiden Clarke", "Megan Taylor", "Ryan Patel", "Emma Hughes", "Nathan Brooks", "Isla Ferreira"];
const NAMES_IE = ["Ciara Murphy", "Sean Gallagher", "Niamh Doyle", "Conor Byrne", "Aoife Kelly", "Padraig Walsh", "Sinead Nolan", "Declan Healy", "Roisin Daly", "Eoin Fitzgerald"];
const SALES_NAMES = { "United Kingdom": NAMES_UK, "Ireland": NAMES_IE };
const VENUES_UK = ["The O2 Arena, London", "Manchester Central", "NEC Birmingham", "SEC Glasgow", "Olympia London", "ExCeL London", "Brighton Centre"];
const VENUES_IE = ["RDS Dublin", "Cork City Hall", "Galway Racecourse", "Convention Centre Dublin", "Limerick Milk Market"];
const VENUES = { "United Kingdom": VENUES_UK, "Ireland": VENUES_IE };

// ── Utility Functions ────────────────────────────────────────────────
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ── CSV Parser (RFC 4180 compliant) ──────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(cell.trim()); cell = ""; }
      else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(cell.trim()); rows.push(row); row = []; cell = "";
        if (ch === "\r") i++;
      } else if (ch === "\r") {
        row.push(cell.trim()); rows.push(row); row = []; cell = "";
      } else { cell += ch; }
    }
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

// ── Date & Number Parsing Helpers ────────────────────────────────────
const MONTH_MAP = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };

function parseMasterDate(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[1], 10);
  const month = MONTH_MAP[parts[2]];
  if (month === undefined || isNaN(day)) return null;
  return new Date(2026, month, day);
}

// UK Sales date format: "2026-02-02 17:48:07"
function parseUKSalesDate(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  // YYYY-MM-DD HH:MM:SS
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    return new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
      parseInt(match[4], 10),
      parseInt(match[5], 10),
      parseInt(match[6], 10)
    );
  }
  // Fallback: try YYYY-MM-DD only
  const match2 = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match2) {
    return new Date(parseInt(match2[1], 10), parseInt(match2[2], 10) - 1, parseInt(match2[3], 10));
  }
  return null;
}

// Extract UK agent: check col1 and col2, use whichever isn't "*Not Listed"
function extractUKAgent(col1, col2) {
  const a1 = (col1 || "").trim();
  const a2 = (col2 || "").trim();
  if (a1 && a1 !== "*Not Listed" && a1 !== "") return a1;
  if (a2 && a2 !== "*Not Listed" && a2 !== "") return a2;
  return "Unknown";
}

// Normalize week number: "WK 1" → "WK1", "WK 06" → "WK6"
function normalizeWeekNum(str) {
  if (!str) return "";
  const match = str.match(/WK\s*0?(\d+)/i);
  return match ? `WK${match[1]}` : str.trim();
}

function parseNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

// Parse £ currency: strip £, commas → float
function parsePoundCurrency(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[\u00a3\u20ac$,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekSunday(monday) {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateForUKSales(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ── Sales Tab Discovery (UK: campaign-based tabs) ────────────────────
async function discoverSalesTabGids() {
  try {
    const response = await fetch(SALES_PUBHTML_URL);
    if (!response.ok) throw new Error(`pubhtml HTTP ${response.status}`);
    const html = await response.text();

    const tabPattern = /id="sheet-button-(\d+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
    const eventSalesTabs = [];
    const tmmTabs = [];
    let match;

    while ((match = tabPattern.exec(html)) !== null) {
      const gid = match[1];
      const name = match[2].trim();

      // Extract week number from tab name like "WK 06 - HF/GC UK"
      const weekMatch = name.match(/WK\s*(\d+)/i);
      if (!weekMatch) continue;
      const weekNum = `WK${parseInt(weekMatch[1], 10)}`;

      // Categorize
      if (/TMM|TELESALES/i.test(name)) {
        tmmTabs.push({ gid, name, weekNum, campaign: "TMM Telesales", country: "United Kingdom" });
      } else if (/HF\s*IE/i.test(name)) {
        eventSalesTabs.push({ gid, name, weekNum, campaign: "HF IE", country: "Ireland" });
      } else if (/HF[\s/]*GC\s*UK/i.test(name)) {
        eventSalesTabs.push({ gid, name, weekNum, campaign: "HF/GC UK", country: "United Kingdom" });
      } else if (/TAILS/i.test(name)) {
        eventSalesTabs.push({ gid, name, weekNum, campaign: "Tails.com", country: "United Kingdom" });
      }
    }

    if (eventSalesTabs.length > 0 || tmmTabs.length > 0) {
      return { eventSalesTabs, tmmTabs };
    }
  } catch (err) {
    console.warn("Sales tab discovery failed:", err);
  }
  return { eventSalesTabs: [], tmmTabs: [] };
}

async function fetchAllSalesTabs(tabs) {
  const csvPromises = tabs.map(async (tab) => {
    const url = `${SALES_CSV_BASE_URL}?gid=${tab.gid}&single=true&output=csv`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch sales tab ${tab.name}: HTTP ${res.status}`);
        return [];
      }
      const text = await res.text();
      const rows = parseCSV(text);
      // Skip 2 header rows per tab, attach metadata
      return rows.slice(2).map(row => ({
        row,
        tabName: tab.name,
        campaign: tab.campaign,
        country: tab.country,
        weekNum: tab.weekNum,
      }));
    } catch (err) {
      console.warn(`Error fetching sales tab ${tab.name}:`, err);
      return [];
    }
  });
  const allTabRows = await Promise.all(csvPromises);
  return allTabRows.flat();
}

// ── Process Google Sheets Data (UK) ──────────────────────────────────
function processDataUK(masterRows, salesDataRows, tmmSalesRows, selectedWeek) {
  // Parse UK Master Tracker — skip 1 header row
  const masterData = masterRows.slice(1);

  const events = masterData
    .filter(row => {
      if (!row || row.length < 10) return false;
      const bookingStatus = (row[2] || "").trim().toUpperCase();
      const showName = (row[7] || "").trim();
      if (bookingStatus !== "BOOKED") return false;
      if (!showName || showName.toUpperCase().includes("WEEK BREAK")) return false;
      return true;
    })
    .map((row, index) => {
      const spaceCost = parsePoundCurrency(row[29]);
      const logistics = parsePoundCurrency(row[30]);
      const totalUpfronts = spaceCost + logistics;

      return {
        id: `event-${index}`,
        client: (row[6] || "").trim(),
        weekNum: normalizeWeekNum(row[3]),
        startDate: parseMasterDate(row[4]),
        endDate: parseMasterDate(row[5]),
        startDateRaw: (row[4] || "").trim(),
        endDateRaw: (row[5] || "").trim(),
        liveDays: parseNumber(row[17]),
        showName: (row[7] || "").trim(),
        eventName: (row[7] || "").trim(),
        location: (row[8] || "").trim(),
        region: (row[9] || "").trim(),
        expectedStaff: parseNumber(row[18]),
        salesTarget: parseNumber(row[25]),
        masterSales: parseNumber(row[26]),
        spaceCost,
        logistics,
        totalUpfronts,
        country: "United Kingdom", // default, may be overridden by sales data
      };
    });

  // Parse UK Sales Entries
  const salesData = salesDataRows
    .filter(item => item && item.row && item.row.length >= 4)
    .map(item => {
      const row = item.row;
      return {
        date: parseUKSalesDate(row[0]),
        dateRaw: (row[0] || "").trim(),
        agentName: extractUKAgent(row[1], row[2]),
        location: (row[3] || "").trim(), // JOIN KEY: matches showName
        campaign: item.campaign,
        country: item.country,
        weekNum: item.weekNum,
        tabName: item.tabName,
      };
    })
    .filter(s => s.date && s.location);

  // Group sales by location (join key, case-insensitive)
  const salesByLocation = {};
  salesData.forEach(sale => {
    const key = sale.location.toLowerCase();
    if (!salesByLocation[key]) salesByLocation[key] = [];
    salesByLocation[key].push(sale);
  });

  // Join: compute live stats for each event (DATE-FILTERED)
  events.forEach(event => {
    const key = event.showName.toLowerCase();
    const allEventSales = salesByLocation[key] || [];

    let eventSales;
    if (event.startDate && event.endDate) {
      const rangeStart = new Date(event.startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(event.endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      eventSales = allEventSales.filter(sale => {
        if (!sale.date) return false;
        return sale.date >= rangeStart && sale.date <= rangeEnd;
      });
    } else {
      eventSales = allEventSales;
    }

    // Detect country from sales data (if HF IE tab, it's Ireland)
    const hasIrishSales = eventSales.some(s => s.country === "Ireland");
    if (hasIrishSales) event.country = "Ireland";

    event.liveSalesCount = eventSales.length;
    event.uniqueAgentNames = new Set(eventSales.map(s => s.agentName));
    event.uniqueAgents = event.uniqueAgentNames.size;
    event.staffFraction = `${event.uniqueAgents} / ${event.expectedStaff || "?"}`;
    event.cpa = event.liveSalesCount > 0 ? (event.totalUpfronts / event.liveSalesCount) : null;
    event._filteredSales = eventSales;
  });

  // Merge duplicate events within the same week
  const mergeMap = {};
  events.forEach(event => {
    const mergeKey = `${event.showName.toLowerCase()}|||${event.weekNum}`;
    if (!mergeMap[mergeKey]) {
      mergeMap[mergeKey] = { ...event, uniqueAgentNames: new Set(event.uniqueAgentNames || []) };
    } else {
      const merged = mergeMap[mergeKey];
      merged.salesTarget += event.salesTarget || 0;
      merged.expectedStaff += event.expectedStaff || 0;
      merged.totalUpfronts += event.totalUpfronts || 0;
      merged.masterSales += event.masterSales || 0;
      merged.liveDays = Math.max(merged.liveDays || 0, event.liveDays || 0);
      if (event.uniqueAgentNames) {
        event.uniqueAgentNames.forEach(name => merged.uniqueAgentNames.add(name));
      }
      if (event.startDate && (!merged.startDate || event.startDate < merged.startDate)) {
        merged.startDate = event.startDate;
        merged.startDateRaw = event.startDateRaw;
      }
      if (event.endDate && (!merged.endDate || event.endDate > merged.endDate)) {
        merged.endDate = event.endDate;
        merged.endDateRaw = event.endDateRaw;
      }
    }
  });

  const mergedEvents = Object.values(mergeMap).map(event => {
    event.uniqueAgents = event.uniqueAgentNames.size;
    event.staffFraction = `${event.uniqueAgents} / ${event.expectedStaff || "?"}`;
    event.liveSalesCount = event.liveSalesCount || 0;
    event.cpa = event.liveSalesCount > 0 ? (event.totalUpfronts / event.liveSalesCount) : null;
    return event;
  });

  // Determine available weeks
  const weekNums = [...new Set(mergedEvents.map(e => e.weekNum).filter(Boolean))];
  weekNums.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    return numA - numB;
  });

  // Determine current week by date overlap
  const today = new Date();
  const currentMonday = getWeekMonday(today);
  const currentSunday = getWeekSunday(currentMonday);
  let currentWeek = null;
  for (const event of mergedEvents) {
    if (event.startDate && event.endDate) {
      if (event.startDate <= currentSunday && event.endDate >= currentMonday) {
        currentWeek = event.weekNum;
        break;
      }
    }
  }

  const activeWeek = selectedWeek || currentWeek || weekNums[weekNums.length - 1] || "WK1";
  const activeWeekNum = parseInt((activeWeek || "").replace(/\D/g, ""), 10);
  const nextWeekLabel = `WK${activeWeekNum + 1}`;

  const thisWeekEvts = mergedEvents.filter(e => e.weekNum === activeWeek);
  const nextWeekEvts = mergedEvents.filter(e => e.weekNum === nextWeekLabel);

  // Build leaderboard from date-filtered sales
  const weekSalesForLeaderboard = thisWeekEvts.flatMap(e => e._filteredSales || []);

  const todayStr = formatDateForUKSales(today);
  const todaySalesForLeaderboard = weekSalesForLeaderboard.filter(s => s.dateRaw && s.dateRaw.startsWith(todayStr));

  function buildLeaderboard(salesList) {
    const byEvent = {};
    salesList.forEach(sale => {
      const eventKey = sale.location || "Unknown";
      if (!byEvent[eventKey]) byEvent[eventKey] = {};
      if (!byEvent[eventKey][sale.agentName]) {
        byEvent[eventKey][sale.agentName] = 0;
      }
      byEvent[eventKey][sale.agentName]++;
    });

    return Object.entries(byEvent).map(([eventName, agents]) => ({
      campaign: eventName,
      top3: Object.entries(agents)
        .map(([name, sales]) => ({ name, sales, revenue: 0, conversionRate: 0, rank: 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    }));
  }

  const dailyLeaderboard = buildLeaderboard(todaySalesForLeaderboard);
  const weeklyLeaderboard = buildLeaderboard(weekSalesForLeaderboard);

  // Process TMM Telesales separately
  const tmmSales = tmmSalesRows
    .filter(item => item && item.row && item.row.length >= 2)
    .map(item => {
      const row = item.row;
      return {
        date: parseUKSalesDate(row[0]),
        dateRaw: (row[0] || "").trim(),
        agentName: extractUKAgent(row[1], row[2]),
        weekNum: item.weekNum,
      };
    })
    .filter(s => s.date);

  const tmmTodayCount = tmmSales.filter(s => s.dateRaw && s.dateRaw.startsWith(todayStr)).length;
  const tmmWeekCount = tmmSales.filter(s => s.weekNum === activeWeek).length;

  // Transform events to dashboard shape
  function toEventShape(event) {
    let status = "upcoming";
    if (event.startDate && event.endDate) {
      if (today >= event.startDate && today <= event.endDate) status = "live";
      else if (today > event.endDate) status = "completed";
    }

    return {
      id: event.id,
      name: event.showName,
      venue: event.location,
      location: event.location,
      region: event.region,
      date: `${event.startDateRaw} - ${event.endDateRaw}`,
      rawDate: event.startDate || new Date(),
      ticketsSold: event.liveSalesCount,
      revenue: event.totalUpfronts,
      target: event.salesTarget,
      status,
      campaign: event.client,
      country: event.country,
      staffFraction: event.staffFraction,
      uniqueAgents: event.uniqueAgents,
      expectedStaff: event.expectedStaff,
      cpa: event.cpa,
      totalUpfronts: event.totalUpfronts,
      salesTarget: event.salesTarget,
      masterSales: event.masterSales,
      weekNum: event.weekNum,
    };
  }

  // Build by-country and "All" views
  const thisWeekShaped = thisWeekEvts.map(toEventShape);
  const nextWeekShaped = nextWeekEvts.map(toEventShape);

  const ukEvents = thisWeekShaped.filter(e => e.country === "United Kingdom");
  const ieEvents = thisWeekShaped.filter(e => e.country === "Ireland");
  const nextUkEvents = nextWeekShaped.filter(e => e.country === "United Kingdom");
  const nextIeEvents = nextWeekShaped.filter(e => e.country === "Ireland");

  // Build recent sales for live ticker
  const recentSales = weekSalesForLeaderboard
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 20)
    .map((sale, i) => ({
      id: `sale-${i}-${sale.dateRaw}`,
      eventName: sale.location,
      venue: sale.location,
      agentName: sale.agentName,
      product: sale.agentName,
      amount: 0,
      time: sale.dateRaw,
      country: sale.country,
    }));

  return {
    data: {
      thisWeekEvents: {
        "United Kingdom": ukEvents,
        "Ireland": ieEvents,
        "All": thisWeekShaped,
      },
      nextWeekEvents: {
        "United Kingdom": nextUkEvents,
        "Ireland": nextIeEvents,
        "All": nextWeekShaped,
      },
      dailySales: { "All": dailyLeaderboard },
      weeklySales: { "All": weeklyLeaderboard },
      campaignBreakdown: [],
      tmmTelesales: {
        todayCount: tmmTodayCount,
        weekCount: tmmWeekCount,
        activeWeek,
      },
    },
    availableWeeks: weekNums,
    currentWeek: currentWeek || weekNums[weekNums.length - 1] || "WK1",
    recentSales,
  };
}

// ── Data Generators (Mock — kept for reference) ──────────────────────
function generateEvents(country, count, weekOffset = 0) {
  const venueList = VENUES[country];
  if (!venueList) return [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const monday = new Date(baseDate);
  monday.setDate(monday.getDate() - monday.getDay() + 1);

  return Array.from({ length: count }, (_, i) => {
    const eventDate = new Date(monday);
    eventDate.setDate(eventDate.getDate() + randInt(0, 6));
    return {
      id: `${country}-${weekOffset}-${i}`,
      name: `${pick(CAMPAIGNS)} - ${country}`,
      venue: venueList[i % venueList.length],
      date: eventDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      rawDate: eventDate,
      ticketsSold: randInt(40, 380),
      revenue: randInt(2800, 28000),
      target: randInt(300, 500),
      status: pick(["live", "live", "live", "upcoming", "completed"]),
      campaign: pick(CAMPAIGNS),
      country,
    };
  }).sort((a, b) => a.rawDate - b.rawDate);
}

function generateSalespeople(country, period) {
  const names = SALES_NAMES[country];
  if (!names) return [];
  return CAMPAIGNS.map(campaign => ({
    campaign,
    top3: shuffle(names).slice(0, 3).map((name, i) => ({
      name,
      sales: period === "day" ? randInt(4, 32) : randInt(18, 160),
      revenue: period === "day" ? randInt(280, 3200) : randInt(1400, 16000),
      conversionRate: randFloat(12, 48),
      rank: i + 1,
    })).sort((a, b) => b.sales - a.sales).map((p, i) => ({ ...p, rank: i + 1 })),
  }));
}

function generateCampaignBreakdown() {
  return CAMPAIGNS.map(campaign => ({
    campaign,
    products: PRODUCTS.feedingPlans.map(plan => ({
      name: plan, type: "Feeding Plan", unitsSold: randInt(20, 400),
      revenue: randInt(1400, 28000), avgOrderValue: randFloat(28, 120), returnRate: randFloat(0.5, 6),
    })).concat(PRODUCTS.boxTypes.map(box => ({
      name: box, type: "Box Type", unitsSold: randInt(15, 320),
      revenue: randInt(900, 22000), avgOrderValue: randFloat(18, 95), returnRate: randFloat(0.8, 5),
    }))),
    totalRevenue: randInt(12000, 80000),
    totalUnits: randInt(200, 2400),
  }));
}

function generateLiveSale(events) {
  const liveEvents = events.flat().filter(e => e.status === "live");
  if (!liveEvents.length) return null;
  const event = pick(liveEvents);
  return {
    id: Date.now() + Math.random(),
    eventName: event.name,
    venue: event.venue,
    product: pick([...PRODUCTS.feedingPlans, ...PRODUCTS.boxTypes]),
    amount: randFloat(18, 120),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function generateNotification(events, salesData) {
  const currencySymbol = "\u00a3";

  const templates = [
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      const event = liveEvts.length ? pick(liveEvts) : null;
      if (!event) return null;
      return { type: "milestone", message: `${event.name} at ${event.venue} hit ${event.ticketsSold} sales!` };
    },
    () => {
      const allSales = Object.values(salesData).flatMap(camps => camps.flatMap(c => c.top3));
      const top = allSales.sort((a, b) => b.sales - a.sales)[0];
      if (!top) return null;
      return { type: "highPerformer", message: `${top.name} is leading with ${top.sales} sales today` };
    },
    () => {
      const upcoming = events.flat().filter(e => e.status === "upcoming");
      const event = upcoming.length ? pick(upcoming) : null;
      if (!event) return null;
      return { type: "eventAlert", message: `${event.name} at ${event.venue} starting soon` };
    },
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      const event = liveEvts.length ? pick(liveEvts) : null;
      if (!event) return null;
      const pct = event.target > 0 ? Math.round((event.ticketsSold / event.target) * 100) : 0;
      if (pct > 80) return { type: "milestone", message: `${event.venue} is at ${pct}% of target!` };
      if (pct < 30) return { type: "warning", message: `${event.venue} only at ${pct}% of target \u2014 needs attention` };
      return { type: "info", message: `${event.venue} currently at ${pct}% of daily target` };
    },
    () => {
      const liveEvts = events.flat().filter(e => e.status === "live");
      if (!liveEvts.length) return null;
      const totalRev = liveEvts.reduce((s, e) => s + e.revenue, 0);
      return { type: "info", message: `Total live upfronts across all events: ${currencySymbol}${totalRev.toLocaleString()}` };
    },
  ];

  const template = pick(templates);
  const result = template();
  if (!result) return null;

  return { id: Date.now() + Math.random(), ...result, timestamp: new Date(), read: false };
}

// ── Notification Types ───────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  milestone: { icon: "\u{1F3AF}", color: "#FBC500", label: "Milestone" },
  highPerformer: { icon: "\u2b50", color: "#BE6CFF", label: "Achievement" },
  eventAlert: { icon: "\u{1F4E1}", color: "#FF00B1", label: "Event" },
  warning: { icon: "\u26a0\ufe0f", color: "#ef4444", label: "Alert" },
  info: { icon: "\u2139\ufe0f", color: "#3CB6BA", label: "Info" },
};

// ── Custom Hooks ─────────────────────────────────────────────────────
function useStableData() {
  const dataRef = useRef(null);
  if (!dataRef.current) {
    dataRef.current = {
      thisWeekEvents: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateEvents(c, randInt(3, 5), 0) }), {}),
      nextWeekEvents: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateEvents(c, randInt(3, 5), 1) }), {}),
      dailySales: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateSalespeople(c, "day") }), {}),
      weeklySales: COUNTRIES.reduce((acc, c) => ({ ...acc, [c]: generateSalespeople(c, "week") }), {}),
      campaignBreakdown: generateCampaignBreakdown(),
    };
  }
  return { data: dataRef.current, loading: false, error: null };
}

function useGoogleSheetsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const isFirstFetch = useRef(true);

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) return;
    try {
      if (isFirstFetch.current) setLoading(true);

      // Fetch master tracker and discover sales tabs in parallel
      const [masterRes, { eventSalesTabs, tmmTabs }] = await Promise.all([
        fetch(MASTER_TRACKER_URL),
        discoverSalesTabGids(),
      ]);

      if (!masterRes.ok) throw new Error(`Master tracker: HTTP ${masterRes.status}`);

      // Fetch all sales tab CSVs in parallel
      const [masterText, salesDataRows, tmmSalesRows] = await Promise.all([
        masterRes.text(),
        fetchAllSalesTabs(eventSalesTabs),
        fetchAllSalesTabs(tmmTabs),
      ]);

      const masterRows = parseCSV(masterText);

      const processed = processDataUK(masterRows, salesDataRows, tmmSalesRows, selectedWeek);

      setData(processed.data);
      setAvailableWeeks(processed.availableWeeks);
      setCurrentWeek(processed.currentWeek);
      if (!selectedWeek) setSelectedWeek(processed.currentWeek);
      setRecentSales(processed.recentSales);
      setLastUpdated(new Date());
      setError(null);
      isFirstFetch.current = false;
    } catch (err) {
      setError(err.message);
      isFirstFetch.current = false;
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdated, availableWeeks, selectedWeek, setSelectedWeek, currentWeek, recentSales };
}

function useLiveSales(thisWeekEvents) {
  const [liveSales, setLiveSales] = useState([]);
  const eventsRef = useRef(thisWeekEvents);
  eventsRef.current = thisWeekEvents;

  useEffect(() => {
    if (!USE_MOCK_DATA) return;
    const interval = setInterval(() => {
      const allEvents = Object.values(eventsRef.current);
      const sale = generateLiveSale(allEvents);
      if (sale) setLiveSales(prev => [sale, ...prev].slice(0, 20));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return liveSales;
}

function useNotifications(events, salesData) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventsRef = useRef(events);
  const salesRef = useRef(salesData);
  eventsRef.current = events;
  salesRef.current = salesData;

  useEffect(() => {
    const genInterval = () => randInt(8000, 15000);
    let timeout;

    const tick = () => {
      const notification = generateNotification(
        Object.values(eventsRef.current),
        salesRef.current
      );
      if (notification) {
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      }
      timeout = setTimeout(tick, genInterval());
    };

    timeout = setTimeout(tick, genInterval());
    return () => clearTimeout(timeout);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}

function useWeatherData(venues) {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  useEffect(() => {
    if (!WEATHER_ENABLED || !venues.length) return;

    const fetchWeather = async () => {
      setLoading(true);
      const results = {};
      const now = Date.now();

      const uniqueVenues = [...new Set(venues)];

      for (const venue of uniqueVenues) {
        const cached = cacheRef.current[venue];
        if (cached && (now - cached.timestamp) < WEATHER_CACHE_TTL) {
          results[venue] = cached.data;
          continue;
        }

        const coords = VENUE_COORDINATES[venue];
        if (!coords) continue;

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const weatherInfo = {
            temp: Math.round(data.main.temp),
            icon: data.weather[0]?.icon,
            description: data.weather[0]?.description,
          };
          results[venue] = weatherInfo;
          cacheRef.current[venue] = { data: weatherInfo, timestamp: now };
        } catch {
          results[venue] = { error: true };
        }
      }

      setWeatherData(results);
      setLoading(false);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, WEATHER_CACHE_TTL);
    return () => clearInterval(interval);
  }, [venues.join(",")]);

  return { weatherData, weatherLoading: loading };
}

function useLeafletLoader() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.L) {
      setLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load map library");
    document.head.appendChild(script);
  }, []);

  return { leafletLoaded: loaded, leafletError: error };
}

// ── Presentational Components ────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    live: { bg: "#2d0020", text: "#FF00B1", dot: "#FF00B1" },
    upcoming: { bg: "#1a0d2e", text: "#BE6CFF", dot: "#BE6CFF" },
    completed: { bg: "#1a1a2e", text: "#64748b", dot: "#64748b" },
  };
  const c = colors[status] || colors.upcoming;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, animation: "pulse 1.5s infinite" }} />}
      {status}
    </span>
  );
};

const ProgressBar = ({ value, max, color = "#FF00B1" }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const icons = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };
  return <span style={{ fontSize: 18 }}>{icons[rank]}</span>;
};

const SectionHeader = ({ children, icon, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 900, color: "#f1f5f9", margin: 0, display: "flex", alignItems: "center", gap: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
      <span style={{ fontSize: 20 }}>{icon}</span> {children}
    </h2>
    {subtitle && <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0 30px", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>{subtitle}</p>}
  </div>
);

const CountryTab = ({ country, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 18px", borderRadius: 8, border: active ? "1px solid #FF00B144" : "1px solid #1e293b",
    background: active ? "linear-gradient(135deg, #2d0020, #0a1628)" : "transparent",
    color: active ? "#FF00B1" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 700,
    fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", gap: 6,
    transition: "all 0.2s ease", textTransform: "uppercase", letterSpacing: 0.5,
  }}>
    <span style={{ fontSize: 16 }}>{FLAGS[country]}</span> {country}
  </button>
);

const Card = ({ children, style = {}, accentColor }) => (
  <div style={{
    background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 22,
    ...(accentColor ? { borderTop: `2px solid ${accentColor}` } : {}),
    ...style,
  }}>
    {children}
  </div>
);

const LiveSaleTicker = ({ sales }) => {
  if (!sales.length) return null;
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, position: "relative" }}>
      {sales.slice(0, 8).map((sale, i) => (
        <div key={sale.id} style={{
          minWidth: 220, padding: "10px 14px", background: "linear-gradient(135deg, #2d0020, #0a1628)",
          border: "1px solid #FF00B122", borderRadius: 10, animation: i === 0 ? "slideIn 0.4s ease" : "none",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ color: "#FF00B1", fontSize: 13, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>{sale.agentName || sale.product}</span>
            <span style={{ color: "#475569", fontSize: 10 }}>{sale.time}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "'Montserrat', sans-serif" }}>{sale.eventName}</span>
            {sale.country && (
              <span style={{ fontSize: 12 }}>{FLAGS[sale.country] || ""}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationBell = ({ unreadCount, onClick }) => (
  <button onClick={onClick} style={{
    position: "relative", background: "none", border: "none",
    cursor: "pointer", fontSize: 20, color: "#94a3b8",
    padding: 4, transition: "transform 0.2s ease",
  }}>
    {"\u{1F514}"}
    {unreadCount > 0 && (
      <span style={{
        position: "absolute", top: -4, right: -6,
        minWidth: 18, height: 18, borderRadius: 9,
        background: "#ef4444", color: "#fff",
        fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 4px",
        animation: "pulse 1.5s infinite",
        boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
      }}>
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </button>
);

const NotificationItem = ({ notification, onMarkRead }) => {
  const typeInfo = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  return (
    <div
      onClick={() => onMarkRead(notification.id)}
      style={{
        display: "flex", gap: 12, padding: "12px 16px",
        borderLeft: `3px solid ${typeInfo.color}`,
        background: notification.read ? "transparent" : "#0d1117",
        cursor: "pointer",
        borderBottom: "1px solid #111827",
        transition: "background 0.2s ease",
        animation: "notificationSlide 0.3s ease",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{typeInfo.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: notification.read ? "#64748b" : "#e2e8f0", margin: 0, lineHeight: 1.5 }}>
          {notification.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: typeInfo.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {typeInfo.label}
          </span>
          <span style={{ fontSize: 10, color: "#475569" }}>{timeAgo(notification.timestamp)}</span>
        </div>
      </div>
      {!notification.read && (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeInfo.color, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
};

const NotificationPanel = ({ notifications, isOpen, onClose, onMarkAllRead, onMarkRead }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef} style={{
      position: "fixed", top: 70, right: 32,
      width: 380, maxHeight: "70vh",
      background: "linear-gradient(135deg, #0d1117, #111827)",
      border: "1px solid #1e293b",
      borderRadius: 14,
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      zIndex: 200,
      overflow: "hidden",
      animation: "slideDown 0.2s ease",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: "1px solid #1e293b",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Montserrat', sans-serif" }}>Notifications</span>
        <button onClick={onMarkAllRead} style={{
          background: "none", border: "none", color: "#FF00B1", fontSize: 11,
          cursor: "pointer", fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
        }}>
          Mark all read
        </button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <p style={{ color: "#475569", fontSize: 13, padding: 20, textAlign: "center", margin: 0 }}>No notifications yet</p>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} />
          ))
        )}
      </div>
    </div>
  );
};

const EventMap = ({ events, leafletLoaded, leafletError }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const rotationRef = useRef(null);
  const activeRegionsRef = useRef([]);
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    }).setView(MAP_REGIONS.UK.center, MAP_REGIONS.UK.zoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (rotationRef.current) {
      clearInterval(rotationRef.current);
      rotationRef.current = null;
    }

    const regionHasEvents = { UK: false, IE: false };

    events.forEach(event => {
      let coords = VENUE_COORDINATES[event.venue];

      // Fallback: try region name
      if (!coords && event.region) {
        coords = REGION_COORDINATES[event.region];
      }

      if (!coords) return;

      // Determine region
      const country = event.country || "United Kingdom";
      if (country === "Ireland") {
        regionHasEvents.IE = true;
      } else {
        regionHasEvents.UK = true;
      }

      const statusColor = {
        live: "#FF00B1",
        upcoming: "#BE6CFF",
        completed: "#64748b",
      }[event.status] || "#64748b";

      const currSym = getCurrencySymbol(country);

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: event.status === "live" ? 10 : 7,
        fillColor: statusColor,
        color: "#3CB6BA",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      const statusLabel = event.status.charAt(0).toUpperCase() + event.status.slice(1);
      const statusDot = event.status === "live" ? '<span style="color:#FF00B1">\u25cf</span>' : event.status === "upcoming" ? '<span style="color:#BE6CFF">\u25cf</span>' : '<span style="color:#64748b">\u25cf</span>';

      marker.bindPopup(
        `<div style="font-family:'Montserrat',sans-serif;min-width:180px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:#f1f5f9">${event.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">\ud83d\udccd ${event.venue}${event.region ? `, ${event.region}` : ""}</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">\ud83d\udcc6 ${event.date}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px">${statusDot} ${statusLabel}</span>
            <span style="font-size:11px;color:#94a3b8">${FLAGS[country] || ""}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #1e293b;padding-top:6px;margin-top:4px">
            <span style="font-size:12px;color:#3CB6BA;font-weight:600">${event.ticketsSold} sales</span>
            <span style="font-size:12px;color:#FF00B1;font-weight:600">${currSym}${event.revenue.toLocaleString()}</span>
          </div>
        </div>`,
        { className: "croci-popup" }
      );

      markersRef.current.push(marker);
    });

    // Build list of active regions
    const regions = [];
    if (regionHasEvents.UK) regions.push(MAP_REGIONS.UK);
    if (regionHasEvents.IE) regions.push(MAP_REGIONS.IE);
    activeRegionsRef.current = regions;
    setCurrentRegionIndex(0);

    if (regions.length > 0) {
      map.setView(regions[0].center, regions[0].zoom, { animate: false });
    }

    if (regions.length > 1) {
      rotationRef.current = setInterval(() => {
        setCurrentRegionIndex(prev => {
          const next = (prev + 1) % activeRegionsRef.current.length;
          const region = activeRegionsRef.current[next];
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(region.center, region.zoom, { duration: 2.0 });
          }
          return next;
        });
      }, MAP_ROTATION_INTERVAL);
    }
  }, [events, leafletLoaded]);

  if (leafletError) {
    return (
      <Card style={{ marginBottom: 28 }}>
        <SectionHeader icon="\ud83d\uddfa\ufe0f" subtitle="Geographic overview of UK & Ireland event locations">Event Map</SectionHeader>
        <p style={{ color: "#ef4444", fontSize: 13 }}>Map unavailable: {leafletError}</p>
      </Card>
    );
  }

  if (!leafletLoaded) {
    return (
      <Card style={{ marginBottom: 28 }}>
        <SectionHeader icon="\ud83d\uddfa\ufe0f" subtitle="Geographic overview of UK & Ireland event locations">Event Map</SectionHeader>
        <div style={{
          width: "100%", height: 400, borderRadius: 10, overflow: "hidden",
          background: "linear-gradient(90deg, #0a0f1a 25%, #111827 50%, #0a0f1a 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#475569", fontSize: 13 }}>Loading map...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 28 }}>
      <SectionHeader icon="\ud83d\uddfa\ufe0f" subtitle="Geographic overview of UK & Ireland event locations">Event Map</SectionHeader>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF00B1", display: "inline-block" }} /> Live
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#BE6CFF", display: "inline-block" }} /> Upcoming
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748b", display: "inline-block" }} /> Completed
          </span>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div ref={mapRef} style={{
          width: "100%",
          height: 400,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid #1e293b",
        }} />
        {activeRegionsRef.current.length > 1 && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 8, zIndex: 1000,
          }}>
            {activeRegionsRef.current.map((region, i) => (
              <div key={region.label} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i === currentRegionIndex ? "#FF00B1" : "#475569",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        )}
        {activeRegionsRef.current.length > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 10px",
            fontSize: 11, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600, letterSpacing: 0.5,
          }}>
            {activeRegionsRef.current[currentRegionIndex]?.label || "UK & Ireland"}
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Croci Logo (inline SVG) ──────────────────────────────────────────
const CrociLogo = ({ height = 28, color = "#FF00B1" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 269.69" height={height} style={{ display: "block" }}>
    <path fill={color} d="M91.02,13.3c-3.75-4.12-8.87-7.36-15.36-9.74C69.16,1.19,60.8,0,50.56,0S31.95,1.19,25.46,3.56c-6.5,2.38-11.61,5.62-15.36,9.74C6.35,17.42,3.73,22.23,2.23,27.72.73,33.22,0,38.96,0,44.95v179.79c0,5.99.75,11.74,2.25,17.23,1.5,5.49,4.12,10.3,7.87,14.42,3.75,4.12,8.86,7.37,15.36,9.74,6.49,2.37,14.85,3.56,25.1,3.56s18.6-1.19,25.1-3.56c6.49-2.37,11.61-5.62,15.36-9.74,3.75-4.12,6.37-8.93,7.87-14.42,1.5-5.49,2.25-11.24,2.25-17.23v-78.66H56.21v83.16c0,4.49-1.87,6.74-5.62,6.74s-5.62-2.25-5.62-6.74V40.45c0-4.49,1.87-6.74,5.62-6.74s5.62,2.25,5.62,6.74v68.17h44.95V44.95c0-5.99-.75-11.74-2.25-17.23-1.5-5.49-4.12-10.3-7.87-14.42Z"/>
    <path fill={color} d="M176.8,152.18l-.75-6.93c6.99-1.28,12.79-3.28,17.42-5.97,4.62-2.7,8.24-5.97,10.86-9.82,2.62-3.85,4.43-8.22,5.43-13.1.99-4.88,1.5-9.89,1.5-15.03V45.08c0-6.16-.75-11.94-2.25-17.34-1.5-5.39-4.12-10.14-7.87-14.26-3.75-4.1-8.87-7.38-15.36-9.82C179.28,1.22,170.92,0,160.68,0h-50.57v269.69h44.95V146.4h6.74l11.24,123.29h45.7l-13.11-117.51h-28.84ZM166.31,109.38c0,4.49-1.87,6.74-5.62,6.74h-5.62V37.46h5.62c3.75,0,5.62,2.25,5.62,6.74v65.18Z"/>
    <path fill={color} d="M312.39,13.3c-3.75-4.12-8.87-7.36-15.36-9.74C290.53,1.19,282.17,0,271.93,0s-18.61,1.19-25.1,3.56c-6.5,2.38-11.61,5.62-15.36,9.74-3.75,4.12-6.37,8.93-7.87,14.42-1.5,5.5-2.25,11.24-2.25,17.23v179.79c0,5.99.75,11.74,2.25,17.23,1.5,5.49,4.12,10.3,7.87,14.42,3.75,4.12,8.86,7.37,15.36,9.74,6.49,2.37,14.86,3.56,25.1,3.56s18.6-1.19,25.1-3.56c6.49-2.37,11.61-5.62,15.36-9.74,3.75-4.12,6.37-8.93,7.87-14.42,1.5-5.49,2.25-11.24,2.25-17.23V44.95c0-5.99-.75-11.74-2.25-17.23-1.5-5.49-4.12-10.3-7.87-14.42ZM277.56,229.24c0,4.49-1.87,6.74-5.62,6.74s-5.62-2.25-5.62-6.74V40.45c0-4.49,1.87-6.74,5.62-6.74s5.62,2.25,5.62,6.74v188.79Z"/>
    <path fill={color} d="M432.63,108.63V54.99c-14.75-3.09-26.01-16.2-26.06-31.74-.02-6.59,1.83-12.69,5.04-17.81-1.41-.67-2.89-1.3-4.46-1.87C400.65,1.19,392.29,0,382.05,0s-18.61,1.19-25.1,3.56c-6.5,2.38-11.61,5.62-15.36,9.74-3.75,4.12-6.37,8.93-7.87,14.42-1.5,5.5-2.25,11.24-2.25,17.23v179.79c0,5.99.75,11.74,2.25,17.23,1.5,5.49,4.12,10.3,7.87,14.42,3.75,4.12,8.86,7.37,15.36,9.74,6.49,2.37,14.86,3.56,25.1,3.56s18.6-1.19,25.1-3.56c6.49-2.37,11.61-5.62,15.36-9.74,3.75-4.12,6.37-8.93,7.87-14.42,1.5-5.49,2.25-11.24,2.25-17.23v-78.66h-44.95v83.16c0,4.49-1.87,6.74-5.62,6.74s-5.62-2.25-5.62-6.74V40.45c0-4.49,1.87-6.74,5.62-6.74s5.62,2.25,5.62,6.74v68.17h44.95Z"/>
    <path fill={color} d="M470.09,269.69h-28.44V55.68h28.44c9.43,0,17.07,7.64,17.07,17.08v179.86c0,9.43-7.64,17.07-17.07,17.07"/>
    <path fill={color} d="M512,25.88c-1,2.73-1.67,5.64-3.05,8.17-4.97,9.12-15.96,13.46-25.9,10.49-10.17-3.03-16.89-12.69-16.17-23.22.71-10.35,8.63-19,18.89-20.63,12.29-1.95,23.57,6,25.86,18.21.07.37.24.73.37,1.09v5.89Z"/>
    <path fill={color} d="M439.37.4c12.38-.02,22.53,10.02,22.59,22.37.06,12.43-10.04,22.61-22.5,22.69-12.36.08-22.6-10.02-22.64-22.32-.04-12.68,9.93-22.72,22.56-22.75"/>
  </svg>
);

// ── World Clocks Component (London / Dublin / New York) ──────────────
function WorldClocks({ currentTime }) {
  const zones = [
    { city: "London", tz: "Europe/London", abbr: "GMT" },
    { city: "Dublin", tz: "Europe/Dublin", abbr: "IST" },
    { city: "New York", tz: "America/New_York", abbr: "ET" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      {zones.map(({ city, tz, abbr }) => {
        const localStr = currentTime.toLocaleString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: false });
        const parts = localStr.split(":");
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseInt(parts[2], 10);
        const hourDeg = ((h % 12) + m / 60) * 30;
        const minDeg = (m + s / 60) * 6;
        const secDeg = s * 6;
        const size = 52;
        const cx = size / 2;
        const cy = size / 2;

        function hand(length, deg, width, color, round) {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x2 = cx + length * Math.cos(rad);
          const y2 = cy + length * Math.sin(rad);
          return (
            <line x1={cx} y1={cy} x2={x2} y2={y2}
              stroke={color} strokeWidth={width}
              strokeLinecap={round ? "round" : "butt"}
            />
          );
        }

        const markers = [];
        for (let i = 0; i < 12; i++) {
          const angle = ((i * 30 - 90) * Math.PI) / 180;
          const outer = cx - 3;
          const inner = i % 3 === 0 ? cx - 7 : cx - 5;
          markers.push(
            <line key={i}
              x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)}
              x2={cx + outer * Math.cos(angle)} y2={cy + outer * Math.sin(angle)}
              stroke={i % 3 === 0 ? "#94a3b8" : "#334155"}
              strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
              strokeLinecap="round"
            />
          );
        }

        const digitalTime = currentTime.toLocaleTimeString("en-US", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true,
        });

        return (
          <div key={city} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: size, height: size, borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #111827, #060a10)",
              border: "1.5px solid #1e293b",
              boxShadow: "0 0 12px rgba(255,0,177,0.08), inset 0 1px 2px rgba(255,255,255,0.03)",
              position: "relative",
            }}>
              <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
                {markers}
                {hand(14, hourDeg, 2.2, "#e2e8f0", true)}
                {hand(19, minDeg, 1.5, "#94a3b8", true)}
                {hand(20, secDeg, 0.6, "#FF00B1", false)}
                <circle cx={cx} cy={cy} r={2} fill="#FF00B1" />
                <circle cx={cx} cy={cy} r={0.8} fill="#060a10" />
              </svg>
            </div>
            <div style={{ textAlign: "center", lineHeight: 1.2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.5, fontFamily: "'Montserrat', sans-serif" }}>
                {digitalTime}
              </div>
              <div style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Montserrat', sans-serif" }}>
                {city}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Password Gate Component ──────────────────────────────────────────
function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem("croci_auth_uk") === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  if (!PASSWORD_PROTECTED || authenticated) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem("croci_auth_uk", "true");
      setAuthenticated(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
      `}</style>
      <div style={{
        animation: shaking ? "shake 0.5s ease" : "fadeUp 0.6s ease",
        textAlign: "center", padding: 40,
        background: "linear-gradient(135deg, #0d111788, #0a0f1a88)",
        border: "1px solid #1e293b", borderRadius: 20,
        backdropFilter: "blur(20px)",
        width: "100%", maxWidth: 400,
      }}>
        <div style={{ margin: "0 auto 20px", filter: "drop-shadow(0 4px 20px rgba(255,0,177,0.3))" }}>
          <CrociLogo height={44} color="#FF00B1" />
        </div>
        <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 28px", letterSpacing: 2.5, textTransform: "uppercase", fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
          UK & Ireland Operations Portal
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter team password"
            autoFocus
            style={{
              width: "100%", padding: "14px 18px",
              background: "#0a0f1a", border: `1px solid ${error ? "#ef4444" : "#1e293b"}`,
              borderRadius: 10, color: "#f1f5f9", fontSize: 14,
              fontFamily: "'Montserrat', sans-serif",
              outline: "none", transition: "border-color 0.2s ease",
              marginBottom: 12,
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = "#FF00B1"; }}
            onBlur={(e) => { if (!error) e.target.style.borderColor = "#1e293b"; }}
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 12px" }}>
              Incorrect password. Please try again.
            </p>
          )}
          <button type="submit" style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg, #FF00B1, #cc008e)",
            border: "none", borderRadius: 10,
            color: "#000", fontSize: 14, fontWeight: 700,
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer", transition: "opacity 0.2s ease",
          }}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Access Dashboard
          </button>
        </form>
        <p style={{ fontSize: 10, color: "#334155", margin: "20px 0 0" }}>
          Internal use only. Contact your manager for access.
        </p>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────
export default function CrociPortal() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);

  // Data hooks
  const mockResult = useStableData();
  const sheetsResult = useGoogleSheetsData();

  const activeResult = USE_MOCK_DATA ? mockResult : sheetsResult;
  const { data, loading: sheetsLoading, error: sheetsError, lastUpdated, availableWeeks, selectedWeek, setSelectedWeek, currentWeek, recentSales } = {
    ...sheetsResult,
    ...activeResult,
    data: activeResult.data,
  };

  const { thisWeekEvents = {}, nextWeekEvents = {}, dailySales = {}, weeklySales = {}, tmmTelesales = {} } = data || {};

  const liveSales = useLiveSales(thisWeekEvents);
  const displaySales = USE_MOCK_DATA ? liveSales : (recentSales || []);

  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(thisWeekEvents, dailySales);
  const { leafletLoaded, leafletError } = useLeafletLoader();

  const allVenues = useMemo(() => {
    const venues = new Set();
    Object.values(thisWeekEvents).flat().forEach(e => venues.add(e.venue));
    Object.values(nextWeekEvents).flat().forEach(e => venues.add(e.venue));
    return [...venues];
  }, [thisWeekEvents, nextWeekEvents]);

  const { weatherData, weatherLoading } = useWeatherData(allVenues);

  const allThisWeekEvents = useMemo(() =>
    (thisWeekEvents["All"] || []).sort((a, b) => a.rawDate - b.rawDate),
    [thisWeekEvents]
  );

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const allEvents = thisWeekEvents["All"] || [];
  const totalUpfronts = allEvents.reduce((s, e) => s + e.revenue, 0);
  const totalSales = allEvents.reduce((s, e) => s + e.ticketsSold, 0);
  const liveCount = allEvents.filter(e => e.status === "live").length;

  const thisWeekHeaders = ["Event", "Location", "Region", "Dates", "Status", "Sales / Target", "Staff", "CPA"];

  const kpis = [
    { label: "Live Events", value: liveCount, color: "#FF00B1", icon: "\ud83d\udce1" },
    { label: "Total Sales", value: totalSales.toLocaleString(), color: "#3CB6BA", icon: "\ud83d\uded2" },
    { label: "Total Upfronts", value: `\u00a3${totalUpfronts.toLocaleString()}`, color: "#FBC500", icon: "\ud83d\udcb0" },
    { label: "Events This Week", value: allEvents.length, color: "#BE6CFF", icon: "\ud83d\udccb" },
  ];

  // Loading state
  if (!USE_MOCK_DATA && sheetsLoading && !data) {
    return (
      <PasswordGate>
        <div style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Montserrat', sans-serif",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ margin: "0 auto 20px", filter: "drop-shadow(0 4px 20px rgba(255,0,177,0.3))" }}>
              <CrociLogo height={40} color="#FF00B1" />
            </div>
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading UK & Ireland live data...</p>
            <div style={{ width: 200, height: 4, background: "#1e293b", borderRadius: 2, margin: "16px auto", overflow: "hidden" }}>
              <div style={{ width: "40%", height: "100%", background: "#FF00B1", borderRadius: 2, animation: "shimmer 1.5s infinite" }} />
            </div>
          </div>
        </div>
      </PasswordGate>
    );
  }

  return (
    <PasswordGate>
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 40%, #080d16 100%)",
      color: "#e2e8f0",
      fontFamily: "'Montserrat', sans-serif",
      padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes notificationSlide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        * { box-sizing: border-box; }
        .leaflet-popup-content-wrapper { background: #0d1117 !important; border: 1px solid #1e293b; border-radius: 10px !important; color: #e2e8f0; font-family: 'Montserrat', sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important; }
        .leaflet-popup-tip { background: #0d1117 !important; }
        .leaflet-popup-content { margin: 12px 16px !important; font-size: 12px; line-height: 1.6; }
        .leaflet-popup-close-button { color: #64748b !important; }
        .leaflet-popup-close-button:hover { color: #e2e8f0 !important; }
        .leaflet-control-attribution { background: rgba(10,15,26,0.8) !important; color: #475569 !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: #64748b !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        padding: "16px clamp(16px, 3vw, 32px)",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(90deg, #060a10ee, #0d1117ee)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        gap: 12,
      }}>
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CrociLogo height={32} color="#FF00B1" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>UK & Ireland Operations Portal</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF00B1", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 9, color: "#FF00B1", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center-Right: World Clocks */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <WorldClocks currentTime={currentTime} />

          <div style={{ width: 1, height: 48, background: "linear-gradient(180deg, transparent, #1e293b, transparent)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NotificationBell unreadCount={unreadCount} onClick={(e) => { e.stopPropagation(); setNotifOpen(prev => !prev); }} />
            {!USE_MOCK_DATA && lastUpdated && (
              <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.3, textAlign: "center" }}>
                <div style={{ color: "#64748b", fontWeight: 500 }}>Updated</div>
                <div>{timeAgo(lastUpdated)}</div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif" }}>
                {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification Panel ────────────────────────── */}
      <NotificationPanel
        notifications={notifications}
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
      />

      <div style={{ padding: "24px clamp(16px, 3vw, 32px)", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── Error Banner ───────────────────────────────── */}
        {!USE_MOCK_DATA && sheetsError && (
          <div style={{
            padding: "12px 20px", marginBottom: 20,
            background: "#1a0a0a", border: "1px solid #ef4444", borderRadius: 10,
          }}>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Data error: {sheetsError}. {data ? "Showing cached data." : "Retrying..."}
            </span>
          </div>
        )}

        {/* ── KPI Strip ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {kpis.map((kpi, i) => (
            <Card key={i} accentColor={kpi.color} style={{ animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>{kpi.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: kpi.color, margin: 0, fontFamily: "'Montserrat', sans-serif" }}>{kpi.value}</p>
                </div>
                <span style={{ fontSize: 24 }}>{kpi.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* ── TMM Telesales Card ────────────────────────── */}
        {!USE_MOCK_DATA && tmmTelesales && (tmmTelesales.todayCount > 0 || tmmTelesales.weekCount > 0) && (
          <Card accentColor="#BE6CFF" style={{ marginBottom: 28 }}>
            <SectionHeader icon="\ud83d\udcde" subtitle="The Modern Milkman telesales activity (not linked to field events)">TMM Telesales</SectionHeader>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Today</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#BE6CFF", fontFamily: "'Montserrat', sans-serif" }}>{tmmTelesales.todayCount}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{tmmTelesales.activeWeek || "This Week"}</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#BE6CFF", fontFamily: "'Montserrat', sans-serif" }}>{tmmTelesales.weekCount}</span>
              </div>
            </div>
          </Card>
        )}

        {/* ── Event Map ───────────────────────────────── */}
        <EventMap events={allThisWeekEvents} leafletLoaded={leafletLoaded} leafletError={leafletError} />

        {/* ── Live Sales Ticker ────────────────────────── */}
        <Card style={{ marginBottom: 28, boxShadow: "0 0 30px rgba(255, 0, 177, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF00B1", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FF00B1", textTransform: "uppercase", letterSpacing: 1 }}>
              Recent Sales Entries
            </span>
          </div>
          <LiveSaleTicker sales={displaySales} />
          {displaySales.length === 0 && <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Waiting for incoming sales...</p>}
        </Card>

        {/* ═══════════ SECTION 1: THIS WEEK'S EVENTS ═══════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease" }}>
          <SectionHeader icon="\ud83d\udcc5" subtitle="All live and scheduled events with real-time sales data">
            {`Events \u2014 ${selectedWeek || "This Week"}`}
          </SectionHeader>

          {/* Week Picker */}
          {!USE_MOCK_DATA && availableWeeks && availableWeeks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Week:</label>
              <select
                value={selectedWeek || ""}
                onChange={(e) => setSelectedWeek(e.target.value)}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "#0a0f1a", border: "1px solid #1e293b",
                  color: "#e2e8f0", fontSize: 13,
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: "pointer", outline: "none",
                }}
              >
                {availableWeeks.map(wk => (
                  <option key={wk} value={wk}>
                    {wk}{wk === currentWeek ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
              <thead>
                <tr>
                  {thisWeekHeaders.map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, borderBottom: "1px solid #1e293b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(thisWeekEvents["All"] || []).map((event, i) => {
                  const currSym = getCurrencySymbol(event.country);
                  return (
                    <tr key={event.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, transition: "background 0.2s ease", cursor: "default" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#0d1117"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                        {event.name}
                        {event.country === "Ireland" && <span style={{ marginLeft: 6, fontSize: 12 }}>{FLAGS["Ireland"]}</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.location || event.venue}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{event.region}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{event.date}</td>
                      <td style={{ padding: "12px 14px" }}><StatusBadge status={event.status} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#3CB6BA", fontVariantNumeric: "tabular-nums" }}>{event.ticketsSold}</span>
                          <span style={{ color: "#475569", fontSize: 12 }}>/ {event.target || "?"}</span>
                          <ProgressBar value={event.ticketsSold} max={event.target || 1} color={event.target > 0 && event.ticketsSold >= event.target ? "#FF00B1" : "#3CB6BA"} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: event.uniqueAgents >= event.expectedStaff && event.expectedStaff > 0 ? "#FF00B1" : "#FBC500" }}>
                          {event.staffFraction}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {event.cpa !== null
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: event.cpa <= 80 ? "#FF00B1" : event.cpa <= 150 ? "#FBC500" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>{currSym}{event.cpa.toFixed(2)}</span>
                          : <span style={{ color: "#475569", fontSize: 12 }}>--</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!USE_MOCK_DATA && (thisWeekEvents["All"] || []).length === 0 && (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No events found for {selectedWeek}</p>
            )}
          </div>
        </Card>

        {/* ═══════════ SECTION 2: LEADERBOARD — TODAY ═══════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.1s both" }}>
          <SectionHeader icon="\ud83c\udfc6" subtitle="Top performers by event \u2014 based on live sales entries">Today's Leaderboard</SectionHeader>
          <div>
            {(dailySales["All"] || []).length === 0 ? (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No sales recorded for today yet</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {(dailySales["All"] || []).map(camp => (
                  <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                    {camp.top3.map(person => (
                      <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                        <RankBadge rank={person.rank} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                          <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ═══════════ SECTION 3: LEADERBOARD — THIS WEEK ═══════════ */}
        <Card style={{ marginBottom: 28, animation: "scaleIn 0.4s ease 0.15s both" }}>
          <SectionHeader icon="\ud83d\udcca" subtitle={`Cumulative performance for ${selectedWeek || "this week"}`}>
            {`${selectedWeek || "Week"} Leaderboard`}
          </SectionHeader>
          <div>
            {(weeklySales["All"] || []).length === 0 ? (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>No sales data for {selectedWeek} events yet</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {(weeklySales["All"] || []).map(camp => (
                  <div key={camp.campaign} style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{camp.campaign}</p>
                    {camp.top3.map(person => (
                      <div key={person.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #111827" }}>
                        <RankBadge rank={person.rank} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{person.name}</p>
                          <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{person.sales} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ═══════════ SECTION 4: NEXT WEEK'S EVENTS ═══════════ */}
        <Card style={{ marginBottom: 40, animation: "scaleIn 0.4s ease 0.25s both" }}>
          <SectionHeader icon="\ud83d\udd2e" subtitle="Events scheduled for next week">
            {`Next Week (WK${(parseInt((selectedWeek || "WK0").replace(/\D/g, ""), 10) || 0) + 1})`}
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {(nextWeekEvents["All"] || []).length === 0 ? (
              <p style={{ color: "#475569", fontSize: 13, padding: 10 }}>No events scheduled for next week yet</p>
            ) : (
              (nextWeekEvents["All"] || []).map(event => (
                <div key={event.id} style={{
                  background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 10, padding: 14,
                  display: "flex", flexDirection: "column", gap: 6,
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2d3748"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                      {event.name}
                      {event.country === "Ireland" && <span style={{ marginLeft: 6, fontSize: 12 }}>{FLAGS["Ireland"]}</span>}
                    </p>
                    <StatusBadge status="upcoming" />
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{"\ud83d\udccd"} {event.location || event.venue}{event.region ? `, ${event.region}` : ""}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{"\ud83d\udcc6"} {event.date}</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>Target: {event.target || "?"} sales</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "20px 0 40px", borderTop: "1px solid #111827" }}>
          <p style={{ fontSize: 11, color: "#334155", margin: 0, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
            Croci UK & Ireland Operations Portal {`\u00b7 Live data from Google Sheets${lastUpdated ? ` \u00b7 Last refreshed ${timeAgo(lastUpdated)}` : ""}`}
          </p>
        </div>
      </div>
    </div>
    </PasswordGate>
  );
}
