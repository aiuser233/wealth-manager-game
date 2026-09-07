import type { GameEventDef } from '@fm/core';

/**
 * 随机事件池（M1 版 36 条）：按年代标签池化，日/周/月帧按密度掷骰触发。
 * 全部架空化；era_tags 决定该事件可出现的年代范围。
 */
export interface RandomEventDef {
  id: string;
  title: string;
  /** 事件文本 */
  text: string;
  /** 年代范围（含） */
  era: [number, number];
  /** 触发权重 */
  weight: number;
  /** 效果 */
  effects: {
    trust?: number;        // 全体客户信任
    stress?: number;
    fame?: number;
    income?: number;       // 罚金/奖金（负为扣款）
    aum?: number;          // 资金流入/流失
  };
  /** 可选玩家决策分支（选一个执行） */
  choices?: Array<{
    text: string;
    outcome: string;
    effects: RandomEventDef['effects'];
    risk?: 'comply' | 'grey' | 'red';
    teach?: string;
  }>;
  teach?: string;
}

export const randomEvents: RandomEventDef[] = [
  // ===== 2006-2010 早期年代 =====
  {
    id: 're_passbook', title: '存折挂失', era: [2006, 2012], weight: 3,
    text: '一位老大爷把存折弄丢了，急得满头汗，在大堂里直转圈。',
    effects: {},
    choices: [
      { text: '先安抚情绪，带他去柜台办理挂失', outcome: '老大爷连声道谢，周围的客户都看在眼里。', effects: { trust: 1, fame: 1 } },
      { text: '指个方向让他自己去柜台', outcome: '大爷自己排了半小时队，嘟囔着走了。', effects: {} },
    ],
    teach: '存折年代的厅堂服务：情绪安抚先于流程。',
  },
  {
    id: 're_fund_queue', title: '排队买基金', era: [2006, 2008], weight: 4,
    text: '基金发行火爆，大厅里排起长队，有位阿姨非要全买"收益最高的那只"。',
    effects: {},
    choices: [
      { text: '先做风险测评，讲清波动再谈产品', outcome: '阿姨听完波动演示，改买了均衡配置。', effects: { trust: 2 }, teach: 'suitability' },
      { text: '顺势推荐高仓位的股票基金', outcome: '阿姨爽快签约——2007 年她赚了，但 2008 年她会回来找你。', effects: { aum: 50000 }, risk: 'grey', teach: 'chasing_high' },
    ],
  },
  {
    id: 're_income_tax', title: '利息税咨询', era: [2006, 2008], weight: 2,
    text: '客户问："听说存款利息要交税？那还存什么钱！"',
    effects: {},
    choices: [
      { text: '耐心讲解利息税与税后利率', outcome: '客户明白了实际收益的算法，对你的专业很认可。', effects: { trust: 1 } },
      { text: '支吾说"没多少税"', outcome: '客户回家一算账，觉得你在糊弄他。', effects: { trust: -1 } },
    ],
    teach: 'interest_tax',
  },
  {
    id: 're_newbie_exam', title: '晨会抽问', era: [2006, 2025], weight: 3,
    text: '晨会上行长突然抽你回答一个产品要素问题。',
    effects: {},
    choices: [
      { text: '结合 recently 学的知识认真作答', outcome: '回答流畅，行长点头。', effects: { fame: 1 } },
      { text: '低头装作记笔记', outcome: '被点名批评"基本功要扎实"。', effects: { stress: 3 } },
    ],
  },
  {
    id: 're_queue_complaint', title: '排号纠纷', era: [2006, 2015], weight: 2,
    text: '取号机前两位客户因为插队问题吵了起来，围观越来越多。',
    effects: {},
    choices: [
      { text: '上前分流安抚，引导先取号坐下', outcome: '纠纷化解，大堂经理朝你竖了个大拇指。', effects: { fame: 1, stress: 1 } },
      { text: '等着大堂经理处理', outcome: '吵了十分钟才平息，行长皱着眉看了一眼。', effects: {} },
    ],
  },
  {
    id: 're_qdii_worry', title: 'QDII 亏损安抚', era: [2007, 2010], weight: 2,
    text: '首批出海基金净值大幅回撤，持有客户在电话里声音发抖。',
    effects: {},
    choices: [
      { text: '复盘出海风险结构，给出持有/调仓建议', outcome: '客户虽然亏钱，但决定相信你的专业。', effects: { trust: 2 }, teach: 'qdii_risk' },
      { text: '避而不接电话', outcome: '客户直接投诉到了网点。', effects: { trust: -3, stress: 2 } },
    ],
    teach: 'qdii_risk',
  },
  {
    id: 're_lunar_deposit', title: '春节吸储冲刺', era: [2006, 2025], weight: 3,
    text: '开门红期间，返乡客户的存款是各行必争之地。',
    effects: {},
    choices: [
      { text: '提前梳理返乡客户名单逐一拜年', outcome: '好几笔大额资金到账。', effects: { aum: 100000, stress: 2 } },
      { text: '按部就班等客上门', outcome: '同行抢走了好几户。', effects: {} },
    ],
    teach: 'opening_season',
  },
  // ===== 2010-2015 年代 =====
  {
    id: 're_trust_hype', title: '信托"刚兑神话"', era: [2010, 2017], weight: 3,
    text: '同事私下议论：某信托计划 9% 收益"从没违约过"，问你要不要跟客户推。',
    effects: {},
    choices: [
      { text: '研究底层资产后小资金量推荐高净值客户', outcome: '客户拿到了高收益——但你知道这只是还没违约。', effects: { aum: 200000 }, risk: 'grey', teach: 'rigid_payment' },
      { text: '明确提示"历史刚兑不代表未来"', outcome: '部分客户不理解，但少数明白人很认可你的清醒。', effects: { trust: 1 }, teach: 'rigid_payment' },
    ],
    teach: 'rigid_payment',
  },
  {
    id: 're_yeb_shock', title: '宝宝类冲击存款', era: [2013, 2016], weight: 3,
    text: '一位老客户要把 30 万活期全转去互联网货币基金："人家随存随取还 4% 多！"',
    effects: {},
    choices: [
      { text: '坦诚对比收益，用代销货基+现金理财留住资金', outcome: '客户把钱留在了行里。', effects: { aum: 200000, trust: 1 }, teach: 'money_fund' },
      { text: '强调"网上理财不安全"硬拦', outcome: '客户嘴上答应，回家就转走了。', effects: { trust: -2 }, teach: 'money_fund' },
    ],
    teach: 'deposit_migration',
  },
  {
    id: 're_solar_sale', title: '飞单诱惑', era: [2012, 2020], weight: 2,
    text: '前同事私下找你：帮他卖个"内部高息理财"，一单返点 2%。',
    effects: {},
    choices: [
      { text: '果断拒绝并提醒他这是飞单', outcome: '他悻悻而去。三年后他出事了，而你安然无恙。', effects: { stress: 1 }, teach: 'red_lines' },
      { text: '犹豫着试一试', outcome: '……你划向了红线。这不是剧情，是档案。', effects: { income: 20000 }, risk: 'red', teach: 'red_lines' },
    ],
    teach: 'red_lines',
  },
  {
    id: 're_salon', title: '周末理财沙龙', era: [2008, 2025], weight: 2,
    text: '网点周末办理财沙龙，需要人手筹备讲座。',
    effects: {},
    choices: [
      { text: '主动请缨讲一场"家庭资产配置"', outcome: '现场签到 12 位新客户，3 位当场预约。', effects: { aum: 80000, fame: 2, stress: 2 } },
      { text: '幕后帮忙布置会场', outcome: '辛苦一场，领导记了个好人卡。', effects: { fame: 0.5, stress: 1 } },
    ],
  },
  {
    id: 're_staff_leave', title: '同事离职', era: [2006, 2025], weight: 2,
    text: '隔壁柜台的同事跳槽去了股份行，临走请你吃饭。',
    effects: {},
    choices: [
      { text: '真心祝福，顺便聊聊行业行情', outcome: '获得不少同业薪酬与打法的一手信息。', effects: { stress: -2, fame: 0.5 } },
      { text: '婉拒，继续加班', outcome: '你少了一次信息交换，多了一份报表。', effects: { stress: 1 } },
    ],
  },
  // ===== 2014-2019 年代 =====
  {
    id: 're_leverage_mania', title: '配资客户劝阻', era: [2014, 2016], weight: 3,
    text: '客户老张兴奋地说他在场外做了 1:5 配资，来问你"还能加多少"。',
    effects: {},
    choices: [
      { text: '给他算一笔强平线账，力劝降杠杆', outcome: '他勉强降到了 1:2。6 月的暴跌证明你救了他一命。', effects: { trust: 3 }, teach: 'leverage_risk' },
      { text: '"客户自愿，与我无关"', outcome: '股灾后他血本无归，再也没来过。', effects: {}, risk: 'grey', teach: 'leverage_risk' },
    ],
    teach: 'leverage_risk',
  },
  {
    id: 're_crash_call', title: '股灾之夜的电话', era: [2015, 2016], weight: 2,
    text: '晚上十点，持有分级 B 的客户来电，声音都变了调："明天开盘我该怎么办？！"',
    effects: {},
    choices: [
      { text: '接起电话，一起过一遍持仓与预案', outcome: '凌晨一点，客户说"谢谢你没关机"。', effects: { trust: 4, stress: 3 }, teach: 'crisis_communication' },
      { text: '关机睡觉', outcome: '第二天客户投诉到分行。', effects: { trust: -4, stress: 2 } },
    ],
    teach: 'crisis_communication',
  },
  {
    id: 're_grade_split', title: '分级 B 下折预警', era: [2015, 2018], weight: 2,
    text: '系统提示多位客户持有的分级 B 临近下折，必须逐一通知风险。',
    effects: {},
    choices: [
      { text: '放下手头事务逐个电话通知', outcome: '大部分客户及时卖出，虽有亏损但避免了下折腰斩。', effects: { trust: 3, stress: 3 } },
      { text: '发个群消息了事', outcome: '两位没看消息的客户下折损失惨重，投诉升级。', effects: { trust: -3, stress: 2 }, risk: 'grey' },
    ],
  },
  {
    id: 're_p2p_worry', title: 'P2P 暴雷潮担忧', era: [2018, 2019], weight: 2,
    text: '客户王阿姨说邻居推荐了她一个 15% 的平台，问你"要不要把存款转过去"。',
    effects: {},
    choices: [
      { text: '用爆雷案例做一次防诈深度沟通', outcome: '她打消了念头。半年后那个平台爆雷，她专门来道谢。', effects: { trust: 4 }, teach: 'fraud_alert' },
      { text: '"您自己的钱自己决定"', outcome: '她投了 20 万进去，血本无归。', effects: {}, risk: 'grey', teach: 'fraud_alert' },
    ],
    teach: 'fraud_alert',
  },
  {
    id: 're_agr_transition', title: '净值化转型答疑', era: [2018, 2021], weight: 3,
    text: '保本理财停售后，老客户们对新净值产品充满疑虑。',
    effects: {},
    choices: [
      { text: '办一场"资管新规"微沙龙', outcome: '十位老客户完成了产品切换。', effects: { aum: 150000, trust: 2, stress: 1 }, teach: 'nav_product' },
      { text: '等客户自己想通', outcome: '两位客户被同业挖走。', effects: { aum: -80000 } },
    ],
    teach: 'nav_product',
  },
  // ===== 2019-2023 年代 =====
  {
    id: 're_covid_remote', title: '远程办公', era: [2020, 2020], weight: 3,
    text: '突发公共事件，网点轮流值班，客户服务全部转到线上。',
    effects: {},
    choices: [
      { text: '建客户群每日播报市场与政策', outcome: '群人数翻倍，你成了客户眼里的"定心丸"。', effects: { trust: 2, fame: 2, stress: 2 }, teach: 'crisis_communication' },
      { text: '只处理必须业务', outcome: '同事的客户群热火朝天，你的安静如常。', effects: {} },
    ],
    teach: 'risk_off',
  },
  {
    id: 're_fund_idol', title: '"基金饭圈"年轻人', era: [2020, 2022], weight: 3,
    text: '一位 95 后拿着手机冲进来："这个基金经理上有热搜！我要梭哈！"',
    effects: {},
    choices: [
      { text: '聊热搜，聊波动，引导定投+资产配置', outcome: '年轻人半信半疑地做了组合。一年后他回来续投。', effects: { aum: 30000, trust: 2 }, teach: 'herding' },
      { text: '嘲笑"追星买基金"', outcome: '他扭头就走，转身在别处全仓了。', effects: { trust: -1 }, teach: 'herding' },
    ],
    teach: 'herding',
  },
  {
    id: 're_baotuan_pain', title: '抱团回撤售后', era: [2021, 2021], weight: 3,
    text: '春节后抱团基金集体回撤 30%+，售后电话排起了队。',
    effects: {},
    choices: [
      { text: '分批逐一沟通：回撤来源+持有逻辑+补仓纪律', outcome: '绝大多数客户选择继续持有，信任不降反升。', effects: { trust: 3, stress: 3 }, teach: 'take_profit' },
      { text: '统一群发"长期持有"模板', outcome: '部分客户觉得被敷衍，赎回购走了。', effects: { aum: -100000, stress: 2 } },
    ],
    teach: 'take_profit',
  },
  {
    id: 're_policy_divergence', title: '汇率破 7 客户问询', era: [2019, 2024], weight: 2,
    text: '外贸企业主客户问："汇率这样走，我的美元货款要不要结汇？"',
    effects: {},
    choices: [
      { text: '结合利差-汇率传导链给出情景分析', outcome: '客户按分析分批结汇，颇为受用。', effects: { trust: 2, aum: 100000 }, teach: 'fx_risk' },
      { text: '"我不是外汇专家……"', outcome: '客户转头去问了别家的私行。', effects: { trust: -1 } },
    ],
    teach: 'fx_risk',
  },
  {
    id: 're_nav_break_pain', title: '破净潮客诉现场', era: [2022, 2023], weight: 3,
    text: '理财破净的客户堵在柜台前："说好的稳健呢？！"',
    effects: {},
    choices: [
      { text: '现场开小课：讲清负反馈与净值机理', outcome: '客户情绪平复，选择了继续持有等待修复。', effects: { trust: 3, stress: 3 }, teach: 'nav_break' },
      { text: '引导客户赎回止损了事', outcome: '浮亏变实亏，客户走了，也带走了口碑。', effects: { aum: -200000 }, risk: 'grey', teach: 'redemption_spiral' },
    ],
    teach: 'nav_break',
  },
  {
    id: 're_ai_anxiety', title: 'AI 投顾上线', era: [2023, 2025], weight: 3,
    text: '行里上线了 AI 智能投顾，部分同事开始焦虑："我们会不会被替代？"',
    effects: {},
    choices: [
      { text: '主动学习工具，把 AI 变成自己的助手', outcome: '你的服务效率翻倍，成了支行的转型标杆。', effects: { fame: 2, stress: 1 }, teach: 'ai_advisor' },
      { text: '消极抵制，"机器懂什么叫陪伴"', outcome: '考核里多了"数字化工具使用率"这一项。', effects: { stress: 2 } },
    ],
    teach: 'ai_advisor',
  },
  // ===== 通用年代事件 =====
  {
    id: 're_referral', title: '客户转介绍', era: [2006, 2025], weight: 2,
    text: '老客户把做生意的表哥带来了："我这兄弟资产比你池子里任何人都多。"',
    effects: {},
    choices: [
      { text: '按标准流程尽调+建档+适配方案', outcome: '表哥成了你的贵宾客户。', effects: { aum: 300000, trust: 2 } },
      { text: '急着推产品', outcome: '表哥感觉到了功利味，找了个借口走了。', effects: {} },
    ],
  },
  {
    id: 're_family_tension', title: '家庭时间', era: [2006, 2025], weight: 2,
    text: '今晚是家人的生日，但你手头还有三份资产配置方案没写完。',
    effects: {},
    choices: [
      { text: '准时下班回家', outcome: '家人很温暖。工作明日再战。', effects: { stress: -3 } },
      { text: '加班赶方案', outcome: '方案完美交付，但饭桌上的空椅子不会说话。', effects: { stress: 2 } },
    ],
    teach: 'work_life',
  },
  {
    id: 're_health_alert', title: '身体报警', era: [2006, 2025], weight: 1,
    text: '连轴转之后，你发现体检报告上有几个向上的箭头。',
    effects: {},
    choices: [
      { text: '遵医嘱调整作息，每周三次运动', outcome: '一个月后复查，箭头平了。', effects: { stress: -4 } },
      { text: '"年轻人扛得住"', outcome: '前世猝死的画面闪过——你打了个寒颤。', effects: { stress: 2 }, risk: 'grey' },
    ],
    teach: 'health_first',
  },
  {
    id: 're_peer_exam', title: '同业挖角', era: [2010, 2025], weight: 2,
    text: '股份制银行猎头开出了 1.5 倍薪水的 Offer。',
    effects: {},
    choices: [
      { text: '婉拒：我客户都在这里，二十年布局长着呢', outcome: '你保住了复利的土壤。', effects: { trust: 2, stress: -1 } },
      { text: '认真考虑跳槽', outcome: '权衡之后你留下了，但心里起了波澜。', effects: { stress: 1 } },
    ],
  },
  {
    id: 're_audit', title: '飞行检查', era: [2006, 2025], weight: 2,
    text: '分行合规部突击检查销售流程与双录文件。',
    effects: {},
    choices: [
      { text: '平时按规范来，坦然迎检', outcome: '检查零瑕疵，支行获通报表扬。', effects: { fame: 1 } },
      { text: '连夜补材料', outcome: '补的材料漏洞百出，被记了一笔。', effects: { stress: 3 }, risk: 'grey' },
    ],
    teach: 'dual_recording',
  },
  {
    id: 're_small_deposit', title: '一万元的信任', era: [2006, 2025], weight: 2,
    text: '一位刚工作的年轻人怯生生地拿出 1 万元："这个钱……能理财吗？"',
    effects: {},
    choices: [
      { text: '认真对待：从货基定投讲起', outcome: '他成了你的铁杆客户——十年后他买房贷款也在你这办。', effects: { aum: 10000, trust: 3 } },
      { text: '心不在焉地打发', outcome: '他去手机上点了"一键开户"。', effects: {} },
    ],
  },
  {
    id: 're_gold_rush', title: '黄金热咨询', era: [2009, 2025], weight: 2,
    text: '金价创新高，好几位客户同时来问"现在买金条还来得及吗"。',
    effects: {},
    choices: [
      { text: '讲配置比例：5-10% 对冲仓，不追高', outcome: '客户们理性建仓。', effects: { trust: 1, aum: 50000 }, teach: 'gold_hedge' },
      { text: '"黄金牛市才刚开始！"', outcome: '短期你对了，长期你欠客户一次回撤沟通。', effects: { aum: 80000 }, risk: 'grey' },
    ],
    teach: 'gold_hedge',
  },
  {
    id: 're_renovation', title: '网点翻新', era: [2013, 2013], weight: 1,
    text: '网点智能化改造，叫号机取代了排队长龙。',
    effects: {},
    choices: [
      { text: '帮老客户适应新设备', outcome: '大爷大妈们记住了这个耐心的小伙子/姑娘。', effects: { trust: 2, fame: 1 } },
      { text: '自己先研究个明白', outcome: '效率提升，但老客户流失了几个。', effects: {} },
    ],
  },
  {
    id: 're_pension_window', title: '个人养老金开户窗口', era: [2024, 2025], weight: 3,
    text: '个人养老金制度全面推开，开户指标下发，全行都在冲刺。',
    effects: {},
    choices: [
      { text: '给存量客户算"节税账"，精准营销', outcome: '开户与缴存双达标，还顺带做了养老规划服务。', effects: { aum: 60000, fame: 1 }, teach: 'third_pillar' },
      { text: '强推开户不讲解', outcome: '开了户没人缴存，考核依旧难看。', effects: { stress: 1 } },
    ],
    teach: 'third_pillar',
  },
  {
    id: 're_fx_quota', title: '换汇窗口', era: [2016, 2024], weight: 1,
    text: '留学家庭客户来问每年 5 万美元额度怎么用最划算。',
    effects: {},
    choices: [
      { text: '讲分批换汇与汇率风险敞口', outcome: '客户分三批换完，对你感激不尽。', effects: { trust: 2 }, teach: 'fx_risk' },
      { text: '让他自己看牌价', outcome: '他在高低点间反复横跳。', effects: {} },
    ],
    teach: 'fx_risk',
  },
  {
    id: 're_succession_talk', title: '二代登场', era: [2018, 2025], weight: 2,
    text: '企业主客户的独子留学归来，老爷子想让你"带带这孩子理财"。',
    effects: {},
    choices: [
      { text: '为二代定制教育方案，慢慢建立关系', outcome: '一年后，二代把个人资产也转了过来。', effects: { aum: 200000, trust: 2 }, teach: 'succession' },
      { text: '只维护老爷子', outcome: '父子沟通不畅时，资产悄悄流向了别的渠道。', effects: {} },
    ],
    teach: 'succession',
  },
  {
    id: 're_market_ask', title: '"现在买什么好？"', era: [2006, 2025], weight: 3,
    text: '客户开门见山："别废话，告诉我现在买什么能赚钱。"',
    effects: {},
    choices: [
      { text: '"我不能荐股，但我能教您怎么配"', outcome: '有人失望离开，有人成为长线客户。', effects: { trust: 1 } },
      { text: '顺着行情推荐热门板块基金', outcome: '短期成交，长期……市场会来教他，也会来考你。', effects: { aum: 60000 }, risk: 'grey' },
    ],
    teach: 'suitability',
  },
  {
    id: 're_loan_ask', title: '房贷利率咨询', era: [2009, 2025], weight: 2,
    text: '年轻夫妻来问房贷：等额本息还是等额本金？',
    effects: {},
    choices: [
      { text: '画现金流图讲两种还款方式的差异', outcome: '他们选了适合自己的方案，顺带做了家庭规划预约。', effects: { trust: 2 }, teach: 'housing_vs_invest' },
      { text: '"都差不多，随便选"', outcome: '他们去问了中介。', effects: {} },
    ],
    teach: 'housing_vs_invest',
  },
];
