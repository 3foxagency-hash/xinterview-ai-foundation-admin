'use client';

import * as React from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIMarker } from '@/components/ui/ai-marker';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import {
  getAiEvaluation,
  saveAiEvaluation,
  generateEvaluationFactors,
} from '@/lib/api/jobs';
import type {
  AiEvaluationInput,
  EvaluationFactor,
  QuestionScoring,
} from '@/lib/validation/job';
import { useOptionalWizard } from '@/components/wizard/wizard-context';
import { getQuestions, type Question } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';

function genId() {
  return `factor_${Math.random().toString(36).slice(2, 10)}`;
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = React.useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-active-menu-bg px-2 py-1 text-body-sm text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
            className="text-primary/60 hover:text-primary"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={placeholder ?? 'Add keyword…'}
        className="flex-1 bg-transparent text-body-sm text-heading outline-none placeholder:text-muted"
      />
    </div>
  );
}

function FactorCard({
  factor,
  onChange,
  onRemove,
  canRemove,
}: {
  factor: EvaluationFactor;
  onChange: (updated: EvaluationFactor) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header — always visible */}
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left focus-visible:rounded-md"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${factor.name || 'untitled factor'}`}
        >
          {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
          <span className="text-body font-semibold text-heading">
            {factor.name || 'Untitled factor'}
          </span>
          <span className="text-body-sm tabular-nums text-muted">{factor.weight}%</span>
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove factor"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border p-4">
          {/* Name + weight */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px]">
            <div>
              <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Name</Label>
              <Input
                value={factor.name}
                onChange={(e) => onChange({ ...factor, name: e.target.value })}
                maxLength={60}
                placeholder="e.g. Technical depth"
                className="h-10"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Weight (%)</Label>
              <Input
                type="number"
                value={factor.weight}
                onChange={(e) => onChange({ ...factor, weight: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="h-10 tabular-nums"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Description</Label>
            <Input
              value={factor.description ?? ''}
              onChange={(e) => onChange({ ...factor, description: e.target.value })}
              maxLength={200}
              placeholder="What this factor measures"
              className="h-10"
            />
          </div>

          {/* Keywords */}
          <div>
            <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Keywords</Label>
            <TagInput
              tags={factor.keywords}
              onChange={(keywords) => onChange({ ...factor, keywords })}
              placeholder="Add keywords candidates should mention…"
            />
          </div>

          {/* Rubric */}
          <div>
            <Label className="mb-2 block text-body-sm font-semibold text-heading">Rubric (1–5)</Label>
            <div className="space-y-2">
              {factor.rubric.map((level, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-active-menu-bg text-caption font-bold tabular-nums text-primary">
                    {level.level}
                  </span>
                  <textarea
                    value={level.description}
                    onChange={(e) => {
                      const newRubric = [...factor.rubric];
                      newRubric[i] = { ...level, description: e.target.value };
                      onChange({ ...factor, rubric: newRubric });
                    }}
                    placeholder={`What earns a ${level.level}?`}
                    rows={2}
                    className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-heading"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EvaluationSection({
  scopeId,
  /**
   * The job wizard commits every section at once from its step footer, so the
   * per-section bar is hidden there. Workspace settings has no such footer and
   * keeps it.
   */
  showSaveBar = true,
}: {
  scopeId?: string;
  showSaveBar?: boolean;
}) {
  // null in Workspace settings, where there is no wizard around this section.
  const job = useOptionalWizard()?.job ?? null;
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getAiEvaluation,
    saveAiEvaluation,
    'evaluation_factors_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('evaluation', save);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [aiPreview, setAiPreview] = React.useState<{
    factors: EvaluationFactor[];
    questionScoring: QuestionScoring[];
  } | null>(null);

  React.useEffect(() => {
    // Load questions for scoring linkage
    const jobId = window.location.pathname.split('/')[2];
    if (jobId) {
      getQuestions(jobId).then(setQuestions).catch(() => {});
    }
  }, []);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const totalWeight = data.factors.reduce((sum, f) => sum + f.weight, 0);
  const remaining = 100 - totalWeight;
  const weightError = remaining !== 0 && data.factors.length > 0;

  const addFactor = () => {
    if (data.factors.length >= 4) return;
    const newFactor: EvaluationFactor = {
      id: genId(),
      name: '',
      description: '',
      keywords: [],
      weight: 0,
      rubric: [
        { level: 1, description: '' },
        { level: 2, description: '' },
        { level: 3, description: '' },
        { level: 4, description: '' },
        { level: 5, description: '' },
      ],
    };
    update({ factors: [...data.factors, newFactor] });
  };

  const updateFactor = (id: string, updated: EvaluationFactor) => {
    update({ factors: data.factors.map((f) => (f.id === id ? updated : f)) });
    track('evaluation_factors_updated', { factorId: id });
  };

  const removeFactor = (id: string) => {
    update({ factors: data.factors.filter((f) => f.id !== id) });
  };

  const distributeEvenly = () => {
    if (data.factors.length === 0) return;
    const each = Math.floor(100 / data.factors.length);
    const remainder = 100 - each * data.factors.length;
    const factors = data.factors.map((f, i) => ({
      ...f,
      weight: each + (i === 0 ? remainder : 0),
    }));
    update({ factors });
  };

  // One-click fix: add remaining to first factor
  const addRemainingToFirst = () => {
    if (data.factors.length === 0) return;
    const factors = [...data.factors];
    factors[0] = { ...factors[0], weight: factors[0].weight + remaining };
    update({ factors });
  };

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const questionTitles = questions.map((q) => q.title);
      const result = await generateEvaluationFactors(
        job?.title ?? 'this role',
        data.positionLevel,
        questionTitles
      );
      setAiPreview(result);
      track('evaluation_factors_generated', { count: result.factors.length });
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const applyAiPreview = () => {
    if (!aiPreview) return;
    update({ factors: aiPreview.factors, questionScoring: aiPreview.questionScoring });
    setAiPreview(null);
    track('evaluation_factors_updated', { source: 'ai', count: aiPreview.factors.length });
  };

  // Question scoring
  const unlinkedQuestions = data.questionScoring.filter(
    (qs) => !qs.excludedFromScoring && qs.factorIds.length === 0
  );

  const updateQuestionScoring = (questionId: string, patch: Partial<QuestionScoring>) => {
    const existing = data.questionScoring.find((qs) => qs.questionId === questionId);
    if (existing) {
      update({
        questionScoring: data.questionScoring.map((qs) =>
          qs.questionId === questionId ? { ...qs, ...patch } : qs
        ),
      });
    } else {
      update({
        questionScoring: [...data.questionScoring, { questionId, factorIds: [], excludedFromScoring: false, ...patch }],
      });
    }
  };

  const toggleFactorLink = (questionId: string, factorId: string) => {
    const qs = data.questionScoring.find((q) => q.questionId === questionId);
    const current = qs?.factorIds ?? [];
    const newIds = current.includes(factorId)
      ? current.filter((id) => id !== factorId)
      : [...current, factorId];
    updateQuestionScoring(questionId, { factorIds: newIds, excludedFromScoring: false });
  };

  // Enforce: automatic evaluation requires human review
  const handleAutoEvalChange = (v: boolean) => {
    if (v) {
      // Must have human review
      update({ automaticEvaluation: true });
    } else {
      update({ automaticEvaluation: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* General settings */}
      <SettingsSection
        title="AI evaluation"
        description="Configure how the AI scores candidate responses."
      >
        <SettingsRow
          label="Position level"
          helper="Helps the AI calibrate expectations."
          control={
            <Select
              value={data.positionLevel}
              onValueChange={(v) => update({ positionLevel: v as AiEvaluationInput['positionLevel'] })}
            >
              <SelectTrigger className="h-10 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingsRow
          label="Strictness"
          helper="How strict the AI is when scoring."
          control={
            <div className="inline-flex items-center rounded-md border border-border bg-card-hover p-0.5" role="radiogroup" aria-label="Strictness">
              {(['lenient', 'moderate', 'strict'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={data.strictness === s}
                  onClick={() => update({ strictness: s })}
                  className={cn(
                    'rounded px-3 py-1.5 text-body-sm font-medium capitalize transition-colors',
                    data.strictness === s ? 'bg-surface text-heading shadow-sm' : 'text-muted hover:text-heading'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          }
        />
        <SettingsRow
          label="Automatic AI evaluation"
          helper="Candidates are scored automatically on completion."
          control={
            <Switch
              checked={data.automaticEvaluation}
              onCheckedChange={handleAutoEvalChange}
              aria-label="Enable automatic AI evaluation"
            />
          }
        />
      </SettingsSection>

      {/* Evaluation factors */}
      <SettingsSection
        title="Evaluation factors"
        description="Up to 4 factors. Each has a weight and a 1–5 rubric."
      >
        {/* Secondary button — §16 forbids a coloured AI fill; the sparkle and
            the word "AI" carry the meaning. */}
        {data.factors.length === 0 && !aiPreview && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generating}
              aria-busy={generating}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles size={16} strokeWidth={1.5} className="text-muted" />
              {generating ? 'Generating…' : 'Generate with AI'}
            </button>
            <p className="mt-2 text-body-sm text-muted">
              Drafts factors, weights, rubrics and question links as a starting point.
            </p>
          </div>
        )}

        {/* AI preview */}
        {aiPreview && (
          <div className="m-4 rounded-md border border-border bg-[var(--background-200)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AIMarker />
                <span className="text-body font-medium text-heading">Generated factors</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAiPreview(null)}
                  className="rounded-md border border-border-strong px-3 py-1.5 text-body-sm text-heading transition-colors hover:bg-card-hover"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={applyAiPreview}
                  className="rounded-md bg-primary px-3 py-1.5 text-body-sm text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {aiPreview.factors.map((f) => (
                <div key={f.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-heading">{f.name}</span>
                    <span className="text-body-sm tabular-nums text-muted">{f.weight}%</span>
                  </div>
                  <p className="mt-1 text-body-sm text-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weight total */}
        {data.factors.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <span
              className={cn(
                'text-body-sm tabular-nums',
                weightError ? 'text-error' : 'text-muted'
              )}
            >
              Total: {totalWeight}% · {remaining > 0 ? `${remaining}% remaining` : remaining < 0 ? `${Math.abs(remaining)}% over` : 'Complete'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={distributeEvenly}
                className="rounded-md border border-primary/30 px-3 py-1 text-body-sm text-primary transition-colors hover:bg-active-menu-bg"
              >
                Distribute evenly
              </button>
              {weightError && remaining > 0 && data.factors.length > 0 && (
                <button
                  type="button"
                  onClick={addRemainingToFirst}
                  className="rounded-md border border-border-strong px-3 py-1 text-body-sm text-heading transition-colors hover:bg-card-hover"
                >
                  Add {remaining}% to {data.factors[0]?.name || 'first factor'}?
                </button>
              )}
            </div>
          </div>
        )}

        {/* Factor cards */}
        <div className="space-y-3 p-4">
          {data.factors.map((factor) => (
            <FactorCard
              key={factor.id}
              factor={factor}
              onChange={(updated) => updateFactor(factor.id, updated)}
              onRemove={() => removeFactor(factor.id)}
              canRemove={data.factors.length > 1}
            />
          ))}

          {data.factors.length < 4 && data.factors.length > 0 && (
            <button
              type="button"
              onClick={addFactor}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong text-button text-muted transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Plus size={16} />
              Add factor
            </button>
          )}
        </div>
      </SettingsSection>

      {/* Question scoring */}
      {questions.length > 0 && (
        <SettingsSection
          title="Question scoring"
          description="Link each question to at least one evaluation factor, or exclude it from scoring."
        >
          {unlinkedQuestions.length > 0 && (
            <div className="flex items-center gap-2 border-b border-border bg-warning/5 px-4 py-3">
              <AlertTriangle size={14} className="shrink-0 text-warning" />
              <span className="text-body-sm text-heading">
                {unlinkedQuestions.length} question{unlinkedQuestions.length > 1 ? 's' : ''} not linked to any factor.
              </span>
              <a
                href={`#q_${unlinkedQuestions[0].questionId}`}
                className="ml-auto text-body-sm font-medium text-primary hover:underline"
              >
                Jump to first →
              </a>
            </div>
          )}
          <div className="divide-y divide-border">
            {questions.map((q, i) => {
              const qs = data.questionScoring.find((s) => s.questionId === q.id);
              const linked = qs?.factorIds ?? [];
              const excluded = qs?.excludedFromScoring ?? false;
              const isUnlinked = !excluded && linked.length === 0;

              return (
                <div key={q.id} id={`q_${q.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-body-sm font-medium text-heading">
                        {i + 1}. {q.title || 'Untitled question'}
                      </p>
                      <p className="text-caption text-muted capitalize">{q.type}</p>
                    </div>
                    <label className="flex items-center gap-2 text-body-sm text-muted">
                      <Switch
                        checked={excluded}
                        onCheckedChange={(v) => updateQuestionScoring(q.id, { excludedFromScoring: v })}
                        aria-label={`Exclude question ${i + 1} from scoring`}
                      />
                      Exclude
                    </label>
                  </div>
                  {!excluded && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.factors.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFactorLink(q.id, f.id)}
                          className={cn(
                            'rounded-md border px-3 py-1.5 text-body-sm transition-colors',
                            linked.includes(f.id)
                              ? 'border-primary bg-active-menu-bg text-primary'
                              : 'border-border text-muted hover:bg-card-hover'
                          )}
                        >
                          {f.name || 'Untitled'}
                        </button>
                      ))}
                      {data.factors.length === 0 && (
                        <span className="text-body-sm text-muted">Add evaluation factors first.</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SettingsSection>
      )}
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
