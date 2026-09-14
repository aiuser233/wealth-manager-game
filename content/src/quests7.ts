import type { QuestDef } from '@fm/core';

/**
 * 卷七·二周目来客（第四轮深化批·T6）：NG+ 专属 8 章（2026-2027）。
 * 主角已通关一次（playthrough≥2），"记忆残响"机制——同客户新选择：
 * 每章引用卷一~卷六同客户的原场景做镜像变体，前世的选择成为这一世的镜子。
 * 触发条件：state.playthrough≥2 且 requires 链从 e14 延链（q6_e14_wen_lights2）。
 * 链式 requires：q7_1→…→q7_8；全链完成计入成就 ngplus_clear 与 quest_all（82 章）。
 * 旧档兼容：questsTotal<82 且 playthrough=1 的局不受影响（任务按日期 2026+ 触发，一周目 2025 结局前不会到期）。
 */
export const NG_PLUS_QUESTS: QuestDef[] = [
  {
    id: 'q7_1_echo_2007', requires: 'q6_e14_wen_lights2', volume: 7, title: '来客一：记忆残响·2007 的柜台', date: '2026-01-19', client: 'cli_wangxl',
    dialogues: [
      { speaker: '系统', mood: 'normal', text: '二周目·2026 年 1 月。你重开了一局，但来客带着上一世的记忆走进网点——这是只有你能看见的"平行回访"：2007 年排队买基金的王秀兰，站在了 2026 年的柜台前。' },
      { speaker: '王秀兰', mood: 'smile', text: '小林经理，我想买基金。上回（她顿了顿，像在回忆什么很远的事）……上回有人说"死了都不卖"，我差点信了。这回你说，我该不该信？' },
      { speaker: '林奇安', text: '（她说的"上回"，是你上一世没能替她挡下的那轮疯牛。记忆残响来了——这一次，答案你有二十年的后见之明，但选择依旧要她自己做。）' },
    ],
    choices: [
      { text: '"不卖，但也不梭哈：把钱分成三份，跌了有子弹，涨了有份额"', outcome: '你给她画了三个口袋。2027 年市场震荡时她淡定如常，逢人就说"小林经理教我的三口袋"。前世那个在 6100 点满仓的王阿姨，这一世学会了先安顿生活再安顿钱。', grade: 'best', effects: { trust: 8, pro: 2, aum: 200000 }, unlockKnowledge: ['asset_allocation', 'long_term'] },
      { text: '"基金都一样，买哪个都行"', outcome: '她买了一只热门赛道基金，2027 年风格切换时回撤 25%。她又来问你，这次语气里有了怀疑——残响在重复，除非你打断它。', grade: 'normal', effects: { sales: 1, stress: 1 } },
      { text: '"您这岁数就别碰基金了，存定期吧"', outcome: '安全，但她的养老金跑不赢通胀。三年后她买不起当初看中的养老社区，你才想起前世她也是这么错过的——用不同的方式，错在同一处。', grade: 'bad', effects: { trust: -3 } },
    ],
    teach: 'k_ngplus_mirror',
  },
  {
    id: 'q7_2_echo_530', requires: 'q7_1_echo_2007', volume: 7, title: '来客二：记忆残响·5·30 那通电话', date: '2026-02-27', client: 'cli_liqiang',
    dialogues: [
      { speaker: '系统', text: '残响加剧：5·30 印花税暴跌的记忆与 2026 年的某次急跌重合。上一世你在这一天学会了"危机里先接情绪"，这一世，电话铃声提前响了。' },
      { speaker: '李建国', mood: 'panic', text: '小林！又跌了！我上回吃过这亏——割肉还是装死，你说句准话！' },
      { speaker: '林奇安', text: '（"上回吃过这亏"——他自己也带着残响。前世的李建国在暴跌日割在地板上，然后用十年才回到本金。这一世他先来问了你，这一步之差，就是全部。）' },
    ],
    choices: [
      { text: '先问持仓与用途，再给"跌了怎么办"的预案——不猜方向，只管结构', outcome: '你翻出他上次做好的预案卡："您半年内要用这笔钱吗？"不用。他说"那我不动了"，挂电话前补了一句："这回我睡得着。"', grade: 'best', effects: { trust: 7, pro: 3 }, unlockKnowledge: ['crisis_communication', 'nav_drawdown_read'] },
      { text: '"历史上跌了都会回来，拿着就行"', outcome: '对了一半。他没卖，但夜里睡不着，一个月后照样割在反弹前夜。结论救不了行为，过程才能。', grade: 'normal', effects: { stress: 2 } },
      { text: '趁机劝他低位加仓"摊薄成本"', outcome: '他加了仓，市场继续跌。前世今生的两次亏损记在同一个经理头上，他在投诉电话里说："你两次都是这么说的。"', grade: 'bad', effects: { trust: -8, stress: 3 } },
    ],
    teach: 'k_crisis_communication',
  },
  {
    id: 'q7_3_echo_yeb', requires: 'q7_2_echo_530', volume: 7, title: '来客三：记忆残响·宝类冲击反演', date: '2026-04-12', client: 'cli_d_teachers',
    dialogues: [
      { speaker: '闻立群', mood: 'normal', text: '林经理，我现在 teach 县城中学的金融选修课。学生们问我：2013 年那会儿大人们疯抢"宝宝"，到底是对是错？我教书二十年，第一次答不上来。' },
      { speaker: '林奇安', text: '（上一世，宝类冲击让你丢了三百万存款；这一世，冲击变成了一道课堂题。残响最温柔的形态：历史不再重复，它变成教案。）' },
    ],
    choices: [
      { text: '陪他备一节课："收益是利率环境的镜子"——从宝类讲到存款利率市场化', outcome: '那节课的视频在县城教师圈传开了。他发来学生课堂笔记的照片，最后一行写着："老师说的那位银行经理，讲得比课本清楚。"', grade: 'best', effects: { trust: 8 }, unlockKnowledge: ['k_fd_vs_wealth', 'k_rate_marketize'] },
      { text: '"就是货币基金，没什么可讲的"', outcome: '他"哦"了一声，课照自己的理解讲了。三个月后学生家长投诉他把理财讲成存款，他第一时间想到的是：那位银行经理也没讲清楚。', grade: 'normal', effects: { rep: -1 } },
      { text: '劝他别在学生面前讲任何金融内容', outcome: '他真的不讲了。选修课取消，县城孩子的金融第一课，永远停在了"防骗口诀"。', grade: 'bad', effects: { trust: -4 } },
    ],
    teach: 'k_deposit_rate_marketize',
  },
  {
    id: 'q7_4_echo_2015', requires: 'q7_3_echo_yeb', volume: 7, title: '来客四：记忆残响·配资的平行线', date: '2026-06-15', client: 'cli_d_haigui',
    dialogues: [
      { speaker: '沈亦舟', mood: 'panic', text: '林总，我看了 2015 年的杠杆牛史——我现在的策略，结构上就是当年的场外配资加了一层数学外衣。收益曲线太漂亮了，漂亮得让我想起历史书上的插图。' },
      { speaker: '林奇安', text: '（前公募的人自带残响。上一世他在 2021 年的抱团里摔了这一跤；这一世，他自己先看见了悬崖。你要做的不是拉住他，是确认他真的看见了。）' },
    ],
    choices: [
      { text: '陪他把策略的杠杆链条逐层拆开，标出每一层的"谁在承受最后损失"', outcome: '拆到第四层他停了："我承受不了最后一层。"他自己降了杠杆，把仓位砍到能睡着的水平。三个月后策略回撤 15%，他在朋友圈发了那句"感谢有人陪我数链条"。', grade: 'best', effects: { trust: 9, pro: 4 }, unlockKnowledge: ['leverage_risk', 'k_forced_liquidation'] },
      { text: '"你的模型比我专业，你自己定"', outcome: '他把你的沉默当成背书。回撤来的时候，他没来找你——专业的人最记恨的不是建议，是缺席。', grade: 'normal', effects: { stress: 1 } },
      { text: '"漂亮曲线都是假的，别做了"', outcome: '一刀切的对。但他反手问你"哪条曲线是真的"，你答不上——只破不立的专业建议，在新钱面前一文不值。', grade: 'bad', effects: { trust: -5, pro: -1 } },
    ],
    teach: 'k_forced_liquidation',
  },
  {
    id: 'q7_5_echo_2018', requires: 'q7_4_echo_2015', volume: 7, title: '来客五：记忆残响·保本的最后一课', date: '2026-08-20', client: 'cli_d_p2p',
    dialogues: [
      { speaker: '杜小满', mood: 'smile', text: '林哥，我现在在宝妈群做"反网贷宣传员"。但我发现自己讲不明白一件事：为什么当年那么多人（包括我）真的相信"保本保息"？说出来不怕你笑——我想讲明白这个，好让姐妹们听懂。' },
      { speaker: '林奇安', text: '（上一世她踩了网贷的坑，你陪她爬出来；这一世她成了别人的护栏。残响的传承形态：教训不再私有，它变成公共品。）' },
    ],
    choices: [
      { text: '给她三个词：利率幻觉、刚兑信仰、损失厌恶——每个配一个她自己的故事', outcome: '她的宣讲稿改到第五版，最后一段写："银行经理教我的：凡是承诺给你的安全感，都要问一句——谁在付成本。"群里五十个姐妹退了三家中介的群。', grade: 'best', effects: { trust: 8 }, unlockKnowledge: ['k_misleading_sales', 'behavior_finance'] },
      { text: '"你直接告诉她们别买就行"', outcome: '她讲得声嘶力竭，姐妹们听得点头如捣蒜——然后该买还是买。"别买"两个字说服不了任何一颗刚兑信仰的心，你比谁都清楚。', grade: 'normal', effects: { comm: 1 } },
      { text: '"这些跟你没关系了，过好自己日子吧"', outcome: '她真的没再讲过。半年后群里有人进了资金盘，她说："要是我当时……"——没有当时了。', grade: 'bad', effects: { trust: -6 } },
    ],
    teach: 'k_misleading_sales',
  },
  {
    id: 'q7_6_echo_2022', requires: 'q7_5_echo_2018', volume: 7, title: '来客六：记忆残响·破净夜的另一个版本', date: '2026-10-24', client: 'cli_d_sanhui',
    dialogues: [
      { speaker: '系统', text: '2026 年的债市波动，让 2022 年那轮破净的记忆残响重现。但这一次，你的客户们手里拿的是你配的组合——你上一世所有的功课，都在这一夜开卷考试。' },
      { speaker: '范同和', mood: 'panic', text: '小林，账面绿了我都认。可我儿媳妇把她的嫁妆钱也放你这儿了——今天她来问我是不是被坑了。你给我一句话，我去跟她说。' },
      { speaker: '林奇安', text: '（破净夜的一句话，上一世你练习过一百遍。这一次，听的人不是客户，是客户的家人——信任的考试，从来考的是整个家族。）' },
    ],
    choices: [
      { text: '"请她来网点，我把组合的每一层仓位当她的面拆开讲"', outcome: '第二天儿媳来了，四十分钟听完，临走说："叔，我是学财务的，我看得懂。"她后来成了范家三代的"首席风控官"。破净夜过后，赎回率不到 3%。', grade: 'best', effects: { trust: 9, pro: 2, comm: 3 }, unlockKnowledge: ['k_nav_break_2022', 'k_crisis_communication'] },
      { text: '"告诉她没事的，很快就回来"', outcome: '"很快"是多久？一个月后她把嫁妆钱全部赎回，范同和夹在中间，三个月没登门。', grade: 'normal', effects: { aum: -200000, stress: 2 } },
      { text: '先稳住范同和，让儿媳那边"你亲自去解释"', outcome: '你把最难的一场谈话交还给了客户。他讲砸了——不是因为内容，是因为他讲不出你练过一百遍的那种笃定。', grade: 'bad', effects: { trust: -7, aum: -300000 } },
    ],
    teach: 'k_nav_break_2022',
  },
  {
    id: 'q7_7_echo_zhouwei', requires: 'q7_6_echo_2022', volume: 7, title: '来客七：记忆残响·督查退休前夜', date: '2027-01-09', client: 'cli_zhouwei',
    dialogues: [
      { speaker: '周薇', mood: 'normal', text: '林经理，奇怪，我还没退休，梦里却在退休宴上听你讲话。梦里你说："合规的尽头不是零差错，是零隐瞒。"——这话我上辈子（她停住，改口）……我总觉得，你说过。' },
      { speaker: '林奇安', text: '（周薇的残响最重——上一世你与她十一巡检、一次越线、一次和解。这一世她还没查过你一次，但你们已经在同一张桌子前，谈论同一个问题。）' },
    ],
    choices: [
      { text: '"那句话是下辈子的我说的。这一世，我想提前做到：欢迎督查随时来查"', outcome: '她笑了，把你这句话写进了退休前的最后一页巡检计划——第一个查的就是你的网点。全网点紧张了三天，你只说了一句："查吧，这一世我们经得起。"零缺陷通过。', grade: 'best', effects: { trust: 10, rep: 5 }, unlockKnowledge: ['k_zhouwei_compliance_era', 'red_lines'] },
      { text: '"周督查说笑了，我这小庙哪经得起查"', outcome: '她没笑，认真看了你三秒："你上辈……上次不是这么说的。"她的残响在提醒她什么，而你选择了退。信任的镜子蒙了灰。', grade: 'normal', effects: { stress: 1 } },
      { text: '"合规部其实就是走流程，别太当真"', outcome: '她站起来的动作比任何处分都重。这一世的周薇没有再进过你的网点——你失去的不是一位客户，是一面照出底线的镜子。', grade: 'bad', effects: { trust: -9, rep: -3 } },
    ],
    teach: 'k_zhouwei_compliance_era',
  },
  {
    id: 'q7_8_echo_end', requires: 'q7_7_echo_zhouwei', volume: 7, title: '来客八：记忆残响·终章——下一局的你', date: '2027-02-17',
    dialogues: [
      { speaker: '系统', text: '二周目终章。七位来客的残响依次淡去，柜台前只剩下最后一面镜子——镜子里的人穿着你的工装，拿着你的工牌，眼神却是第一局 2006 年那个新人的。' },
      { speaker: '系统', text: '"记住这一世学到的东西了吗？"镜子问。"记住了。"你答。"那下一世，"镜子里的人笑了，"换你来当那个带着记忆来的人。"' },
      { speaker: '系统', text: '（卷七·来客 收束。二周目的意义从来不是重玩——是确认：同样的路口，这一世你走了不一样的路。前世的教训没有消失，它们变成了这一世的预案。下一局见，理财经理。）' },
    ],
    choices: [
      { text: '对镜子敬了个礼："下一局，凭预案，不凭记忆。"', outcome: '镜子碎成光点，落进档案柜的最后一页。二周目档案正式封卷——来客们各自回到他们的一周目，而你带走的，是一份可以穿过任何周目的东西：流程、预案、和随时归零的勇气。', grade: 'best', effects: { rep: 15, pro: 3, trust: 5 }, unlockKnowledge: ['k_ngplus_teach_meta', 'succession'] },
      { text: '"再来一世，我想试试全程零推销"', outcome: '你说出了一个新目标。镜子记下了——下一局的成就页上，悄悄多了一行未解锁的灰色小字。有些目标，说出口就已经开始。', grade: 'good', effects: { rep: 8, comm: 3 }, unlockKnowledge: ['k_ngplus_teach_meta'] },
    ],
    teach: 'k_ngplus_teach_meta',
  },
];
