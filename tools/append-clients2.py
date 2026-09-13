# -*- coding: utf-8 -*-
"""T2：clients-deep.ts 追加 8 位客户（22→30）。"""
import io

EXTRA = '''
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
'''

s = io.open('content/src/clients-deep.ts', encoding='utf-8').read()
i = s.rfind('\n];')
s2 = s[:i].rstrip().rstrip(',') + ';'
# 把最后一个 ]; 换成 ,\n + EXTRA + ];
s2 = s2[:s2.rfind('];')].rstrip().rstrip(',') + ',\n' + EXTRA.rstrip() + '\n'
io.open('content/src/clients-deep.ts', 'w', encoding='utf-8', newline='\n').write(s2)
print('clients appended, total entries:', s2.count('id: '))
