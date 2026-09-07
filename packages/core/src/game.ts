import type { ProductDef, ClientDef, IsoDate, MarketSnapshot, ActionResult, ActionType } from './types';
import { GRADE_NAMES } from './types';
import { Rng } from './rng';
import { MarketSim } from './market';

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
  /** 今日已用行动点 */
  apUsed = 0;
  apMax = 4;
  /** 最近快照（UI 展示） */
  lastSnap: MarketSnapshot | null = null;
  /** 上次查看行情的快照（用于"距上次查看"涨跌） */
  lastViewedSnap: MarketSnapshot | null = null;

  constructor(sim: MarketSim, cal: any, seed: number, clients: ClientDef[]) {
    this.sim = sim;
    this.cal = cal;
    this.rng = new Rng(seed ^ 0x9e3779b9);
    this.clients = clients.map((c) => ({ ...c, holdings: [], status: 'active' as const }));
  }

  get date(): IsoDate {
    return this.cal.at(Math.max(0, this.sim.cursor - 1));
  }

  /** 推进 n 个交易日（执行完今日行动后调用） */
  advanceDays(n: number) {
    for (let i = 0; i < n; i++) {
      this.apUsed = 0;
      const snap = this.sim.stepToNext();
      this.lastSnap = snap;
      for (const nw of this.sim.newsFeed) {
        if (nw.date === snap.date) this.hooks.onNews?.(nw);
      }
      for (const r of this.sim.releaseLog) {
        if (r.date === snap.date) this.hooks.onRelease?.(r);
      }
      // 月切换时重置 KPI
      const prev = this.cal.at(Math.max(0, this.sim.cursor - 2));
      if (prev && prev.slice(0, 7) !== snap.date.slice(0, 7)) {
        this.rollMonth(snap);
      }
    }
  }

  private rollMonth(snap: MarketSnapshot) {
    const y = Number(snap.date.slice(0, 4));
    const m = Number(snap.date.slice(5, 7));
    const growth = y - 2006;
    this.kpi = {
      year: y,
      month: m,
      deposit_target: 300_000 * (1 + growth * 0.15),
      deposit_done: 0,
      wm_target: 500_000 * (1 + growth * 0.18),
      wm_done: 0,
      fund_target: 300_000 * (1 + growth * 0.2),
      fund_done: 0,
      ins_target: 100_000 * (1 + growth * 0.22),
      ins_done: 0,
    };
    const salary = 4500 + this.player.grade * 1500;
    const bonus = Math.round(this.player.aum * 0.0002);
    this.log.push({
      date: snap.date,
      text: `【${y}年${m}月】新的一月开始，KPI 已更新。上月工资 ${fmtMoney(salary)} + 绩效 ${fmtMoney(bonus)}。`,
    });
  }

  /** 执行一次行动 */
  doAction(type: ActionType): ActionResult {
    if (this.apUsed >= this.apMax) return { text: '今天的时间已经用完了。' };
    this.apUsed += 1;
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
      c.holdings.push({ productId: prod.id, amount: amt, nav_at_buy: 1, bought_at: this.date });
      this.player.aum += amt;
      c.trust = Math.min(100, c.trust + 5);
      const inc = Math.round(amt * 0.004);
      a.sales += 0.8;
      a.stress += 1;
      if (prod.category === 'deposit') this.kpi.deposit_done += amt;
      else if (prod.category === 'wealth_mgmt') this.kpi.wm_done += amt;
      else if (prod.category === 'fund') this.kpi.fund_done += amt;
      else if (prod.category === 'insurance') this.kpi.ins_done += amt;
      return {
        text: `${c.name} 到访。你耐心了解了需求后，推荐了「${prod.name}」，成功成交 ${fmtMoney(amt)}！`,
        trust_delta: 5,
        aum_delta: amt,
        income_delta: inc,
      };
    }
    a.comm += 0.4;
    c.trust = Math.min(100, c.trust + 1);
    a.stress += 1;
    return { text: `${c.name} 到访咨询，你认真解答了疑问，虽未成交但留下了好印象。`, trust_delta: 1 };
  }

  private dealAmount(c: ClientDef): number {
    const base = c.finance.deposits + c.finance.annual_cashflow * 0.5;
    const r = this.rng.range(0.1, 0.45);
    return Math.max(10000, Math.round((base * r) / 1000) * 1000);
  }

  /** 适当性最小校验 + 推荐产品 */
  suggestProduct(c: ClientDef): ProductDef {
    const prods = this.products.filter((p) => p.risk_level <= c.risk.level && inEra(p, this.date));
    const pool = prods.length ? prods : this.products.filter((p) => p.risk_level === 1 && inEra(p, this.date));
    return this.rng.pick(pool);
  }

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

export function fmtMoney(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return `${Math.round(n)}`;
}
