import { describe, expect, it } from 'vitest';
import {
  REVIEW_SETTINGS_PRESETS,
  areReviewSettingsEqual,
  detectReviewSettingsPreset,
  getPresetSettings,
  getReviewSettingsPresetLabel,
} from './review-settings-presets';

describe('review settings preset mapping', () => {
  it('maps known presets from raw backend values', () => {
    const relaxed = getPresetSettings('relajado');
    const normal = getPresetSettings('normal');
    const intensive = getPresetSettings('intensivo');

    expect(detectReviewSettingsPreset(relaxed)).toBe('relajado');
    expect(detectReviewSettingsPreset(normal)).toBe('normal');
    expect(detectReviewSettingsPreset(intensive)).toBe('intensivo');
  });

  it('falls back to custom for non-preset combinations', () => {
    const custom = {
      ...getPresetSettings('normal'),
      baseIntervals: [1, 5, 30, 90],
    };

    expect(detectReviewSettingsPreset(custom)).toBe('custom');
  });

  it('returns readable labels and stable payload clones', () => {
    const normal = getPresetSettings('normal');
    normal.baseIntervals.push(400);

    expect(getReviewSettingsPresetLabel('normal')).toBe('Normal');
    expect(getReviewSettingsPresetLabel('custom')).toBe('Personalizado');
    expect(getPresetSettings('normal').baseIntervals).toEqual([1, 7, 30, 90]);
  });

  it('compares floating point values with tolerance', () => {
    const base = REVIEW_SETTINGS_PRESETS[1].settings;
    const close = {
      ...base,
      perfectMultiplier: base.perfectMultiplier + 0.00001,
    };

    expect(areReviewSettingsEqual(base, close)).toBe(true);
  });
});
