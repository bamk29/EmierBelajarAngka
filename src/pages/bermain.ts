/**
 * Bermain Page — Mini-games interaktif (5 level)
 * Level 1: Pop Balon (angka 1-5)
 * Level 2: Tebak & Bandingkan
 * Level 3: Hitung Benda
 * Level 4: Susun Urutan
 * Level 5: Tebak Pola
 */

import { navigateTo } from '../router';
import { speak, speakPujian, speakSalah, speakInstruksi, getNamaAngka } from '../tts';
import { LEVEL_CONFIGS, loadProgress, completeSubLevel, isLevelUnlocked } from '../levels';
import { fireConfetti } from '../confetti';
import { renderVisualAngka, randRange, shuffle } from '../utils';


const EMOJIS = ['🍎', '🌟', '🐣', '🌸', '🍊', '🎈', '🦋', '🍇', '🐠', '🌺'];
const BALLOON_COLORS = ['#FF6B6B', '#74C0FC', '#69DB7C', '#FFE066', '#DA77F2', '#FFA94D', '#F06595'];

/** Dapatkan range angka dinamis berdasarkan bintang (sub-level) */
function getDynamicRange(level: number): [number, number] {
  const mp = loadProgress().bermain;
  const stars = mp.stars[level - 1] || 0;

  const maxStars = 19;
  const progressRatio = Math.min(1, stars / maxStars);

  if (level === 1) { // Pop Balon: 1-100
    const windowSize = Math.floor(5 + (15 * progressRatio));
    const min = Math.floor(1 + (79 * progressRatio));
    return [min, min + windowSize];
  } else if (level === 2) { // Bandingkan: 10-99
    const min = Math.floor(10 + (60 * progressRatio));
    const windowSize = Math.floor(10 + (20 * progressRatio));
    return [min, Math.min(99, min + windowSize)];
  } else if (level === 3) { // Hitung Benda (Ratusan): 2-20 visual limit
    const min = Math.floor(2 + (13 * progressRatio));
    return [min, min + 5];
  } else if (level === 4) { // Susun Urutan (Ribuan): 1-100
    const windowSize = Math.floor(5 + (15 * progressRatio));
    const min = Math.floor(1 + (79 * progressRatio));
    return [min, min + windowSize];
  } else if (level === 5) { // Operasi: 1-20
    const windowSize = Math.floor(5 + (10 * progressRatio));
    const min = Math.floor(1 + (10 * progressRatio));
    return [min, Math.min(20, min + windowSize)];
  } else { // Level 6 (Pola): multiplier/difficulty
    const mult = Math.floor(3 + (7 * progressRatio));
    return [1, mult];
  }
}

// ===== STATE =====
let currentLevel = 1;
let currentSubLevel = 0;
let ronde = 0;
let benar = 0;
let totalRonde = 5;

/** Render level selector */
function renderLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.bermain;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:48px;">
      <h1>🎮 Bermain</h1>
      <p class="subtitle">Pilih level dan mulai bermain!</p>
    </div>
    <div class="level-grid mt-lg">
      ${LEVEL_CONFIGS.map((cfg, i) => {
    const lvl = i + 1;
    const unlocked = isLevelUnlocked('bermain', lvl);
    const stars = mp.stars[i];
    const totalStarsNeeded = cfg.requiredStars;
    const completed = stars >= totalStarsNeeded;
    const cls = !unlocked ? 'locked' : completed ? 'completed' : (lvl === mp.unlockedLevel ? 'current' : '');
    const gameNames = ['Pop Balon', 'Bandingkan', 'Hitung Benda', 'Susun Urutan', 'Tebak Pola'];
    return `
          <button class="level-btn animate-bounce-in ${cls}" data-level="${lvl}" ${!unlocked ? 'disabled' : ''}>
            <span class="level-icon">${cfg.icon}</span>
            <span>Lv.${lvl}</span>
            <span style="font-size:0.7rem;">${gameNames[i]}</span>
            <div style="margin-top: 4px; font-size: 0.85rem; font-weight: bold; color: ${completed ? 'var(--color-green)' : 'var(--text-light)'}">
               ⭐ ${stars}/${totalStarsNeeded}
            </div>
            ${completed ? '<span style="font-size:0.6rem; color:green;">LULUS</span>' : ''}
          </button>
        `;
  }).join('')}
    </div>
    <div class="card mt-lg animate-slide-up" style="padding:16px;">
      <p style="font-size:0.9rem; color:var(--text-light); text-align:center;">
        Kumpulkan <strong>${LEVEL_CONFIGS[0].requiredStars} Bintang</strong> tiap level untuk membuka mini game baru!<br>
      </p>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => navigateTo('home'));

  container.querySelectorAll('.level-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = parseInt((btn as HTMLElement).dataset.level || '1');
      renderSubLevelSelector(container);
    });
  });

  speakInstruksi('Pilih level untuk mulai bermain!');
}

/** Render grid pilihan bintang 1-20 (Sub-Level) */
function renderSubLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.bermain;
  const cfg = LEVEL_CONFIGS[currentLevel - 1];
  const maxUnlockedStar = mp.stars[currentLevel - 1] || 0;
  const totalStars = cfg.requiredStars;

  let gridHtml = '';
  // Loop grid Peta Bintang
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
      <p class="subtitle">Bintang berapa yang mau dimainkan?</p>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; padding:20px; max-width:400px; margin:0 auto;">
      ${gridHtml}
    </div>
  `;

  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));

  container.querySelectorAll('.sublevel-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSubLevel = parseInt((btn as HTMLElement).dataset.sublevel || '0');
      ronde = 0;
      benar = 0;
      totalRonde = LEVEL_CONFIGS[currentLevel - 1].rondeCount;
      startGame(container);
    });
  });

  speakInstruksi('Pilih bintang untuk mulai bermain.');
}

/** Start game sesuai level */
function startGame(container: HTMLElement): void {
  switch (currentLevel) {
    case 1: renderPopBalon(container); break;
    case 2: renderBandingkan(container); break;
    case 3: renderHitungBenda(container); break;
    case 4: renderSusunUrutan(container); break;
    case 5: renderSusunUrutan(container); break; // Lv5 (Operasi) reuse Susun Urutan
    case 6: renderTebakPola(container); break;
    default: renderPopBalon(container);
  }
}

// ===== GAME 1: POP BALON (Level 1) =====
function renderPopBalon(container: HTMLElement): void {
  const [min, max] = getDynamicRange(1);
  const target = randRange(min, max);

  // Generate 5-7 balon dengan angka acak, pastikan target ada
  const balonCount = randRange(5, 7);
  const angkaList: number[] = [target];
  while (angkaList.length < balonCount) {
    const n = randRange(min, max);
    angkaList.push(n);
  }
  const balonAngka = shuffle(angkaList);

  // Sistem grid dasar untuk cegah tumpukan
  const positions: { left: number, delay: number }[] = [];
  for (let i = 0; i < balonCount; i++) {
    const sectionWidth = 80 / balonCount;
    const baseLeft = 10 + (i * sectionWidth);
    positions.push({
      left: baseLeft + randRange(0, Math.floor(sectionWidth * 0.4)),
      delay: i * 0.12 // Percepat munculnya
    });
  }
  const randomPositions = shuffle(positions);

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          🎈 Pop Balon — Ronde ${ronde + 1}/${totalRonde}
        </span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
        <span>⭐ ${benar}</span>
        <span>${ronde + 1}/${totalRonde}</span>
      </div>
    </div>
    <div class="soal-cerita animate-slide-up" style="margin-top:16px; display:flex; flex-direction:column; align-items:center;">
      <p style="font-size:1.3rem; font-weight:800; margin-bottom:12px;">Dengarkan & Cari Balonnya! 🎈</p>
      <button id="btn-instruksi" class="speaker-btn" style="width:80px; height:80px; font-size:2.5rem; background:var(--color-blue); color:white; border-radius:50%; box-shadow:0 6px 15px rgba(0,0,0,0.2);">🔊</button>
    </div>
    <div class="balloon-container mt-md">
      ${balonAngka.map((n, i) => {
    const color = BALLOON_COLORS[i % BALLOON_COLORS.length];
    const pos = randomPositions[i];
    const speed = 1 + Math.random() * 1;
    return `
          <div class="balloon animate-balloon-rise" data-angka="${n}"
               style="background:${color}; left:${pos.left}%; bottom:-100px; animation-delay:${pos.delay}s; --balloon-speed:${speed}s;">
            ${n}
          </div>
        `;
  }).join('')}
    </div>
  `;

  // TTS instruksi
  const playInstruksi = () => speakInstruksi(`Cari angka ${getNamaAngka(target)}!`);
  setTimeout(playInstruksi, 300);

  document.getElementById('btn-instruksi')!.addEventListener('click', playInstruksi);
  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));

  // Event: tap balon
  container.querySelectorAll('.balloon').forEach(bal => {
    bal.addEventListener('click', async () => {
      const angka = parseInt((bal as HTMLElement).dataset.angka || '0');
      if (angka === target) {
        (bal as HTMLElement).classList.remove('animate-balloon-rise');
        (bal as HTMLElement).classList.add('animate-balloon-pop');
        benar++;
        fireConfetti(40);
        await speakPujian();
        nextRonde(container);
      } else {
        (bal as HTMLElement).classList.add('animate-shake');
        await speakSalah();
        setTimeout(() => (bal as HTMLElement).classList.remove('animate-shake'), 500);
      }
    });
  });
}

// ===== GAME 2: BANDINGKAN (Level 2) =====
function renderBandingkan(container: HTMLElement): void {
  const [min, max] = getDynamicRange(2);
  const a = randRange(min, max);
  let b = randRange(min, max);
  while (b === a) b = randRange(min, max);
  const bigger = Math.max(a, b);
  const emojiA = EMOJIS[a % EMOJIS.length];
  const emojiB = EMOJIS[b % EMOJIS.length];

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          🔍 Bandingkan — Ronde ${ronde + 1}/${totalRonde}
        </span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
        <span>⭐ ${benar}</span><span>${ronde + 1}/${totalRonde}</span>
      </div>
    </div>
    <div class="soal-cerita animate-slide-up" style="margin-top:16px;">
      <p style="font-size:1.3rem; font-weight:800; margin-bottom:16px;">Mana yang lebih banyak? 🤔</p>
    </div>
    <div style="display:flex; gap:16px; margin-top:16px; align-items:flex-end;">
      <button class="card animate-bounce-in compare-btn" data-val="${a}" style="flex:1; cursor:pointer; text-align:center; padding:12px;">
        <div style="font-size:2rem; font-weight:900; margin-bottom:8px;">?</div>
        ${renderVisualAngka(a, emojiA, false)}
      </button>
      <button class="card animate-bounce-in compare-btn" data-val="${b}" style="flex:1; cursor:pointer; text-align:center; padding:12px; animation-delay:0.15s;">
        <div style="font-size:2rem; font-weight:900; margin-bottom:8px;">?</div>
        ${renderVisualAngka(b, emojiB, false)}
      </button>
    </div>
  `;

  speakInstruksi('Mana yang lebih banyak? Tap yang lebih besar!');
  document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));

  container.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = parseInt((btn as HTMLElement).dataset.val || '0');
      container.querySelectorAll('.compare-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
      if (val === bigger) {
        (btn as HTMLElement).style.border = '4px solid var(--color-green)';
        benar++;
        fireConfetti(40);
        await speakPujian();
      } else {
        (btn as HTMLElement).style.border = '4px solid var(--color-pink)';
        await speakSalah();
        await speak(`Yang lebih besar adalah ${getNamaAngka(bigger)}`);
      }
      setTimeout(() => nextRonde(container), 1200);
    });
  });
}

// ===== GAME 3: HITUNG BENDA (Level 3) =====
function renderHitungBenda(container: HTMLElement): void {
  const [min, max] = getDynamicRange(3);
  const n = randRange(min, max);
  const emoji = EMOJIS[randRange(0, EMOJIS.length - 1)];
  const pilihan = shuffle([n, n + randRange(1, 3), Math.max(1, n - randRange(1, 3))]);
  // Pastikan unik
  const uniquePilihan = [...new Set(pilihan)];
  while (uniquePilihan.length < 3) uniquePilihan.push(n + uniquePilihan.length + 1);

  const emojiHtml = renderVisualAngka(n, emoji, false); // false = jangan bocorkan jawaban

  container.innerHTML = `
      <button class="back-btn" id="back-levels">◀</button>
      <div style="padding-top:48px;">
        <div class="text-center mb-md">
          <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
            🧮 Hitung Benda — Ronde ${ronde + 1}/${totalRonde}
          </span>
        </div>
        <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
          <span>⭐ ${benar}</span><span>${ronde + 1}/${totalRonde}</span>
        </div>
      </div>
      <div class="soal-cerita animate-slide-up" style="margin-top:16px;">
        <p style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">Ada berapa ${emoji}?</p>
        ${emojiHtml}
      </div>
      <div class="answer-grid mt-lg">
        ${uniquePilihan.slice(0, 3).map(p => `
          <button class="answer-btn" data-answer="${p}">${p}</button>
        `).join('')}
      </div>
    `;

  speakInstruksi(`Ada berapa? Hitung ya!`);
  document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));

  container.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = parseInt((btn as HTMLElement).dataset.answer || '0');
      container.querySelectorAll('.answer-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
      if (val === n) {
        (btn as HTMLElement).classList.add('correct', 'animate-correct');
        benar++;
        fireConfetti(40);
        await speakPujian();
      } else {
        (btn as HTMLElement).classList.add('wrong', 'animate-shake');
        await speakSalah();
        await speak(`Ada ${getNamaAngka(n)}`);
      }
      setTimeout(() => nextRonde(container), 1200);
    });
  });
}

// ===== GAME 4: SUSUN URUTAN (Level 4) =====
function renderSusunUrutan(container: HTMLElement): void {
  const count = randRange(5, 7);
  const [min, max] = getDynamicRange(4);
  const start = randRange(min, max);
  const sequence = Array.from({ length: count }, (_, i) => start + i);
  const shuffled = shuffle([...sequence]);
  const sorted: number[] = [];

  function renderState() {
    container.innerHTML = `
      <button class="back-btn" id="back-levels">◀</button>
      <div style="padding-top:48px;">
        <div class="text-center mb-md">
          <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
            🔢 Susun Urutan — Ronde ${ronde + 1}/${totalRonde}
          </span>
        </div>
        <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
          <span>⭐ ${benar}</span><span>${ronde + 1}/${totalRonde}</span>
        </div>
      </div>
      <div class="soal-cerita animate-slide-up" style="margin-top:16px;">
        <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Tap angka dari kecil ke besar! 📈</p>
        <p style="font-size:0.9rem; color:var(--text-light);">
          ${sorted.length > 0 ? 'Sudah: ' + sorted.join(' → ') : 'Tap angka terkecil dulu!'}
        </p>
      </div>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:24px;">
        ${shuffled.filter(n => !sorted.includes(n)).map(n => `
          <button class="answer-btn sort-btn animate-bounce-in" data-val="${n}"
                  style="width:64px; height:64px; font-size:1.8rem;">
            ${n}
          </button>
        `).join('')}
      </div>
    `;

    document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));

    const nextExpected = sequence[sorted.length];

    container.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = parseInt((btn as HTMLElement).dataset.val || '0');
        if (val === nextExpected) {
          sorted.push(val);
          (btn as HTMLElement).classList.add('correct');
          await speak(getNamaAngka(val), 1);
          if (sorted.length === sequence.length) {
            benar++;
            fireConfetti(50);
            await speakPujian();
            setTimeout(() => nextRonde(container), 1000);
          } else {
            renderState();
          }
        } else {
          (btn as HTMLElement).classList.add('animate-shake');
          await speakSalah();
          setTimeout(() => (btn as HTMLElement).classList.remove('animate-shake'), 500);
        }
      });
    });
  }

  speakInstruksi('Tap angka dari kecil ke besar!');
  renderState();
}

// ===== GAME 5: TEBAK POLA (Level 5) =====
function renderTebakPola(container: HTMLElement): void {
  const [minMultiplier, maxMultiplier] = getDynamicRange(5);
  const polaMultiplier = randRange(minMultiplier, maxMultiplier);

  const patterns = [
    { fn: (i: number) => (i + 1) * 2 * polaMultiplier, name: 'Tebak Pola' },
    { fn: (i: number) => (i + 1) * 3 * polaMultiplier, name: 'Tebak Pola' },
    { fn: (i: number) => i * 2 + 1 + (polaMultiplier * 2), name: 'Tebak Pola' },
    { fn: (i: number) => (i + 1) * 5 * polaMultiplier, name: 'Tebak Pola' },
    { fn: (i: number) => i + 1 + polaMultiplier, name: 'Tebak Pola' },
  ];

  const pattern = patterns[randRange(0, patterns.length - 1)];
  const len = randRange(4, 6);
  const seq = Array.from({ length: len }, (_, i) => pattern.fn(i));
  const missingIdx = randRange(1, len - 1);
  const jawaban = seq[missingIdx];
  const pilihan = shuffle([jawaban, jawaban + randRange(1, 3), Math.max(1, jawaban - randRange(1, 3))]);
  const uniquePilihan = [...new Set(pilihan)];
  while (uniquePilihan.length < 3) uniquePilihan.push(jawaban + uniquePilihan.length + 2);

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          🧩 Tebak Pola — Ronde ${ronde + 1}/${totalRonde}
        </span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
        <span>⭐ ${benar}</span><span>${ronde + 1}/${totalRonde}</span>
      </div>
    </div>
    <div class="soal-cerita animate-slide-up" style="margin-top:16px;">
      <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Angka berapa yang hilang? 🤔</p>
      <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
        ${seq.map((n, i) => i === missingIdx
    ? '<div style="width:48px; height:48px; border:3px dashed var(--color-purple); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:900;">?</div>'
    : `<div style="width:48px; height:48px; border-radius:14px; background:var(--color-blue); color:white; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:900;">${n}</div>`
  ).join('')}
      </div>
    </div>
    <div class="answer-grid mt-lg">
      ${uniquePilihan.slice(0, 3).map(p => `
        <button class="answer-btn" data-answer="${p}">${p}</button>
      `).join('')}
    </div>
    <div style="padding:8px 0; text-align:center;">
      <button id="btn-speak" class="speaker-btn" style="margin:0 auto;">🔊</button>
    </div>
  `;

  speakInstruksi('Angka berapa yang hilang? Tebak polanya!');
  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));
  document.getElementById('btn-speak')!.addEventListener('click', () => {
    speakInstruksi('Angka berapa yang hilang?');
  });

  container.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = parseInt((btn as HTMLElement).dataset.answer || '0');
      container.querySelectorAll('.answer-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
      if (val === jawaban) {
        (btn as HTMLElement).classList.add('correct', 'animate-correct');
        benar++;
        fireConfetti(40);
        await speakPujian();
      } else {
        (btn as HTMLElement).classList.add('wrong', 'animate-shake');
        await speakSalah();
        await speak(`Jawabannya ${getNamaAngka(jawaban)}`);
      }
      setTimeout(() => nextRonde(container), 1200);
    });
  });
}

// ===== NEXT RONDE / HASIL =====
function nextRonde(container: HTMLElement): void {
  ronde++;
  if (ronde < totalRonde) {
    startGame(container);
  } else {
    renderHasil(container);
  }
}

/** Render layar kemajuan (hasil akhir mini game) */
function renderHasil(container: HTMLElement): void {
  const isLulus = benar >= Math.ceil(totalRonde / 2);

  if (isLulus) {
    completeSubLevel('bermain', currentLevel, currentSubLevel, benar, totalRonde);
  }

  const progress = loadProgress();
  const mp = progress.bermain;
  const progressKini = mp.stars[currentLevel - 1] || 0;
  const totalStarsNeeded = LEVEL_CONFIGS[currentLevel - 1].requiredStars;

  let starsHtml = Array.from({ length: 5 }, (_, i) =>
    i < Math.floor((benar / totalRonde) * 5) ? '⭐' : '☆'
  ).join('');

  let pesan = '';
  if (benar === totalRonde) pesan = 'Sempurna! Kamu jago sekali! 🏆';
  else if (benar >= totalRonde / 2) pesan = 'Hebat! Terus berlatih! 🌟';
  else pesan = 'Jangan menyerah! Coba lagi ya! 💪';

  container.innerHTML = `
    <div class="result-screen animate-slide-up">
      <div style="font-size:5rem;" class="animate-star">${isLulus ? '🎉' : '🌟'}</div>
      <h1>Selesai!</h1>
      <div class="score-big" style="color:var(--color-green);">
        ${isLulus ? '+1 Bintang' : 'Tidak Dapat Bintang'}
      </div>
      <div class="stars-display">${starsHtml}</div>
      <p class="message">${pesan}</p>
      
      <div class="card" style="margin: 16px 0; background: var(--bg-color); padding: 12px; border-radius: 12px; font-weight: bold;">
         Total Tabungan Bintang Lv.${currentLevel}: <br/>
         <span style="font-size:1.5rem; color:var(--color-orange)">⭐ ${progressKini} / ${totalStarsNeeded}</span>
      </div>

      <div class="flex-col w-full" style="gap:12px; max-width:300px;">
        ${isLulus && currentSubLevel < totalStarsNeeded - 1 ? `
          <button id="btn-next-star" class="btn btn-green btn-sm animate-pulse">🌟 Bintang Berikutnya</button>
        ` : ''}
        <button id="btn-again" class="btn btn-blue btn-sm">🔄 Coba Lagi Bintang Ini</button>
        <button id="btn-levels" class="btn btn-yellow btn-sm">📋 Peta Bintang</button>
      </div>
    </div>
  `;

  if (benar > 0) {
    fireConfetti(benar * 10);
    speak(pesan);
  } else {
    speak(pesan);
  }

  // Event handler opsional Next Bintang
  const btnNext = document.getElementById('btn-next-star');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      currentSubLevel++;
      ronde = 0;
      benar = 0;
      startGame(container);
    });
  }

  document.getElementById('btn-again')!.addEventListener('click', () => {
    ronde = 0;
    benar = 0;
    startGame(container);
  });

  document.getElementById('btn-levels')!.addEventListener('click', () => renderSubLevelSelector(container));
}

/** Entry point */
export function renderBermain(container: HTMLElement): void {
  renderLevelSelector(container);
}
