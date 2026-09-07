import type { MarketFactorDef, IndustryIndexDef, MarketSnapshot, GameEventDef, EconReleaseDef, IsoDate } from './types';
import type { GameCalendar } from './rng';
import { Rng } from './rng';

/** 宏观时代参数：eraDrift[因子id][年份]=年化对数漂移；eraLevel[因子id][年份]=年末目标水平 */
export type EraDrift = Record<string, Record<number, number>>;
export type EraLevel = Record<string, Record<number, number>>;

/** 因子日变化结果 */
interface FactorDayRet {
  rets: Record<string, number>;   // 价格型：对数收益率；利率型：绝对变化
  sentiment: number;
}

/**
 * 市场模拟引擎 v1（M0）
 * - 因子层：均值回复 + 随机波动 + 导演事件冲击 + 季节性微噪声
 * - 行业指数 = 因子线性组合 + 特质噪声
 * - 宽基指数 = 因子组合
 * - 经济数据日历：按月/季生成"预期 vs 实际"，实际值决定冲击方向
 * - 确定性：同 seed 同结果；可无头复现
 */
export class MarketSim {
  private factors: MarketFactorDef[];
  private industries: IndustryIndexDef[];
  private releases: EconReleaseDef[];
  private events: GameEventDef[];
  private cal: GameCalendar;

  /** 全量导演事件表（只读暴露，供金手指记忆等系统查询未来事件） */
  get eventsList(): readonly GameEventDef[] {
    return this.events;
  }

  /** 因子当前状态 */
  factorState: Record<string, number> = {};
  industryState: Record<string, number> = {};
  indicesState: Record<string, number> = {};
  sentiment = 0;
  /** 已演算到的交易日序号（相对日历起点） */
  cursor = 0;

  /** 事件队列：date -> events（已触发的） */
  firedEvents: Array<{ date: IsoDate; ev: GameEventDef }> = [];
  /** 新闻流 */
  newsFeed: Array<{ date: IsoDate; title: string; body: string }> = [];
  /** 经济数据公布记录 */
  releaseLog: Array<{ date: IsoDate; id: string; name: string; expect: number; actual: number; unit: string; beat: boolean }> = [];

  /** 事件冲击的剩余施加天数：factorId -> {shock, days}（多事件叠加） */
  private activeShocks: Record<string, Array<{ perDay: number; days: number }>> = {};

  constructor(
    factors: MarketFactorDef[],
    industries: IndustryIndexDef[],
    events: GameEventDef[],
    releases: EconReleaseDef[],
    cal: GameCalendar,
    seed: number,
    eraDrift?: EraDrift,
    eraLevel?: EraLevel,
  ) {
    this.factors = factors;
    this.industries = industries;
    this.events = events;
    this.releases = releases;
    this.cal = cal;
    this.eraDrift = eraDrift ?? {};
    this.eraLevel = eraLevel ?? {};
    this.rng = new Rng(seed);
    for (const f of factors) this.factorState[f.id] = f.start;
    // 行业指数与宽基从因子初始值起步
    for (const ind of industries) this.industryState[ind.id] = ind.start;
    this.initIndices();
  }

  private rng: Rng;
  private eraDrift: EraDrift = {};
  private eraLevel: EraLevel = {};

  private initIndices() {
    // 宽基指数由因子合成的暴露表（简化：以权益因子为主）
    const eq = this.factorState['equity'] ?? 1000;
    this.indicesState = {
      idx_main: eq,                    // 沪深主板综指
      idx_300: eq * 1.02,              // 玄商300
      idx_500: eq * 0.95,              // 玄证500
      idx_growth: eq * 0.9,            // 创业板
      idx_hk: eq * 1.1,                // 恒生
      idx_us: this.factorState['us_equity'] ?? 1200, // 纳斯达克
    };
  }

  /** 演算下一个交易日。返回当日快照。 */
  stepToNext(): MarketSnapshot {
    if (this.cursor >= this.cal.count) throw new Error('日历已到终点');
    return this.stepOneDay();
  }

  /** 演算到指定交易日（含）。返回当日快照。 */
  stepTo(date: IsoDate): MarketSnapshot {
    const target = this.cal.indexOf(this.cal.nextTradingDay(date));
    if (target < 0) throw new Error(`日期 ${date} 超出日历范围`);
    let snap: MarketSnapshot | null = null;
    while (this.cursor <= target) {
      snap = this.stepOneDay();
    }
    return snap!;
  }

  /** 连续演算多天（批量），返回区间快照数组 */
  stepRange(from: IsoDate, to: IsoDate): MarketSnapshot[] {
    const a = this.cal.indexOf(this.cal.nextTradingDay(from));
    const b = this.cal.indexOf(this.cal.nextTradingDay(to));
    const out: MarketSnapshot[] = [];
    while (this.cursor <= b) {
      const s = this.stepOneDay();
      if (this.cursor > a) out.push(s);
    }
    return out;
  }

  private stepOneDay(): MarketSnapshot {
    const date = this.cal.at(this.cursor);
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));

    // 1) 导演事件触发
    const todaysEvents = this.events.filter((e) => e.date === date);
    for (const ev of todaysEvents) this.applyEvent(ev, date);

    // 2) 经济数据日历
    this.checkReleases(date, year, month);

    // 3) 因子日收益
    const day = this.evolveFactors(year, month);

    // 4) 更新行业与宽基
    const industries: Record<string, number> = {};
    for (const ind of this.industries) {
      let r = (ind.drift_pa ?? 0) / 250 + this.rng.gauss() * ind.idio_sigma;
      for (const [fid, beta] of Object.entries(ind.loadings)) {
        const v = day.rets[fid] ?? 0;
        const fdef = this.factors.find((f) => f.id === fid);
        if (fdef?.is_rate) {
          // 利率/利差/汇率型因子：变动按 beta 直接叠加（利率上行为负贡献，故内容里用负 beta 表达）
          r += beta * v * 100;
        } else if (fid === 'vix' || fid === 'risk_g' || fid === 'liquidity' || fid === 'sentiment_dom') {
          // 指数型情绪/状态因子：按变化率缩放
          const lvl = this.factorState[fid];
          const chg = Math.abs(lvl) > 1e-6 ? v / lvl : 0;
          r += beta * chg;
        } else {
          r += beta * v;
        }
      }
      r += Math.max(-3, Math.min(3, this.sentiment)) * 0.0004;
      this.industryState[ind.id] = Math.max(1, this.industryState[ind.id] * Math.exp(r));
      industries[ind.id] = this.industryState[ind.id];
    }

    const indices: Record<string, number> = {};
    const eqRet = day.rets['equity'] ?? 0;
    const usRet = day.rets['us_equity'] ?? 0;
    for (const [k, v] of Object.entries(this.indicesState)) {
      const dr = k === 'idx_us' ? usRet : k === 'idx_hk' ? eqRet * 0.85 + day.rets['us_equity'] * 0.15 : eqRet;
      indices[k] = v * Math.exp(dr);
      this.indicesState[k] = indices[k];
    }

    this.sentiment = this.sentiment * 0.97 + (day.sentiment - this.sentiment) * 0.15;

    const snap: MarketSnapshot = {
      date,
      factors: { ...this.factorState },
      industries,
      indices,
      sentiment: Math.max(-3, Math.min(3, this.sentiment)),
    };
    this.cursor += 1;
    return snap;
  }

  private applyEvent(ev: GameEventDef, date: IsoDate) {
    const dur = ev.duration_days ?? 1;
    for (const [fid, shock] of Object.entries(ev.shocks ?? {})) {
      const f = this.factors.find((x) => x.id === fid);
      if (!f) continue;
      if (f.is_rate) {
        // 利率型：首日直接变动，其余天衰减施加
        this.activeShocks[fid] = this.activeShocks[fid] ?? [];
        this.activeShocks[fid].push({ perDay: shock / dur, days: dur });
      } else {
        this.activeShocks[fid] = this.activeShocks[fid] ?? [];
        this.activeShocks[fid].push({ perDay: shock / dur, days: dur });
      }
    }
    if (ev.sentiment) this.sentiment += ev.sentiment;
    this.firedEvents.push({ date, ev });
    if (ev.news) this.newsFeed.push({ date, title: ev.title, body: ev.news });
  }

  private checkReleases(date: IsoDate, year: number, month: number) {
    for (const r of this.releases) {
      const key = `${r.id}_${year}_${month}`;
      const fired = (this.releaseKeys ??= new Set()).has(key);
      if (fired) continue;
      // 每月第 dayHint 个交易日左右公布
      const target = this.cal.tradingDayOfNth(date, r.day_hint ?? 10);
      if (target === date) {
        (this.releaseKeys as Set<string>).add(key);
        const expect = this.releaseExpectation(r, year, month);
        const actual = expect * (1 + this.rng.gauss() * 0.15);
        const beat = actual > expect;
        const shocks = beat ? r.impact_beat : r.impact_miss;
        for (const [fid, sh] of Object.entries(shocks)) {
          this.activeShocks[fid] = this.activeShocks[fid] ?? [];
          this.activeShocks[fid].push({ perDay: sh, days: 2 });
        }
        this.sentiment += beat ? 0.2 : -0.2;
        this.releaseLog.push({ date, id: r.id, name: r.name, expect, actual, unit: r.note ?? '', beat });
        this.newsFeed.push({
          date,
          title: `${r.region === 'cn' ? 'A 国' : '美联储'}公布${r.name}`,
          body: `实际值 ${actual.toFixed(2)}${r.note ?? ''}，市场预期 ${expect.toFixed(2)}${r.note ?? ''}，${beat ? '超预期' : '不及预期'}。`,
        });
      }
    }
  }

  private releaseKeys?: Set<string>;

  private releaseExpectation(r: EconReleaseDef, year: number, month: number): number {
    // 简化：按年代给名义预期值（M1 再做动态预期）
    if (r.id === 'cpi_cn') return year <= 2007 ? 3 : year <= 2011 ? 4 : 2;
    if (r.id === 'pmi_cn') return 50.5;
    if (r.id === 'tsf_cn') return 1.5;
    if (r.id === 'nfp_us') return 18;
    if (r.id === 'cpi_us') return year >= 2021 ? 5 : 2;
    return 1;
  }

  private evolveFactors(year: number, month: number): FactorDayRet {
    const rets: Record<string, number> = {};
    // 时代参数插值：以"年末目标"为锚，全年线性逼近（月度步进）
    const yearDrift = this.eraDrift;
    const yearLevel = this.eraLevel;
    const nextYear = year + 1;
    for (const f of this.factors) {
      let ret: number;
      if (f.is_rate) {
        // 利率型：向时代目标均值回复 + 波动 + 冲击
        const levelTbl = yearLevel[f.id];
        let anchor = f.anchor ?? f.start;
        if (levelTbl) {
          const cur = levelTbl[year] ?? anchor;
          const nxt = levelTbl[nextYear] ?? cur;
          const monthFrac = (month - 1) / 12;
          anchor = cur + (nxt - cur) * monthFrac;
        }
        const mr = (f.mean_revert ?? 0.002) * (anchor - this.factorState[f.id]) * 0.02;
        ret = mr + this.rng.gauss() * f.sigma_daily;
        ret += this.takeShocks(f.id);
        this.factorState[f.id] = Math.max(f.floor ?? 0, this.factorState[f.id] + ret);
        rets[f.id] = ret; // 绝对变化（小数）
      } else {
        // 价格型：时代漂移（按交易日折算）+ 温和均值回复 + 波动 + 冲击
        const driftTbl = yearDrift[f.id];
        const drift = driftTbl ? (driftTbl[year] ?? 0) / 250 : (f.drift_pa ?? 0) / 250;
        const anchor = f.anchor ?? f.start;
        const mr = (f.mean_revert ?? 0.0005) * Math.log(anchor / this.factorState[f.id]) * 0.3;
        ret = drift + mr + this.rng.gauss() * f.sigma_daily;
        ret += this.takeShocks(f.id);
        this.factorState[f.id] = Math.max(0.01, this.factorState[f.id] * Math.exp(ret));
        rets[f.id] = ret; // 对数收益率
      }
    }
    // 情绪：向 0 回复 + 小噪声
    const sentNoise = this.rng.gauss() * 0.08;
    return { rets, sentiment: Math.max(-3, Math.min(3, this.sentiment * 0.985 + sentNoise)) };
  }

  private takeShocks(fid: string): number {
    const list = this.activeShocks[fid];
    if (!list || list.length === 0) return 0;
    let total = 0;
    for (const s of list) {
      if (s.days > 0) {
        total += s.perDay;
        s.days -= 1;
      }
    }
    // 清理已耗尽
    this.activeShocks[fid] = list.filter((s) => s.days > 0);
    return total;
  }

  /** 距上次查看的区间涨跌幅 */
  static changePct(from: number, to: number): number {
    return (to / from - 1) * 100;
  }
}
