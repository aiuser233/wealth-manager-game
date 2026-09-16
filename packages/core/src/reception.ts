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
  {
    tag: 'biz_split',
    surface: '厂里账上趴着几百万，放定期太死，买理财又怕误了货款周转。',
    probes: [
      { text: '账上的钱大概多久要付一次货款？', reveal: '旺季三个月内要付两笔，平时是随收随付。', trustDelta: 2, proDelta: 0.5 },
      { text: '家庭资产和公司账是分开管吗？', reveal: '  大都混在一起……你这么一问，确实没分开。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '企业闲置资金的流动性分层+家企隔离缺失是本案双风险点。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.55,
  },
  {
    tag: 'study_abroad',
    surface: '女儿明年去国外读研，一年学费生活费先换 50 万，怎么换最划算？',
    probes: [
      { text: '学费是一次性缴还是分期？', reveal: '每学期缴，生活费按月给。', trustDelta: 2, proDelta: 0.4 },
      { text: '孩子的保险和紧急备用金配了吗？', reveal: '保险没买，备用金没概念。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '购汇额度内分批换汇+留购汇凭证，是合规与汇率双约束下的标准方案。',
    preferCategory: 'deposit',
    intentRatio: 0.6,
  },
  {
    tag: 'house_wealth',
    surface: '有套房子闲着，有人劝我抵押出来买理财，收益比房租高多了。',
    probes: [
      { text: '这套房将来自用还是出售？', reveal: '儿子结婚可能要用，但一时半会儿不用。', trustDelta: 2, proDelta: 0.5 },
      { text: '如果理财亏了，月供拿什么还？', reveal: '……这个没想过。', trustDelta: 1, proDelta: 0.6 },
    ],
    hidden: '加杠杆配置=风险叠加；先排除"将来要用的资产"做抵押，杠杆是本案第一禁词。',
    preferCategory: 'fund',
    intentRatio: 0.3,
  },
  {
    tag: 'wedding_fund',
    surface: '儿子两年后结婚，准备 80 万婚房首付，现在放哪好？',
    probes: [
      { text: '首付时间定死了还是可能提前？', reveal: '最迟两年，但行情好可能提前。', trustDelta: 2, proDelta: 0.4 },
      { text: '婚房之外，小两口的启动资金呢？', reveal: '他们自己有些存款。', trustDelta: 1, proDelta: 0.3 },
    ],
    hidden: '两年期限刚性+可能提前，这笔钱只能放高流动性保本类；收益再香也不能锁。',
    preferCategory: 'deposit',
    intentRatio: 0.7,
  },
  {
    tag: 'pension_topup',
    surface: '社保养老金太少，我想再攒一份"自己的养老金"，每月拿 3000 出来。',
    probes: [
      { text: '打算多久后开始领这笔钱？', reveal: '大概 15 年，退休后按月领。', trustDelta: 2, proDelta: 0.4 },
      { text: '这笔钱中途急用能不能取？', reveal: '最好别动，动了就前功尽弃。', trustDelta: 2, proDelta: 0.5 },
    ],
    hidden: '超长期限+中途不可动：个人养老金账户+养老目标基金定投，制度锁定是需求不是限制。',
    preferCategory: 'insurance',
    intentRatio: 0.4,
  },
  {
    tag: 'payroll_biz',
    surface: '我们公司刚迁来，员工工资代发想换到你们这，能有什么"优惠"？',
    probes: [
      { text: '员工大概多少人、每月几号发薪？', reveal: '200 来人，每月 15 号。', trustDelta: 1, proDelta: 0.3 },
      { text: '员工最在意的，你猜是补贴还是便利？', reveal: '到账快、手续费少、能贷款吧。', trustDelta: 2, proDelta: 0.4 },
    ],
    hidden: '对公需求带零售入口：代发落地后跟进员工服务（工资自动理财/消费贷），先服务后营销。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.5,
  },
  {
    tag: 'windfall_house',
    surface: '家里房子拆迁，赔了四套房加 300 万现金，这钱怎么放？',
    probes: [
      { text: '这笔钱近几年有没有确定的大用途（换房/子女婚嫁/养老）？', reveal: '给小儿子结婚留了一份，养老要用一份，剩下的没想过。', trustDelta: 2, proDelta: 0.4 },
      { text: '家里人对怎么管这笔钱意见一致吗？', reveal: '老伴想全存银行，儿子想做点投资。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '拆迁款是"一笔进来、多口人盯着"的钱：先做用途分层与家庭共识，再谈配置——防骗防挥霍也是本案要点。',
    preferCategory: 'deposit',
    intentRatio: 0.5,
  },
  {
    tag: 'policy_review',
    surface: '十年前买的分红险，每年交两万，现在退保能拿多少？',
    probes: [
      { text: '把保单现金价值表找出来，先算清"现在退 vs 继续交"的总账。', reveal: '退的话才拿回六万多……交了八年了。', trustDelta: 2, proDelta: 0.6 },
      { text: '当时买这份保单，主要想解决什么问题？', reveal: '就是存个钱，当时说比银行高。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '老保单检视的关键不是退不退，而是把"已交的沉没成本"和"未来的现金流"分开算，避免情绪化退保。',
    preferCategory: 'insurance',
    intentRatio: 0.3,
  },
  {
    tag: 'pension_draw',
    surface: '下个月退休了，个人账户里的养老金怎么领最划算？',
    probes: [
      { text: '退休后计划每月固定支出多少？有没有其他现金流？', reveal: '老伴还有退休金，我主要是补贴日常。', trustDelta: 2, proDelta: 0.4 },
      { text: '一次性领取还是按月领取，了解过税的区别吗？', reveal: '听说一次性领要合并计税？', trustDelta: 1, proDelta: 0.5 },
    ],
    hidden: '养老金领取方式（按月/分次/一次性）的税负与长寿风险差异大；按月领取对多数人最优。',
    preferCategory: 'deposit',
    intentRatio: 0.25,
  },
  {
    tag: 'family_succession',
    surface: '我身体出过毛病，想趁脑子清楚，把该交代的事都交代了。',
    probes: [
      { text: '家庭资产的大致结构清楚吗（房产/存款/保单/股权）？', reveal: '两套房、存款不多，公司还有点股份，还有两份保单。', trustDelta: 2, proDelta: 0.5 },
      { text: '最担心的是什么：分不拢、分错人，还是被债牵连？', reveal: '都怕……主要是怕孩子将来扯皮。', trustDelta: 2, proDelta: 0.4 },
    ],
    hidden: '传承需求的第一步不是产品，是家庭结构与债务底数盘点；遗嘱+受益人+保单架构三件套先搭起来。',
    preferCategory: 'insurance',
    intentRatio: 0.4,
  },
  {
    tag: 'edu_time_lock',
    surface: '孩子还有八年上大学，听说教育金要专款专用，怎么个专法？',
    probes: [
      { text: '家里打算每年为这笔钱固定留多少？这笔钱能接受波动吗？', reveal: '一年存两三万吧，最好别亏。', trustDelta: 2, proDelta: 0.5 },
      { text: '除了学费，有没有想过大学四年的生活费和可能的留学备选？', reveal: '生活费倒是没细算……留学看情况。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '教育金的关键是时点刚性：越临近用款越要保守化，确定性工具优先，增值靠早期的权益定投。',
    preferCategory: 'insurance',
    intentRatio: 0.4,
  },
  {
    tag: 'income_shock',
    surface: '公司裁员名单上有我，下个月开始没有工资了，房贷和孩子的补习班怎么办？',
    probes: [
      { text: '现在账上能动用的钱够几个月的基本开销？', reveal: '加上活期和货基，大概四个月。', trustDelta: 2, proDelta: 0.5 },
      { text: '哪些支出可以立刻停、哪些绝对不能断？', reveal: '补习班可以停……房贷断不得，保险是不是也不能断？', trustDelta: 2, proDelta: 0.5 },
    ],
    hidden: '收入中断月的核心是开关顺序：先停投资定投、动用应急垫、协商房贷延期，保障型保费最后停。',
    preferCategory: 'deposit',
    intentRatio: 0.3,
  },
  {
    tag: 'biz_debt_split',
    surface: '厂子最近周转紧张，我个人的房子和存款会不会被供应商追债追进去？',
    probes: [
      { text: '公司是有限责任还是个体户/合伙？厂里的债务有没有拿家里资产做过担保？', reveal: '有限责任公司……但去年给一笔贷款用房子签了担保。', trustDelta: 2, proDelta: 0.6 },
      { text: '对公账户和家庭账户现在分得开吗？', reveal: '有时候货款直接打到我个人卡上。', trustDelta: 1, proDelta: 0.5 },
    ],
    hidden: '家企隔离的边界在担保与账户混同处失效：先盘担保敞口，再彻底分账，最后谈保护性安排的合法边界。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.3,
  },
  {
    tag: 'kids_lucky_money',
    surface: '过完年孩子的压岁钱攒了小两万，想着别乱花掉，怎么安排？',
    probes: [
      { text: '这笔钱打算给孩子用到什么时候——中学、大学，还是更长远？', reveal: '没想那么远，至少大学之前不动吧。', trustDelta: 2, proDelta: 0.5 },
      { text: '想让孩子自己参与管理吗？', reveal: '他上小学了，倒是该学学了。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '压岁钱三笔法：储蓄打底+教育金定投+留一小笔让孩子做真实决策，财商教育比利率重要。',
    preferCategory: 'deposit',
    intentRatio: 0.5,
  },
  {
    tag: 'shebao_transfer',
    surface: '我要去外地工作了，社保和公积金怎么转？听说有中介能代缴？',
    probes: [
      { text: '新城市的社保断了多久了？有没有正规单位接收？', reveal: '下个月新公司入职，中间就空一个月。', trustDelta: 2, proDelta: 0.5 },
      { text: '"代缴挂靠"的渠道了解过风险吗？', reveal: '朋友推荐的，说一年几百块……', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '社保转移走官方渠道免费且时限明确；"代缴挂靠"涉嫌骗保，补缴焦虑要用正确渠道化解而不是中介。',
    preferCategory: 'deposit',
    intentRatio: 0.1,
  },
  {
    tag: 'digital_legacy',
    surface: '我身体还行，就是想问一句：手机里的理财账户、那些虚拟的东西，人不在了家里人怎么拿？',
    probes: [
      { text: '您名下有哪些数字资产——互联网理财、虚拟币、游戏账号？', reveal: '理财好几个 App，还有点虚拟币，游戏账号小孩还想要。', trustDelta: 2, proDelta: 0.5 },
      { text: '家里人知道这些账户的存在吗？', reveal: '老伴连密码都不知道。', trustDelta: 2, proDelta: 0.4 },
    ],
    hidden: '数字遗产的权属受平台协议与法律空白双重限制：先做数字资产清单+备忘录，法律工具兜底，虚拟币处置要讲清合规风险。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.2,
  },
  {
    tag: 'pension_inherit',
    surface: '我爸走了，他那个个人养老金账户里还有钱，我们做子女的到底能不能领、怎么领？',
    probes: [
      { text: '账户里现在是多少？之前有没有指定过受益人？', reveal: '大概十几万，受益人没指定过，全凭记忆填的。', trustDelta: 2, proDelta: 0.5 },
      { text: '家里现在急着用钱吗？这笔钱短期要不要动？', reveal: '要还一笔房贷，但听说养老钱领出来要交税？', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '个人养老金账户可依法继承，但领取环节有税：先查余额与受益人登记，算清"现在领 vs 持有到退休"的税差与流动性代价。',
    preferCategory: 'wealth_mgmt',
    intentRatio: 0.4,
  },
  {
    tag: 'pet_family',
    surface: '我平时最放心不下的就是家里那只猫，人出事了它怎么办？有没有能顾上它的安排？',
    probes: [
      { text: '平时是谁在管它？有备选接手的人吗？', reveal: '就我一个，朋友都住得远，真出事了怕没人管。', trustDelta: 2, proDelta: 0.5 },
      { text: '您考虑过把"它"写进自己的保障和身后安排里吗？', reveal: '没想过，但确实该想想，它才是我最想留下的牵挂。', trustDelta: 2, proDelta: 0.6 },
    ],
    hidden: '宠物不是法律意义上的"继承人"，但可用"保险年金+指定受托+生前委托"组合为它留一笔托管与照护资金，兼顾保障缺口与身后安排。',
    preferCategory: 'insurance',
    intentRatio: 0.15,
  },
  {
    tag: 'newcitizen_house',
    surface: '我们一家三口刚来这座城市，攒了点钱，想问问首套房首付怎么备最稳？会不会被坑？',
    probes: [
      { text: '你们目前月现金流大概多少？手上活钱有多少？', reveal: '每月到手两万多，存款十几万，想留点应急的。', trustDelta: 2, proDelta: 0.5 },
      { text: '首付是全现金还是准备用消费贷凑？', reveal: '朋友说可以贷出来补首付，这样划算吗？', trustDelta: 2, proDelta: 0.5 },
    ],
    hidden: '新市民首套房的三笔钱：首付合规来源（消费贷补首付有政策与利率双风险）、留足 6-12 月应急金、月供压在现金流 40% 内，先稳后省。',
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
    return this.openWith(c);
  }

  /** A3 预约到访：指定客户开局（预约队列消费时用；客户不存在/休眠返回 null） */
  startFor(clients: Array<ClientDef & { status?: string }>, clientId: string): ReceptionSession | null {
    const c = clients.find((x) => x.id === clientId && (x.status ?? 'active') === 'active');
    if (!c) return null;
    return this.openWith(c);
  }

  /** 共用：对指定客户掷需求并生成会话 */
  private openWith(c: ClientDef & { status?: string }): ReceptionSession {
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
