'use client';

import * as React from 'react';
import { ArrowRight, TriangleAlert as AlertTriangle } from 'lucide-react';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { CameraPreview, type SetupState } from '@/components/interview/camera-preview';
import { MicLevelMeter } from '@/components/interview/mic-level-meter';
import { DeviceCheckRow, type CheckStatus } from '@/components/interview/device-check-row';
import { type DeviceOption } from '@/components/interview/device-selector';
import { HelpPanel } from '@/components/interview/help-panel';
import { strings } from '@/lib/interview/strings';
import type { InterviewConfig } from '@/config/interview.mock';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

interface SetupScreenProps {
  config?: InterviewConfig;
  forcedState?: SetupState;
  onBeginInterview?: () => void;
  onTryPractice?: () => void;
}

type RealState =
  | 'checking'
  | 'ready'
  | 'denied'
  | 'no_device'
  | 'weak_connection';

function getCameras(devices: MediaDeviceInfo[]): DeviceOption[] {
  return devices
    .filter((d) => d.kind === 'videoinput')
    .map((d, i) => ({
      deviceId: d.deviceId || `cam-${i}`,
      label: d.label || `${strings.setupDefaultCamera} ${i + 1}`,
    }));
}

function getMics(devices: MediaDeviceInfo[]): DeviceOption[] {
  return devices
    .filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({
      deviceId: d.deviceId || `mic-${i}`,
      label: d.label || `${strings.setupDefaultMic} ${i + 1}`,
    }));
}

const SPEED_TEST_URL = '/speed-test/probe.bin';
const SPEED_TEST_BYTES = 256 * 1024;

/**
 * Measures real downlink throughput by timing a fetch of a fixed-size,
 * incompressible payload — works in every browser (unlike the Network
 * Information API, which is Chrome/Edge only) and reflects the connection
 * right now rather than a cached OS-level estimate. A cache-busting query
 * param keeps the browser/CDN from serving a free instant "download".
 */
async function measureConnectionSpeed(): Promise<number | null> {
  try {
    const start = performance.now();
    const res = await fetch(`${SPEED_TEST_URL}?cb=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    await res.arrayBuffer();
    const seconds = (performance.now() - start) / 1000;
    if (seconds <= 0) return null;
    const mbps = (SPEED_TEST_BYTES * 8) / seconds / 1_000_000;
    return Math.round(mbps * 10) / 10;
  } catch {
    return null;
  }
}

export function SetupScreen({
  config = defaultConfig,
  forcedState,
  onBeginInterview,
  onTryPractice,
}: SetupScreenProps) {
  const [realState, setRealState] = React.useState<RealState>('checking');
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [cameras, setCameras] = React.useState<DeviceOption[]>([]);
  const [mics, setMics] = React.useState<DeviceOption[]>([]);
  const [selectedCamera, setSelectedCamera] = React.useState('');
  const [selectedMic, setSelectedMic] = React.useState('');
  const [connectionSpeed, setConnectionSpeed] = React.useState<number | null>(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const streamRef = React.useRef<MediaStream | null>(null);

  const state: RealState = forcedState ?? realState;

  const stopTracks = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startStream = React.useCallback(
    async (videoId?: string, audioId?: string) => {
      try {
        const constraints: MediaStreamConstraints = {
          video: videoId ? { deviceId: { exact: videoId } } : true,
          audio: audioId ? { deviceId: { exact: audioId } } : true,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const camList = getCameras(devices);
        const micList = getMics(devices);
        setCameras(camList);
        setMics(micList);

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];

        if (!videoTrack && !audioTrack) {
          setRealState('no_device');
        } else if (!videoTrack) {
          setRealState('no_device');
        } else if (!audioTrack) {
          setRealState('no_device');
        } else {
          const speed = await measureConnectionSpeed();
          setConnectionSpeed(speed);
          if (speed !== null && speed < 5) {
            setRealState('weak_connection');
          } else {
            setRealState('ready');
          }
        }

        if (videoTrack && !selectedCamera) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) setSelectedCamera(settings.deviceId);
          else if (camList[0]) setSelectedCamera(camList[0].deviceId);
        }
        if (audioTrack && !selectedMic) {
          const settings = audioTrack.getSettings();
          if (settings.deviceId) setSelectedMic(settings.deviceId);
          else if (micList[0]) setSelectedMic(micList[0].deviceId);
        }
      } catch (err) {
        const name = (err as Error).name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setRealState('denied');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setRealState('no_device');
        } else {
          setRealState('denied');
        }
      }
    },
    [selectedCamera, selectedMic],
  );

  React.useEffect(() => {
    if (forcedState) {
      if (forcedState !== 'ready' && forcedState !== 'weak_connection') {
        stopTracks();
      }
      return;
    }
    startStream();
    return () => stopTracks();
  }, [forcedState, startStream, stopTracks]);

  React.useEffect(() => {
    return () => stopTracks();
  }, [stopTracks]);

  const handleTryAgain = () => {
    stopTracks();
    setRealState('checking');
    setCameras([]);
    setMics([]);
    setSelectedCamera('');
    setSelectedMic('');
    if (!forcedState) {
      startStream();
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (forcedState) return;
    stopTracks();
    startStream(deviceId, selectedMic || undefined);
  };

  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId);
    if (forcedState) return;
    stopTracks();
    startStream(selectedCamera || undefined, deviceId);
  };

  const showVideo =
    state === 'ready' || state === 'weak_connection';
  const showMicMeter = showVideo && stream !== null;
  const blocked = state === 'denied' || state === 'no_device';
  const actionsDisabled = state === 'checking' || blocked;

  const headingText: Record<RealState, string> = {
    checking: strings.setupCheckingHeading,
    ready: strings.setupReadyHeading,
    denied: strings.setupDeniedHeading,
    no_device: strings.setupNoDeviceHeading,
    weak_connection: strings.setupWeakConnectionHeading,
  };

  const ctaLabel: Record<RealState, string> = {
    checking: strings.setupCtaBegin,
    ready: strings.setupCtaBegin,
    denied: strings.setupCtaTryAgain,
    no_device: strings.setupCtaTryAgain,
    weak_connection: strings.setupCtaContinueAnyway,
  };

  const cameraStatus: CheckStatus =
    state === 'checking' ? 'checking' :
    state === 'no_device' ? 'warning' :
    'passed';

  const micStatus: CheckStatus =
    state === 'checking' ? 'checking' :
    state === 'no_device' ? 'warning' :
    'passed';

  const connectionStatus: CheckStatus =
    state === 'checking' ? 'checking' :
    state === 'weak_connection' ? 'warning' :
    'passed';

  const connectionText =
    state === 'checking' ? strings.setupCheckingLabel :
    state === 'weak_connection' ? strings.setupConnectionWeakResult(connectionSpeed ?? 2) :
    connectionSpeed !== null ? strings.setupConnectionStrong(connectionSpeed) :
    strings.setupConnectionUnknown;

  const connectionSecondary =
    state === 'weak_connection' ? strings.setupConnectionWeak :
    state === 'checking' ? undefined :
    strings.setupConnectionStable;

  const ctaClick = blocked ? handleTryAgain : onBeginInterview;

  return (
    <>
      <InterviewThemeScript
        themeMode={config.company.themeMode}
        allowCandidateToggle={config.company.allowCandidateToggle}
      />
      <InterviewThemeProvider
        brandColor={config.company.brandColor}
        themeMode={config.company.themeMode}
        allowCandidateToggle={config.company.allowCandidateToggle}
      >
        <AmbientLight />
        <TopBar config={config} />

        <div className="iv-setup-grid">
          {/* Left column — camera preview */}
          <div className="iv-setup-left">
            <div className="iv-setup-eyebrow">
              <span className="iv-brand-mark iv-brand-mark-sm" aria-hidden="true">
                {config.company.name.charAt(0).toUpperCase()}
              </span>
              <span className="iv-micro-label">
                {strings.setupEyebrow(config.company.name)}
              </span>
            </div>

            <h2 className="iv-setup-heading">{strings.setupHeading}</h2>
            <p className="iv-setup-subtext">{strings.setupSubtext}</p>

            <CameraPreview stream={showVideo ? stream : null} state={state} />

            <MicLevelMeter
              stream={showMicMeter ? stream : null}
              active={showMicMeter}
            />
          </div>

          {/* Right column — status and actions */}
          <div className="iv-setup-right">
            <div className="iv-plane iv-setup-panel">
              <span className="iv-micro-label">{strings.setupMicroLabel}</span>
              <h2 className="iv-form-heading" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
                {headingText[state]}
              </h2>

              <div className="iv-check-rows">
                <DeviceCheckRow
                  label={strings.setupCameraLabel}
                  status={cameraStatus}
                  ariaLabel={strings.setupCameraSelectLabel}
                  selectorOptions={cameras}
                  selectorValue={selectedCamera}
                  onSelectorChange={handleCameraChange}
                  selectorDisabled={state === 'checking' || state === 'no_device'}
                  secondaryText={cameraStatus === 'passed' ? strings.setupDeviceReady : undefined}
                />

                <DeviceCheckRow
                  label={strings.setupMicrophoneLabel}
                  status={micStatus}
                  ariaLabel={strings.setupMicSelectLabel}
                  selectorOptions={mics}
                  selectorValue={selectedMic}
                  onSelectorChange={handleMicChange}
                  selectorDisabled={state === 'checking' || state === 'no_device'}
                  secondaryText={micStatus === 'passed' ? strings.setupDeviceReady : undefined}
                />

                <DeviceCheckRow
                  label={strings.setupConnectionLabel}
                  status={connectionStatus}
                  ariaLabel={strings.setupConnectionLabel}
                  valueText={connectionText}
                  secondaryText={connectionSecondary}
                />
              </div>

              <hr className="iv-hairline" style={{ margin: '24px 0 0 0' }} />

              {/* CTA */}
              <div className="iv-cta-wrap iv-setup-cta-wrap">
                <button
                  type="button"
                  className="iv-cta"
                  disabled={actionsDisabled}
                  onClick={ctaClick}
                  aria-busy={state === 'checking'}
                >
                  {ctaLabel[state]}
                  <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
                </button>
                {!actionsDisabled && <div className="iv-cta-bloom" aria-hidden="true" />}
              </div>

              {/* Secondary action */}
              <button
                type="button"
                className="iv-setup-practice-btn"
                disabled={actionsDisabled}
                onClick={onTryPractice}
              >
                {strings.setupPracticeLink}
              </button>

              {/* Meta row */}
              <div className="iv-setup-meta">
                {strings.metaQuestions(config.job.questionCount).toUpperCase()} ·{' '}
                {strings.metaEstimated(config.job.estimatedMinutes).toUpperCase()} ·{' '}
                RETAKES ALLOWED
              </div>

              {/* Denied — help link */}
              {state === 'denied' && (
                <button
                  type="button"
                  className="iv-setup-secondary-link"
                  onClick={() => setHelpOpen(true)}
                  style={{ marginTop: '12px' }}
                >
                  {strings.setupHelpLink}
                </button>
              )}

              {/* Weak connection warning */}
              {state === 'weak_connection' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  <AlertTriangle
                    size={14}
                    strokeWidth={1.5}
                    className="iv-check-icon-warning"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span className="iv-check-value-secondary">
                    {strings.setupConnectionWeak}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      </InterviewThemeProvider>
    </>
  );
}
