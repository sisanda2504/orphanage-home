/* Impact & Donation Map JavaScript Logic */

import { supabase } from './supabase-config.js';

// Pre-defined coordinates for popular cities to act as fallbacks/seeds
const seedLocations = [
  { name: "Cape Town, South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Johannesburg, South Africa", lat: -26.2041, lon: 28.0473 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Munich, Germany", lat: 48.1351, lon: 11.5820 },
  { name: "Toronto, Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Dublin, Ireland", lat: 53.3498, lon: -6.2603 },
  { name: "Durban, South Africa", lat: -29.8587, lon: 31.0218 }
];

// Initialize Leaflet Map
let map;
function initMap() {
  // Center map globally, zoom out
  map = L.map('map', {
    scrollWheelZoom: false
  }).setView([10, 15], 2);

  // Load a beautiful, light, sleek Mapbox/CartoDB tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

// Format Name (Mask email if no display name)
function formatDonorName(name, email) {
  if (name && name !== 'Anonymous' && name.trim() !== '') {
    return name;
  }
  if (email && email.trim() !== '') {
    const parts = email.split('@');
    if (parts[0].length <= 2) {
      return parts[0] + '***@' + parts[1];
    }
    return parts[0].substring(0, 2) + '***@' + parts[1];
  }
  return "Anonymous Benefactor";
}

// Process and Plot Donations
async function loadDonations() {
  const supporterTimeline = document.getElementById("supporterTimeline");
  const statTotalDonations = document.getElementById("statTotalDonations");
  const statSupporterCount = document.getElementById("statSupporterCount");
  const statCountriesCount = document.getElementById("statCountriesCount");

  try {
    // 1. Fetch completed donations (negative amount represents a payment/donation in the schema)
    // We order by created_at descending
    const { data: rawDonations, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter to focus on donations (we omit deposits, which are positive)
    const donations = (rawDonations || []).filter(d => d.amount < 0 || d.status === 'donation');

    // Stats variables
    let totalSum = 0;
    const uniqueSupporters = new Set();
    const uniqueCities = new Set();
    const plottedDonations = [];

    // Clear loading text
    supporterTimeline.innerHTML = "";

    if (donations.length === 0) {
      supporterTimeline.innerHTML = "<div class='loading-timeline'>No donations recorded yet. Be the first to donate!</div>";
      statTotalDonations.textContent = "R0.00";
      statSupporterCount.textContent = "0";
      statCountriesCount.textContent = "0";
      return;
    }

    // Loop through each donation to process coords and feed
    donations.forEach((d, index) => {
      const amount = Math.abs(parseFloat(d.amount));
      totalSum += amount;

      const donorName = formatDonorName(d.donor_name, d.user_email);
      uniqueSupporters.add(d.user_email || d.user_id || donorName);

      // Determine location and coordinates
      let locationName = d.location;
      let lat = d.latitude;
      let lon = d.longitude;

      // Seed mock location if database entry has no location coordinates
      if (!lat || !lon) {
        // Deterministically assign a seed location based on user ID or email hash
        const seedIndex = Math.abs(hashCode(d.user_email || d.user_id || "anon")) % seedLocations.length;
        const seed = seedLocations[seedIndex];
        locationName = locationName || seed.name;
        lat = seed.lat;
        lon = seed.lon;
      }

      uniqueCities.add(locationName);

      // Save processed donation details
      plottedDonations.push({
        id: d.id,
        name: donorName,
        amount: amount,
        location: locationName,
        message: d.message || "Supported Hopeful Hearts Orphanage",
        date: new Date(d.created_at),
        lat: lat,
        lon: lon
      });
    });

    // 2. Update Stats Counter Cards
    statTotalDonations.textContent = `R${totalSum.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    statSupporterCount.textContent = uniqueSupporters.size;
    statCountriesCount.textContent = uniqueCities.size;

    // 3. Render Timeline items (up to 15 items in timeline feed)
    const timelineList = plottedDonations.slice(0, 15);
    timelineList.forEach(item => {
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      
      // Get initials
      const initials = item.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

      timelineItem.innerHTML = `
        <div class="timeline-badge">${initials}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-donor">${item.name}</span>
            <span class="timeline-amount">R${item.amount.toFixed(2)}</span>
          </div>
          <span class="timeline-location">📍 ${item.location} • ${item.date.toLocaleDateString()}</span>
          ${item.message ? `<p class="timeline-message">"${item.message}"</p>` : ''}
        </div>
      `;
      supporterTimeline.appendChild(timelineItem);
    });

    // 4. Plot markers on map
    // We group multiple donations in the same city to display them nicely
    const locationGroups = {};
    plottedDonations.forEach(d => {
      const key = `${d.lat.toFixed(4)},${d.lon.toFixed(4)}`;
      if (!locationGroups[key]) {
        locationGroups[key] = {
          name: d.location,
          lat: d.lat,
          lon: d.lon,
          donations: []
        };
      }
      locationGroups[key].donations.push(d);
    });

    // Add markers with custom pulsing style
    Object.values(locationGroups).forEach(group => {
      const count = group.donations.length;
      const totalLocAmount = group.donations.reduce((sum, d) => sum + d.amount, 0);

      // Create Custom HTML Pulsing Icon
      const pulseIcon = L.divIcon({
        className: 'pulse-icon',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      // Construct popup HTML
      let popupContent = `
        <h4>📍 ${group.name}</h4>
        <p><strong>${count}</strong> supporter(s) helped from this location.</p>
        <p>Total Raised: <strong>R${totalLocAmount.toFixed(2)}</strong></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 8px 0;" />
        <div style="max-height: 120px; overflow-y: auto; padding-right: 4px;">
      `;

      group.donations.forEach(don => {
        popupContent += `
          <div style="font-size: 0.8rem; margin-bottom: 6px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 4px;">
            <div style="display:flex; justify-content:space-between; font-weight:600;">
              <span>${don.name}</span>
              <span style="color:#ea580c">R${don.amount.toFixed(2)}</span>
            </div>
            <div style="color:#64748b; font-style:italic; margin-top:2px;">"${don.message}"</div>
          </div>
        `;
      });
      popupContent += `</div>`;

      // Plot
      const marker = L.marker([group.lat, group.lon], { icon: pulseIcon }).addTo(map);
      marker.bindPopup(popupContent);
    });

  } catch (err) {
    console.error("Donation Map loading error:", err);
    supporterTimeline.innerHTML = `<div class='loading-timeline' style='color:#ef4444;'>❌ Failed to load donation database. Check database connection or RLS permissions.</div>`;
  }
}

// Simple String Hash Function
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// On Load
window.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadDonations();
});
