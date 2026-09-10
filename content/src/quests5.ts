import type { QuestDef } from '@fm/core';

/**
 * 卷五剧情（P5 第三批）：2024-2025，收官卷。
 * 年代主线：微盘股危机与国家队 → 9·24 一揽子政策 → 个人养老金全面推开 → 关税冲击 → AI 全面落地。
 * 12 任务：二十年的终点+六结局铺垫（legacy 场次按玩家生涯分支给不同落幕词）。
 */
export const VOLUME5_QUESTS: QuestDef[] = [
  {
    id: 'q5_01_microcap', requires: 'q4_12_vol4_end', volume: 5, title: '微盘股流动性危机', date: '2024-01-22',
    dialogues: [
      { speaker: '系统', text: '量化中性策略踩踏，微盘股连续跌停，雪球产品集中敲入。"挂了两周都没卖出去"成为股吧高频词。' },
      { speaker: '小唐', mood: 'normal', text: '林总，有个客户买的产品底层是雪球，敲入了。他打电话来语气很平静——平静得吓人。' },
    ],
    choices: [
      { text: '第一优先级：接住情绪。约面谈而非电话', outcome: '你在包间见他，第一句话是"我懂你现在的感受"。四十分钟后，他签的不是赎回单，是组合调整方案。平静的人，最容易走极端。', grade: 'best', effects: { trust: 9, pro: 3, comm: 2 }, unlockKnowledge: ['structured_product_risk', 'panic'] },
      { text: '"流动性风险而已，等等就好"', outcome: '客户平静地挂了电话，然后销了户。三个月后你在同业聚会上听说，他在别的行做了更大的配置。', grade: 'normal', effects: { aum: -200000, stress: 2 } },
      { text: '"早就提示过风险"，先撇责任', outcome: '哪怕真的提示过，这句话在客户耳中就是"活该"。他带走了他还有的全部资产。', grade: 'bad', effects: { trust: -8, aum: -300000 } },
    ],
    teach: 'structured_product_risk',
  },
  {
    id: 'q5_02_national_team', volume: 5, title: '国家队入场：信心保卫战', date: '2024-02-06',
    dialogues: [
      { speaker: '系统', text: '中央汇金宣布扩大 ETF 增持范围，监管换帅，市场暴力反弹。客户群从"绝望"一键切换到"狂热"。' },
      { speaker: '王建平', text: '见底了见底了！赶紧让客户加仓！——小林，这次你打算怎么办？' },
    ],
    choices: [
      { text: '"底部是区域不是点位"：分批回补纪律', outcome: '你给了客户"三三制"回补表：确认信号后分三批。三个月后复盘，跟着表的客户成本比追高的低 8%。纪律再次跑赢情绪。', grade: 'best', effects: { trust: 7, pro: 3 }, unlockKnowledge: ['policy_stimulus', 'rebalancing'] },
      { text: '转发"历史大底"文章带动情绪', outcome: '情绪是对的，方法是没有的。客户满仓进场，5 月的回落让他们再次体感过山车。', grade: 'normal', effects: { stress: 2 } },
      { text: '"反弹就是出货机会"，劝客户清仓', outcome: '又判断反了。客户在 3 月清仓，看着指数走完全年牛市。你的"稳健"成了群里两年的梗。', grade: 'bad', effects: { trust: -5, aum: -150000 } },
    ],
    teach: 'policy_stimulus',
  },
  {
    id: 'q5_03_pension_nationwide', volume: 5, title: '个人养老金全面推开', date: '2024-12-16',
    dialogues: [
      { speaker: '系统', text: '个人养老金制度从 36 试点推向全国，账户开户竞赛在各行展开。网点晨会口号："人人有账户，户户有配置。"' },
      { speaker: '小唐', mood: 'normal', text: '林总，行里下了 2000 户的开户指标。我发现好多客户连个税都没交到起征点，也在拉人开户……这样行吗？' },
    ],
    choices: [
      { text: '叫停凑数式开户，改为"适配人群精准触达"', outcome: '你给团队做了适配矩阵：边际税率 10%+ 优先，3% 及以下说清利弊。开户数少了，但投诉是零，次年续缴率全行第一。', grade: 'best', effects: { trust: 6, rep: 4, pro: 2 }, unlockKnowledge: ['pension_2024', 'third_pillar'] },
      { text: '完成指标要紧，先开了再说', outcome: '季度末指标第一，次年一季度退户潮同样第一。总行通报里有两行字在说这件事。', grade: 'bad', effects: { sales: 3, rep: -3, stress: 3 } },
      { text: '"上面怎么安排我们怎么执行"', outcome: '执行没有错，但执行者对结果的麻木，是比错误本身更大的隐患。', grade: 'normal', effects: { stress: 1 } },
    ],
    teach: 'pension_2024',
  },
  {
    id: 'q5_04_sep24', requires: 'q5_01_microcap', volume: 5, title: '9·24：一揽子政策组合拳', date: '2024-09-24',
    dialogues: [
      { speaker: '系统', text: '降准降息+创设新货币政策工具支持股市+地产政策松绑，一揽子政策公布。沪指一周暴涨，成交额创历史纪录。' },
      { speaker: '陈曼', text: '（视频连线）退休前没赶上 9·24。小林，这是你职业生涯的第四次大底。前三次你都在场——这一次，全网点的人都在看你怎么做。' },
    ],
    choices: [
      { text: '先给踏空客户做"追高风险评估"，再给深套客户做解套方案', outcome: '你把客户分成了"没上车的"和"套了四年的"两批人，给前者讲追高风险，给后者讲回本纪律。10 月 8 日冲高的那天，你的客户没有一个在山顶站岗。', grade: 'best', effects: { trust: 12, pro: 4, rep: 4 }, unlockKnowledge: ['chasing_high', 'panic', 'rebalancing'] },
      { text: '全员群发"牛市来了"', outcome: '客户在 10 月 8 日的高点集中申购。11 月的回撤里，你 9 月的欢呼被截图了 37 次。', grade: 'bad', effects: { sales: 2, trust: -6, stress: 3 } },
      { text: '自己先重仓，事后再劝客户', outcome: '先己后人。客户不知道，但你知道——这比被知道更折磨人。', grade: 'bad', effects: { stress: 5, trust: -3 } },
    ],
    teach: 'chasing_high',
  },
  {
    id: 'q5_05_sunly_pension', volume: 5, title: '孙丽云的退休倒计时', date: '2025-01-15', client: 'cli_sunly',
    dialogues: [
      { speaker: '孙丽云', mood: 'smile', text: '林哥，我 55 岁，还有 5 年退休。这一辈子，孩子的教育金、我的医疗险都是你配的。最后这程……养老钱，交给你了。' },
      { speaker: '陈曼', text: '客户把"最后一程"交给你，是这个行业最高的勋章。记住：退休前五年的风险偏好，永远比她的测评表更保守。' },
    ],
    choices: [
      { text: '三桶金终稿：现金桶+保障桶+生钱桶，前五年逐步降波', outcome: '你给她设计了"退休前五年降波路线图"：每年降 10% 权益，55 岁时现金桶覆盖三年支出。她说："我终于知道退休是什么颜色了——是绿色的，稳稳的。"', grade: 'best', effects: { trust: 10, pro: 3, aum: 300000 }, unlockKnowledge: ['retirement_plan', 'withdrawal', 'third_pillar'] },
      { text: '为了业绩给她配 40% 权益', outcome: '她信你。2026 年的波动她扛得住，2027 年的退休日却可能赶上谷底。测评表没错，但人生阶段错不起。', grade: 'bad', effects: { sales: 3, stress: 3 }, unlockKnowledge: ['withdrawal'] },
      { text: '全买大额存单，简单省事', outcome: '安全是安全了，但 30 年期通胀把购买力磨掉三成。她的"最后一程"走得很稳，也很慢。', grade: 'normal', effects: { aum: 150000 } },
    ],
    teach: 'withdrawal',
  },
  {
    id: 'q5_06_tariff_2025', volume: 5, title: '关税冲击：熟悉的剧本又来了', date: '2025-04-08',
    dialogues: [
      { speaker: '系统', text: '新一轮关税冲击落地，全球市场剧震。2018 年的剧本重演，但这次的客户都经历过一次。' },
      { speaker: '赵树理', mood: 'normal', text: '小林，这行情我看熟了——2018 年那次你跟我说"慢变量"，这次还管用不？' },
    ],
    choices: [
      { text: '"管用，而且这次您比我更有经验"', outcome: '你把他的持仓做了压力测试，附了一句"上次您拿了两年回本，这次我们提前把仓位降到能睡着的位置"。老客户的信任，是共同经历攒出来的。', grade: 'best', effects: { trust: 9, pro: 2 }, unlockKnowledge: ['trade_war', 'panic'] },
      { text: '"历史不会简单重复"，讲宏观', outcome: '讲得都对，但他要的不是预测，是"我的钱这次怎么办"。', grade: 'normal', effects: { stress: 1 } },
      { text: '"这次不一样，赶紧清仓"', outcome: '这句话在 2018、2020、2022 各喊过一次，三次都错。第四次说出口时，客户群安静得可怕。', grade: 'bad', effects: { trust: -6, aum: -200000 } },
    ],
    teach: 'trade_war',
  },
  {
    id: 'q5_07_liqiang_college', volume: 5, title: '李建国的空巢期', date: '2025-02-20', client: 'cli_liqiang',
    dialogues: [
      { speaker: '李建国', mood: 'smile', text: '林哥，孩子去外地上学了。家里突然安静得可怕。我和你嫂子算了算，突然多出来每月四千块……这钱怎么安排？' },
      { speaker: '陈曼', text: '空巢期是家庭现金流的"第二春"，也是最容易被挥霍掉五年的时候。' },
    ],
    choices: [
      { text: '把"多出来的现金流"直接升级为养老金定投', outcome: '四千块无缝转入养老三支柱：个人养老金顶格+稳健定投。他笑称"孩子读大学，我们的养老账户也上大学"。二十年后这笔钱会替你感谢今天。', grade: 'best', effects: { trust: 8, aum: 200000, pro: 2 }, unlockKnowledge: ['third_pillar', 'dca'] },
      { text: '"辛苦这么多年，该享受享受了"', outcome: '旅游、换车、下馆子。五年后孩子毕业要买房，两口子翻遍账户发现"多出来的钱"没存下一分。', grade: 'normal', effects: { stress: 1 } },
      { text: '推给他一份年金险' + '，不看条款', outcome: '不看需求的推销。年金没错，错在"突然"。他签了字，次年猶豫期一过就问能不能退。', grade: 'bad', effects: { sales: 2, trust: -3 } },
    ],
    teach: 'third_pillar',
  },
  {
    id: 'q5_08_wangxl_legacy', volume: 5, title: '王秀兰的最后一课', date: '2025-03-10', client: 'cli_wangxl',
    dialogues: [
      { speaker: '王秀兰', mood: 'smile', text: '小林，我都 67 了。钱的事都交代好了：孙女上大学的钱、我和老伴的养老钱、还有……我想留一点给社区图书馆。你帮我把这几件事捋顺。' },
      { speaker: '陈曼', text: '19 年了。2006 年那个存折皱巴巴的王阿姨，如今要做的是一张家庭财富清单。这一课的名字叫"传承"。' },
    ],
    choices: [
      { text: '一张家庭财富总表+受益人架构体检+慈善愿望落地', outcome: '你花了三周，把她二十年的账户、保单、房产理成一张总表，遗嘱意愿用保险受益人+慈善捐赠落地。签字那天她说："我这辈子没读过多少书，最后这本是你帮我写的。"', grade: 'best', effects: { trust: 12, rep: 5, aum: 400000 }, unlockKnowledge: ['succession', 'charity_plan', 'insurance_trust'] },
      { text: '直接推家族信托', outcome: '门槛与需求错配。她需要的是一张理得清的表，不是一份法律文件。', grade: 'normal', effects: { sales: 1, stress: 1 } },
      { text: '"您身体好着呢，不急"', outcome: '回避死亡话题是这一行的通病。她笑了笑没说话，半年后把这件事托付给了公证处。', grade: 'bad', effects: { trust: -5, aum: -200000 } },
    ],
    teach: 'succession',
  },
  {
    id: 'q5_09_liumei_fraud_final', volume: 5, title: '最后的骗局：AI 换脸的"儿子"', date: '2025-05-12', client: 'cli_liumei',
    dialogues: [
      { speaker: '刘美凤', mood: 'sad', text: '小林，快！我儿子视频里说他在国外出车祸了，要 80 万手术费！视频里真是他啊！' },
      { speaker: '陈曼', text: '（警报）AI 换脸诈骗。2025 年最高发的针对中老年客群的骗局——视频是真的"像"，人是假的。' },
    ],
    choices: [
      { text: '一键挂断+反诈专线+教你"暗语验证"', outcome: '你陪她打了 96110，教她设置母子间只有两人知道的"暗语"。半小时后真儿子来电话："妈，我在上班啊？"刘美凤坐在大厅里哭了，握着你的手不放。这一次，你救下了她全部的养老钱。', grade: 'best', effects: { trust: 15, rep: 8, comm: 3 }, unlockKnowledge: ['fraud_alert', 'technology'] },
      { text: '"可能是假的，您先别转"，远程劝一句', outcome: '她急得挂了你电话。半小时后 80 万转了出去——你在总结会上说，那 30 分钟的距离，是 80 万的距离。', grade: 'bad', effects: { trust: -10, rep: -3, stress: 5 } },
      { text: '"先把理财赎出来再说"', outcome: '劝阻变成了操作指引。幸而最后一步被风控拦下——但你的角色，差点从守护者变成帮凶。', grade: 'normal', effects: { stress: 3 } },
    ],
    teach: 'fraud_alert',
  },
  {
    id: 'q5_10_ai_landing', volume: 5, title: 'AI 全面落地：人机协作的边界', date: '2025-08-15',
    dialogues: [
      { speaker: '系统', text: 'AI 应用全面落地：智能投顾接入全国网点，客户经理人均服务客户数提升 3 倍。行业讨论"理财经理会不会消失"。' },
      { speaker: '小唐', mood: 'smile', text: '林总，我现在一个人管 600 个客户，AI 帮我盯盘写报告。但上周有位客户阿姨，非要见到"真人"才肯签。' },
    ],
    choices: [
      { text: '确立"AI 管效率、人管温度"的团队分工', outcome: '你把团队重新分工：AI 负责数据、报告、盯盘提醒，人负责面谈、危机、传承。季度客户满意度创新高，离职率为零。二十年前的你和今天的团队，隔着一场工具革命，守着同一个内核。', grade: 'best', effects: { trust: 8, rep: 5, pro: 4 }, unlockKnowledge: ['ai_advisor_2024', 'team_coaching'] },
      { text: '"AI 迟早替代我们，教会徒弟饿死师傅"', outcome: '藏私的师傅带不出团队。小唐半年后调去了总行数字化办公室——带走了他跟你的全部笔记。', grade: 'normal', effects: { stress: 2 } },
      { text: '让 AI 直接给客户打电话销售', outcome: '监管新规三天后到：AI 外呼需明确身份告知+禁止主动销售。你的创新，成了全行警示案例。', grade: 'bad', effects: { rep: -4, stress: 4 }, unlockKnowledge: ['ai_advisor_2024'] },
    ],
    teach: 'ai_advisor_2024',
  },
  {
    id: 'q5_11_qiandd_reborn', volume: 5, title: '钱进的第二人生', date: '2025-09-18', client: 'cli_qiandd',
    dialogues: [
      { speaker: '钱进', mood: 'normal', text: '林哥，拆迁款那点钱我早就花完了，但这几年跟你学的"先保命再生钱"让我没背一分债。现在我自己开了家小店——这次，本金是攒出来的。' },
      { speaker: '陈曼', text: '2006 年那个拆迁暴发户，如今是稳健的小老板。客户会变，这才是人生线的意义。' },
    ],
    choices: [
      { text: '为小店做"家企分开"的开业体检', outcome: '公私账户、记账制度、保险三件套，开业当天全部就位。他说："上次创业我用的是运气，这次用的是你给的清单。"', grade: 'best', effects: { trust: 8, pro: 2, aum: 150000 }, unlockKnowledge: ['risk_isolation', 'cashflow'] },
      { text: '"先贷一笔扩大规模"', outcome: '他照做了，但这次没做现金流预测。三个月后小店周转告急——你重复了 2011 年周宏图的课，只是这次学生换成了钱进。', grade: 'bad', effects: { sales: 2, trust: -4 } },
      { text: '"做小生意的，买份保险就行了"', outcome: '保险买对了，经营错排了。他后来问过三次"账户里的钱怎么规划"，你都没接住。', grade: 'normal', effects: { sales: 1 } },
    ],
    teach: 'risk_isolation',
  },
  {
    id: 'q5_12_vol5_end', requires: 'q5_04_sep24', volume: 5, title: '卷末·二十年：你的结局', date: '2025-12-31',
    dialogues: [
      { speaker: '系统', text: '2025 年 12 月 31 日。二十年前重生回来的那天，你 25 岁，在城东支行的大厅里签到。今天，一切尘埃落定。' },
      { speaker: '陈曼', text: '（退休返聘仪式）我看着你从见习到私行团队负责人。二十年，你说说——如果重来一次，你会怎么走？' },
      { speaker: '林奇安', text: '（这正是你已经走过的路。你的选择、你的违规记录、你客户的信任余额，共同构成了你的结局。）' },
      { speaker: '王秀兰', mood: 'smile', text: '小林啊，19 年了。当年你教我利息税，如今你陪我理完了这辈子。' },
      { speaker: '李建国', mood: 'smile', text: '从每月 800 的定投到养老三支柱，我家的每一步都有你。' },
      { speaker: '小唐', text: '师傅，下个二十年，换我们走了。' },
      { speaker: '系统', text: '（卷五完结。完整六结局判定与二周目机制将在后续版本开放——你的一生档案已保存。）' },
    ],
    choices: [
      { text: '"重来的话，还是这条路——只是我会更快明白：客户是人。"', outcome: '屏幕前的一切定格。你的二十年被写进档案：合规记录、信任余额、晋升轨迹、每一位客户的人生线。这一局，无怨无悔。', grade: 'best', effects: { rep: 10 } },
      { text: '"会有遗憾，但都是我自己选的。"', outcome: '档案归档。有些红线没踩过，有些信任攒下了，有些客户跟你走完了全程。这就够了。', grade: 'normal', effects: { rep: 5 } },
    ],
    teach: 'volume_end',
  },
];
