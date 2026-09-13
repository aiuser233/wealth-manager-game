import type { QuestDef } from '@fm/core';

/**
 * 卷六·人间彩蛋（第二轮深化批·T11）：2025 年卷五收官后的 8 个彩蛋章。
 * 主角身份已是私行团队负责人/即将自立门户，彩蛋卷不再推年代主线，
 * 而是给第二轮扩充的 8 位深度客户一人一章"回访式"小传：
 * 拆迁款、老保单检视、退休提取、传承盘点、前基金经理、主播创业、
 * 非遗守艺人、科技新贵——都是网点人生里"最像真实咨询"的 8 道题。
 * 链式 requires：e1→e2→…→e8；全链完成计入成就与结局（主线 60→68 章）。
 */
export const EASTER_QUESTS: QuestDef[] = [
  {
    id: 'q6_e1_chaiqian', requires: 'q5_12_vol5_end', volume: 6, title: '彩蛋一：贾桂香的拆迁款', date: '2025-03-05', client: 'cli_d_chaiqian',
    dialogues: [
      { speaker: '贾桂香', mood: 'smile', text: '林行长！我家老房子拆了，四套房加 300 万！老伴说全存银行，儿子说全买理财，儿媳妇说买黄金……你说我该听谁的？' },
      { speaker: '林奇安', text: '（卷五的喧嚣过去，你反而更认得这种"幸福的烦恼"——钱来得急，主意就多。）' },
    ],
    choices: [
      { text: '谁都不听：先开家庭会议，做用途分层——应急/婚嫁/养老/增值四笔钱', outcome: '你把一张"拆迁款分配草图"拍在桌上，全家逐笔讨论。三周后他们自己吵出了共识。贾桂香送来一筐鸡蛋："这钱放谁家都不如放你这儿踏实。"', grade: 'best', effects: { trust: 9, pro: 2, comm: 2, aum: 800000 }, unlockKnowledge: ['mental_account', 'family_lifecycle'] },
      { text: '"都听我的"，配一套标准组合', outcome: '产品都对，但你忘了这 300 万背后有四个成年人。儿子私下把款挪去做生意，家庭矛盾最后烧到你柜台。', grade: 'normal', effects: { sales: 2, stress: 2 } },
      { text: '推一份高佣金年金险锁住，"防挥霍"', outcome: '锁是锁住了，锁的却是信任。半年后儿媳来柜台问"退保要扣多少"，你才知道这笔配置成了全家的靶子。', grade: 'bad', effects: { trust: -6, sales: 3 } },
    ],
    teach: 'mental_account',
  },
  {
    id: 'q6_e2_duanzi_policy', requires: 'q6_e1_chaiqian', volume: 6, title: '彩蛋二：杜小满的旧保单', date: '2025-03-20', client: 'cli_d_p2p',
    dialogues: [
      { speaker: '杜小满', mood: 'normal', text: '林哥，我开了便利店之后想起一件事：2015 年我买的那份分红险，当时说"比存银行划算"。现在退保能拿回多少？感觉被埋了十年。' },
      { speaker: '林奇安', text: '（踩过大坑的人最懂复盘。她的提问方式，和 2018 年那个网贷受害者已经不是同一个人了。）' },
    ],
    choices: [
      { text: '先把"沉没成本"和"未来现金流"分开：现金价值表摊开算，退不退都算明白账', outcome: '一算反而不退了：继续持有的分红+保障价值高于现金价值。她说："我本来只想出气，算完账，气顺了，钱也安了。"', grade: 'best', effects: { trust: 8, pro: 3 }, unlockKnowledge: ['sunk_cost', 'insurance_basics'] },
      { text: '"退保损失大，别退了"', outcome: '结论对，过程错。她事后自己查了现金价值，觉得你"像当年骗她买保险的人"，信任倒退一格。', grade: 'normal', effects: { stress: 1 } },
      { text: '顺势劝她退了换成你的新理财', outcome: '你赚了规模，输了口碑。她在宝妈群里发了一条"银行退保套路深"，配图是她那份保单的现金价值表——数字恰好证明她退了就是亏。', grade: 'bad', effects: { trust: -8, sales: 2 } },
    ],
    teach: 'sunk_cost',
  },
  {
    id: 'q6_e3_leiyang_draw', requires: 'q6_e2_duanzi_policy', volume: 6, title: '彩蛋三：雷长贵的第一笔养老金', date: '2025-04-18', client: 'cli_d_trucker',
    dialogues: [
      { speaker: '雷长贵', mood: 'smile', text: '林经理，我 55 了，货车不开了。个人账户里攒了些钱，还有那年你逼我交的灵活就业社保——现在怎么领、花多快才合适？' },
      { speaker: '林奇安', text: '（2019 年那个"跑一趟货运抵不上一份理财"的司机，今天主动把"长寿风险"四个字摆上了桌。）' },
    ],
    choices: [
      { text: '按月领+设"安全提取率"：先保现金流不断，再谈收益', outcome: '你给他排了张领取表：社保按月+个人账户分年领，每年从理财账户补贴不超过 4%。他说："我跑了三十年长途，道理一样——别把油箱一次加满，也别一次烧干。"', grade: 'best', effects: { trust: 9, pro: 2 }, unlockKnowledge: ['withdrawal', 'retirement_plan'] },
      { text: '"一次性取出来放我这儿打理，省事"', outcome: '省了你解释提取率的十分钟，埋了他"提前花完"的隐患。第三年他就开始动用老本，看你的眼神变了。', grade: 'normal', effects: { sales: 2, aum: 200000, stress: 1 } },
      { text: '劝他全部投进高收益产品"跑赢通胀"', outcome: '2026 年一次回撤，他夜里睡不着觉来网点门口转了三圈。你后来陪他做的每一次赎回，都是在替自己还债。', grade: 'bad', effects: { trust: -7, stress: 3 } },
    ],
    teach: 'withdrawal',
  },
  {
    id: 'q6_e4_sanhui_succession', requires: 'q6_e3_leiyang_draw', volume: 6, title: '彩蛋四：范同和的传承作业', date: '2025-05-09', client: 'cli_d_sanhui',
    dialogues: [
      { speaker: '范同和', mood: 'normal', text: '小林，三代同堂看着是福气，真到分家产就是三份账。我立了遗嘱，老伴不同意；不立，儿子儿媳各怀心思。这道题你怎么给我解？' },
      { speaker: '林奇安', text: '（2020 年你给他做过"家企隔离"，五年后这张考卷升级了——从保钱到分钱。）' },
    ],
    choices: [
      { text: '先搭框架再谈分配：保单受益人+遗嘱+生前赠与小步验证', outcome: '你设计了三步：大额资产受益人指定、家庭内部先分一笔小钱看反应、最后才是遗嘱公证。一年后他家庭聚会第一次没吵起来——"分产"变成了"分忧"。', grade: 'best', effects: { trust: 10, pro: 3, aum: 500000 }, unlockKnowledge: ['succession', 'insurance_trust'] },
      { text: '"清官难断家务事"，推给律师', outcome: '流程合规，但客户要的不只是法律文件。律师做了模板，没做那个家庭会议——他后来再没进过你的门。', grade: 'normal', effects: { stress: 1 } },
      { text: '按老伴的意思办，绕开儿子', outcome: '你选了一边站。老人走后，家庭法庭上你被叫去作证"哪份配置是你建议的"。传承业务第一课：顾问永远是流程的守护者，不是任何一方的执行人。', grade: 'bad', effects: { trust: -8, rep: -4, stress: 4 } },
    ],
    teach: 'succession',
  },
  {
    id: 'q6_e5_jiangyu_review', requires: 'q6_e4_sanhui_succession', volume: 6, title: '彩蛋五：姜屿的最后一份归因报告', date: '2025-06-12', client: 'cli_d_exfunds',
    dialogues: [
      { speaker: '姜屿', mood: 'smile', text: '老朋友，我那份《回撤备忘录》写完了——2015 到 2021，八段旅程。最后一章我想写 2025：一个前基金经理如何给自己做年度体检。你帮我挑挑毛病。' },
      { speaker: '林奇安', text: '（他当年教你看风格箱，今天你给他做适当性复核。行业绕了一圈，专业没绕圈——它螺旋上升。）' },
    ],
    choices: [
      { text: '用客户视角复核：风险测评重做、持仓集中度、流动性三问', outcome: '报告改到第三稿，他把你当年那句"回撤预案是什么"写进了扉页致谢。他笑着说："最好的归因，是归给自己。"', grade: 'best', effects: { trust: 9, pro: 4 }, unlockKnowledge: ['nav_drawdown_read', 'suitability'] },
      { text: '"你这是自我安慰式复盘"', outcome: '话糙，但没递台阶。他默默把报告发了同行圈，署名"某银行前从业者"，你的网点名字没出现，行业里却传开了。', grade: 'normal', effects: { pro: 1, stress: 1 } },
      { text: '替他重写一版"更体面"的', outcome: '你把他的失败案例写轻了，他一眼看穿，当面删掉重做。有些功课只能自己做——你这个老同行，怎么反而不懂了？', grade: 'bad', effects: { trust: -5 } },
    ],
    teach: 'nav_drawdown_read',
  },
  {
    id: 'q6_e6_suwanqing_steady', requires: 'q6_e5_jiangyu_review', volume: 6, title: '彩蛋六：苏晚晴的下播之后', date: '2025-07-15', client: 'cli_d_liveroom',
    dialogues: [
      { speaker: '苏晚晴', mood: 'normal', text: '林哥，我直播间今天破百万粉了。但我想问的是下播以后：这钱明天还在不在？我团队 20 个人，下个月工资发不发得出？' },
      { speaker: '林奇安', text: '（2022 年那个"今天赚三倍明天归零"的女孩，第一次主动问了现金流而不是收益率。）' },
    ],
    choices: [
      { text: '先把 20 人工资放进 13 周现金安全垫，再谈投资', outcome: '你们做了三条线：工资代发池、季度分红池、增长储备池。她说："原来理财经理不只是管我的钱，是管我的心跳。"', grade: 'best', effects: { trust: 9, pro: 2, comm: 2 }, unlockKnowledge: ['cashflow', 'income_structure_new'] },
      { text: '"趁流量好，配点高弹性博一把"', outcome: '三个月后平台算法改版，她的 GMV 腰斩。高弹性组合在低谷期成了二次伤害，她删掉了你所有联系方式。', grade: 'bad', effects: { trust: -7, sales: 2, stress: 2 } },
      { text: '劝她"见好就收，全存定期"', outcome: '安全，但她的创业还在扩张期，全锁定期等于掐住现金流。她表面答应，背后还是去借了高息过桥。', grade: 'normal', effects: { stress: 1 } },
    ],
    teach: 'cashflow',
  },
  {
    id: 'q6_e7_heritage_craft', requires: 'q6_e6_suwanqing_steady', volume: 6, title: '彩蛋七：贺兰亭的非遗账本', date: '2025-08-22', client: 'cli_d_heritage',
    dialogues: [
      { speaker: '贺兰亭', mood: 'smile', text: '小林先生，我这扎染铺子不赚钱，但政府给了非遗补贴，还有人要买我的配方。买断价够我在城里买套房。卖是不卖？' },
      { speaker: '林奇安', text: '（2021 年你替他算过"手艺人的现金流"。这一章考的不是理财，是"什么值得留"。）' },
    ],
    choices: [
      { text: '把"所有权"和"收益权"分开谈：授权经营、保留祖传字号', outcome: '你帮他设计了配方授权+分红条款，不卖断。三年后铺子成了研学点，他说："你们银行的人教会我一件事——传家宝也能生钱，只要不生分了。"', grade: 'best', effects: { trust: 10, rep: 3, pro: 2 }, unlockKnowledge: ['risk_isolation', 'income_structure'] },
      { text: '"买断价好，落袋为安"', outcome: '套房到手了，扎染铺子关了。第二年文旅热起来，有人出十倍价钱买"老字号"——他看着合同上的卖断条款，给你打了个没有说话的电话。', grade: 'normal', effects: { aum: 1500000, stress: 1 } },
      { text: '劝他融资开连锁店做大', outcome: '扩张、加盟、纠纷。非遗成了商标官司的被告方，你成了"那个劝我扩张的银行人"。', grade: 'bad', effects: { trust: -6, sales: 2 } },
    ],
    teach: 'risk_isolation',
  },
  {
    id: 'q6_e8_endgame_lights', requires: 'q6_e7_heritage_craft', volume: 6, title: '彩蛋终章：万家灯火', date: '2025-12-20',
    dialogues: [
      { speaker: '系统', text: '12 月的最后一周。城东支行的年庆布置起来了，门口大屏滚动播放一行字：「重生之我是理财经理·二十周年」。' },
      { speaker: '陈曼', text: '小林——不对，该叫林总了。八张回访单我替你签了字。这一局你还想加什么？' },
      { speaker: '小唐', mood: 'smile', text: '师傅，周远航把 AI 盯盘设成了"只提醒不动手"，他说这是你二十年前教的："预案比灵感重要。"' },
      { speaker: '系统', text: '（彩蛋卷收束。八位客户，八道题，都是当年你在主线里选过的那条路。这不是新增的剧情，是剧情长出来的样子。）' },
    ],
    choices: [
      { text: '"不加了。路走完了，灯亮着，就够了。"', outcome: '你把八张回访单钉进档案最后一页。窗外雪落在网点招牌上，大厅里还有客户在办最后一笔业务。二十年，一局一人生。', grade: 'best', effects: { rep: 12, trust: 5, pro: 2 } },
      { text: '"再加一题：明年想试试那家新开的社区食堂理财课"', outcome: '你说完笑了——这就是职业的下半场：不是更大的单，是更小的课。陈曼在回访单背面写了四个字：「继续来真的」。', grade: 'good', effects: { rep: 6, comm: 3, unlockKnowledge: ['senior_service'] } },
    ],
    teach: 'volume_end',
  },
];
