import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Configuration ────────────────────────────────────────────────────
const MASTER_TRACKER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTSl_qewLiD5ZN1BOMxHJlTUUe2jt1bohmSjiJ9hPEHJN2YvNvZzghKO5Mix-IgiudjAR-rGwFCctzC/pub?gid=0&single=true&output=csv";
const SALES_PUBHTML_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjExpxy5r3r3hWi4Oe1ne8u_tu0BVqPzRPWIh0k2zwsgR0btJu1gbXHZoDp97Gz8AE0d3Ms9CeD1rL/pubhtml";
const SALES_CSV_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjExpxy5r3r3hWi4Oe1ne8u_tu0BVqPzRPWIh0k2zwsgR0btJu1gbXHZoDp97Gz8AE0d3Ms9CeD1rL/pub";
const REFRESH_INTERVAL = 60 * 1000; // 60 seconds for TV
const SHOUTOUT_INTERVAL = 8000; // 8 seconds between cards

// ── Map Region ───────────────────────────────────────────────────────
const MAP_REGION_UK = { center: [54.0, -4.0], zoom: 5 };

// ── Venue Coordinates ────────────────────────────────────────────────
const VENUE_COORDINATES = {
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
  "P&J Live": { lat: 57.1647, lng: -2.0863 },
  "EICC": { lat: 55.9476, lng: -3.2069 },
  "ICC Wales": { lat: 51.5866, lng: -2.9938 },
  "Arena Birmingham": { lat: 52.4801, lng: -1.9083 },
  "London Olympia": { lat: 51.4960, lng: -0.2098 },
  "Harrogate Convention Centre": { lat: 53.9926, lng: -1.5345 },
  "Telford International Centre": { lat: 52.6793, lng: -2.4489 },
  "Sandown Park": { lat: 51.3764, lng: -0.3567 },
  "NAEC Stoneleigh": { lat: 52.3558, lng: -1.5109 },
  "Bath & West Showground": { lat: 51.1454, lng: -2.7093 },
  "Three Counties Showground": { lat: 52.0566, lng: -2.2373 },
  "Kent Event Centre": { lat: 51.2547, lng: 0.5376 },
  "Royal Highland Centre": { lat: 55.9412, lng: -3.3810 },
  "Alexandra Palace": { lat: 51.5936, lng: -0.1306 },
  "ICC Birmingham": { lat: 52.4796, lng: -1.9085 },
  "Bournemouth International Centre": { lat: 50.7173, lng: -1.8741 },
  "BIC": { lat: 50.7173, lng: -1.8741 },
  "Great Yorkshire Showground": { lat: 53.9930, lng: -1.5370 },
  "FIVE": { lat: 51.5085, lng: 0.0295 },
  "RDS Dublin": { lat: 53.3270, lng: -6.2290 },
  "Cork City Hall": { lat: 51.8969, lng: -8.4707 },
  "Galway Racecourse": { lat: 53.2830, lng: -8.9890 },
  "Convention Centre Dublin": { lat: 53.3478, lng: -6.2388 },
  "CCD": { lat: 53.3478, lng: -6.2388 },
  "Limerick Milk Market": { lat: 52.6610, lng: -8.6303 },
  "Citywest Hotel": { lat: 53.2920, lng: -6.4322 },
  "Croke Park": { lat: 53.3633, lng: -6.2514 },
  "3Arena Dublin": { lat: 53.3478, lng: -6.2276 },
};

const REGION_COORDINATES = {
  "London": { lat: 51.5074, lng: -0.1278 },
  "South East": { lat: 51.3, lng: 0.5 },
  "South West": { lat: 50.9, lng: -3.2 },
  "East Midlands": { lat: 52.8, lng: -1.2 },
  "West Midlands": { lat: 52.5, lng: -1.9 },
  "North West": { lat: 53.6, lng: -2.5 },
  "North East": { lat: 54.9, lng: -1.6 },
  "Yorkshire": { lat: 53.9, lng: -1.5 },
  "Wales": { lat: 52.1, lng: -3.6 },
  "Scotland": { lat: 56.5, lng: -4.2 },
  "Ireland": { lat: 53.3, lng: -7.5 },
  "Dublin": { lat: 53.3498, lng: -6.2603 },
};

const FLAGS = { "United Kingdom": "\ud83c\uddec\ud83c\udde7", "Ireland": "\ud83c\uddee\ud83c\uddea" };

function getCurrencySymbol(country) {
  return country === "Ireland" ? "\u20ac" : "\u00a3";
}

// ── CSV Parser ───────────────────────────────────────────────────────
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

// ── Date & Number Helpers ────────────────────────────────────────────
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

function parseUKSalesDate(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
  }
  const match2 = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match2) return new Date(+match2[1], +match2[2] - 1, +match2[3]);
  return null;
}

function extractUKAgent(col1, col2) {
  const a1 = (col1 || "").trim();
  const a2 = (col2 || "").trim();
  if (a1 && a1 !== "*Not Listed") return a1;
  if (a2 && a2 !== "*Not Listed") return a2;
  return "Unknown";
}

function normalizeWeekNum(str) {
  if (!str) return "";
  const match = str.match(/WK\s*0?(\d+)/i);
  return match ? `WK${match[1]}` : str.trim();
}

function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^0-9.\-]/g, "")) || 0;
}

function parsePoundCurrency(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[\u00a3\u20ac$,\s]/g, "")) || 0;
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ── Sales Tab Discovery ──────────────────────────────────────────────
async function discoverSalesTabGids() {
  try {
    const response = await fetch(SALES_PUBHTML_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const tabPattern = /id="sheet-button-(\d+)"[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
    const eventSalesTabs = [];
    const tmmTabs = [];
    let match;
    while ((match = tabPattern.exec(html)) !== null) {
      const gid = match[1];
      const name = match[2].trim();
      const weekMatch = name.match(/WK\s*(\d+)/i);
      if (!weekMatch) continue;
      const weekNum = `WK${parseInt(weekMatch[1], 10)}`;
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
    if (eventSalesTabs.length > 0 || tmmTabs.length > 0) return { eventSalesTabs, tmmTabs };
  } catch (err) {
    console.warn("Tab discovery failed:", err);
  }
  return { eventSalesTabs: [], tmmTabs: [] };
}

async function fetchAllSalesTabs(tabs) {
  const results = await Promise.all(tabs.map(async (tab) => {
    try {
      const res = await fetch(`${SALES_CSV_BASE_URL}?gid=${tab.gid}&single=true&output=csv`);
      if (!res.ok) return [];
      const text = await res.text();
      return parseCSV(text).slice(2).map(row => ({
        row, tabName: tab.name, campaign: tab.campaign, country: tab.country, weekNum: tab.weekNum,
      }));
    } catch { return []; }
  }));
  return results.flat();
}

// ── Process Data (UK) ────────────────────────────────────────────────
function processDataUK(masterRows, salesDataRows, tmmSalesRows) {
  const masterData = masterRows.slice(1);
  const today = new Date();
  const currentMonday = getWeekMonday(today);
  const currentSunday = getWeekSunday(currentMonday);
  const todayStr = formatDateForUKSales(today);

  const events = masterData
    .filter(row => {
      if (!row || row.length < 10) return false;
      const status = (row[2] || "").trim().toUpperCase();
      const showName = (row[7] || "").trim();
      return status === "BOOKED" && showName && !showName.toUpperCase().includes("WEEK BREAK");
    })
    .map((row, index) => ({
      id: `event-${index}`,
      client: (row[6] || "").trim(),
      weekNum: normalizeWeekNum(row[3]),
      startDate: parseMasterDate(row[4]),
      endDate: parseMasterDate(row[5]),
      startDateRaw: (row[4] || "").trim(),
      endDateRaw: (row[5] || "").trim(),
      liveDays: parseNumber(row[17]),
      showName: (row[7] || "").trim(),
      location: (row[8] || "").trim(),
      region: (row[9] || "").trim(),
      expectedStaff: parseNumber(row[18]),
      salesTarget: parseNumber(row[25]),
      totalUpfronts: parsePoundCurrency(row[29]) + parsePoundCurrency(row[30]),
      country: "United Kingdom",
    }));

  // Parse sales
  const salesData = salesDataRows
    .filter(item => item?.row?.length >= 4)
    .map(item => ({
      date: parseUKSalesDate(item.row[0]),
      dateRaw: (item.row[0] || "").trim(),
      agentName: extractUKAgent(item.row[1], item.row[2]),
      location: (item.row[3] || "").trim(),
      campaign: item.campaign,
      country: item.country,
      weekNum: item.weekNum,
    }))
    .filter(s => s.date && s.location);

  // Group sales by location
  const salesByLocation = {};
  salesData.forEach(sale => {
    const key = sale.location.toLowerCase();
    if (!salesByLocation[key]) salesByLocation[key] = [];
    salesByLocation[key].push(sale);
  });

  // Join sales to events (date-filtered)
  events.forEach(event => {
    const allSales = salesByLocation[event.showName.toLowerCase()] || [];
    let eventSales = allSales;
    if (event.startDate && event.endDate) {
      const rs = new Date(event.startDate); rs.setHours(0,0,0,0);
      const re = new Date(event.endDate); re.setHours(23,59,59,999);
      eventSales = allSales.filter(s => s.date && s.date >= rs && s.date <= re);
    }
    if (eventSales.some(s => s.country === "Ireland")) event.country = "Ireland";
    event.liveSalesCount = eventSales.length;
    event.uniqueAgents = new Set(eventSales.map(s => s.agentName)).size;
    event._filteredSales = eventSales;
  });

  // Merge duplicates
  const mergeMap = {};
  events.forEach(event => {
    const key = `${event.showName.toLowerCase()}|||${event.weekNum}`;
    if (!mergeMap[key]) {
      mergeMap[key] = { ...event };
    } else {
      const m = mergeMap[key];
      m.salesTarget += event.salesTarget || 0;
      m.expectedStaff += event.expectedStaff || 0;
      m.totalUpfronts += event.totalUpfronts || 0;
    }
  });
  const mergedEvents = Object.values(mergeMap);

  // Find current week
  let currentWeek = null;
  for (const e of mergedEvents) {
    if (e.startDate && e.endDate && e.startDate <= currentSunday && e.endDate >= currentMonday) {
      currentWeek = e.weekNum; break;
    }
  }
  const weekNums = [...new Set(mergedEvents.map(e => e.weekNum).filter(Boolean))];
  weekNums.sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));
  const activeWeek = currentWeek || weekNums[weekNums.length - 1] || "WK1";

  const thisWeekEvts = mergedEvents.filter(e => e.weekNum === activeWeek);

  // Determine statuses
  thisWeekEvts.forEach(e => {
    if (e.startDate && e.endDate) {
      if (today >= e.startDate && today <= e.endDate) e.status = "live";
      else if (today > e.endDate) e.status = "completed";
      else e.status = "upcoming";
    } else {
      e.status = "upcoming";
    }
  });

  // Leaderboard: all sales from this week's events
  const weekSales = thisWeekEvts.flatMap(e => e._filteredSales || []);
  const todaySales = weekSales.filter(s => s.dateRaw?.startsWith(todayStr));

  // Build agent leaderboard for today
  const agentCounts = {};
  todaySales.forEach(s => {
    agentCounts[s.agentName] = (agentCounts[s.agentName] || 0) + 1;
  });
  const topAgentsToday = Object.entries(agentCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Top event today
  const eventSalesToday = {};
  todaySales.forEach(s => {
    eventSalesToday[s.location] = (eventSalesToday[s.location] || 0) + 1;
  });
  const topEventToday = Object.entries(eventSalesToday)
    .sort((a, b) => b[1] - a[1])[0];

  // Recent sales (newest first)
  const recentSales = weekSales
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 30);

  // TMM stats
  const tmmSales = tmmSalesRows
    .filter(item => item?.row?.length >= 2)
    .map(item => ({
      date: parseUKSalesDate(item.row[0]),
      dateRaw: (item.row[0] || "").trim(),
      agentName: extractUKAgent(item.row[1], item.row[2]),
      weekNum: item.weekNum,
    }))
    .filter(s => s.date);

  const tmmTodayCount = tmmSales.filter(s => s.dateRaw?.startsWith(todayStr)).length;

  // Milestone checks
  const milestones = [];
  // Agent milestones
  Object.entries(agentCounts).forEach(([name, count]) => {
    if (count === 10 || count === 20 || count === 30 || count === 50) {
      milestones.push({ type: "milestone", agentName: name, count, message: `${name} just hit ${count} sales!` });
    }
  });
  // Team milestone
  const totalTodaySales = todaySales.length;
  if (totalTodaySales > 0 && totalTodaySales % 25 === 0) {
    milestones.push({ type: "teamMilestone", count: totalTodaySales, message: `Team hit ${totalTodaySales} sales today!` });
  }

  return {
    thisWeekEvts,
    totalSalesToday: todaySales.length,
    totalSalesWeek: weekSales.length,
    liveCount: thisWeekEvts.filter(e => e.status === "live").length,
    staffOnSite: thisWeekEvts.reduce((s, e) => s + e.uniqueAgents, 0),
    topAgentsToday,
    topEventToday: topEventToday ? { name: topEventToday[0], sales: topEventToday[1] } : null,
    recentSales,
    milestones,
    tmmTodayCount,
    activeWeek,
  };
}

// ── Shoutout Card Hook ───────────────────────────────────────────────
function useShoutoutRotation(data) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState([]);

  useEffect(() => {
    if (!data) return;
    const cards = [];

    // New Sale Alert (from most recent sales)
    if (data.recentSales.length > 0) {
      const recent = data.recentSales[0];
      cards.push({
        type: "newSale",
        agentName: recent.agentName,
        eventName: recent.location,
        country: recent.country,
      });
    }

    // Top Seller Spotlight
    if (data.topAgentsToday.length > 0) {
      cards.push({
        type: "topSeller",
        agentName: data.topAgentsToday[0].name,
        salesCount: data.topAgentsToday[0].count,
      });
    }

    // Milestone cards
    data.milestones.forEach(m => {
      cards.push({ type: "milestone", message: m.message, count: m.count });
    });

    // If no milestones, add a team total card
    if (data.milestones.length === 0 && data.totalSalesToday > 0) {
      cards.push({
        type: "milestone",
        message: `${data.totalSalesToday} sales today across all events!`,
        count: data.totalSalesToday,
      });
    }

    // Event Spotlight (top event)
    if (data.topEventToday) {
      const event = data.thisWeekEvts.find(e => e.showName === data.topEventToday.name || e.location === data.topEventToday.name);
      cards.push({
        type: "eventSpotlight",
        eventName: data.topEventToday.name,
        sales: data.topEventToday.sales,
        target: event?.salesTarget || 0,
        location: event?.location || "",
      });
    }

    // If there are live events, add another sale from recent
    if (data.recentSales.length > 1) {
      const sale = data.recentSales[1];
      cards.push({
        type: "newSale",
        agentName: sale.agentName,
        eventName: sale.location,
        country: sale.country,
      });
    }

    setDeck(cards.length > 0 ? cards : [{ type: "waiting", message: "Waiting for sales data..." }]);
    setCurrentIndex(0);
  }, [data]);

  useEffect(() => {
    if (deck.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % deck.length);
    }, SHOUTOUT_INTERVAL);
    return () => clearInterval(interval);
  }, [deck.length]);

  return deck[currentIndex] || null;
}

// ── Leaflet Loader ───────────────────────────────────────────────────
function useLeafletLoader() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (window.L) { setLoaded(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);
  return loaded;
}

// ── TV Map Component ─────────────────────────────────────────────────
function TVMap({ events, leafletLoaded }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: false, scrollWheelZoom: false, dragging: false,
      touchZoom: false, doubleClickZoom: false, boxZoom: false,
      keyboard: false, attributionControl: false,
    }).setView(MAP_REGION_UK.center, MAP_REGION_UK.zoom);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "", maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    events.forEach(event => {
      let coords = VENUE_COORDINATES[event.location] || VENUE_COORDINATES[event.showName] || REGION_COORDINATES[event.region];
      if (!coords) return;

      const color = event.status === "live" ? "#FF00B1" : event.status === "upcoming" ? "#BE6CFF" : "#64748b";
      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: event.status === "live" ? 10 : 7,
        fillColor: color, color: "#3CB6BA", weight: 2, opacity: 0.9, fillOpacity: 0.6,
      }).addTo(map);
      markersRef.current.push(marker);
    });
  }, [events, leafletLoaded]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }} />;
}

// ── Croci Logo ───────────────────────────────────────────────────────
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

// ── Shoutout Card Renderer ───────────────────────────────────────────
function ShoutoutCard({ card }) {
  if (!card) return null;

  if (card.type === "newSale") {
    return (
      <div style={{
        animation: "slideIn 0.6s ease",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", textAlign: "center", padding: 32,
      }}>
        <div style={{
          fontSize: 56, fontWeight: 900, color: "#FF00B1",
          fontFamily: "'Montserrat', sans-serif",
          animation: "saleFlash 2s ease infinite",
          textShadow: "0 0 30px rgba(255,0,177,0.5)",
          marginBottom: 20,
        }}>
          SALE!
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, fontFamily: "'Montserrat', sans-serif" }}>
          {card.agentName}
        </div>
        <div style={{ fontSize: 16, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          {card.eventName}
          {card.country && <span style={{ fontSize: 18 }}>{FLAGS[card.country] || ""}</span>}
        </div>
      </div>
    );
  }

  if (card.type === "topSeller") {
    return (
      <div style={{
        animation: "slideIn 0.6s ease",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", textAlign: "center", padding: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2b50"}</div>
        <div style={{ fontSize: 14, color: "#FBC500", textTransform: "uppercase", letterSpacing: 3, fontWeight: 700, marginBottom: 12, fontFamily: "'Montserrat', sans-serif" }}>
          Top Seller Today
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, fontFamily: "'Montserrat', sans-serif" }}>
          {card.agentName}
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#FBC500", fontFamily: "'Montserrat', sans-serif" }}>
          {card.salesCount} sales
        </div>
      </div>
    );
  }

  if (card.type === "milestone") {
    return (
      <div style={{
        animation: "slideIn 0.6s ease",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", textAlign: "center", padding: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\ud83d\udd25"}</div>
        <div style={{ fontSize: 14, color: "#FF00B1", textTransform: "uppercase", letterSpacing: 3, fontWeight: 700, marginBottom: 12, fontFamily: "'Montserrat', sans-serif" }}>
          Milestone
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.4 }}>
          {card.message}
        </div>
      </div>
    );
  }

  if (card.type === "eventSpotlight") {
    const pct = card.target > 0 ? Math.min(Math.round((card.sales / card.target) * 100), 100) : 0;
    return (
      <div style={{
        animation: "slideIn 0.6s ease",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", textAlign: "center", padding: 32,
      }}>
        <div style={{ fontSize: 14, color: "#3CB6BA", textTransform: "uppercase", letterSpacing: 3, fontWeight: 700, marginBottom: 12, fontFamily: "'Montserrat', sans-serif" }}>
          Event Spotlight
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>
          {card.eventName}
        </div>
        <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20, fontFamily: "'Montserrat', sans-serif" }}>
          {card.location}
        </div>
        <div style={{ width: "80%", maxWidth: 300, marginBottom: 12 }}>
          <div style={{ width: "100%", height: 12, background: "#1a1a2e", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #3CB6BA, #FF00B1)", borderRadius: 6, transition: "width 1s ease" }} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#3CB6BA", fontFamily: "'Montserrat', sans-serif" }}>
          {card.sales} / {card.target || "?"} sales ({pct}%)
        </div>
      </div>
    );
  }

  // Waiting / fallback
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", textAlign: "center", padding: 32,
    }}>
      <div style={{ fontSize: 14, color: "#475569", fontFamily: "'Montserrat', sans-serif" }}>
        {card.message || "Waiting for data..."}
      </div>
    </div>
  );
}

// ── Main TV Component ────────────────────────────────────────────────
export default function CrociTV() {
  const [data, setData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const leafletLoaded = useLeafletLoader();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [masterRes, { eventSalesTabs, tmmTabs }] = await Promise.all([
        fetch(MASTER_TRACKER_URL),
        discoverSalesTabGids(),
      ]);
      if (!masterRes.ok) throw new Error(`HTTP ${masterRes.status}`);
      const [masterText, salesRows, tmmRows] = await Promise.all([
        masterRes.text(),
        fetchAllSalesTabs(eventSalesTabs),
        fetchAllSalesTabs(tmmTabs),
      ]);
      const masterRows = parseCSV(masterText);
      const processed = processDataUK(masterRows, salesRows, tmmRows);
      setData(processed);
      setLoading(false);
    } catch (err) {
      console.error("Data fetch failed:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const shoutoutCard = useShoutoutRotation(data);

  // Loading screen
  if (loading && !data) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "#060a10",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');`}</style>
        <div style={{ textAlign: "center" }}>
          <CrociLogo height={48} color="#FF00B1" />
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 20 }}>Loading live data...</p>
        </div>
      </div>
    );
  }

  const events = data?.thisWeekEvts || [];

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "linear-gradient(180deg, #060a10 0%, #0a0f1a 100%)",
      fontFamily: "'Montserrat', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes saleFlash { 0%, 100% { text-shadow: 0 0 30px rgba(255,0,177,0.3); } 50% { text-shadow: 0 0 60px rgba(255,0,177,0.8); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .leaflet-popup-content-wrapper { background: #0d1117 !important; border: 1px solid #1e293b; border-radius: 10px !important; color: #e2e8f0; }
        .leaflet-popup-tip { background: #0d1117 !important; }
      `}</style>

      {/* ── TV Header ─────────────────────────────────── */}
      <div style={{
        height: 60, minHeight: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid #1e293b",
        background: "linear-gradient(90deg, #060a10, #0d1117)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <CrociLogo height={28} color="#FF00B1" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase" }}>
            UK & Ireland
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF00B1", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 11, color: "#FF00B1", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>
            {currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
            {currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
        </div>
      </div>

      {/* ── Main Content (60/40 split) ────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL: KPIs + Map ────────────────────── */}
        <div style={{ width: "58%", display: "flex", flexDirection: "column", padding: 24, gap: 20 }}>

          {/* KPI Grid 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "SALES TODAY", value: data?.totalSalesToday || 0, color: "#3CB6BA", icon: "\ud83d\uded2" },
              { label: "EVENTS LIVE", value: data?.liveCount || 0, color: "#FF00B1", icon: "\ud83d\udce1" },
              { label: "TOP EVENT", value: data?.topEventToday?.name || "--", isText: true, color: "#FBC500", icon: "\ud83c\udfc6", sub: data?.topEventToday ? `${data.topEventToday.sales} sales` : "" },
              { label: "STAFF ON SITE", value: data?.staffOnSite || 0, color: "#BE6CFF", icon: "\ud83d\udc65" },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: "linear-gradient(135deg, #0d1117, #111827)",
                border: "1px solid #1e293b", borderTop: `2px solid ${kpi.color}`,
                borderRadius: 12, padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>{kpi.label}</div>
                  {kpi.isText ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</div>
                      {kpi.sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{kpi.sub}</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: 48, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                  )}
                </div>
                <span style={{ fontSize: 28 }}>{kpi.icon}</span>
              </div>
            ))}
          </div>

          {/* Map */}
          <div style={{
            flex: 1, borderRadius: 12, overflow: "hidden",
            border: "1px solid #1e293b",
            background: "#0a0f1a",
            minHeight: 0,
          }}>
            {leafletLoaded ? (
              <TVMap events={events} leafletLoaded={leafletLoaded} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#475569", fontSize: 14 }}>Loading map...</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Shoutout Cards ───────────────── */}
        <div style={{
          width: "42%",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
          borderLeft: "1px solid #1e293b",
        }}>
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #0d1117, #111827)",
            border: "1px solid #1e293b",
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
          }}>
            <ShoutoutCard card={shoutoutCard} />
          </div>
        </div>
      </div>

      {/* ── Bottom Leaderboard Strip ──────────────────── */}
      <div style={{
        height: 56, minHeight: 56,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 40,
        borderTop: "1px solid #1e293b",
        background: "linear-gradient(90deg, #060a10, #0d1117)",
        padding: "0 32px",
      }}>
        <span style={{ fontSize: 12, color: "#64748b", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
          Today's Top 3
        </span>
        {(data?.topAgentsToday || []).length === 0 ? (
          <span style={{ fontSize: 14, color: "#475569" }}>No sales yet today</span>
        ) : (
          (data?.topAgentsToday || []).map((agent, i) => (
            <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{i === 0 ? "\ud83e\udd47" : i === 1 ? "\ud83e\udd48" : "\ud83e\udd49"}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{agent.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#3CB6BA" }}>({agent.count})</span>
            </div>
          ))
        )}
        {data?.tmmTodayCount > 0 && (
          <>
            <div style={{ width: 1, height: 24, background: "#1e293b" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#BE6CFF", fontWeight: 700, letterSpacing: 1 }}>TMM</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#BE6CFF" }}>{data.tmmTodayCount}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
