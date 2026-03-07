/**
 * TTS Module — Text-to-Speech Bahasa Indonesia
 * Menggunakan Google Translate TTS Endpoint (Unofficial) via HTML Audio
 * Menjamin suara selalu Indonesia yang natural (tidak akan jadi robot bule)
 */

/** Daftar nama angka Indonesia */
const NAMA_ANGKA: string[] = [
  'nol', 'satu', 'dua', 'tiga', 'empat', 'lima',
  'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh',
  'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
  'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas', 'dua puluh'
];

/** Daftar pujian acak */
const PUJIAN: string[] = [
  'Hebat!',
  'Pintar sekali!',
  'Bagus!',
  'Benar!',
  'Luar biasa!',
  'Keren!',
  'Mantap!',
  'Anak pintar!',
  'Sempurna!',
  'Wah hebat sekali!'
];

/** Kalimat saat jawaban salah */
const SALAH: string[] = [
  'Coba lagi ya!',
  'Hampir benar, coba lagi!',
  'Yuk coba sekali lagi!',
  'Belum tepat, ayo coba lagi!'
];

// State audio global (bisa di-toggle oleh pengguna)
export let isAudioEnabled = true;

/** Toggle state audio */
export function toggleAudio(forceState?: boolean): boolean {
  isAudioEnabled = forceState !== undefined ? forceState : !isAudioEnabled;
  if (!isAudioEnabled) {
    speechSynthesis.cancel();
  }
  return isAudioEnabled;
}

/**
 * Inisialisasi TTS
 */
export function initTTS(): Promise<void> {
  return new Promise((resolve) => {
    // Panggil getVoices sekali agar proses load voice list browser ter-trigger di background
    speechSynthesis.getVoices();
    resolve();
  });
}

/**
 * Bicara teks dengan suara Indonesia
 */
export function speak(text: string, rate: number = 0.95): Promise<void> {
  return new Promise((resolve) => {
    // Batalkan omongan sebelumnya
    speechSynthesis.cancel();

    if (!isAudioEnabled || !text) {
      return resolve();
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID'; // Wajib agar logat Indonesia
      utterance.rate = rate;    // Kecepatan (default disesuaikan input, standar 0.95)
      utterance.pitch = 1.0;    // Nada/Tinggi suara

      // Ambil semua daftar suara dari browser/OS
      const voices = window.speechSynthesis.getVoices();

      // Cari suara 'Google' Bahasa Indonesia yang diproses online (jauh lebih halus/natural),
      // Jika tidak ada, fallback ke suara default id-ID pertama.
      const suaraBagus = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google'))
        || voices.find(v => v.lang === 'id-ID');

      if (suaraBagus) {
        utterance.voice = suaraBagus;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis Error:', e);
        resolve(); // Tetep lanjut agar game tidak stuck
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Gagal bicara:', err);
        resolve();
      }
    } else {
      resolve();
    }
  });
}

/**
 * Bicara nama angka
 */
export function speakAngka(n: number): Promise<void> {
  const nama = NAMA_ANGKA[n] || String(n);
  return speak(nama);
}

/**
 * Bicara nama angka lengkap: "Tiga. Ini angka tiga."
 */
export function speakAngkaLengkap(n: number): Promise<void> {
  const nama = NAMA_ANGKA[n] || String(n);
  return speak(nama + '. Ini angka ' + nama + '.', 0.85);
}

/**
 * Bicara pujian acak
 */
export function speakPujian(): Promise<void> {
  const pujian = PUJIAN[Math.floor(Math.random() * PUJIAN.length)];
  return speak(pujian);
}

/**
 * Bicara komentar saat jawaban salah
 */
export function speakSalah(): Promise<void> {
  const salah = SALAH[Math.floor(Math.random() * SALAH.length)];
  return speak(salah);
}

/**
 * Bicara instruksi soal
 */
export function speakInstruksi(text: string): Promise<void> {
  return speak(text, 0.85);
}

/**
 * Hitung bersama — TTS bilang angka satu per satu dengan jeda
 * @param dari - angka awal
 * @param sampai - angka akhir
 */
export async function hitungBersama(dari: number, sampai: number): Promise<void> {
  await speak('Ayo hitung bersama!', 0.85);
  const step = dari <= sampai ? 1 : -1;
  for (let i = dari; step > 0 ? i <= sampai : i >= sampai; i += step) {
    await new Promise(r => setTimeout(r, 400));
    // Kita tunggu audio selese dulu di tiap iterasi
    await speak(NAMA_ANGKA[i] || String(i), 0.85);
  }
}

/** Getter untuk nama angka */
export function getNamaAngka(n: number): string {
  return NAMA_ANGKA[n] || String(n);
}
