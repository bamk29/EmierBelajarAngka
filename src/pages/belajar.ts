/**
 * Belajar Page — Belajar & Mengenal Angka (6 level)
 */

import { navigateTo } from '../router';
import { speak, speakAngkaLengkap, speakInstruksi, getNamaAngka } from '../tts';
import { LEVEL_CONFIGS, loadProgress, completeSubLevel } from '../levels';
import { renderVisualAngka, randRange } from '../utils';

/** Emoji objek untuk visualisasi */
const EMOJIS = ['🍎', '🌟', '🐣', '🌸', '🍊', '🎈', '🦋', '🍇', '🐠', '🌺'];

// State aplikasi
let currentLevel = 1;
let currentSubLevel = 0;
let currentCardIndex = 0;
let cards: BelajarCard[] = [];

interface BelajarCard {
  type: 'angka' | 'perbandingan' | 'penjumlahan' | 'pengurangan' | 'hitung-mundur' | 'pola';
  title: string;
  render: (container: HTMLElement) => void;
  speak: () => Promise<void>;
}

/** Generate kartu belajar sesuai level dan batas bintang (Dicicil) */
function generateCards(level: number, currentStars: number): BelajarCard[] {
  const result: BelajarCard[] = [];
  const stars = Math.min(19, currentStars); // 0-19 batasan index cicilan

  // Helper untuk membuat kartu angka
  const buatKartuAngka = (num: number, useEmoji: boolean = true) => {
    const emoji = EMOJIS[num % EMOJIS.length];
    const superBesar = num >= 1000;

    // Khusus mode uang (Level 6)
    let uangText = '';
    if (level === 6) {
      uangText = `Rp ${num.toLocaleString('id-ID')}`;
    }

    result.push({
      type: 'angka',
      title: level === 6 ? 'Mengenal Uang' : (superBesar ? 'Ribuan' : (num >= 100 ? 'Ratusan' : `Angka ${num}`)),
      render: (el) => {
        let emojiHtml = '';
        if (useEmoji && level < 6) {
          emojiHtml = renderVisualAngka(num, emoji, true);
        }

        el.innerHTML = `
          <div class="card animate-slide-up text-center" style="padding:32px 16px;">
            ${level === 6
            ? `<div class="uang-kertas animate-bounce-in" style="background:var(--color-green); color:white; padding:20px 10px; border-radius:12px; font-size:2rem; font-weight:bold; margin:0 auto 16px; border:2px dashed white; max-width: 80%;">${uangText}</div>`
            : `<div class="${superBesar ? 'big-number-sm' : 'big-number'} animate-number" style="font-size:${superBesar ? '4rem' : '6rem'}">${num.toLocaleString('id-ID')}</div>`
          }
            ${emojiHtml}
            <p style="font-size:1.3rem; font-weight:800; margin-top:12px; text-transform:uppercase;">
              ${level === 6 ? getNamaAngka(num) + ' rupiah' : getNamaAngka(num)}
            </p>
          </div>
        `;
      },
      speak: async () => {
        if (level === 6) await speak(`${getNamaAngka(num)} rupiah`);
        else await speakAngkaLengkap(num);
      }
    });
  };

  switch (level) {
    case 1: {
      const start = stars * 5 + 1;
      for (let i = start; i < start + 5; i++) {
        buatKartuAngka(i, true);
      }
      break;
    }
    case 2: {
      const baseTen = (stars % 9) + 1;
      buatKartuAngka(baseTen * 10, true);
      buatKartuAngka(baseTen * 10 + randRange(1, 9), true);

      const a = randRange(1, 10);
      const b = randRange(1, 10);
      if (a !== b) {
        const bigger = Math.max(a, b);
        const smaller = Math.min(a, b);
        const emojiA = EMOJIS[a % EMOJIS.length];
        const emojiB = EMOJIS[b % EMOJIS.length];
        result.push({
          type: 'perbandingan',
          title: 'Belajar Perbandingan',
          render: (el) => {
            el.innerHTML = `
              <div class="card animate-slide-up text-center" style="padding:24px 16px;">
                <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Mana yang lebih banyak? 🤔</p>
                <div style="display:flex; gap:16px; justify-content:center; align-items:flex-end;">
                  <div style="flex:1;">
                    <div style="font-size:2.5rem; font-weight:900;">${a}</div>
                    ${renderVisualAngka(a, emojiA, false)}
                  </div>
                  <div style="font-size:1.5rem; align-self:center; font-weight:900; color:var(--text-light); padding-bottom:40px;">vs</div>
                  <div style="flex:1;">
                    <div style="font-size:2.5rem; font-weight:900;">${b}</div>
                    ${renderVisualAngka(b, emojiB, false)}
                  </div>
                </div>
                <p style="font-size:1.1rem; font-weight:800; color:var(--color-green); margin-top:8px;">
                  ${getNamaAngka(bigger)} lebih banyak dari ${getNamaAngka(smaller)}!
                </p>
              </div>
            `;
          },
          speak: async () => await speak(`${getNamaAngka(bigger)} lebih banyak dari ${getNamaAngka(smaller)}`)
        });
      }
      buatKartuAngka(randRange(11, 99), false);
      break;
    }
    case 3:
      for (let i = 0; i < 5; i++) buatKartuAngka(randRange(100, 999), false);
      break;
    case 4:
      for (let i = 0; i < 5; i++) buatKartuAngka(randRange(1000, 9999), false);
      break;
    case 5: {
      for (let i = 0; i < 3; i++) {
        const a = randRange(1, 10);
        const b = randRange(1, 10);
        const hasil = a + b;
        const emoji = EMOJIS[hasil % EMOJIS.length];
        result.push({
          type: 'penjumlahan',
          title: 'Belajar Menambah',
          render: (el) => {
            el.innerHTML = `
              <div class="card animate-slide-up text-center" style="padding:24px 16px;">
                <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Konsep Menambahkan ➕</p>
                <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                   ${renderVisualAngka(a, emoji, true)}
                   <div style="font-size:2rem; font-weight:bold; margin-bottom:16px;">+</div>
                   ${renderVisualAngka(b, emoji, true)}
                </div>
                <div style="font-size:2.8rem; font-weight:900; margin:8px 0; color:var(--color-blue)">
                  ${a} + ${b} = ${hasil}
                </div>
                <p style="font-size:1.1rem; color:var(--text-light);">
                  ${getNamaAngka(a)} ditambah ${getNamaAngka(b)} sama dengan ${getNamaAngka(hasil)}
                </p>
              </div>
            `;
          },
          speak: async () => await speak(`${getNamaAngka(a)} ditambah ${getNamaAngka(b)} sama dengan ${getNamaAngka(hasil)}`, 0.85)
        });
      }
      for (let i = 0; i < 2; i++) {
        const a = randRange(5, 10);
        const b = randRange(1, a - 1);
        const hasil = a - b;
        const emoji = EMOJIS[a % EMOJIS.length];
        result.push({
          type: 'pengurangan',
          title: 'Belajar Mengurang',
          render: (el) => {
            el.innerHTML = `
               <div class="card animate-slide-up text-center" style="padding:24px 16px;">
                 <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Konsep Mengurangi ➖</p>
                 <div style="display:flex; flex-direction:column; align-items:center;">
                   <div style="opacity:0.6;">Mula-mula: ${a}</div>
                   ${renderVisualAngka(a, emoji, true)}
                   <div style="font-size:1.2rem; font-weight:bold; margin:8px 0; color:var(--color-pink);">--- Dikurangi ${b} ---</div>
                   <div style="opacity:0.6;">Sisa: ${hasil}</div>
                   ${renderVisualAngka(hasil, emoji, true)}
                 </div>
                 <div style="font-size:2.8rem; font-weight:900; margin:16px 0; color:var(--color-orange)">
                   ${a} − ${b} = ${hasil}
                 </div>
                 <p style="font-size:1.1rem; color:var(--text-light);">
                   Jika punya ${getNamaAngka(a)}, lalu dikurangi ${getNamaAngka(b)}, maka sisanya menjadi ${getNamaAngka(hasil)}!
                 </p>
               </div>
             `;
          },
          speak: async () => await speak(`Jika kamu punya ${getNamaAngka(a)}, lalu diambil ${getNamaAngka(b)}, maka sisanya menjadi ${getNamaAngka(hasil)}!`, 0.85)
        });
      }
      break;
    }
    case 6: {
      const pecahanUang = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
      const maxIndex = Math.min(pecahanUang.length, Math.floor(stars / 2) + 4);
      for (let i = 0; i < 5; i++) {
        buatKartuAngka(pecahanUang[randRange(0, maxIndex - 1)], false);
      }
      break;
    }
  }

  return result;
}

/** Render level selector */
function renderLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.belajar;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:48px;">
      <h1>📖 Belajar & Mengenal</h1>
      <p class="subtitle">Pilih level untuk mulai belajar</p>
    </div>
    <div class="level-grid mt-lg">
      ${LEVEL_CONFIGS.map((cfg, i) => {
    const lvl = i + 1;
    const completed = mp.stars[i] >= cfg.requiredStars;
    const cls = completed ? 'completed' : '';
    return `
          <button class="level-btn animate-bounce-in ${cls}" data-level="${lvl}">
            <span class="level-icon">${cfg.icon}</span>
            <span>Lv.${lvl}</span>
            <span style="font-size:0.75rem;">${cfg.name}</span>
            <div style="margin-top: 4px; font-size: 0.85rem; font-weight: bold; color: ${completed ? 'var(--color-green)' : 'var(--text-light)'}">
               ⭐ ${mp.stars[i]}/${cfg.requiredStars}
            </div>
            ${completed ? '<span style="font-size:0.6rem; color:green;">LULUS</span>' : ''}
          </button>
        `;
  }).join('')}
    </div>
    <div class="card mt-lg animate-slide-up" style="padding:16px;">
      <p style="font-size:0.9rem; color:var(--text-light); text-align:center;">
        Kumpulkan <strong>${LEVEL_CONFIGS[0].requiredStars} Bintang</strong> tiap level untuk menjadi Juara!<br>
      </p>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => navigateTo('home'));

  container.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = parseInt((btn as HTMLElement).dataset.level || '1');
      renderSubLevelSelector(container);
    });
  });

  speakInstruksi('Pilih level untuk mulai belajar!');
}

/** Render grid pilihan bintang 1-20 (Sub-Level) */
function renderSubLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.belajar;
  const cfg = LEVEL_CONFIGS[currentLevel - 1];
  const maxUnlockedStar = mp.stars[currentLevel - 1] || 0;
  const totalStars = cfg.requiredStars;

  let gridHtml = '';
  for (let i = 0; i < totalStars; i++) {
    const isUnlocked = i <= maxUnlockedStar;
    const isCompleted = i < maxUnlockedStar;

    let cls = 'locked';
    let icon = '🔒';
    let bg = 'var(--bg-card)';
    let cursor = 'not-allowed';

    if (isCompleted) {
      cls = 'completed animate-bounce-in';
      icon = '⭐';
      bg = 'var(--color-green)';
      cursor = 'pointer';
    } else if (i === maxUnlockedStar) {
      cls = 'current animate-pulse';
      icon = '🌟';
      bg = 'var(--color-blue)';
      cursor = 'pointer';
    }

    gridHtml += `
      <button class="sublevel-btn ${cls}" data-sublevel="${i}" ${!isUnlocked ? 'disabled' : ''}
              style="width:60px; height:60px; border-radius:12px; border:none; background:${bg}; color:white; font-size:1.5rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:${cursor}; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <span>${icon}</span>
        <span style="font-size:0.8rem; font-weight:bold; margin-top:2px;">${i + 1}</span>
      </button>
    `;
  }

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:48px;">
      <h1>Peta Bintang Lv.${currentLevel}</h1>
      <p class="subtitle">Pilih bintang materi yang mau dicoba!</p>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; padding:20px; max-width:400px; margin:0 auto;">
      ${gridHtml}
    </div>
  `;

  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));

  container.querySelectorAll('.sublevel-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSubLevel = parseInt((btn as HTMLElement).dataset.sublevel || '0');
      currentCardIndex = 0;
      cards = generateCards(currentLevel, currentSubLevel);
      renderCard(container);
    });
  });

  speakInstruksi('Pilih bintang untuk mulai belajar.');
}

/** Render kartu belajar saat ini */
function renderCard(container: HTMLElement): void {
  const card = cards[currentCardIndex];
  const total = cards.length;
  const cfg = LEVEL_CONFIGS[currentLevel - 1];

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          ${cfg.icon} Level ${currentLevel} — Bintang ${currentSubLevel + 1}
        </span>
      </div>
      <div class="progress-bar">
        <div class="fill" style="width:${((currentCardIndex + 1) / total) * 100}%"></div>
      </div>
      <div style="text-align:right; font-size:0.8rem; color:var(--text-light);">
        ${currentCardIndex + 1} / ${total}
      </div>
    </div>
    <div id="card-content" style="flex:1; display:flex; flex-direction:column; justify-content:center;"></div>
    <div style="display:flex; gap:12px; padding:16px 0;">
      <button id="btn-prev" class="btn btn-sm btn-pink" style="flex:1;" ${currentCardIndex === 0 ? 'disabled style="flex:1;opacity:0.4;"' : ''}>
        ◀ Sebelumnya
      </button>
      <button id="btn-speak" class="speaker-btn">🔊</button>
      <button id="btn-next" class="btn btn-sm btn-green" style="flex:1;">
        ${currentCardIndex === total - 1 ? '✅ Selesai' : 'Berikutnya ▶'}
      </button>
    </div>
  `;

  const cardEl = document.getElementById('card-content')!;
  card.render(cardEl);

  setTimeout(() => card.speak(), 300);

  document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));

  document.getElementById('btn-prev')!.addEventListener('click', () => {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      renderCard(container);
    }
  });

  document.getElementById('btn-speak')!.addEventListener('click', () => card.speak());

  document.getElementById('btn-next')!.addEventListener('click', () => {
    if (currentCardIndex < total - 1) {
      currentCardIndex++;
      renderCard(container);
    } else {
      renderSubLevelComplete(container);
    }
  });
}

/** Render layar selesai sub-level */
function renderSubLevelComplete(container: HTMLElement): void {
  completeSubLevel('belajar', currentLevel, currentSubLevel);
  const totalStarsNeeded = LEVEL_CONFIGS[currentLevel - 1].requiredStars;

  container.innerHTML = `
    <div class="result-screen animate-slide-up">
      <div style="font-size:5rem;" class="animate-bounce-in">🌟</div>
      <h1>Selesai!</h1>
      <p class="message">Hebat! Kamu berhasil menyelesaikan kelas ini!</p>
      <div class="score-big" style="color:var(--color-green);">
        +1 Bintang
      </div>
      <div class="flex-col w-full" style="gap:12px; margin-top:20px; max-width:300px;">
        ${currentSubLevel < totalStarsNeeded - 1 ? `
          <button id="btn-next-star" class="btn btn-green btn-sm animate-pulse">🌟 Bintang Berikutnya</button>
        ` : ''}
        <button id="btn-again" class="btn btn-blue btn-sm">🔄 Ulangi Materi Ini</button>
        <button id="btn-back-levels" class="btn btn-yellow btn-sm">📋 Peta Bintang</button>
      </div>
    </div>
  `;

  speak('Hebat! Materi selesai!');

  const btnNext = document.getElementById('btn-next-star');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentSubLevel++;
      currentCardIndex = 0;
      cards = generateCards(currentLevel, currentSubLevel);
      renderCard(container);
    });
  }

  document.getElementById('btn-again')!.addEventListener('click', () => {
    currentCardIndex = 0;
    cards = generateCards(currentLevel, currentSubLevel);
    renderCard(container);
  });

  document.getElementById('btn-back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));
}

/** Entry point halaman belajar */
export function renderBelajar(container: HTMLElement): void {
  renderLevelSelector(container);
}
