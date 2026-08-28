export type AvatarQualityTier = 'full' | 'reduced' | 'audio_only';

export type AvatarFailure =
  | 'none'
  | 'stream_stall'
  | 'audio_drop'
  | 'provider_unavailable'
  | 'mic_revoked'
  | 'unsupported_browser'
  | 'recording_upload_failure';
