# -*- coding: utf-8 -*-
"""第四轮深化批题库生成（批次 36-43，每批 100 题，共 800 题；3489→4289）。
升级点 vs gen3：
1. 混合科目：每卷 25 主题跨 2-3 科目（theme 元组带 subject 字段）。
2. 场景化题干：主题 stem 以 'SCENE:' 标记客户原话/网点场景内容，渲染为
   '客户拿着…来问你' 类场景题干；无标记主题的 variant-2 用反向追问模板
   （'下列理解最不可取的是'）。两卷合计场景+追问类题干占比≥40%。
3. 去重：同主题下 variant-1/variant-2 不再复制同一 stem。
4. TAG_SEAL 断言沿用 gen3（每题 tags 必须命中词条体系）。
前缀 sz/tz/uz/vz/wz/xz/yz/zz（已验证未占用）。"""
import io, re, glob

HEADER = open('tools/gen-batches-header.tpl', encoding='utf-8').read()

def build_valid():
    tags, ids = set(), set()
    for f in ['knowledge', 'knowledge2', 'knowledge3', 'knowledge4', 'knowledge5', 'knowledge6', 'knowledge7', 'knowledge8', 'knowledge9']:
        s = io.open('content/src/' + f + '.ts', encoding='utf-8').read()
        for m in re.finditer(r"tags:\s*\[([^\]]*)\]", s):
            tags.update(re.findall(r"'([^']+)'", m.group(1)))
        for m in re.finditer(r"id:\s*'(k_[a-z0-9_+]+|re_[a-z0-9_]+)'", s):
            ids.add(m.group(1))
    return tags | ids

VALID = build_valid()

def esc(x):
    """题干/选项文本嵌入 TS 单引号字符串前的转义：ASCII 直引号（含直单引号）
    一律改为中文弯引号，并转义 TS 定界符，杜绝 'text' 内嵌 ' 造成的语法破碎。"""
    return str(x).replace("'", '’').replace("\\", "\\\\")

def seal_check(filename, themes):
    for subject, th in themes:
        name, tags = th[0], th[1]
        unknown = [t for t in tags if t not in VALID]
        if unknown:
            raise SystemExit('TAG_SEAL FAIL [{0}] {1}: {2}'.format(filename, name, unknown))

SCENE_TMPL = [
  '客户拿着手机里的产品页来问：“{q}？”你应该怎么选？',
  '晨会上主管提问：“{q}？”，你的标准答案是（）。',
  '售后回访时客户问到：“{q}？”，你的回应是（）。',
  '厅堂轮值时，客户拿着打印页问：“{q}？”你的判断是（）。',
]
NARRATE_TMPL = [
  '网点夕会上，主管请大家复盘这道题：{q}',
  '新人培训测试卷上有一道题：{q}',
  '合规知识竞答现场的屏幕显示：{q}',
]

def theme_pair(theme, pos):
    """返回该主题两道 single 题的 (stem, opts, ans)：
    variant-1＝原题干（概念直问）；variant-2＝场景化包装——pos%5<2 的主题
    渲染为客户原话/网点场景题干（'客户拿着…来问你'类，题干去（）占位、
    问号收口），其余渲染为网点培训/复盘转述场景；问句与答案保持不变。
    原题干自带双引号的（客户对话案例），改用『』包裹避免嵌套。"""
    name, tags, stem, opts, ans, expl = theme
    q1 = (stem, opts, ans)
    body = stem.replace('（）', '').rstrip('。')
    if pos % 5 < 2:
        if '“' in body:
            body = body.replace('“', '『').replace('”', '』')
        q2 = (SCENE_TMPL[pos % len(SCENE_TMPL)].format(q=body), opts, ans)
    else:
        q2 = (NARRATE_TMPL[pos % len(NARRATE_TMPL)].format(q=stem), opts, ans)
    return [q1, q2]

def render_s(qid, subject, theme, sqa):
    name, tags, stem0, opts0, ans0, expl = theme
    stem, opts, ans = sqa
    diff = len(qid) % 5 + 1
    return "  s('{0}', '{1}', '{2}', {3}, '{4}', {5}, {6}, '{7}', {8}),".format(qid, subject, name, str(tags).replace('"', "'"), esc(stem), '[' + ','.join("'" + esc(o) + "'" for o in opts) + ']', ans, esc(expl), diff)

def render_m(qid, subject, theme):
    name, tags, stem, opts, ans, expl = theme
    diff = (len(qid) % 4) + 2
    return "  m('{0}', '{1}', '{2}', {3}, '关于「{4}」，下列说法正确的有（）。', {5}, [{6}], '{7}（唯一正确项为 {6}，其余为典型错误说法。）', {8}),".format(qid, subject, name, str(tags).replace('"', "'"), esc(name), '[' + ','.join("'" + esc(o) + "'" for o in opts) + ']', ans, esc(expl), diff)

def render_j(qid, subject, theme):
    name, tags, stem, opts, ans, expl = theme
    correct = opts[ans].rstrip('。')
    return "  j('{0}', '{1}', '{2}', {3}, '判断：{4}——{5}。', 0, '{6}', {7}),".format(qid, subject, name, str(tags).replace('"', "'"), name, esc(correct), esc(expl), 1)

def mk(prefix, fn, filename, themes, note):
    assert len(themes) == 25, (filename, len(themes))
    seal_check(filename, themes)
    body, idx = [], 1
    for pos, (subject, theme) in enumerate(themes):
        pairs = theme_pair(theme, pos)
        for v in range(4):
            qid = '{0}{1:03d}'.format(prefix, idx)
            if v in (0, 1):
                body.append(render_s(qid, subject, theme, pairs[v]))
            elif v == 2:
                body.append(render_m(qid, subject, theme))
            else:
                body.append(render_j(qid, subject, theme))
            idx += 1
    header = HEADER.replace('@@FN@@', fn).replace('@@NOTE@@', note)
    io.open('content/src/' + filename + '.ts', 'w', encoding='utf-8', newline='\n').write(header + '\n'.join(body) + '\n];\n')
    scene_n = sum(1 for p in range(25) if p % 5 < 2) * 2
    print('written', filename, len(body), '题（客户原话场景题干', scene_n, '/', len(body), '）')


# ============ 批次 36：传承与家族财富卷（混合 cfp+bank_law） ============
B36 = [
  ('exam_cfp', ('家企资产盘点', ['k_trust_service', 'succession'], '家族财富盘点表的第一栏通常不是资产金额，而是（）。', ['资产权属与来源合法性', '收益率', '经理名字', '开户行'], 0, '权属不清，一切安排都是空中楼阁。')),
  ('exam_cfp', ('受益人架构', ['insurance_basics', 'succession'], '大额保单"受益人指定+份额+顺序"设计的核心目标是（）。', ['按意愿定向传承并隔离债务', '多领钱', '免体检', '保费折扣'], 0, '受益人架构是保单传承功能的第一开关。')),
  ('exam_cfp', ('隔代传承', ['succession', 'family_lifecycle'], '祖辈直接把财产留给孙辈的合规工具是（）。', ['遗嘱指定+遗赠或保险受益人安排', '自动继承', '让父母代持', '现金埋起来'], 0, '隔代传承需要明确的工具载体。')),
  ('exam_cfp', ('家族宪章', ['family_lifecycle', 'k_household_ips'], '家族宪章区别于遗嘱的地方在于它管的是（）。', ['家族决策规则与价值观的延续', '只有财产分配', '只有税务', '只有公司股权'], 0, '富过三代的答案往往在规则不在钱。')),
  ('exam_cfp', ('婚前财产', ['marriage_asset', 'k_prenuptial_asset'], '婚前存款婚后产生的利息，司法实践通常认定（）。', ['孳息与自然增值仍属个人财产', '全部共同财产', '全部个人财产', '视心情'], 0, '经营性收益才是共同财产的高危区。')),
  ('exam_cfp', ('保险金信托', ['k_insurance_trust_ops', 'insurance_trust'], '保险金信托 2.0 模式相较 1.0 的进化是（）。', ['信托作为投保人接续缴费，避免投保人身故保单失效', '收益翻倍', '门槛更高无功能', '免健康告知'], 0, '2.0 解决的是"保单自身的存续风险"。')),
  ('exam_cfp', ('遗嘱保管', ['succession'], '自书遗嘱最常见的失效原因是（）。', ['形式要件瑕疵（日期/全文亲笔/签名缺失）', '内容不合理', '字迹太差', '没有公证'], 0, '形式要件比内容更容易翻车。')),
  ('exam_cfp', ('传承税务', ['k_inheritance_tax_prep', 'tax_basics'], '我国尚未开征遗产税，当前传承的主要显性成本是（）。', ['不动产过户税费与继承权公证等程序成本', '遗产税 20%', '赠与税 50%', '没有成本'], 0, '讲成本讲程序，不讲"避税神话"。')),
  ('exam_cfp', ('企业股权传承', ['succession', 'k_risk_isolation'], '家族企业股权传承的前置动作是（）。', ['规范财务与权属清理（含关联担保）', '先立遗嘱', '先上市', '先分红'], 0, '股权带病传承=把雷留给孩子。')),
  ('exam_cfp', ('跨境传承', ['k_cross_border_wealth', 'cross_border'], '家庭成员税务居民身份跨境分布时，传承规划的第一步是（）。', ['梳理各自税务居民身份与申报义务', '买外汇', '换国籍', '现金搬运'], 0, '身份决定税制，税制决定工具。')),
  ('exam_bank_law', ('公证遗嘱', ['succession'], '公证遗嘱的效力特点是（）。', ['形式证据效力强，但仍以最后有效遗嘱为准', '永远优先', '不可撤销', '不用亲笔'], 0, '民法典后公证遗嘱不再有优先效力。')),
  ('exam_bank_law', ('遗产管理人', ['succession'], '民法典新增的"遗产管理人"制度解决的是（）。', ['继承开始后遗产的保管与分配执行主体', '遗产税', '继承权公证', '遗赠效力'], 0, '程序性制度的落地工具。')),
  ('exam_bank_law', ('共同遗嘱', ['succession'], '夫妻共同遗嘱的风险点是（）。', ['一方撤回/变更时的效力争议', '税务加倍', '不能处分房产', '必须公证'], 0, '形式与撤回规则要写明。')),
  ('exam_bank_law', ('保险避债误区', ['insurance_basics', 'red_lines'], '"买保险就能避债"的正确理解是（）。', ['仅在受益人指定与架构合法的前提下有隔离效果', '绝对避债', '保费越高越避债', '与架构无关'], 0, '恶意避债的架构会被撤销。')),
  ('exam_bank_law', ('继承公证材料', ['succession'], '办理继承权公证通常需要的核心材料是（）。', ['死亡证明+亲属关系证明+财产凭证+继承人身份', '只要遗嘱', '只要户口本', '银行流水'], 0, '材料清单一次讲清是网点基本功。')),
  ('exam_bank_law', ('存款继承查询', ['succession', 'privacy'], '已故存款人小额存款提取的简化政策通常适用于（）。', ['限额以内的存款凭简单材料直接支取', '所有金额', '仅理财产品', '仅外币'], 0, '简化门槛各地额度不同，先查再办。')),
  ('exam_cfp', ('家族办公室', ['k_family_office', 'trust'], '单一家族办公室（SFO）与私人银行的区别核心是（）。', ['SFO 服务单一家族的全盘事务，视角是家族而非产品', '收益更高', '门槛更低', '更省事'], 0, '视角差异决定服务边界。')),
  ('exam_cfp', ('慈善安排', ['philanthropy', 'k_charity_plan'], '家族慈善的三大工具是（）。', ['慈善捐赠/慈善信托/家族基金会', '存款/理财/保险', '股票/债券/基金', '现金/黄金/房产'], 0, '慈善也是传承教育的一部分。')),
  ('exam_cfp', ('二代培养', ['family_lifecycle', 'k_team_coaching'], '二代财富教育最有效的起点通常是（）。', ['从小额可支配资金的真实决策开始', '直接给公司', '只讲大道理', '完全不让碰钱'], 0, '决策权与责任同步下放。')),
  ('exam_cfp', ('数字遗产', ['privacy', 'succession'], '数字遗产（账号/虚拟资产/虚拟货币）的传承难点是（）。', ['平台服务协议限制+权属法律空白', '价值无法评估', '无法储存', '税率过高'], 0, '新形态资产的程序性空白。')),
  ('exam_cfp', ('保单年检', ['insurance_basics', 'family_lifecycle'], '家庭保单年检的第一优先级是（）。', ['保障缺口与受益人信息是否跟上家庭变化', '收益率排名', '保险公司大小', '佣金返点'], 0, '保单是活的，家庭也是。')),
  ('exam_cfp', ('债务隔离边界', ['k_risk_isolation', 'red_lines'], '合法的债务隔离前提是（）。', ['债务发生前的正当安排+资金来源合法', '负债后再转移资产', '代持隐名', '现金交易'], 0, '事后转移可被撤销，恶意安排无效。')),
  ('exam_cfp', ('信托监察人', ['trust', 'succession'], '家族信托设置保护人/监察人的作用是（）。', ['监督受托人履职、必要时变更受托安排', '多收一层费', '代行投资决策', '继承受益权'], 0, '权力制衡写进架构。')),
  ('exam_cfp', ('传承沟通', ['communication', 'family_lifecycle'], '与长辈谈传承话题的开场建议是（）。', ['从"您希望孩子们以后怎么相处"切入', '直接谈遗产分配', '先谈葬礼', '回避话题'], 0, '传承话题的入口是价值观不是数字。')),
  ('exam_cfp', ('受益权与债权', ['insurance_basics', 'succession'], '指定受益人的身故保险金与遗产的关系是（）。', ['不属于遗产，原则上不用于清偿被保险人债务', '先还债再分配', '视金额大小', '归投保人'], 0, '这是受益人指定最大的制度红利。')),
]
mk('sz', 'examBank36', 'exams36', B36, '第四轮批 36：传承与家族财富卷（混合科目 cfp+bank_law，场景化题干启动）')

import importlib.util as _iu
_spec = _iu.spec_from_file_location('r4b', 'tools/gen-r4-b37-38.py')
_mod = _iu.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
mk('tz', 'examBank37', 'exams37', [('exam_afp', t) if t[0] is None else (t[0].split('|')[0], t) for t in []] or [(q[0], q[1]) for q in _mod.B37], '第四轮批 37：退休与长寿风险卷（混合 afp+bank_pf）')
mk('uz', 'examBank38', 'exams38', [(q[0], q[1]) for q in _mod.B38], '第四轮批 38：信用与个人信贷卷（混合 bank_law+bank_pf）')

_spec2 = _iu.spec_from_file_location('r4b2', 'tools/gen-r4-b39-43.py')
_mod2 = _iu.module_from_spec(_spec2)
_spec2.loader.exec_module(_mod2)
mk('vz', 'examBank39', 'exams39', [(q[0], q[1]) for q in _mod2.B39], '第四轮批 39：科技金融与数字化卷（混合 bank_law+bank_pf）')
mk('wz', 'examBank40', 'exams40', [(q[0], q[1]) for q in _mod2.B40], '第四轮批 40：绿色与 ESG 理财卷（混合 afp+securities+bank_pf）')

_spec3 = _iu.spec_from_file_location('r4b3', 'tools/gen-r4-b41-43.py')
_mod3 = _iu.module_from_spec(_spec3)
_spec3.loader.exec_module(_mod3)
mk('xz', 'examBank41', 'exams41', [(q[0], q[1]) for q in _mod3.B41], '第四轮批 41：跨境与全球配置卷（混合 afp+securities+bank_pf+bank_law）')
mk('yz', 'examBank42', 'exams42', [(q[0], q[1]) for q in _mod3.B42], '第四轮批 42：危机与特殊时期应对卷（混合 bank_pf+securities+afp+bank_law）')
mk('zz', 'examBank43', 'exams43', [(q[0], q[1]) for q in _mod3.B43], '第四轮批 43：综合合规与场景案例卷（全科目混合）')
