import { describe, expect, it } from 'vitest';
import { VOLUME_META, careerEntryVolume, volumeLabel } from '../src/volume-meta';

describe('生涯档案分卷口径', () => {
  it('卷八元数据为薪火', () => {
    expect(VOLUME_META[8]).toBe('卷八 · 薪火');
    expect(volumeLabel(8)).toBe('卷八 · 薪火');
  });

  it('一周目 2026-2027 薪火章节归卷八', () => {
    expect(careerEntryVolume({ date: '2026-01-16', title: '薪火一：师父的最后一份教案' })).toBe(8);
    expect(careerEntryVolume({ date: '2027-04-16', title: '薪火八：薪火终章' })).toBe(8);
  });

  it('卷七、卷八和卷六标题优先于年份', () => {
    expect(careerEntryVolume({ date: '2026-01-19', title: '记忆残响：来客' })).toBe(7);
    expect(careerEntryVolume({ date: '2025-12-20', title: '彩蛋十四：万家灯火' })).toBe(6);
    expect(careerEntryVolume({ date: '2024-09-24', title: '九二四' })).toBe(5);
  });
});
