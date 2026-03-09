/**
 * Belajar Interaktif Page — Metode CPA (Concrete, Pictorial, Abstract)
 * Dirancang untuk pra-Level 1. Anak menyentuh objek (Concrete) sebelum melihat angka (Abstract).
 */

import { navigateTo } from '../router';
import { playSFX } from '../sfx';
import { speak, speakInstruksi, getNamaAngka } from '../tts';
import { randRange, shuffle } from '../utils';
import { fireConfetti } from '../confetti';
import { renderBelajarLanjutan } from './belajarLanjutan';

const EMOJIS = ['🍎', '🌟', '🐣', '🌸', '🍊', '🎈', '🦋', '🍇', '🐠', '🌺'];

let currentNumber = 1;
let currentMode: 'menu' | 'tap' | 'drag' | 'tebak' | 'sort' = 'menu';

export function renderBelajarInteraktif(container: HTMLElement): void {
  if (currentMode === 'menu') {
    renderMenu(container);
  } else if (currentMode === 'tap') {
    renderHitungAktif(container);
  } else if (currentMode === 'drag') {
    renderMasukKeranjang(container);
  } else if (currentMode === 'tebak') {
    renderMencariAngka(container);
  } else if (currentMode === 'sort') {
    renderKlasifikasi(container);
  }
}

function renderMenu(container: HTMLElement): void {
  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
      <h1 style="color:var(--color-purple); font-size:2.2rem;">Belajar Sambil Bermain</h1>
      <p class="subtitle" style="font-size:1.1rem;">Pilih permainan yang kamu inginkan!</p>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:20px; max-width:600px; margin:0 auto;" class="animate-fade-in">
      
      <!-- Phase 5 Games -->
      <button id="btn-tap" class="btn btn-blue" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #1b6ca8; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🧩</span> Menyentuh
      </button>
      <button id="btn-drag" class="btn btn-orange" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #c25f00; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🧺</span> Memasukkan
      </button>
      <button id="btn-tebak" class="btn btn-green" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #2b8a3e; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🎈</span> Tebak Angka
      </button>
      <button id="btn-sort" class="btn" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #5c2b92; background-color:var(--color-purple); color:white; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🧠</span> Klasifikasi
      </button>

      <!-- Phase 6 Games -->
      <button id="btn-subitizing" class="btn" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #c2185b; background-color:#e91e63; color:white; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">⚡</span> Tebak Cepat
      </button>
      <button id="btn-numberbonds" class="btn btn-blue" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #1b6ca8; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🐟</span> Pecah Belah
      </button>
      <button id="btn-tenframe" class="btn btn-orange" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #c25f00; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">🥚</span> Keranjang 10
      </button>
      <button id="btn-timbangan" class="btn btn-green" style="font-size:1.1rem; padding:16px; border-radius:20px; box-shadow: 0 6px 0 #2b8a3e; display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:2rem;">⚖</span> Timbangan
      </button>

    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => {
    currentMode = 'menu';
    navigateTo('home');
  });

  document.getElementById('btn-tap')!.addEventListener('click', () => {
    playSFX('click');
    currentMode = 'tap';
    currentNumber = 1;
    renderBelajarInteraktif(container);
  });

  document.getElementById('btn-drag')!.addEventListener('click', () => {
    playSFX('click');
    currentMode = 'drag';
    currentNumber = 1;
    renderBelajarInteraktif(container);
  });

  document.getElementById('btn-tebak')!.addEventListener('click', () => {
    playSFX('click');
    currentMode = 'tebak';
    currentNumber = 1;
    renderBelajarInteraktif(container);
  });

  document.getElementById('btn-sort')!.addEventListener('click', () => {
    playSFX('click');
    currentMode = 'sort';
    currentNumber = 1; // Used for round progression in sorting
    renderBelajarInteraktif(container);
  });

  const goLanjutan = (m: string) => {
    playSFX('click');
    renderBelajarLanjutan(container, m as any, () => {
      currentMode = 'menu';
      renderBelajarInteraktif(container);
    });
  };

  document.getElementById('btn-subitizing')!.addEventListener('click', () => goLanjutan('subitizing'));
  document.getElementById('btn-numberbonds')!.addEventListener('click', () => goLanjutan('numberbonds'));
  document.getElementById('btn-tenframe')!.addEventListener('click', () => goLanjutan('tenframe'));
  document.getElementById('btn-timbangan')!.addEventListener('click', () => goLanjutan('timbangan'));
}

// ==========================================
// GAME 1: TAP TO COUNT (Hitung Aktif)
// ==========================================
function renderHitungAktif(container: HTMLElement): void {
  const emoji = EMOJIS[(currentNumber - 1) % EMOJIS.length];
  let itemsTapped = 0;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
      <h1 style="color:var(--color-purple); font-size:2rem;">🧩 Menyentuh Benda</h1>
      <p class="subtitle" style="font-size:1.1rem;">Sentuh semua ${emoji} untuk menghitung!</p>
    </div>
    
    <div id="play-area" class="animate-fade-in" style="position:relative; width:100%; height:320px; background:rgba(255,255,255,0.5); border-radius:20px; border:4px dashed var(--color-blue); margin-top:20px; overflow:hidden;">
      <!-- Item konkret akan dimunculkan di sini -->
    </div>
    
    <div id="celebration-area" class="animate-bounce-in" style="display:none; text-align:center; padding: 20px;">
        <div id="big-number" style="font-size: 10rem; line-height:1; font-weight: 900; color: var(--color-orange); text-shadow: 4px 4px 0px rgba(0,0,0,0.1);"></div>
        <div id="number-text" style="font-size: 2.5rem; font-weight: 800; color: var(--color-purple); margin-top: -10px;"></div>
        <button id="btn-next" class="btn btn-green animate-pulse" style="font-size:1.5rem; padding: 15px 40px; margin-top: 30px; box-shadow: 0 6px 0 #2b8a3e;">
          Lanjut ▶
        </button>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => {
    currentMode = 'menu';
    renderBelajarInteraktif(container);
  });

  const playArea = document.getElementById('play-area')!;
  const btnNext = document.getElementById('btn-next')!;

  for (let i = 0; i < currentNumber; i++) {
    const item = document.createElement('div');
    item.textContent = emoji;

    const left = randRange(10, 80);
    const top = randRange(10, 75);

    item.style.position = 'absolute';
    item.style.left = `${left}%`;
    item.style.top = `${top}%`;
    item.style.fontSize = '4rem';
    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.style.transition = 'transform 0.2s ease-out, opacity 0.3s ease-out';
    item.classList.add('animate-bounce-in');

    item.addEventListener('pointerdown', async (e) => {
      e.preventDefault();
      if (item.style.opacity === '0') return;

      itemsTapped++;
      playSFX('pop', 0.6);

      item.style.transform = 'scale(1.8) rotate(20deg)';
      item.style.opacity = '0';

      speak(getNamaAngka(itemsTapped));

      setTimeout(() => item.remove(), 300);

      if (itemsTapped === currentNumber) {
        setTimeout(showAbstractPhase, 1000);
      }
    });

    playArea.appendChild(item);
  }

  if (currentNumber === 1) {
    speakInstruksi(`Coba sentuh ${emoji} nya!`);
  } else {
    speakInstruksi(`Ada ${currentNumber} ${emoji}. Ayo sentuh dan hitung bersamaku!`);
  }

  btnNext.addEventListener('click', () => {
    playSFX('click');
    currentNumber++;
    renderBelajarInteraktif(container);
  });
}

// ==========================================
// GAME 2: DRAG TO BASKET (Memasukkan Benda)
// ==========================================
function renderMasukKeranjang(container: HTMLElement): void {
  const emoji = EMOJIS[(currentNumber - 1) % EMOJIS.length];
  let itemsTapped = 0;

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
      <h1 style="color:var(--color-purple); font-size:2rem;">🧺 Memasukkan Benda</h1>
      <p class="subtitle" style="font-size:1.1rem;">Tarik semua ${emoji} ke dalam keranjang!</p>
    </div>
    
    <div id="play-area" class="animate-fade-in" style="position:relative; width:100%; height:320px; background:rgba(255,255,255,0.5); border-radius:20px; border:4px dashed var(--color-blue); margin-top:20px; overflow:hidden;">
        <!-- Keranjang di bawah -->
        <div id="basket" style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); font-size:5rem; text-align:center; transition: transform 0.2s;">
            🧺
            <div id="basket-count" style="font-size:1.5rem; font-weight:bold; color:var(--text-main); margin-top:-20px;">0</div>
        </div>
    </div>
    
    <div id="celebration-area" class="animate-bounce-in" style="display:none; text-align:center; padding: 20px;">
        <div id="big-number" style="font-size: 10rem; line-height:1; font-weight: 900; color: var(--color-orange); text-shadow: 4px 4px 0px rgba(0,0,0,0.1);"></div>
        <div id="number-text" style="font-size: 2.5rem; font-weight: 800; color: var(--color-purple); margin-top: -10px;"></div>
        <button id="btn-next" class="btn btn-green animate-pulse" style="font-size:1.5rem; padding: 15px 40px; margin-top: 30px; box-shadow: 0 6px 0 #2b8a3e;">
          Lanjut ▶
        </button>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => {
    currentMode = 'menu';
    renderBelajarInteraktif(container);
  });

  const playArea = document.getElementById('play-area')!;
  const basket = document.getElementById('basket')!;
  const basketCount = document.getElementById('basket-count')!;
  const btnNext = document.getElementById('btn-next')!;

  for (let i = 0; i < currentNumber; i++) {
    const item = document.createElement('div');
    item.textContent = emoji;

    // Posisi acak di bagian ATAS area bermain
    const left = randRange(10, 80);
    const top = randRange(5, 30);

    // Styling untuk bisa di-drag
    item.style.position = 'absolute';
    item.style.left = `${left}%`;
    item.style.top = `${top}%`;
    item.style.fontSize = '4rem';
    item.style.cursor = 'grab';
    item.style.userSelect = 'none';
    item.style.touchAction = 'none'; // Penting untuk touch screen dragging
    item.style.transition = 'transform 0.1s ease-out';
    item.classList.add('animate-bounce-in');

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    item.addEventListener('pointerdown', (e) => {
      isDragging = true;
      item.style.cursor = 'grabbing';
      item.style.transform = 'scale(1.2)';
      item.style.zIndex = '100'; // Bring to front

      startX = e.clientX;
      startY = e.clientY;

      // Simpan posisi awal untuk reset jika tidak masuk keranjang
      // Hapus transisi sementara agar drag mulus
      item.style.transition = 'none';

      // Convert % to px for dragging
      initialLeft = item.offsetLeft;
      initialTop = item.offsetTop;

      item.setPointerCapture(e.pointerId);
    });

    item.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      item.style.left = `${initialLeft + dx}px`;
      item.style.top = `${initialTop + dy}px`;
    });

    item.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      item.style.cursor = 'grab';
      item.style.zIndex = '1';
      item.releasePointerCapture(e.pointerId);

      // Deteksi tabrakan (Collision Detection) dengan keranjang
      const itemRect = item.getBoundingClientRect();
      const basketRect = basket.getBoundingClientRect();

      // Cek overlap sederhana
      const isInside = !(
        itemRect.right < basketRect.left ||
        itemRect.left > basketRect.right ||
        itemRect.bottom < basketRect.top ||
        itemRect.top > basketRect.bottom
      );

      if (isInside) {
        // Sukses masuk keranjang
        itemsTapped++;
        playSFX('pop', 0.6);

        // Animasi keranjang
        basket.style.transform = 'translateX(-50%) scale(1.1)';
        setTimeout(() => basket.style.transform = 'translateX(-50%) scale(1)', 150);

        basketCount.textContent = itemsTapped.toString();
        item.remove();

        speak(getNamaAngka(itemsTapped));

        if (itemsTapped === currentNumber) {
          setTimeout(showAbstractPhase, 1000);
        }
      } else {
        // Gagal masuk, kembalikan ke atas
        item.style.transition = 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), left 0.4s ease';
        item.style.transform = 'scale(1)';
        item.style.left = `${left}%`;
        item.style.top = `${top}%`;
      }
    });

    playArea.appendChild(item);
  }

  speakInstruksi(`Tarik ${currentNumber} ${emoji} ke dalam keranjang!`);

  btnNext.addEventListener('click', () => {
    playSFX('click');
    currentNumber++;
    renderBelajarInteraktif(container);
  });
}

// ==========================================
// GAME 3: TEBAK ANGKA (Abstract Scaffolding)
// ==========================================
function renderMencariAngka(container: HTMLElement): void {
  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
      <h1 style="color:var(--color-purple); font-size:2rem;">🎈 Mencari Angka</h1>
      <p class="subtitle" id="instruction-text" style="font-size:1.1rem;">Dengarkan instruksi...</p>
    </div>
    
    <div id="play-area" class="animate-fade-in" style="position:relative; width:100%; height:320px; background:rgba(255,255,255,0.5); border-radius:20px; border:4px dashed var(--color-blue); margin-top:20px; overflow:hidden; display:flex; justify-content:space-evenly; align-items:center;">
      <!-- Balon-balon akan dirender di sini -->
    </div>
    
    <div id="celebration-area" class="animate-bounce-in" style="display:none; text-align:center; padding: 20px;">
        <div id="big-number" style="font-size: 10rem; line-height:1; font-weight: 900; color: var(--color-orange); text-shadow: 4px 4px 0px rgba(0,0,0,0.1);"></div>
        <div id="number-text" style="font-size: 2.5rem; font-weight: 800; color: var(--color-purple); margin-top: -10px;"></div>
        <button id="btn-next" class="btn btn-green animate-pulse" style="font-size:1.5rem; padding: 15px 40px; margin-top: 30px; box-shadow: 0 6px 0 #2b8a3e;">
          Lanjut ▶
        </button>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => {
    currentMode = 'menu';
    renderBelajarInteraktif(container);
  });

  const playArea = document.getElementById('play-area')!;
  const btnNext = document.getElementById('btn-next')!;

  const target = currentNumber;
  let pengecoh1 = target - 1 > 0 ? target - 1 : target + 2;
  let pengecoh2 = target - 2 > 0 ? target - 2 : target + 3;

  if (pengecoh1 === target) pengecoh1++;
  if (pengecoh2 === target || pengecoh2 === pengecoh1) pengecoh2 += 2;

  const choices = shuffle([target, pengecoh1, pengecoh2]);
  const colors = ['var(--color-blue)', 'var(--color-green)', 'var(--color-orange)', 'var(--color-purple)', 'var(--color-red)'];
  const shuffledColors = shuffle(colors);

  choices.forEach((num, index) => {
    const balloon = document.createElement('div');
    const color = shuffledColors[index % shuffledColors.length];

    balloon.innerHTML = `
      <div style="width:80px; height:100px; background:${color}; border-radius:50% 50% 50% 50% / 40% 40% 60% 60%; position:relative; display:flex; justify-content:center; align-items:center; color:white; font-size:3rem; font-weight:bold; box-shadow:inset -10px -10px 0px rgba(0,0,0,0.1); cursor:pointer; text-shadow: 2px 2px 4px rgba(0,0,0,0.6), -1px -1px 2px rgba(0,0,0,0.4);">
        ${num}
        <div style="position:absolute; bottom:-15px; left:50%; width:2px; height:30px; background:#a3a3a3; transform:translateX(-50%);"></div>
      </div>
    `;
    balloon.style.transition = 'transform 0.1s';
    balloon.style.animation = `float ${3 + Math.random() * 2}s ease-in-out infinite`;
    balloon.classList.add('animate-slide-up');

    balloon.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (num === target) {
        playSFX('success', 0.8);
        balloon.style.transform = 'scale(1.5)';
        balloon.style.opacity = '0';
        setTimeout(() => {
          showAbstractPhase();
        }, 500);
      } else {
        playSFX('pop', 0.5);
        balloon.style.transform = 'translate(-10px, 0)';
        setTimeout(() => balloon.style.transform = 'translate(10px, 0)', 100);
        setTimeout(() => balloon.style.transform = 'translate(0, 0)', 200);
      }
    });

    playArea.appendChild(balloon);
  });

  document.getElementById('instruction-text')!.textContent = `Cari balon dengan angka ${target}!`;
  speakInstruksi(`Dimanakah balon dengan angka ${getNamaAngka(target)}?`);

  btnNext.addEventListener('click', () => {
    playSFX('click');
    currentNumber++;
    renderBelajarInteraktif(container);
  });
}

// ==========================================
// TAHAP ABSTRACT (Bersama untuk semua game)
// ==========================================
async function showAbstractPhase() {
  const playArea = document.getElementById('play-area')!;
  const celebrationArea = document.getElementById('celebration-area')!;
  const bigNumber = document.getElementById('big-number')!;
  const numberText = document.getElementById('number-text')!;

  playArea.style.display = 'none';
  celebrationArea.style.display = 'block';

  bigNumber.textContent = currentNumber.toString();
  numberText.textContent = getNamaAngka(currentNumber).toUpperCase();

  playSFX('success', 0.7);
  fireConfetti(60);

  await speak(`Hebat! Ini adalah angka ${getNamaAngka(currentNumber)}.`);

  if (currentNumber % 5 === 0) {
    setTimeout(() => {
      playSFX('success', 0.5);
      speakInstruksi(`Wah, kamu sudah sampai angka ${currentNumber}. Coba tunjukkan ke Ayah atau Ibu betapa pintarnya kamu!`);
    }, 3000);
  }
}

// ==========================================
// GAME 4: SORTING / KLASIFIKASI (Pemecahan Masalah)
// ==========================================
function renderKlasifikasi(container: HTMLElement): void {
  // Define categories (Sea vs Land)
  const seaAnimals = ['🐟', '🐬', '🐙', '🦈', '🦀'];
  const landAnimals = ['🐄', '🐓', '🐎', '🐅', '🐘'];

  // Difficulty scaling based on currentNumber (rounds)
  const itemsPerCategory = Math.min(2 + Math.floor((currentNumber - 1) / 2), 4);
  let expectedTotal = itemsPerCategory * 2;
  let sortedCount = 0;

  // Generate random items for this round
  let roundItems: { emoji: string, type: 'sea' | 'land' }[] = [];

  const shuffledSea = shuffle([...seaAnimals]).slice(0, itemsPerCategory);
  shuffledSea.forEach(emoji => roundItems.push({ emoji, type: 'sea' }));

  const shuffledLand = shuffle([...landAnimals]).slice(0, itemsPerCategory);
  shuffledLand.forEach(emoji => roundItems.push({ emoji, type: 'land' }));

  roundItems = shuffle(roundItems);

  container.innerHTML = `
    <button class="back-btn" id="back-home">◀</button>
    <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
      <h1 style="color:var(--color-purple); font-size:2rem;">🧠 Klasifikasi Hewan</h1>
      <p class="subtitle" style="font-size:1.1rem;">Pindahkan hewan ke tempat hidup aslinya!</p>
    </div>
    
    <div id="play-area" class="animate-fade-in" style="position:relative; width:100%; height:380px; background:rgba(255,255,255,0.5); border-radius:20px; border:4px dashed var(--color-blue); margin-top:20px; overflow:hidden; display:flex; flex-direction:column;">
      
      <!-- Middle Spawn Area -->
      <div id="spawn-area" style="flex:1; position:relative; z-index:10; border-bottom: 2px dashed #ccc;"></div>

      <!-- Drop Zones container -->
      <div style="display:flex; height:150px; width:100%;">
        <!-- Sea Drop Zone -->
        <div id="zone-sea" style="flex:1; background-color:#e0f7fa; border-right: 2px dashed #ccc; display:flex; justify-content:center; align-items:flex-end; padding-bottom:10px; font-size:4rem; position:relative;">
          <div style="position:absolute; top:5px; left:50%; transform:translateX(-50%); font-size:1.2rem; font-weight:bold; color:#006064; text-transform:uppercase;">🌊 Laut</div>
        </div>
        
        <!-- Land Drop Zone -->
        <div id="zone-land" style="flex:1; background-color:#e8f5e9; display:flex; justify-content:center; align-items:flex-end; padding-bottom:10px; font-size:4rem; position:relative;">
          <div style="position:absolute; top:5px; left:50%; transform:translateX(-50%); font-size:1.2rem; font-weight:bold; color:#1b5e20; text-transform:uppercase;">🌳 Darat</div>
        </div>
      </div>

    </div>
    
    <div id="celebration-area" class="animate-bounce-in" style="display:none; text-align:center; padding: 20px;">
        <div id="big-number" style="font-size: 5rem; line-height:1; font-weight: 900; color: var(--color-orange); text-shadow: 4px 4px 0px rgba(0,0,0,0.1);">Hebat!</div>
        <div id="number-text" style="font-size: 2rem; font-weight: 800; color: var(--color-purple); margin-top: 10px;">Semua hewan sudah pulang!</div>
        <button id="btn-next" class="btn btn-green animate-pulse" style="font-size:1.5rem; padding: 15px 40px; margin-top: 30px; box-shadow: 0 6px 0 #2b8a3e;">
          Lanjut Level ▶
        </button>
    </div>
  `;

  document.getElementById('back-home')!.addEventListener('click', () => {
    currentMode = 'menu';
    renderBelajarInteraktif(container);
  });

  const playArea = document.getElementById('play-area')!;
  const spawnArea = document.getElementById('spawn-area')!;
  const zoneSea = document.getElementById('zone-sea')!;
  const zoneLand = document.getElementById('zone-land')!;
  const btnNext = document.getElementById('btn-next')!;

  // Create Draggable Items
  roundItems.forEach((itemData, index) => {
    const item = document.createElement('div');
    item.textContent = itemData.emoji;

    // Position randomly in the spawn area (upper half)
    const left = randRange(10, 80);
    const top = randRange(10, 60);

    item.style.position = 'absolute';
    item.style.left = `${left}%`;
    item.style.top = `${top}%`;
    item.style.fontSize = '3.5rem';
    item.style.cursor = 'grab';
    item.style.userSelect = 'none';
    item.style.touchAction = 'none';
    item.style.transition = 'transform 0.1s ease-out';
    item.classList.add('animate-bounce-in');
    item.style.animationDelay = `${index * 0.1}s`;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    item.addEventListener('pointerdown', (e) => {
      isDragging = true;
      item.style.cursor = 'grabbing';
      item.style.transform = 'scale(1.3)';
      item.style.zIndex = '100';

      startX = e.clientX;
      startY = e.clientY;

      item.style.transition = 'none';
      initialLeft = item.offsetLeft;
      initialTop = item.offsetTop;

      item.setPointerCapture(e.pointerId);
    });

    item.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      item.style.left = `${initialLeft + dx}px`;
      item.style.top = `${initialTop + dy}px`;
    });

    item.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      item.style.cursor = 'grab';
      item.style.zIndex = '1';
      item.releasePointerCapture(e.pointerId);

      const itemRect = item.getBoundingClientRect();
      const targetZone = itemData.type === 'sea' ? zoneSea : zoneLand;
      const wrongZone = itemData.type === 'sea' ? zoneLand : zoneSea;

      const targetRect = targetZone.getBoundingClientRect();
      const wrongRect = wrongZone.getBoundingClientRect();

      // Simple overlap logic for target zone
      const isInsideTarget = !(
        itemRect.right < targetRect.left ||
        itemRect.left > targetRect.right ||
        itemRect.bottom < targetRect.top ||
        itemRect.top > targetRect.bottom
      );

      // Overlap logic for wrong zone
      const isInsideWrong = !(
        itemRect.right < wrongRect.left ||
        itemRect.left > wrongRect.right ||
        itemRect.bottom < wrongRect.top ||
        itemRect.top > wrongRect.bottom
      );

      if (isInsideTarget) {
        // Correct Classification!
        sortedCount++;
        playSFX('pop', 0.8);
        targetZone.style.transform = 'scale(1.05)';
        setTimeout(() => targetZone.style.transform = 'scale(1)', 150);

        // Remove item from dom visually (or append to target visually)
        item.style.position = 'static';
        item.style.transform = 'scale(0.8)';
        item.style.margin = '0 -10px'; // overlap them slightly
        targetZone.appendChild(item);

        if (sortedCount === expectedTotal) {
          playArea.style.display = 'none';
          document.getElementById('celebration-area')!.style.display = 'block';
          playSFX('success', 0.7);
          fireConfetti(80);
          speakInstruksi('Pintar sekali! Semua hewan sudah berada di tempat yang benar!');
        }

      } else if (isInsideWrong) {
        // Wrong Classification (Bounces back!)
        playSFX('pop', 0.3); // a dud sound ideally
        item.style.transition = 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), left 0.4s ease';
        item.style.transform = 'scale(1)';
        item.style.left = `${left}%`;
        item.style.top = `${top}%`;

        wrongZone.style.transform = 'translateX(-5px)';
        setTimeout(() => wrongZone.style.transform = 'translateX(5px)', 50);
        setTimeout(() => wrongZone.style.transform = 'translateX(0)', 100);

      } else {
        // Just dropped in nowhere, bounce back
        item.style.transition = 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), left 0.4s ease';
        item.style.transform = 'scale(1)';
        item.style.left = `${left}%`;
        item.style.top = `${top}%`;
      }
    });

    spawnArea.appendChild(item);
  });

  speakInstruksi('Ayo pindahkan hewan ke tempat hidup aslinya! Ada laut, dan ada darat.');

  btnNext.addEventListener('click', () => {
    playSFX('click');
    currentNumber++;
    renderBelajarInteraktif(container);
  });
}
