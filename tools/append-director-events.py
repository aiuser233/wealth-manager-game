# -*- coding: utf-8 -*-
"""向 events.ts 追加深化批 12 条导演事件（81→93）。
原则：不动既有锚点事件的 shocks/日期；新事件均为"微事件"（小冲击、不改 force_day 格局），
用于增加年代纹理。日期避开既有事件（同时段错峰）。"""
import io, re

# 已占用日期（±10 天内避让）
s = io.open('content/src/events.ts', encoding='utf-8').read()
existing_dates = set(re.findall(r"date: '(\d{4}-\d{2}-\d{2})'", s))

EXTRA = '''  // ===== 深化批补强：历史微事件（12 条，小冲击年代纹理） =====
  { id: 'dir_2007_fundwave', date: '2007-03-15', type: 'director', title: '新基金发行限购潮', news: '爆款基金频现"按比例配售"，市民凌晨排队申购，基金公司被迫限购。', shocks: { equity: 0.04, sentiment_dom: 0.3 }, duration_days: 10, sentiment: 1.5 },
  { id: 'dir_2008_4t_note', date: '2008-11-27', type: 'policy', title: '大幅降息 108 基点', news: '央行宣布罕见大幅降息，宽松力度加码，债市迎来大牛市起点。', shocks: { lpr_5y: -0.011, rate10y: -0.006, liquidity: 0.04 }, duration_days: 5, sentiment: 1 },
  { id: 'dir_2010_indexfut', date: '2010-04-16', type: 'policy', title: '股指期货上市', news: '股指期货正式挂牌，A股进入对冲时代，"双向获利"成为新话题。', shocks: { equity: -0.02, vix: 0.1 }, duration_days: 3, sentiment: -0.5 },
  { id: 'dir_2011_wenzhou', date: '2011-10-08', type: 'director', title: '民间借贷危机发酵', news: '东南沿海民间借贷链条断裂传闻四起，中小企业主"跑路"风波引发信用担忧。', shocks: { credit: 0.004, equity: -0.03 }, duration_days: 8, sentiment: -1.5, unlock_knowledge: ['high_yield_trap'] },
  { id: 'dir_2013_treasury', date: '2013-09-06', type: 'policy', title: '国债期货重启', news: '阔别 18 年的国债期货重返市场，利率风险管理工具补齐。', shocks: { rate10y: 0.001 }, duration_days: 2, sentiment: 0.2 },
  { id: 'dir_2014_belt', date: '2014-12-08', type: 'macro', title: '"一带一路"规划热起', news: '基建出海战略升温，相关板块连续涨停潮，主题投资热情高涨。', shocks: { equity: 0.05, style_big: 0.03 }, duration_days: 10, sentiment: 1.5 },
  { id: 'dir_2015_fx2', date: '2015-08-25', type: 'black_swan', title: '汇改余波：全球央行紧急应对', news: '汇率波动传导全球，多国央行紧急表态，风险资产高波动延续。', shocks: { equity: -0.06, fx_cny: 0.008, vix: 0.4 }, duration_days: 1, sentiment: -2 },
  { id: 'dir_2016_fuse_after', date: '2016-01-25', type: 'director', title: '熔断阴影后的冷静期', news: '市场进入缩量筑底阶段，两融余额持续回落，投资者风险偏好降至冰点。', shocks: { equity: -0.04, liquidity: -0.03 }, duration_days: 8, sentiment: -1.5 },
  { id: 'dir_2018_rescue', date: '2018-11-02', type: 'policy', title: '民企纾困政策组合拳', news: '多地设立纾困基金化解股权质押风险，政策底信号明确。', shocks: { equity: 0.05, credit: -0.002 }, duration_days: 8, sentiment: 1.5, unlock_knowledge: ['pledge_risk'] },
  { id: 'dir_2019_lpr2', date: '2019-09-20', type: 'policy', title: 'LPR 二次报价下调', news: 'LPR 报价再降 5 基点，降低实体融资成本的政策取向延续。', shocks: { lpr_5y: -0.001, rate10y: -0.001 }, duration_days: 3, sentiment: 0.3 },
  { id: 'dir_2022_pension', date: '2022-11-25', type: 'policy', title: '个人养老金制度启动实施', news: '个人养老金在多城市启动实施，账户开立与产品上架同步推进。', shocks: { equity: 0.015, sentiment_dom: 0.2 }, duration_days: 5, sentiment: 0.8, unlock_knowledge: ['third_pillar'] },
  { id: 'dir_2024_niujiau', date: '2024-04-12', type: 'policy', title: '新"国九条"发布', news: '资本市场第三个"国九条"出台，分红、退市、市值管理导向全面强化。', shocks: { equity: 0.02, style_big: 0.03 }, duration_days: 5, sentiment: 1, unlock_knowledge: ['market_value_mgmt'] },
'''

new_ids = re.findall(r"id: '(dir_[a-z0-9_]+)'", EXTRA)
new_dates = set(re.findall(r"date: '(\d{4}-\d{2}-\d{2})'", EXTRA))
clash = new_dates & existing_dates
assert not clash, f'date clash: {clash}'
assert len(new_ids) == 12, len(new_ids)

i = s.rfind('];')
s2 = s[:i].rstrip().rstrip(',') + ',\n' + EXTRA + '];\n'
io.open('content/src/events.ts', 'w', encoding='utf-8', newline='\n').write(s2)
print('appended 12, total:', s2.count("id: 'dir_"))
