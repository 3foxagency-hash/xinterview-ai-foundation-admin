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
import { ConnectionCheckRow } from '@/components/interview/connection-check-row';
import { type DeviceOption } from '@/components/interview/device-selector';
import { HelpPanel } from '@/components/interview/help-panel';
import { strings } from '@/lib/interview/strings';
import {
  useConnectionSpeed,
  UPLOAD_REQUIRED_MBPS,
} from '@/lib/interview/use-connection-speed';
import {
  useCaptureOrientation,
  videoConstraintsFor,
} from '@/lib/interview/capture-orientation';
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

/* The homemade single-fetch speed probes that lived here (a 256KB
   download from /speed-test/probe.bin and a 256KB POST to
   /api/speed-test/upload) have been replaced by @cloudflare/speedtest
   via useConnectionSpeed — see lib/interview/use-connection-speed.ts.
   One short transfer could not saturate a slow link or see past
   connection setup on a fast one, so the figures it produced were not
   a dependable read of the connection. */

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
  const {
    status: connectionStatus,
    result: connection,
    start: startSpeedTest,
    cancel: cancelSpeedTest,
  } = useConnectionSpeed();
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

  const captureOrientation = useCaptureOrientation();

  const startStream = React.useCallback(
    async (videoId?: string, audioId?: string) => {
      try {
        // 2.7 — the preview here must match what we actually record:
        // portrait (9:16) on mobile, landscape (16:9) on desktop. This
        // page was still requesting an unconstrained `video: true`, so
        // the setup preview came back landscape on phones while the
        // practice/interview screens were portrait.
        const constraints: MediaStreamConstraints = {
          video: videoConstraintsFor(captureOrientation, videoId),
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
          // Devices are ready as soon as we have both tracks. The speed
          // test runs on its own (see the effect below) and must not
          // block this — awaiting it here made the whole setup page sit
          // on "Checking your setup" until the network test finished.
          setRealState('ready');
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
    [selectedCamera, selectedMic, captureOrientation],
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

  // 2.2a — the speed test runs independently of the device check, so it
  // never blocks the page. Started once the devices are confirmed.
  const speedTestStartedRef = React.useRef(false);
  React.useEffect(() => {
    if (forcedState) return;
    if (realState !== 'ready' && realState !== 'weak_connection') return;
    if (speedTestStartedRef.current) return;
    speedTestStartedRef.current = true;
    startSpeedTest();
  }, [forcedState, realState, startSpeedTest]);

  // A measured-weak upload escalates the page into its weak-connection
  // state (warning + audio-only offer). 'adequate' and 'failed' let the
  // candidate carry on — only a genuinely weak upload warrants the
  // interstitial.
  React.useEffect(() => {
    if (forcedState) return;
    if (connectionStatus === 'weak') {
      setRealState((prev) => (prev === 'ready' ? 'weak_connection' : prev));
    } else if (connectionStatus === 'strong' || connectionStatus === 'adequate') {
      setRealState((prev) => (prev === 'weak_connection' ? 'ready' : prev));
    }
  }, [connectionStatus, forcedState]);

  const handleTryAgain = () => {
    stopTracks();
    speedTestStartedRef.current = false;
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

  // forcedState previews a weak connection from the dev panel without an
  // actual slow network to measure — show a plausible mock reading rather
  // than the real (likely fast) numbers this machine actually measured.
  const isForcedWeak = !!forcedState && state === 'weak_connection';

  // Row status comes from the measurement itself (2.2a): it keeps
  // showing "measuring" while the test runs, so the page never
  // displays a frozen 0 Mbps, and reports a distinct failed state.
  const connectionRowStatus: CheckStatus = isForcedWeak
    ? 'warning'
    : connectionStatus === 'measuring' || connectionStatus === 'idle'
      ? 'checking'
      : connectionStatus === 'weak' || connectionStatus === 'failed'
        ? 'warning'
        : 'passed';

  const displayUploadSpeed = isForcedWeak ? 0.8 : connection.uploadMbps;
  const displayDownloadSpeed = isForcedWeak ? 3.2 : connection.downloadMbps;

  const connectionSecondary = isForcedWeak
    ? strings.setupConnectionWeak
    : connectionStatus === 'failed'
      ? strings.setupConnectionFailedBody
      : connectionStatus === 'weak'
        ? strings.setupConnectionWeak
        : connectionStatus === 'adequate'
          ? strings.setupConnectionAdequate
          // No message on a strong connection (#3) — "Your answers will
          // upload smoothly" only added height without telling the
          // candidate anything the badge doesn't already say.
          : undefined;

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

                <ConnectionCheckRow
                  status={connectionRowStatus}
                  tier={isForcedWeak ? 'weak' : connectionStatus}
                  uploadMbps={displayUploadSpeed}
                  downloadMbps={displayDownloadSpeed}
                  latencyMs={isForcedWeak ? 120 : connection.latencyMs}
                  jitterMs={isForcedWeak ? 40 : connection.jitterMs}
                  requiredUploadMbps={UPLOAD_REQUIRED_MBPS}
                  onRetry={startSpeedTest}
                  onCancel={cancelSpeedTest}
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
