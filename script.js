/* ==========================================
   1. NAVIGATION & PAGE SWITCHING LOGIC
   ========================================== */

// Switch between pages/sections
function showPage(pageId) {
  // Hide all section pages
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => page.classList.remove('active'));

  // Show selected page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Auto-close sidebar and overlay on navigation
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// Toggle Sidebar Open/Close
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

// Toggle Light/Dark Theme
function toggleTheme() {
  document.body.classList.toggle('light');
}

// Top Nav Login Button Action
function handleAuthAction() {
  showPage('login');
}

/* ==========================================
   2. AUTHENTICATION & DATABASE LOGIN LOGIC
   ========================================== */

async function submitAuth(event) {
  // Prevent browser default form reloads
  event.preventDefault();

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submit-btn');

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert('Please enter both Email and Password.');
    return;
  }

  // Update button state while waiting for server response
  submitBtn.innerText = 'Signing In...';
  submitBtn.disabled = true;

  try {
    // Send request to server backend
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // 1. Success message
      alert(`Welcome back, ${data.username}!`);

      // 2. Save user details in browser memory
      localStorage.setItem('user', JSON.stringify(data));

      // 3. Update top navigation button to show username
      const authBtn = document.getElementById('auth-btn');
      if (authBtn) {
        authBtn.innerText = `👤 ${data.username}`;
      }

      // 4. Clear input fields and return back to Home (Relief House)
      passwordInput.value = '';
      showPage('home');

    } else {
      // Account not found or wrong password -> Ask to register
      if (confirm(`${data.error}\nDo you want to create a new account with this email?`)) {
        await registerUser(email, password);
      }
    }
  } catch (err) {
    console.error('Connection error:', err);
    alert('Server is offline or not reachable! Make sure node server.js is running.');
  } finally {
    submitBtn.innerText = 'Sign In';
    submitBtn.disabled = false;
  }
}

// Auto-register helper function
async function registerUser(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('🎉 Account created successfully in Database! Click Sign In again to enter.');
    } else {
      alert(`Registration Failed: ${data.error}`);
    }
  } catch (err) {
    alert('Failed to connect to backend server.');
  }
}

/* ==========================================
   3. AUDIO SLIDERS & UTILITIES
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Setup audio slider volume handlers
  setupAudioControl('sleep-slider', 'audio-sleep');
  setupAudioControl('study-slider', 'audio-study');
  setupAudioControl('refresh-slider', 'audio-refresh');
  setupAudioControl('ocean-slider', 'audio-ocean');

  // Check if user is already logged in from previous session
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) authBtn.innerText = `👤 ${user.username}`;
  }
});

function setupAudioControl(sliderId, audioId) {
  const slider = document.getElementById(sliderId);
  const audio = document.getElementById(audioId);

  if (slider && audio) {
    slider.addEventListener('input', (e) => {
      const volume = parseFloat(e.target.value);
      audio.volume = volume;

      if (volume > 0 && audio.paused) {
        audio.play().catch(() => {});
      } else if (volume === 0) {
        audio.pause();
      }
    });
  }
}

function searchMusic() {
  const query = document.getElementById('music-search').value;
  if (!query) return;
  const resultContainer = document.getElementById('search-result');
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  resultContainer.innerHTML = `<p>🎵 Opening YouTube search for: <strong>${query}</strong>...</p>
    <a href="${searchUrl}" target="_blank" style="color: #38bdf8;">Click here if tab didn't open automatically</a>`;

  window.open(searchUrl, '_blank');
}

function resetPuzzleGame() {
  const moveCount = document.getElementById('move-count');
  if (moveCount) moveCount.innerText = '0';
  alert('Memory Game Restarted!');
}