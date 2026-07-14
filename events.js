/* Events Calendar JavaScript Logic */

import { supabase } from './supabase-config.js';

// Fallback Default Events (relative to current date so countdown always works)
const getFallbackEvents = () => {
  const now = new Date();
  return [
    {
      id: 101,
      name: "Food Drive",
      description: "Help pack and sort donated food items and pantry supplies for distribution to local shelters and families in need.",
      date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 4 days from now
      location: "Hopeful Hearts Community Center",
      max_attendees: 50,
      registered: 18
    },
    {
      id: 102,
      name: "Career Day",
      description: "Inspire our youth! Share your career journey, answer questions, and mentor our high-school age teenagers.",
      date: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 9 days from now
      location: "Main Assembly Hall",
      max_attendees: 30,
      registered: 29
    },
    {
      id: 103,
      name: "Birthday Celebrations",
      description: "Let's celebrate the birthdays of all our children born this month with cake, balloons, games, and gift-giving!",
      date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 15 days from now
      location: "Recreational Playroom",
      max_attendees: 60,
      registered: 45
    },
    {
      id: 104,
      name: "Sports Day",
      description: "A fun-filled day of track races, soccer tournaments, tug-of-war, and team-building games with the children.",
      date: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 22 days from now
      location: "Hope Sports Field",
      max_attendees: 100,
      registered: 76
    },
    {
      id: 105,
      name: "Fundraising Dinner",
      description: "An elegant charity dinner and silent auction. Hear speeches highlighting our achievements. All proceeds fund children care.",
      date: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 32 days from now
      location: "The Grand Dining Hall",
      max_attendees: 80,
      registered: 35
    }
  ];
};

let eventsList = [];
let userRsvps = []; // List of event IDs that the user has RSVP'd to
let currentUser = null;
let isLocalMode = false;
let countdownInterval = null;

// DOM elements
const eventsGrid = document.getElementById("eventsGrid");
const eventMessage = document.getElementById("eventMessage");
const countdownBanner = document.getElementById("countdownBanner");
const countdownTimer = document.getElementById("countdownTimer");
const countdownEventName = document.getElementById("countdownEventName");

// Check Authentication and load page data
async function initEventsPage() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
  } catch (err) {
    console.warn("Auth check failed, operating in offline mode:", err);
  }

  await loadEventsData();
  renderEvents();
  startCountdown();
}

// Load events and RSVPs (Database with localStorage fallback)
async function loadEventsData() {
  // 1. Load Events
  try {
    const { data: dbEvents, error: dbError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (dbError) throw dbError;

    if (dbEvents && dbEvents.length > 0) {
      eventsList = dbEvents.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date,
        location: e.location,
        max_attendees: e.max_attendees,
        registered: e.registered
      }));
      isLocalMode = false;
    } else {
      // Empty table, load from seed / local
      loadFallbackEvents();
    }
  } catch (err) {
    console.warn("Supabase events table query failed. Falling back to local/localStorage storage:", err.message);
    isLocalMode = true;
    loadFallbackEvents();
  }

  // 2. Load RSVPs
  if (currentUser) {
    if (!isLocalMode) {
      try {
        const { data: dbRsvps, error: rsvpError } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', currentUser.id);

        if (rsvpError) throw rsvpError;
        userRsvps = (dbRsvps || []).map(r => r.event_id);
      } catch (err) {
        console.warn("Supabase RSVPs query failed, falling back to local storage RSVPs:", err);
        loadLocalRsvps();
      }
    } else {
      loadLocalRsvps();
    }
  }
}

// Load fallback events from localStorage/Seed
function loadFallbackEvents() {
  let localEvents = localStorage.getItem("hh_events");
  if (localEvents) {
    try {
      eventsList = JSON.parse(localEvents);
      // Map keys from admin dashboard: admin dashboard uses camelCase maxAttendees, public html uses snake_case max_attendees
      eventsList = eventsList.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description || e.description,
        date: e.date,
        location: e.location,
        max_attendees: e.maxAttendees !== undefined ? e.maxAttendees : (e.max_attendees || 100),
        registered: e.registered || 0
      }));
    } catch {
      eventsList = getFallbackEvents();
    }
  } else {
    eventsList = getFallbackEvents();
    localStorage.setItem("hh_events", JSON.stringify(eventsList));
  }
}

// Load user RSVPs from LocalStorage
function loadLocalRsvps() {
  const localRsvps = localStorage.getItem(`hh_rsvps_${currentUser.id}`);
  if (localRsvps) {
    try {
      userRsvps = JSON.parse(localRsvps);
    } catch {
      userRsvps = [];
    }
  } else {
    userRsvps = [];
  }
}

// Save local RSVP state
function saveLocalRsvps() {
  localStorage.setItem(`hh_rsvps_${currentUser.id}`, JSON.stringify(userRsvps));
}

// Save local Events state (bridges public calendar & admin local dashboard)
function saveLocalEvents() {
  const adminFormattedList = eventsList.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    date: e.date,
    location: e.location,
    maxAttendees: e.max_attendees,
    registered: e.registered
  }));
  localStorage.setItem("hh_events", JSON.stringify(adminFormattedList));
}

// Get themed CSS class based on event name
function getBannerThemeClass(name) {
  const lower = name.toLowerCase();
  if (lower.includes("food")) return "food-drive";
  if (lower.includes("career") || lower.includes("job")) return "career-day";
  if (lower.includes("birthday") || lower.includes("party")) return "birthday";
  if (lower.includes("sport") || lower.includes("game") || lower.includes("day")) return "sports-day";
  return "dinner";
}

// Render Event Cards
function renderEvents() {
  eventsGrid.innerHTML = "";

  // Filter out events that are older than today (optional, but good practice)
  const now = new Date();
  now.setHours(0,0,0,0);
  
  const upcomingEvents = eventsList.filter(e => new Date(e.date) >= now);

  if (upcomingEvents.length === 0) {
    eventsGrid.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; padding: 40px; color: #64748b;">No upcoming events at the moment. Please check back later!</div>`;
    return;
  }

  // Sort upcoming events by date ascending
  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  upcomingEvents.forEach(evt => {
    const isRsvped = userRsvps.includes(evt.id);
    const spotsLeft = Math.max(0, evt.max_attendees - evt.registered);
    const fillPercent = Math.min(100, (evt.registered / evt.max_attendees) * 100);
    const bannerClass = getBannerThemeClass(evt.name);

    // Format Date elements
    const evtDate = new Date(evt.date);
    const month = evtDate.toLocaleString('en-US', { month: 'short' });
    const day = evtDate.getDate();

    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-banner ${bannerClass}">
        <h2>${evt.name}</h2>
      </div>
      <div class="event-details">
        <div class="event-meta-row">
          <div class="event-calendar-badge">
            <span class="badge-month">${month}</span>
            <span class="badge-day">${day}</span>
          </div>
          <div class="event-info-meta">
            <span class="meta-loc">📍 ${evt.location}</span>
            <span class="meta-date">📅 ${evtDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <p class="event-desc">${evt.description || 'No description provided.'}</p>
        
        <div class="event-seats-container">
          <div class="event-seats-header">
            <span>Registration Slots</span>
            <span>${evt.registered} / ${evt.max_attendees} filled</span>
          </div>
          <div class="event-seats-bar">
            <div class="event-seats-fill" style="width: ${fillPercent}%;"></div>
          </div>
        </div>

        <button class="event-rsvp-btn ${getButtonClass(isRsvped, spotsLeft)}" 
                id="btn-rsvp-${evt.id}">
          ${getButtonLabel(isRsvped, spotsLeft)}
        </button>
      </div>
    `;

    eventsGrid.appendChild(card);

    // Add click handler
    document.getElementById(`btn-rsvp-${evt.id}`).addEventListener("click", () => {
      handleRsvpClick(evt, isRsvped);
    });
  });
}

function getButtonClass(isRsvped, spotsLeft) {
  if (isRsvped) return "rsvp-btn-cancel";
  if (spotsLeft <= 0) return "rsvp-btn-full";
  return "rsvp-btn-join";
}

function getButtonLabel(isRsvped, spotsLeft) {
  if (isRsvped) return "✓ Booked (Cancel RSVP)";
  if (spotsLeft <= 0) return "Event Full";
  return "RSVP Online";
}

// RSVP Button Actions
async function handleRsvpClick(event, isRsvped) {
  // If user is not logged in, prompt sign in
  if (!currentUser) {
    const proceed = confirm("Please sign in or create an account to RSVP for Hopeful Hearts events. Click OK to log in.");
    if (proceed) {
      window.location.href = "login.html?return=events.html";
    }
    return;
  }

  showMsg("", ""); // Clear message
  const btn = document.getElementById(`btn-rsvp-${event.id}`);
  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    if (isRsvped) {
      // 1. Cancel RSVP
      if (!isLocalMode) {
        // DB Mode
        const { error: deleteError } = await supabase
          .from('event_rsvps')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;

        // Decrement registration count on events
        const { error: updateError } = await supabase
          .from('events')
          .update({ registered: Math.max(0, event.registered - 1) })
          .eq('id', event.id);

        if (updateError) throw updateError;
      } else {
        // Local Mode
        const localEvt = eventsList.find(e => e.id === event.id);
        if (localEvt) {
          localEvt.registered = Math.max(0, localEvt.registered - 1);
          saveLocalEvents();
        }
      }

      // Update State
      userRsvps = userRsvps.filter(id => id !== event.id);
      if (isLocalMode) saveLocalRsvps();

      showMsg("Success! Your RSVP has been cancelled.", "success");
    } else {
      // 2. Register RSVP
      if (event.registered >= event.max_attendees) {
        showMsg("Sorry, this event is already fully booked.", "error");
        btn.disabled = false;
        renderEvents();
        return;
      }

      if (!isLocalMode) {
        // DB Mode
        const { error: insertError } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: event.id,
            user_id: currentUser.id,
            user_name: currentUser.user_metadata?.display_name || "User",
            user_email: currentUser.email
          });

        if (insertError) throw insertError;

        // Increment registration count
        const { error: updateError } = await supabase
          .from('events')
          .update({ registered: event.registered + 1 })
          .eq('id', event.id);

        if (updateError) throw updateError;
      } else {
        // Local Mode
        const localEvt = eventsList.find(e => e.id === event.id);
        if (localEvt) {
          localEvt.registered = localEvt.registered + 1;
          saveLocalEvents();
        }
      }

      // Update State
      userRsvps.push(event.id);
      if (isLocalMode) saveLocalRsvps();

      showMsg(`Congratulations! You have RSVP'd for ${event.name}.`, "success");
    }

    // Reload and redraw UI
    await loadEventsData();
    renderEvents();
    startCountdown();

  } catch (err) {
    console.error("RSVP Action Failed:", err);
    showMsg(`Failed to process RSVP: ${err.message || 'Check database configurations.'}`, "error");
    btn.disabled = false;
  }
}

function showMsg(text, type) {
  eventMessage.textContent = text;
  eventMessage.className = "event-feedback-msg";
  if (text) {
    eventMessage.classList.add(type);
  }
}

// Dynamic Countdown to Closest Future Event
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  const now = new Date();
  // Filter events in the future
  const futureEvents = eventsList.filter(e => new Date(e.date + "T00:00:00") > now);

  if (futureEvents.length === 0) {
    countdownBanner.style.display = "none";
    return;
  }

  // Find closest
  futureEvents.sort((a, b) => new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00"));
  const targetEvent = futureEvents[0];
  const targetDate = new Date(targetEvent.date + "T00:00:00");

  countdownEventName.textContent = `Next Event: ${targetEvent.name} (${new Date(targetEvent.date).toLocaleDateString()})`;
  countdownBanner.style.display = "grid";

  function updateTimer() {
    const currentTime = new Date();
    const diff = targetDate - currentTime;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      countdownTimer.innerHTML = "<strong>Event is Live!</strong>";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("cdDays").textContent = String(days).padStart(2, '0');
    document.getElementById("cdHours").textContent = String(hours).padStart(2, '0');
    document.getElementById("cdMinutes").textContent = String(minutes).padStart(2, '0');
    document.getElementById("cdSeconds").textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

// On page load
window.addEventListener('DOMContentLoaded', () => {
  initEventsPage();
});
