const chatbot = document.querySelector(".chatbot");
const toggleButton = document.querySelector(".chatbot-toggle");
const closeButton = document.querySelector(".chatbot-close");
const panel = document.querySelector(".chatbot-panel");
const messages = document.querySelector(".chatbot-messages");
const form = document.querySelector(".chatbot-form");
const input = document.querySelector("#chatbot-input");

// Inject Dynamic Quick Actions
const promptsContainer = document.querySelector(".chatbot-prompts");
if (promptsContainer) {
  promptsContainer.innerHTML = `
    <button type="button" onclick="handleQuestion('How can I donate?')">Donate</button>
    <button type="button" onclick="handleQuestion('How can I volunteer?')">Volunteer</button>
    <button type="button" onclick="handleQuestion('Can I visit the orphanage?')">Visit</button>
    <button type="button" onclick="handleQuestion('How do I contact you?')">Contact</button>
  `;
}

let currentContext = null;

const intents = [
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "holla", "howzit", "howsit", "molo", "molweni", "mholo", "sawubona", "sanibonani", "hola"],
    reply: `👋 Hello! Welcome to Hopeful Hearts.<br><br>I'm your virtual assistant. I can help you find information, navigate the website, register for events, donate, volunteer, and much more.<br><br>What would you like help with today?`
  },
  {
    id: "donate",
    keywords: ["donate", "donation", "money", "sponsor", "support", "give", "help"],
    reply: `❤️ Thank you for supporting Hopeful Hearts!<br><br>You can easily contribute through our Donate page, where you can:<br><ul><li>Make a once-off donation</li><li>Become a monthly donor</li><li>Sponsor a child</li><li>Donate food, clothes or books</li></ul><br>If you experience any issues, please contact us.<br><br><button class="chatbot-action-btn" onclick="window.location.href='donate.html'">Go to Donate Page</button>`
  },
  {
    id: "volunteer",
    keywords: ["volunteer", "mentor", "tutor", "time", "assist", "documents"],
    reply: `🙌 We'd love to have you!<br><br>On our Volunteer page, you'll find a registration form where you can:<br><ul><li>Choose how you'd like to help</li><li>Select your availability</li><li>Submit your application</li></ul><br>Once submitted, we'll review it and get back to you.<br><br><button class="chatbot-action-btn" onclick="window.location.href='volunteer.html'">Register to Volunteer</button>`
  },
  {
    id: "events",
    keywords: ["event", "events", "calendar", "register", "attend", "upcoming"],
    reply: `📅 We host events year-round.<br><br>On our Events page you can:<br><ul><li>View event details</li><li>Register to attend</li><li>See available volunteer spaces</li><li>Add events to your calendar</li><li>Get directions</li></ul><br><br><button class="chatbot-action-btn" onclick="window.location.href='events.html'">View Upcoming Events</button>`
  },
  {
    id: "visit",
    keywords: ["visit", "tour", "come", "see", "location", "where", "address"],
    reply: `🏡 Yes! We welcome visitors.<br><br>You can find all our visitor details on our Visit page, including:<br><ul><li>Visiting hours</li><li>Visitor guidelines</li><li>Booking information</li><li>Frequently asked questions</li></ul><br><br><button class="chatbot-action-btn" onclick="window.location.href='tour.html'">Book a Visit</button>`
  },
  {
    id: "sponsorship",
    keywords: ["sponsor a child", "sponsorship", "sponsor"],
    reply: `❤️ You can become a sponsor by visiting the <b>Donate</b> page and selecting <b>Child Sponsorship</b>.<br><br>The page explains sponsorship options and how your support helps children.<br><br><button class="chatbot-action-btn" onclick="window.location.href='donate.html'">Sponsor a Child</button>`
  },
  {
    id: "gallery",
    keywords: ["gallery", "photos", "pictures", "images"],
    reply: `📷 Visit our <b>Gallery</b> page to explore photos of:<br><ul><li>Daily activities</li><li>Education</li><li>Sports</li><li>Celebrations</li><li>Community events</li></ul><br><br><button class="chatbot-action-btn" onclick="window.location.href='gallery.html'">Explore Gallery</button>`
  },
  {
    id: "virtual_tour",
    keywords: ["virtual tour", "explore", "facilities", "rooms", "inside"],
    reply: `🏡 Want to explore Hopeful Hearts?<br><br>Open the Virtual Tour page to walk through our facilities, including classrooms, library, dining hall and playground.<br><br><button class="chatbot-action-btn" onclick="window.location.href='tour.html'">Start Virtual Tour</button>`
  },
  {
    id: "impact",
    keywords: ["community impact", "impact", "donations map", "statistics"],
    reply: `🌍 Visit our <b>Community Impact</b> page to see donations from supporters around the world and how the community is growing.`
  },
  {
    id: "contact",
    keywords: ["contact", "email", "phone", "call", "message", "reach"],
    reply: `📞 You can open the <b>Contact</b> page from the navigation menu.<br><br>There you'll find:<br><ul><li>Phone number</li><li>Email</li><li>Address</li><li>Office hours</li><li>Contact form</li></ul>`
  },
  {
    id: "login",
    keywords: ["login", "sign in", "log in", "access account"],
    reply: `🔐 Click <b>Sign In</b> in the top-right corner of the website to access your account.`
  },
  {
    id: "signup",
    keywords: ["sign up", "create account", "register account", "join us"],
    reply: `👤 Click <b>Join Us</b> in the navigation bar to create a Hopeful Hearts account.`
  },
  {
    id: "balance",
    keywords: ["balance", "account balance", "transactions", "my account"],
    reply: `💳 If you are logged in, click <b>Dashboard</b> in the top navigation bar to view your account balance and recent transactions.`
  }
];

const fallbackReply = `I'm not sure about that yet, but I can help you with:<br><ul><li>Donations</li><li>Volunteering</li><li>Events</li><li>Visits</li><li>Sponsorships</li><li>Gallery</li><li>Virtual Tour</li><li>Contact Information</li></ul>`;

function setChatOpen(isOpen) {
  chatbot.classList.toggle("is-open", isOpen);
  toggleButton.setAttribute("aria-expanded", String(isOpen));
  toggleButton.setAttribute("aria-label", isOpen ? "Close chat" : "Open chat");
  panel.setAttribute("aria-hidden", String(!isOpen));
  panel.inert = !isOpen;

  if (isOpen) {
    input.focus();
  }
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chatbot-message ${sender}`;
  // Allow HTML for bot responses, escape user input
  if (sender === "user") {
    message.textContent = text;
  } else {
    message.innerHTML = text;
  }
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function getBotReply(question) {
  const normalizedQuestion = question.toLowerCase();
  
  // Try matching directly
  let match = intents.find(({ keywords }) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  // Fallback to conversation memory if ambiguous
  if (!match && currentContext) {
    // If we have a context, we can assume they are still asking about it if it's a short question
    if (normalizedQuestion.split(" ").length <= 4) {
      match = intents.find(i => i.id === currentContext);
    }
  }

  if (match) {
    currentContext = match.id;
    return match.reply;
  }
  
  return fallbackReply;
}

function handleQuestion(question) {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return;
  }

  addMessage(trimmedQuestion, "user");
  input.value = "";

  window.setTimeout(() => {
    addMessage(getBotReply(trimmedQuestion), "bot");
  }, 350);
}

toggleButton.addEventListener("click", () => {
  setChatOpen(!chatbot.classList.contains("is-open"));
});

closeButton.addEventListener("click", () => {
  setChatOpen(false);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleQuestion(input.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && chatbot.classList.contains("is-open")) {
    setChatOpen(false);
    toggleButton.focus();
  }
});

addMessage(
  "👋 Hello! Welcome to Hopeful Hearts.<br><br>I'm your virtual assistant. I can help you find information, navigate the website, register for events, donate, volunteer, and much more.<br><br>What would you like help with today?",
  "bot"
);

// Global Hamburger Menu Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('hamburgerToggleBtn');
  const drawer = document.getElementById('hamburgerDrawer');
  const closeBtn = document.getElementById('hamburgerCloseBtn');
  const backdrop = document.getElementById('hamburgerBackdrop');
  
  if (toggleBtn && drawer && backdrop) {
    function openMenu() {
      toggleBtn.classList.add('open');
      drawer.classList.add('open');
      backdrop.classList.add('visible');
    }
    
    function closeMenu() {
      toggleBtn.classList.remove('open');
      drawer.classList.remove('open');
      backdrop.classList.remove('visible');
    }
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) closeMenu();
      else openMenu();
    });
    
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    
    // Close menu when navigation links are clicked
    const links = drawer.querySelectorAll('.drawer-nav a');
    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }
});
