import { supabase } from './supabase-config.js';

let currentEvent = null;
let currentUser = null;

const elements = {
  form: document.getElementById('registrationForm'),
  eventId: document.getElementById('eventId'),
  eventName: document.getElementById('eventNameTitle'),
  eventDate: document.getElementById('eventDateSubtitle'),
  
  // Basic Info
  regName: document.getElementById('regName'),
  regEmail: document.getElementById('regEmail'),
  regPhone: document.getElementById('regPhone'),
  
  // Attendance
  attendanceType: document.getElementById('attendanceType'),
  
  // Dynamic Sections
  dynamicSection: document.getElementById('dynamicFieldsSection'),
  fieldsVolunteer: document.getElementById('fieldsVolunteer'),
  fieldsCorporate: document.getElementById('fieldsCorporate'),
  fieldsGuest: document.getElementById('fieldsGuest'),
  fieldsMedia: document.getElementById('fieldsMedia'),
  
  // Submit
  submitBtn: document.getElementById('submitRegBtn'),
  errorMsg: document.getElementById('regErrorMsg'),
  
  // General
  regNotes: document.getElementById('regNotes')
};

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    alert("No event specified.");
    window.location.href = "events.html";
    return;
  }
  
  elements.eventId.value = eventId;

  // Check auth
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUser = user;
      // Pre-fill user details
      elements.regEmail.value = user.email;
      
      const { data: profile } = await supabase
        .from('users')
        .select('display_name, phone')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        if (profile.display_name) elements.regName.value = profile.display_name;
        if (profile.phone) elements.regPhone.value = profile.phone;
      }
    }
  } catch (err) {
    console.warn("User not logged in or auth failed:", err);
  }

  await loadEvent(eventId);
  
  // Listeners
  elements.attendanceType.addEventListener('change', handleAttendanceChange);
  elements.form.addEventListener('submit', handleFormSubmit);
}

async function loadEvent(id) {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) throw error || new Error("Event not found");

    currentEvent = event;
    elements.eventName.textContent = `Register for ${event.name}`;
    const dateObj = new Date(event.date);
    elements.eventDate.textContent = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Check capacity / deadline
    const capacity = event.capacity || 100;
    const registered = event.registered || 0;
    if (event.is_registration_open === false || (event.registration_deadline && new Date(event.registration_deadline) < new Date())) {
      disableForm("Registration for this event is closed.");
    } else if (registered >= capacity) {
      disableForm("This event is fully booked.");
    }

  } catch (err) {
    console.error(err);
    disableForm("Failed to load event details.");
  }
}

function disableForm(msg) {
  elements.errorMsg.textContent = msg;
  elements.submitBtn.disabled = true;
  elements.submitBtn.textContent = "Registration Closed";
  const inputs = elements.form.querySelectorAll('input, select, textarea');
  inputs.forEach(i => i.disabled = true);
}

function handleAttendanceChange() {
  const val = elements.attendanceType.value;
  elements.dynamicSection.style.display = val ? "block" : "none";
  
  // Hide all dynamic groups first
  elements.fieldsVolunteer.style.display = "none";
  elements.fieldsCorporate.style.display = "none";
  elements.fieldsGuest.style.display = "none";
  elements.fieldsMedia.style.display = "none";

  // Reset required attributes on dynamic fields
  const dynamicInputs = elements.dynamicSection.querySelectorAll('input');
  dynamicInputs.forEach(i => i.required = false);

  if (val === "Volunteer") {
    elements.fieldsVolunteer.style.display = "block";
    document.getElementById('volEmergency').required = true;
  } else if (val === "Corporate Sponsor") {
    elements.fieldsCorporate.style.display = "block";
    document.getElementById('corpCompany').required = true;
    document.getElementById('corpAttendees').required = true;
  } else if (val === "Guest" || val === "VIP Guest") {
    elements.fieldsGuest.style.display = "block";
    document.getElementById('guestCount').required = true;
  } else if (val === "Media") {
    elements.fieldsMedia.style.display = "block";
    document.getElementById('mediaOrg').required = true;
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  elements.errorMsg.textContent = "";
  elements.submitBtn.disabled = true;
  elements.submitBtn.textContent = "Processing Registration...";

  try {
    const type = elements.attendanceType.value;
    
    // 1. Insert into event_registrations
    const { data: regData, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: currentEvent.id,
        user_id: currentUser ? currentUser.id : null,
        name: elements.regName.value.trim(),
        email: elements.regEmail.value.trim(),
        phone: elements.regPhone.value.trim(),
        attendance_type: type,
        notes: elements.regNotes.value.trim(),
        // checked_in is false by default
        // qr_code_id is generated by default
      })
      .select('id, qr_code_id')
      .single();

    if (regError) throw regError;

    // 2. Prepare dynamic fields
    const dynamicFields = [];
    
    if (type === "Volunteer") {
      dynamicFields.push({ field_name: "Skills", field_value: document.getElementById('volSkills').value });
      dynamicFields.push({ field_name: "Availability", field_value: document.getElementById('volAvail').value });
      dynamicFields.push({ field_name: "Emergency Contact", field_value: document.getElementById('volEmergency').value });
      dynamicFields.push({ field_name: "T-Shirt Size", field_value: document.getElementById('volTshirt').value });
    } 
    else if (type === "Corporate Sponsor") {
      dynamicFields.push({ field_name: "Company Name", field_value: document.getElementById('corpCompany').value });
      dynamicFields.push({ field_name: "Representative", field_value: document.getElementById('corpRep').value });
      dynamicFields.push({ field_name: "Number of Attendees", field_value: document.getElementById('corpAttendees').value });
      
      const brands = [];
      if (document.getElementById('corpBrandBanners').checked) brands.push("Banners");
      if (document.getElementById('corpBrandBooth').checked) brands.push("Booth");
      if (document.getElementById('corpBrandDigital').checked) brands.push("Digital");
      dynamicFields.push({ field_name: "Branding Interest", field_value: brands.join(", ") });
    }
    else if (type === "Guest" || type === "VIP Guest") {
      dynamicFields.push({ field_name: "Number of Guests", field_value: document.getElementById('guestCount').value });
      dynamicFields.push({ field_name: "Dietary Requirements", field_value: document.getElementById('guestDiet').value });
      dynamicFields.push({ field_name: "Accessibility", field_value: document.getElementById('guestAccess').value });
    }
    else if (type === "Media") {
      dynamicFields.push({ field_name: "Organisation", field_value: document.getElementById('mediaOrg').value });
      
      const roles = [];
      if (document.getElementById('mediaPhoto').checked) roles.push("Photographer");
      if (document.getElementById('mediaVideo').checked) roles.push("Videographer");
      if (document.getElementById('mediaJourno').checked) roles.push("Journalist");
      dynamicFields.push({ field_name: "Roles", field_value: roles.join(", ") });
      
      dynamicFields.push({ field_name: "Press Pass", field_value: document.getElementById('mediaPressPass').value });
    }

    // Insert dynamic fields if any
    const validFields = dynamicFields.filter(f => f.field_value && f.field_value.trim() !== "");
    if (validFields.length > 0) {
      const detailsToInsert = validFields.map(f => ({
        registration_id: regData.id,
        field_name: f.field_name,
        field_value: f.field_value.trim()
      }));

      const { error: detailError } = await supabase
        .from('registration_details')
        .insert(detailsToInsert);
        
      if (detailError) throw detailError;
    }

    // 3. Update event registered count (fails silently if RLS prevents public updates)
    const { error: countError } = await supabase
      .from('events')
      .update({ registered: (currentEvent.registered || 0) + 1 })
      .eq('id', currentEvent.id);

    if (countError) {
      console.warn("Could not update registered count directly. Use the DB trigger.", countError);
    }

    // Success! Redirect to confirmation
    window.location.href = `event-confirmation.html?regId=${regData.id}`;

  } catch (err) {
    console.error("Registration Error:", err);
    // If unique constraint violation on email
    if (err.code === '23505') {
      elements.errorMsg.textContent = "You are already registered for this event with this email address.";
    } else {
      elements.errorMsg.textContent = "Registration failed. Please try again or contact support.";
    }
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = "Complete Registration";
  }
}

window.addEventListener('DOMContentLoaded', init);
