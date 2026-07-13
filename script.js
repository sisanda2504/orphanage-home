const chatbot = document.querySelector(".chatbot");
const toggleButton = document.querySelector(".chatbot-toggle");
const closeButton = document.querySelector(".chatbot-close");
const panel = document.querySelector(".chatbot-panel");
const messages = document.querySelector(".chatbot-messages");
const form = document.querySelector(".chatbot-form");
const input = document.querySelector("#chatbot-input");
const promptButtons = document.querySelectorAll("[data-prompt]");

const botReplies = [
  {
    keywords: ["donate", "donation", "money", "sponsor", "support", "give"],
    reply:
      "Thank you for wanting to help. You can support Hopeful Hearts with financial donations, food, clothing, school supplies, books, or by sponsoring daily care needs. Please contact hello@hopefulhearts.org to arrange a donation.",
  },
  {
    keywords: ["volunteer", "help", "mentor", "tutor", "time", "assist"],
    reply:
      "We welcome caring volunteers for tutoring, mentoring, activities, admin support, and donation drives. Send your availability and area of interest to hello@hopefulhearts.org so the team can guide you through the next steps.",
  },
  {
    keywords: ["visit", "tour", "come", "see", "location", "where"],
    reply:
      "Visits are arranged by appointment so the children stay safe and comfortable. Please email hello@hopefulhearts.org with your preferred date, group size, and reason for visiting.",
  },
  {
    keywords: ["contact", "email", "phone", "call", "message"],
    reply:
      "You can reach Hopeful Hearts at hello@hopefulhearts.org. Share your name, contact details, and how you would like to help, and the team will get back to you.",
  },
  {
    keywords: ["mission", "about", "who", "what", "orphanage"],
    reply:
      "Hopeful Hearts is a non-profit orphanage focused on giving children a safe home, quality education, healthcare, nutritious meals, and steady emotional support.",
  },
  {
    keywords: ["education", "school", "learn", "tutor", "books"],
    reply:
      "Education is central to our work. We support children with schooling, tutoring, reading materials, life skills, and encouragement to dream about their futures.",
  },
  {
    keywords: ["health", "healthcare", "medical", "food", "meals", "care"],
    reply:
      "The children receive daily care that includes nutritious meals, medical attention when needed, emotional support, and a safe routine.",
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon"],
    reply:
      "Hello, and welcome to Hopeful Hearts. I can help with donations, volunteering, visits, contact details, and our mission.",
  },
];

const fallbackReply =
  "I can help with questions about donations, volunteering, visits, contact details, education, healthcare, and the Hopeful Hearts mission.";

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
  message.textContent = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function getBotReply(question) {
  const normalizedQuestion = question.toLowerCase();
  const match = botReplies.find(({ keywords }) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  return match ? match.reply : fallbackReply;
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

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleQuestion(button.dataset.prompt);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && chatbot.classList.contains("is-open")) {
    setChatOpen(false);
    toggleButton.focus();
  }
});

addMessage(
  "Hi, I am the Hopeful Hearts assistant. Ask me about donating, volunteering, visits, or our mission.",
  "bot"
);
