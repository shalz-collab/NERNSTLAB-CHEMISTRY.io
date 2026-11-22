import { useEffect, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { motionMode, theme } = useSimulation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const count = motionMode === 'enhanced' ? 32 : 20;

    const lineRgb =
      theme === 'forest' ? '52, 211, 153' : theme === 'ivory' ? '180, 83, 9' : '245, 158, 11';
    const dotRgbA =
      theme === 'forest' ? '52, 211, 153' : '245, 158, 11';
    const dotRgbB = '16, 185, 129';

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: count }, (_, idx) => ({
      x: (((idx * 173.3) % 100) / 100) * canvas.offsetWidth,
      y: (((idx * 97.7) % 100) / 100) * canvas.offsetHeight,
      vx: (((idx % 5) - 2) * 0.14) || 0.12,
      vy: ((((idx + 2) % 5) - 2) * 0.12) || -0.1,
      r: 2 + (idx % 3) * 1.1,
      charge: idx % 2 === 0 ? '+' : '-',
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (motionMode !== 'reduced') {
          const mult = motionMode === 'enhanced' ? 1.5 : 1;
          a.x += a.vx * mult;
          a.y += a.vy * mult;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(${lineRgb}, ${(1 - dist / 130) * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.charge === '+' ? `rgba(${dotRgbA}, 0.26)` : `rgba(${dotRgbB}, 0.22)`;
        ctx.fill();
      }

      if (motionMode !== 'reduced') {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [motionMode, theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-80"
    />
  );
}
