# -*- coding: utf-8 -*-
"""T4：random-events.ts 追加 20 条第二轮深化事件（60→80）。"""
import io

EXTRA = '''
// ================= 第二轮深化随机事件（20 条：60→80） =================

export const randomEventsDeep2: RandomEventDef[] = [
  {
    id: 're_repay_wave', title: '提前还贷潮', era: [2022, 2025], weight: 3,
    text: '理财收益走低、房贷利率偏高，客户扎堆问"要不要提前还贷"。',
    effects: {},
    choices: [
      { text: '做"资金机会成本"测算：理财收益 vs 贷款利率 vs 应急流动性，让客户自己权衡', outcome: '有人决定还、有人决定留，都对你的"二十分钟算账"心服口服。', effects: { trust: 2 }, teach: 'mortgage' },
      { text: '「都还了吧，无债一身轻」', outcome: '应急金跟着清零，一位客户半年后急用钱来求贷款——利率已上行。', effects: { stress: 1 } },
    ],
    teach: '提前还贷没有标准答案，只有家庭现金流账。',
  },
  {
    id: 're_bond_break', title: '债市急跌破净潮', era: [2020, 2025], weight: 3,
    text: '债市调整，"稳健"理财批量破净，网点电话被打爆。',
    effects: {},
    choices: [
      { text: '提前给持仓客户发《破净归因说明书》：跌因、历史、期限修复逻辑', outcome: '赎回率远低于同业。事后总行来你网点取经。', effects: { trust: 2, fame: 1 }, teach: 'nav_drawdown_read' },
      { text: '等客户上门再一个个解释', outcome: '被动接招，谁先来谁恐慌，恐慌互相传染。', effects: { stress: 3 } },
    ],
    teach: '沟通跑在赎回前面，是最好的风控。',
  },
  {
    id: 're_gold_cash', title: '金饰变现热', era: [2023, 2025], weight: 2,
    text: '金价高位，有客户拿金条金饰来问"现在卖还是再等等"。',
    effects: {},
    choices: [
      { text: '讲清回购价差与渠道差异，提醒"家庭别把金饰当投资品"——佩戴属性优先', outcome: '客户按需变现了一部分，没卖的那部分不再焦虑。', effects: { trust: 1 }, teach: 'deposit' },
      { text: '「肯定还能涨，再拿十年」', outcome: '回调时客户第一个来问你"你说的还能涨呢"。', effects: { stress: 1 } },
    ],
    teach: '不预测点位，只谈成本、流动性与用途。',
  },
  {
    id: 're_trade_in', title: '以旧换新补贴咨询', era: [2024, 2025], weight: 2,
    text: '家电以旧换新补贴出台，客户问怎么用政策最划算。',
    effects: {},
    choices: [
      { text: '整理补贴品类、申请路径与银行消费券叠加玩法，做成一页纸发给客户群', outcome: '客户群里一片感谢，你成了"政策翻译官"。', effects: { trust: 1, fame: 1 } },
      { text: '「我也没研究，你们自己看官网」', outcome: '机会窗口就这么关上了。', effects: {} },
    ],
    teach: '政策红利期是服务客户、经营信任的黄金窗口。',
  },
  {
    id: 're_cross_pay', title: '跨境支付新选择', era: [2023, 2025], weight: 2,
    text: '外贸客户问：跨境结算除了传统电汇，还有什么新渠道？',
    effects: {},
    choices: [
      { text: '介绍合规跨境结算工具与汇率避险组合，安排对公同事对接', outcome: '客户迁移了结算账户，汇率成本下降让他成了你的"活广告"。', effects: { trust: 2 }, teach: 'cross_border' },
      { text: '「跨境的事我们不熟，您问别人吧」', outcome: '客户把全部结算业务转去了"更专业"的同业。', effects: {} },
    ],
    teach: '客户的需求边界，就是你的学习边界。',
  },
  {
    id: 're_pension_tax', title: '个人养老金退税季', era: [2023, 2025], weight: 3,
    text: '退税季，客户问：个人养老金缴费怎么抵税？缴多少合适？',
    effects: {},
    choices: [
      { text: '按边际税率帮客户算抵税额+领取税负，给出"缴存额建议表"', outcome: '高税率客户满额缴存，低税率客户也明白了取舍。专业口碑+1。', effects: { trust: 2 }, teach: 'third_pillar' },
      { text: '「缴得越多越好，能省钱」', outcome: '低税率客户满额缴了，发现省不了几个钱还锁定了流动性。', effects: { stress: 1 } },
    ],
    teach: '税优工具的"优惠"取决于收入结构，不是人人一样。',
  },
  {
    id: 're_digital_redpack', title: '数字红包推广', era: [2022, 2025], weight: 1,
    text: '分行要求推广数字人民币红包活动，任务压到每个人头上。',
    effects: {},
    choices: [
      { text: '在厅堂办"数字体验角"：教客户开通、领红包、用在早餐摊——真实场景推广', outcome: '活跃度指标全行第一，商户端也顺带谈成了合作。', effects: { fame: 1 } },
      { text: '拉家人朋友凑数开通', outcome: '数字好看，活跃度惨淡，第二年指标翻倍。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '指标用真实场景完成，才是可持续的完成。',
  },
  {
    id: 're_group_buy', title: '社区团购资金盘', era: [2021, 2023], weight: 2,
    text: '社区团购平台"团长"跑路，好几位客户预存的菜钱打水漂，来找银行讨说法。',
    effects: {},
    choices: [
      { text: '解释平台资金与银行无关，但协助保存支付凭证、指导集体维权', outcome: '案件追回部分损失，客户虽败犹感："银行把我们当自己人。"', effects: { trust: 1 } },
      { text: '「与我们无关」三个字打发', outcome: '客户把怨气记在了"网点的冷脸"上。', effects: {} },
    ],
    teach: '不是你的责任，也可以是你的服务。',
  },
  {
    id: 're_family_office', title: '家族办公室咨询', era: [2020, 2025], weight: 2,
    text: '私行客户问：三千万可投资产，要不要搭个家办架构？',
    effects: {},
    choices: [
      { text: '先做需求诊断：隔离/传承/税务/治理哪个是真痛点，再谈架构成本与门槛', outcome: '客户选择了保险金信托+家庭服务信托的轻量组合，费用省了一大截。', effects: { trust: 2, aum: 200000 }, teach: 'family_office' },
      { text: '「家办高大上，冲就完了」', outcome: '架构搭得豪华，服务费年缴百万，客户两年后清算时怨气冲天。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '架构服务于需求，不是身份象征。',
  },
  {
    id: 're_new_citizen', title: '新市民金融服务', era: [2022, 2025], weight: 2,
    text: '外卖站长带着一群骑手来网点：想开工资卡，还想给老家汇钱。',
    effects: {},
    choices: [
      { text: '开绿色通道：批量办卡+讲解汇费减免+防骗手册，顺带聊聊意外险', outcome: '站点成了你的"移动获客点"，转介绍源源不断。', effects: { trust: 1, fame: 1 } },
      { text: '按标准流程慢慢办，一天办几个', outcome: '骑手们等不起，集体去了隔壁"办卡送水"的同业。', effects: {} },
    ],
    teach: '服务新市民，效率就是诚意。',
  },
  {
    id: 're_senior_check', title: '适老网点检查', era: [2021, 2025], weight: 1,
    text: '监管开展适老化服务检查，检查员扮成老年客户进厅体验。',
    effects: {},
    choices: [
      { text: '日常已练好：大字版指引、爱心窗口、老花镜、代办规范，从容应对', outcome: '网点获评适老服务示范点。好服务经得起任何暗访。', effects: { fame: 1 } },
      { text: '连夜布置"临阵磨枪"', outcome: '检查员问"平时也这样吗"，大堂经理卡了壳。', effects: { stress: 2 } },
    ],
    teach: '合规服务的最高境界：检查日与平时一模一样。',
  },
  {
    id: 're_wealth_sub', title: '理财子公司产品上架', era: [2019, 2025], weight: 2,
    text: '理财子公司新品上架，产品说明书里的"业绩比较基准区间"客户看不懂。',
    effects: {},
    choices: [
      { text: '用"锚点+区间+不承诺"三句话讲透，配一张历史达成率表', outcome: '客户按风险偏好各取所需，达成率不及预期时没有人来闹。', effects: { trust: 2 }, teach: 'nav_product' },
      { text: '「反正比存款高就对了」', outcome: '下修基准时，客户翻出你的聊天记录。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '把"不承诺"讲明白，是净值化时代的第一话术。',
  },
  {
    id: 're_quant_alpha', title: '指数增强质疑', era: [2021, 2025], weight: 2,
    text: '客户拿着指数增强基金"三年跑输基准"的截图来质问。',
    effects: {},
    choices: [
      { text: '摊开数据：超额衰减+费率+风格错配，逐项归因，给出"继续持有/换基准基金/换风格"三选项', outcome: '客户选了换基准产品，感叹："第一次有人把跑输讲得这么清楚。"', effects: { trust: 2 }, teach: 'quant' },
      { text: '「量化就这样，别在意短期」', outcome: '客户第二年全清了你的产品，也清了你。', effects: {} },
    ],
    teach: '跑输不可怕，说不清为什么跑输才可怕。',
  },
  {
    id: 're_house_freeze', title: '换房资金冻结风波', era: [2018, 2025], weight: 2,
    text: '客户卖旧房买新房，过桥资金在监管新规下被冻结，两头交割都卡住。',
    effects: {},
    choices: [
      { text: '联动对公与个贷同事，梳理合规的资金路径与时间表，帮客户重新排期', outcome: '交易有惊无险完成，客户买了房还带来两位同小区邻居。', effects: { trust: 2 } },
      { text: '「政策问题，我们没办法」', outcome: '客户违约赔了定金，逢人就说银行的"不作为"。', effects: {} },
    ],
    teach: '客户的重大交易，是最考验银行协同能力的时刻。',
  },
  {
    id: 're_tip_dispute', title: '直播打赏纠纷', era: [2021, 2025], weight: 1,
    text: '家长发现孩子用绑定的银行卡给主播打赏数万元，冲进网点要求退款。',
    effects: {},
    choices: [
      { text: '指导固定证据、联系平台未成年人退款通道，同步教家长设置支付限额', outcome: '退款成功，家长给网点写了封感谢信，还把家里存款搬了过来。', effects: { trust: 2 } },
      { text: '「打赏是自愿的，钱追不回来」', outcome: '家长投诉到媒体，标题里出现了银行的名字。', effects: { fame: -1 } },
    ],
    teach: '支付安全服务，是零售银行的新战场。',
  },
  {
    id: 're_biz_loan_check', title: '经营贷入市排查', era: [2021, 2025], weight: 2,
    text: '监管排查经营贷违规流入楼市股市，你的客户名单里有几笔敏感贷款。',
    effects: {},
    choices: [
      { text: '主动逐户核查用途凭证，发现苗头提前整改，向分行报告', outcome: '你管理的贷款未出现一笔违规收回，分行通报表扬。', effects: { fame: 1 } },
      { text: '侥幸心理：应该查不到我', outcome: '抽贷+处罚+问责三连，你的名字在报告附件里。', effects: { stress: 3 }, risk: 'red' },
    ],
    teach: '合规排查面前，主动是唯一的护身符。',
  },
  {
    id: 're_pension_month', title: '养老金融宣传月', era: [2024, 2025], weight: 2,
    text: '养老金融宣传月，分行要求各网点出特色活动。',
    effects: {},
    choices: [
      { text: '办"养老规划沙盘"工作坊：让客户亲手算替代率缺口与三支柱搭配', outcome: '参与客户八成开了个人养老金账户，活动被分行官网报道。', effects: { trust: 2, fame: 1 }, teach: 'pension_gap' },
      { text: '挂横幅发传单完事', outcome: '横幅淋了一夜雨，没人记得上面写了什么。', effects: {} },
    ],
    teach: '好的宣教是让客户动手，不是让客户围观。',
  },
  {
    id: 're_dividend_hot', title: '分红热与政策行情', era: [2024, 2025], weight: 2,
    text: '高分红资产走强，客户问"红利基金能不能一把梭"。',
    effects: {},
    choices: [
      { text: '讲清红利风格的三重风险：利率反转/周期拥挤/股息陷阱，建议定投+仓位上限', outcome: '客户按计划分批配置，风格轮动时持仓心态稳定。', effects: { trust: 2 }, teach: 'market_value_mgmt' },
      { text: '「政策支持，闭眼买」', outcome: '风格逆转时，客户把你这句话截图发到了投诉邮箱。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '政策利好不是免死金牌，仓位纪律才是。',
  },
  {
    id: 're_mv_window', title: '破净修复行情', era: [2024, 2025], weight: 1,
    text: '客户重仓的破净国企发布了估值提升计划，股价连涨，他问"要不要加仓追"。',
    effects: {},
    choices: [
      { text: '对照政策原文讲"估值回归的长期逻辑"与"短线博弈的拥挤风险"，让他自己选', outcome: '客户选择持有不加仓，回撤来临时毫发无损。', effects: { trust: 1 }, teach: 'patient_capital' },
      { text: '「赶紧加，政策行情来了」', outcome: '脉冲结束后客户被套，你的"政策解读"成了话柄。', effects: { stress: 1 } },
    ],
    teach: '把政策逻辑讲长，把交易冲动按短。',
  },
  {
    id: 're_long_money', title: '长钱长投教育', era: [2024, 2025], weight: 2,
    text: '监管推动中长期资金入市，你决定给客户做一轮"长钱"教育。',
    effects: {},
    choices: [
      { text: '办三期讲座：期限错配的代价、滚动持有的方法、目标日期工具的使用', outcome: '一批客户把短钱搬进了养老目标基金，赎回率明显下降。', effects: { trust: 2, aum: 150000 }, teach: 'patient_capital' },
      { text: '发条动态了事', outcome: '三个赞，零转化。', effects: {} },
    ],
    teach: '长钱文化不是口号，是一次次面对面聊出来的。',
  },
];
'''

s = io.open('content/src/random-events.ts', encoding='utf-8').read()
i = s.rfind('\n];')
s2 = s[:i].rstrip().rstrip(',') + ',\n' + EXTRA.rstrip() + '\n];\n'
io.open('content/src/random-events.ts', 'w', encoding='utf-8', newline='\n').write(s2)
print('appended, total re ids:', s2.count("id: 're_"))
