'use client';

import * as React from 'react';
import type { VoiceTurnState } from './voice-types';

interface AgentPresenceProps {
  state: VoiceTurnState;
  amplitude: number;
  reducedMotion: boolean;
  lineCount?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  strength: number;
}

function seededParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const x = ((index * 47) % 97) / 100;
    const peak = Math.exp(-Math.pow((x - 0.5) / 0.3, 2));
    return {
      x,
      y: 0.5 + (((index * 29) % 31) - 15) / 100 * (0.6 + peak),
      size: 0.6 + (index % 3) * 0.25,
      strength: 0.25 + peak * 0.65,
    };
  });
}

export function AgentPresence({
  state,
  amplitude,
  reducedMotion,
  lineCount = 140,
}: AgentPresenceProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const amplitudeRef = React.useRef(amplitude);
  amplitudeRef.current = amplitude;
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const reducedRef = React.useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const particles = seededParticles(40);
    let frame = 0;
    let lastTime = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      if (document.visibilityState === 'hidden') return;
      if (lastTime === 0) lastTime = time;
      const delta = Math.min(48, time - lastTime);
      lastTime = time;
      const currentState = stateRef.current;
      const motion = reducedRef.current ? 0.06 : Math.min(1, delta / 16);
      const active = currentState === 'agent_speaking';
      const thinking = currentState === 'agent_thinking';
      const intensity = active ? Math.max(0.18, amplitudeRef.current) : thinking ? 0.42 : currentState === 'connecting' ? 0.12 : 0.2;
      const accent = getComputedStyle(canvas).getPropertyValue('--iv-accent').trim();
      const glow = getComputedStyle(canvas).getPropertyValue('--iv-glow').trim();
      context.clearRect(0, 0, width, height);

      const bloom = active ? 0.2 + intensity * 0.26 : thinking ? 0.1 : currentState === 'candidate_speaking' ? 0.03 : 0.05;
      const gradient = context.createRadialGradient(width * 0.56, height * 0.46, 0, width * 0.56, height * 0.46, Math.max(width, height) * 0.68);
      gradient.addColorStop(0, `${glow} ${Math.round(bloom * 100)}%`);
      gradient.addColorStop(1, 'transparent');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const count = Math.max(48, lineCount);
      const centerY = height * 0.5;
      for (let index = 0; index < count; index += 1) {
        const normalized = index / (count - 1);
        const y = centerY + (normalized - 0.5) * height * 0.6;
        context.beginPath();
        const vertical = (normalized - 0.5) * 2;
        const lineOpacity = Math.max(0.08, 1 - Math.abs(vertical) * 0.56) * (active ? 0.95 : currentState === 'candidate_speaking' ? 0.45 : 0.58);
        context.strokeStyle = `${accent} ${Math.round(lineOpacity * 100)}%`;
        context.lineWidth = index % 7 === 0 ? 1.15 : 0.7;
        for (let step = 0; step <= 92; step += 1) {
          const x = width * (0.1 + step / 92 * 0.8);
          const horizontal = step / 92;
          const fade = Math.min(1, horizontal * 8, (1 - horizontal) * 8);
          const central = Math.exp(-Math.pow((horizontal - 0.55) / 0.16, 2));
          const secondary = Math.exp(-Math.pow((horizontal - 0.31) / 0.1, 2)) * 0.62;
          const ripple = Math.exp(-Math.pow((horizontal - 0.76) / 0.12, 2)) * 0.42;
          const envelope = central + secondary + ripple;
          const wave = Math.sin(horizontal * 39 + index * 0.21 + time * 0.0012) * 0.5 + Math.sin(horizontal * 77 - index * 0.08) * 0.18;
          const travelling = thinking ? Math.sin(horizontal * 18 - time * 0.001) * 0.18 : 0;
          const displacement = (wave + travelling) * envelope * height * 0.34 * intensity * motion;
          const lineX = x;
          const lineY = y + displacement * (1 - Math.abs(vertical) * 0.25);
          if (step === 0) context.moveTo(lineX, lineY);
          else context.lineTo(lineX, lineY);
          context.globalAlpha = fade;
        }
        context.stroke();
        context.globalAlpha = 1;
      }

      if (active && !reducedRef.current) {
        context.fillStyle = accent;
        for (const particle of particles) {
          context.globalAlpha = particle.strength * (0.55 + intensity * 0.45);
          context.beginPath();
          context.arc(width * (0.1 + particle.x * 0.8), height * particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
      }

      if (!reducedRef.current || time < 100) frame = requestAnimationFrame(draw);
    };

    const resume = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      frame = requestAnimationFrame(draw);
    };
    const pause = () => cancelAnimationFrame(frame);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause();
      else resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    resume();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lineCount]);

  return (
    <div className={`iv-voice-agent iv-voice-agent-${state}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
