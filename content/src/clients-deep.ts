import type { ClientDef } from '@fm/core';

/**
 * 深化批新增客户（12 位）：覆盖空缺客群（个体户/外贸/拆迁/海归/县城教师/货车司机/网贷踩坑/前基金经理/直播创业/出口商/返聘工程师/留学生家庭），
 * 与 2013 汇改、2016 拆迁、2018 网贷、2021 抱团等年代事件呼应。
 */
export const deepClients: ClientDef[] = [
  {
    id: 'cli_d_sanhui', name: '范同和', age_2006: 44, occupation: '三代同堂个体户（建材零售）', tier: 'wealth',
    risk: { level: 2, tested_at: '2006-02-10' },
    behaviors: ['cashflow_sensitive', 'risk_averse'],
    finance: { deposits: 600000, wealth_mgmt: 0, funds: 0, insurance: 50000, loans: 300000, annual_cashflow: 360000 },
    family: '夫妻店，两位老人同住，儿子读初中',
    trust: 30, teach_tags: ['cash_mgmt', 'education_fund', 'family_lifecycle'],
  },
  {
    id: 'cli_d_trade', name: '罗世海', age_2006: 38, occupation: '外贸企业主', tier: 'vip',
    risk: { level: 4, tested_at: '2006-03-01' },
    behaviors: ['cashflow_sensitive', 'fx_sensitive'],
    finance: { deposits: 2500000, wealth_mgmt: 500000, funds: 0, insurance: 100000, loans: 4000000, annual_cashflow: 3000000 },
    family: '已婚，一子；工厂 200 余人',
    trust: 22, teach_tags: ['fx_risk', 'hedging', 'risk_isolation'],
  },
  {
    id: 'cli_d_chaiqian', name: '贾桂香', age_2006: 50, occupation: '待拆迁居民', tier: 'wealth',
    risk: { level: 1, tested_at: '2006-01-20' },
    behaviors: ['risk_averse', 'windfall_unprepared'],
    finance: { deposits: 120000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 48000 },
    family: '老城区自建房，拆迁传闻多年；丈夫出租车副班',
    trust: 35, teach_tags: ['windfall_mgmt', 'deposit_insurance', 'fraud_alert'],
  },
  {
    id: 'cli_d_haigui', name: '沈亦舟', age_2006: 27, occupation: '海归金融从业者', tier: 'wealth',
    risk: { level: 4, tested_at: '2006-06-01' },
    behaviors: ['tech_native', 'overconfident'],
    finance: { deposits: 150000, wealth_mgmt: 100000, funds: 80000, insurance: 0, loans: 0, annual_cashflow: 240000 },
    family: '未婚，父母在县城',
    trust: 28, teach_tags: ['behavior_finance', 'asset_allocation', 'global_view'],
  },
  {
    id: 'cli_d_teachers', name: '闻立群', age_2006: 41, occupation: '县城中学教师（夫妻双职工）', tier: 'mass',
    risk: { level: 2, tested_at: '2006-04-01' },
    behaviors: ['diligent_learner', 'risk_averse'],
    finance: { deposits: 260000, wealth_mgmt: 0, funds: 20000, insurance: 60000, loans: 200000, annual_cashflow: 140000 },
    family: '妻子同校教师，女儿小学',
    trust: 38, teach_tags: ['dca', 'education_fund', 'insurance_basics'],
  },
  {
    id: 'cli_d_trucker', name: '雷长贵', age_2006: 36, occupation: '货车司机（自营车队）', tier: 'mass',
    risk: { level: 2, tested_at: '2006-05-01' },
    behaviors: ['cashflow_sensitive', 'impatient'],
    finance: { deposits: 180000, wealth_mgmt: 0, funds: 0, insurance: 80000, loans: 400000, annual_cashflow: 220000 },
    family: '跑长途，妻子在家带两个孩子',
    trust: 25, teach_tags: ['cash_mgmt', 'insurance_basics', 'income_volatility'],
  },
  {
    id: 'cli_d_p2p', name: '杜小满', age_2006: 30, occupation: '便利店店主（曾在网贷踩坑）', tier: 'mass',
    risk: { level: 3, tested_at: '2006-08-01' },
    behaviors: ['yield_chasing', 'trust_wounded'],
    finance: { deposits: 90000, wealth_mgmt: 0, funds: 15000, insurance: 0, loans: 120000, annual_cashflow: 160000 },
    family: '离异带娃，2018 年后对"高息"极度警惕',
    trust: 20, teach_tags: ['high_yield_trap', 'credit_report', 'debt_avalanche'],
  },
  {
    id: 'cli_d_exfunds', name: '姜屿', age_2006: 33, occupation: '前公募基金经理（2021 年离职）', tier: 'private',
    risk: { level: 4, tested_at: '2006-09-01' },
    behaviors: ['sophisticated', 'skeptical'],
    finance: { deposits: 800000, wealth_mgmt: 1200000, funds: 2000000, insurance: 200000, loans: 0, annual_cashflow: 800000 },
    family: '已婚，妻子大学同学；对抱团时代有自己的反思',
    trust: 30, teach_tags: ['fund_evaluation', 'crowded_trade', 'asset_allocation'],
  },
  {
    id: 'cli_d_liveroom', name: '苏晚晴', age_2006: 24, occupation: '直播带货创业者（2021 年起）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-10-01' },
    behaviors: ['income_volatile', 'tech_native', 'impatient'],
    finance: { deposits: 400000, wealth_mgmt: 100000, funds: 150000, insurance: 0, loans: 0, annual_cashflow: 900000 },
    family: '未婚，与合伙人共同经营工作室',
    trust: 26, teach_tags: ['income_structure', 'tax_quarterly', 'cash_mgmt'],
  },
  {
    id: 'cli_d_exporter', name: '魏东林', age_2006: 47, occupation: '制造业出口商', tier: 'vip',
    risk: { level: 3, tested_at: '2006-11-01' },
    behaviors: ['conservative_business', 'cash_rich'],
    finance: { deposits: 4500000, wealth_mgmt: 800000, funds: 0, insurance: 300000, loans: 1000000, annual_cashflow: 2500000 },
    family: '已婚，儿子在国外读书（留学购汇常客）',
    trust: 32, teach_tags: ['fx_risk', 'structured_product', 'cross_border'],
  },
  {
    id: 'cli_d_rehire', name: '邱工', age_2006: 58, occupation: '退休返聘工程师', tier: 'wealth',
    risk: { level: 2, tested_at: '2006-12-01' },
    behaviors: ['risk_averse', 'diligent_learner'],
    finance: { deposits: 900000, wealth_mgmt: 200000, funds: 100000, insurance: 150000, loans: 0, annual_cashflow: 260000 },
    family: '老伴退休，儿子定居外地；养老金+返聘双份收入',
    trust: 36, teach_tags: ['pension_gap', 'senior_service', 'deposit_insurance'],
  },
  {
    id: 'cli_d_abroad', name: '顾南音', age_2006: 45, occupation: '留学生家长（陪读兼顾国内资产）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-01-15' },
    behaviors: ['fx_sensitive', 'cross_border_needs'],
    finance: { deposits: 1600000, wealth_mgmt: 400000, funds: 200000, insurance: 200000, loans: 800000, annual_cashflow: 700000 },
    family: '女儿 2024 年赴海外读本科；每年换汇额度用满',
    trust: 30, teach_tags: ['cross_border', 'fx_risk', 'education_fund'],
  },
];

// ================= 第二轮深化新增客户（8 位，22→30） =================

export const deepClients2: ClientDef[] = [
  {
    id: 'cli_d_pandoc', name: '温以宁', age_2006: 39, occupation: '三甲医院科室副主任', tier: 'private',
    risk: { level: 3, tested_at: '2006-06-01' },
    behaviors: ['diligent_learner', 'time_poor'],
    finance: { deposits: 3200000, wealth_mgmt: 1800000, funds: 900000, insurance: 600000, loans: 1200000, annual_cashflow: 1200000 },
    family: '丈夫同院医生，一儿一女；收入高但几乎没时间看账户',
    trust: 32, teach_tags: ['time_poor_service', 'insurance_basics', 'education_fund'],
  },
  {
    id: 'cli_d_streamer', name: '路小满', age_2006: 23, occupation: '游戏主播（2020 年起全职）', tier: 'wealth',
    risk: { level: 4, tested_at: '2006-08-01' },
    behaviors: ['income_volatile', 'tech_native', 'yield_chasing'],
    finance: { deposits: 500000, wealth_mgmt: 200000, funds: 350000, insurance: 0, loans: 0, annual_cashflow: 800000 },
    family: '未婚；月收入波动极大，粉丝打赏为主',
    trust: 24, teach_tags: ['income_structure', 'tax_quarterly', 'behavior_finance'],
  },
  {
    id: 'cli_d_mcn', name: '贺兰亭', age_2006: 31, occupation: 'MCN 机构创始人', tier: 'vip',
    risk: { level: 4, tested_at: '2006-09-01' },
    behaviors: ['cashflow_sensitive', 'impatient', 'tech_native'],
    finance: { deposits: 1500000, wealth_mgmt: 600000, funds: 400000, insurance: 100000, loans: 2000000, annual_cashflow: 2000000 },
    family: '已婚；公司账与家庭账混同，账款回款周期不稳定',
    trust: 25, teach_tags: ['risk_isolation', 'cash_mgmt', 'payroll_biz'],
  },
  {
    id: 'cli_d_countytown', name: '尹福来', age_2006: 55, occupation: '县城五金店老板', tier: 'mass',
    risk: { level: 1, tested_at: '2006-03-01' },
    behaviors: ['risk_averse', 'cash_rich', 'fraud_vulnerable'],
    finance: { deposits: 700000, wealth_mgmt: 0, funds: 0, insurance: 30000, loans: 0, annual_cashflow: 180000 },
    family: '老伴操持家务，儿子在省城；一辈子攒下的家底全在存折',
    trust: 34, teach_tags: ['deposit_insurance', 'fraud_alert', 'deposit_migration'],
  },
  {
    id: 'cli_d_techee', name: '薄远舟', age_2006: 34, occupation: '互联网大厂技术总监（期权持有者）', tier: 'vip',
    risk: { level: 4, tested_at: '2006-10-01' },
    behaviors: ['tech_native', 'overconfident', 'stock_concentrated'],
    finance: { deposits: 900000, wealth_mgmt: 300000, funds: 2000000, insurance: 200000, loans: 3000000, annual_cashflow: 1500000 },
    family: '已婚，妻子全职；家庭资产七成在自家公司股票',
    trust: 27, teach_tags: ['concentration_risk', 'tax_annual', 'asset_allocation'],
  },
  {
    id: 'cli_d_heritage', name: '程砚秋', age_2006: 61, occupation: '非遗木雕传承人', tier: 'wealth',
    risk: { level: 2, tested_at: '2006-04-01' },
    behaviors: ['risk_averse', 'tradition_valued'],
    finance: { deposits: 1100000, wealth_mgmt: 100000, funds: 0, insurance: 200000, loans: 0, annual_cashflow: 300000 },
    family: '老伴，一子在外地不愿接手手艺；工作室与老宅是心头肉',
    trust: 33, teach_tags: ['succession', 'deposit_insurance', 'elder_care'],
  },
  {
    id: 'cli_d_dink', name: '茅以晴', age_2006: 37, occupation: '结构工程师（丁克家庭）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-05-01' },
    behaviors: ['diligent_learner', 'planning_oriented'],
    finance: { deposits: 800000, wealth_mgmt: 500000, funds: 600000, insurance: 500000, loans: 900000, annual_cashflow: 900000 },
    family: '夫妻双职工丁克；退休后旅居是最大目标',
    trust: 31, teach_tags: ['pension_gap', 'third_pillar', 'asset_allocation'],
  },
  {
    id: 'cli_d_agri', name: '甘有田', age_2006: 46, occupation: '家庭农场主（流转 800 亩）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-07-01' },
    behaviors: ['seasonal_income', 'cashflow_sensitive'],
    finance: { deposits: 600000, wealth_mgmt: 0, funds: 100000, insurance: 150000, loans: 1500000, annual_cashflow: 900000 },
    family: '夫妻+父母帮工；秋收后集中回款，春耕前用钱紧张',
    trust: 28, teach_tags: ['cash_mgmt', 'agri_finance', 'insurance_basics'],
  },
];

/**
 * 第四轮深化批新增客户：周薇（分行合规部督查，"对 face"合规视角人生线主角）。
 */
export const deepClients3: ClientDef[] = [
  {
    id: 'cli_zhouwei', name: '周薇', age_2006: 35, occupation: '分行合规部督查', tier: 'vip',
    risk: { level: 1, tested_at: '2006-03-15' },
    behaviors: ['compliance_oriented', 'diligent_learner'],
    finance: { deposits: 900000, wealth_mgmt: 200000, funds: 100000, insurance: 300000, loans: 0, annual_cashflow: 300000 },
    family: '已婚，丈夫是中学教师；无孩，养一只猫',
    trust: 20, teach_tags: ['red_lines', 'dual_recording', 'employee_conduct'],
  },
];

/**
 * 第五轮深化批新增客户：程季青（主角第一任理财经理师父，"薪火"母题全游戏最强情感线的人）。
 * 2006 年主角入行时带教；此后以"长辈/客户"身份贯穿 2006→2027 二十年，与卷八「薪火」剧情互为表里。
 */
export const deepClients4: ClientDef[] = [
  {
    id: 'cli_chengjq', name: '程季青', age_2006: 52, occupation: '资深理财经理（带教师父）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-01-05' },
    behaviors: ['mentor_style', 'risk_averse'],
    finance: { deposits: 480000, wealth_mgmt: 200000, funds: 120000, insurance: 150000, loans: 0, annual_cashflow: 96000 },
    family: '独子远在外地；与老伴同住，二十年夜班多、陪伴少',
    trust: 30, teach_tags: ['team_coaching', 'succession', 'communication'],
    questline: 'ql_chengjq',
  },
];
