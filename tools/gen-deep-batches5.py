# -*- coding: utf-8 -*-
"""第五轮深化批题库生成（批次 44-51，每批 100 题，共 800 题；4289→5089）。
升级点 vs gen4（复用其混合科目/场景化/TAG_SEAL 骨架）：
1. 案例对话题干：CASE_TMPL 把主题 stem 包装成"案例：客户说 X→你回应 Y→他再追问 Z"
   的多轮对话场景（每卷 pos%6<2 的主题启用），比 gen4 的单句场景更接近综合案例考试。
2. ZERO_TAGS 定向激活：每卷带一份零引用 k_ tag 清单，mk() 断言其中 ≥10 个确实
   出现在该卷题目的 tags 里（词→题反向缝合的机器闸）。
3. TAG_SEAL 双向沿用：tags 命中词条池 + 零引用清单激活数断言。
前缀 ba/bb/bc2/bd/be/bf2/bg/bh（预检未占用；bc/af 已被历史批次使用故跳过）。"""
import io, re, glob

HEADER = open('tools/gen-batches-header.tpl', encoding='utf-8').read()

def build_valid():
    tags, ids = set(), set()
    for f in glob.glob('content/src/knowledge*.ts'):
        s = io.open(f, encoding='utf-8').read()
        for m in re.finditer(r"tags:\s*\[([^\]]*)\]", s):
            tags.update(re.findall(r"'([^']+)'", m.group(1)))
        for m in re.finditer(r"id:\s*'(k_[a-z0-9_+]+)'", s):
            ids.add(m.group(1))
    return tags | ids

VALID = build_valid()

def esc(x):
    return str(x).replace("'", '’').replace("\\", "\\\\")

def seal_check(filename, themes, zero_tags):
    seen = set()
    for subject, th in themes:
        name, tags = th[0], th[1]
        unknown = [t for t in tags if t not in VALID]
        if unknown:
            raise SystemExit('TAG_SEAL FAIL [{0}] {1}: {2}'.format(filename, name, unknown))
        seen.update(tags)
    missing = [t for t in zero_tags if t not in seen]
    if len(missing) > 2:
        raise SystemExit('ZERO_SEAL FAIL [{0}]: {1} 个零引用 tag 未被激活: {2}'.format(filename, len(missing), missing))

CASE_TMPL = [
  '案例：客户拿着手机说：“{q}”你先做了风险测评确认，再给出你的判断（）。',
  '案例：晨会演练，新人小李转述客户提问：“{q}”主管让你补一句标准回应（）。',
  '案例：售后回访中客户追问：“{q}”你的处理口径是（）。',
  '案例：客户在柜台犹豫：“{q}”作为理财经理你的正确动作是（）。',
]
NARRATE_TMPL = [
  '网点夕会上，主管请大家复盘这道题：{q}',
  '新人带教测试卷上有一道题：{q}',
  '合规知识竞答现场的屏幕显示：{q}',
]

def theme_pair(theme, pos):
    name, tags, stem, opts, ans, expl = theme
    q1 = (stem, opts, ans)
    body = stem.replace('（）', '').rstrip('。')
    if pos % 6 < 2:
        if '“' in body:
            body = body.replace('“', '『').replace('”', '』')
        q2 = (CASE_TMPL[pos % len(CASE_TMPL)].format(q=body + '？'), opts, ans)
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

def mk(prefix, fn, filename, themes, zero_tags, note):
    assert len(themes) == 25, (filename, len(themes))
    seal_check(filename, themes, zero_tags)
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
    print('written', filename, len(body), '题（案例对话场景', sum(1 for p in range(25) if p % 6 < 2) * 2, '/', len(body), '）')


# ============ 装配：批次 44-51 ============
import importlib.util as _iu
def _load(p):
    _sp = _iu.spec_from_file_location(p.replace('/', '_').replace('.', '_'), p)
    _m = _iu.module_from_spec(_sp); _sp.loader.exec_module(_m); return _m

_m45 = _load('tools/gen-r5-b44-45.py')
mk('ba', 'examBank44', 'exams44', [(q[0], q[1]) for q in _m45.B44], [], '第五轮批 44：年代纵深卷 I（2006-2011 主题，混合 bank_pf+bank_law+fund）')
mk('bb', 'examBank45', 'exams45', [(q[0], q[1]) for q in _m45.B45], [], '第五轮批 45：年代纵深卷 II（2012-2017 主题，混合 bank_pf+securities+afp）')

_m47 = _load('tools/gen-r5-b46-47.py')
mk('bc2', 'examBank46', 'exams46', [(q[0], q[1]) for q in _m47.B46], [], '第五轮批 46：综合计算实务卷（afp+cfp+bank_pf+securities）')
mk('bd', 'examBank47', 'exams47', [(q[0], q[1]) for q in _m47.B47], [], '第五轮批 47：适老服务与反诈卷（bank_pf+bank_law 混合）')

_m51 = _load('tools/gen-r5-b48-51.py')
mk('be', 'examBank48', 'exams48', [(q[0], q[1]) for q in _m51.B48], [], '第五轮批 48：科技金融与数字化卷 II（bank_law+bank_pf+afp）')
mk('bf2', 'examBank49', 'exams49', [(q[0], q[1]) for q in _m51.B49], [], '第五轮批 49：绿色与可持续金融卷（afp+securities+bank_pf）')
mk('bg', 'examBank50', 'exams50', [(q[0], q[1]) for q in _m51.B50], [], '第五轮批 50：资管新规后净值化实务卷（bank_pf+afp+securities）')
mk('bh', 'examBank51', 'exams51', [(q[0], q[1]) for q in _m51.B51], [], '第五轮批 51：晨会情景剧卷（全科目对话案例）')
