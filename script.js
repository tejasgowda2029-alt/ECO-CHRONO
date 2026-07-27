// 1. Sidebar Menu Toggle with Backdrop Overlay
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar) sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
}

// 2. Dark / Light Mode Switch
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

  // Close sidebar if open
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('active')) {
    toggleSidebar();
  }
}

// 4. Reliable Audio Slider Handler
function setupAudio(sliderId, audioId) {
  const slider = document.getElementById(sliderId);
  const audio = document.getElementById(audioId);

  if (!slider || !audio) return;

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    audio.volume = val;

    if (val > 0 && audio.paused) {
      audio.play().catch(() => console.log("User interaction required before audio play"));
    } else if (val === 0) {
      audio.pause();
    }
  });
}

// HTML Escaper for Security (XSS protection)
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
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

// 6. Login State Management
function submitLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  if (!emailInput) return;

  const username = emailInput.value.trim().split('@')[0];
  localStorage.setItem('eco_user', username);
  
  updateAuthButton();
  showPage('home');
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
    if (user) {
      authBtn.textContent = `👤 ${user}`;
    } else {
      authBtn.textContent = 'Login';
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupAudio('rain-slider', 'audio-rain');
  setupAudio('birds-slider', 'audio-birds');
  setupAudio('ocean-slider', 'audio-ocean');
  updateAuthButton();
});