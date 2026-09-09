import type { QuestDef } from '@fm/core';

/**
 * 卷二剧情（P5）：2010-2015，"从骨干到贵宾理财经理"的五年。
 * 年代主线：四万亿后的通胀与调控 → 2013 钱荒 → 2014 牛市启动 → 2015 配资牛与股灾。
 * 12 任务延续卷一人物线（王秀兰/李建国/周宏图/何志敏…），教学点对齐知识库 tag。
 */
export const VOLUME2_QUESTS: QuestDef[] = [
  {
    id: 'q2_01_inflation_2010', volume: 2, title: '负利率时代的第一课', date: '2010-10-20',
    dialogues: [
      { speaker: '系统', text: 'CPI 同比突破 4%，一年期定存利率 2.5%。负利率第一个完整年份，网点里"钱越存越薄"的抱怨此起彼伏。' },
      { speaker: '陈曼', text: '卷二开场题：客户问"存款是不是越存越穷"，你怎么答？记住，这一题的答案，会决定客户是"换个人问"还是"一直问你"。' },
    ],
    choices: [
      { text: '承认现实，给出"存款分层+低波理财+定投"的组合方案', outcome: '你把"承认通胀"放在第一句，客户反而安静了。三天后他带着老婆的存折又来了。', grade: 'best', effects: { trust: 6, pro: 2, aum: 120000 }, unlockKnowledge: ['negative_rate', 'inflation'] },
      { text: '"通胀是暂时的，存款最安全"', outcome: '话没错，但客户转头去了隔壁券商。负利率年份，安全感的反面是购买力焦虑。', grade: 'normal', effects: { stress: 1 } },
      { text: '"那就把存款都买成基金吧"', outcome: '一句轻飘飘的"都买"，两年后会让这位客户在 3200 点的柜台前质问你。', grade: 'bad', effects: { sales: 1, stress: 2 } },
    ],
    teach: 'negative_rate',
  },
  {
    id: 'q2_02_liqiang_second_home', volume: 2, title: '李建国的二套房 dilemma', date: '2011-04-15', client: 'cli_liqiang',
    dialogues: [
      { speaker: '李建国', mood: 'normal', text: '林哥，限购令下来了。我名下这套留着，再买一套投资行不行？丈母娘天天催。' },
      { speaker: '陈曼', text: '（提醒）2011 年限购全面铺开。算账题：首付、利率上浮、月供对现金流的三重挤压。' },
    ],
    choices: [
      { text: '做全家庭现金流体检，用数据说话再决策', outcome: '你画出了他家未来五年的现金流表。二套房计划悄悄变成了"给孩子攒教育金"。他媳妇后来逢人就夸你实在。', grade: 'best', effects: { trust: 7, pro: 2 }, unlockKnowledge: ['household_debt_ratio', 'family_lifecycle'] },
      { text: '"限购了买不了，没办法"', outcome: '政策解读没错，但客户要的是方案不是判词。这次谈话后，他三个月没来。', grade: 'normal', effects: {} },
      { text: '帮他凑首付上二套', outcome: '杠杆上去了，2014 年他差点断供。这一单的提成，你记到了 2015 年 7 月那个凌晨电话的账上。', grade: 'bad', effects: { sales: 3, stress: 3 } },
    ],
    teach: 'household_debt_ratio',
  },
  {
    id: 'q2_03_zhout_entrepreneur', volume: 2, title: '周宏图的对公陷阱', date: '2011-09-20', client: 'cli_zhout',
    dialogues: [
      { speaker: '周宏图', mood: 'smile', text: '小林，厂里资金周转，我听说有个"过桥贷"的路子，三天就能到账，就是利息高点。' },
      { speaker: '陈曼', text: '（提醒）2011 年信贷紧缩，民间借贷利率飙升。企业主的"过桥"需求是陷阱高发区。' },
    ],
    choices: [
      { text: '帮他梳理银行正规授信渠道，顺便做家企资产隔离', outcome: '你没赚这一单的钱，却在他 2012 年资金链最紧的时候救了他一命。对公转型的种子，是这时候种下的。', grade: 'best', effects: { trust: 8, rep: 2, pro: 2 }, unlockKnowledge: ['shadow_banking', 'risk_isolation'] },
      { text: '"过桥贷风险大，别碰"，就这一句', outcome: '劝阻是对的，但没给出路。他最后找了民间借贷——利率是 36%，不是你说的高点。', grade: 'normal', effects: { stress: 1 } },
      { text: '给他介绍"靠谱"的民间资金方', outcome: '资金方是你同学的。三个月后利息谈崩，周宏图的公司差点易主，你的名字出现在借条见证人一栏。', grade: 'bad', effects: { sales: 2, stress: 5, rep: -2 }, unlockKnowledge: ['red_lines'] },
    ],
    teach: 'shadow_banking',
  },
  {
    id: 'q2_04_hezm_wechat', volume: 2, title: '何志敏的朋友圈', date: '2012-06-10', client: 'cli_hezm',
    dialogues: [
      { speaker: '何志敏', mood: 'normal', text: '林哥，我在朋友圈发产品广告行吗？我们组的微信营销指标还没完成……' },
      { speaker: '陈曼', text: '（提醒）2012 年，银行人的朋友圈时代开始了。合规边界与获客效率的第一次正面冲突。' },
    ],
    choices: [
      { text: '教她"科普代替推销"：发市场解读，不发产品收益', outcome: '她成了支行朋友圈里最"好看"的那个号。半年后，客户主动找她开户——因为"看她的朋友圈能学到东西"。', grade: 'best', effects: { trust: 4, comm: 2, rep: 2 } },
      { text: '"把产品图配上收益率发就行"', outcome: '两条广告后，合规检查通报点名。她第一次知道，朋友圈也是销售行为的延伸。', grade: 'normal', effects: { stress: 2 } },
      { text: '帮她把产品收益 P 得亮眼一点', outcome: '数据造假的一公里，是从 P 图开始的。三个月后的客户投诉里，截图为证。', grade: 'bad', effects: { rep: 1, stress: 4 } },
    ],
    teach: 'marketing_compliance',
  },
  {
    id: 'q2_05_money_fund_2013', volume: 2, title: '宝宝类冲击波', date: '2013-06-25',
    dialogues: [
      { speaker: '系统', text: '钱荒余波未平，互联网货币基金以"1 元起存、随存随取、6% 七日年化"横扫市场。网点存款大搬家，大厅里的中老年客户都举着手机。' },
      { speaker: '王建平', text: '存款流失 800 万！小林，你想想办法！' },
    ],
    choices: [
      { text: '给客户讲清收益构成，推出我行现金管理组合承接', outcome: '你把"宝宝类"的收益拆给大家看：大部分是钱荒期间的市场利率红利，不可持续。然后给出了我行的替代方案。搬家止住了，客户也学会了看七日年化。', grade: 'best', effects: { trust: 6, pro: 3, aum: 200000 }, unlockKnowledge: ['money_fund', 't+0_money', 'liquidity_ratios'] },
      { text: '"网上那些不安全，钱放银行才稳"', outcome: '恐吓式挽留。客户嘴上应着，手上的 App 没停。三个月后你的存款任务完成率垫底。', grade: 'bad', effects: { stress: 3, rep: -1 }, unlockKnowledge: ['money_fund'] },
      { text: '坦然承认差距，专注服务好留下的客户', outcome: '不争一时流量。你把精力花在"到店客户"身上，服务口碑反而上去了。数字化冲击，第一课：不跟渠道拼速度，跟客户拼信任。', grade: 'normal', effects: { comm: 1, aum: 50000 } },
    ],
    teach: 'money_fund',
  },
  {
    id: 'q2_06_wangxl_wealth_mgmt', volume: 2, title: '王秀兰的"稳健理财"第一课', date: '2013-11-08', client: 'cli_wangxl',
    dialogues: [
      { speaker: '王秀兰', mood: 'normal', text: '小林，隔壁支行说有个理财，预期收益 5.8%，比你们高。是不是真的呀？' },
      { speaker: '陈曼', text: '（提醒）2013 年理财刚兑末期，"预期收益率"被当成承诺卖。这一课要教的是：怎么看穿预期收益三个字。' },
    ],
    choices: [
      { text: '逐条讲清"预期≠承诺"，把投向、久期、风险等级拆给她看', outcome: '王秀兰听完说："那还是买你们这个 5.2 的，讲得明白。"——她买的不是收益，是看得懂。', grade: 'best', effects: { trust: 7, pro: 2, aum: 150000 }, unlockKnowledge: ['fd_vs_wealth', 'closed_periodic'] },
      { text: '"他们那产品底层有问题"，focus 攻击对手', outcome: '说得或许没错，但拿不出证据的贬低只会显得酸。她去了隔壁。', grade: 'normal', effects: {} },
      { text: '承诺"我这也能给到 5.8"', outcome: '为了留客把话说满了。这款产品到期 5.0%，她在 2014 年的开门红说明会上提了一句。就一句。', grade: 'bad', effects: { sales: 1, trust: -3 } },
    ],
    teach: 'fd_vs_wealth',
  },
  {
    id: 'q2_07_2014_bull_start', volume: 2, title: '牛市来了：第一批追涨的客户', date: '2014-12-08',
    dialogues: [
      { speaker: '系统', text: '降息引爆行情，沪指两周上涨 20%，券商营业部排起开户长队。沉默了七年的老股民群聊全部复活。' },
      { speaker: '陈曼', mood: 'serious', text: '行情来得又快又急。现在，全支行的客户都在问同一句话：买什么？这一题考验的不是判断，是节奏。' },
    ],
    choices: [
      { text: '分批建仓纪律先行：按风险等级分层配权益，写明止盈纪律', outcome: '你给每个人配了不同的"仓位速度表"。2015 年 6 月回头看，这张表救了至少五个家庭。', grade: 'best', effects: { trust: 8, pro: 3, aum: 300000 }, unlockKnowledge: ['chasing_high', 'rebalancing'] },
      { text: '"牛市来了，别拦着客户赚钱"', outcome: '短期业绩全线飘红。2015 年 4 月，这些客户会拿着翻倍的浮盈来找你加杠杆。祸根，是这个月埋的。', grade: 'normal', effects: { sales: 3, aum: 200000, stress: 2 } },
      { text: '劝所有客户"别追高风险太大"', outcome: '一刀切的保守。客户看你三个月，眼睁睁看着别人赚钱——然后把你拉黑，去找那个敢让他满仓的人。', grade: 'normal', effects: { trust: -2, stress: 2 } },
    ],
    teach: 'chasing_high',
  },
  {
    id: 'q2_08_liqiang_leverage', volume: 2, title: '配资的电话', date: '2015-04-20', client: 'cli_liqiang',
    dialogues: [
      { speaker: '李建国', mood: 'smile', text: '林哥！我账户翻倍了！邻居介绍个配资平台，1:4 杠杆，我把房子抵押了……就想再搏一把，给孩子换学区房。' },
      { speaker: '陈曼', text: '（警报）2015 年 4 月。场外配资规模顶峰，1:4 杠杆意味着两个跌停爆仓。这个电话，是 6 月 15 日的前奏。' },
    ],
    choices: [
      { text: '当面算爆仓表：两个跌停本金归零，学区房变法拍房', outcome: '你花了一晚上做出三张表：账户走势、爆仓价位、房产法拍流程。第二天他红着眼说"再想想"。后来他说，那是他这辈子最贵的一晚上。', grade: 'best', effects: { trust: 10, pro: 3 }, unlockKnowledge: ['leverage_risk', 'forced_liquidation'] },
      { text: '"配资平台不合规，别碰"，点到为止', outcome: '劝了，但没拦住。他转头找了个"更专业的"。6 月底，你接到那个凌晨两点的电话。', grade: 'normal', effects: { stress: 3 } },
      { text: '" 牛市里杠杆没什么，注意仓位就行"', outcome: '1:4 杠杆加"注意仓位"等于零。7 月的账单上，他的本金归零，你的信任归零，房贷断供第 43 天。', grade: 'bad', effects: { trust: -8, stress: 5 }, unlockKnowledge: ['forced_liquidation'] },
    ],
    teach: 'leverage_risk',
  },
  {
    id: 'q2_09_5178_top', volume: 2, title: '5178：山顶的众生相', date: '2015-06-12',
    dialogues: [
      { speaker: '系统', text: '沪指站上 5178 点。营业部人声鼎沸，"改革牛""国家牛"刷屏。所有人都在谈论 6124 什么时候突破。' },
      { speaker: '陈曼', mood: 'serious', text: '你经历过 6124。你知道山顶的风有多冷。今天，轮到你来做那个"说冷话"的人。' },
    ],
    choices: [
      { text: '批量提醒：重仓客户逐户电话，止盈纪律白纸黑字', outcome: '你打出 47 个电话，被挂断 39 个。八天后，那 39 个号码里有人再也没打回来过。而你打完的那 8 个客户，成了你此后十年的口碑本金。', grade: 'best', effects: { trust: 12, stress: 6, pro: 3, rep: 3 }, unlockKnowledge: ['euphoria_top', 'herding_collapse'] },
      { text: '发一条风险提示的朋友圈，就算尽到责任了', outcome: '指尖上的尽责。6 月 26 日后，有客户拿着截图问你："就一条朋友圈？"你答不上来。', grade: 'normal', effects: { stress: 2, trust: -2 } },
      { text: '自己也加了点仓位，顺风不浪白不浪', outcome: '你把自己也卷了进去。7 月初你一边接客户的哭诉电话，一边看着自己的账户。那年夏天你瘦了八斤。', grade: 'bad', effects: { stress: 8, trust: -5 } },
    ],
    teach: 'euphoria_top',
  },
  {
    id: 'q2_10_crash_july', volume: 2, title: '千股跌停的那两周', date: '2015-07-08',
    dialogues: [
      { speaker: '系统', text: '连续千股跌停，两融强平、配资爆仓潮涌。营业部电话被打爆，大厅里坐着不肯走的客户。' },
      { speaker: '赵树理', mood: 'sad', text: '小林……我那 60 万，是不是就没了？我孙子下个月要交学费……' },
      { speaker: '陈曼', text: '这一刻，没有话术。只有你平时存下来的信任余额，和眼前这半个月的工作量。' },
    ],
    choices: [
      { text: '逐户排查强平风险，优先处理影响生活的仓位', outcome: '你把客户按"影响生活程度"排序：养老钱、学费、房贷在前，闲钱在后。两周不眠不休后，全网点没有一个客户爆仓到影响基本生活。行长在总结会上念了你的名字。', grade: 'best', effects: { trust: 12, comm: 2, stress: 8, rep: 3 }, unlockKnowledge: ['forced_liquidation', 'crisis_communication', 'panic'] },
      { text: '按资产规模排序，先稳住大客户', outcome: '大客户的钱保住了，赵树理的 60 万在第三个跌停被强平。他后来把孙子学费的事说了三年。', grade: 'normal', effects: { rep: 1, trust: -4, stress: 5 } },
      { text: '"市场系统性风险，谁也没办法"', outcome: '这是实话。实话在这种时刻说出来，等于零。', grade: 'bad', effects: { trust: -8, stress: 3 } },
    ],
    teach: 'crisis_communication',
  },
  {
    id: 'q2_11_wangxl_fraud', volume: 2, title: '15% 的"养老项目"', date: '2015-09-10', client: 'cli_wangxl',
    dialogues: [
      { speaker: '王秀兰', mood: 'normal', text: '小林，邻居张姨介绍了个养老公寓项目，年化 15%，还送鸡蛋。我去看了，楼都盖一半了……是真的吧？' },
      { speaker: '陈曼', text: '（警报）股灾后的资金要找出路，非法集资正在下乡进社区。老年客户是这个阶段的第一受害群体。' },
    ],
    choices: [
      { text: '陪她去"实地考察"，现场拆解资金盘逻辑', outcome: '你陪她去了那栋盖一半的楼，教她三个问题：钱借给谁、抵押物在哪、谁监管资金。她回家路上删了张姨的电话。后来那平台果然爆雷，刑侦通报里出现"养老公寓"四个字。', grade: 'best', effects: { trust: 12, pro: 2 }, unlockKnowledge: ['fraud_alert', 'high_yield_trap'] },
      { text: '"那是骗局，别去"，语气坚决', outcome: '她表面答应，转头还是投了 5 万"试试"——你不给解释，她就去问给解释的人。', grade: 'normal', effects: { stress: 2, trust: -2 } },
      { text: '"这种项目水深，我也说不清"', outcome: '理财经理最不该说的话。她投了 20 万——那是她准备换养老院的钱。', grade: 'bad', effects: { trust: -10, stress: 4 } },
    ],
    teach: 'fraud_alert',
  },
  {
    id: 'q2_12_vol2_end', volume: 2, title: '卷末：贵宾评审', date: '2015-12-18',
    dialogues: [
      { speaker: '王建平', mood: 'serious', text: '股灾这一年，全支行投诉率上升 40%，你的客户投诉是零。评审组问我要理由，我说：去查他的通话记录，47 个止盈电话都在。' },
      { speaker: '陈曼', mood: 'smile', text: '十年了。从见习到贵宾理财经理。卷三开始的年代是资管新规的前夜——整个行业都要变天。说说吧，这五年你记住了什么？' },
      { speaker: '林奇安', text: '（选择你的回答——这决定你卷三在"净值化转型"中的立场与资源。）' },
    ],
    choices: [
      { text: '"风险不是躲过去的，是提前说透的。"', outcome: '评审组给了满分评语："前置沟通能力突出"。你获得卷三资源：客户主动转介绍 +30%，净值化转型议题的话语权。', grade: 'best', effects: { rep: 10 } },
      { text: '"熊市客户记不住你，牛市守规矩才是本事。"', outcome: '这句行话让在座的老银行们纷纷点头。你获得了"圈内认可"：对公转介机会，但散户服务精力被压缩。', grade: 'normal', effects: { sales: 4, rep: 3 } },
    ],
    teach: 'volume_end',
  },
];
