export type VoiceTurnState =
  | 'agent_speaking'
  | 'candidate_speaking'
  | 'agent_thinking'
  | 'connecting';

export type VoiceFailure =
  | 'none'
  | 'agent_disconnect'
  | 'unstable_connection'
  | 'mic_revoked'
  | 'unsupported_browser'
  | 'recording_upload_failure';
