/**
 * Home Page — Menu utama dengan 3 tombol besar
 * Belajar, Ujian, Bermain + link dashboard
 */

import { navigateTo } from '../router';
import { speak } from '../tts';
import { getTotalStars } from '../levels';

export function renderHome(container: HTMLElement): void {
  const totalStars = getTotalStars();

  container.innerHTML = `
    <div class="flex-col items-center" style="flex:1; justify-content:center; gap:24px; padding-top:20px;">
      
      <!-- Header / Judul -->
      <div class="page-header animate-bounce-in" style="animation-delay:0s">
        <div style="font-size:3.5rem; margin-bottom:8px;" class="animate-float">🌟</div>
        <h1>Ayo Belajar Angka!</h1>
        <p class="subtitle">Untuk Anak Usia 3-5 Tahun</p>
      </div>

      <!-- Total Bintang -->
      <div class="card animate-bounce-in text-center" style="animation-delay:0.1s; width:100%; padding:12px;">
        <span style="font-size:1.2rem;">⭐ ${totalStars} Bintang Terkumpul</span>
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
    speak('Halo adik-adik! Mau belajar apa hari ini?', 0.85);
  }, 800);
}
