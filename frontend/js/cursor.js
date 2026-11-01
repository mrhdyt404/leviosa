/**
 * LEVIOSA - Animated Flying Spellbook Cursor with Golden Magical Particle Trail
 * Inspired by Wingardium Leviosa spellbook & Hogwarts magic
 */

class MagicCursor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.lastPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.speed = 0;
        this.cursorElement = null;
        this.isActive = true;
        this.isEnabled = true;

        this.init();
    }

    init() {
        // Create canvas for particles
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'magic-particles-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '99998';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Create Custom Flying Book Cursor
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'leviosa-magic-cursor';
        this.cursorElement.innerHTML = `
            <div class="cursor-book-container">
                <!-- Golden Magical Aura Glow -->
                <div class="book-magic-aura"></div>
                
                <!-- Left Wing -->
                <div class="book-wing book-wing-left">
                    <svg viewBox="0 0 40 30" class="wing-svg">
                        <path d="M40 25 C30 25 15 20 5 10 C0 5 2 0 10 2 C22 5 32 15 40 25 Z" fill="url(#wingGold)" filter="url(#glow)"/>
                        <path d="M40 25 C32 20 20 18 12 12 C8 9 10 6 16 8 C26 12 34 18 40 25 Z" fill="#fff" opacity="0.4"/>
                    </svg>
                </div>

                <!-- Open Spellbook Body -->
                <div class="spellbook">
                    <div class="book-spine"></div>
                    <div class="book-cover book-cover-left">
                        <div class="runic-gold-detail">✦</div>
                    </div>
                    <div class="book-pages book-pages-left">
                        <div class="page-layer page-flip-left"></div>
                    </div>
                    <div class="book-pages book-pages-right">
                        <div class="page-layer page-flip-right"></div>
                    </div>
                    <div class="book-cover book-cover-right">
                        <div class="runic-gold-detail">✦</div>
                    </div>
                    <div class="spell-ribbon"></div>
                </div>

                <!-- Right Wing -->
                <div class="book-wing book-wing-right">
                    <svg viewBox="0 0 40 30" class="wing-svg">
                        <path d="M0 25 C10 25 25 20 35 10 C40 5 38 0 30 2 C18 5 8 15 0 25 Z" fill="url(#wingGold)" filter="url(#glow)"/>
                        <path d="M0 25 C8 20 20 18 28 12 C32 9 30 6 24 8 C14 12 6 18 0 25 Z" fill="#fff" opacity="0.4"/>
                        <defs>
                            <linearGradient id="wingGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#fff8db" stop-opacity="0.9"/>
                                <stop offset="40%" stop-color="#f5d77f" stop-opacity="0.75"/>
                                <stop offset="100%" stop-color="#d4af37" stop-opacity="0.4"/>
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                            </filter>
                        </defs>
                    </svg>
                </div>
            </div>
        `;
        document.body.appendChild(this.cursorElement);

        // Bind events
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseleave', () => {
            this.isActive = false;
            this.cursorElement.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            this.isActive = true;
            this.cursorElement.style.opacity = '1';
        });

        // Add hover effects on clickable elements
        this.setupInteractiveHover();

        // Start render loop
        this.render();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.isActive = true;
        this.cursorElement.style.opacity = '1';

        // Calculate velocity
        const dx = this.mouse.x - this.lastPos.x;
        const dy = this.mouse.y - this.lastPos.y;
        this.speed = Math.sqrt(dx * dx + dy * dy);

        // Spawn magical sparks proportional to velocity
        const spawnCount = Math.min(Math.floor(this.speed / 5) + 1, 6);
        for (let i = 0; i < spawnCount; i++) {
            this.spawnParticle(this.mouse.x, this.mouse.y, false);
        }

        this.lastPos.x = this.mouse.x;
        this.lastPos.y = this.mouse.y;
    }

    onMouseDown(e) {
        // Magical golden burst on click
        for (let i = 0; i < 24; i++) {
            this.spawnParticle(e.clientX, e.clientY, true);
        }

        // Add flap acceleration class
        this.cursorElement.classList.add('cursor-casting');
        setTimeout(() => this.cursorElement.classList.remove('cursor-casting'), 400);
    }

    setupInteractiveHover() {
        const hoverTargets = 'button, a, input, select, textarea, .glass-card, .clickable, .quick-prompt, .nav-item';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverTargets)) {
                this.cursorElement.classList.add('cursor-hover');
                for (let i = 0; i < 6; i++) {
                    this.spawnParticle(this.cursorPos.x, this.cursorPos.y, false);
                }
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverTargets)) {
                this.cursorElement.classList.remove('cursor-hover');
            }
        });
    }

    spawnParticle(x, y, isBurst = false) {
        const angle = isBurst ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 1.5 + Math.PI;
        const speed = isBurst ? Math.random() * 4 + 1.5 : Math.random() * 2 + 0.5;
        const size = Math.random() * (isBurst ? 4 : 2.5) + 1;
        const life = Math.random() * 40 + 35; // frames

        // Golden palette
        const colors = [
            '#ffffff', // bright center
            '#fff9e6', // celestial cream
            '#ffd700', // pure gold
            '#f5c542', // amber gold
            '#d4af37', // metallic gold
            '#e69a0b'  // bronze shimmer
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 12 + 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed + (isBurst ? 0 : 0.8), // slight downward gravity
            size: size,
            maxLife: life,
            life: life,
            color: color,
            spin: (Math.random() - 0.5) * 0.1,
            angle: Math.random() * Math.PI * 2,
            isStar: Math.random() > 0.4
        });
    }

    render() {
        // Linear Interpolation (LERP) for ultra-smooth gliding
        const ease = 0.22;
        this.cursorPos.x += (this.mouse.x - this.cursorPos.x) * ease;
        this.cursorPos.y += (this.mouse.y - this.cursorPos.y) * ease;

        // Calculate pitch / roll tilt based on cursor velocity
        const vx = this.mouse.x - this.cursorPos.x;
        const vy = this.mouse.y - this.cursorPos.y;
        const tiltX = Math.max(Math.min(vy * 0.45, 20), -20);
        const tiltY = Math.max(Math.min(vx * 0.6, 25), -25);

        // Update DOM cursor position
        if (this.cursorElement) {
            this.cursorElement.style.transform = `translate3d(${this.cursorPos.x}px, ${this.cursorPos.y}px, 0) rotateZ(${tiltY}deg) rotateX(${-tiltX}deg)`;
        }

        // Render Canvas Particles
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.angle += p.spin;
            p.life--;

            const progress = p.life / p.maxLife;
            const alpha = Math.max(progress, 0);

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);

            if (p.isStar) {
                // Draw 4-point golden star sparkle
                const s = p.size * (0.5 + progress * 0.7);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = '#ffd700';
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -s * 2.2);
                this.ctx.quadraticCurveTo(0, 0, s * 2.2, 0);
                this.ctx.quadraticCurveTo(0, 0, 0, s * 2.2);
                this.ctx.quadraticCurveTo(0, 0, -s * 2.2, 0);
                this.ctx.quadraticCurveTo(0, 0, 0, -s * 2.2);
                this.ctx.fill();
            } else {
                // Glowing circular ember
                const rad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
                rad.addColorStop(0, '#ffffff');
                rad.addColorStop(0.4, p.color);
                rad.addColorStop(1, 'rgba(212, 175, 55, 0)');

                this.ctx.fillStyle = rad;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        requestAnimationFrame(() => this.render());
    }
}

// Instantiate on window load
document.addEventListener('DOMContentLoaded', () => {
    window.leviosaCursor = new MagicCursor();
});
