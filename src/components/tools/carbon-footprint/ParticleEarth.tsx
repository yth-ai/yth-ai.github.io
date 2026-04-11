import { useRef, useEffect, useCallback } from 'react';

interface ParticleEarthProps {
  /** 0 (clean/blue-green) to 1 (heavy/red) */
  intensity: number;
  size?: number;
}

interface Particle {
  theta: number;
  phi: number;
  x: number;
  y: number;
  z: number;
  baseSize: number;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default function ParticleEarth({ intensity, size = 160 }: ParticleEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef(0);
  const frameRef = useRef(0);
  const isDarkRef = useRef(false);

  // Generate particles on a sphere (Fibonacci sphere distribution)
  const generateParticles = useCallback((count: number) => {
    const particles: Particle[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      const theta = Math.acos(1 - 2 * (i + 0.5) / count);
      const phi = 2 * Math.PI * i / goldenRatio;
      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);
      particles.push({
        theta, phi, x, y, z,
        baseSize: 0.8 + Math.random() * 0.6,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    if (!particlesRef.current.length) {
      particlesRef.current = generateParticles(1200);
    }
  }, [generateParticles]);

  // Detect dark mode
  useEffect(() => {
    const check = () => {
      isDarkRef.current = document.documentElement.classList.contains('dark');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = size * 0.38;
    const cx = size / 2;
    const cy = size / 2;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      const dark = isDarkRef.current;
      rotationRef.current += 0.003;
      const rot = rotationRef.current;

      // Intensity-based color: green → yellow → orange → red
      const hue = 150 - intensity * 130; // 150 (green) → 20 (red)
      const sat = 70 + intensity * 15;
      const breathe = intensity > 0.3 ? Math.sin(Date.now() / 1000) * intensity * 4 : 0;

      // Glow
      const glowAlpha = dark ? 0.12 + intensity * 0.08 : 0.08 + intensity * 0.06;
      const [gr, gg, gb] = hslToRgb(hue, sat, 55);
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
      glow.addColorStop(0, `rgba(${gr},${gg},${gb},${glowAlpha})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Sort particles by z for depth
      const sorted = particlesRef.current.map(p => {
        const cosRot = Math.cos(rot);
        const sinRot = Math.sin(rot);
        const rx = p.x * cosRot - p.z * sinRot;
        const rz = p.x * sinRot + p.z * cosRot;
        return { ...p, rx, ry: p.y, rz };
      }).sort((a, b) => a.rz - b.rz);

      for (const p of sorted) {
        const expand = 1 + breathe * 0.015;
        const px = cx + p.rx * radius * expand;
        const py = cy + p.ry * radius * expand;

        // Depth-based alpha: front particles brighter
        const depth = (p.rz + 1) / 2; // 0 (back) to 1 (front)
        const alpha = 0.15 + depth * 0.75;

        // Per-particle hue variation (simulate land/sea)
        const isLand = (Math.sin(p.theta * 3.7 + 1.2) * Math.cos(p.phi * 2.3 + 0.8)) > 0.1;
        const particleHue = isLand ? hue + 30 : hue - 10;
        const particleLightness = isLand ? (dark ? 55 : 45) : (dark ? 65 : 55);

        const [pr, pg, pb] = hslToRgb(particleHue, sat, particleLightness);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
        const dotSize = p.baseSize * (0.6 + depth * 0.6);
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
