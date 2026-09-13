# -*- coding: utf-8 -*-
"""T8：reception.ts NEED_POOL 追加 4 种需求（14→18）。"""
import io

EXTRA = '''  {
    tag: 'windfall_house',
    surface: '家里房子拆迁，赔了四套房加 300 万现金，这钱怎么放？',
    probes: [
      { text: '这笔钱近几年有没有确定的大用途（换房/子女婚嫁/养老）？', reveal: '给小儿子结婚留了一份，养老要用一份，剩下的没想过。', trustDelta: 2, proDelta: 0.4 },
      { text: '家里人对怎么管这笔钱意见一致吗？', reveal: '老伴想全存银行，儿子想做点投资。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '拆迁款是"一笔进来、多口人盯着"的钱：先做用途分层与家庭共识，再谈配置——防骗防挥霍也是本案要点。',
    preferCategory: 'deposit',
    intentRatio: 0.5,
  },
  {
    tag: 'policy_review',
    surface: '十年前买的分红险，每年交两万，现在退保能拿多少？',
    probes: [
      { text: '把保单现金价值表找出来，先算清"现在退 vs 继续交"的总账。', reveal: '退的话才拿回六万多……交了八年了。', trustDelta: 2, proDelta: 0.6 },
      { text: '当时买这份保单，主要想解决什么问题？', reveal: '就是存个钱，当时说比银行高。', trustDelta: 1, proDelta: 0.4 },
    ],
    hidden: '老保单检视的关键不是退不退，而是把"已交的沉没成本"和"未来的现金流"分开算，避免情绪化退保。',
    preferCategory: 'insurance',
    intentRatio: 0.3,
  },
  {
    tag: 'pension_draw',
    surface: '下个月退休了，个人账户里的养老金怎么领最划算？',
    probes: [
      { text: '退休后计划每月固定支出多少？有没有其他现金流？', reveal: '老伴还有退休金，我主要是补贴日常。', trustDelta: 2, proDelta: 0.4 },
      { text: '一次性领取还是按月领取，了解过税的区别吗？', reveal: '听说一次性领要合并计税？', trustDelta: 1, proDelta: 0.5 },
    ],
    hidden: '养老金领取方式（按月/分次/一次性）的税负与长寿风险差异大；按月领取对多数人最优。',
    preferCategory: 'deposit',
    intentRatio: 0.25,
  },
  {
    tag: 'family_succession',
    surface: '我身体出过毛病，想趁脑子清楚，把该交代的事都交代了。',
    probes: [
      { text: '家庭资产的大致结构清楚吗（房产/存款/保单/股权）？', reveal: '两套房、存款不多，公司还有点股份，还有两份保单。', trustDelta: 2, proDelta: 0.5 },
      { text: '最担心的是什么：分不拢、分错人，还是被债牵连？', reveal: '都怕……主要是怕孩子将来扯皮。', trustDelta: 2, proDelta: 0.4 },
    ],
    hidden: '传承需求的第一步不是产品，是家庭结构与债务底数盘点；遗嘱+受益人+保单架构三件套先搭起来。',
    preferCategory: 'insurance',
    intentRatio: 0.4,
  },
'''

p = 'packages/core/src/reception.ts'
s = io.open(p, encoding='utf-8').read()
i = s.rfind('\n];')
s2 = s[:i].rstrip().rstrip(',') + ',\n' + EXTRA.rstrip() + '\n];\n'
io.open(p, 'w', encoding='utf-8', newline='\n').write(s2)
print('needs total:', s2.count("tag: '"))
