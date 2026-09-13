# -*- coding: utf-8 -*-
"""T7：events.ts 追加第二轮深化 12 条导演事件（93→105）。小冲击、日期避开既有事件与 12 锚点。"""
import io, re

s = io.open('content/src/events.ts', encoding='utf-8').read()
existing_dates = set(re.findall(r"date: '(\d{4}-\d{2}-\d{2})'", s))
existing_ids = set(re.findall(r"id: '(dir_[a-z0-9_]+)'", s))

EXTRA = '''  // ===== 第二轮深化：历史微事件（12 条，93→105） =====
  { id: 'dir_2009_industry', date: '2009-02-20', type: 'policy', title: '十大产业振兴规划密集出台', news: '钢铁、汽车、装备制造等十大产业调整振兴规划陆续发布，相关板块轮番活跃。', shocks: { equity: 0.045, cyclical: 0.02 }, duration_days: 10, sentiment: 1.2 },
  { id: 'dir_2011_wealth', date: '2011-11-15', type: 'director', title: '理财乱象与银监会整治', news: '部分银行理财"资金池"运作被点名，监管启动规范整治，短期理财产品收益率分化。', shocks: { credit: 0.003, liquidity: -0.02 }, duration_days: 6, sentiment: -0.8 },
  { id: 'dir_2012_golden', date: '2012-03-20', type: 'policy', title: '温州金融改革试验区获批', news: '民间资本进入金融领域的试验启动，小额贷款与民间借贷阳光化讨论升温。', shocks: { equity: 0.02 }, duration_days: 4, sentiment: 0.6 },
  { id: 'dir_2017_leverage', date: '2017-04-25', type: 'policy', title: '金融防风险去杠杆加码', news: '监管协调强化，同业与通道业务压缩，市场流动性边际收紧。', shocks: { liquidity: -0.05, equity: -0.025 }, duration_days: 12, sentiment: -1.2 },
  { id: 'dir_2020_reg_c', date: '2020-08-24', type: 'policy', title: '创业板注册制首批企业上市', news: '创业板注册制落地，涨跌幅放宽至 20%，市场风格进一步向成长倾斜。', shocks: { equity: 0.02, style_small: 0.03 }, duration_days: 5, sentiment: 0.8 },
  { id: 'dir_2020_ant', date: '2020-11-03', type: 'black_swan', title: '大型金融科技公司上市暂缓', news: '备受瞩目的金融科技巨头上市按下暂停键，平台金融监管框架重塑。', shocks: { equity: -0.018, sentiment_dom: -0.4 }, duration_days: 3, sentiment: -1 },
  { id: 'dir_2021_double', date: '2021-08-03', type: 'policy', title: '教育等行业监管重拳', news: '行业规范政策密集出台，相关板块暴跌拖累市场情绪，资金转向硬科技叙事。', shocks: { equity: -0.028, style_small: -0.04 }, duration_days: 5, sentiment: -1.5, unlock_knowledge: ['policy_risk'] },
  { id: 'dir_2023_whitelist', date: '2023-11-17', type: 'policy', title: '房地产融资白名单机制酝酿', news: '三部门联合召开金融机构座谈会，提出"三个不低于"，房地产融资支持政策转向项目导向。', shocks: { housing: 0.02, credit: -0.002 }, duration_days: 5, sentiment: 0.6 },
  { id: 'dir_2023_stbond', date: '2023-10-24', type: 'policy', title: '万亿国债增发落地', news: '中央财政增发一万亿元国债支持灾后重建，财政发力信号明确。', shocks: { rate10y: 0.002, equity: 0.015 }, duration_days: 4, sentiment: 0.8 },
  { id: 'dir_2024_swap', date: '2024-10-18', type: 'policy', title: '互换便利与回购增持再贷款落地', news: '两项结构性货币政策工具正式启动，稳市资金通道打通。', shocks: { equity: 0.03, sentiment_dom: 0.4 }, duration_days: 5, sentiment: 1.2, unlock_knowledge: ['sfisf', 'buyback_loan'] },
  { id: 'dir_2025_debt2', date: '2025-03-06', type: 'policy', title: '化债资金加速下达', news: '地方债务置换额度快速发行，城投公开债利差压缩至历史低位。', shocks: { credit: -0.004, rate10y: -0.001 }, duration_days: 6, sentiment: 0.6, unlock_knowledge: ['debt_resolve'] },
  { id: 'dir_2025_robot', date: '2025-02-10', type: 'director', title: '人形机器人产业催化密集', news: '头部厂商量产节奏超预期，产业链订单爆发，主题投资热情高涨。', shocks: { equity: 0.035, style_small: 0.04, tech: 0.05 }, duration_days: 10, sentiment: 1.5 },
'''

# 检查 unlock_knowledge 引用存在（sfisf/buyback_loan/policy_risk 需在词条 tags 或已有 unlock 引用池中）
# ref-check 只校验知识 id？——它会校验 unlock_knowledge 与词条 id/tags。稳妥：改用已存在的 tags
EXTRA = EXTRA.replace("unlock_knowledge: ['sfisf', 'buyback_loan']", "unlock_knowledge: ['patient_capital', 'dividend']")
EXTRA = EXTRA.replace("unlock_knowledge: ['policy_risk']", "unlock_knowledge: ['policy_divergence']")
EXTRA = EXTRA.replace("unlock_knowledge: ['debt_resolve']", "unlock_knowledge: ['macro_cycle']")

new_ids = re.findall(r"id: '(dir_[a-z0-9_]+)'", EXTRA)
new_dates = set(re.findall(r"date: '(\d{4}-\d{2}-\d{2})'", EXTRA))
assert len(new_ids) == 12, len(new_ids)
assert not (set(new_ids) & existing_ids), 'id clash'
assert not (new_dates & existing_dates), f'date clash: {new_dates & existing_dates}'

i = s.rfind('];')
s2 = s[:i].rstrip().rstrip(',') + ',\n' + EXTRA + '];\n'
io.open('content/src/events.ts', 'w', encoding='utf-8', newline='\n').write(s2)
print('appended 12, total:', s2.count("id: 'dir_"))
