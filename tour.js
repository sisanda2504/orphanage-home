/* Virtual Tour JavaScript Logic */

const roomsData = {
  lobby: {
    title: "Lobby & Welcome Area",
    image: "images/lobby_tour.jpg",
    description: "Welcome to the Hopeful Hearts lobby. This is where every child's journey begins with us. Our walls are adorned with their colorful artwork, expressing their dreams and creativity. Our caretakers greet visitors and new children here with open arms, ensuring a warm, supportive first impression.",
    hotspots: [
      { id: "l1", top: "35%", left: "25%", title: "Children's Artwork Wall", description: "Our children paint these canvases during weekend art therapy workshops. They showcase their hopes, favorite colors, and dreams of the future." },
      { id: "l2", top: "58%", left: "62%", title: "Reception & Check-in", description: "This is where volunteer schedules, meal planning, and visitor check-ins are managed by our daily supervisor to maintain a safe environment." }
    ]
  },
  study: {
    title: "Study Room & Library",
    image: "images/study_tour.jpg",
    description: "This is our Study Room and Library. Education is the key to a bright future. Here, the children have access to over fifteen hundred books, study desks, and computers. Local volunteers and tutors join us every afternoon to assist with homework, reading skills, and creative writing.",
    hotspots: [
      { id: "s1", top: "42%", left: "30%", title: "Book Collection", description: "Over 1,500 reading books and school textbooks donated by local schools, sorted by age and educational grade." },
      { id: "s2", top: "52%", left: "75%", title: "Digital Learning Station", description: "Equipped with computers and educational software where older children learn coding, basic digital skills, and complete school research." }
    ]
  },
  dining: {
    title: "Dining Hall & Kitchen",
    image: "images/dining_tour.jpg",
    description: "Welcome to the Dining Hall. We believe that nutritious, warm meals are essential for healthy growth and happiness. Our kids gather here three times a day to share meals, stories, and laughter. We serve balanced meals prepared with fresh ingredients, often donated by local markets.",
    hotspots: [
      { id: "d1", top: "52%", left: "40%", title: "Family Dining Tables", description: "Our children sit in group layouts. Elder children help guide the toddlers, promoting bonding and creating a family-like dynamic." },
      { id: "d2", top: "32%", left: "65%", title: "Safe & Fresh Kitchen", description: "Our kitchen follows strict sanitation standards. Meals are balanced, full of vitamins, and prepared by our resident cook and local helpers." }
    ]
  },
  playground: {
    title: "Outdoor Playground",
    image: "images/playground_tour.jpg",
    description: "Step outside into our Playground and Garden. This is where the energy and joy of Hopeful Hearts truly shines. The children play soccer, enjoy the swings, and run around on the grass. We also maintain a small vegetable garden here, teaching the kids about nature and sustainability.",
    hotspots: [
      { id: "p1", top: "60%", left: "45%", title: "Active Play Structure", description: "A secure playground setup complete with slides, swings, and climbing sets to encourage active physical development and cooperative play." },
      { id: "p2", top: "38%", left: "78%", title: "Vegetable Garden", description: "The kids help plant spinach, carrots, and tomatoes. It teaches them responsibility, botany, and the joy of harvesting their own food." }
    ]
  }
};

let currentRoom = "lobby";
let synth = window.speechSynthesis;
let utterance = null;
let isSpeaking = false;
let isPaused = false;

// DOM Elements
const roomImage = document.getElementById("roomImage");
const roomTitle = document.getElementById("roomTitle");
const roomDescription = document.getElementById("roomDescription");
const hotspotContainer = document.getElementById("hotspotContainer");
const hotspotDetailBox = document.getElementById("hotspotDetailBox");
const hotspotTitle = document.getElementById("hotspotTitle");
const hotspotContent = document.getElementById("hotspotContent");

const playAudioBtn = document.getElementById("playAudioBtn");
const pauseAudioBtn = document.getElementById("pauseAudioBtn");
const stopAudioBtn = document.getElementById("stopAudioBtn");
const soundwave = document.getElementById("soundwave");

// Initialize Room
function loadRoom(roomKey) {
  // Stop audio guide if playing
  stopAudio();
  
  currentRoom = roomKey;
  const room = roomsData[roomKey];
  
  // Fade effect
  roomImage.style.opacity = "0.2";
  setTimeout(() => {
    roomImage.src = room.image;
    roomImage.alt = room.title;
    roomTitle.textContent = room.title;
    roomDescription.textContent = room.description;
    
    renderHotspots(room.hotspots);
    
    // Hide details panel
    hotspotDetailBox.style.display = "none";
    roomImage.style.opacity = "1";
  }, 300);
}

// Render Hotspots
function renderHotspots(hotspots) {
  hotspotContainer.innerHTML = "";
  
  hotspots.forEach(hs => {
    const hotspotEl = document.createElement("div");
    hotspotEl.className = "hotspot";
    hotspotEl.style.top = hs.top;
    hotspotEl.style.left = hs.left;
    hotspotEl.dataset.id = hs.id;
    
    hotspotEl.innerHTML = `
      <div class="hotspot-ring"></div>
      <div class="hotspot-dot"></div>
    `;
    
    hotspotEl.addEventListener("click", (e) => {
      e.stopPropagation();
      showHotspotDetails(hs);
    });
    
    hotspotContainer.appendChild(hotspotEl);
  });
}

// Show Hotspot details
function showHotspotDetails(hotspot) {
  hotspotTitle.textContent = hotspot.title;
  hotspotContent.textContent = hotspot.description;
  hotspotDetailBox.style.display = "block";
  
  // Highlight active hotspot visual cue
  document.querySelectorAll(".hotspot").forEach(el => {
    el.querySelector(".hotspot-ring").style.animationPlayState = "running";
    el.querySelector(".hotspot-ring").style.borderColor = "#ffffff";
  });
  
  const selected = document.querySelector(`.hotspot[data-id="${hotspot.id}"]`);
  if (selected) {
    selected.querySelector(".hotspot-ring").style.animationPlayState = "paused";
    selected.querySelector(".hotspot-ring").style.borderColor = "#ea580c";
  }
}

// AUDIO NARRATION SPEECH SYNTHESIS LOGIC
function playAudio() {
  if (synth.speaking && isPaused) {
    // Resume
    synth.resume();
    isPaused = false;
    updateAudioButtons(true, false);
    soundwave.classList.add("playing");
    return;
  }
  
  // Stop existing speech
  synth.cancel();
  
  const room = roomsData[currentRoom];
  utterance = new SpeechSynthesisUtterance(room.description);
  
  // Select English voice if available
  const voices = synth.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith("en-GB")) || 
                       voices.find(v => v.lang.startsWith("en-US")) || 
                       voices[0];
  if (englishVoice) {
    utterance.voice = englishVoice;
  }
  
  utterance.pitch = 1.05; // Slightly warmer/friendlier pitch
  utterance.rate = 0.92;  // Slightly slower, clear reading speed
  
  utterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;
    updateAudioButtons(true, false);
    soundwave.classList.add("playing");
  };
  
  utterance.onend = () => {
    resetAudioState();
  };
  
  utterance.onerror = () => {
    resetAudioState();
  };
  
  synth.speak(utterance);
}

function pauseAudio() {
  if (synth.speaking && !isPaused) {
    synth.pause();
    isPaused = true;
    updateAudioButtons(false, true);
    soundwave.classList.remove("playing");
  }
}

function stopAudio() {
  if (synth.speaking || isSpeaking) {
    synth.cancel();
    resetAudioState();
  }
}

function resetAudioState() {
  isSpeaking = false;
  isPaused = false;
  updateAudioButtons(false, false);
  soundwave.classList.remove("playing");
}

function updateAudioButtons(playing, paused) {
  if (playing && !paused) {
    // Speaking
    playAudioBtn.disabled = true;
    playAudioBtn.textContent = "🔊 Speaking...";
    pauseAudioBtn.disabled = false;
    stopAudioBtn.disabled = false;
  } else if (!playing && paused) {
    // Paused
    playAudioBtn.disabled = false;
    playAudioBtn.textContent = "▶ Resume Guide";
    pauseAudioBtn.disabled = true;
    stopAudioBtn.disabled = false;
  } else {
    // Stopped
    playAudioBtn.disabled = false;
    playAudioBtn.textContent = "▶ Play Guide";
    pauseAudioBtn.disabled = true;
    stopAudioBtn.disabled = true;
  }
}

// Attach Event Listeners
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    
    loadRoom(btn.dataset.room);
  });
});

playAudioBtn.addEventListener("click", playAudio);
pauseAudioBtn.addEventListener("click", pauseAudio);
stopAudioBtn.addEventListener("click", stopAudio);

// Make sure voices are loaded (necessary for Chrome/Edge asynchronous loading)
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => synth.getVoices();
}

// Initialize on page load
loadRoom("lobby");
resetAudioState();
