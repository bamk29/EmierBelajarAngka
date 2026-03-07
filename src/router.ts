/**
 * Router — Navigasi antar halaman
 * Dipisahkan dari main.ts untuk menghindari circular dependency
 */

/** Navigasi ke halaman tertentu */
export function navigateTo(page: string, params?: Record<string, string>): void {
    let hash = `#${page}`;
    if (params) {
        const query = Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
        hash += `?${query}`;
    }
    window.location.hash = hash;
}
