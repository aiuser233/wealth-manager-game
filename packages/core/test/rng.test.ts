import { describe, it, expect } from 'vitest';
import { Rng, GameCalendar, fromIso, toIso, addDays, isWeekend, yearOf, monthOf } from '../src/rng';

describe('Rng（Mulberry32）', () => {
  it('同种子产出同序列（确定性）', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('next 在 [0,1)', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('gauss 均值近似 0、标准差近似 1', () => {
    const r = new Rng(7);
    const n = 20000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const v = r.gauss();
      sum += v;
      sumSq += v * v;
    }
    const mean = sum / n;
    const std = Math.sqrt(sumSq / n - mean * mean);
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(std).toBeGreaterThan(0.9);
    expect(std).toBeLessThan(1.1);
  });
  it('range/int/pick/shuffle 边界正确', () => {
    const r = new Rng(3);
    for (let i = 0; i < 100; i++) {
      expect(r.range(2, 5)).toBeGreaterThanOrEqual(2);
      expect(r.range(2, 5)).toBeLessThan(5);
      const v = r.int(3, 5);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(5);
    }
    expect(r.pick([9])).toBe(9);
    const shuffled = r.shuffle([1, 2, 3, 4, 5]);
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('日期工具', () => {
  it('ISO 往返', () => {
    expect(toIso(fromIso('2006-01-09'))).toBe('2006-01-09');
  });
  it('addDays 跨月', () => {
    expect(addDays('2006-01-30', 5)).toBe('2006-02-04');
  });
  it('周末判定', () => {
    expect(isWeekend('2006-01-07')).toBe(true);  // 周六
    expect(isWeekend('2006-01-09')).toBe(false); // 周一
  });
  it('年月提取', () => {
    expect(yearOf('2015-06-15')).toBe(2015);
    expect(monthOf('2015-06-15')).toBe(6);
  });
});

describe('GameCalendar', () => {
  const cal = new GameCalendar('2006-01-02', '2025-12-31');
  it('交易日总数约 5200（20 年工作日）', () => {
    expect(cal.count).toBeGreaterThan(5100);
    expect(cal.count).toBeLessThan(5300);
  });
  it('首尾日期', () => {
    expect(cal.at(0)).toBe('2006-01-02');
    expect(cal.at(cal.count - 1)).toBe('2025-12-31');
  });
  it('indexOf 与 at 互逆', () => {
    const d = '2015-06-15';
    expect(cal.at(cal.indexOf(d))).toBe(d);
  });
  it('周末不在日历中', () => {
    expect(cal.isTradingDay('2006-01-07')).toBe(false);
    expect(cal.indexOf('2006-01-07')).toBe(-1);
  });
  it('nextTradingDay 跳过周末', () => {
    expect(cal.nextTradingDay('2006-01-07')).toBe('2006-01-09');
  });
  it('某月交易日数量 20-23', () => {
    for (const d of ['2007-03-05', '2015-02-02', '2020-04-01']) {
      const n = cal.tradingDaysOfMonth(d).length;
      expect(n).toBeGreaterThanOrEqual(20);
      expect(n).toBeLessThanOrEqual(23);
    }
  });
  it('tradingDaysOfWeek 返回周一至周五', () => {
    const days = cal.tradingDaysOfWeek('2006-01-04');
    expect(days[0]).toBe('2006-01-02');
    expect(days[days.length - 1]).toBe('2006-01-06');
  });
});
