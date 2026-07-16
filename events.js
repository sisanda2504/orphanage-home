import { supabase } from './supabase-config.js';

let allEvents = [];
let filteredEvents = [];
let eventMap = null;

async function init() {
  await checkAuth();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error("Failed to load events:", error);
    return;
  }
  
  allEvents = data || [];
  filteredEvents = [...allEvents];

  // Setup Grid Search/Filter
  const searchEl = document.getElementById('searchEvent');
  const catEl = document.getElementById('filterCategory');
  if (searchEl) searchEl.addEventListener('input', updateGridFilters);
  if (catEl) catEl.addEventListener('change', updateGridFilters);

  // Global listeners to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-more-btn') && !e.target.closest('.card-dropdown-menu')) {
      document.querySelectorAll('.card-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.card-dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
  });

  renderGrid();
}

function updateGridFilters() {
  const searchTerm = document.getElementById('searchEvent').value.toLowerCase();
  const category = document.getElementById('filterCategory').value;

  filteredEvents = allEvents.filter(e => {
    const matchTerm = e.name.toLowerCase().includes(searchTerm) || (e.description || "").toLowerCase().includes(searchTerm);
    const matchCat = category === "" || e.category === category;
    return matchTerm && matchCat;
  });

  renderGrid();
}

function renderGrid() {
  const container = document.getElementById('upcomingEventsGrid');
  if (!container) return;
  container.innerHTML = '';
  
  if (filteredEvents.length === 0) {
    container.innerHTML = "<p>No events found.</p>";
    document.getElementById('globalEventSidebar').style.display = 'none';
    return;
  }
  
  // Show sidebar for the first event in the list
  updateSidebar(filteredEvents[0]);

  filteredEvents.forEach(e => {
    // Generate banner background based on category
    let bgStyle = "";
    let bannerContent = ``;
    const themeClass = e.category ? e.category.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'general';

    if (e.image_url) {
      bgStyle = `background: linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0) 100%), url('${e.image_url}') center/cover;`;
      bannerContent = `<h2 style="color:#fff;">${e.name}</h2>`;
    } else {
      bgStyle = `background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);`;
      bannerContent = `<h2 style="color:#fff;">${e.name}</h2>`;
    }

    const now = new Date();
    let isClosed = e.is_registration_open === false;
    if (e.registration_deadline && new Date(e.registration_deadline) < now) isClosed = true;
    if (e.capacity && (e.registered || 0) >= e.capacity) isClosed = true;

    // Build the date badge
    const eventDate = new Date(e.date);
    const month = eventDate.toLocaleString('default', { month: 'short' });
    const day = eventDate.getDate();

    const card = document.createElement('div');
    card.className = 'event-card';
    
    card.innerHTML = `
      <div class="event-banner ${themeClass}" style="${bgStyle}">
        ${bannerContent}
        <div class="event-card-countdown" data-date="${e.date}${e.time ? 'T' + e.time : 'T00:00:00'}"></div>
        <button class="card-more-btn" data-id="${e.id}" aria-label="More options">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
        <div class="card-dropdown-menu" id="dropdown-${e.id}">
          <button class="dropdown-item btn-add-calendar" data-id="${e.id}"><i class="fa-regular fa-calendar-plus"></i> Add to Calendar</button>
          <div class="dropdown-submenu" id="submenu-cal-${e.id}">
            <button class="dropdown-item btn-cal-google" data-id="${e.id}"><i class="fa-brands fa-google"></i> Google Calendar</button>
            <button class="dropdown-item btn-cal-outlook" data-id="${e.id}"><i class="fa-brands fa-microsoft"></i> Outlook</button>
            <button class="dropdown-item btn-cal-apple" data-id="${e.id}"><i class="fa-brands fa-apple"></i> Apple Calendar</button>
            <button class="dropdown-item btn-cal-ics" data-id="${e.id}"><i class="fa-solid fa-file-arrow-down"></i> ICS File</button>
          </div>
          <button class="dropdown-item btn-share" data-id="${e.id}"><i class="fa-solid fa-share-nodes"></i> Share</button>
          <button class="dropdown-item btn-copy-link" data-id="${e.id}"><i class="fa-regular fa-copy"></i> Copy Link</button>
          <button class="dropdown-item btn-directions" data-id="${e.id}"><i class="fa-solid fa-location-arrow"></i> Directions</button>
        </div>
      </div>
      <div class="event-details">
        <div class="event-meta-row">
          <div class="event-calendar-badge">
            <span class="badge-month">${month}</span>
            <span class="badge-day">${day}</span>
          </div>
          <div class="event-info-meta">
            <span class="meta-loc"><i class="fa-solid fa-location-dot"></i> ${e.venue_name || e.location || 'TBA'}</span>
            <span class="meta-date"><i class="fa-regular fa-clock"></i> ${e.time || 'TBD'}</span>
          </div>
        </div>
        
        <p class="event-desc">${(e.description || '').substring(0, 120)}${(e.description && e.description.length > 120) ? '...' : ''}</p>
        
        <div class="event-seats-container">
          <div class="event-seats-header">
            <span>${e.registered || 0} / ${e.capacity || 100} Registered</span>
            <span>${isClosed ? 'Closed' : 'Open'}</span>
          </div>
          <div class="event-seats-bar">
            <div class="event-seats-fill" style="width: ${Math.min(100, ((e.registered || 0) / (e.capacity || 100)) * 100)}%;"></div>
          </div>
        </div>
        
        <button class="event-rsvp-btn ${isClosed ? 'btn-secondary' : 'btn-primary'}" ${isClosed ? 'disabled' : ''} onclick="window.location.href='event-registration.html?id=${e.id}'">
          ${isClosed ? 'Registration Closed' : 'Register Now'} <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach dropdown logic
  attachDropdownLogic();
}

function attachDropdownLogic() {
  document.querySelectorAll('.card-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const menu = document.getElementById(`dropdown-${id}`);
      
      // Close others
      document.querySelectorAll('.card-dropdown-menu.show').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });

      menu.classList.toggle('show');
    });
  });

  // Attach Menu Actions
  document.querySelectorAll('.card-dropdown-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.dropdown-item');
      if (!btn) return;
      
      const id = btn.getAttribute('data-id');
      const event = allEvents.find(ev => ev.id == id);
      if (!event) return;

      const eventUrl = encodeURIComponent(window.location.origin + window.location.pathname.replace('events.html', 'event-registration.html') + `?id=${event.id}`);
      const eventTitle = encodeURIComponent(event.name);
      const eventDesc = encodeURIComponent((event.description || "").replace(/\n/g, ' '));
      const eventLoc = encodeURIComponent(event.venue_name || event.location || "");

      // 1. Add to Calendar
      if (btn.classList.contains('btn-add-calendar')) {
        e.stopPropagation(); // keep menu open
        const submenu = document.getElementById(`submenu-cal-${id}`);
        submenu.classList.toggle('show');
        return; 
      }
      
      // 1a. Calendar Options
      if (btn.classList.contains('btn-cal-google') || btn.classList.contains('btn-cal-outlook') || btn.classList.contains('btn-cal-apple') || btn.classList.contains('btn-cal-ics')) {
        const d = new Date(event.date + (event.time ? `T${event.time}` : 'T00:00:00'));
        const dEnd = new Date(d.getTime() + 2 * 60 * 60 * 1000);
        const formatCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const startStr = formatCalDate(d);
        const endStr = formatCalDate(dEnd);

        if (btn.classList.contains('btn-cal-google')) {
          window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startStr}/${endStr}&details=${eventDesc}&location=${eventLoc}`, '_blank');
        } else if (btn.classList.contains('btn-cal-outlook')) {
          window.open(`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${eventTitle}&startdt=${startStr}&enddt=${endStr}&body=${eventDesc}&location=${eventLoc}`, '_blank');
        } else {
          // Apple / ICS
          const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${startStr}\nDTEND:${endStr}\nSUMMARY:${event.name}\nDESCRIPTION:${(event.description || "").replace(/\n/g, '\\n')}\nLOCATION:${event.venue_name || event.location || ""}\nEND:VEVENT\nEND:VCALENDAR`;
          const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = `${event.name.replace(/\s+/g, '_')}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      // 2. Share
      if (btn.classList.contains('btn-share')) {
        if (navigator.share) {
          navigator.share({
            title: event.name,
            text: `Check out ${event.name} at Hopeful Hearts!`,
            url: decodeURIComponent(eventUrl)
          }).catch(console.error);
        } else {
          // Fallback share logic
          window.location.href = `mailto:?subject=${eventTitle}&body=Check out this event at Hopeful Hearts: ${decodeURIComponent(eventUrl)}`;
        }
      }

      // 3. Copy Link
      if (btn.classList.contains('btn-copy-link')) {
        navigator.clipboard.writeText(decodeURIComponent(eventUrl)).then(() => {
          const toast = document.getElementById('copyToast');
          if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
          }
        });
      }

      // 4. Directions
      if (btn.classList.contains('btn-directions')) {
        updateSidebar(event);
      }

      // Close menu
      menu.classList.remove('show');
    });
  });
}

function updateSidebar(event) {
  const sidebar = document.getElementById('globalEventSidebar');
  if (!sidebar) return;
  sidebar.style.display = 'block';
  
  // Setup Map
  const lat = event.latitude || -33.9249; 
  const lng = event.longitude || 18.4241;
  const venue = event.venue_name || event.location || "Hopeful Hearts Orphanage";

  if (!eventMap) {
    eventMap = L.map('eventMap').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(eventMap);
  } else {
    eventMap.setView([lat, lng], 14);
    // Clear previous markers
    eventMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        eventMap.removeLayer(layer);
      }
    });
  }

  L.marker([lat, lng]).addTo(eventMap)
    .bindPopup(`<b>${venue}</b>`)
    .openPopup();

  const googleMapsLink = document.getElementById('googleMapsLink');
  if (googleMapsLink) {
    googleMapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const dashboardLink = document.getElementById('dashboardLink');

  if (session && session.user) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userNameDisplay) {
      userNameDisplay.textContent = session.user.user_metadata?.full_name || session.user.email;
    }
    
    // Check if admin
    const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    if (profile && profile.role === 'admin' && dashboardLink) {
      dashboardLink.style.display = 'inline';
    }

    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.reload();
      };
    }
  } else {
    if (authButtons) authButtons.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', init);

setInterval(() => {
  document.querySelectorAll('.event-card-countdown').forEach(el => {
    const targetDateStr = el.getAttribute('data-date');
    if (!targetDateStr) return;
    const targetDate = new Date(targetDateStr).getTime();
    if (isNaN(targetDate)) return;
    
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      el.innerHTML = "Started / Ended";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    el.innerHTML = `<i class="fa-regular fa-clock" style="margin-right: 4px;"></i> ${days}d ${hours}h ${minutes}m ${seconds}s`;
  });
}, 1000);
