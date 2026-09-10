import type { ClientDef } from '@fm/core';

/**
 * 初始客户池（M0 版 10 人 + 剧情期解锁位）。
 * 核心 12 人组按卷逐步解锁：M0 直接给 10 人混合池用于测试。
 */
export const clients: ClientDef[] = [
  {
    id: 'cli_wangxl', name: '王秀兰', age_2006: 48, occupation: '中学教师', tier: 'mass',
    risk: { level: 1, tested_at: '2006-01-09' },
    behaviors: ['risk_averse', 'anchor_fixed_income'],
    finance: { deposits: 180000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 72000 },
    family: '丈夫退休工人，一子在外地工作',
    trust: 40, teach_tags: ['deposit_insurance', 'fraud_alert', 'suitability'],
    questline: 'ql_wangxl',
  },
  {
    id: 'cli_liqiang', name: '李建国', age_2006: 28, occupation: '工厂技术员', tier: 'mass',
    risk: { level: 3, tested_at: '2006-01-09' },
    behaviors: ['goal_oriented'],
    finance: { deposits: 60000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 120000 },
    family: '新婚，妻子同厂工作',
    trust: 30, teach_tags: ['family_lifecycle', 'dca', 'housing_vs_invest'],
    questline: 'ql_liqiang',
  },
  {
    id: 'cli_zhout', name: '周宏图', age_2006: 32, occupation: '民营建材厂老板', tier: 'wealth',
    risk: { level: 4, tested_at: '2006-01-09' },
    behaviors: ['cashflow_sensitive', 'impatient'],
    finance: { deposits: 900000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 2000000, annual_cashflow: 600000 },
    family: '已婚，一女',
    trust: 25, teach_tags: ['cash_mgmt', 'risk_isolation'],
    questline: 'ql_zhout',
  },
  {
    id: 'cli_qiandd', name: '钱进', age_2006: 26, occupation: '拆迁户/自由职业', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-01-09' },
    behaviors: ['impulsive', 'yield_chasing'],
    finance: { deposits: 1500000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 80000 },
    family: '未婚，与父母同住',
    trust: 20, teach_tags: ['budget_mgmt', 'high_yield_trap'],
    questline: 'ql_qiandd',
  },
  {
    id: 'cli_chenlz', name: '陈守业', age_2006: 45, occupation: '制造业企业主', tier: 'vip',
    risk: { level: 4, tested_at: '2006-01-09' },
    behaviors: ['control_oriented'],
    finance: { deposits: 3000000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 5000000, annual_cashflow: 2000000 },
    family: '已婚，一子一女',
    trust: 20, teach_tags: ['succession', 'family_trust'],
    questline: 'ql_chenlz',
  },
  {
    id: 'cli_liumei', name: '刘美凤', age_2006: 52, occupation: '个体店主', tier: 'mass',
    risk: { level: 2, tested_at: '2006-01-09' },
    behaviors: ['yield_chasing', 'herding'],
    finance: { deposits: 250000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 100000 },
    family: '离异，一女读高中',
    trust: 30, teach_tags: ['suitability', 'fund_basics'],
  },
  {
    id: 'cli_zhaoshu', name: '赵树理', age_2006: 60, occupation: '退休干部', tier: 'mass',
    risk: { level: 1, tested_at: '2006-01-09' },
    behaviors: ['risk_averse', 'savings_habit'],
    finance: { deposits: 420000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 60000 },
    family: '老伴健在，子女已成家',
    trust: 45, teach_tags: ['retirement_plan', 'fraud_alert'],
  },
  {
    id: 'cli_sunly', name: '孙丽云', age_2006: 35, occupation: '医院护士长', tier: 'wealth',
    risk: { level: 2, tested_at: '2006-01-09' },
    behaviors: ['goal_oriented', 'risk_averse'],
    finance: { deposits: 350000, wealth_mgmt: 0, funds: 0, insurance: 50000, loans: 400000, annual_cashflow: 180000 },
    family: '已婚，一子 5 岁',
    trust: 35, teach_tags: ['education_fund', 'insurance_basics'],
  },
  {
    id: 'cli_wuji', name: '吴建国', age_2006: 40, occupation: '出租车司机', tier: 'mass',
    risk: { level: 4, tested_at: '2006-01-09' },
    behaviors: ['impatient', 'lottery_preference'],
    finance: { deposits: 80000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 100000, annual_cashflow: 90000 },
    family: '已婚，两个孩子',
    trust: 20, teach_tags: ['leverage_risk', 'suitability'],
  },
  {
    id: 'cli_hezm', name: '何志敏', age_2006: 24, occupation: '银行同事（何俊之妹）', tier: 'mass',
    risk: { level: 3, tested_at: '2006-01-09' },
    behaviors: ['diligent_learner'],
    finance: { deposits: 30000, wealth_mgmt: 0, funds: 0, insurance: 0, loans: 0, annual_cashflow: 60000 },
    family: '单身，与父母同住',
    trust: 55, teach_tags: ['dca', 'fund_basics'],
  },
  {
    id: 'cli_zhouyh', name: '周远航', age_2006: -4, // 负值约定：2004 年出生（2006 年尚未成年，2024 年入行），UI 显示为出生年份
    occupation: '理财经理新人（00 后，2004 年生，2024 年入行）', tier: 'mass',
    risk: { level: 4, tested_at: '2024-03-01' },
    behaviors: ['impatient', 'yield_chasing', 'tech_native'],
    finance: { deposits: 50000, wealth_mgmt: 0, funds: 20000, insurance: 0, loans: 0, annual_cashflow: 120000 },
    family: '单身，与父母同住',
    trust: 45, teach_tags: ['ai_advisor', 'team_coaching', 'red_lines'],
  },
  {
    id: 'cli_chenman', name: '陈曼', age_2006: 32, occupation: '资深理财经理（你的师父）', tier: 'wealth',
    risk: { level: 3, tested_at: '2006-01-09' },
    behaviors: ['risk_averse', 'diligent_learner'],
    finance: { deposits: 400000, wealth_mgmt: 200000, funds: 150000, insurance: 100000, loans: 200000, annual_cashflow: 240000 },
    family: '已婚（2008），女儿 2010 年生',
    trust: 60, teach_tags: ['suitability', 'crisis_communication', 'team_coaching'],
  },
  {
    id: 'cli_tangwei', name: '唐薇', age_2006: -4, // 负值约定：1988 年生（2006 年在读高中，2013 年成为客户）
    occupation: '大学生→互联网运营（2013 年起为客户）', tier: 'wealth',
    risk: { level: 4, tested_at: '2013-06-01' },
    behaviors: ['yield_chasing', 'tech_native', 'impatient'],
    finance: { deposits: 50000, wealth_mgmt: 0, funds: 30000, insurance: 0, loans: 0, annual_cashflow: 180000 },
    family: '未婚',
    trust: 40, teach_tags: ['take_profit', 'behavior_finance', 'herding'],
  },
];
