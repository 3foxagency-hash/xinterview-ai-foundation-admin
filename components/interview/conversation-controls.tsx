'use client';

import * as React from 'react';
import { LogOut, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface ConversationControlsProps {
  muted: boolean;
  volumeOn: boolean;
  disabled: boolean;
  onMute: () => void;
  onVolume: () => void;
  onEnd: () => void;
}

export function ConversationControls({ muted, volumeOn, disabled, onMute, onVolume, onEnd }: ConversationControlsProps) {
  return (
    <div className="iv-voice-controls" aria-label="Conversation controls">
      <button type="button" onClick={onMute} disabled={disabled} aria-pressed={muted}>
        {muted ? <MicOff size={18} strokeWidth={1.25} /> : <Mic size={18} strokeWidth={1.25} />}
        <span>{muted ? 'Unmute' : 'Mute'}</span>
      </button>
      <span className="iv-voice-control-divider" aria-hidden="true" />
      <button type="button" onClick={onVolume} disabled={disabled} aria-pressed={!volumeOn}>
        {volumeOn ? <Volume2 size={18} strokeWidth={1.25} /> : <VolumeX size={18} strokeWidth={1.25} />}
        <span>{volumeOn ? 'Volume' : 'Muted'}</span>
      </button>
      <span className="iv-voice-control-divider" aria-hidden="true" />
      <button type="button" onClick={onEnd} disabled={disabled}>
        <LogOut size={18} strokeWidth={1.25} />
        <span>End interview</span>
      </button>
    </div>
  );
}
