/**
 * Dashboard Page — Progress anak (untuk orang tua)
 * Dilindungi parental gate sederhana
 */

import { navigateTo } from '../router';
import { speak } from '../tts';
import { LEVEL_CONFIGS, loadProgress, resetProgress, getTotalStars, type MenuType } from '../levels';

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
