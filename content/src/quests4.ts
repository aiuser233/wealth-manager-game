import type { QuestDef } from '@fm/core';

/**
 * 卷四剧情（P5 第三批）：2021-2023，"从私行理财经理到团队管理者"的过渡五年。
 * 年代主线：抱团瓦解 → 房企债务危机 → 地区冲突与商品暴涨 → 破净赎回潮 → AI 元年。
 * 12 任务：私行服务的纵深（家办/税优/汇率/破净应对）+ 团队管理初体验。
 */
export const VOLUME4_QUESTS: QuestDef[] = [
  {
    id: 'q4_01_crowding_crash', volume: 4, title: '抱团瓦解：春节后的回撤', date: '2021-03-09',
    dialogues: [
      { speaker: '系统', text: '"核心资产"集体回撤 25%+。去年顶流基金的客户群从"膜拜"切换到"讨伐"，群里刷屏"坤坤害我"。' },
      { speaker: '陈曼', text: '（卷四开场）去年你拦住了几个梭哈的？今年他们就替你说好话。去年你怂恿的？今年他们就在你投诉单上。' },
    ],
    choices: [
      { text: '逐户复盘持仓逻辑：区分"逻辑坏了"与"价格跌了"', outcome: '你给每个重仓客户发了持仓归因：哪些是估值回归（可等），哪些是基本面恶化（该换）。三周后，你的客户群成了全行最"安静"的群。', grade: 'best', effects: { trust: 9, pro: 3 }, unlockKnowledge: ['crowded_trade', 'fund_evaluation'] },
      { text: '"长期持有就好"，群发安抚', outcome: '去年劝不住梭哈，今年劝不住割肉。同批客户，同一个你，只是方向反了。', grade: 'normal', effects: { stress: 2, trust: -2 } },
      { text: '让客户"换成防御基金"，多收一次申购费', outcome: '频繁换仓的摩擦成本+择时错误双重损耗。半年后回看，换错方向的客户年化少赚 15%。', grade: 'bad', effects: { sales: 1, trust: -4 } },
    ],
    teach: 'crowded_trade',
  },
  {
    id: 'q4_02_liumei_shop', volume: 4, title: '刘美凤的店关了', date: '2021-06-10', client: 'cli_liumei',
    dialogues: [
      { speaker: '刘美凤', mood: 'sad', text: '小林，姐的店撑不住了……疫情后街上没人，房租还涨。这十几年就攒下这套商铺，你说要不要卖了回血？' },
      { speaker: '陈曼', text: '（提醒）疫情冲击线下业态。商铺流动性差、税费高，"卖"之前要先算"三本账"。' },
    ],
    choices: [
      { text: '算三本账：交易税费/租金收益/机会成本，给出过渡方案', outcome: '商铺卖在低点税费吃掉 15%，你建议先转租、同步做小额信贷周转。半年后商圈回暖，她的店以更好的位置重新开张。', grade: 'best', effects: { trust: 8, pro: 2 }, unlockKnowledge: ['liquidity_risk', 'housing'] },
      { text: '"实体难做，卖了吧"，顺着客户说', outcome: '低点割肉+高额税费，她后来每次路过那条街都要念叨一次。', grade: 'normal', effects: { stress: 1 } },
      { text: '推荐她把全部余款买理财"生息"', outcome: '她真正的需求是现金流续命，不是理财收益。资金锁进封闭期，店却停了。', grade: 'bad', effects: { sales: 2, trust: -5 }, unlockKnowledge: ['closed_periodic'] },
    ],
    teach: 'liquidity_risk',
  },
  {
    id: 'q4_03_sunly_vaccine', volume: 4, title: '孙丽云的防疫津贴', date: '2021-09-08', client: 'cli_sunly',
    dialogues: [
      { speaker: '孙丽云', mood: 'smile', text: '林哥，防疫津贴+两年没休的假补贴，一次性发了 8 万。护士站都说我该谢谢你 2020 年没让我梭哈。这笔钱……还是你管？' },
      { speaker: '陈曼', text: '信任的复利到账了。这笔钱的属性：辛苦钱、确定用途（孩子的教育金定投继续）、风险偏好 R2。' },
    ],
    choices: [
      { text: '延续既有方案：教育金定投加码+医疗险补齐', outcome: '方案在旧地图上自然生长，她连风险测评都懒得重做——"按上次那个来"。这就是十五年的复利。', grade: 'best', effects: { trust: 7, aum: 80000, pro: 1 }, unlockKnowledge: ['education_fund', 'ltc'] },
      { text: '推当时最火的"新能源基金"', outcome: '她在新能源半山腰上车。2022 年这钱亏 30% 时，护士站的评价变成了另一句话。', grade: 'bad', effects: { sales: 2, trust: -4 } },
      { text: '"先放活期看看"', outcome: '8 万块在活期躺了一年，跑输通胀。她没说什么，但把一半资产转去了别的行。', grade: 'normal', effects: { aum: 30000 } },
    ],
    teach: 'education_fund',
  },
  {
    id: 'q4_04_housing_down', volume: 4, title: '房企债务危机与"保交楼"', date: '2021-11-15',
    dialogues: [
      { speaker: '系统', text: '头部房企债务危机发酵，期房停贷风波蔓延。"房子还能不能买"成为网点第一大问题。' },
      { speaker: '赵树理', mood: 'normal', text: '小林，我孙子要结婚，媳妇家里要求市区新房。售楼处说"工抵房打七折"，我心动又害怕。' },
    ],
    choices: [
      { text: '教"五看"：看五证/看资金监管/看交付记录/看企业负债/看合同条款', outcome: '你把购房风险清单打印给了他，还陪他去了两次售楼处。最后选中的楼盘开发商三道杠全绿。2023 年交付那天，他发了九宫格朋友圈。', grade: 'best', effects: { trust: 8, pro: 3, rep: 2 }, unlockKnowledge: ['housing', 'fraud_alert'] },
      { text: '"七折这么便宜，赶紧捡漏"', outcome: '工抵房的坑：停工楼盘七折也是纸面价。他差点把养老钱押进停工项目。', grade: 'bad', effects: { trust: -6, stress: 2 } },
      { text: '"现在都别买房"', outcome: '一刀切的恐惧传导。婚期推了一年，他孙子后来叫你"那个让爷爷错过婚房的阿姨叔"。', grade: 'normal', effects: { trust: -2 } },
    ],
    teach: 'housing',
  },
  {
    id: 'q4_05_fx_7_3', volume: 4, title: '汇率破 7.3：留学家庭的换汇时刻', date: '2022-09-28',
    dialogues: [
      { speaker: '李建国', mood: 'normal', text: '林哥，孩子下个月交学费，人民币都破 7.3 了！要不要把四年学费全换了？群里都说要破 8！' },
      { speaker: '陈曼', text: '（提醒）2022 年汇率承压。留学家庭的高频问题：分批换汇 vs 一次到位。' },
    ],
    choices: [
      { text: '分批换汇+远期锁汇工具介绍，首笔先换半年用量', outcome: '半年后汇率回落到 6.9，他省下两万多。他给你转了个红包，你没收，回复："这是你自己的判断力，我只是提供了工具箱。"', grade: 'best', effects: { trust: 7, pro: 3 }, unlockKnowledge: ['fx_risk', 'cny'] },
      { text: '"听群里的一次全换"', outcome: '换在顶点。他嘴上说没事，第二年学费汇款时找了个更便宜的银行。', grade: 'normal', effects: {} },
      { text: '"破 8 概率很大，建议加杠杆做多美元"', outcome: '让工薪家庭加杠杆做汇率投机，这是职业生涯的滑坡起点。', grade: 'bad', effects: { sales: 1, trust: -6, rep: -2 } },
    ],
    teach: 'fx_risk',
  },
  {
    id: 'q4_06_nav_break', volume: 4, title: '破净赎回潮：最长的两周', date: '2022-11-18',
    dialogues: [
      { speaker: '系统', text: '债市调整引发理财大面积破净，赎回负反馈螺旋。客服电话爆线，网点玻璃门被拍响。"稳健理财亏了"上同城热搜。' },
      { speaker: '王秀兰', mood: 'sad', text: '小林，我那个 R2 的理财，怎么红字了？你是不是骗我……' },
      { speaker: '陈曼', text: '王阿姨这句话，值一节培训课。净值化三年，客户第一次真的"自负盈亏"。你准备怎么接？' },
    ],
    choices: [
      { text: '面对面：回撤归因（利率而非信用）+修复预期+持有建议', outcome: '你给王秀兰画了债市利率图："债券没违约，是价格在呼吸。"她决定持有，三个月后净值修复，她逢人就说"小林没骗我"。这场危机，成了你的广告。', grade: 'best', effects: { trust: 12, pro: 4, rep: 4 }, unlockKnowledge: ['nav_product', 'nav_drawdown_read'] },
      { text: '电话里说"历史从没亏过"', outcome: '既不真也不合规。她后来在监管回访里复述了这句话——记录在案。', grade: 'bad', effects: { trust: -8, rep: -3, stress: 2 }, unlockKnowledge: ['red_lines'] },
      { text: '帮她赎回换成存款，息事宁人', outcome: '在净值最低点落袋为亏。她"安全"了，但三年后复盘，她比坚持持有少拿了 5 个点。', grade: 'normal', effects: { stress: 2, trust: 1 } },
    ],
    teach: 'nav_drawdown_read',
  },
  {
    id: 'q4_07_liumei_store2', volume: 4, title: '刘美凤的孙子与"高息"', date: '2022-12-20', client: 'cli_liumei',
    dialogues: [
      { speaker: '刘美凤', mood: 'normal', text: '小林，我孙子说他同学在搞什么"链上理财"，年化 30%，还说这是年轻人玩的，我给压岁钱让他试试？' },
      { speaker: '陈曼', text: '（警报）虚拟币炒作借着"年轻人"话术向青少年渗透。长辈的压岁钱成了入场券。' },
    ],
    choices: [
      { text: '给孙子上一堂"去中心化的真相"小课', outcome: '你用"击鼓传花+没有裁判"八个字讲透盘面逻辑，顺手给他看了央行等十部门公告。孙子删了 App，后来考上了金融系——他说第一课是你上的。', grade: 'best', effects: { trust: 9, rep: 6 }, unlockKnowledge: ['fraud_alert', 'high_yield_trap'] },
      { text: '"年轻人的事别管"，随他们去', outcome: '三个月后孙子同学的"链上理财"归零，压岁钱差点一起。刘美凤来网点时脸色很难看。', grade: 'normal', effects: { trust: -3 } },
      { text: '"那建议买我们的理财产品"', outcome: '答非所问。她要的是判断，你给的是推销。那通电话之后，她的丈夫（从不出面）换掉了账户。', grade: 'bad', effects: { sales: 2, trust: -5, aum: -200000 } },
    ],
    teach: 'fraud_alert',
  },
  {
    id: 'q4_08_team_lead', volume: 4, title: '带团队：第一个下属', date: '2023-03-15',
    dialogues: [
      { speaker: '王建平', text: '总行批了你的"私行团队负责人"职级试用。给你配了个人：新来的研究生小唐，三个月了一单没开。你带带。' },
      { speaker: '小唐', mood: 'normal', text: '林老师，我每天都在打电话，话术都背下来了……为什么客户就是不签？' },
    ],
    choices: [
      { text: '陪访三单，用 GROW 面谈找卡点：不是话术是倾听', outcome: '陪访录音复盘：小唐在客户说话时插话 23 次。你只改了他一个习惯——先复述客户的话再回应。第二个月，他开张了。', grade: 'best', effects: { trust: 5, comm: 3, rep: 3 }, unlockKnowledge: ['team_coaching', 'communication'] },
      { text: '把自己话术本给他抄', outcome: '你的话术长在你的经验里，长不在他的。三个月后他离职了，离职原因写"不适合"。', grade: 'normal', effects: { stress: 2 } },
      { text: '"业绩不行就滚蛋"，高压施压', outcome: '他当月开了两单——然后把一单做进了红线里。你作为主管连带担责。高压催生的不是业绩，是事故。', grade: 'bad', effects: { sales: 2, stress: 6, rep: -2 }, unlockKnowledge: ['team_coaching', 'red_lines'] },
    ],
    teach: 'team_coaching',
  },
  {
    id: 'q4_09_svb_2023', volume: 4, title: '海外银行挤兑风波', date: '2023-03-20',
    dialogues: [
      { speaker: '系统', text: '海外三家银行在两周内倒下或被接管，"存款还安全吗"的搜索量暴涨。持有海外资产的高净值客户连夜来电。' },
      { speaker: '周宏图', mood: 'normal', text: '小林，我子公司在海外有账户，那边银行看着要不行，我是不是要全取出来？' },
    ],
    choices: [
      { text: '讲清存款保险覆盖范围与该行的实际风险敞口', outcome: '你列了该行存款保险上限、他在该行的实际余额、以及分散账户方案。他听完只办了一件事：把超额部分分散到两家大行。恐慌止于计算。', grade: 'best', effects: { trust: 8, pro: 3 }, unlockKnowledge: ['deposit_insurance', 'global_crisis'] },
      { text: '"海外的事，不用管"', outcome: '他的财务总监第二天自己做了分散安排，顺便问了一句："你们理财经理不管海外业务吗？"', grade: 'normal', effects: {} },
      { text: '"要崩了，赶紧全取出来换黄金"', outcome: '基于恐慌的建议。三个月后该行股价收复失地，他算了一笔"听劝成本"，写进了给董事会的备忘录。', grade: 'bad', effects: { trust: -5, rep: -2 } },
    ],
    teach: 'deposit_insurance',
  },
  {
    id: 'q4_10_ai_year', volume: 4, title: 'AI 元年：理财经理会被替代吗', date: '2023-04-10',
    dialogues: [
      { speaker: '系统', text: '生成式 AI 席卷全球。行里上线智能助手：一秒生成配置建议书。支行里弥漫"我们要失业了"的气氛。' },
      { speaker: '小唐', mood: 'normal', text: '林老师，它三秒出一本书，我写一单要三天……我还有价值吗？' },
    ],
    choices: [
      { text: '现场演示：让 AI 给"王秀兰"出方案，再让它接王秀兰的电话', outcome: 'AI 的方案书漂亮极了，但它不知道王阿姨的儿子在外地、不知道她怕亏损。你接起电话聊了十分钟家常，方案落地。小唐懂了：AI 是你的速记员，不是你的替身。', grade: 'best', effects: { trust: 6, pro: 4, comm: 2 }, unlockKnowledge: ['ai_advisor_2024', 'technology'] },
      { text: '"AI 只是噱头，不用管"', outcome: '半年后，隔壁支行用 AI 工具把服务响应时间压缩到你们的十分之一，大客户活动被抢了三场。', grade: 'normal', effects: { stress: 2 } },
      { text: '全面依赖 AI 建议书，自己不再做功课', outcome: 'AI 幻觉给出了一支已清盘基金，你原样发给了客户。那天的尴尬，全支行传了三年。', grade: 'bad', effects: { rep: -3, stress: 3 }, unlockKnowledge: ['ai_advisor_2024'] },
    ],
    teach: 'ai_advisor_2024',
  },
  {
    id: 'q4_11_chenlz_legacy', volume: 4, title: '陈守业的交接班', date: '2023-08-18', client: 'cli_chenlz',
    dialogues: [
      { speaker: '陈守业', mood: 'normal', text: '小林，我儿子接厂子两年了，理念不合，父子俩半年没好好说话。厂子是给他，还是卖了？我夜里睡不着。' },
      { speaker: '陈曼', text: '（轻声）你等这一天等了十五年。企业主客户线的最后一题：传承，是治理问题，不是产品问题。' },
    ],
    choices: [
      { text: '组织三次家庭会议，引入家族宪章与职业经理人过渡', outcome: '第一次会议父子吵散，第二次谈出"业务与股权分离"，第三次形成五年过渡方案。签字那天，陈守业说："比厂子保住更重要的，是儿子愿意回家吃饭了。"', grade: 'best', effects: { trust: 12, rep: 5, aum: 800000 }, unlockKnowledge: ['family_office', 'succession', 'insurance_trust'] },
      { text: '直接推荐家族信托产品', outcome: '产品推了一堆，家庭矛盾原地踏步。传承的障碍从来不是缺工具，是缺对话。', grade: 'normal', effects: { sales: 2, stress: 1 } },
      { text: '"父子的事，我不好掺和"', outcome: '边界感没错，但客户托付的正是"掺和"的资格。三个月后他把家族业务交给了另一家银行的"陈老师"。', grade: 'bad', effects: { aum: -300000, trust: -5 } },
    ],
    teach: 'family_office',
  },
  {
    id: 'q4_12_vol4_end', volume: 4, title: '卷末：二十年的最后冲刺', date: '2023-12-20',
    dialogues: [
      { speaker: '陈曼', mood: 'smile', text: '我正式退休了。从 2006 年大厅里那个紧张的新人，到私行团队负责人——你的前二十年，一卷一卷走完了。' },
      { speaker: '陈曼', text: '最后一卷（2024-2025）是收官：个人养老金全面推开、市场熊牛转换、还有你的二周目。有什么想对我说的，师傅先说为敬——这卷你的成绩单，业绩、专业、红线、信任，都写在档案里了。' },
      { speaker: '林奇安', text: '（选择你的回答——卷四的路线，决定卷五的起始资源。）' },
    ],
    choices: [
      { text: '"师傅，专业这条路我走对了。"', outcome: '你获得了"专业传承"：卷五团队辅导效率 +30%，小唐提前转正。', grade: 'best', effects: { rep: 8, pro: 3 } },
      { text: '"业绩为纲，来年再冲。"', outcome: '你获得了"冲刺姿态"：卷五销售加成 +15%，但压力曲线更陡。', grade: 'normal', effects: { sales: 4, stress: 3 } },
    ],
    teach: 'volume_end',
  },
];
