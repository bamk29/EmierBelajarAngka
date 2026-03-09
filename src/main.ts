/**
 * App State — Hash-based SPA router
 * Mengelola navigasi antar halaman dan state global
 */

import './styles/main.css';
import './styles/animations.css';
import { speak, toggleAudio, isAudioEnabled } from './tts';
import { renderHome } from './pages/home';
import { renderBelajar } from './pages/belajar';
import { renderUjian } from './pages/ujian';
import { renderBermain } from './pages/bermain';
import { renderDashboard } from './pages/dashboard';
import { preloadSFX, playSFX } from './sfx';
import { initScreenTime } from './screenTime';

/** Container utama */
let appEl: HTMLElement;

/** Route saat ini */
let currentRoute: string | null = null;

/** Definisi route */
type RouteRenderer = (container: HTMLElement, params?: Record<string, string>) => void;

const routes: Record<string, RouteRenderer> = {
  'home': renderHome,
  'belajar': renderBelajar,
  'ujian': renderUjian,
  'bermain': renderBermain,
  'dashboard': renderDashboard
};

/**
 * Parse hash URL
 * Format: #page atau #page?level=2
 */
function parseHash(): { page: string; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, queryString] = hash.split('?');
  const params: Record<string, string> = {};

  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  }

  return { page, params };
}



/** Render halaman berdasarkan hash */
function renderCurrentRoute(): void {
  const { page, params } = parseHash();

  // Jangan re-render jika route sama
  if (currentRoute === window.location.hash) return;
  currentRoute = window.location.hash;

  // Cari renderer
  const renderer = routes[page] || routes['home'];

  // Clear container & render
  appEl.innerHTML = '';
  renderer(appEl, params);
}

/** Buat floating bubbles dekoratif */
function createFloatingBubbles(): void {
  const container = document.createElement('div');
  container.className = 'floating-bubbles';

  const colors = ['#FFE066', '#74C0FC', '#69DB7C', '#FF8787', '#DA77F2'];

  for (let i = 0; i < 8; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = 30 + Math.random() * 80;
    bubble.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      background: ${colors[i % colors.length]};
      animation: float ${4 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 3}s;
    `;
    container.appendChild(bubble);
  }

  document.body.appendChild(container);
}

/** Buat tombol toggle audio global */
function createAudioToggle(): void {
  const btn = document.createElement('button');
  btn.className = 'audio-toggle-btn animate-bounce-in';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background: var(--color-green);
    color: white;
    font-size: 1.8rem;
    border: none;
    box-shadow: 0 4px 0 rgba(0,0,0,0.2);
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const updateBtnUI = () => {
    btn.innerHTML = isAudioEnabled ? '🔊' : '🔇';
    btn.style.background = isAudioEnabled ? 'var(--color-green)' : 'var(--color-red)';
  };

  updateBtnUI();

  btn.addEventListener('click', () => {
    toggleAudio();
    updateBtnUI();
    // Beri feedback suara saat dinyalakan kembali
    if (isAudioEnabled) {
      speak('Suara nyala', 1.2);
      playSFX('click');
    }
  });

  document.body.appendChild(btn);
}

/** Inisialisasi aplikasi */
async function initApp(): Promise<void> {
  appEl = document.getElementById('app')!;

  // Tampilkan loading
  // Buat dekorasi bubbles
  createFloatingBubbles();

  // Buat tombol audio global
  createAudioToggle();

  // Preload SFX & Init Screen Time
  preloadSFX();
  initScreenTime();

  // Buat layar interaksi awal (Autoplay Policy requirement)
  appEl.innerHTML = `
    <div class="result-screen animate-slide-up" style="background:var(--color-bg);">
      <div style="font-size:5rem;" class="animate-bounce-in">🌟</div>
      <h1 style="color:var(--color-purple); font-size:2.5rem; text-shadow:2px 2px 0px white;">Ayo Belajar!</h1>
      <button id="btn-start-app" class="btn btn-blue" style="font-size:1.5rem; padding:20px 40px; margin-top:30px; border-radius:30px; animation: pulse 2s infinite;">
        ▶ Mulai Bermain
      </button>
    </div>
  `;

  document.getElementById('btn-start-app')!.addEventListener('click', async () => {
    // Putar suara kosong / pendek sekadar trigger audio context unlock
    playSFX('click');
    await speak('Halo', 1);

    // Setup router & render halaman awal
    window.addEventListener('hashchange', renderCurrentRoute);
    renderCurrentRoute();
  });
}

// Jalankan saat DOM ready
initApp();
