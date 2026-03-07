/**
 * Confetti Effect — Efek celebrasi saat jawaban benar
 * Menggunakan canvas overlay
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    life: number;
    maxLife: number;
}

const COLORS = [
    '#FFE066', '#74C0FC', '#69DB7C', '#FF8787',
    '#DA77F2', '#FFA94D', '#F06595', '#845EF7',
    '#20C997', '#FCC419'
];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animating = false;

/** Inisialisasi canvas confetti */
function ensureCanvas(): void {
    if (!canvas) {
        canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
        if (canvas) {
            ctx = canvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }
    }
}

/** Resize canvas ke fullscreen */
function resizeCanvas(): void {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/** Buat satu partikel confetti */
function createParticle(): Particle {
    return {
        x: Math.random() * (canvas?.width || window.innerWidth),
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 120 + Math.random() * 60
    };
}

/** Update dan render satu frame */
function animate(): void {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.vy += 0.1; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out
        const alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();

        // Hapus partikel yang sudah mati
        if (p.life >= p.maxLife || p.y > canvas.height + 20) {
            particles.splice(i, 1);
        }
    }

    if (particles.length > 0) {
        requestAnimationFrame(animate);
    } else {
        animating = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Jalankan efek confetti! 🎉
 * @param count - jumlah partikel (default 80)
 */
export function fireConfetti(count: number = 80): void {
    ensureCanvas();
    if (!canvas || !ctx) return;

    // Tambah partikel baru
    for (let i = 0; i < count; i++) {
        particles.push(createParticle());
    }

    // Start animation loop jika belum jalan
    if (!animating) {
        animating = true;
        animate();
    }
}

/**
 * Confetti dari titik tertentu (untuk jawaban benar)
 */
export function fireConfettiAt(x: number, y: number, count: number = 40): void {
    ensureCanvas();
    if (!canvas || !ctx) return;

    for (let i = 0; i < count; i++) {
        const p = createParticle();
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 12;
        p.vy = -(Math.random() * 8 + 2);
        particles.push(p);
    }

    if (!animating) {
        animating = true;
        animate();
    }
}
