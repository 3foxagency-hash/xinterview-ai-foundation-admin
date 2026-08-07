'use client';

import * as React from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/settings-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { getScoringLabels, saveScoringLabels } from '@/lib/api/jobs';
import type { ScoringLabelsInput, ScoringBand } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

const BAND_COLOURS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6',
];

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

export default function ScoringLabelsPage() {
  const { data, loading, update } = useCustomisationSave(
    getScoringLabels,
    saveScoringLabels,
    'scoring_labels_updated'
  );

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const overlapError = findOverlap(data.bands);
  const sortedBands = [...data.bands].sort((a, b) => a.min - b.min);

  const addBand = () => {
    if (data.bands.length >= 5) return;
    const lastMax = Math.max(...data.bands.map((b) => b.max), 0);
    const newBand: ScoringBand = {
      id: genId(),
      name: '',
      min: lastMax,
      max: Math.min(lastMax + 20, 100),
      colour: BAND_COLOURS[data.bands.length % BAND_COLOURS.length],
    };
    update({ bands: [...data.bands, newBand] });
  };

  const updateBand = (id: string, patch: Partial<ScoringBand>) => {
    update({ bands: data.bands.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
    track('scoring_labels_updated', { bandId: id });
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
              <div key={band.id} className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  {/* Colour */}
                  <div>
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Colour</Label>
                    <input
                      type="color"
                      value={band.colour}
                      onChange={(e) => updateBand(band.id, { colour: e.target.value })}
                      aria-label={`Band ${index + 1} colour`}
                      className="h-10 w-12 cursor-pointer rounded-md border border-border bg-surface"
                    />
                  </div>
                  {/* Name */}
                  <div className="flex-1">
                    <Label className="mb-1.5 block text-body-sm font-semibold text-heading">Name</Label>
                    <Input
                      value={band.name}
                      onChange={(e) => updateBand(band.id, { name: e.target.value })}
                      maxLength={30}
                      placeholder="e.g. Good"
                      className="h-10"
                    />
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
    </div>
  );
}
