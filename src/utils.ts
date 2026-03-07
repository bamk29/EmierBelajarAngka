/**
 * Menghasilkan HTML untuk visualisasi angka dengan sistem Grouping 10.
 * @param num Angka yang akan divisualisasikan
 * @param emoji Emoji yang digunakan
 * @param showLabels Apakah akan menampilkan label angka di samping baris dan total (untuk Belajar=true, Ujian/Bermain=false)
 */
export function renderVisualAngka(num: number, emoji: string, showLabels: boolean = true): string {
    if (num <= 0) return '';

    const displayNum = Math.min(num, 100); // Batasi visual maksimal 100 agar tidak lag parah
    const rows = Math.ceil(displayNum / 10);
    let rowHtml = '';
    let labels: string[] = [];

    for (let r = 0; r < rows; r++) {
        const countInRow = Math.min(10, displayNum - (r * 10));
        labels.push(countInRow.toString());
        rowHtml += `
      <div class="emoji-group-row" style="display:flex; align-items:center; gap:8px; margin-bottom:4px; justify-content:center;">
        <div class="emoji-row-content" style="font-size: 1.5rem; letter-spacing:2px;">
          ${Array(countInRow).fill(emoji).join(' ')}
        </div>
        ${showLabels ? `<div class="group-label" style="background:var(--color-blue); color:white; border-radius:50%; width:24px; height:24px; font-size:0.7rem; display:flex; align-items:center; justify-content:center; font-weight:bold;">${countInRow}</div>` : ''}
      </div>
    `;
    }

    const labelSum = labels.join(' + ');
    return `
    <div class="emoji-objects" style="margin:16px 0; display:flex; flex-direction:column; align-items:center;">
      ${rowHtml}
      ${showLabels && displayNum > 10 ? `<div class="group-total-label" style="font-size:0.9rem; font-weight:bold; margin-top:8px; color:var(--text-light); border-top:1px dashed #ccc; padding-top:4px;">${labelSum} = ${displayNum}</div>` : ''}
      ${num > displayNum ? `<p style="font-size:0.8rem; opacity:0.6; margin-top:4px;">... (dan ${num - displayNum} lainnya)</p>` : ''}
    </div>
  `;
}

/** Mengacak array */
export function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/** Angka acak dalam range [min, max] */
export function randRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
