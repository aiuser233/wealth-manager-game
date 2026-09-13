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
  }
];

export const randomEventsDeep3: RandomEventDef[] = [
  // ===== 第三轮深化批 15 条（2008-2023 稀薄年代+冷门场景；choices 二分支） =====
  { id: 're_limit_window', title: '限购窗口的焦虑', era: [2013, 2025], weight: 2,
    text: '爆款基金比例配售，客户问"这次要不要多转点钱进来抢"。',
    effects: {},
    choices: [
      { text: '讲清配售比例的含义：超额资金原路退回，"多转"没有奖励', outcome: '客户按原计划申购，没有为配售打乱配置。', effects: { trust: 1 }, teach: 'fund_express' },
      { text: '「机会难得，多转点」', outcome: '客户转了大额又原路退回，白白折腾还心生怨气。', effects: { stress: 1 } },
    ],
    teach: '爆款与配售是情绪的产物，不是收益的保证。',
  },
  { id: 're_bond_fee', title: '短炒债基的赎回费', era: [2016, 2025], weight: 2,
    text: '客户把债基当活期用，三天一进一出，账单上赎回费比收益还高。',
    effects: {},
    choices: [
      { text: '调出持有期与费用明细做"成本可视化"，帮他切换到现金管理工具', outcome: '客户第一次看清短炒的真实成本，把零钱和投资分了家。', effects: { trust: 2 }, teach: 'fund_fee' },
      { text: '「手续费都是小钱」', outcome: '下个月他拿着被费用吃掉本金的账单来投诉。', effects: { trust: -2, stress: 2 } },
    ],
    teach: '费用可视化是纠正行为的最快路径。',
  },
  { id: 're_branch_merge', title: '网点撤并的风声', era: [2015, 2025], weight: 2,
    text: '同业网点撤并的消息传来，老客户担心"你们的网点会不会关，我的钱找谁办"。',
    effects: {},
    choices: [
      { text: '主动给存量客户打一轮电话：讲清线上替代+承诺服务连续性', outcome: '一轮电话下来，撤并焦虑变成了续约机会。', effects: { trust: 2 }, teach: 'digital_banking' },
      { text: '「等真撤了再说」', outcome: '谣言先于你到达客户，三个月后批量流失。', effects: { aum: -100000 } },
    ],
    teach: '服务连续性承诺要跑在传闻前面。',
  },
  { id: 're_bank_sec_transfer', title: '银证转账拥堵', era: [2014, 2015], weight: 2,
    text: '牛市开户潮，银证转账系统高峰拥堵，客户在网点排队抱怨。',
    effects: {},
    choices: [
      { text: '设置牛市专用引导：错峰操作指引+大额预约通道', outcome: '排队减半，客户记住的是你第一时间站出来说明。', effects: { trust: 1, fame: 1 } },
      { text: '「系统问题，我们也没办法」', outcome: '客户把拥堵和你的服务划了等号。', effects: { stress: 2 } },
    ],
    teach: '系统故障不可控，应对姿态可控。',
  },
  { id: 're_old_cd', title: '老存单挂失风波', era: [2008, 2018], weight: 2,
    text: '客户母亲去世，留下一张二十年的老存单，密码凭据遗失，兄弟姐妹对金额有分歧。',
    effects: {},
    choices: [
      { text: '走遗产继承流程：公证材料清单一次讲清，全程协助', outcome: '四十天后钱到账，全家送来锦旗。', effects: { trust: 3, fame: 2 }, teach: 'succession' },
      { text: '「这个我们办不了，去问公证处」', outcome: '客户在公证处与网点之间来回跑了五趟。', effects: { trust: -2 } },
    ],
    teach: '遗产业务的温度，是把复杂流程变成一张清单。',
  },
  { id: 're_soc_card', title: '社保卡换发高峰', era: [2015, 2022], weight: 2,
    text: '社保卡集中换发，厅堂挤满老年客户，业务量翻倍。',
    effects: {},
    choices: [
      { text: '开老年绿色通道+社区上门服务，顺手做防诈宣传', outcome: '社区口碑爆棚，月末转介绍三个人。', effects: { trust: 2, fame: 1 }, teach: 'senior_service' },
      { text: '「人手不够，让他们改天来」', outcome: '老人改天来的路上听了"高息理财"的传单。', effects: {} },
    ],
    teach: '高峰期是服务洼地，也是信任高地。',
  },
  { id: 're_counter_tb', title: '柜台国债售罄', era: [2006, 2016], weight: 2,
    text: '储蓄国债开售十分钟抢空，没抢到的阿姨在大厅不肯走。',
    effects: {},
    choices: [
      { text: '当场给替代方案排序：大额存单/记账式国债/定开理财，各讲清流动性', outcome: '阿姨选了等价替代，还带邻居来了一次。', effects: { trust: 2 }, teach: 'bond_saving' },
      { text: '「卖完了，下个月再来」', outcome: '阿姨下个月去了隔壁行，隔壁经理记住了她。', effects: { aum: -50000 } },
    ],
    teach: '售罄不是服务的终点，是替代方案的起点。',
  },
  { id: 're_coin_buy', title: '纪念币预约风波', era: [2015, 2025], weight: 1,
    text: '生肖纪念币预约火爆，客户问"能不能帮我也约一点，听说能翻倍"。',
    effects: {},
    choices: [
      { text: '讲清纪念币的面值属性与二级市场溢价风险，不代约不背书', outcome: '客户自己约了一套留纪念，没把它当投资。', effects: { trust: 1 }, teach: 'gold' },
      { text: '「帮您多约点，回头涨了算您的」', outcome: '面值货堆在家里，客户找你"回购"。', effects: { trust: -2, stress: 2 } },
    ],
    teach: '纪念品是情怀，不是资产配置。',
  },
  { id: 're_annuity_surrender', title: '年金退保潮', era: [2016, 2022], weight: 2,
    text: '同业高演示利率产品进来营销，你行三年前的年金险客户扎堆来问退保。',
    effects: {},
    choices: [
      { text: '逐户算"继续持有 vs 退保换购"的总账，不站队只给数', outcome: '多数客户算完选择不退，退了的也认可你的专业。', effects: { trust: 3 }, teach: 'sunk_cost' },
      { text: '「别退，退了亏死」（不给依据）', outcome: '客户转头拿着别家的演示表来质问你。', effects: { stress: 2 } },
    ],
    teach: '保单保卫战靠的是算账，不是劝。',
  },
  { id: 're_campus_pos', title: '校园卡套现苗头', era: [2012, 2020], weight: 1,
    text: '实习生反映：有学生客户用信用卡套现"周转生活费"，还推荐同学一起。',
    effects: {},
    choices: [
      { text: '合规提醒+给他算"最低还款+套现手续费"的债务螺旋，推荐正规助学渠道', outcome: '学生后怕收手，毕业后来存了第一笔工资。', effects: { trust: 1, fame: 1 }, teach: 'credit' },
      { text: '「年轻人的事少管」', outcome: '半年后他的逾期记录成了你的贷后难题。', effects: { stress: 1 } },
    ],
    teach: '年轻人的第一课，教比不教便宜。',
  },
  { id: 're_bill_broker', title: '票据中介上门', era: [2008, 2018], weight: 1,
    text: '有"资金中介"找上门，声称能帮客户把承兑汇票"贴现更快"，让你牵线。',
    effects: {},
    choices: [
      { text: '明确拒绝并记录上报，向对公客户提示票据中介风险', outcome: '次年票据中介案暴雷，你的客户毫发无损。', effects: { fame: 1 }, teach: 'fraud_alert' },
      { text: '「牵个线而已，不关我事」', outcome: '客户资金卡在中介链条里，你成了"介绍人"。', effects: { fame: -3, stress: 3 } },
    ],
    teach: '灰色链条上的每一环都会留名字。',
  },
  { id: 're_house_age_loan', title: '以房养老骗局拦截', era: [2016, 2025], weight: 2,
    text: '老年客户拿着"以房养老高息理财"合同来咨询，签字只剩最后一天。',
    effects: {},
    choices: [
      { text: '立即启动反诈流程：逐条拆合同、联系家属、必要时协助报案', outcome: '合同没签成，房子保住了。子女从外地专程来谢你。', effects: { trust: 5, fame: 3 }, teach: 'fraud_alert' },
      { text: '「合同是您自己签的，我们不好说什么」', outcome: '半年后老人无家可归的新闻里，有你行的小字。', effects: { fame: -4, stress: 3 } },
    ],
    teach: '老年反诈是理财经理的隐形 KPI。',
  },
  { id: 're_resign_wave', title: '离职季的军心', era: [2012, 2025], weight: 1,
    text: '同业挖角季，团队里有人蠢蠢欲动，业绩最好的那个请你吃饭"聊聊"。',
    effects: {},
    choices: [
      { text: '坦诚聊：职业生涯账+留任方案，同时把他的客户交接预案备好', outcome: '他留下了，且把这次谈话记进了"为什么留下来"。', effects: { fame: 1 }, teach: 'team_coaching' },
      { text: '「走就走吧，谁离不开谁」', outcome: '他带走了三个大客户和一个尚未出师的徒弟。', effects: { aum: -200000 } },
    ],
    teach: '留人靠的是账算得清，不是感情绑架。',
  },
  { id: 're_tax_new', title: '新个税法首年汇算', era: [2019, 2021], weight: 2,
    text: '个税专项附加扣除首年，客户扎堆问"房贷利息/赡养老人怎么扣"。',
    effects: {},
    choices: [
      { text: '做一张专项附加扣除对照表发客户群，顺手讲年度汇算', outcome: '群转发上百次，"专业"人设立住了。', effects: { trust: 2, fame: 1 }, teach: 'tax_annual' },
      { text: '「我也没搞明白」', outcome: '客户去了隔壁行的税务讲座，顺便开了户。', effects: {} },
    ],
    teach: '税务知识是最容易建立专业感的侧门。',
  },
  { id: 're_star_break', title: '科创板打新破发', era: [2021, 2025], weight: 2,
    text: '注册制下新股不再稳赚，客户打新首日破发，来问"要不要割"。',
    effects: {},
    choices: [
      { text: '讲清注册制定价机制与破发常态化，帮他建立"打新也需要筛选"的新框架', outcome: '客户从"无脑打新"转向"研究打新"，成了你的深度用户。', effects: { trust: 2 }, teach: 'market_basics' },
      { text: '「首次破发而已，继续打」', outcome: '第二支又破发，他把两只的亏损都算在你头上。', effects: { trust: -2 } },
    ],
    teach: '制度变了，话术不变就是误导。',
  },
];
