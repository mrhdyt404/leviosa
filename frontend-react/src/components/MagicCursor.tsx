import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxLife: number;
  life: number;
  color: string;
  spin: number;
  angle: number;
  isStar: boolean;
}

export const MagicCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const posRef = useRef({ x: -100, y: -100 });
  const lastPosRef = useRef({ x: -100, y: -100 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const colors = ['#ffffff', '#fff9e6', '#ffd700', '#f5c542', '#d4af37', '#e69a0b'];

    const spawnParticle = (x: number, y: number, isBurst = false) => {
      const angle = isBurst ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 1.5 + Math.PI;
      const speed = isBurst ? Math.random() * 4 + 1.5 : Math.random() * 2 + 0.5;
      const size = Math.random() * (isBurst ? 4 : 2.5) + 1;
      const life = Math.random() * 35 + 30;

      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12 + 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (isBurst ? 0 : 0.7),
        size,
        maxLife: life,
        life,
        color: colors[Math.floor(Math.random() * colors.length)],
        spin: (Math.random() - 0.5) * 0.1,
        angle: Math.random() * Math.PI * 2,
        isStar: Math.random() > 0.4
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }

      const dx = mouseRef.current.x - lastPosRef.current.x;
      const dy = mouseRef.current.y - lastPosRef.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      const spawnCount = Math.min(Math.floor(speed / 6) + 1, 5);
      for (let i = 0; i < spawnCount; i++) {
        spawnParticle(mouseRef.current.x, mouseRef.current.y, false);
      }

      lastPosRef.current.x = mouseRef.current.x;
      lastPosRef.current.y = mouseRef.current.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      for (let i = 0; i < 22; i++) {
        spawnParticle(e.clientX, e.clientY, true);
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    let animationId: number;

    const render = () => {
      // Smooth LERP movement
      const ease = 0.24;
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * ease;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * ease;

      const vx = mouseRef.current.x - posRef.current.x;
      const vy = mouseRef.current.y - posRef.current.y;
      const tiltX = Math.max(Math.min(vy * 0.45, 18), -18);
      const tiltY = Math.max(Math.min(vx * 0.6, 24), -24);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) rotateZ(${tiltY}deg) rotateX(${-tiltX}deg)`;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.angle += p.spin;
        p.life--;

        const progress = p.life / p.maxLife;
        const alpha = Math.max(progress, 0);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.isStar) {
          const s = p.size * (0.6 + progress * 0.7);
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -s * 2.2);
          ctx.quadraticCurveTo(0, 0, s * 2.2, 0);
          ctx.quadraticCurveTo(0, 0, 0, s * 2.2);
          ctx.quadraticCurveTo(0, 0, -s * 2.2, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s * 2.2);
          ctx.fill();
        } else {
          const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
          rad.addColorStop(0, '#ffffff');
          rad.addColorStop(0.4, p.color);
          rad.addColorStop(1, 'rgba(212, 175, 55, 0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99998]"
      />

      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] opacity-0 transition-opacity duration-200"
        style={{
          transformOrigin: 'center center',
          margin: '-18px 0 0 -22px',
          perspective: '600px'
        }}
      >
        <div className="relative flex items-center justify-center animate-book-float">
          {/* Magic Golden Aura Glow */}
          <div className="absolute -inset-2 bg-yellow-400/25 rounded-full blur-md animate-magic-pulse" />

          {/* Left Wing */}
          <div className="w-7 h-5 animate-wing-left origin-right -mr-1">
            <svg viewBox="0 0 40 30" className="w-full h-full drop-shadow-[0_0_6px_#ffd700]">
              <path
                d="M40 25 C30 25 15 20 5 10 C0 5 2 0 10 2 C22 5 32 15 40 25 Z"
                fill="url(#cursorWingGold)"
              />
              <path
                d="M40 25 C32 20 20 18 12 12 C8 9 10 6 16 8 C26 12 34 18 40 25 Z"
                fill="#ffffff"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="cursorWingGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="50%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#b8860b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Open Flying Spellbook */}
          <div className="relative w-8 h-6 bg-[#4a1c12] rounded-[2px] shadow-lg border border-[#ffd700]/70 flex items-center justify-center">
            {/* Pages Left */}
            <div className="w-[14px] h-[20px] bg-[#fff8eb] border-r border-[#d4af37]/60 rounded-l-[1px] animate-page-left origin-right flex flex-col justify-around py-0.5 px-0.5">
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-full" />
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-3/4" />
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-4/5" />
            </div>

            {/* Spine */}
            <div className="w-[2px] h-[22px] bg-[#ffd700] shadow-[0_0_4px_#ffd700]" />

            {/* Pages Right */}
            <div className="w-[14px] h-[20px] bg-[#fff8eb] border-l border-[#d4af37]/60 rounded-r-[1px] animate-page-right origin-left flex flex-col justify-around py-0.5 px-0.5">
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-full" />
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-4/5" />
              <div className="h-[1.5px] bg-[#8c6d1f]/40 w-2/3" />
            </div>
          </div>

          {/* Right Wing */}
          <div className="w-7 h-5 animate-wing-right origin-left -ml-1">
            <svg viewBox="0 0 40 30" className="w-full h-full drop-shadow-[0_0_6px_#ffd700]">
              <path
                d="M0 25 C10 25 25 20 35 10 C40 5 38 0 30 2 C18 5 8 15 0 25 Z"
                fill="url(#cursorWingGoldRight)"
              />
              <path
                d="M0 25 C8 20 20 18 28 12 C32 9 30 6 24 8 C14 12 6 18 0 25 Z"
                fill="#ffffff"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="cursorWingGoldRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="50%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#b8860b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};
