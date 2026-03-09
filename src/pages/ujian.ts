/**
 * Ujian Page — Mode kuis dengan 5 level
 * Soal bertambah banyak dan sulit per level
 * Pengulangan adaptif: soal salah muncul lagi
 */

import { navigateTo } from '../router';
import { speak, speakPujian, speakSalah, speakInstruksi, getNamaAngka } from '../tts';
import { LEVEL_CONFIGS, loadProgress, completeSubLevel, isLevelUnlocked } from '../levels';
import { fireConfetti } from '../confetti';
import { renderVisualAngka, randRange, shuffle } from '../utils';
import { playSFX } from '../sfx';

/** Tipe soal */
interface Soal {
  pertanyaan: string;       // teks pertanyaan (untuk TTS)
  tampilan: string;         // HTML visual
  jawaban: number;          // jawaban benar
  pilihan: number[];        // 3 pilihan
  kategori: string;         // untuk tracking
}

/** Emoji objek acak */
const EMOJIS = ['🍎', '🌟', '🐣', '🌸', '🍊', '🎈', '🦋', '🍇', '🐠', '🌺', '🍌', '🐱', '🐶', '🎀', '🍬'];

/** Pilih emoji acak */
function randomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}



/** Generate 3 pilihan jawaban (termasuk jawaban benar) */
function generatePilihan(jawaban: number, min: number, max: number): number[] {
  const opts = new Set<number>([jawaban]);
  let attempts = 0;
  while (opts.size < 3 && attempts < 50) {
    const fake = randRange(Math.max(0, min), max);
    if (fake !== jawaban) opts.add(fake);
    attempts++;
  }
  // Jika masih kurang, tambah yang dekat
  while (opts.size < 3) {
    opts.add(jawaban + opts.size);
  }
  return shuffle([...opts]);
}

/**
 * Generate soal-soal untuk level tertentu
 * Tingkat kesulitan (range angka) naik berdasar Bintang (Sub-level)
 */
function generateSoal(level: number, currentStars: number): Soal[] {
  let min = 1, max = 5;

  // ==== LOGIKA SLIDING WINDOW (MIN-MAX BERDASAR BINTANG 0-19) ====
  const maxStars = 19;
  const progressRatio = Math.min(1, currentStars / maxStars); // 0.0 sampai 1.0

  if (level === 1) { // Lvl 1: Angka 1-100
    const windowSize = Math.floor(5 + (15 * progressRatio));
    min = Math.floor(1 + (79 * progressRatio));
    max = min + windowSize;
  } else if (level === 2) { // Lvl 2: Puluhan 10-99
    const windowSize = Math.floor(10 + (20 * progressRatio));
    min = Math.floor(10 + (60 * progressRatio));
    max = Math.min(99, min + windowSize);
  } else if (level === 3) { // Lvl 3: Ratusan 100-999
    const windowSize = Math.floor(50 + (200 * progressRatio));
    min = Math.floor(100 + (700 * progressRatio));
    max = Math.min(999, min + windowSize);
  } else if (level === 4) { // Lvl 4: Ribuan 1000-9999
    const windowSize = Math.floor(500 + (2000 * progressRatio));
    min = Math.floor(1000 + (6000 * progressRatio));
    max = Math.min(9999, min + windowSize);
  } else if (level === 5) { // Lvl 5: Operasi (+)(-)
    const windowSize = Math.floor(5 + (15 * progressRatio));
    min = Math.floor(1 + (30 * progressRatio));
    max = Math.min(50, min + windowSize);
  } else if (level === 6) { // Lvl 6: Uang / campuran
    min = 1; max = 100;
  }

  const soalList: Soal[] = [];

  // ===================================================================
  // LEVEL 1 & 2: Mengenal + Tunjuk + Jari + Perbandingan (Dasar)
  // ===================================================================
  if (level <= 2) {
    // --- SOAL MENGENAL ANGKA ---
    const mengenalCount = level === 1 ? 5 : 4;
    for (let i = 0; i < mengenalCount; i++) {
      const n = randRange(min, max);
      const emoji = randomEmoji();
      const emojiHtml = renderVisualAngka(n, emoji, false); // false = jangan tampilkan label angka
      soalList.push({
        pertanyaan: `Ada berapa ${emoji}? Hitung ya!`,
        tampilan: `<div class="soal-cerita"><p style="font-size:1.2rem; font-weight:800; margin-bottom:8px;">Ada berapa? 🤔</p>${emojiHtml}</div>`,
        jawaban: n,
        pilihan: generatePilihan(n, Math.max(0, n - 3), n + 3),
        kategori: 'mengenal'
      });
    }

    // --- SOAL TUNJUK ANGKA ---
    const tunjukCount = level === 1 ? 3 : 3;
    for (let i = 0; i < tunjukCount; i++) {
      const n = randRange(min, max);
      soalList.push({
        pertanyaan: `Tunjuk angka ${getNamaAngka(n)}!`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.4rem; font-weight:800;">Tunjuk angka</p>
            <p style="font-size:1.2rem; font-weight:700; color:var(--color-blue); margin-top:8px;">"${getNamaAngka(n).toUpperCase()}"</p>
          </div>
        `,
        jawaban: n,
        pilihan: generatePilihan(n, min, max),
        kategori: 'tunjuk'
      });
    }

    // --- SOAL HITUNG JARI TANGAN ---
    const jariHands = ['✊', '☝️', '✌️', '🤟', '🖖', '🖐️'];
    for (let i = 0; i < 2; i++) {
      const n = randRange(1, Math.min(5, max));
      soalList.push({
        pertanyaan: `Ada berapa jari yang terangkat?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Berapa jari terangkat?</p>
            <div style="font-size:4rem;">${jariHands[n] || '🖐️'}</div>
            <div style="font-size:1.5rem; margin-top:8px;">${'☝️'.repeat(n)}</div>
          </div>
        `,
        jawaban: n,
        pilihan: generatePilihan(n, 1, 5),
        kategori: 'jari'
      });
    }

    // --- SOAL PERBANDINGAN (level 2 only) ---
    if (level === 2) {
      for (let i = 0; i < 3; i++) {
        const a = randRange(min, max - 1);
        let b = randRange(min, max);
        while (b === a) b = randRange(min, max);
        const bigger = Math.max(a, b);
        const emojiA = randomEmoji();
        const emojiB = randomEmoji();
        soalList.push({
          pertanyaan: `Mana yang lebih banyak?`,
          tampilan: `
            <div class="soal-cerita">
              <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Mana yang lebih banyak? 🤔</p>
              <div style="display:flex; justify-content:center; gap:20px; align-items:flex-end;">
                <div class="text-center">
                  ${renderVisualAngka(a, emojiA, false)}
                  <div style="font-size:2rem; font-weight:900; margin-top:8px;">?</div>
                </div>
                <div style="font-size:1.5rem; align-self:center; font-weight:bold; color:var(--text-light); padding-bottom:30px;">vs</div>
                <div class="text-center">
                  ${renderVisualAngka(b, emojiB, false)}
                  <div style="font-size:2rem; font-weight:900; margin-top:8px;">?</div>
                </div>
              </div>
            </div>
          `,
          jawaban: bigger,
          pilihan: [a, b, randRange(min, max)].slice(0, 3).length === 3 ? shuffle([a, b, randRange(min, max)]) : generatePilihan(bigger, min, max),
          kategori: 'perbandingan'
        });
      }
    }
  }

  // ===================================================================
  // LEVEL 3 & 4: Mengenal Ratusan / Ribuan + Tunjuk + Perbandingan
  // ===================================================================
  if (level === 3 || level === 4) {
    // --- SOAL MENGENAL ANGKA (tampilkan angka, pilih yang benar) ---
    for (let i = 0; i < 4; i++) {
      const n = randRange(min, max);
      soalList.push({
        pertanyaan: `Ini angka berapa?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:8px;">Ini angka berapa? 🤔</p>
            <div style="font-size:3.5rem; font-weight:900; color:var(--color-blue); margin:16px 0;">${n.toLocaleString('id-ID')}</div>
          </div>
        `,
        jawaban: n,
        pilihan: generatePilihan(n, Math.max(min, n - (level === 3 ? 50 : 500)), n + (level === 3 ? 50 : 500)),
        kategori: 'mengenal'
      });
    }

    // --- SOAL TUNJUK ANGKA (dari nama ke angka) ---
    for (let i = 0; i < 3; i++) {
      const n = randRange(min, max);
      soalList.push({
        pertanyaan: `Tunjuk angka ${getNamaAngka(n)}!`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.4rem; font-weight:800;">Tunjuk angka</p>
            <p style="font-size:1.1rem; font-weight:700; color:var(--color-blue); margin-top:8px;">"${getNamaAngka(n).toUpperCase()}"</p>
          </div>
        `,
        jawaban: n,
        pilihan: generatePilihan(n, Math.max(min, n - (level === 3 ? 100 : 1000)), n + (level === 3 ? 100 : 1000)),
        kategori: 'tunjuk'
      });
    }

    // --- SOAL PERBANDINGAN ---
    for (let i = 0; i < 3; i++) {
      const a = randRange(min, max);
      let b = randRange(min, max);
      while (b === a) b = randRange(min, max);
      const bigger = Math.max(a, b);
      soalList.push({
        pertanyaan: `Mana yang lebih besar?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Mana yang lebih besar? 🤔</p>
            <div style="display:flex; justify-content:center; gap:20px;">
              <div class="text-center">
                <div style="font-size:2rem; font-weight:900;">${a.toLocaleString('id-ID')}</div>
              </div>
              <div style="font-size:1.5rem; align-self:center;">atau</div>
              <div class="text-center">
                <div style="font-size:2rem; font-weight:900;">${b.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        `,
        jawaban: bigger,
        pilihan: generatePilihan(bigger, min, max),
        kategori: 'perbandingan'
      });
    }
  }

  // ===================================================================
  // LEVEL 5: Operasi Penjumlahan & Pengurangan
  // ===================================================================
  if (level === 5) {
    // Rentang operan naik per bintang
    const operandMax = Math.floor(5 + (15 * progressRatio));

    // --- PENJUMLAHAN ---
    for (let i = 0; i < 4; i++) {
      const a = randRange(1, operandMax);
      const b = randRange(1, operandMax);
      const hasil = a + b;
      const emoji = randomEmoji();
      soalList.push({
        pertanyaan: `Berapa ${a} + ${b}?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Berapa hasilnya? ➕</p>
            <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
               ${renderVisualAngka(a, emoji, false)}
               <div style="font-size:2rem; font-weight:bold; margin-bottom:16px;">+</div>
               ${renderVisualAngka(b, emoji, false)}
            </div>
            <div style="font-size:2.5rem; font-weight:900;">${a} + ${b} = ?</div>
          </div>
        `,
        jawaban: hasil,
        pilihan: generatePilihan(hasil, Math.max(0, hasil - 4), hasil + 4),
        kategori: 'penjumlahan'
      });
    }

    // --- PENGURANGAN ---
    for (let i = 0; i < 3; i++) {
      const a = randRange(3, operandMax);
      const b = randRange(1, a - 1);
      const hasil = a - b;
      const emoji = randomEmoji();
      soalList.push({
        pertanyaan: `Berapa ${a} − ${b}?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Berapa hasilnya? ➖</p>
            <div class="text-center">
              ${renderVisualAngka(a, emoji, false)}
              <p style="margin:4px 0; font-size:1rem; color:var(--color-pink); font-weight:bold;">--- Diambil ${b} ---</p>
            </div>
            <div style="font-size:2.5rem; font-weight:900; margin-top:8px;">${a} − ${b} = ?</div>
          </div>
        `,
        jawaban: hasil,
        pilihan: generatePilihan(hasil, Math.max(0, hasil - 3), hasil + 3),
        kategori: 'pengurangan'
      });
    }

    // --- CERITA PENJUMLAHAN ---
    const namaAnak = ['Ani', 'Budi', 'Cici', 'Deni', 'Eka', 'Fani'];
    const bendaCerita = [
      { nama: 'apel', emoji: '🍎' }, { nama: 'balon', emoji: '🎈' },
      { nama: 'permen', emoji: '🍬' }, { nama: 'kue', emoji: '🧁' }
    ];
    for (let i = 0; i < 2; i++) {
      const a = randRange(1, 5);
      const b = randRange(1, 5);
      const hasil = a + b;
      const nama = namaAnak[randRange(0, namaAnak.length - 1)];
      const benda = bendaCerita[randRange(0, bendaCerita.length - 1)];
      soalList.push({
        pertanyaan: `${nama} punya ${a} ${benda.nama}, dapat ${b} lagi. Berapa semua?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.1rem; line-height:1.6;">
              ${nama} punya ${a} ${benda.emoji}<br>
              Lalu dapat ${b} ${benda.emoji} lagi.<br><br>
              <strong>Berapa semua ${benda.nama} ${nama}?</strong>
            </p>
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:12px;">
               ${renderVisualAngka(a, benda.emoji, false)}
               <div style="font-size:1.5rem; font-weight:bold; margin-bottom:8px;">+</div>
               ${renderVisualAngka(b, benda.emoji, false)}
            </div>
          </div>
        `,
        jawaban: hasil,
        pilihan: generatePilihan(hasil, Math.max(0, hasil - 3), hasil + 3),
        kategori: 'cerita'
      });
    }

    // --- CERITA PENGURANGAN ---
    for (let i = 0; i < 2; i++) {
      const a = randRange(4, 10);
      const b = randRange(1, a - 1);
      const hasil = a - b;
      const nama = namaAnak[randRange(0, 2)];
      const benda = bendaCerita[randRange(0, bendaCerita.length - 1)];
      soalList.push({
        pertanyaan: `${nama} punya ${a} ${benda.nama}, dimakan ${b}. Berapa sisa?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.1rem; line-height:1.6;">
              ${nama} punya ${a} ${benda.emoji}<br>
              Dimakan ${b} ${benda.emoji}.<br><br>
              <strong>Berapa sisa ${benda.nama}nya?</strong>
            </p>
            <div style="margin-top:12px; text-align:center;">
              ${renderVisualAngka(a, benda.emoji, false)}
              <div style="color:var(--color-pink); font-size:0.9rem; font-weight:bold;">--- Diambil ${b} ---</div>
            </div>
          </div>
        `,
        jawaban: hasil,
        pilihan: generatePilihan(hasil, Math.max(0, hasil - 3), hasil + 3),
        kategori: 'cerita'
      });
    }

    // --- HITUNG MUNDUR ---
    for (let i = 0; i < 2; i++) {
      const start = randRange(5, operandMax);
      const missing = randRange(1, start - 1);
      const seq = [];
      for (let n = start; n >= 1; n--) seq.push(n);
      soalList.push({
        pertanyaan: `Hitung mundur! Angka berapa yang hilang?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">Hitung mundur! 🔢</p>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; font-size:1.5rem; font-weight:900;">
              ${seq.map(n => n === missing
          ? '<span style="width:40px; height:40px; border:3px dashed var(--color-pink); border-radius:12px; display:inline-flex; align-items:center; justify-content:center;">?</span>'
          : `<span>${n}</span>`
        ).join(' ')}
            </div>
          </div>
        `,
        jawaban: missing,
        pilihan: generatePilihan(missing, 1, start),
        kategori: 'hitung-mundur'
      });
    }
  }

  // ===================================================================
  // LEVEL 6: Uang, Pola & Campuran
  // ===================================================================
  if (level === 6) {
    // --- SOAL PECAHAN UANG ---
    const pecahanUang = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const maxPecIdx = Math.min(pecahanUang.length, Math.floor(currentStars / 2) + 4);

    for (let i = 0; i < 3; i++) {
      const pec = pecahanUang[randRange(0, maxPecIdx - 1)];
      soalList.push({
        pertanyaan: `Ini uang berapa?`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Ini uang berapa? 💰</p>
            <div style="background:var(--color-green); color:white; padding:20px 10px; border-radius:12px; font-size:2rem; font-weight:bold; margin:0 auto; border:2px dashed white; max-width:80%;">
              Rp ${pec.toLocaleString('id-ID')}
            </div>
          </div>
        `,
        jawaban: pec,
        pilihan: generatePilihan(pec, Math.max(100, pec - 2000), pec + 2000),
        kategori: 'uang'
      });
    }

    // --- SOAL POLA ANGKA ---
    const polaTemplates = [
      { pattern: (i: number) => i + 1, name: 'naik 1', len: 6 },
      { pattern: (i: number) => (i + 1) * 2, name: 'loncat 2', len: 5 },
      { pattern: (i: number) => (i + 1) * 3, name: 'loncat 3', len: 5 },
      { pattern: (i: number) => (i + 1) * 5, name: 'loncat 5', len: 4 },
      { pattern: (i: number) => i * 2 + 1, name: 'ganjil', len: 5 },
      { pattern: (i: number) => (i + 1) * 2, name: 'genap', len: 5 },
    ];

    for (let p = 0; p < 4; p++) {
      const tmpl = polaTemplates[randRange(0, polaTemplates.length - 1)];
      const seq = Array.from({ length: tmpl.len }, (_, i) => tmpl.pattern(i));
      const missingIdx = randRange(1, seq.length - 1);
      const jawaban = seq[missingIdx];
      soalList.push({
        pertanyaan: `Lanjutkan polanya!`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:16px;">🧩 Lanjutkan Polanya!</p>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin:12px 0;">
              ${seq.map((n, i) => i === missingIdx
          ? '<div style="width:48px; height:48px; border:3px dashed var(--color-purple); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">?</div>'
          : `<div style="width:48px; height:48px; border-radius:14px; background:var(--color-blue); color:white; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:900;">${n}</div>`
        ).join('')}
            </div>
          </div>
        `,
        jawaban,
        pilihan: generatePilihan(jawaban, Math.max(0, jawaban - 5), jawaban + 5),
        kategori: 'pola'
      });
    }

    // --- SOAL COCOKKAN ---
    for (let i = 0; i < 2; i++) {
      const n = randRange(3, 12);
      const emoji = randomEmoji();
      soalList.push({
        pertanyaan: `Cocokkan jumlah ${emoji}!`,
        tampilan: `
          <div class="soal-cerita">
            <p style="font-size:1.2rem; font-weight:800; margin-bottom:12px;">Cocokkan! ✨</p>
            ${renderVisualAngka(n, emoji, false)}
            <p style="margin-top:12px; font-size:1.1rem;">Angka berapa yang cocok?</p>
          </div>
        `,
        jawaban: n,
        pilihan: generatePilihan(n, Math.max(1, n - 3), n + 3),
        kategori: 'cocokkan'
      });
    }

    // --- SOAL NOL ---
    soalList.push({
      pertanyaan: 'Semua apel dimakan. Sekarang ada berapa?',
      tampilan: `
        <div class="soal-cerita">
          <p style="font-size:1.1rem; line-height:1.6;">
            Ada 3 🍎🍎🍎<br>
            Semua dimakan! 😋<br><br>
            <strong>Sekarang ada berapa apel?</strong>
          </p>
        </div>
      `,
      jawaban: 0,
      pilihan: shuffle([0, 1, 3]),
      kategori: 'nol'
    });
  }

  return shuffle(soalList);
}

// ===== UJIAN STATE =====
let currentLevel = 1;
let currentSubLevel = 0;
let soalList: Soal[] = [];
let soalIndex = 0;
let benar = 0;
let salahList: Soal[] = []; // untuk pengulangan adaptif
let sudahCoba: boolean = false; // satu kesempatan coba lagi per soal

/** Render level selector */
function renderLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.ujian;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:48px;">
      <h1>⭐ Ujian</h1>
      <p class="subtitle">Pilih level dan kumpulkan bintang!</p>
    </div>
    <div class="level-grid mt-lg">
      ${LEVEL_CONFIGS.map((cfg, i) => {
    const lvl = i + 1;
    const unlocked = isLevelUnlocked('ujian', lvl);
    const stars = mp.stars[i];
    const totalStarsNeeded = cfg.requiredStars;
    const completed = stars >= totalStarsNeeded;
    const cls = !unlocked ? 'locked' : completed ? 'completed' : (lvl === mp.unlockedLevel ? 'current' : '');
    return `
          <button class="level-btn animate-bounce-in ${cls}" data-level="${lvl}" ${!unlocked ? 'disabled' : ''}>
            <span class="level-icon">${cfg.icon}</span>
            <span>Lv.${lvl}</span>
            <span style="font-size:0.7rem;">${cfg.soalCount} soal / ujian</span>
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
        Kumpulkan <strong>${LEVEL_CONFIGS[0].requiredStars} Bintang</strong> tiap level untuk membuka level berikutnya!<br>
        Mainkan soal Ujian berulang kali sampai bintang penuh.
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

  speakInstruksi('Pilih level ujian!');
}

/** Render grid pilihan bintang 1-20 (Sub-Level) */
function renderSubLevelSelector(container: HTMLElement): void {
  const progress = loadProgress();
  const mp = progress.ujian;
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
      <p class="subtitle">Pilih bintang yang mau dikumpulkan!</p>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; padding:20px; max-width:400px; margin:0 auto;">
      ${gridHtml}
    </div>
  `;

  document.getElementById('back-levels')!.addEventListener('click', () => renderLevelSelector(container));

  container.querySelectorAll('.sublevel-btn:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSubLevel = parseInt((btn as HTMLElement).dataset.sublevel || '0');
      soalList = generateSoal(currentLevel, currentSubLevel);
      soalIndex = 0;
      benar = 0;
      salahList = [];
      sudahCoba = false;
      renderSoal(container);
    });
  });

  speakInstruksi('Pilih bintang untuk mulai ujian.');
}

/** Render soal saat ini */
function renderSoal(container: HTMLElement): void {
  const soal = soalList[soalIndex];
  const total = soalList.length;
  sudahCoba = false;

  container.innerHTML = `
    <button class="back-btn" id="back-levels">◀</button>
    <div style="padding-top:48px;">
      <div class="text-center mb-md">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text-light);">
          ⭐ Bintang ${currentSubLevel + 1} — Soal ${soalIndex + 1}/${soalList.length}
        </span>
      </div>
      <div class="progress-bar">
        <div class="fill" style="width:${((soalIndex + 1) / total) * 100}%"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
        <span>⭐ ${benar}</span>
        <span>${soalIndex + 1}/${total}</span>
      </div>
    </div>

    <div id="soal-content" style="flex:1; display:flex; flex-direction:column; justify-content:center;">
      ${soal.tampilan}
      <div class="answer-grid" id="answer-grid">
        ${soal.pilihan.map(p => `
          <button class="answer-btn" data-answer="${p}">${p}</button>
        `).join('')}
      </div>
    </div>

    <div style="padding:8px 0; text-align:center;">
      <button id="btn-ulang-suara" class="speaker-btn" style="margin:0 auto;">🔊</button>
    </div>
  `;

  // TTS baca soal
  setTimeout(() => speakInstruksi(soal.pertanyaan), 300);

  // Tombol speaker
  document.getElementById('btn-ulang-suara')!.addEventListener('click', () => {
    speakInstruksi(soal.pertanyaan);
  });

  // Tombol kembali
  document.getElementById('back-levels')!.addEventListener('click', () => renderSubLevelSelector(container));

  // Jawaban
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => handleJawaban(btn as HTMLElement, container));
  });
}

/** Handle jawaban dipilih */
async function handleJawaban(btn: HTMLElement, container: HTMLElement): Promise<void> {
  const soal = soalList[soalIndex];
  const answer = parseInt(btn.dataset.answer || '0');
  const isCorrect = answer === soal.jawaban;

  // Disable semua tombol
  document.querySelectorAll('.answer-btn').forEach(b => {
    (b as HTMLButtonElement).disabled = true;
  });

  if (isCorrect) {
    btn.classList.add('correct', 'animate-correct');
    benar++;
    playSFX('success', 0.4);

    // Efek confetti
    fireConfetti(50);

    await speakPujian();

    // Lanjut ke soal berikutnya
    setTimeout(() => {
      soalIndex++;
      if (soalIndex < soalList.length) {
        renderSoal(container);
      } else {
        // Tambahkan soal salah untuk pengulangan
        if (salahList.length > 0) {
          soalList.push(...salahList);
          salahList = [];
          renderSoal(container);
        } else {
          renderHasil(container);
        }
      }
    }, 1200);
  } else {
    btn.classList.add('wrong', 'animate-shake');
    await speakSalah();

    if (!sudahCoba) {
      // Boleh coba sekali lagi
      sudahCoba = true;
      salahList.push(soal);
      setTimeout(() => {
        document.querySelectorAll('.answer-btn').forEach(b => {
          if (!(b as HTMLElement).classList.contains('wrong')) {
            (b as HTMLButtonElement).disabled = false;
          }
        });
      }, 800);
    } else {
      // Sudah 2x salah, tampilkan jawaban benar dan lanjut
      document.querySelectorAll('.answer-btn').forEach(b => {
        if (parseInt((b as HTMLElement).dataset.answer || '0') === soal.jawaban) {
          (b as HTMLElement).classList.add('correct');
        }
      });
      await speak(`Jawabannya adalah ${getNamaAngka(soal.jawaban)}`);
      setTimeout(() => {
        soalIndex++;
        if (soalIndex < soalList.length) {
          renderSoal(container);
        } else {
          renderHasil(container);
        }
      }, 1500);
    }
  }
}

/** Render layar hasil akhir ujian */
function renderHasil(container: HTMLElement): void {
  const total = soalList.length;
  // Syarat dapat +1 bintang: benar minimal separuh
  const isLulus = benar >= total / 2;

  if (isLulus) {
    completeSubLevel('ujian', currentLevel, currentSubLevel, benar, total);
  }

  const progress = loadProgress();
  const mp = progress.ujian;
  const progressKini = mp.stars[currentLevel - 1] || 0;
  const totalStarsNeeded = LEVEL_CONFIGS[currentLevel - 1].requiredStars;

  let starsHtml = Array.from({ length: 5 }, (_, i) =>
    i < Math.floor((benar / total) * 5) ? '⭐' : '☆'
  ).join('');

  let pesan = '';
  if (benar === total) pesan = 'Sempurna! Kamu luar biasa! 🏆';
  else if (benar >= total / 2) pesan = 'Hebat! Terus semangat! 🌟';
  else pesan = 'Ayo coba lagi untuk dapat Bintang! 💪';

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

  // Event handler opsional
  const btnNext = document.getElementById('btn-next-star');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      // Pindah ke sub-level berikutnya
      currentSubLevel++;
      soalList = generateSoal(currentLevel, currentSubLevel);
      soalIndex = 0;
      benar = 0;
      salahList = [];
      sudahCoba = false;
      renderSoal(container);
    });
  }

  document.getElementById('btn-again')!.addEventListener('click', () => {
    soalList = generateSoal(currentLevel, currentSubLevel);
    soalIndex = 0;
    benar = 0;
    salahList = [];
    sudahCoba = false;
    renderSoal(container);
  });

  document.getElementById('btn-levels')!.addEventListener('click', () => renderSubLevelSelector(container));
}

/** Entry point halaman ujian */
export function renderUjian(container: HTMLElement): void {
  renderLevelSelector(container);
}
