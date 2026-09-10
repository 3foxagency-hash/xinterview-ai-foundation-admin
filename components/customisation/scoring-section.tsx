'use client';

import * as React from 'react';
import { GripVertical, Plus, X, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/settings-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { getScoringLabels, saveScoringLabels } from '@/lib/api/jobs';
import type { ScoringLabelsInput, ScoringBand } from '@/lib/validation/job';
import { SCORING_BAND_COLOURS } from '@/lib/constants/scoring-band-colours';
import { track } from '@/lib/utils/analytics';

const NAME_MAX_LENGTH = 12;
const BAND_COLOURS: readonly string[] = SCORING_BAND_COLOURS;

function genId() {
  return `band_${Math.random().toString(36).slice(2, 10)}`;
}

function findOverlap(bands: ScoringBand[]): string | null {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].max > sorted[i + 1].min) {
      return `Ranges overlap: ${sorted[i].name} ends at ${sorted[i].max} but ${sorted[i + 1].name} starts at ${sorted[i + 1].min}`;
    }
    if (sorted[i].max < sorted[i + 1].min) {
      return `Gap between ${sorted[i].name} (ends ${sorted[i].max}) and ${sorted[i + 1].name} (starts ${sorted[i + 1].min})`;
    }
  }
  return null;
}

export function ScoringSection({
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
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getScoringLabels,
    saveScoringLabels,
    'scoring_labels_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('scoring', save);

  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const overlapError = findOverlap(data.bands);
  const sortedBands = [...data.bands].sort((a, b) => a.min - b.min);

  const addBand = () => {
    if (data.bands.length >= 5) return;

    const usedColours = new Set(data.bands.map((b) => b.colour.toUpperCase()));
    const colour = BAND_COLOURS.find((c) => !usedColours.has(c.toUpperCase())) ?? BAND_COLOURS[data.bands.length % BAND_COLOURS.length];

    const newBand: ScoringBand = { id: genId(), name: '', min: 0, max: 0, colour };

    // Existing bands keep their order (by current range) with the new band
    // appended at the end, then every band's range is spread evenly across
    // 0-100 — so a 3-band 0/40/70/100 split becomes a clean 0/25/50/75/100
    // 4-band split instead of leaving the new one squeezed at 100-100.
    const ordered = [...[...data.bands].sort((a, b) => a.min - b.min), newBand];
    const step = 100 / ordered.length;
    const bands = ordered.map((band, index) => ({
      ...band,
      min: Math.round(step * index),
      max: index === ordered.length - 1 ? 100 : Math.round(step * (index + 1)),
    }));

    update({ bands });
  };

  const updateBand = (id: string, patch: Partial<ScoringBand>) => {
    update({ bands: data.bands.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
    track('scoring_labels_updated', { bandId: id });
  };

  /**
   * Reorder by drag. A band *is* its score range, so moving one swaps the two
   * bands' ranges rather than shuffling array positions — otherwise the list
   * order and the numbers would disagree.
   */
  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const a = data.bands.find((b) => b.id === dragId);
    const b = data.bands.find((x) => x.id === targetId);
    if (!a || !b) return;
    update({
      bands: data.bands.map((x) =>
        x.id === a.id
          ? { ...x, min: b.min, max: b.max }
          : x.id === b.id
            ? { ...x, min: a.min, max: a.max }
            : x
      ),
    });
    track('scoring_labels_updated', { reordered: true });
  };

  const removeBand = (id: string) => {
    if (data.bands.length <= 2) return;
    update({ bands: data.bands.filter((b) => b.id !== id) });
  };

  const snapBand = (id: string, to: number, field: 'min' | 'max') => {
    update({ bands: data.bands.map((b) => (b.id === id ? { ...b, [field]: to } : b)) });
  };

  return (
    <div className="space-y-6">
      {/* Band preview */}
      <SettingsSection
        bordered={false}
        title="Scoring labels"
        description="Define the score bands candidates receive. Between 2 and 5 bands."
      >
        <div className="p-4">
          <p className="mb-3 text-body-sm font-medium text-heading">0–100 preview</p>
          <div className="flex h-10 w-full overflow-hidden rounded-md border border-border">
            {sortedBands.map((band) => (
              <div
                key={band.id}
                className="flex items-center justify-center text-caption font-medium text-white"
                style={{
                  backgroundColor: band.colour,
                  width: `${band.max - band.min}%`,
                }}
              >
                {band.name}
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-caption tabular-nums text-muted">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Band rows */}
        <div className="divide-y divide-border">
          {data.bands.map((band, index) => {
            // Check if this band has an overlap with adjacent bands
            const sorted = [...data.bands].sort((a, b) => a.min - b.min);
            const sortedIndex = sorted.findIndex((b) => b.id === band.id);
            const hasOverlap =
              (sortedIndex > 0 && band.min < sorted[sortedIndex - 1].max) ||
              (sortedIndex < sorted.length - 1 && band.max > sorted[sortedIndex + 1].min);

            return (
              <div
                key={band.id}
                draggable
                onDragStart={() => setDragId(band.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverId(band.id);
                }}
                onDragLeave={() => setOverId((o) => (o === band.id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  reorder(band.id);
                  setOverId(null);
                }}
                className={cn(
                  'p-4 transition-colors',
                  dragId === band.id && 'opacity-50',
                  overId === band.id && 'bg-card-hover'
                )}
              >
                <div className="flex flex-wrap items-end gap-3">
                  {/* Order */}
                  <div className="flex h-10 w-5 shrink-0 items-center justify-center">
                    <GripVertical
                      size={15}
                      className="cursor-grab text-muted active:cursor-grabbing"
                      aria-hidden
                    />
                  </div>
                  {/* Colour */}
                  <div>
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Colour</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Band ${index + 1} colour`}
                          className="h-10 w-12 cursor-pointer rounded-md border border-border"
                          style={{ backgroundColor: band.colour }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {BAND_COLOURS.map((colour) => (
                            <button
                              key={colour}
                              type="button"
                              onClick={() => updateBand(band.id, { colour })}
                              aria-label={`Use ${colour}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-transform hover:scale-105"
                              style={{ backgroundColor: colour }}
                            >
                              {band.colour.toUpperCase() === colour.toUpperCase() && (
                                <Check size={14} className="text-white" strokeWidth={3} />
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Name */}
                  <div className="flex-1">
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Name</Label>
                    <div className="relative">
                      <Input
                        value={band.name}
                        onChange={(e) => updateBand(band.id, { name: e.target.value })}
                        maxLength={NAME_MAX_LENGTH}
                        placeholder="e.g. Good"
                        className="h-10 pr-14"
                      />
                      <span
                        className={cn(
                          'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-caption tabular-nums',
                          band.name.length >= NAME_MAX_LENGTH ? 'font-medium text-error' : 'text-muted'
                        )}
                      >
                        {band.name.length}/{NAME_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                  {/* Min */}
                  <div>
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Min</Label>
                    <Input
                      type="number"
                      value={band.min}
                      onChange={(e) => updateBand(band.id, { min: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      className="h-10 w-20 tabular-nums"
                    />
                  </div>
                  {/* Max */}
                  <div>
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Max</Label>
                    <Input
                      type="number"
                      value={band.max}
                      onChange={(e) => updateBand(band.id, { max: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      className="h-10 w-20 tabular-nums"
                    />
                  </div>
                  {/* Remove */}
                  {data.bands.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeBand(band.id)}
                      aria-label="Remove band"
                      className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {hasOverlap && (
                  <div className="mt-2 flex items-center gap-2" role="alert">
                    <AlertCircle size={14} className="text-error" />
                    <span className="text-body-sm text-error">{overlapError}</span>
                    {sortedIndex > 0 && band.min < sorted[sortedIndex - 1].max && (
                      <button
                        type="button"
                        onClick={() => snapBand(band.id, sorted[sortedIndex - 1].max, 'min')}
                        className="ml-auto rounded-md border border-border-strong px-2 py-1 text-body-sm text-heading hover:bg-card-hover"
                      >
                        Snap to {sorted[sortedIndex - 1].max}
                      </button>
                    )}
                    {sortedIndex < sorted.length - 1 && band.max > sorted[sortedIndex + 1].min && (
                      <button
                        type="button"
                        onClick={() => snapBand(band.id, sorted[sortedIndex + 1].min, 'max')}
                        className="ml-auto rounded-md border border-border-strong px-2 py-1 text-body-sm text-heading hover:bg-card-hover"
                      >
                        Snap to {sorted[sortedIndex + 1].min}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {data.bands.length < 5 && (
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={addBand}
              className="flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              <Plus size={14} />
              Add band
            </button>
          </div>
        )}
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
