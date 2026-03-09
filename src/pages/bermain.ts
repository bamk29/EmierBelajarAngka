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
import { playSFX } from '../sfx';


const EMOJIS = ['🍎', '🌟', '🐣', '🌸', '🍊', '🎈', '🦋', '🍇', '🐠', '🌺'];


/** Dapatkan range angka dinamis berdasarkan bintang (sub-level) */
function getDynamicRange(level: number): [number, number] {
  const mp = loadProgress().bermain;
  const stars = mp.stars[level - 1] || 0;

  const maxStars = level === 1 ? 9 : 19;
  const progressRatio = Math.min(1, stars / maxStars);

  if (level === 1) { // Pop Balon: 1-200
    const windowSize = Math.floor(10 + (20 * progressRatio));
    const min = Math.floor(1 + (169 * progressRatio));
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
  } else { // Level 6 (Kasir Cilik): Rentang harga 1rb - 20rb
    const min = Math.floor(1 + (5 * progressRatio)); // Mulai dari 1-6rb
    const max = Math.floor(min + 4 + (10 * progressRatio)); // Sampai 10-20rb
    return [min, max];
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
    const gameNames = ['Pop Balon', 'Bandingkan', 'Hitung Benda', 'Susun Urutan', 'Tebak Pola', 'Kasir Cilik'];
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

// ===== GAME 6: KASIR CILIK (Level 6) =====
function renderKasir(container: HTMLElement): void {
  const [minPrice, maxPrice] = getDynamicRange(6);

  // Logic: Total Harga acak, Pembayar kasih uang bulat, hitung Kembalian
  const totalPrice = randRange(minPrice, maxPrice);
  const bills = [5, 10, 20, 50];
  const possiblePayments = bills.filter(b => b > totalPrice);
  const payment = possiblePayments.length > 0 ? possiblePayments[0] : Math.ceil(totalPrice / 10) * 10 + 10;
  const change = payment - totalPrice;

  // Generate options for change (one is correct)
  const options = shuffle([change, change + 1, Math.max(0, change - 1)]);
  const uniqueOptions = [...new Set(options)];
  while (uniqueOptions.length < 3) uniqueOptions.push(change + uniqueOptions.length + 2);

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div class="game-container animate-fade-in" style="display:flex; flex-direction:column; align-items:center; gap:20px; padding-top:40px;">
      
      <div class="instruction-bubble animate-bounce-in" style="width:100%; max-width:500px; text-align:center;">
        <p style="font-size:1.5rem; font-weight:800; color:var(--color-purple);">🏪 Toko Kelontong</p>
        <div style="font-size:1.2rem; margin:15px 0; padding:15px; background:white; border-radius:15px; border:3px dashed var(--color-blue);">
          Total Belanja: <span style="font-size:1.6rem; color:var(--color-pink); font-weight:900;">Rp ${totalPrice}.000</span><br>
          Dibayar: <span style="font-size:1.6rem; color:var(--color-green); font-weight:900;">Rp ${payment}.000</span>
        </div>
        <p style="font-size:1.1rem; font-weight:700;">Berapa uang kembaliannya?</p>
      </div>

      <div style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center; width:100%;">
        ${shuffle(uniqueOptions).map(opt => `
          <button class="ans-btn card animate-bounce-in" data-val="${opt}" 
                  style="width:120px; padding:20px; font-size:1.3rem; font-weight:800; cursor:pointer; border:3px solid transparent; transition:0.2s;">
            <div style="font-size:2rem; margin-bottom:5px;">💵</div>
            Rp ${opt}.000
          </button>
        `).join('')}
      </div>

      <div class="ronde-indicator">Ronde ${ronde + 1} / ${totalRonde}</div>
    </div>
  `;

  const playInstruction = () => {
    speakInstruksi(`Total belanjanya ${totalPrice} ribu rupiah. Pembeli membayar ${payment} ribu rupiah. Berapa kembaliannya?`);
  };

  playInstruction();

  container.querySelectorAll('.ans-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = parseInt((btn as HTMLElement).dataset.val || '0');

      if (val === change) {
        benar++;
        (btn as HTMLElement).style.borderColor = 'var(--color-green)';
        (btn as HTMLElement).style.background = '#e6fffa';
        playSFX('success', 0.5);
        fireConfetti(30);
        await speakPujian();
        setTimeout(() => nextRonde(container), 1000);
      } else {
        (btn as HTMLElement).classList.add('animate-shake');
        (btn as HTMLElement).style.borderColor = 'var(--color-red)';
        playSFX('fail', 0.3);
        await speakSalah();
        setTimeout(() => (btn as HTMLElement).classList.remove('animate-shake'), 500);
      }
    });
  });

  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));
}

// ===== GAME 5: OPERASI (Placeholder) =====
function renderOperasi(container: HTMLElement): void {
  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          ➕ Operasi — Ronde ${ronde + 1}/${totalRonde}
        </span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((ronde + 1) / totalRonde) * 100}%"></div></div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
        <span>⭐ ${benar}</span><span>${ronde + 1}/${totalRonde}</span>
      </div>
    </div>
    <div class="soal-cerita animate-slide-up" style="margin-top:16px;">
      <p style="font-size:1.3rem; font-weight:800; margin-bottom:16px;">Ini adalah game Operasi!</p>
      <p>Fitur ini akan segera hadir.</p>
    </div>
  `;
  speakInstruksi('Ini adalah game Operasi. Fitur ini akan segera hadir.');
  document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));
}

/** Start game sesuai level */
function startGame(container: HTMLElement): void {
  switch (currentLevel) {
    case 1: renderPopBalon(container); break;
    case 2: renderBandingkan(container); break;
    case 3: renderHitungBenda(container); break;
    case 4: renderSusunUrutan(container); break;
    case 5: renderOperasi(container); break;
    case 6: renderKasir(container); break;
    default: renderPopBalon(container); break;
  }
}

// ===== GAME 1: POP BALON (Level 1) =====
function renderPopBalon(container: HTMLElement): void {
  const [min, max] = getDynamicRange(1);
  const target = randRange(min, max);

  // Generate 6 balon: pastikan target ada, sisanya angka acak unik
  const balonCount = 6;
  const angkaSet = new Set<number>([target]);
  while (angkaSet.size < balonCount) {
    angkaSet.add(randRange(min, max));
  }
  const balonAngka = shuffle([...angkaSet]);

  // Warna berbeda tiap balon — teks selalu putih dengan text-shadow agar kontras
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e91e63'];

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
      <p style="font-size:1.3rem; font-weight:800; margin-bottom:12px;">Dengarkan &amp; Cari Balonnya! 🎈</p>
      <button id="btn-instruksi" class="speaker-btn" style="width:80px; height:80px; font-size:2.5rem; background:var(--color-blue); color:white; border-radius:50%; box-shadow:0 6px 15px rgba(0,0,0,0.2);">🔊</button>
    </div>

    <!--
      Card container + Grid 3 kolom x 2 baris — setiap balon punya sel sendiri.
    -->
    <div style="
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(8px);
      border-radius: 28px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      border: 1.5px solid rgba(255,255,255,0.7);
      padding: 20px 16px 24px;
      margin: 16px;
    ">
      <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); font-weight:700; margin-bottom:14px; letter-spacing:0.04em;">
        🎈 TAP BALON YANG BENAR!
      </p>
      <div style="
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:12px;
      ">
        ${balonAngka.map((n, i) => {
    const color = colors[i % colors.length];
    const delay = (i * 0.1).toFixed(1);
    // Baris ganjil (index 0,1,2) lebih atas; baris genap (3,4,5) lebih bawah
    const rowOffset = i < 3 ? '0px' : '28px';
    return `
          <div style="display:flex; justify-content:center; margin-top:${rowOffset};">
            <div class="balloon animate-balloon-rise" data-angka="${n}"
                 style="
                   background:${color};
                   position:relative;
                   animation-delay:${delay}s;
                   --balloon-speed:1.6s;
                 ">
              <span style="
                font-size:1.6rem; font-weight:900;
                color:white;
                text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                pointer-events:none;
              ">${n}</span>
            </div>
          </div>
        `;
  }).join('')}
      </div>
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
          playSFX('success', 0.6);
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
          playSFX('fail', 0.3);
          await speakSalah();
          setTimeout(() => (btn as HTMLElement).classList.remove('animate-shake'), 500);
        }
      });
    });
  }

  speakInstruksi('Tap angka dari kecil ke besar!');
  renderState();
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
