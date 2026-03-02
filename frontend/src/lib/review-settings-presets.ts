import type { ReviewSettings } from '../types';

export type ReviewSettingsPayload = Pick<
  ReviewSettings,
  'baseIntervals' | 'perfectMultiplier' | 'goodMultiplier' | 'regularMultiplier' | 'badReset'
>;

export type ReviewSettingsPresetId = 'relajado' | 'normal' | 'intensivo' | 'custom';

type ReviewSettingsPreset = {
  id: Exclude<ReviewSettingsPresetId, 'custom'>;
  label: string;
  description: string;
  settings: ReviewSettingsPayload;
};

const FLOAT_TOLERANCE = 0.0001;

export const REVIEW_SETTINGS_PRESETS: ReviewSettingsPreset[] = [
  {
    id: 'relajado',
    label: 'Relajado',
    description: 'Mas margen entre repasos para un ritmo ligero.',
    settings: {
      baseIntervals: [2, 10, 35, 120],
      perfectMultiplier: 2.8,
      goodMultiplier: 2.2,
      regularMultiplier: 1.3,
      badReset: false,
    },
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Balanceado para estudio continuo sin sobrecarga.',
    settings: {
      baseIntervals: [1, 7, 30, 90],
      perfectMultiplier: 2.5,
      goodMultiplier: 2,
      regularMultiplier: 1.2,
      badReset: true,
    },
  },
  {
    id: 'intensivo',
    label: 'Intensivo',
    description: 'Ciclos mas cortos para consolidar mas rapido.',
    settings: {
      baseIntervals: [1, 3, 7, 21],
      perfectMultiplier: 2.1,
      goodMultiplier: 1.7,
      regularMultiplier: 1.1,
      badReset: true,
    },
  },
];

export function getReviewSettingsPresetLabel(presetId: ReviewSettingsPresetId): string {
  if (presetId === 'custom') {
    return 'Personalizado';
  }

  return REVIEW_SETTINGS_PRESETS.find((preset) => preset.id === presetId)?.label ?? 'Normal';
}

export function getPresetSettings(presetId: Exclude<ReviewSettingsPresetId, 'custom'>): ReviewSettingsPayload {
  const preset = REVIEW_SETTINGS_PRESETS.find((item) => item.id === presetId);

  if (!preset) {
    return { ...REVIEW_SETTINGS_PRESETS[1].settings };
  }

  return {
    ...preset.settings,
    baseIntervals: [...preset.settings.baseIntervals],
  };
}

export function detectReviewSettingsPreset(settings: ReviewSettingsPayload): ReviewSettingsPresetId {
  const matched = REVIEW_SETTINGS_PRESETS.find((preset) =>
    areReviewSettingsEqual(settings, preset.settings),
  );

  return matched?.id ?? 'custom';
}

export function areReviewSettingsEqual(a: ReviewSettingsPayload, b: ReviewSettingsPayload): boolean {
  return (
    arraysEqual(a.baseIntervals, b.baseIntervals) &&
    floatEqual(a.perfectMultiplier, b.perfectMultiplier) &&
    floatEqual(a.goodMultiplier, b.goodMultiplier) &&
    floatEqual(a.regularMultiplier, b.regularMultiplier) &&
    a.badReset === b.badReset
  );
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function floatEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < FLOAT_TOLERANCE;
}
