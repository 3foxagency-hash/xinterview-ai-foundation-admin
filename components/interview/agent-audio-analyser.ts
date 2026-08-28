'use client';

import * as React from 'react';

interface AgentAudioAnalyserProps {
  stream: MediaStream | null;
  active: boolean;
  reducedMotion: boolean;
  onAmplitude: (value: number) => void;
}

export function AgentAudioAnalyser({
  stream,
  active,
  reducedMotion,
  onAmplitude,
}: AgentAudioAnalyserProps) {
  const onAmplitudeRef = React.useRef(onAmplitude);
  onAmplitudeRef.current = onAmplitude;

  React.useEffect(() => {
    if (!stream || reducedMotion) {
      onAmplitudeRef.current(0.16);
      return;
    }

    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(stream);
    const data = new Uint8Array(analyser.fftSize);
    analyser.fftSize = 256;
    source.connect(analyser);
    void context.resume();
    let frame = 0;

    const measure = () => {
      if (!active) {
        onAmplitudeRef.current(0.12);
      } else {
        analyser.getByteTimeDomainData(data);
        let total = 0;
        for (const sample of data) total += Math.abs(sample - 128);
        onAmplitudeRef.current(Math.min(1, total / data.length / 26));
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void context.close();
      onAmplitudeRef.current(0.12);
    };
  }, [active, reducedMotion, stream]);

  return null;
}
