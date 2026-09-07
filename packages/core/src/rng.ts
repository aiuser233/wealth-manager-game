import type { IsoDate } from './types';

/** Mulberry32 可复现随机数生成器（确定性 seed，同 seed 同行情） */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** [0,1) */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 正态分布（Box-Muller） */
  gauss(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

const MS_DAY = 86400000;

export function toIso(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIso(s: IsoDate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: IsoDate, n: number): IsoDate {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function dayDiff(a: IsoDate, b: IsoDate): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / MS_DAY);
}

export function isWeekend(s: IsoDate): boolean {
  const w = fromIso(s).getDay();
  return w === 0 || w === 6;
}

export function yearOf(s: IsoDate): number {
  return Number(s.slice(0, 4));
}

export function monthOf(s: IsoDate): number {
  return Number(s.slice(5, 7));
}

/** 游戏日历：2006-01-02（周一）至 2025-12-31 的交易日历（简化：周一至周五均为交易日）。
 *  真实节假日休市规则在 M1 再校准（春节/国庆各休市一周）。 */
export class GameCalendar {
  readonly start: IsoDate;
  readonly end: IsoDate;
  private tradingDays: IsoDate[] = [];
  private index: Map<IsoDate, number> = new Map();

  constructor(start: IsoDate = '2006-01-02', end: IsoDate = '2025-12-31') {
    this.start = start;
    this.end = end;
    let d = fromIso(start);
    const endD = fromIso(end);
    while (d <= endD) {
      const w = d.getDay();
      if (w !== 0 && w !== 6) {
        const iso = toIso(d);
        this.index.set(iso, this.tradingDays.length);
        this.tradingDays.push(iso);
      }
      d.setDate(d.getDate() + 1);
    }
  }

  get count(): number {
    return this.tradingDays.length;
  }

  at(i: number): IsoDate {
    return this.tradingDays[Math.max(0, Math.min(this.tradingDays.length - 1, i))];
  }

  indexOf(date: IsoDate): number {
    return this.index.get(date) ?? -1;
  }

  isTradingDay(date: IsoDate): boolean {
    return this.index.has(date);
  }

  /** 下一个交易日（含当天） */
  nextTradingDay(date: IsoDate): IsoDate {
    const i = this.indexOf(date);
    if (i >= 0) return this.tradingDays[i];
    // 非交易日：向后找
    let d = fromIso(date);
    while (d <= fromIso(this.end)) {
      if (!isWeekend(toIso(d))) return toIso(d);
      d.setDate(d.getDate() + 1);
    }
    return this.end;
  }

  /** 上一个交易日（不含当天） */
  prevTradingDay(date: IsoDate): IsoDate | null {
    const i = this.indexOf(date);
    if (i > 0) return this.tradingDays[i - 1];
    return null;
  }

  /** date 所在月的交易日列表 */
  tradingDaysOfMonth(date: IsoDate): IsoDate[] {
    const y = yearOf(date);
    const m = monthOf(date);
    return this.tradingDays.filter((t) => yearOf(t) === y && monthOf(t) === m);
  }

  /** date 所在周的（周一至周五）交易日列表 */
  tradingDaysOfWeek(date: IsoDate): IsoDate[] {
    const d = fromIso(date);
    const w = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((w + 6) % 7));
    return [0, 1, 2, 3, 4]
      .map((i) => {
        const x = new Date(mon);
        x.setDate(mon.getDate() + i);
        return toIso(x);
      })
      .filter((t) => this.index.has(t));
  }

  /** 某月第 dayHint 个交易日左右的日期 */
  tradingDayOfNth(date: IsoDate, n: number): IsoDate | null {
    const days = this.tradingDaysOfMonth(date);
    return days[Math.min(n, days.length) - 1] ?? null;
  }
}
