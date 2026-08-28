'use client';

import * as React from 'react';
import { track } from '@/lib/utils/analytics';

interface SessionRecorderProps {
  stream: MediaStream | null;
  enabled: boolean;
  forceFailure: boolean;
  onFailure: () => void;
}

export function SessionRecorder({ stream, enabled, forceFailure, onFailure }: SessionRecorderProps) {
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const failedRef = React.useRef(false);

  React.useEffect(() => {
    if (!stream || !enabled || typeof MediaRecorder === 'undefined') return;
    let disposed = false;
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event: BlobEvent) => {
      if (!event.data.size || disposed) return;
      chunksRef.current.push(event.data);
      if (forceFailure) {
        if (!failedRef.current) {
          failedRef.current = true;
          track('recording_upload_failed');
          onFailure();
        }
        return;
      }
      window.setTimeout(() => {
        if (disposed) return;
        chunksRef.current.shift();
        track('recording_chunk_uploaded');
      }, 120);
    };
    recorder.onerror = () => {
      if (!failedRef.current) {
        failedRef.current = true;
        track('recording_upload_failed');
        onFailure();
      }
    };
    recorder.start(4000);
    return () => {
      disposed = true;
      if (recorder.state !== 'inactive') recorder.stop();
      recorderRef.current = null;
    };
  }, [enabled, forceFailure, onFailure, stream]);

  return null;
}
