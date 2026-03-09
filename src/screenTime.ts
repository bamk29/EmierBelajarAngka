/**
 * ScreenTime Module — Manajemen waktu layar anak
 * Memberikan peringatan istirahat setiap 20-30 menit
 */

let screenTimeSeconds = 0;
let breakLimitSeconds = 20 * 60; // Default 20 menit
let isTimerActive = false;
let timerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inisialisasi Screen Time Timer
 */
export function initScreenTime(): void {
    if (isTimerActive) return;
    isTimerActive = true;

    timerInterval = setInterval(() => {
        screenTimeSeconds++;

        if (screenTimeSeconds >= breakLimitSeconds) {
            showBreakModal();
            screenTimeSeconds = 0; // Reset setelah istirahat (atau sesuai kebutuhan)
        }
    }, 1000);
}

/**
 * Menampilkan modal peringatan istirahat
 */
function showBreakModal(): void {
    const container = document.getElementById('app');
    if (!container) return;

    const modal = document.createElement('div');
    modal.id = 'break-modal';
    modal.className = 'modal-overlay animate-fade-in';
    modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 3000;
  `;

    modal.innerHTML = `
    <div class="card animate-bounce-in" style="width: 90%; max-width: 400px; padding: 40px 24px; text-align: center;">
      <div style="font-size: 5rem;" class="animate-float">🥛</div>
      <h2 style="margin: 20px 0 10px; color: var(--color-purple);">Waktunya Istirahat!</h2>
      <p style="color: var(--text-light); line-height: 1.6; margin-bottom: 30px;">
        Wah, sudah asik belajar ya!<br>
        Yuk, istirahatkan mata sejenak, minum air putih, atau gerakkan badanmu.
      </p>
      
      <button id="btn-continue" class="btn btn-purple" style="width: 100%;">
        Sudah Segar, Lanjut Lagi! 🚀
      </button>
    </div>
  `;

    container.appendChild(modal);

    document.getElementById('btn-continue')!.addEventListener('click', () => {
        modal.classList.add('animate-fade-out');
        setTimeout(() => modal.remove(), 500);
    });
}

/**
 * Stop the screen time timer
 */
export function stopScreenTime(): void {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isTimerActive = false;
}

/**
 * Reset timer (misal jika orang tua ingin menambah waktu)
 */
export function resetScreenTimer(): void {
    screenTimeSeconds = 0;
}

/**
 * Ubah batas waktu istirahat
 */
export function setBreakLimit(minutes: number): void {
    breakLimitSeconds = minutes * 60;
}
