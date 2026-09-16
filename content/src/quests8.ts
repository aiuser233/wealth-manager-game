import type { QuestDef } from '@fm/core';

/**
 * 卷八·薪火（第五轮深化批·T6）：一周目专属 8 章（2026-2027），"薪火"母题主线收束。
 * 与卷七「二周目来客」互斥：卷八仅在一周目局（playthrough=1）注册，卷七仅在二周目（playthrough≥2）注册，
 * 两者 requires 都从卷六终章 q6_e14_wen_lights2 延链，但按周目分流，永不双开。
 * 主角完成一次 20 年通关（2025 卷五/卷六结局）后，续写 2026-2027 的"传承"终章：
 * 师父程季青的遗产课 → 团队刘晴/肖何出师 → 客户传承作业 → 薪火命名。
 * 链式 requires：q8_1→…→q8_8；全链完成计入成就 torch_passed 与 quest_all（一周目 90 章口径）。
 * 旧档兼容：新档一周目会正常进卷八；二周目局不注册卷八（卷七），一周目 2025 结局前不会触及 2026+ 日期。
 * 全部解锁知识 tag 走 knowledge11 薪火卷配套 5 条 + 既有 tag，不新增野 tag（ref-check 缝合保护）。
 */
export const VOLUME8_QUESTS: QuestDef[] = [
  {
    id: 'q8_1_cheng_inherit', requires: 'q6_e14_wen_lights2', volume: 8, title: '薪火一：师父的最后一份教案', date: '2026-01-16', client: 'cli_chengjq',
    dialogues: [
      { speaker: '系统', mood: 'normal', text: '2026 年 1 月。你通关了前世的 20 年，日历续到了 2026。程季青的带教笔记在你抽屉里躺了十年——他一直说"等我退休就还你"。今天，他把它连同几百个客户档案的电子版，一起交到了你手上。' },
      { speaker: '程季青', mood: 'serious', text: '小林，这几百个家庭，你比我更知道他们现在需要什么。我不求你照顾我——我求你照顾好他们。这十年你长成的样子，就是我这份教案最成功的那一页。' },
      { speaker: '林奇安', text: '（师父第一次正式把"传承"当作一件需要交接的事，而不是一句口头祝福。你翻开笔记最后一页，他早已写好了你的名字："薪火，不是你的火照我，是我把火递给你。"）' },
    ],
    choices: [
      { text: '当面把几百份档案按"信任分级 + 风险适配"重新建了索引，交回给他过目', outcome: '程季青翻着新索引，第一次笑了："比当年的我做得细。"那套他手写的"销售合规十二问"正式进了你的团队手册首页。', grade: 'best', effects: { trust: 10, pro: 3, rep: 3 }, unlockKnowledge: ['k_torch_succession', 'succession'] },
      { text: '郑重收下，说"我记着"，却没立刻动手', outcome: '他点点头没追问。三个月后你才建索引，但那份"当面立誓"的重量，已经轻了一分。', grade: 'good', effects: { trust: 5, pro: 1 } },
      { text: '推说忙，档案先搁抽屉', outcome: '他在复查里发现档案没动，第一次在你面前叹气："火递到你手上，却凉了。"信任的镜子蒙了灰。', grade: 'bad', effects: { trust: -6, stress: 2 } },
    ],
    teach: 'k_torch_succession',
  },
  {
    id: 'q8_2_liuq_graduate', requires: 'q8_1_cheng_inherit', volume: 8, title: '薪火二：刘晴出师答辩', date: '2026-03-05',
    dialogues: [
      { speaker: '系统', text: '刘晴通过出师答辩。评审问她对"稳健派"的理解，她答："老年客户的信任是十年前的存款攒的，我们现在不做，十年后谁管他们？"全场的目光落在你——这套话，是你 2013 年隔着玻璃教她的。' },
      { speaker: '刘晴', mood: 'smile', text: '师父，程老师那本带教笔记你讲给我的那部分，我也记了。他说的"先接情绪再讲逻辑"，我这次答辩用上了——评审当场点头。' },
      { speaker: '林奇安', text: '（程季青 → 你 → 刘晴：薪火传了三代。你终于从"接火的人"变成"递火的人"。）' },
    ],
    choices: [
      { text: '把"薪火三问"正式写进团队出师标准：接情绪吗？讲逻辑吗？留了预案吗？', outcome: '刘晴成了第一批用"薪火三问"出师的经理，她带的新人又把这套问法传了下去。传承第一次有了可考核的标准。', grade: 'best', effects: { trust: 8, pro: 2, rep: 3 }, unlockKnowledge: ['k_mentor_dialogue', 'team_coaching'] },
      { text: '口头表扬，让她多历练', outcome: '她被认可，但"薪火"始终停在口号，没沉到流程里。半年后她带的客户还是靠临场发挥。', grade: 'good', effects: { trust: 3, pro: 1 } },
      { text: '提醒她"别骄傲"', outcome: '她出师时的光，被你这句泼了半盆。出师答辩记录里，"被认可"那一栏空了很久。', grade: 'bad', effects: { trust: -4, comm: 1 } },
    ],
    teach: 'k_mentor_dialogue',
  },
  {
    id: 'q8_3_xiaoh_graduate', requires: 'q8_2_liuq_graduate', volume: 8, title: '薪火三：肖何把答案翻译成人话', date: '2026-05-09',
    dialogues: [
      { speaker: '系统', text: '肖何出师答辩。评委问他对理财经理的定义，他答："把专业的答案翻译成人话，把客户的人话翻译成方案。"全场安静了两秒——这句话你 2018 年随口说过，他记了八年。' },
      { speaker: '肖何', mood: 'normal', text: '师父，程老师那页"客户骂的不是净值，是没人接住他们"，我做团队案例库的时候把它设成了置顶。我们工资里有一部分，就是为这些错误付的学费，别白交。' },
      { speaker: '林奇安', text: '（两个徒弟，一个守住了"稳健"，一个守住了"翻译"。薪火到你手上，第一次分成了两支，各自长成。）' },
    ],
    choices: [
      { text: '请肖何把你 2022 破净夜的话术，整理成团队共享的"危机应对卡"', outcome: '那张卡在下一次市场急跌时救了三个人。你的经验第一次以"可复制"的形式活在了别人手里。', grade: 'best', effects: { trust: 8, pro: 3, rep: 2 }, unlockKnowledge: ['k_crisis_communication', 'team_coaching'] },
      { text: '肯定他，让各团队自己整理', outcome: '经验分散在各人手里，没有统一沉淀。传承在，但没成体系。', grade: 'good', effects: { trust: 4, pro: 1 } },
      { text: '「你先把手头单子做完再说」', outcome: '他的案例库拖了一季才建，热度先凉了半拍。', grade: 'bad', effects: { trust: -3, stress: 1 } },
    ],
    teach: 'k_crisis_communication',
  },
  {
    id: 'q8_4_inherit_homework', requires: 'q8_3_xiaoh_graduate', volume: 8, title: '薪火四：传承作业', date: '2026-07-14',
    dialogues: [
      { speaker: '系统', text: '程季青留下的几百份档案里，有二十多户"高龄 + 高资产"的传承待办——客户年迈，子女尚未接手，正是资产交接最容易出乱子的窗口。他把这份"传承作业"一并交给了你。' },
      { speaker: '陈曼', mood: 'normal', text: '（退休返聘的同路人）小林，这类传承最考验的从来不是产品，是"两代人谁说了算"。你把子女和长辈分开约、再合起来约，乱就少一半。' },
      { speaker: '林奇安', text: '（传承不是交接一张客户名单，是交接一份跨代的责任。你把 20 年积累的"客户家族地图"第一次真正用上了。）' },
    ],
    choices: [
      { text: '为二十多户各做一张"家族资产图 + 交接路径 + 税务合规"，逐一上门', outcome: '第一批客户在 2027 年平稳完成传承，没有任何一户因为"谁说了算"吵起来。传承作业第一次有了可交付的标准答案。', grade: 'best', effects: { trust: 10, pro: 4, aum: 300000 }, unlockKnowledge: ['k_handover_moment', 'succession'] },
      { text: '挑十户重点客户先做，其余按流程跟进', outcome: '重点户稳了，非重点户拖到 2027 年才动，错过了两户最佳交接时点。', grade: 'good', effects: { trust: 4, pro: 1 } },
      { text: '交给新团队做，你只做审核', outcome: '审核发现三户税务路径踩了雷，传承作业返工，长辈的耐心被磨掉了大半。', grade: 'bad', effects: { trust: -5, stress: 3 } },
    ],
    teach: 'k_handover_moment',
  },
  {
    id: 'q8_5_torch_day', requires: 'q8_4_inherit_homework', volume: 8, title: '薪火五：薪火日', date: '2026-09-28',
    dialogues: [
      { speaker: '系统', text: '网点把每年的带教日正式命名为"薪火日"。你作为主授第一次站在台上——台下坐着刘晴、肖何，和 2024-2025 新来的三个应届生。他们是这一代薪火的接收者。' },
      { speaker: '刘晴', mood: 'smile', text: '师父，你讲的第一课，是程老师 2006 年对咱们那一代讲过的第一课。三台讲台，一句话。' },
      { speaker: '林奇安', text: '（薪火不是口号，是每一代把自己活成下一代的师父。你讲课时，抽屉里那本带教笔记的扉页，正对着你。）' },
    ],
    choices: [
      { text: '薪火日设"传师三礼"：读一段师父笔记、接一位新徒、留一句自己的话', outcome: '第一个薪火日，三个应届生各领了一位师父，各写了一句"我接下来的那一句"。仪式第一次让传承有了可复制的仪式感。', grade: 'best', effects: { trust: 9, rep: 5, pro: 2 }, unlockKnowledge: ['k_team_coaching', 'succession'] },
      { text: '按常规培训讲一遍带教要点', outcome: '内容合格，但"薪火"这个词今天第一次被喊出来，却没能落成仪式，散场后没人记住重点。', grade: 'good', effects: { trust: 4, comm: 1 } },
      { text: '让新徒自己讲，你做观众', outcome: '三个应届生讲得生涩，你在台下补了太多，"传师"变成了"代讲"，薪火反而断在了你这一环。', grade: 'bad', effects: { trust: -4, stress: 2 } },
    ],
    teach: 'k_team_coaching',
  },
  {
    id: 'q8_6_team_ledger', requires: 'q8_5_torch_day', volume: 8, title: '薪火六：团队账本', date: '2026-11-20',
    dialogues: [
      { speaker: '系统', text: '程季青的带教笔记里，夹着一本"团队账本"——他记了二十年：谁出师、谁走了、谁踩了红线、谁成了下一代师父。他退休后，这本账本一直缺着最后几页。' },
      { speaker: '肖何', mood: 'normal', text: '师父，我把团队错题本升级成全组案例库了。您看，程老师那个账本，我们能不能接着往下记？' },
      { speaker: '林奇安', text: '（传承账本记的不是功劳簿，是"这一代人把什么递给了下一代人"。你决定把它接下去。）' },
    ],
    choices: [
      { text: '接手账本，把"出师/传承/红线三栏"设为团队季度固定动作', outcome: '二十年后翻回这本账，读者能看到薪火从程季青到你、再到刘晴肖何的完整传递链。传承第一次有了连续的证据。', grade: 'best', effects: { trust: 8, pro: 3, rep: 3 }, unlockKnowledge: ['k_career_legacy', 'team_coaching'] },
      { text: '你个人接手，团队只记重要节点', outcome: '账本续上了，但只到 2026 年末，团队层面没形成习惯，传承记录又停在了个人。', grade: 'good', effects: { trust: 4, pro: 1 } },
      { text: '「账本太老派了，电子化重做」', outcome: '重做拖了半年，程季青亲手记的最后几页在整理中丢了。传承的证据断了一截。', grade: 'bad', effects: { trust: -5, stress: 2 } },
    ],
    teach: 'k_career_legacy',
  },
  {
    id: 'q8_7_second_curve', requires: 'q8_6_team_ledger', volume: 8, title: '薪火七：师父的第二曲线', date: '2027-01-12',
    dialogues: [
      { speaker: '系统', text: '程季青退休返聘的半年已结束。他开始问一个自己都没想清楚的问题："我教了一辈子别人管钱，我自己这最后一程，怎么管？"——这是资深经理的第二曲线。' },
      { speaker: '程季青', mood: 'serious', text: '小林，我这条线快到头了。我不担心客户的钱，我担心我自己的：退休那笔钱、老两口的保障、留给孩子的那份——你替我盘一盘，别等我糊涂了才动手。' },
      { speaker: '林奇安', text: '（你服务过的人，也开始需要你。第二曲线不是转型去创业，是终于有人替他管好"他自己的钱"。）' },
    ],
    choices: [
      { text: '给程季青做一套"第二曲线"方案：退休现金流 + 老年保障 + 留给孩子的那份（保险金信托兜底）', outcome: '他看完方案说："教了二十年，头一回被人这么管。"你替他留的那份，是他作为师父留下的最后一笔"资产"。', grade: 'best', effects: { trust: 10, pro: 3, rep: 2 }, unlockKnowledge: ['k_second_curve', 'succession'] },
      { text: '只帮他理了退休现金流，保障和传承留到再说', outcome: '退休钱稳了，但老两口保障和"留给孩子的部分"拖到 2027 年年中才动，错过了最优时点。', grade: 'good', effects: { trust: 4, pro: 1 } },
      { text: '「您自己就是专家，您定」', outcome: '他把方案又退回给你，眼里第一次有了失望——你在他第二曲线的关口，把自己摘了出去。', grade: 'bad', effects: { trust: -6, stress: 2 } },
    ],
    teach: 'k_second_curve',
  },
  {
    id: 'q8_8_torch_end', requires: 'q8_7_second_curve', volume: 8, title: '薪火八：薪火终章', date: '2027-04-16',
    dialogues: [
      { speaker: '系统', mood: 'normal', text: '2027 年，程季青的薪火日到了。他没有上台——他的位置留给台下那本带教笔记。刘晴和肖何各带着一位新徒站在讲台两侧，第一次由徒弟们主授薪火日。' },
      { speaker: '刘晴', mood: 'smile', text: '今天第一课，念的是程老师 2006 年说的那句：钱是果，人是因。台下坐着我们的新徒，他们不知道程老师——但他们会知道这句话是谁先说出口的。' },
      { speaker: '林奇安', text: '（薪火传到了第四代。你站在台下，终于明白：最好的传承不是你把火递下去，是火开始自己烧。前 20 年你学的是管钱，这最后 8 章你学的是传人。卷八·薪火，收束。）' },
    ],
    choices: [
      { text: '为程季青的薪火日录一段音，把他 2006 年那句话原样留进网点档案', outcome: '未来每一代薪火日开头都会放这段音。程季青 2006 年对一个新人说的那句话，成了网点活了几十年的"第一课"。薪火真正命名。', grade: 'best', effects: { trust: 12, rep: 8, pro: 3 }, unlockKnowledge: ['k_torch_succession', 'succession'] },
      { text: '让徒弟们在台上念一遍那段话，你坐在台下', outcome: '薪火日顺利完成，传承在，但你没有留下可传世的纪念，"薪火"这个词还差最后一步定型。', grade: 'good', effects: { trust: 6, rep: 3 } },
    ],
    teach: 'k_torch_succession',
  },
];
