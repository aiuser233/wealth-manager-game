import type { ProductDef, ClientDef, IsoDate, MarketSnapshot, ActionResult, ActionType, TimeFrame, GameEventDef } from './types';
import { GRADE_NAMES } from './types';
import { Rng } from './rng';
import { MarketSim } from './market';
import { productNavAt, productOnShelf } from './nav';
import { monthlyKpiScore, kpiGradeName, monthlyBonus, isOpeningSeason, checkPromotion, PROMOTION_PATH, type PromotionCheckResult } from './career';
import { RandomEventEngine, type RandomEventInstance, type RandomEventOutcome } from './random-event-engine';
import { TeamSystem, type TeamEvent } from './team';

/** 各帧的行动点上限（规划书 3.2：日 4 / 周 10 / 月 32-40，取 36） */
export const AP_PER_FRAME: Record<TimeFrame, number> = { day: 4, week: 10, month: 36 };

/** 一帧结算结果 */
export interface FrameAdvanceResult {
  daysAdvanced: number;
  /** 途中触发 force_day 重大事件而被中断 */
  interrupted: boolean;
  interruptDate?: IsoDate;
  interruptEvent?: GameEventDef;
  /** 本次推进的逐日快照（供 UI 缓存口径基准） */
  snaps: MarketSnapshot[];
}

export interface GameUIHooks {
  onNews?: (n: { date: IsoDate; title: string; body: string }) => void;
  onEvent?: (ev: { date: IsoDate; title: string; body: string }) => void;
  onRelease?: (r: { date: IsoDate; name: string; actual: number; expect: number; beat: boolean }) => void;
}

/**
 * 游戏主控（M0 最小可玩）：
 * - 时间推进（日帧为主，周/月在 UI 层聚合调用 advanceDays）
 * - 行动执行（8 种行动的最小结算）
 * - 客户接待与成交（适当性最小校验）
 * - KPI 月度结算
 */
export class Game {
  sim: MarketSim;
  cal: any;
  rng: Rng;
  hooks: GameUIHooks = {};

  /** 供 UI 层派生独立随机流（考试抽题等），不干扰主 rng 序列 */
  rngNextInt(): number {
    return Math.floor(this.rng.next() * 0x7fffffff);
  }

  /** 随机事件引擎（内容池由 shell 注入） */
  eventEngine: RandomEventEngine | null = null;
  /** 待玩家决策的随机事件（UI 弹窗） */
  pendingEvent: RandomEventInstance | null = null;

  injectEvents(pool: RandomEventInstance[], rng: Rng) {
    this.eventEngine = new RandomEventEngine(pool, rng);
  }

  /** 帧推进后掷骰随机事件（返回事件供 UI 弹窗；效果在玩家决策/确认后结算） */
  rollRandomEvent(): RandomEventInstance | null {
    if (!this.eventEngine || this.pendingEvent) return null;
    const year = Number(this.date.slice(0, 4));
    const ev = this.eventEngine.roll(this.forceDayDays > 0 ? 'day' : this.frame, year, this.date);
    if (ev) {
      this.pendingEvent = ev;
    }
    return ev;
  }

  /** 应用无分支事件 / 玩家选择的分支 */
  resolveEvent(choiceIdx?: number): RandomEventOutcome | null {
    const ev = this.pendingEvent;
    if (!ev) return null;
    this.pendingEvent = null;
    const a = this.player.attrs;
    let eff = ev.effects;
    let outcome = '';
    let risk: 'comply' | 'grey' | 'red' | undefined;
    let teach: string | undefined;
    if (ev.choices && ev.choices.length > 0) {
      const idx = choiceIdx ?? 0;
      const ch = ev.choices[Math.min(idx, ev.choices.length - 1)];
      eff = ch.effects;
      outcome = ch.outcome;
      risk = ch.risk;
      teach = ch.teach;
      if (ch.risk === 'red') {
        this.violations += 1;
        a.rep = Math.max(0, a.rep - 10);
      }
    }
    if (eff.trust) {
      for (const c of this.clients) {
        if (c.status === 'active') c.trust = Math.max(0, Math.min(100, c.trust + eff.trust));
      }
    }
    if (eff.stress) a.stress = Math.max(0, a.stress + eff.stress);
    if (eff.fame) a.fame = Math.max(0, a.fame + eff.fame);
    if (eff.aum) this.player.aum = Math.max(0, this.player.aum + eff.aum);
    // income 效果记入日志（月度结算并入工资）
    const effTexts: string[] = [];
    if (eff.trust) effTexts.push(`全体客户信任 ${eff.trust > 0 ? '+' : ''}${eff.trust}`);
    if (eff.stress) effTexts.push(`压力 ${eff.stress > 0 ? '+' : ''}${eff.stress}`);
    if (eff.fame) effTexts.push(`知名度 ${eff.fame > 0 ? '+' : ''}${eff.fame}`);
    if (eff.aum) effTexts.push(`AUM ${eff.aum > 0 ? '+' : ''}${fmtMoney(eff.aum)}`);
    if (eff.income) effTexts.push(`现金 ${eff.income > 0 ? '+' : ''}${fmtMoney(eff.income)}`);
    this.log.push({
      date: this.date,
      text: `【事件】${ev.title}：${outcome || '……'}（${effTexts.join('，') || '无直接影响'}）`,
    });
    return { eventId: ev.id, title: ev.title, outcomeText: outcome, effects: eff, risk, teach };
  }
  player = {
    name: '林奇安',
    gender: 'm' as 'm' | 'f',
    grade: 0,
    attrs: { pro: 35, comm: 30, sales: 25, stress: 10, rep: 50, fame: 0 },
    energy: 100,
    aum: 0,
    income_month: 4500,
    certs: [] as string[],
  };

  /** 月度结算：新客户开发（知名度与口碑驱动），20 年客户池不再枯竭 */
  private developClients(snap: MarketSnapshot) {
    const fame = this.player.attrs.fame;
    const rep = this.player.attrs.rep;
    // 概率：fame 越高越容易来新客户（月度 0-2 位）
    const chance = Math.min(0.75, 0.1 + fame / 400 + rep / 2000);
    if (!this.rng.chance(chance)) return;
    const tierRoll = this.rng.next();
    const tier = tierRoll < 0.5 ? 'mass' : tierRoll < 0.8 ? 'wealth' : tierRoll < 0.95 ? 'vip' : 'private';
    const depositsBase = tier === 'mass' ? this.rng.range(5, 50) : tier === 'wealth' ? this.rng.range(50, 300) : tier === 'vip' ? this.rng.range(300, 600) : this.rng.range(600, 2000);
    const cashBase = depositsBase * this.rng.range(0.2, 0.6);
    const id = `cli_gen_${snap.date}_${Math.floor(this.rng.next() * 1e6)}`;
    const name = this.rng.pick(GENERATED_NAMES) + (this.clients.filter((c) => c.id.startsWith('cli_gen')).length + 1);
    const riskLevel = (this.rng.int(1, Math.min(5, 2 + this.player.grade)) as 1 | 2 | 3 | 4 | 5);
    this.clients.push({
      id,
      name,
      age_2006: this.rng.int(24, 58),
      occupation: this.rng.pick(['企业职员', '个体经营', '公务员', '医生', '教师', '自由职业', '退休返聘', '工程师']),
      tier,
      risk: { level: riskLevel, tested_at: snap.date },
      behaviors: this.rng.chance(0.5) ? ['yield_chasing'] : ['risk_averse'],
      finance: {
        deposits: Math.round(depositsBase * 10000),
        wealth_mgmt: 0,
        funds: 0,
        insurance: 0,
        loans: 0,
        annual_cashflow: Math.round(cashBase * 10000),
      },
      family: this.rng.chance(0.6) ? '已婚' : '未婚',
      trust: this.rng.range(20, 40),
      teach_tags: [],
      holdings: [],
      status: 'active',
    });
    this.log.push({ date: snap.date, text: `【新客户】${name}（${{ mass: '大众', wealth: '财富', vip: '贵宾', private: '私行' }[tier]}客户）慕名而来，已建档。` });
  }

  clients: Array<
    ClientDef & {
      holdings: Array<{ productId: string; amount: number; nav_at_buy: number; bought_at: IsoDate }>;
      status: 'active' | 'dormant' | 'lost';
    }
  > = [];

  kpi = {
    year: 2006, month: 1,
    deposit_target: 300_000, deposit_done: 0,
    wm_target: 500_000, wm_done: 0,
    fund_target: 300_000, fund_done: 0,
    ins_target: 100_000, ins_done: 0,
  };

  log: Array<{ date: IsoDate; text: string }> = [];
  /** 当前时间帧（规划书 3：日/周/月，职级解锁 + 事件强制降帧） */
  frame: TimeFrame = 'day';
  /** 事件强制降帧的剩余天数（>0 期间锁定日帧） */
  forceDayDays = 0;
  /** 本帧已用行动点 */
  apUsed = 0;
  apMax = AP_PER_FRAME.day;
  /** 最近快照（UI 展示） */
  lastSnap: MarketSnapshot | null = null;
  /** 上次查看行情的快照（用于"距上次查看"涨跌） */
  lastViewedSnap: MarketSnapshot | null = null;
  /** 快照历史（环形，供 K 线图绘制）：最近 120 个交易日 */
  snapHistory: MarketSnapshot[] = [];

  constructor(sim: MarketSim, cal: any, seed: number, clients: ClientDef[]) {
    this.sim = sim;
    this.cal = cal;
    this.rng = new Rng(seed ^ 0x9e3779b9);
    this.clients = clients.map((c) => ({ ...c, holdings: [], status: 'active' as const }));
  }

  get date(): IsoDate {
    return this.cal.at(Math.max(0, this.sim.cursor - 1));
  }

  /** K 线历史入环形缓冲（上限 120 交易日） */
  private pushSnapHistory(snap: MarketSnapshot) {
    this.snapHistory.push(snap);
    if (this.snapHistory.length > 120) this.snapHistory.shift();
  }

  /** 推进 n 个交易日（执行完今日行动后调用） */
  advanceDays(n: number) {
    for (let i = 0; i < n; i++) {
      this.apUsed = 0;
      const snap = this.sim.stepToNext();
      this.lastSnap = snap;
      this.pushSnapHistory(snap);
      for (const nw of this.sim.newsFeed) {
        if (nw.date === snap.date) this.hooks.onNews?.(nw);
      }
      for (const r of this.sim.releaseLog) {
        if (r.date === snap.date) this.hooks.onRelease?.(r);
      }
      this.checkForceDayEvents(snap);
      // 月切换时重置 KPI
      const prev = this.cal.at(Math.max(0, this.sim.cursor - 2));
      if (prev && prev.slice(0, 7) !== snap.date.slice(0, 7)) {
        this.rollMonth(snap);
      }
    }
  }

  /** 重大事件强制切回日帧（规划书 3.3 事件驱动） */
  private checkForceDayEvents(snap: MarketSnapshot) {
    const fired = this.sim.firedEvents;
    const today = fired.filter((f) => f.date === snap.date);
    for (const { ev } of today) {
      if (ev.force_day) {
        this.forceDayDays = Math.max(this.forceDayDays, ev.duration_days ?? 1);
        this.log.push({ date: snap.date, text: `【突发】${ev.title}——需要逐日应对，已切换为日帧。` });
      }
    }
  }

  /** 当前是否允许切到某帧（force_day 期间只允许日帧） */
  canSetFrame(f: TimeFrame): boolean {
    if (this.forceDayDays > 0) return f === 'day';
    // 职级驱动：见习=日帧 → 普通=周帧 → 私行=月帧
    const maxFrame: TimeFrame = this.player.grade >= 3 ? 'month' : this.player.grade >= 1 ? 'week' : 'day';
    const order: TimeFrame[] = ['day', 'week', 'month'];
    return order.indexOf(f) <= order.indexOf(maxFrame);
  }

  /** 切换时间帧（成功返回 true） */
  setFrame(f: TimeFrame): boolean {
    if (!this.canSetFrame(f)) return false;
    this.frame = f;
    this.apMax = AP_PER_FRAME[f];
    this.apUsed = 0;
    this.log.push({ date: this.date, text: `时间帧切换为${f === 'day' ? '日帧' : f === 'week' ? '周帧' : '月帧'}（行动点 ${AP_PER_FRAME[f]}）。` });
    return true;
  }

  /**
   * 按当前帧推进一个完整回合（规划书 3.4）：
   * - 周帧=5 交易日 / 月帧=至当月末（约 21-23 交易日）
   * - 途中遇 force_day 事件中断，切回日帧，处理完由玩家继续
   */
  advanceFrame(daysOverride?: number): FrameAdvanceResult {
    if (this.forceDayDays > 0 || this.frame === 'day') {
      const snaps = this.advanceDaysRaw(daysOverride ?? 1);
      // 日帧同样上报中断（事件刚触发的当天），供 UI 弹出演示
      let interruptDate: IsoDate | undefined;
      let interruptEvent: GameEventDef | undefined;
      for (const s of snaps) {
        const hit = this.sim.firedEvents.find(
          (f) => f.date === s.date && f.ev.force_day && !this.handledForceDays.has(`${f.ev.id}@${f.date}`),
        );
        if (hit) {
          interruptDate = s.date;
          interruptEvent = hit.ev;
          this.handledForceDays.add(`${hit.ev.id}@${hit.date}`);
          break;
        }
      }
      return { daysAdvanced: snaps.length, interrupted: !!interruptEvent, interruptDate, interruptEvent, snaps };
    }
    const today = this.date;
    const days = daysOverride ?? (this.frame === 'week' ? 5 : this.restDaysOfMonth(today));
    const snaps: MarketSnapshot[] = [];
    let interrupted = false;
    let interruptDate: IsoDate | undefined;
    let interruptEvent: GameEventDef | undefined;
    for (let i = 0; i < days; i++) {
      const s = this.advanceDaysRaw(1)[0];
      if (!s) break;
      snaps.push(s);
      // 中断检测：当日（或推进途中累积）的 force_day 事件
      const hit = this.sim.firedEvents.find(
        (f) => f.date === s.date && f.ev.force_day && !this.handledForceDays.has(`${f.ev.id}@${f.date}`),
      );
      if (hit) {
        interrupted = true;
        interruptDate = s.date;
        interruptEvent = hit.ev;
        this.handledForceDays.add(`${hit.ev.id}@${hit.date}`);
        break;
      }
    }
    return { daysAdvanced: snaps.length, interrupted, interruptDate, interruptEvent, snaps };
  }

  /** 已处理过的 force_day 事件（id@date），防止重复中断 */
  private handledForceDays = new Set<string>();

  private restDaysOfMonth(date: IsoDate): number {
    const all = this.cal.tradingDaysOfMonth(date);
    const idx = all.indexOf(date);
    return Math.max(1, all.length - idx - 1);
  }

  /** 纯推进（不改帧状态），重置 AP 并返回当日快照数组 */
  private advanceDaysRaw(n: number): MarketSnapshot[] {
    const out: MarketSnapshot[] = [];
    for (let i = 0; i < n; i++) {
      if (this.sim.cursor >= this.cal.count) break;
      this.apUsed = 0;
      const before = this.sim.firedEvents.length;
      const snap = this.sim.stepToNext();
      this.lastSnap = snap;
      this.pushSnapHistory(snap);
      out.push(snap);
      // 过劳口径统计：每天收盘时点的压力（帧末行动全部做完之后）
      this.monthTradingDays += 1;
      if (this.player.attrs.stress >= 80) this.monthHotDays += 1;
      for (const nw of this.sim.newsFeed) {
        if (nw.date === snap.date) this.hooks.onNews?.(nw);
      }
      for (const r of this.sim.releaseLog) {
        if (r.date === snap.date) this.hooks.onRelease?.(r);
      }
      const fired = this.sim.firedEvents.slice(before);
      for (const { ev } of fired) {
        if (ev.force_day) this.forceDayDays = Math.max(this.forceDayDays, ev.duration_days ?? 1);
      }
      const prev = this.cal.at(Math.max(0, this.sim.cursor - 2));
      if (prev && prev.slice(0, 7) !== snap.date.slice(0, 7)) {
        this.rollMonth(snap);
      }
    }
    return out;
  }

  private rollMonth(snap: MarketSnapshot) {
    const y = Number(snap.date.slice(0, 4));
    const m = Number(snap.date.slice(5, 7));
    const growth = y - 2006;
    // 先对上月 KPI 评级，再重置（评级读的是重置前的 done/target）
    const prevKpi = { ...this.kpi };
    // 年代货架校准：当年代缺产品时目标归零（评分自动补偿）
    const shelf = this.products.filter((p) => productOnShelf(p, snap.date));
    const hasCat = (cat: string) => shelf.some((p) => p.category === cat);
    this.kpi = {
      year: y,
      month: m,
      deposit_target: 300_000 * (1 + growth * 0.15),
      deposit_done: 0,
      wm_target: hasCat('wealth_mgmt') ? 500_000 * (1 + growth * 0.18) : 0,
      wm_done: 0,
      fund_target: hasCat('fund') ? 300_000 * (1 + growth * 0.2) : 0,
      fund_done: 0,
      ins_target: hasCat('insurance') ? 100_000 * (1 + growth * 0.22) : 0,
      ins_done: 0,
    };
    // 客户月度情绪结算：持仓浮亏侵蚀信任，浮盈修复信任（长线客户经营的核心循环）
    const notes: string[] = [];
    for (const c of this.clients) {
      if (c.holdings.length === 0 || c.status !== 'active') continue;
      const pv = this.clientPortfolioValue(c.id);
      const cost = c.holdings.reduce((s: number, h) => s + h.amount, 0);
      const pnlPct = cost > 0 ? (pv / cost - 1) * 100 : 0;
      const before = c.trust;
      if (pnlPct < -5) {
        c.trust = Math.max(0, c.trust + Math.max(-4, pnlPct / 8));
        if (before - c.trust > 1) notes.push(`${c.name} 因持仓回撤有些不安（${pnlPct.toFixed(1)}%）。`);
      } else if (pnlPct > 5) {
        c.trust = Math.min(100, c.trust + Math.min(3, pnlPct / 15));
        if (c.trust - before > 1) notes.push(`${c.name} 对收益很满意，介绍朋友来网点（信任 +${(c.trust - before).toFixed(0)}）。`);
      }
    }
    // 资金再平衡：客户月度工资/经营现金流回补可投资池（现实中的持续流入），高信任客户每月有新增资金
    for (const c of this.clients) {
      if (c.status !== 'active') continue;
      const inflow = (c.finance.annual_cashflow / 12) * (0.5 + c.trust / 200);
      c.finance.deposits += inflow;
    }
    // KPI 评级与绩效（用上月完成度评级）
    const score = monthlyKpiScore(prevKpi);
    const grade = kpiGradeName(score);
    const opening = isOpeningSeason(m);
    const gained = aumGainBuffer.reduce((s, v) => s + v, 0);
    const bonus = monthlyBonus(y, gained, score, opening);
    const salary = 4500 + this.player.grade * 1500;
    this.monthScores.push(score);
    if (this.monthScores.length > 6) this.monthScores.shift();
    // 过劳统计（结局判定用）：口径为"月内压力 ≥80 的天数 ≥ 2/3"——月末瞬时点会被
    // 帧末休息等动作拉低/抬高，不能反映当月常态；按"压着 80 过完整个月"才算过劳月。
    if (this.monthHotDays >= this.monthTradingDays * 2 / 3 && this.monthTradingDays > 0) {
      this.highStressMonths += 1;
    }
    // 生活系统压力阀：月末统一自然回落（睡眠/周末），玩家不休息也无法把压力顶死在高位
    this.player.attrs.stress = Math.max(0, this.player.attrs.stress - 8);
    this.monthHotDays = 0;
    this.monthTradingDays = 0;
    // 团队月度结算（P6-3：卷四 2023 起生效）
    if (this.team) {
      this.team.syncRoster(y, this.rng);
      if (this.team.members.length > 0) {
        this.teamEvents = this.team.monthlyTick(y, () => this.rng.next(), this.coachLevel);
        for (const ev of this.teamEvents) {
          this.team.morale = Math.max(0, Math.min(100, this.team.morale + ev.moraleDelta));
          if (ev.violationsDelta) this.violations += ev.violationsDelta;
          this.log.push({ date: snap.date, text: `【团队】${ev.text}` });
        }
      }
    }

    this.log.push({
      date: snap.date,
      text: `【${y}年${m}月】月度考核 ${grade}（${score} 分）${opening ? '，开门红冲刺中！' : ''}。工资 ${fmtMoney(salary)} + 绩效 ${fmtMoney(bonus)}。${notes.slice(0, 3).join(' ')}`,
    });
    aumGainBuffer.length = 0;
    // 新客户开发：知名度驱动的月度获客
    this.developClients(snap);
    // 世代交替：每年 1 月检视高龄核心客户退场 → 子女继承回流
    if (m === 1) this.retireElderly(y, snap);
    this.developHeirs(snap);
  }

  /** 高龄核心客户退场检视（规划 6.2 世代交替的触发端） */
  private retireElderly(year: number, snap: MarketSnapshot) {
    for (const c of this.clients) {
      if (c.id.startsWith('cli_gen_') || c.id.startsWith('cli_heir_') || c.status !== 'active') continue;
      const age = c.age_2006 + (year - 2006);
      if (age >= 80 && this.rng.chance(0.25)) {
        c.status = 'dormant';
        this.log.push({ date: snap.date, text: `【岁月】${c.name}（${age} 岁）随子女迁居外地，账户转入休眠。人生线暂告段落，但故事未必结束。` });
      }
    }
  }

  /** 近 6 月平均考核分（晋升用） */
  recentSeasonScore(): number {
    if (this.monthScores.length === 0) return 0;
    return this.monthScores.reduce((a, b) => a + b, 0) / this.monthScores.length;
  }

  /**
   * 世代交替（P6 补全，规划 6.2）：核心客户离世/流失时，其子女以继承关系成为新客户。
   * - 继承者带父辈的部分资产与"世交信任"加成入场
   * - 教学点：传承不是剧本而是机制——老客户的一生资产通过子女回流到网点
   */
  private developHeirs(snap: MarketSnapshot) {
    if (this.rng.chance(0.85)) return; // 每月 15% 概率检视一次（发生即有继承事件）
    // 找"故去/迁居"的核心客户（status 非 active 的剧情客户）
    const gone = this.clients.filter((c) => c.status !== 'active' && !c.id.startsWith('cli_gen_') && !this.heirsSpawned.has(c.id));
    if (gone.length === 0) return;
    const parent = gone[0];
    this.heirsSpawned.add(parent.id);
    const heirName = '小' + parent.name.slice(0, 1);
    const heirTier = parent.tier === 'private' ? 'vip' : parent.tier;
    const inheritAmt = Math.round(parent.finance.deposits * 0.5);
    const id = `cli_heir_${parent.id}_${snap.date}`;
    this.clients.push({
      id,
      name: heirName,
      age_2006: this.rng.int(24, 34), // 继承者入场时 24-34 岁
      occupation: `${parent.occupation}之子/女`,
      tier: heirTier,
      risk: { level: Math.max(1, Math.min(5, parent.risk.level)) as 1 | 2 | 3 | 4 | 5, tested_at: snap.date },
      behaviors: ['tech_native'],
      finance: {
        deposits: inheritAmt,
        wealth_mgmt: Math.round(parent.finance.wealth_mgmt * 0.3),
        funds: Math.round(parent.finance.funds * 0.3),
        insurance: 0,
        loans: 0,
        annual_cashflow: Math.round(parent.finance.annual_cashflow * 0.6),
      },
      family: `${parent.name}的子女（世交）`,
      trust: Math.min(80, Math.round(parent.trust * 0.6 + 20)),
      teach_tags: ['succession', 'family_lifecycle'],
      holdings: [],
      status: 'active',
    });
    this.log.push({ date: snap.date, text: `【传承】${parent.name}的子女${heirName}来网点办理继承，带着父辈半生的信任与资产成为你的客户。` });
  }
  /** 已触发过继承的核心客户 id */
  private heirsSpawned = new Set<string>();

  monthScores: number[] = [];
  violations = 0;
  /** 压力 ≥80 的月份数（过劳结局判定用） */
  highStressMonths = 0;
  /** 当月压力 ≥80 的交易日数（过劳口径：≥2/3 交易日算过劳月） */
  monthHotDays = 0;
  /** 当月已演算交易日数 */
  monthTradingDays = 0;
  /** 团队系统（P6-3：卷四末 3-5 名下属；UI 读 members/事件） */
  team: TeamSystem | null = null;
  /** 本月团队事件（rollMonth 产出，UI 帧结算后消费展示） */
  teamEvents: TeamEvent[] = [];
  /** 本年辅导投入等级 0-3（团队面板设置） */
  coachLevel = 0;

  /** 贵宾客户数：金融资产 ≥ 50 万 */
  vipClientCount(): number {
    return this.clients.filter((c) => {
      const total = c.finance.deposits + c.finance.wealth_mgmt + c.finance.funds
        + this.clientPortfolioValue(c.id);
      return total >= 500_000 && c.status === 'active';
    }).length;
  }

  /** 私行客户数：金融资产 ≥ 600 万 */
  privateClientCount(): number {
    return this.clients.filter((c) => {
      const total = c.finance.deposits + c.finance.wealth_mgmt + c.finance.funds
        + this.clientPortfolioValue(c.id);
      return total >= 6_000_000 && c.status === 'active';
    }).length;
  }

  /** 晋升检查：返回各级评审结果 */
  promotionCheck(): PromotionCheckResult[] {
    const ctx = {
      certs: this.player.certs,
      aum: this.player.aum,
      vipClients: this.vipClientCount(),
      privateClients: this.privateClientCount(),
      seasonScore: this.recentSeasonScore(),
      violations: this.violations,
      coached: this.team?.graduatedCount() ?? 0,
    };
    return PROMOTION_PATH.map((req) => checkPromotion(this.player.grade, req, ctx));
  }

  /** 执行晋升（通过评审后调用） */
  applyPromotion(): boolean {
    const results = this.promotionCheck();
    const next = results.find((r) => r.req.grade === this.player.grade + 1);
    if (!next || !next.eligible) return false;
    this.player.grade = next.req.grade;
    this.player.income_month += 2500;
    this.log.push({ date: this.date, text: `【晋升】恭喜！你已晋升为「${next.req.name}」！月薪上调，新职级解锁更粗的时间帧。` });
    return true;
  }

  /** 执行一次行动 */
  doAction(type: ActionType): ActionResult {
    if (this.apUsed >= this.apMax) return { text: this.frame === 'day' ? '今天的时间已经用完了。' : '本帧的行动点已经用完了。' };
    this.apUsed += 1;
    // 消耗精力：帧越粗单次行动消耗略高
    this.player.energy = Math.max(0, this.player.energy - (this.frame === 'month' ? 3 : this.frame === 'week' ? 2 : 1));
    const a = this.player.attrs;
    switch (type) {
      case 'reception':
        return this.actReception();
      case 'lobby': {
        a.fame += 0.5;
        a.stress += 1;
        return { text: '你在厅堂迎接分流，认识了几位新面孔，知名度小幅提升。' };
      }
      case 'outreach': {
        const c = this.pickClient();
        if (!c) return { text: '今天没有可以拜访的客户。' };
        const t = Math.round(this.rng.range(2, 5) + a.comm / 40);
        c.trust = Math.min(100, c.trust + t);
        a.comm += 0.5;
        a.stress += 2;
        return { text: `你拜访了 ${c.name}，聊得很投机，信任 +${t}。`, trust_delta: t };
      }
      case 'study': {
        const g = Math.round(this.rng.range(1, 3));
        a.pro += g * 0.5;
        a.stress += 2;
        return { text: `你学习了金融知识并刷了一套题，专业力 +${(g * 0.5).toFixed(1)}。`, pro_delta: g * 0.5 };
      }
      case 'review': {
        a.pro += 1;
        a.stress += 1;
        return { text: '你复盘了近期行情走势，对市场理解更深了。', pro_delta: 1 };
      }
      case 'aftersale': {
        const c = this.pickClient(true);
        if (!c) return { text: '近期没有需要处理的售后事务。' };
        const ok = this.rng.chance(0.4 + a.comm / 200);
        if (ok) {
          c.trust = Math.min(100, c.trust + 3);
          a.stress += 1;
          return { text: `你妥善处理了 ${c.name} 的售后问题，客户很满意。`, trust_delta: 3 };
        }
        a.stress += 3;
        return { text: `售后沟通不太顺利，${c.name} 还有些不满。`, stress_delta: 3 };
      }
      case 'social': {
        a.stress = Math.max(0, a.stress - 4);
        a.comm += 0.3;
        return { text: '你和同事聊了聊近况，心情放松了不少。', stress_delta: -4 };
      }
      case 'rest': {
        this.player.energy = Math.min(100, this.player.energy + 15);
        a.stress = Math.max(0, a.stress - 6);
        return { text: '你休息了一会儿，精力和压力都缓解了。', stress_delta: -6 };
      }
      default:
        return { text: '……' };
    }
  }

  /** 释放记忆碎片（金手指：方向性提示，调用越多越失准） */
  useMemory(): { text: string; hint: string } {
    const y = Number(this.date.slice(0, 4));
    if (y >= 2018) {
      return { text: '记忆已彻底模糊……', hint: '2018 年之后的前世记忆已归零。外挂会过期，专业不会——靠你自己了。' };
    }
    const pending = this.sim.eventsList
      .filter((e) => e.date && e.date > this.date && (e.type === 'black_swan' || e.force_day))
      .sort((a, b) => (a.date! < b.date! ? -1 : 1));
    this.memoryUses += 1;
    const decay = Math.max(0.25, 1 - this.memoryUses * 0.12);
    if (pending.length === 0) {
      return { text: '你闭上眼搜索前世的记忆……', hint: '近期没有什么特别的预感。（无重大事件记忆）' };
    }
    const next = pending[0];
    const directions = ['似乎要出大事', '心里隐隐不安', '总感觉要变盘'];
    const dir = this.rng.pick(directions);
    const vague = this.rng.chance(1 - decay) || this.memoryUses > 4;
    if (vague) {
      return { text: `记忆碎片闪过：${dir}……但已经想不起细节。`, hint: `模糊预感：${next.title.replace(/「|」/g, '')}前后可能有剧烈波动。（可信度衰减中）` };
    }
    return {
      text: `记忆碎片浮现：${this.date.slice(0, 4)} 年，${dir}。`,
      hint: `前世记忆：未来某日「${next.title}」。方向性提示，无点位无标的。（第 ${this.memoryUses} 次调用，可信度 ${(decay * 100).toFixed(0)}%）`,
    };
  }
  memoryUses = 0;

  private pickClient(problem = false): (typeof this.clients)[number] | null {
    const pool = this.clients.filter((c) => c.status === 'active' && (problem ? c.holdings.length > 0 : true));
    if (pool.length === 0) return null;
    return this.rng.pick(pool);
  }

  private actReception(): ActionResult {
    const c = this.pickClient();
    if (!c) {
      this.player.attrs.fame += 0.3;
      return { text: '今天接待区没有客户，你在厅堂转了转，顺便熟悉了业务手册。' };
    }
    const a = this.player.attrs;
    const roll = this.rng.next();
    const charm = (a.comm + a.sales + a.pro) / 3;
    if (roll < 0.25 + charm / 250) {
      const amt = this.dealAmount(c);
      const prod = this.suggestProduct(c);
      const res = this.executeDeal(c, prod, amt);
      const inc = res.ok ? Math.round(amt * 0.004) : 0;
      a.sales += res.ok ? 0.8 : 0;
      a.stress += 1;
      if (res.ok) {
        return {
          text: `${c.name} 到访。你耐心了解了需求后，推荐了「${prod.name}」，成功成交 ${fmtMoney(amt)}！`,
          trust_delta: 5,
          aum_delta: amt,
          income_delta: inc,
        };
      }
      a.comm += 0.4;
      c.trust = Math.min(100, c.trust + 1);
      return { text: `${c.name} 对「${prod.name}」感兴趣，但 ${res.reason}，本轮未成交。` };
    }
    a.comm += 0.4;
    c.trust = Math.min(100, c.trust + 1);
    a.stress += 1;
    return { text: `${c.name} 到访咨询，你认真解答了疑问，虽未成交但留下了好印象。`, trust_delta: 1 };
  }

  private dealAmount(c: (typeof this.clients)[number]): number {
    const base = c.finance.deposits + c.finance.annual_cashflow * 0.5;
    const already = c.holdings.reduce((s, h) => s + h.amount, 0);
    const poolCap = (c.finance.deposits + c.finance.wealth_mgmt + c.finance.funds + c.finance.annual_cashflow * 0.5) * 0.85;
    const remaining = Math.max(0, poolCap - already);
    const r = this.rng.range(0.1, 0.45);
    const want = base * r;
    // 剩余额度不足时降到可成交的最小合理额；完全没有额度则小额续投（资金再配置）
    const amt = remaining >= want ? want : remaining > 5000 ? remaining * this.rng.range(0.3, 0.7) : Math.min(10000, remaining);
    return Math.max(10000, Math.round(amt / 1000) * 1000);
  }

  /** 客户在我行总持仓现值（盯市） */
  clientPortfolioValue(clientId: string): number {
    const c = this.clients.find((x) => x.id === clientId);
    if (!c) return 0;
    let total = 0;
    for (const h of c.holdings) {
      const p = this.products.find((x) => x.id === h.productId);
      if (!p) { total += h.amount; continue; }
      total += productNavAt(this.sim, p, this.sim.cursor, this.seed) / Math.max(0.0001, h.nav_at_buy) * h.amount;
    }
    return total;
  }

  /** 全体客户持仓市值合计（真实 AUM 盯市） */
  totalPortfolioValue(): number {
    let t = 0;
    for (const c of this.clients) t += this.clientPortfolioValue(c.id);
    return t;
  }

  /** 适当性最小校验 + 推荐产品 */
  suggestProduct(c: ClientDef): ProductDef {
    const prods = this.products.filter((p) => p.risk_level <= c.risk.level && productOnShelf(p, this.date));
    const pool = prods.length ? prods : this.products.filter((p) => p.risk_level === 1 && productOnShelf(p, this.date));
    return this.rng.pick(pool);
  }

  /**
   * 成交：资金池约束（客户可投资资产）+ 净值基准记录 + KPI 归属。
   * 返回 null 表示资金不足/不适当。
   */
  executeDeal(c: (typeof this.clients)[number], p: ProductDef, amount: number): { ok: boolean; reason?: string } {
    if (amount < p.min_amount) return { ok: false, reason: `低于起购金额 ${fmtMoney(p.min_amount)}` };
    if (p.risk_level > c.risk.level) return { ok: false, reason: `超出客户风险承受能力（${c.risk.level} 级客户 vs R${p.risk_level} 产品）` };
    if (!productOnShelf(p, this.date)) return { ok: false, reason: '该产品已不在当年代货架上' };
    const already = c.holdings.reduce((s, h) => s + h.amount, 0);
    const pool = c.finance.deposits + c.finance.wealth_mgmt + c.finance.funds + c.finance.annual_cashflow * 0.5;
    if (already + amount > pool * 0.85) return { ok: false, reason: '超出客户可投资资产的合理比例' };
    const nav = productNavAt(this.sim, p, this.sim.cursor, this.seed);
    c.holdings.push({ productId: p.id, amount, nav_at_buy: nav, bought_at: this.date });
    this.player.aum += amount;
    c.trust = Math.min(100, c.trust + 5);
    aumGainBuffer.push(amount);
    if (p.category === 'deposit') this.kpi.deposit_done += amount;
    else if (p.category === 'wealth_mgmt') this.kpi.wm_done += amount;
    else if (p.category === 'fund') this.kpi.fund_done += amount;
    else if (p.category === 'insurance') this.kpi.ins_done += amount;
    return { ok: true };
  }

  seed = 42;

  products: ProductDef[] = [];

  gradeName(): string {
    return GRADE_NAMES[this.player.grade];
  }
}

function inEra(p: ProductDef, date: IsoDate): boolean {
  if (!p.era) return true;
  const y = Number(date.slice(0, 4));
  return y >= p.era[0] && y <= p.era[1];
}

/** 月度新增 AUM 累计（供薪资绩效） */
export const aumGainBuffer: number[] = [];

/** 随机生成客户的姓氏池 */
const GENERATED_NAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];

export function fmtMoney(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return `${Math.round(n)}`;
}
