let isSignUpMode = false;

// 1. Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar) sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
}

// 2. Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('light');
}

// 3. Page Navigation Engine
function showPage(pageId) {
  const targetPage = document.getElementById(pageId);
  if (!targetPage) return;

  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  targetPage.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('active')) {
    toggleSidebar();
  }
}

// 4. Audio Controller
function setupAudio(sliderId, audioId) {
  const slider = document.getElementById(sliderId);
  const audio = document.getElementById(audioId);

  if (!slider || !audio) return;

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    audio.volume = val;

    if (val > 0 && audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.log("Audio play allowed on user action:", err));
      }
    } else if (val === 0) {
      audio.pause();
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}

// 5. Music Search Feature
function searchMusic() {
  const queryInput = document.getElementById('music-search');
  const resultDiv = document.getElementById('search-result');
  if (!queryInput || !resultDiv) return;

  const query = queryInput.value.trim();

  if (!query) {
    resultDiv.innerHTML = `<p style="color:#f87171;">Please type a song or movie name first!</p>`;
    return;
  }

  const safeQuery = escapeHTML(query);
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' relaxing music')}`;

  resultDiv.innerHTML = `
    <p style="color:#34d399;"><strong>🔍 Result found for "${safeQuery}":</strong></p>
    <br>
    <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; font-weight:bold; text-decoration:underline;">
      ▶ Click here to play "${safeQuery}" on YouTube
    </a>
  `;
}

// 6. Memory Match Puzzle
const puzzleIcons = ['🌿', '🧘', '📚', '🎮', '🎨', '🤼', '🌿', '🧘', '📚', '🎮', '🎨', '🤼'];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;

function resetPuzzleGame() {
  const grid = document.getElementById('memory-grid');
  const moveDisplay = document.getElementById('move-count');
  if (!grid) return;

  grid.innerHTML = '';
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  if (moveDisplay) moveDisplay.textContent = '0';

  const shuffled = [...puzzleIcons].sort(() => 0.5 - Math.random());

  shuffled.forEach((icon, index) => {
    const card = document.createElement('div');
    card.classList.add('memory-card');
    card.dataset.icon = icon;
    card.dataset.index = index;
    card.addEventListener('click', flipCard);
    grid.appendChild(card);
  });
}

function flipCard() {
  if (flippedCards.length >= 2 || this.classList.contains('flipped')) return;

  this.classList.add('flipped');
  this.textContent = this.dataset.icon;
  flippedCards.push(this);

  if (flippedCards.length === 2) {
    moves++;
    const moveDisplay = document.getElementById('move-count');
    if (moveDisplay) moveDisplay.textContent = moves;

    const [card1, card2] = flippedCards;
    if (card1.dataset.icon === card2.dataset.icon) {
      matchedPairs++;
      flippedCards = [];
      if (matchedPairs === puzzleIcons.length / 2) {
        setTimeout(() => alert(`🎉 Solved in ${moves} moves!`), 300);
      }
    } else {
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.textContent = '';
        card2.textContent = '';
        flippedCards = [];
      }, 800);
    }
  }
}

// 7. Auth Handling
function toggleAuthMode(event) {
  if (event) event.preventDefault();
  isSignUpMode = !isSignUpMode;

  const title = document.getElementById('form-title');
  const desc = document.getElementById('form-desc');
  const submitBtn = document.getElementById('submit-btn');
  const toggleText = document.getElementById('toggle-auth-text');
  const msg = document.getElementById('auth-msg');

  if (msg) msg.textContent = '';

  if (isSignUpMode) {
    if (title) title.textContent = "Create Account";
    if (desc) desc.textContent = "Sign up to start saving your focus settings";
    if (submitBtn) submitBtn.textContent = "Register";
    if (toggleText) toggleText.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthMode(event)">Sign In</a>`;
  } else {
    if (title) title.textContent = "Welcome Back";
    if (desc) desc.textContent = "Sign in to save your soundscapes";
    if (submitBtn) submitBtn.textContent = "Sign In";
    if (toggleText) toggleText.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthMode(event)">Create one</a>`;
  }
}

async function submitAuth(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const msg = document.getElementById('auth-msg');

  if (!emailInput || !passwordInput) return;

  const endpoint = isSignUpMode ? '/api/register' : '/api/login';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value })
    });

    const data = await response.json();

    if (!response.ok) {
      if (msg) {
        msg.className = 'auth-message error';
        msg.textContent = data.error || 'Authentication failed.';
      }
      return;
    }

    if (isSignUpMode) {
      if (msg) {
        msg.className = 'auth-message success';
        msg.textContent = 'Account created! Switching to login...';
      }
      setTimeout(() => toggleAuthMode(), 1500);
    } else {
      localStorage.setItem('eco_user', data.username);
      updateAuthButton();
      showPage('home');
      emailInput.value = '';
      passwordInput.value = '';
      if (msg) msg.textContent = '';
    }
  } catch (err) {
    if (msg) {
      msg.className = 'auth-message error';
      msg.textContent = 'Server connection error.';
    }
  }
}

function handleAuthAction() {
  const user = localStorage.getItem('eco_user');
  if (user) {
    if (confirm(`Logged in as ${user}. Do you want to sign out?`)) {
      localStorage.removeItem('eco_user');
      updateAuthButton();
      showPage('home');
    }
  } else {
    showPage('login');
  }
}

function updateAuthButton() {
  const authBtn = document.getElementById('auth-btn');
  const user = localStorage.getItem('eco_user');

  if (authBtn) {
    authBtn.textContent = user ? `👤 ${user}` : 'Login';
  }
}

// Initializer with New Sound System Controls
document.addEventListener('DOMContentLoaded', () => {
  setupAudio('sleep-slider', 'audio-sleep');
  setupAudio('study-slider', 'audio-study');
  setupAudio('refresh-slider', 'audio-refresh');
  setupAudio('ocean-slider', 'audio-ocean');
  resetPuzzleGame();
  updateAuthButton();
});