import { supabase } from './supabase-config.js';

let registrationData = null;
let eventData = null;

const elements = {
  loadingMsg: document.getElementById('loadingMsg'),
  errorMsg: document.getElementById('errorMsg'),
  confCard: document.getElementById('confCard'),
  
  eventName: document.getElementById('confEventName'),
  confName: document.getElementById('confName'),
  confType: document.getElementById('confType'),
  confRegNo: document.getElementById('confRegNo'),
  confDateTime: document.getElementById('confDateTime'),
  confLocation: document.getElementById('confLocation'),
  
  btnDownload: document.getElementById('btnDownload'),
  btnShare: document.getElementById('btnShare'),
  
  btnGoogle: document.getElementById('btnGoogle'),
  btnApple: document.getElementById('btnApple'),
  btnOutlook: document.getElementById('btnOutlook'),
  btnICS: document.getElementById('btnICS'),
};

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const regId = urlParams.get('regId');

  if (!regId) {
    showError("No registration ID provided.");
    return;
  }

  await loadRegistration(regId);
}

async function loadRegistration(id) {
  try {
    // 1. Fetch Registration
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .select('*, events(*)')
      .eq('id', id)
      .single();

    if (regError || !reg) throw regError || new Error("Registration not found");

    registrationData = reg;
    eventData = reg.events;

    renderConfirmation();
    
    elements.loadingMsg.style.display = "none";
    elements.confCard.style.display = "block";

  } catch (err) {
    console.error(err);
    showError("Failed to load registration details. Please contact support.");
  }
}

function renderConfirmation() {
  elements.eventName.textContent = eventData.name;
  elements.confName.textContent = registrationData.name;
  elements.confType.textContent = registrationData.attendance_type;
  
  // Create a visually appealing registration number
  const formattedId = String(registrationData.id).padStart(5, '0');
  elements.confRegNo.textContent = `#${formattedId}`;

  // Date/Time
  const d = new Date(eventData.date);
  let dateStr = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (eventData.time) {
    const [h, m] = eventData.time.split(':');
    const td = new Date(); td.setHours(h, m, 0);
    dateStr += ` at ${td.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  elements.confDateTime.textContent = dateStr;
  
  elements.confLocation.textContent = eventData.venue_name || eventData.location || "Hopeful Hearts Orphanage";

  // Generate QR Code containing the Registration ID and QR Code UUID
  const qrData = JSON.stringify({
    reg_id: registrationData.id,
    qr_code_id: registrationData.qr_code_id
  });
  
  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = "";
  new QRCode(qrcodeContainer, {
    text: qrData,
    width: 128,
    height: 128,
    colorDark : "#0f172a",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M
  });

  setupActions();
}

function setupActions() {
  // Download Ticket as Image (using html2canvas)
  elements.btnDownload.onclick = () => {
    const ticketElement = document.getElementById('ticketWrapper');
    elements.btnDownload.textContent = "Generating...";
    html2canvas(ticketElement).then(canvas => {
      const link = document.createElement('a');
      link.download = `Ticket_${eventData.name.replace(/\s+/g, '_')}_${registrationData.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      elements.btnDownload.innerHTML = `<i class="fa-solid fa-download"></i> Download Ticket`;
    });
  };

  // Share Event
  elements.btnShare.onclick = () => {
    // Generate event details URL
    const eventUrl = `${window.location.origin}/events.html?id=${eventData.id}`;
    if (navigator.share) {
      navigator.share({
        title: eventData.name,
        text: `I'm attending ${eventData.name} at Hopeful Hearts! Join me!`,
        url: eventUrl,
      });
    } else {
      navigator.clipboard.writeText(eventUrl).then(() => alert("Event link copied to clipboard!"));
    }
  };

  // Calendar Links
  const eventTitle = encodeURIComponent(eventData.name);
  const eventDesc = encodeURIComponent(eventData.description || "");
  const eventLoc = encodeURIComponent(eventData.venue_name || eventData.location || "");
  
  const d = new Date(eventData.date + (eventData.time ? `T${eventData.time}` : 'T00:00:00'));
  const dEnd = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  
  const formatCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const startStr = formatCalDate(d);
  const endStr = formatCalDate(dEnd);

  elements.btnGoogle.onclick = () => {
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startStr}/${endStr}&details=${eventDesc}&location=${eventLoc}`, '_blank');
  };

  elements.btnOutlook.onclick = () => {
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${eventTitle}&startdt=${startStr}&enddt=${endStr}&body=${eventDesc}&location=${eventLoc}`, '_blank');
  };

  const generateICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${eventData.name}
DESCRIPTION:${(eventData.description || "").replace(/\n/g, '\\n')}
LOCATION:${eventData.venue_name || eventData.location || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${eventData.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  elements.btnApple.onclick = generateICS;
  elements.btnICS.onclick = generateICS;
}

function showError(msg) {
  elements.loadingMsg.style.display = "none";
  elements.confCard.style.display = "none";
  elements.errorMsg.textContent = msg;
  elements.errorMsg.style.display = "block";
}

window.addEventListener('DOMContentLoaded', init);
