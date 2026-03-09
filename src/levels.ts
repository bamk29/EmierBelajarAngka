/**
 * Level Config — Konfigurasi dan logic unlock level
 * 6 level progresif, progress disimpan di localStorage
 */

/** Tipe menu yang tersedia */
export type MenuType = 'belajar' | 'ujian' | 'bermain';

/** Data progress per menu */
export interface MenuProgress {
    /** Level tertinggi yang sudah dibuka (1-5) */
    unlockedLevel: number;
    /** Bintang TERKUMPUL per level (0 - 20) [lv1, lv2, lv3, lv4, lv5] */
    stars: number[];
    /** Total soal dijawab benar per level */
    correctAnswers: number[];
    /** Total soal dijawab per level */
    totalAnswers: number[];
}

/** Data profil anak */
export interface ChildProfile {
    name: string;
    avatar: string;
    streak: number;
    lastPlayed: string; // ISO string
}

/** Config per level */
export interface LevelConfig {
    /** Nama level */
    name: string;
    /** Ikon level */
    icon: string;
    /** Range angka [min, max] */
    range: [number, number];
    /** Jumlah soal di ujian */
    soalCount: number;
    /** Jumlah ronde di bermain */
    /** Jumlah ronde di bermain */
    rondeCount: number;
    /** Bintang yang dibutuhkan untuk membuka level selanjutnya (Max 20) */
    requiredStars: number;
    /** Deskripsi singkat */
    description: string;
    /** Warna tema */
    color: string;
}

export const MAX_STARS_PER_LEVEL = 20;

/** Konfigurasi 6 level */
export const LEVEL_CONFIGS: LevelConfig[] = [
    {
        name: 'Pemula',
        icon: '🌱',
        range: [1, 100],
        soalCount: 5,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Mengenal angka 1-100',
        color: '#69DB7C'
    },
    {
        name: 'Penjelajah',
        icon: '🌿',
        range: [10, 99],
        soalCount: 8,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Puluhan & perbandingan',
        color: '#74C0FC'
    },
    {
        name: 'Petualang',
        icon: '🌳',
        range: [100, 999],
        soalCount: 8,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Mengenal ratusan',
        color: '#FFE066'
    },
    {
        name: 'Ksatria',
        icon: '⚔️',
        range: [1000, 9999],
        soalCount: 8,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Mengenal ribuan',
        color: '#F06595'
    },
    {
        name: 'Jagoan',
        icon: '🌟',
        range: [1, 20],
        soalCount: 10,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Penjumlahan & pengurangan',
        color: '#FFA94D'
    },
    {
        name: 'Juara',
        icon: '👑',
        range: [1, 100],
        soalCount: 12,
        rondeCount: 5,
        requiredStars: 20,
        description: 'Uang, pola & campuran',
        color: '#DA77F2'
    }
];

/** Key localStorage */
const STORAGE_KEY = 'angka-app-progress';
const PROFILE_KEY = 'angka-app-profile';

/** Default profil baru */
function defaultProfile(): ChildProfile {
    return {
        name: '',
        avatar: '🦁',
        streak: 0,
        lastPlayed: new Date().toISOString()
    };
}

/** Default progress baru */
function defaultProgress(): Record<MenuType, MenuProgress> {
    const empty: MenuProgress = {
        unlockedLevel: 1,
        stars: [0, 0, 0, 0, 0, 0],
        correctAnswers: [0, 0, 0, 0, 0, 0],
        totalAnswers: [0, 0, 0, 0, 0, 0]
    };
    return {
        belajar: { ...empty, stars: [...empty.stars], correctAnswers: [...empty.correctAnswers], totalAnswers: [...empty.totalAnswers] },
        ujian: { ...empty, stars: [...empty.stars], correctAnswers: [...empty.correctAnswers], totalAnswers: [...empty.totalAnswers] },
        bermain: { ...empty, stars: [...empty.stars], correctAnswers: [...empty.correctAnswers], totalAnswers: [...empty.totalAnswers] }
    };
}

/** Load progress dari localStorage */
export function loadProgress(): Record<MenuType, MenuProgress> {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            const def = defaultProgress();
            for (const menu of ['belajar', 'ujian', 'bermain'] as MenuType[]) {
                if (parsed[menu]) {
                    def[menu] = { ...def[menu], ...parsed[menu] };
                    // Migrasi: jika data lama masih 5 elemen, perlebar ke 6
                    const levelCount = LEVEL_CONFIGS.length;
                    for (const key of ['stars', 'correctAnswers', 'totalAnswers'] as const) {
                        while (def[menu][key].length < levelCount) {
                            def[menu][key].push(0);
                        }
                    }
                }
            }
            return def;
        }
    } catch (e) {
        console.warn('Gagal load progress:', e);
    }
    return defaultProgress();
}

/** Simpan progress ke localStorage */
export function saveProgress(progress: Record<MenuType, MenuProgress>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.warn('Gagal simpan progress:', e);
    }
}

/** Cek apakah level sudah terbuka (sekarang semuanya terbuka by default) */
export function isLevelUnlocked(_menu: MenuType, _level: number): boolean {
    return true; // Semua level terbuka — navigasi via bintang saja
}

/**
 * Update progress setelah menyelesaikan sesi bintang (sub-level)
 * Bintang bertambah +1 HANYA JIKA user menyelesaikan sub-level tertinggi (baru).
 */
export function completeSubLevel(
    menu: MenuType,
    level: number,
    subLevelIndex: number, // Bintang target yang dimainkan (0-19)
    benar?: number,
    total?: number
): void {
    const progress = loadProgress();
    const mp = progress[menu];
    const lvIdx = level - 1;

    // Update stats historikal jika disediakan
    if (benar !== undefined && total !== undefined) {
        mp.correctAnswers[lvIdx] += benar;
        mp.totalAnswers[lvIdx] += total;
    }

    // Jika menyelesaikan subLevel yang berstatus 'Baru' (tertinggi yg terbuka)
    if (subLevelIndex === mp.stars[lvIdx]) {
        mp.stars[lvIdx] = Math.min(LEVEL_CONFIGS[lvIdx].requiredStars, mp.stars[lvIdx] + 1);
    }

    saveProgress(progress);
}

/** Dapatkan total bintang semua menu */
export function getTotalStars(): number {
    const progress = loadProgress();
    let total = 0;
    for (const menu of ['belajar', 'ujian', 'bermain'] as MenuType[]) {
        total += progress[menu].stars.reduce((a, b) => a + b, 0);
    }
    return total;
}

/** Reset semua progress */
export function resetProgress(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_KEY);
}

/** Load profil anak */
export function getChildProfile(): ChildProfile {
    try {
        const data = localStorage.getItem(PROFILE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.warn('Gagal load profil:', e);
    }
    return defaultProfile();
}

/** Simpan profil anak */
export function saveChildProfile(profile: Partial<ChildProfile>): void {
    try {
        const current = getChildProfile();
        const updated = { ...current, ...profile };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Gagal simpan profil:', e);
    }
}

/** 
 * Update Daily Streak 
 * Dipanggil saat aplikasi dibuka pertama kali setiap hari
 */
export function updateStreak(): void {
    const profile = getChildProfile();
    const lastPlayed = new Date(profile.lastPlayed);
    const today = new Date();

    // Set to midnight for comparison
    const lastDate = new Date(lastPlayed.getFullYear(), lastPlayed.getMonth(), lastPlayed.getDate());
    const currDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = currDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        // Main kemaren, streak lanjut
        profile.streak++;
        profile.lastPlayed = today.toISOString();
        saveChildProfile(profile);
    } else if (diffDays > 1) {
        // Terlambat main, streak reset
        profile.streak = 1;
        profile.lastPlayed = today.toISOString();
        saveChildProfile(profile);
    } else if (diffDays === 0) {
        // Sudah main hari ini, biarkan saja
    } else {
        // First time atau error date?
        if (profile.streak === 0) profile.streak = 1;
        profile.lastPlayed = today.toISOString();
        saveChildProfile(profile);
    }
}
