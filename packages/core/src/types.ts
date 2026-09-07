/** 游戏内日期（ISO 字符串，如 "2006-01-09"）。用字符串而非 Date 以保证跨平台序列化稳定。 */
export type IsoDate = string;

/** 时间帧档位 */
export type TimeFrame = 'day' | 'week' | 'month';

/** 事件类型 */
export type GameEventType =
  | 'macro'        // 宏观数据 / 政策
  | 'policy'       // 监管政策
  | 'director'     // 导演剧本事件（历史蓝本行情）
  | 'black_swan'   // 黑天鹅
  | 'seasonal'     // 季节性（开门红、月末冲量等）
  | 'client'       // 客户相关
  | 'random';      // 随机事件

/** 因子冲击：因子 id -> 日收益率冲击（小数）或绝对利率变化（由因子类型决定） */
export type FactorShocks = Record<string, number>;

export interface GameEventDef {
  id: string;
  /** 触发日期；导演事件有确切日期，随机事件由引擎掷骰 */
  date?: IsoDate;
  type: GameEventType;
  title: string;
  /** 新闻流文案（架空媒体） */
  news?: string;
  /** 复盘卡 id */
  debrief?: string;
  /** 解锁知识点 */
  unlock_knowledge?: string[];
  /** 对因子的冲击 */
  shocks?: FactorShocks;
  /** 持续天数（冲击衰减施加），默认 1 */
  duration_days?: number;
  /** 情绪冲击（-3..3） */
  sentiment?: number;
  /** 年代标签（用于随机事件池过滤） */
  era_tags?: string[];
  /** 是否必须切回日帧处理 */
  force_day?: boolean;
}

export interface MarketFactorDef {
  id: string;
  name: string;
  /** global | domestic */
  layer: 'global' | 'domestic';
  /** 初始值。价格型因子=指数点位；利率型=小数（0.03 = 3%） */
  start: number;
  /** 除非率型外，年化漂移（对数收益） */
  drift_pa?: number;
  /** 日波动率 */
  sigma_daily: number;
  /** 均值回复强度（0-1），向 anchor 回复 */
  mean_revert?: number;
  /** 回复锚点；缺省用 start */
  anchor?: number;
  /** 是否利率型（值变化直接进入其他因子 loading，而非百分比收益） */
  is_rate?: boolean;
  /** 利率型因子的下限 */
  floor?: number;
  unit: 'index' | 'rate' | 'fx' | 'spread';
}

export interface IndustryIndexDef {
  id: string;
  name: string;
  family: 'financial_realestate' | 'cyclical' | 'consumer' | 'pharma' | 'tech' | 'utility';
  start: number;
  /** 因子暴露（β） */
  loadings: FactorShocks;
  /** 行业自身额外日波动率（特质噪声） */
  idio_sigma: number;
  /** 行业特质年化漂移 */
  drift_pa?: number;
}

/** 经济数据发布项 */
export interface EconReleaseDef {
  id: string;
  name: string;
  region: 'cn' | 'us';
  freq: 'monthly' | 'quarterly' | 'irregular';
  /** 每月第几日左右（工作日序号） */
  day_hint?: number;
  /** 超预期时的因子冲击 */
  impact_beat: FactorShocks;
  /** 不及预期时的因子冲击 */
  impact_miss: FactorShocks;
  /** 单位说明 */
  note?: string;
}

/** 玩家行动类型 */
export type ActionType =
  | 'reception'      // 接待客户
  | 'lobby'          // 厅堂轮值
  | 'outreach'       // 外拓拜访
  | 'study'          // 学习刷题
  | 'review'         // 复盘行情
  | 'aftersale'      // 处理售后/客诉
  | 'social'         // 社交/同事关系
  | 'rest';          // 休息

export interface ActionResult {
  text: string;
  trust_delta?: number;
  pro_delta?: number;      // 专业力
  comm_delta?: number;     // 沟通力
  sales_delta?: number;    // 销售力
  stress_delta?: number;
  aum_delta?: number;
  income_delta?: number;
}

export interface ClientHolding {
  productId: string;
  amount: number;
  /** 买入日净值（或 1.0 起） */
  nav_at_buy: number;
  /** 买入日期 */
  bought_at: IsoDate;
}

export interface ClientDef {
  id: string;
  name: string;
  age_2006: number;
  occupation: string;
  tier: 'mass' | 'wealth' | 'vip' | 'private';
  risk: { level: 1 | 2 | 3 | 4 | 5; tested_at: IsoDate };
  behaviors: string[];
  finance: {
    deposits: number;
    wealth_mgmt: number;
    funds: number;
    insurance: number;
    loans: number;
    annual_cashflow: number;
  };
  family: string;
  trust: number;
  teach_tags: string[];
  /** 剧情线 id（核心客户有，随机客户无） */
  questline?: string;
}

/** 产品类别 */
export type ProductCategory = 'deposit' | 'wealth_mgmt' | 'fund' | 'insurance' | 'other' | 'private';

export interface ProductDef {
  id: string;
  name: string;
  category: ProductCategory;
  risk_level: 1 | 2 | 3 | 4 | 5;
  min_amount: number;
  term_days: number;
  issuer: string;
  /** 业绩比较基准（年化） */
  benchmark_pa: number;
  /** 年代可用区间 [起始年, 结束年]（含），null=全程 */
  era?: [number, number] | null;
  nav_model?: {
    loadings: FactorShocks;
    /** 固定票息（年化） */
    coupon_pa: number;
    fee_pa: number;
    idio_sigma: number;
  };
  /** 固定利率型（存款等，不随市场） */
  fixed_rate_pa?: number;
  desc?: string;
}

/** 行情快照（某交易日） */
export interface MarketSnapshot {
  date: IsoDate;
  /** 因子值：利率为小数，价格指数为点位 */
  factors: Record<string, number>;
  /** 行业指数点位 */
  industries: Record<string, number>;
  /** 宽基指数点位（由因子合成） */
  indices: Record<string, number>;
  sentiment: number; // -3..3
}

export interface SaveDataV1 {
  version: 1;
  seed: number;
  /** 游戏内当前日期 */
  date: IsoDate;
  /** 已演算到的因子状态 */
  market: {
    factor_state: Record<string, number>;
    industry_state: Record<string, number>;
    sentiment: number;
    factor_day: number;
  };
  player: {
    name: string;
    gender: 'm' | 'f';
    grade: number; // 0见习 1普通 2贵宾 3私行 4主管
    attrs: { pro: number; comm: number; sales: number; stress: number; rep: number; fame: number };
    energy: number;
    aum: number;
    cash_month_income: number;
    certs: string[];
  };
  clients: Array<ClientDef & { holdings: ClientHolding[]; status: 'active' | 'dormant' | 'lost' }>;
  kpi: {
    year: number; month: number;
    deposit_target: number; deposit_done: number;
    wm_target: number; wm_done: number;
    fund_target: number; fund_done: number;
    ins_target: number; ins_done: number;
  };
  log: Array<{ date: IsoDate; text: string }>;
}

export const GRADE_NAMES = ['见习理财经理', '普通理财经理', '贵宾理财经理', '私行理财经理', '私行团队主管'] as const;

export const RISK_LEVEL_NAMES = ['', 'R1 保守型', 'R2 稳健型', 'R3 平衡型', 'R4 成长型', 'R5 进取型'] as const;

export const TIER_NAMES = { mass: '大众客户', wealth: '财富客户', vip: '贵宾客户', private: '私行客户' } as const;

export const ACTION_NAMES: Record<ActionType, string> = {
  reception: '接待客户',
  lobby: '厅堂轮值',
  outreach: '外拓拜访',
  study: '学习刷题',
  review: '复盘行情',
  aftersale: '售后处理',
  social: '同事互动',
  rest: '休息调整',
};

export const ACTION_DESC: Record<ActionType, string> = {
  reception: '面对面接待到访客户，挖掘需求、推荐产品（可能成交）',
  lobby: '在大堂迎接分流，接触潜客，积累新客户',
  outreach: '拜访存量客户，维护关系，提升信任',
  study: '学习金融知识与刷题，提升专业力与考试通过率',
  review: '复盘当日行情，理解市场，提升专业力',
  aftersale: '处理客户售后问题与投诉，挽回信任',
  social: '与同事互动，改善团队关系与心情',
  rest: '放松身心，恢复精力，降低压力',
};
