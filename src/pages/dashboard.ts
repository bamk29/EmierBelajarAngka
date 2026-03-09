/**
 * Dashboard Page — Progress anak (untuk orang tua)
 * Dilindungi parental gate sederhana
 */

import { navigateTo } from '../router';
import { speak } from '../tts';
import { LEVEL_CONFIGS, loadProgress, resetProgress, getTotalStars, getChildProfile, type MenuType } from '../levels';
import { showProfileModal } from '../components/ProfileModal';
import { setBreakLimit } from '../screenTime';

/** Render parental gate */
export function renderDashboard(container: HTMLElement): void {
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let passed = false;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="parental-gate" style="flex:1; justify-content:center;">
      <div style="font-size:4rem;">🔒</div>
      <h2>Area Orang Tua</h2>
      <p class="instruction">
        Tekan dan tahan tombol di bawah selama 3 detik<br>untuk mengakses dashboard
      </p>
      <button id="gate-btn" class="btn btn-purple" style="max-width:280px;">
        🔓 Tekan & Tahan 3 Detik
      </button>
      <div id="gate-progress" style="width:280px; height:6px; background:rgba(0,0,0,0.1); border-radius:3px; overflow:hidden;">
        <div id="gate-fill" style="width:0%; height:100%; background:var(--color-purple); transition:width 3s linear;"></div>
      </div>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => navigateTo('home'));

  const gateBtn = document.getElementById('gate-btn')!;
  const gateFill = document.getElementById('gate-fill')!;

  // Touch/mouse events untuk hold
  const startHold = () => {
    if (passed) return;
    gateFill.style.width = '100%';
    holdTimer = setTimeout(() => {
      passed = true;
      renderDashboardContent(container);
    }, 3000);
  };

  const endHold = () => {
    if (holdTimer && !passed) {
      clearTimeout(holdTimer);
      gateFill.style.transition = 'width 0.3s';
      gateFill.style.width = '0%';
      setTimeout(() => { gateFill.style.transition = 'width 3s linear'; }, 300);
    }
  };

  gateBtn.addEventListener('mousedown', startHold);
  gateBtn.addEventListener('mouseup', endHold);
  gateBtn.addEventListener('mouseleave', endHold);
  gateBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
  gateBtn.addEventListener('touchend', endHold);
  gateBtn.addEventListener('touchcancel', endHold);
}

/** Render konten dashboard sebenarnya */
function renderDashboardContent(container: HTMLElement): void {
  const progress = loadProgress();
  const totalStars = getTotalStars();

  const menuNames: Record<MenuType, string> = {
    belajar: '📖 Belajar & Mengenal',
    ujian: '⭐ Ujian',
    bermain: '🎮 Bermain'
  };

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div style="padding-top:48px;">
      <div class="page-header animate-slide-up">
        <h1>📊 Dashboard Orang Tua</h1>
      </div>

      <!-- Child Profile Card -->
      <div class="card animate-bounce-in" style="padding:16px; display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <div style="font-size:3rem; background:var(--color-blue-light); width:80px; height:80px; display:flex; align-items:center; justify-content:center; border-radius:20px;">
          ${getChildProfile().avatar || '🦁'}
        </div>
        <div style="flex:1;">
          <div style="font-size:0.9rem; color:var(--text-light);">Profil Anak</div>
          <div style="font-size:1.4rem; font-weight:800;">${getChildProfile().name || '(Belum diatur)'}</div>
        </div>
        <button id="btn-edit-profile" class="btn btn-sm btn-blue" style="width:auto; padding:8px 16px;">
          📝 Ubah
        </button>
      </div>

      <!-- Total Stats -->
      <div class="stat-card animate-bounce-in">
        <span class="stat-icon">⭐</span>
        <div class="stat-info">
          <div class="stat-label">Total Bintang</div>
          <div class="stat-value">${totalStars}</div>
        </div>
      </div>

      <!-- Per Menu Stats -->
      ${(['belajar', 'ujian', 'bermain'] as MenuType[]).map(menu => {
    const mp = progress[menu];
    const totalMenuStars = mp.stars.reduce((a: number, b: number) => a + b, 0);

    return `
          <div class="card mt-md animate-slide-up" style="padding:16px;">
            <h3 style="font-size:1.1rem; margin-bottom:12px;">${menuNames[menu]}</h3>
            <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:8px;">
              Level tertinggi: ${mp.unlockedLevel} / ${LEVEL_CONFIGS.length} &nbsp;|&nbsp; ⭐ ${totalMenuStars}
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${LEVEL_CONFIGS.map((cfg, i) => {
      const stars = mp.stars[i];
      const unlocked = i + 1 <= mp.unlockedLevel;
      return `
                  <div style="padding:6px 10px; border-radius:10px; font-size:0.8rem; font-weight:700;
                    background:${!unlocked ? '#eee' : stars > 0 ? 'var(--color-green)' : 'var(--color-blue)'};
                    color:${!unlocked ? '#999' : 'white'};">
                    ${cfg.icon} Lv.${i + 1} ${stars > 0 ? `⭐${stars}` : unlocked ? '🔓' : '🔒'}
                  </div>
                `;
    }).join('')}
            </div>
          </div>
        `;
  }).join('')}

      <!-- Pengaturan -->
      <div class="card mt-md animate-slide-up" style="padding:16px;">
        <h3 style="font-size:1.1rem; margin-bottom:12px;">⚙️ Pengaturan</h3>
        <div style="margin-bottom:16px;">
          <div style="font-size:0.9rem; margin-bottom:8px;">Batas Waktu Istirahat (Menit)</div>
          <div style="display:flex; gap:8px;">
            ${[10, 20, 30, 60].map(min => `
              <button class="btn btn-sm btn-timer" data-min="${min}" 
                      style="flex:1; padding:8px; border:2px solid #eee; background:white; color:var(--text); border-radius:10px;">
                ${min}m
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Saran -->
      <div class="card mt-md animate-slide-up" style="padding:16px;">
        <h3 style="font-size:1.1rem; margin-bottom:8px;">💡 Saran</h3>
        <p style="font-size:0.85rem; color:var(--text-light); line-height:1.5;">
          ${generateSaran(progress)}
        </p>
      </div>

      <!-- Reset Button -->
      <button id="btn-reset" class="btn btn-sm btn-pink mt-lg" style="max-width:250px; margin:16px auto;">
        🗑️ Reset Semua Progress
      </button>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => navigateTo('home'));

  document.getElementById('btn-reset')!.addEventListener('click', () => {
    if (confirm('Yakin ingin menghapus semua progress? Tindakan ini tidak bisa dibatalkan.')) {
      resetProgress();
      speak('Progress sudah direset');
      renderDashboardContent(container);
    }
  });

  document.getElementById('btn-edit-profile')!.addEventListener('click', () => {
    showProfileModal(container, true);
  });

  // Re-render jika profil diupdate
  const handleProfileUpdate = () => {
    renderDashboardContent(container);
  };
  window.addEventListener('profile-updated', handleProfileUpdate, { once: true });

  // Event: Update Timer
  const timerBtns = container.querySelectorAll('.btn-timer');
  timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const min = parseInt((btn as HTMLElement).dataset.min || '20');
      setBreakLimit(min);
      timerBtns.forEach(b => (b as HTMLElement).style.borderColor = '#eee');
      (btn as HTMLElement).style.borderColor = 'var(--color-purple)';
      speak(`Batas waktu diatur ${min} menit`);
    });
  });
}

/** Generate saran berdasarkan progress */
function generateSaran(progress: Record<MenuType, any>): string {
  const tips: string[] = [];

  if (progress.belajar.unlockedLevel <= 2) {
    tips.push('Mulai dengan menu Belajar untuk mengenalkan angka dasar.');
  }
  if (progress.ujian.unlockedLevel < progress.belajar.unlockedLevel) {
    tips.push('Coba Ujian untuk menguji pemahaman yang sudah dipelajari.');
  }
  if (progress.bermain.unlockedLevel <= 1) {
    tips.push('Menu Bermain bisa memotivasi anak untuk belajar sambil bersenang-senang!');
  }
  if (progress.ujian.stars.some((s: number, i: number) => s > 0 && s < LEVEL_CONFIGS[i].soalCount * 0.7)) {
    tips.push('Ada level ujian yang bisa diulang untuk meningkatkan skor.');
  }

  if (tips.length === 0) {
    tips.push('Anak sudah belajar dengan baik! Terus berlatih untuk mempertajam kemampuan.');
  }

  return tips.join(' ');
}
