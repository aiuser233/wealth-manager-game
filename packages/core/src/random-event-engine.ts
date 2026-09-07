import type { Rng } from './rng';

/** 随机事件结构（引擎侧轻量定义，内容在 @fm/content 提供） */
export interface RandomEventInstance {
  id: string;
  title: string;
  text: string;
  /** 抽取权重（默认 1） */
  weight?: number;
  /** 年代范围 [起, 止]（含） */
  era?: [number, number];
  effects: {
    trust?: number;
    stress?: number;
    fame?: number;
    income?: number;
    aum?: number;
  };
  choices?: Array<{
    text: string;
    outcome: string;
    effects: RandomEventInstance['effects'];
    risk?: 'comply' | 'grey' | 'red';
    teach?: string;
  }>;
  teach?: string;
}

export interface RandomEventOutcome {
  eventId: string;
  title: string;
  outcomeText: string;
  effects: RandomEventInstance['effects'];
  risk?: 'comply' | 'grey' | 'red';
  teach?: string;
}

/** 违规记录（红线选择累积，晋升与结局用） */
export interface ViolationRecord {
  date: string;
  eventId: string;
  desc: string;
}

/**
 * 随机事件引擎：
 * - 按帧密度掷骰（日帧低频 / 周帧中频 / 月帧高频，保证节奏密度相当）
 * - 年代过滤 + 加权抽取
 * - 红线选择累积违规记录，影响晋升与结局
 */
export class RandomEventEngine {
  private pool: RandomEventInstance[];
  private rng: Rng;
  /** 已触发事件（防短期重复） */
  private recent: string[] = [];
  violations: ViolationRecord[] = [];

  constructor(pool: RandomEventInstance[], rng: Rng) {
    this.pool = pool;
    this.rng = rng;
  }

  /** 掷骰一次，返回事件或 null。frame 决定触发概率；year 过滤年代池。 */
  roll(frame: 'day' | 'week' | 'month', year: number, _date: string): RandomEventInstance | null {
    const p = frame === 'day' ? 0.12 : frame === 'week' ? 0.35 : 0.65;
    if (!this.rng.chance(p)) return null;
    let pool = this.pool.filter((e) => (e.era ? year >= e.era[0] && year <= e.era[1] : true));
    const notRecent = pool.filter((e) => !this.recent.includes(e.id));
    pool = notRecent.length > 0 ? notRecent : pool;
    if (pool.length === 0) return null;
    const total = pool.reduce((s, e) => s + (e.weight ?? 1), 0);
    let roll = this.rng.next() * total;
    for (const e of pool) {
      roll -= (e.weight ?? 1);
      if (roll <= 0) {
        this.recent.push(e.id);
        if (this.recent.length > 6) this.recent.shift();
        return e;
      }
    }
    return pool[0];
  }

  /** 应用事件效果（无分支事件） */
  static applyEffects(e: RandomEventInstance['effects'], target: {
    allTrust: (d: number) => void;
    stress: number;
    fame: number;
    income: number;
    aum: number;
  }): void {
    if (e.trust) target.allTrust(e.trust);
    target.stress += e.stress ?? 0;
    target.fame += e.fame ?? 0;
    target.income += e.income ?? 0;
    target.aum = Math.max(0, target.aum + (e.aum ?? 0));
  }

  /** 记录红线违规 */
  addViolation(date: string, eventId: string, desc: string) {
    this.violations.push({ date, eventId, desc });
  }
}
