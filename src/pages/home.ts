/**
 * Home Page — Menu utama dengan 3 tombol besar
 * Belajar, Ujian, Bermain + link dashboard
 */

import { navigateTo } from '../router';
import { speak } from '../tts';
import { getTotalStars, getChildProfile, updateStreak } from '../levels';
import { showProfileModal } from '../components/ProfileModal';

export function renderHome(container: HTMLElement): void {
  updateStreak(); // Update streak saat masuk home
  const profile = getChildProfile();
  const name = profile.name.trim();
  const totalStars = getTotalStars();

  container.innerHTML = `
    <div class="flex-col items-center" style="flex:1; justify-content:center; gap:24px; padding-top:20px;">
      
      <!-- Header / Judul -->
      <div class="page-header animate-bounce-in" style="animation-delay:0s">
        <div style="font-size:3.5rem; margin-bottom:8px;" class="animate-float">${profile.avatar || '🌟'}</div>
        <h1>${name ? `Halo, ${name}! ✨` : 'Ayo Belajar Angka!'}</h1>
        <p class="subtitle">${name ? 'Siap belajar apa hari ini?' : 'Untuk Anak Usia 3-5 Tahun'}</p>
      </div>

      <!-- Total Bintang & Streak -->
      <div style="display:flex; gap:12px; width:100%; justify-content:center;">
        <div class="card animate-bounce-in text-center" style="animation-delay:0.1s; flex:1; padding:12px;">
          <span style="font-size:1.1rem; font-weight:700;">⭐ ${totalStars}</span>
          <div style="font-size:0.75rem; color:var(--text-light);">Bintang</div>
        </div>
        <div class="card animate-bounce-in text-center" style="animation-delay:0.15s; flex:1; padding:12px;">
          <span style="font-size:1.1rem; font-weight:700;">🔥 ${profile.streak || 0}</span>
          <div style="font-size:0.75rem; color:var(--text-light);">Hari Berturut</div>
        </div>
      </div>

      <!-- 3 Tombol Menu Utama -->
      <div class="flex-col w-full" style="gap:16px;">
        <button id="btn-belajar" class="btn btn-blue animate-bounce-in" style="animation-delay:0.15s">
          <span class="btn-icon">📖</span>
          Belajar & Mengenal
        </button>

        <button id="btn-ujian" class="btn btn-yellow animate-bounce-in" style="animation-delay:0.25s">
          <span class="btn-icon">⭐</span>
          Ujian
        </button>

        <button id="btn-bermain" class="btn btn-green animate-bounce-in" style="animation-delay:0.35s">
          <span class="btn-icon">🎮</span>
          Bermain
        </button>
      </div>

      <!-- Link Dashboard (untuk orang tua) -->
      <button id="btn-dashboard" class="btn btn-sm btn-purple animate-bounce-in" style="animation-delay:0.45s; max-width:200px;">
        ⚙️ Untuk Orang Tua
      </button>
    </div>
  `;

  // Event listeners
  document.getElementById('btn-belajar')!.addEventListener('click', () => {
    navigateTo('belajar');
  });

  document.getElementById('btn-ujian')!.addEventListener('click', () => {
    navigateTo('ujian');
  });

  document.getElementById('btn-bermain')!.addEventListener('click', () => {
    navigateTo('bermain');
  });

  document.getElementById('btn-dashboard')!.addEventListener('click', () => {
    navigateTo('dashboard');
  });

  // TTS sambutan
  setTimeout(() => {
    if (name) {
      speak(`Halo ${name}! Mau belajar apa hari ini?`, 0.85);
    } else {
      speak('Halo adik-adik! Mau belajar apa hari ini?', 0.85);
    }
  }, 800);

  // Jika nama kosong, munculkan modal profil setelah jeda dikit
  if (!name) {
    setTimeout(() => {
      showProfileModal(container);
    }, 1500);
  }

  // Listener untuk re-render jika profil diupdate (dari modal)
  window.addEventListener('profile-updated', () => {
    renderHome(container);
  }, { once: true });
}
