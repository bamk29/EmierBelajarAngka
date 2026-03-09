/**
 * Belajar Lanjutan — Phase 6: Pra-Level 1 Advanced Games
 * Berisi 4 game kognitif lanjutan dengan difficulty scaling berbasis sesi:
 * 1. Tebak Cepat (Subitizing)
 * 2. Pecah Belah (Number Bonds)
 * 3. Keranjang Sepuluh (Ten-Frame)
 * 4. Menyeimbangkan Timbangan (Balance/Algebra)
 */

import { playSFX } from '../sfx';
import { speak, speakInstruksi, getNamaAngka } from '../tts';
import { randRange, shuffle } from '../utils';
import { fireConfetti } from '../confetti';

// ==========================================
// TIPE DATA & SHARED STATE
// ==========================================

export type LanjutanMode = 'menu' | 'subitizing' | 'numberbonds' | 'tenframe' | 'timbangan';

let lanjutanMode: LanjutanMode = 'menu';
let lanjutanRound = 1;
let lanjutanScore = 0;
let onBackToMenu: (() => void) | null = null;

export function renderBelajarLanjutan(
    container: HTMLElement,
    mode: LanjutanMode,
    backCb: () => void
): void {
    lanjutanMode = mode;
    onBackToMenu = backCb;
    if (lanjutanMode === 'subitizing') {
        lanjutanRound = 1; lanjutanScore = 0;
        renderTebakCepat(container);
    } else if (lanjutanMode === 'numberbonds') {
        lanjutanRound = 1; lanjutanScore = 0;
        renderPecahBelah(container);
    } else if (lanjutanMode === 'tenframe') {
        lanjutanRound = 1; lanjutanScore = 0;
        renderTenFrame(container);
    } else if (lanjutanMode === 'timbangan') {
        lanjutanRound = 1; lanjutanScore = 0;
        renderTimbangan(container);
    }
}

// ==========================================
// HELPER SHARED UI
// ==========================================

function renderHUD(container: HTMLElement, title: string, icon: string): void {
    container.innerHTML = `
    <div style="position:relative; min-height:100vh; padding-bottom:60px;">
      <button class="back-btn" id="back-lanjutan">◀</button>
      <div style="position:absolute; top:12px; right:16px; font-size:0.9rem; font-weight:700; color:var(--color-purple); background:rgba(255,255,255,0.8); border-radius:12px; padding:4px 12px;">
        Ronde ${lanjutanRound} · ⭐ ${lanjutanScore}
      </div>
      <div class="page-header animate-slide-up" style="padding-top:40px; text-align:center;">
        <h1 style="color:var(--color-purple); font-size:2rem;">${icon} ${title}</h1>
      </div>
      <div id="game-body" class="animate-fade-in" style="padding:0 16px;"></div>
    </div>
  `;
    document.getElementById('back-lanjutan')!.addEventListener('click', () => {
        playSFX('click');
        if (onBackToMenu) onBackToMenu();
    });
}

function getMaxCount(round: number): number {
    return Math.min(3 + Math.floor((round - 1) / 3), 12);
}

function buildChoices(target: number, count = 3): number[] {
    const pool = new Set<number>([target]);
    while (pool.size < count) {
        const offset = randRange(1, 3);
        pool.add(target + (Math.random() > 0.5 ? offset : -offset));
    }
    return shuffle([...pool].filter(n => n > 0));
}

function buildAnswerButtons(
    choices: number[],
    target: number,
    onCorrect: () => void,
    onWrong: () => void
): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-top:20px;';
    choices.forEach(num => {
        const btn = document.createElement('button');
        btn.textContent = num.toString();
        btn.className = 'btn btn-blue';
        btn.style.cssText = 'font-size:2.5rem; width:90px; height:90px; border-radius:20px; box-shadow:0 6px 0 #1b6ca8;';
        btn.addEventListener('click', () => {
            if (num === target) {
                btn.style.background = 'var(--color-green)';
                playSFX('success', 0.8);
                onCorrect();
            } else {
                btn.style.background = 'var(--color-red)';
                playSFX('pop', 0.4);
                btn.style.transform = 'translateX(-5px)';
                setTimeout(() => { btn.style.transform = 'translateX(5px)'; }, 80);
                setTimeout(() => { btn.style.transform = 'translateX(0)'; }, 160);
                onWrong();
            }
            wrap.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        });
        wrap.appendChild(btn);
    });
    return wrap;
}

// ==========================================
// GAME 5: TEBAK CEPAT (Subitizing)
// ==========================================
function renderTebakCepat(container: HTMLElement): void {
    renderHUD(container, 'Tebak Cepat', '⚡');
    const body = document.getElementById('game-body')!;

    const count = randRange(1, getMaxCount(lanjutanRound));
    const emoji = (['🐟', '🥚', '🍗', '🐡', '🌟', '🦋', '🍎', '🐌'])[lanjutanRound % 8];
    const displayMs = Math.max(600, 2000 - lanjutanRound * 80);
    const choices = buildChoices(count);

    body.innerHTML = `
    <p style="text-align:center; font-size:1.2rem; color:var(--text-main);">
      Perhatikan baik-baik! Berapa jumlahnya? 👀
    </p>
    <div id="item-board" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; padding:20px; background:rgba(255,255,255,0.6); border-radius:20px; min-height:140px; margin-bottom:16px;">
    </div>
    <div id="cover" style="display:none; background:var(--color-blue); border-radius:20px; height:140px; margin-bottom:16px; justify-content:center; align-items:center; font-size:3rem; color:white;">
      🙈 Berapa tadi?
    </div>
    <div id="choices-area"></div>
  `;

    const board = document.getElementById('item-board')!;
    const cover = document.getElementById('cover')!;
    const choices_area = document.getElementById('choices-area')!;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.textContent = emoji;
        el.style.cssText = 'font-size:3.5rem; animation: bounceIn 0.3s ease;';
        el.style.animationDelay = `${i * 60}ms`;
        board.appendChild(el);
    }

    speakInstruksi(`Ada berapa ${emoji}? Perhatikan ${(displayMs / 1000).toFixed(1)} detik saja!`);

    setTimeout(() => {
        board.style.display = 'none';
        cover.style.display = 'flex';
        const btns = buildAnswerButtons(
            choices, count,
            () => {
                // Benar
                lanjutanScore += 10 + lanjutanRound;
                fireConfetti(50);
                speak(`Betul! Ada ${getNamaAngka(count)} ${emoji}!`);
                setTimeout(() => { lanjutanRound++; renderTebakCepat(container); }, 2000);
            },
            () => {
                // Salah — tampilkan kembali objek agar anak bisa hitung ulang
                speakInstruksi('Hampir! Yuk lihat lagi...');
                cover.style.display = 'none';
                board.style.display = 'flex';
                setTimeout(() => {
                    board.style.display = 'none';
                    cover.style.display = 'flex';
                    btns.querySelectorAll('button').forEach(b => {
                        const btn = b as HTMLButtonElement;
                        btn.disabled = false;
                        btn.style.background = '';
                    });
                }, 2000);
            }
        );
        choices_area.appendChild(btns);
        speakInstruksi(`Ada berapa ${emoji} tadi?`);
    }, displayMs);
}

// ==========================================
// GAME 6: PECAH BELAH (Number Bonds)
// ==========================================
function renderPecahBelah(container: HTMLElement): void {
    renderHUD(container, 'Pecah Belah', '🐟');
    const body = document.getElementById('game-body')!;

    const total = Math.min(3 + Math.floor(lanjutanRound / 2), 10);
    const leftSide = randRange(1, total - 1);
    const rightSide = total - leftSide;
    const emoji = ['🐟', '🍗', '🥚', '🌸'][lanjutanRound % 4];
    const choices = buildChoices(rightSide);

    // Layout tiga kolom agar tidak overflow layar portrait
    body.innerHTML = `
    <p style="text-align:center; font-size:1.1rem; color:var(--text-main); margin-bottom:12px;">
      Semua ${emoji} berjumlah <strong>${total}</strong>. Sentuh untuk memisahkan!
    </p>
    <div id="fish-scene" style="display:flex; width:100%; gap:8px; margin-bottom:12px;">
      <div id="left-group" style="flex:1; background:rgba(173,216,230,0.4); border-radius:16px; min-height:120px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:4px; padding:8px; transition:all 0.5s ease;"></div>
      <div id="fish-container" style="flex:1.5; background:rgba(255,255,255,0.6); border-radius:16px; min-height:120px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:4px; padding:8px; cursor:pointer;"></div>
      <div id="right-group" style="flex:1; background:rgba(144,238,144,0.3); border-radius:16px; min-height:120px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:4px; padding:8px; transition:all 0.5s ease;"></div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:1rem; font-weight:700; color:var(--color-purple); padding:0 4px;">
      <span id="left-label" style="color:#0277bd;">⬅</span>
      <span id="right-label" style="color:var(--color-blue);">🤔 Berapa ke kanan?</span>
    </div>
    <div id="choices-area" style="margin-top:16px;"></div>
  `;

    const fc = document.getElementById('fish-container')!;
    const leftGrp = document.getElementById('left-group')!;
    const rightGrp = document.getElementById('right-group')!;

    for (let i = 0; i < total; i++) {
        const fish = document.createElement('span');
        fish.textContent = emoji;
        fish.style.cssText = 'font-size:2.6rem; transition: all 0.6s ease;';
        fish.dataset['idx'] = i.toString();
        fc.appendChild(fish);
    }

    speakInstruksi(`Ada ${total} ${emoji}. Sentuh untuk melihat apa yang terjadi!`);

    let split = false;
    fc.addEventListener('click', () => {
        if (split) return;
        split = true;

        const allFish = Array.from(fc.querySelectorAll('span'));
        for (let i = 0; i < leftSide; i++) {
            const f = allFish[i] as HTMLElement;
            f.style.opacity = '0.5';
            leftGrp.appendChild(f);
        }
        for (let i = leftSide; i < total; i++) {
            rightGrp.appendChild(allFish[i] as HTMLElement);
        }

        document.getElementById('left-label')!.textContent = `⬅ ${leftSide} ke kiri`;
        speak(`${getNamaAngka(leftSide)} ${emoji} sudah ke kiri. Berapa yang ke kanan?`);

        setTimeout(() => {
            const btns = buildAnswerButtons(
                choices, rightSide,
                () => {
                    lanjutanScore += 10 + lanjutanRound;
                    fireConfetti(50);
                    speak(`Pintar! ${getNamaAngka(rightSide)} ke kanan. ${getNamaAngka(leftSide)} tambah ${getNamaAngka(rightSide)} sama dengan ${getNamaAngka(total)}!`);
                    setTimeout(() => { lanjutanRound++; renderPecahBelah(container); }, 2500);
                },
                () => speakInstruksi('Coba hitung yang ada di kotak kanan ya!')
            );
            document.getElementById('choices-area')!.appendChild(btns);
        }, 1200);
    });

    setTimeout(() => {
        const hint = document.createElement('p');
        hint.textContent = '👉 Sentuh kotak tengah untuk memisahkan!';
        hint.style.cssText = 'text-align:center; font-size:0.9rem; color:var(--text-muted); margin-top:4px;';
        body.appendChild(hint);
    }, 500);
}

// ==========================================
// GAME 7: KERANJANG SEPULUH (Ten-Frame)
// ==========================================
function renderTenFrame(container: HTMLElement): void {
    renderHUD(container, 'Keranjang Sepuluh', '🥚');
    const body = document.getElementById('game-body')!;

    const questionType: 'fill' | 'count-empty' = lanjutanRound >= 8 ? 'count-empty' : 'fill';
    const target = randRange(1, 10);
    const emoji = ['🥚', '🍗', '🐟', '🍎'][Math.floor(lanjutanRound / 4) % 4];

    body.innerHTML = `
    <p id="tf-instruction" style="text-align:center; font-size:1.2rem; color:var(--text-main); margin-bottom:12px;"></p>
    <div id="ten-frame" style="
      display:grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap:6px;
      background:rgba(255,255,255,0.6);
      border-radius:20px;
      padding:12px;
      margin-bottom:12px;
      max-height:200px;
      box-sizing:border-box;
    "></div>
    ${questionType === 'fill' ? `
      <div id="draggable-pool" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:8px; background:rgba(255,255,255,0.4); border-radius:16px; min-height:56px;"></div>
      <p style="text-align:center; font-size:0.9rem; color:var(--text-muted); margin-top:6px;">👆 Tap untuk memasukkan ke keranjang!</p>
    ` : `
      <div id="choices-area" style="margin-top:16px;"></div>
    `}
  `;

    const frame = document.getElementById('ten-frame')!;
    const instr = document.getElementById('tf-instruction')!;
    const slots: HTMLElement[] = [];
    let filled = 0;

    for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.style.cssText = `
          border:3px solid var(--color-blue);
          border-radius:10px;
          display:flex;
          justify-content:center;
          align-items:center;
          font-size:clamp(1.2rem, 7vw, 2rem);
          background:rgba(255,255,255,0.5);
          transition:background 0.2s;
          aspect-ratio:1;
          overflow:hidden;
        `;
        slot.dataset['idx'] = i.toString();
        frame.appendChild(slot);
        slots.push(slot);
    }

    if (questionType === 'fill') {
        instr.textContent = `Masukkan ${target} ${emoji} ke dalam keranjang!`;
        speakInstruksi(`Masukkan ${getNamaAngka(target)} ${emoji} ke dalam keranjang! Total ada 10.`);

        const pool = document.getElementById('draggable-pool')!;
        // Pool SELALU 10 bahan — sisanya nampak jelas di pool setelah kotak terpenuhi
        for (let i = 0; i < 10; i++) {
            const item = document.createElement('span');
            item.textContent = emoji;
            item.style.cssText = 'font-size:2.4rem; cursor:pointer; user-select:none; touch-action:none;';
            item.addEventListener('pointerdown', () => {
                if (filled >= target) return;
                item.style.opacity = '0.2';
                item.style.pointerEvents = 'none'; // nonaktifkan tapi biarkan terlihat sebagai "sudah dipakai"
                slots[filled].textContent = emoji;
                slots[filled].style.background = 'rgba(144, 238, 144, 0.5)';
                filled++;
                speak(getNamaAngka(filled));
                if (filled === target) {
                    playSFX('success', 0.8);
                    fireConfetti(60);
                    const remaining = 10 - target;
                    speakInstruksi(
                        `Bagus! ${getNamaAngka(target)} sudah masuk. ` +
                        `Sisa ${getNamaAngka(remaining)} ${emoji} di bawah dan ${getNamaAngka(remaining)} kotak masih kosong. ` +
                        `Ini artinya ${getNamaAngka(target)} butuh ${getNamaAngka(remaining)} lagi untuk jadi sepuluh!`
                    );
                    lanjutanScore += 10 + lanjutanRound;
                    // Tunggu 7 detik agar TTS panjang selesai
                    setTimeout(() => { lanjutanRound++; renderTenFrame(container); }, 7000);
                }
            });
            pool.appendChild(item);
        }

    } else {
        for (let i = 0; i < target; i++) {
            slots[i].textContent = emoji;
            slots[i].style.background = 'rgba(144, 238, 144, 0.5)';
        }
        const emptyCount = 10 - target;
        const choices = buildChoices(emptyCount);
        instr.textContent = `Ada ${target} ${emoji} di keranjang. Berapa kotak yang masih kosong?`;
        speakInstruksi(`Ada ${getNamaAngka(target)} ${emoji} di keranjang. Berapa kotak kosong yang tersisa?`);

        const btns = buildAnswerButtons(
            choices, emptyCount,
            () => {
                lanjutanScore += 15 + lanjutanRound;
                fireConfetti(60);
                speakInstruksi(`Tepat! ${getNamaAngka(emptyCount)} kotak kosong. Ini artinya ${getNamaAngka(target)} butuh ${getNamaAngka(emptyCount)} lagi buat jadi 10!`);
                setTimeout(() => { lanjutanRound++; renderTenFrame(container); }, 6000);
            },
            () => speakInstruksi('Hitung lagi kotak kosongnya ya!')
        );
        document.getElementById('choices-area')!.appendChild(btns);
    }
}

// ==========================================
// GAME 8: TIMBANGAN (Aljabar Dasar / Balance)
// Versi baru: auto-detect seimbang, piring lebih besar, counter live
// Tidak ada tombol konfirmasi — saat jumlah sama, langsung rayakan
// ==========================================
function renderTimbangan(container: HTMLElement): void {
    renderHUD(container, 'Timbangan Ajaib', '⚖');
    const body = document.getElementById('game-body')!;

    const emojiList = ['🍗', '🥚', '🍎', '🐟', '🌟'];
    const emoji = emojiList[lanjutanRound % emojiList.length];
    const leftCount = Math.min(2 + Math.floor(lanjutanRound / 2), 8);
    // rightStart selalu lebih kecil dari leftCount
    const rightStart = Math.max(0, leftCount - randRange(1, Math.min(3, leftCount)));
    const needed = leftCount - rightStart;
    let placed = 0;

    body.innerHTML = `
      <p style="text-align:center; font-size:1rem; color:var(--text-main); margin-bottom:8px;">
        Tambahkan <strong>${emoji}</strong> ke sisi kanan sampai timbangan <strong>seimbang!</strong>
      </p>

      <!-- Timbangan visual -->
      <div style="position:relative; height:170px; margin-bottom:8px; user-select:none;">
        <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:10px; height:110px; background:#8d6e63; border-radius:5px;"></div>
        <div style="position:absolute; top:42px; left:50%; transform:translateX(-50%); width:18px; height:18px; background:#5d4037; border-radius:50%; z-index:2;"></div>
        <div id="scale-bar" style="position:absolute; top:50px; width:86%; left:7%; height:10px; background:#5d4037; border-radius:5px; transform-origin:center center; transition:transform 0.7s cubic-bezier(0.34,1.56,0.64,1);"></div>
        <!-- Piring Kiri (biru - sudah penuh, tidak bisa diubah) -->
        <div id="plate-left" style="position:absolute; left:2%; top:60px; width:38%; min-height:72px; background:rgba(173,216,230,0.6); border:3px solid #64b5f6; border-radius:16px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:2px; padding:6px; font-size:clamp(1rem,7vw,1.8rem); transition:top 0.7s cubic-bezier(0.34,1.56,0.64,1);"></div>
        <!-- Piring Kanan (hijau - tempat anak tambahkan) -->
        <div id="plate-right" style="position:absolute; right:2%; top:60px; width:38%; min-height:72px; background:rgba(144,238,144,0.4); border:3px dashed #66bb6a; border-radius:16px; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:2px; padding:6px; font-size:clamp(1rem,7vw,1.8rem); transition:top 0.7s cubic-bezier(0.34,1.56,0.64,1);"></div>
      </div>

      <!-- Live counter: Kiri ≠/= Kanan -->
      <div style="display:flex; justify-content:space-around; align-items:center; margin-bottom:12px; font-weight:800; font-size:1.1rem;">
        <span style="color:#1976d2;">⬅ <span id="cnt-left">${leftCount}</span> ${emoji}</span>
        <span id="eq-sign" style="font-size:2.2rem; color:#9e9e9e;">≠</span>
        <span style="color:#388e3c;"><span id="cnt-right">${rightStart}</span> ${emoji} ➡</span>
      </div>

      <!-- Tombol satu-satunya -->
      <div style="text-align:center;">
        <button id="btn-add" class="btn btn-green"
          style="font-size:2rem; padding:14px 36px; border-radius:20px; box-shadow:0 6px 0 #2b8a3e;">
          + ${emoji}
        </button>
        <p id="status-label" style="font-size:0.95rem; color:var(--text-muted); margin-top:8px;">
          Tambahkan ${needed} ${emoji} ke piring kanan!
        </p>
      </div>
    `;

    const plateLeft = document.getElementById('plate-left')!;
    const plateRight = document.getElementById('plate-right')!;
    const scaleBar = document.getElementById('scale-bar')!;
    const statusLabel = document.getElementById('status-label')!;
    const cntRight = document.getElementById('cnt-right')!;
    const eqSign = document.getElementById('eq-sign')!;
    const btnAdd = document.getElementById('btn-add')!;

    // Isi piring
    for (let i = 0; i < leftCount; i++)  plateLeft.textContent += emoji;
    for (let i = 0; i < rightStart; i++) plateRight.textContent += emoji;

    const updateScale = () => {
        const diff = leftCount - (rightStart + placed);
        const deg = Math.min(Math.max(diff * 5, -25), 25);
        scaleBar.style.transform = `rotate(${deg}deg)`;
        plateLeft.style.top = `${60 + Math.max(deg * 1.5, 0)}px`;
        plateRight.style.top = `${60 + Math.max(-deg * 1.5, 0)}px`;
    };
    updateScale();

    // Penjelasan awal: target kanan disebutkan eksplisit agar tidak ambigu
    speakInstruksi(
        `Kiri ada ${getNamaAngka(leftCount)} ${emoji}. ` +
        `Supaya seimbang, kanan juga harus berisi ${getNamaAngka(leftCount)}. ` +
        `Sekarang kanan baru ada ${getNamaAngka(rightStart)}. ` +
        `Tambahkan ${getNamaAngka(needed)} lagi!`
    );

    btnAdd.addEventListener('click', () => {
        if (placed >= needed) return;
        placed++;
        plateRight.textContent += emoji;
        cntRight.textContent = (rightStart + placed).toString();
        speak(getNamaAngka(rightStart + placed));
        updateScale();

        const remaining = needed - placed;
        if (remaining > 0) {
            statusLabel.textContent = `Bagus! Masih perlu ${remaining} lagi...`;
        } else {
            // SEIMBANG — auto rayakan
            (btnAdd as HTMLButtonElement).disabled = true;
            eqSign.textContent = '=';
            eqSign.style.color = 'var(--color-green)';
            statusLabel.textContent = '⚖ Seimbang sempurna!';
            playSFX('success', 0.9);
            fireConfetti(70);
            lanjutanScore += 10 + lanjutanRound;
            speak(
                `Seimbang! Kanan sekarang berisi ${getNamaAngka(leftCount)}, sama dengan kiri. ` +
                `${getNamaAngka(leftCount)} sama dengan ${getNamaAngka(rightStart)} tambah ${getNamaAngka(needed)}!`
            );
            setTimeout(() => { lanjutanRound++; renderTimbangan(container); }, 6500);
        }
    });
}
