export type AnalyticsEvent =
  | 'company_details_updated'
  | 'team_member_invited'
  | 'invite_resent'
  | 'team_member_removed'
  | 'member_role_changed'
  | 'job_created'
  | 'interview_format_selected'
  | 'description_ai_generated'
  | 'question_added'
  | 'questions_ai_generated'
  | 'question_template_applied'
  | 'team_member_added'
  | 'team_member_removed'
  | 'candidate_invited'
  | 'candidates_bulk_invited'
  | 'bulk_invite_partial_failure'
  | 'branding_updated'
  | 'welcome_page_updated'
  | 'form_fields_updated'
  | 'notifications_updated'
  | 'integrity_settings_updated'
  | 'evaluation_factors_generated'
  | 'evaluation_factors_updated'
  | 'scoring_labels_updated'
  | 'voice_interview_started'
  | 'agent_connected'
  | 'agent_reconnecting'
  | 'turn_changed'
  | 'bargein_triggered'
  | 'silence_prompt_shown'
  | 'captions_enabled'
  | 'recording_chunk_uploaded'
  | 'recording_upload_failed'
  | 'connection_degraded'
  | 'interview_ended_early'
  | 'voice_interview_completed';

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof console !== 'undefined') {
    console.log(`[analytics] ${event}`, properties ?? {});
  }
}
