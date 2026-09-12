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
