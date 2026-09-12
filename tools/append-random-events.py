# -*- coding: utf-8 -*-
"""向 random-events.ts 追加深化批 24 条随机事件（36→60）。"""
import io

EXTRA = '''
// ================= 深化批新增随机事件（24 条：36→60） =================

export const randomEventsDeep: RandomEventDef[] = [
  // ===== 2006-2010 早期年代 =====
  {
    id: 're_gift_wars', title: '开户送礼大战', era: [2006, 2012], weight: 2,
    text: '同业网点挂出「开户送食用油」横幅，行长问你我们跟不跟。',
    effects: {},
    choices: [
      { text: '以服务响应与专业咨询做差异化，不跟礼品战', outcome: '慢热但扎实，三个月后口碑型客户开始多起来。', effects: { trust: 1, fame: 1 } },
      { text: '申请特批礼品对轰', outcome: '短期开户数冲高，费用超标被分行通报，来的多是羊毛党。', effects: { fame: 1 }, risk: 'grey' },
    ],
    teach: '价格战没有赢家，服务才是护城河。',
  },
  {
    id: 're_nav_run', title: '净值查询挤兑苗头', era: [2008, 2010], weight: 2,
    text: '一款理财短期浮亏，十几位客户同一天涌到网点要求赎回。',
    effects: {},
    choices: [
      { text: '逐一电话+面谈做归因安抚，给出历史回撤数据', outcome: '赎回潮平息，八成客户选择持有。危机成了信任的试金石。', effects: { trust: 2 }, teach: 'nav_drawdown_read' },
      { text: '在门口贴「请理性看待净值波动」告示', outcome: '客户觉得被敷衍，赎回照旧，口碑受损。', effects: {} },
    ],
    teach: '挤兑止于沟通，不止于告示。',
  },
  {
    id: 're_bancassure_check', title: '银保驻点检查', era: [2009, 2011], weight: 1,
    text: '监管暗访银保驻点销售，检查人员以客户身份进厅咨询保险。',
    effects: {},
    choices: [
      { text: '按规范流程介绍，主动出示产品性质与双录要求', outcome: '检查顺利通过，网点获得合规标杆点名。', effects: { fame: 1 } },
      { text: '为了业绩含糊其辞，把保险说成「储蓄」', outcome: '被暗访记录在案，网点被通报批评。', effects: { stress: 3 }, risk: 'red' },
    ],
    teach: '"存单变保单"的每一次都在监管的暗访名单上。',
  },
  {
    id: 're_card_install', title: '信用卡分期指标冲突', era: [2008, 2015], weight: 2,
    text: '分行下达信用卡分期任务，主管暗示向理财客户「顺手推分期」。',
    effects: {},
    choices: [
      { text: '只向真实有资金周转需求的客户推荐并讲清费率', outcome: '转化率不高但零投诉，客户反而认可你的坦诚。', effects: { trust: 1 } },
      { text: '见人就推，完成任务再说', outcome: '月底任务完成，客户抱怨「理财经理变成卡贩子」。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '任务要用合规的方式完成，否则代价更高。',
  },
  // ===== 2011-2015 转型年代 =====
  {
    id: 're_yeb_shock', title: '「宝类」冲击存款', era: [2013, 2015], weight: 3,
    text: '客户举着手机：「人家一元起存还能随时取，收益还比你们高，你们怎么办？」',
    effects: {},
    choices: [
      { text: '承认差距，帮客户做分层：活钱可以走货基，长期钱谈配置', outcome: '客户留住了大额资金，还开了基金账户。承认现实反而赢得尊重。', effects: { trust: 2 }, teach: 'cash_mgmt' },
      { text: '贬低对手：「那种东西风险大着呢」', outcome: '客户转身就走了——他懂的可能比你多。', effects: {} },
    ],
    teach: '利率市场化浪潮下，堵不如疏。',
  },
  {
    id: 're_panic_after', title: '钱荒后的恐慌客', era: [2013, 2014], weight: 2,
    text: '钱荒传闻后，一位客户坚持要取出全部存款「放家里保险柜」。',
    effects: {},
    choices: [
      { text: '讲存款保险制度与银行牌照的意义，给一个分步方案', outcome: '客户留下一半存款，另一部分买了国债。恐慌被专业拆解。', effects: { trust: 2 }, teach: 'deposit_insurance' },
      { text: '「您随意」，直接办理全部支取', outcome: '客户抱着现金走了。后来存款保险出台，他成了别人家的客户。', effects: {} },
    ],
    teach: '恐慌面前，制度和数据比安慰有用。',
  },
  {
    id: 're_hk_connect', title: '沪港通咨询潮', era: [2014, 2016], weight: 2,
    text: '「沪港通开了，帮我开通，我要买科技股！」咨询一天几十个。',
    effects: {},
    choices: [
      { text: '讲清港股交易规则差异（无涨跌停/T+0/仙股），做风险测评再开通', outcome: '开通客户质量高，有人在仙股上躲过一劫，专程回来道谢。', effects: { trust: 2 }, teach: 'cross_border' },
      { text: '批量开通冲开户数', outcome: '开户数暴涨，一个月后「买错股票」的投诉也暴涨。', effects: { stress: 3 }, risk: 'grey' },
    ],
    teach: '新通道开通日，适当性第一课。',
  },
  {
    id: 're_ipo_pool', title: '打新资金归集', era: [2014, 2016], weight: 2,
    text: '客户想把全家人的账户资金归集到一起打新，问你怎么操作。',
    effects: {},
    choices: [
      { text: '讲清打新规则与各自账户独立的要求，帮做资金规划', outcome: '客户按合规方式操作，中签与否都对你心存感激。', effects: { trust: 1 }, teach: 'account_class' },
      { text: '帮他想「借亲戚账户」的土办法', outcome: '亲戚账户纠纷传遍朋友圈，你的名字也在里面。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '规则的边界就是建议的边界。',
  },
  {
    id: 're_gone_boss', title: '民间借贷客户失联', era: [2011, 2014], weight: 2,
    text: '一位把大额存款转去「月息三分」民间借贷的老客户，电话突然打不通了。',
    effects: {},
    choices: [
      { text: '保留当时的风险提示记录，配合其家属报警与资产梳理', outcome: '客户资金损失大半但回来了：「你当年劝过我，是我不听。」仍愿把剩下的钱交给你。', effects: { trust: 2 }, teach: 'high_yield_trap' },
      { text: '赶紧把他从客户名单里划掉', outcome: '少了个「麻烦」，也少了所有知情人的信任。', effects: {} },
    ],
    teach: '风险提示留痕，既是免责更是责任。',
  },
  // ===== 2016-2020 净值化年代 =====
  {
    id: 're_new_rule_meet', title: '资管新规解读会', era: [2018, 2020], weight: 3,
    text: '资管新规落地，支行要办客户解读会，你负责主讲。',
    effects: {},
    choices: [
      { text: '认真备课：打破刚兑/净值化/期限匹配三个关键词讲透', outcome: '会后预约面谈的客户排到了两周后。危机年成了获客大年。', effects: { trust: 2, fame: 2 }, teach: 'nav_product' },
      { text: '照本宣科念文件', outcome: '台下刷手机。机会就这样流走。', effects: {} },
    ],
    teach: '每一次监管变革都是投资者教育的黄金窗口。',
  },
  {
    id: 're_p2p_collapse', title: 'P2P 爆雷客户求助', era: [2018, 2020], weight: 3,
    text: '客户哭着进来：投的网贷平台跑路了，60 万养老钱没了。',
    effects: {},
    choices: [
      { text: '陪她整理证据、指导报案，之后帮她重建保本的养老方案', outcome: '案件进展缓慢，但她每月都来网点存钱——「这里至少不会骗我」。', effects: { trust: 3 }, teach: 'high_yield_trap' },
      { text: '「早跟你说过别买」，划清界限', outcome: '话没错，但说给一个崩溃的人听，就是二次伤害。', effects: { stress: 1 } },
    ],
    teach: '客户踩坑后的第一反应，决定他后半生的资金去向。',
  },
  {
    id: 're_house_debate', title: '「房子还会涨吗」', era: [2016, 2021], weight: 3,
    text: '饭桌上客户们争论房价，「六个钱包上车」还是「现金为王」吵成一团，都等你表态。',
    effects: {},
    choices: [
      { text: '只讲框架：城镇化/人口/杠杆率三个变量，自住与投资分开谈', outcome: '有人失望你「不给答案」，但事后证明你让两个家庭避开了高位接盘。', effects: { trust: 2 }, teach: 'housing_vs_invest' },
      { text: '顺着多数人喊「还能涨」', outcome: '短期获得认同。几年后行情逆转，这些话都被截图翻出来过。', effects: { stress: 1 }, risk: 'grey' },
    ],
    teach: '预测点位是巫术，讲清变量是专业。',
  },
  {
    id: 're_star_board', title: '科创板开通适当性', era: [2019, 2021], weight: 2,
    text: '科创板开板，一位 62 岁的客户坚持要开通：「我炒了二十年股了！」',
    effects: {},
    choices: [
      { text: '按规则做风险测评与知识测评，不达标如实告知', outcome: '客户测评未达标被拒，最初不满，后来感谢：「那只 5 字头的股票退市了。」', effects: { trust: 1 }, teach: 'suitability' },
      { text: '帮他「想办法」绕过测评', outcome: '客户在科创板亏掉养老钱的一部分，投诉时提到了你的名字。', effects: { stress: 3 }, risk: 'red' },
    ],
    teach: '适当性制度保护的是客户，也是你自己。',
  },
  {
    id: 're_remote_service', title: '疫情远程服务', era: [2020, 2020], weight: 3,
    text: '网点关闭，客户群消息爆炸：定投扣款失败了、理财到期了、贷款要还了……',
    effects: {},
    choices: [
      { text: '制作《远程服务指南》逐条答疑，对高龄客户逐一电话回访', outcome: '复工后营业厅挤满「专程来道谢」的客户。那一年你的口碑是全行第一。', effects: { trust: 3, fame: 2 } },
      { text: '群里挂个自动回复「请拨打客服热线」', outcome: '客服热线占线，客户找不到人也找不到你。', effects: {} },
    ],
    teach: '客户看不见你的时候，才是服务真正见分晓的时候。',
  },
  // ===== 2021-2025 深水区 =====
  {
    id: 're_crowd_crash', title: '抱团瓦解安抚', era: [2021, 2022], weight: 3,
    text: '重仓「核心资产」基金一年腰斩，持有五年的老客户第一次动摇：「是不是该清了？」',
    effects: {},
    choices: [
      { text: '带他复盘买入逻辑是否变化：逻辑变了就换，逻辑没变就管住手', outcome: '客户选择减仓一半保留核心。两年后他专门回来谢谢那次「不逃底」的谈话。', effects: { trust: 2 }, teach: 'crowded_trade' },
      { text: '「基金就是要长期持有别动」，一刀切劝住', outcome: '客户半信半疑全仓死扛。用别人的方法论过自己的日子，迟早出事。', effects: {} },
    ],
    teach: '长期主义不是死扛的遮羞布。',
  },
  {
    id: 're_snowball_ask', title: '雪球产品咨询', era: [2021, 2023], weight: 2,
    text: '私行客户拿着某券商雪球产品宣传页：「15% 票息，只要不跌 20% 就……」',
    effects: {},
    choices: [
      { text: '画四种情景收益表：上涨/震荡/温和下跌/深跌，重点讲敲入后的亏损路径', outcome: '客户看完表沉默：「这票息原来是我自己承担的下跌。」放弃了深跌风险下的配置。', effects: { trust: 2 }, teach: 'snowball' },
      { text: '「结构复杂，反正高票息总没错」', outcome: '客户重仓买入，次年集中敲入。他在亏损清单上，你在追责名单外，但信任已死。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: '看不懂的产品，票息就是风险对价。',
  },
  {
    id: 're_pension_kpi', title: '个人养老金开户冲量', era: [2022, 2025], weight: 3,
    text: '分行下达个人养老金开户指标，同事建议「开户送米面油、帮客户代操作」。',
    effects: {},
    choices: [
      { text: '举办政策解读小沙龙，只给真正理解制度的客户开户', outcome: '开户数不多但缴存率高，分行通报表扬了「质量指标」。', effects: { fame: 1 }, teach: 'third_pillar' },
      { text: '送礼品+代操作冲开户数', outcome: '开户数完成，大量零缴存死户，次年指标翻倍，还查出代操作违规。', effects: { stress: 3 }, risk: 'red' },
    ],
    teach: '冲量冲出来的是数字，不是业务。',
  },
  {
    id: 're_ai_complaint', title: 'AI 客服投诉', era: [2023, 2025], weight: 2,
    text: '客户投诉：智能客服转了五圈解决不了问题，「机器人听不懂人话」。',
    effects: {},
    choices: [
      { text: '亲自接管该客户后续服务，并整理高频问题反馈产品部门', outcome: '问题闭环的同时，你的「真人服务」成了网点口碑样本。', effects: { trust: 1, fame: 1 } },
      { text: '「系统就是这样，习惯就好」', outcome: '客户把经历发上了社交平台，配图是你的网点门头。', effects: { fame: -1 } },
    ],
    teach: 'AI 时代最稀缺的服务是「有人负责」。',
  },
  {
    id: 're_cross_remittance', title: '跨境汇款尽调', era: [2022, 2025], weight: 2,
    text: '一位客户要向境外汇一大笔「学费」，材料却对不上，暗示你「通融一下」。',
    effects: {},
    choices: [
      { text: '按反洗钱要求补齐材料，宁慢勿错', outcome: '材料补齐后顺利汇出，客户起初嫌慢，后来庆幸：「那家收款方后来被查了。」', effects: { trust: 1 }, teach: 'aml' },
      { text: '材料不全先给汇', outcome: '这笔汇款出现在后续调查名单里，你写了十页情况说明。', effects: { stress: 3 }, risk: 'red' },
    ],
    teach: '合规的慢，是对客户和你自己的保护。',
  },
  {
    id: 're_inherit_visit', title: '遗产继承来网点', era: [2018, 2025], weight: 2,
    text: '一位中年人来办理已故父亲的存款支取，手续繁杂，情绪低落。',
    effects: {},
    choices: [
      { text: '列出材料清单、联系公证处指引，全程陪同办结', outcome: '办完后他红着眼眶道谢，把母亲账户也转了过来。服务发生在人生低谷时最被记得。', effects: { trust: 2 }, teach: 'succession' },
      { text: '「材料不齐，回去补齐再来」三次', outcome: '手续终究办完了，但客户对网点的印象只剩下「跑了三趟」。', effects: {} },
    ],
    teach: '继承业务办的是手续，接的是人心。',
  },
  {
    id: 're_rate_cut_call', title: '降息后的挪储潮', era: [2023, 2025], weight: 3,
    text: '存款利率再度下调，客户群炸锅：「利息一降再降，钱还能放哪？」',
    effects: {},
    choices: [
      { text: '办一场「低利率时代的钱怎么摆」讲座：四笔钱框架+久期策略', outcome: '客户按框架重排资产，大额存单与保险长期单成交两旺。降息成了配置升级的契机。', effects: { trust: 2, aum: 100000 }, teach: 'rate10y' },
      { text: '「没办法，大家都降」', outcome: '客户默默把钱挪去了同业的高息产品。你失去了唯一的解释窗口。', effects: {} },
    ],
    teach: '利率下行期，客户买的不是利率，是方案。',
  },
  {
    id: 're_data_leak', title: '客户信息外传事件', era: [2018, 2025], weight: 1,
    text: '同事把客户名单发到私人社交群「方便工作」，被你看到了。',
    effects: {},
    choices: [
      { text: '立即提醒删除并上报合规，推动全员数据安全培训', outcome: '通报批评+培训落地。你成了「不近人情」但被行长信任的人。', effects: { stress: 1 }, teach: 'data_compliance' },
      { text: '都是同事，提醒一句就算了', outcome: '名单流出，客户收到骚扰电话投诉到分行——追责名单里有「知情不报」。', effects: { stress: 3 }, risk: 'grey' },
    ],
    teach: '数据安全没有「下不为例」。',
  },
  {
    id: 're_gold_rush', title: '购金热潮', era: [2023, 2025], weight: 2,
    text: '金价连创新高，年轻客户扎堆问「攒金豆」和黄金积存，阿姨们问「该不该把存款换成金条」。',
    effects: {},
    choices: [
      { text: '分人群给方案：年轻人积存计划小额起步，长辈讲清波动与比例上限', outcome: '两类客户都各取所需，金价回调时没有人来找你麻烦。', effects: { trust: 2 }, teach: 'asset_allocation' },
      { text: '顺着热潮推销积存业务冲量', outcome: '金价回调 10%，重仓的长辈们把网点围了。', effects: { stress: 3 }, risk: 'grey' },
    ],
    teach: '任何资产的热度都是风险的另一种写法。',
  },
  {
    id: 're_quitting_client', title: '客户离职转创业', era: [2015, 2025], weight: 2,
    text: '企业高管客户辞职创业，账户资金计划全部转入公司账户运作。',
    effects: {},
    choices: [
      { text: '帮他做家企隔离方案：家庭资产防火墙+经营备用金规划', outcome: '创业三年起伏，家庭资产毫发无损。他说你是「唯一劝我隔离的人」。', effects: { trust: 3, aum: 50000 }, teach: 'risk_isolation' },
      { text: '资金转走了就转走吧', outcome: '两年后公司现金流断裂，家庭资产陪葬。你错过了最大的一次专业价值兑现。', effects: {} },
    ],
    teach: '客户的每一次重大人生变动，都是专业价值的窗口。',
  },
];
'''

s = io.open('content/src/random-events.ts', encoding='utf-8').read()
s = s.rstrip() + '\n' + EXTRA
io.open('content/src/random-events.ts', 'w', encoding='utf-8', newline='\n').write(s)
print('appended, total ids:', s.count("id: 're_") + EXTRA.count("id: 're_"))
