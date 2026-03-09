/**
 * SFX Module — Sound Effects untuk Feedback Visual
 * Menggunakan audio assets dari CDN yang ringan dan responsif
 */

import { isAudioEnabled } from './tts';

const SFX_URLS = {
    pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Balon pecah
    success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Jawaban benar / Bintang
    fail: 'https://assets.mixkit.co/active_storage/sfx/255/255-preview.mp3', // Jawaban salah
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Klik menu
    win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' // Selesai level
};

type SFXType = keyof typeof SFX_URLS;

const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Putar suara efek
 * @param type - Jenis suara
 * @param volume - Level volume (0.0 - 1.0)
 */
export function playSFX(type: SFXType, volume: number = 0.5): void {
    if (!isAudioEnabled) return;

    const url = SFX_URLS[type];
    if (!url) return;

    // Gunakan cache agar tidak download terus menerus
    if (!audioCache[url]) {
        audioCache[url] = new Audio(url);
        audioCache[url].preload = 'auto';
    }

    const audio = audioCache[url].cloneNode() as HTMLAudioElement;
    audio.volume = volume;

    try {
        audio.play().catch(err => {
            console.warn('Gagal putar SFX:', err);
        });
    } catch (e) {
        // Abaikan jika gagal (misal: belum interaksi pertama)
    }
}

/**
 * Preload semua SFX di awal
 */
export function preloadSFX(): void {
    Object.values(SFX_URLS).forEach(url => {
        if (!audioCache[url]) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioCache[url] = audio;
        }
    });
}
