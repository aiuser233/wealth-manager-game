import type { ProductDef, ClientDef } from './types';
import type { Rng } from './rng';

/**
 * 接待对话玩法（规划书 4.2 "接待 → 诊断 → 方案 → 成交"）：
 * - 客户到访：表面诉求 + 隐藏需求（挖潜后可见）
 * - 玩家选择话题挖潜 → 得到真实需求与资金线索
 * - 推荐产品：适当性 + 资金池校验 → 成交/被拒/未成交
 * - 话术差异影响信任与成交率
 */

export interface ReceptionNeed {
  /** 需求标签 */
  tag: string;
  /** 表面诉求（客户第一句话） */
  surface: string;
  /** 挖潜问题（玩家可选项） */
  probes: Array<{ text: string; reveal: string; trustDelta: number; proDelta: number }>;
  /** 挖潜后的真实需求描述 */
  hidden: string;
  /** 适配的产品类别偏好 */
  preferCategory: ProductDef['category'];
  /** 意向资金比例（相对可投资池） */
  intentRatio: number;
}

export interface ReceptionSession {
  clientId: string;
  clientName: string;
  /** 可投资池（元） */
  pool: number;
  need: ReceptionNeed;
  /** 已挖潜次数 */
  probed: number;
  /** 是否已揭示真实需求 */
  revealed: boolean;
  /** 信任变化累计 */
  trustGained: number;
  /** 挖潜是否顺利（影响成交率） */
  rapport: number;
  /** 推荐历史（防重复） */
  offered: string[];
}

const NEED_POOL: ReceptionNeed[] = [
  {
    tag: 'deposit_safe',
    surface: '我想把卡里的钱转成定期，你看划算吗？',
    probes: [
      { text: '这笔钱多久不用？', reveal: '短期内不用，但两年后孩子上大学要用。', trustDelta: 2, proDelta: 0.5 },
      { text: '平时有没有应急的钱？', reveal: '留了些活期，应急够用。', trustDelta: 1, proDelta: 0.3 },
    ],
    hidden: '两年期限的刚性支出，适合国债或定期，不宜权益类。',
    preferCategory: 'other',
    intentRatio: 0.5,
  },
  {
    tag: 'fund_growth',
    surface: '最近基金涨得厉害，我想买点收益高的！',
    probes: [
      { text: '您能接受账面亏损吗？', reveal: '亏太多肯定睡不着……最好别亏。', trustDelta: 2, proDelta: 0.5 },
      { text: '之前买过基金吗？', reveal: '没买过，看邻居赚了才心动。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '追涨型新手，风险承受其实不足，需要适当性教育与均衡配置。',
    preferCategory: 'fund',
    intentRatio: 0.35,
  },
  {
    tag: 'family_plan',
    surface: '孩子刚出生，想存点教育金，有什么推荐？',
    probes: [
      { text: '每月能固定存多少？', reveal: '大概每月两三千吧，要长期坚持。', trustDelta: 2, proDelta: 0.5 },
      { text: '家里保障配齐了吗？', reveal: '大人就单位医保，好像没买过商业保险。', trustDelta: 2, proDelta: 0.6 },
    ],
    hidden: '先保障后理财：大人保障缺口明显，再谈教育金定投。',
    preferCategory: 'insurance',
    intentRatio: 0.25,
  },
  {
    tag: 'pension',
    surface: '我快退休了，这些钱怎么安排稳妥？',
    probes: [
      { text: '退休后每月开销大概多少？', reveal: '和老伴加起来五六千吧。', trustDelta: 2, proDelta: 0.5 },
      { text: '对本金波动怎么看？', reveal: '养老钱，一点都不能亏。', trustDelta: 2, proDelta: 0.4 },
    ],
    hidden: '典型保守型养老需求：存款+国债+低波理财组合，严禁高波动产品。',
    preferCategory: 'deposit',
    intentRatio: 0.6,
  },
  {
    tag: 'business_cash',
    surface: '厂里回款了几百万，暂时用不上，放着也是放着。',
    probes: [
      { text: '大概多久可能用到？', reveal: '说不准，也许三五个月，也许半年。', trustDelta: 2, proDelta: 0.5 },
      { text: '公司对公账户也在这里吗？', reveal: '在的，结算都在你们行。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '企业间歇资金：现金管理类/短债为主，兼顾流动性与收益。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.55,
  },
  {
    tag: 'yield_chase',
    surface: '隔壁行有个产品收益比你们高，你们有什么办法？',
    probes: [
      { text: '方便说说是什么产品吗？', reveal: '没细问，反正说是保本高息。', trustDelta: 1, proDelta: 0.8 },
      { text: '收益之外，您更看重什么？', reveal: '钱安全肯定第一……', trustDelta: 2, proDelta: 0.5 },
    ],
    hidden: '"保本高息"是典型高风险信号，防诈骗与合规话术是本题眼。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.4,
  },
  {
    tag: 'house_vs_invest',
    surface: '手里有点钱，你说我是提前还房贷，还是做投资？',
    probes: [
      { text: '您房贷利率多少？', reveal: '当年的，还挺高的。', trustDelta: 2, proDelta: 0.6 },
      { text: '这笔钱五年内有大用途吗？', reveal: '没有，就是闲着。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '利率与预期收益的比较题：引导算账而不是替客户拍板。',
    preferCategory: 'fund',
    intentRatio: 0.45,
  },
  {
    tag: 'gold_hedge',
    surface: '金价又创新高，我现在买黄金还来得及吗？',
    probes: [
      { text: '您打算配多少比例？', reveal: '想着全仓黄金呢，涨得多好啊。', trustDelta: 1, proDelta: 0.7 },
      { text: '组合里其他资产呢？', reveal: '其他就存款和一点基金。', trustDelta: 2, proDelta: 0.5 },
    ],
    hidden: '追涨全仓单一资产：讲配置比例与波动，纸黄金小额配置即可。',
    preferCategory: 'other',
    intentRatio: 0.3,
  },
];

export class Reception {
  private rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  /** 开启一场接待：挑客户 + 掷需求 */
  start(clients: Array<ClientDef & { status?: string }>): ReceptionSession | null {
    const pool = clients.filter((c) => (c.status ?? 'active') === 'active');
    if (pool.length === 0) return null;
    const c = this.rng.pick(pool);
    const need = this.rng.pick(NEED_POOL);
    const fin = c.finance;
    const investable = (fin.deposits + fin.wealth_mgmt + fin.funds) * 0.4 + fin.annual_cashflow * 0.3;
    return {
      clientId: c.id,
      clientName: c.name,
      pool: Math.max(10000, Math.round(investable)),
      need,
      probed: 0,
      revealed: false,
      trustGained: 0,
      rapport: 0,
      offered: [],
    };
  }

  /** 挖潜一次 */
  probe(s: ReceptionSession, probeIdx: number): { reply: string; trustDelta: number } {
    const p = s.need.probes[probeIdx];
    if (!p) return { reply: '……', trustDelta: 0 };
    s.probed += 1;
    s.trustGained += p.trustDelta;
    s.rapport += 1;
    if (s.probed >= 2) s.revealed = true;
    return { reply: p.reveal, trustDelta: p.trustDelta };
  }

  /**
   * 评估推荐：返回成交判断。
   * - 适当性：产品风险等级 > 客户测评等级 → 被拒（教学点）
   * - 类别匹配：契合 hidden 需求则成功率大增
   * - rapport：挖潜越充分，成交率越高
   */
  evaluate(
    s: ReceptionSession,
    product: ProductDef,
    client: ClientDef,
    amount: number,
  ): { deal: boolean; reason: string; trustDelta: number } {
    if (product.risk_level > client.risk.level) {
      return { deal: false, reason: `适当性不符：R${product.risk_level} 产品超出客户 R${client.risk.level} 的承受能力，客户签不了字。`, trustDelta: -2 };
    }
    if (amount < product.min_amount) {
      return { deal: false, reason: `低于「${product.name}」起购金额，客户皱了皱眉。`, trustDelta: -1 };
    }
    if (amount > s.pool * 0.95) {
      return { deal: false, reason: '客户犹豫了：金额超出了他愿意动用的范围。', trustDelta: -1 };
    }
    const catMatch = product.category === s.need.preferCategory ? 0.35 : 0;
    const rapportBonus = Math.min(0.3, s.probed * 0.15);
    const revealedBonus = s.revealed ? 0.1 : 0;
    const base = 0.3 + catMatch + rapportBonus + revealedBonus;
    const deal = this.rng.chance(Math.min(0.92, base));
    if (deal) {
      return { deal: true, reason: '需求对上了，客户当场办理。', trustDelta: 4 + s.probed };
    }
    return { deal: false, reason: s.revealed ? '客户说要回去想想，留了张你的名片。' : '客户觉得你没说到点子上，起身走了。', trustDelta: s.revealed ? 1 : 0 };
  }
}
