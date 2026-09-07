import { describe, it, expect } from 'vitest';
import { GameCalendar, MarketSim, validateContent } from '../src/index';
import { contentBundle, eraDrift, eraLevel } from '../../../content/src/index';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

function runFull(seed: number) {
  const sim = new MarketSim(contentBundle.factors, contentBundle.industries, contentBundle.events, contentBundle.releases, cal, seed, eraDrift, eraLevel);
  const series: number[] = [];
  const anchors: Record<string, number> = {};
  const anchorDates = new Set(['2007-10-16', '2008-10-28', '2015-06-15', '2015-08-24', '2016-01-28', '2018-10-19', '2022-11-14', '2024-09-24']);
  while (sim.cursor < cal.count) {
    const s = sim.stepToNext();
    if (anchorDates.has(s.date)) anchors[s.date] = s.indices['idx_300'];
    series.push(s.indices['idx_300']);
  }
  return { sim, series, anchors };
}

describe('MarketSim 确定性与内容校验', () => {
  it('内容包校验无错误', () => {
    expect(validateContent(contentBundle)).toEqual([]);
  });
  it('同 seed 两次演算完全一致（存档可复现）', { timeout: 30000 }, () => {
    const a = runFull(42);
    const b = runFull(42);
    expect(a.series).toEqual(b.series);
  });
  it('不同 seed 序列不同', { timeout: 30000 }, () => {
    const a = runFull(42);
    const b = runFull(43);
    expect(a.series[100]).not.toBe(b.series[100]);
  });
  it('20 年演算：净值非负、无 NaN', { timeout: 30000 }, () => {
    const { sim } = runFull(42);
    for (const v of Object.values(sim.industryState)) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
    for (const v of Object.values(sim.indicesState)) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
  it('导演事件全部触发（74 条事件库 ≥ 70）', { timeout: 30000 }, () => {
    const { sim } = runFull(42);
    expect(sim.firedEvents.length).toBeGreaterThanOrEqual(70);
    expect(sim.newsFeed.length).toBeGreaterThan(100);
    expect(sim.releaseLog.length).toBeGreaterThan(1000); // 5 项月度数据 × 240 月
  });
  it('历史锚点方向性（2007 顶 > 2008 底 > 2018 底；2015 顶 < 2007 顶附近回落结构成立）', { timeout: 30000 }, () => {
    const { anchors } = runFull(42);
    expect(anchors['2008-10-28']).toBeLessThan(anchors['2007-10-16']);
    expect(anchors['2018-10-19']).toBeLessThan(anchors['2015-06-15']);
    expect(anchors['2015-08-24']).toBeLessThan(anchors['2015-06-15']);
    expect(anchors['2022-11-14']).toBeLessThan(anchors['2021-02-18'] ?? anchors['2015-06-15']);
  });
  it('利率因子到达终值且在下限之上', { timeout: 30000 }, () => {
    const { sim } = runFull(42);
    expect(sim.factorState['rate10y']).toBeGreaterThan(0.005);
    expect(sim.factorState['fed_rate']).toBeGreaterThan(0.0005);
    expect(sim.factorState['fx_cny']).toBeGreaterThan(5);
  });
  it('factorHistory 环形缓冲不超过上限', { timeout: 30000 }, () => {
    const { sim } = runFull(42);
    expect(sim.factorHistory.length).toBeLessThanOrEqual(40);
    expect(sim.factorHistory[sim.factorHistory.length - 1].date).toBe('2025-12-31');
  });
});
