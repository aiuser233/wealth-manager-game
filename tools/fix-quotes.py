# -*- coding: utf-8 -*-
"""修 exams22-27 生成文件中内嵌单引号：中文语境里的 'xxx' 词组 → 「xxx」。"""
import io
import re

FILES = ['content/src/exams22.ts', 'content/src/exams23.ts', 'content/src/exams24.ts',
         'content/src/exams25.ts', 'content/src/exams26.ts', 'content/src/exams27.ts']

# 启发式：字符串字面量 'A'B'C' 形态（B 为 1-12 个非引号中文字符）→ 'A「B」C'
# 只处理中文内容（避免破坏代码语法）；逐行处理，只替换引号内的部分。
PATTERN = re.compile(r"([\u4e00-\u9fff（）、，。：/＋+－\-])'([\u4e00-\u9fff0-9A-Za-z ·%]{1,14})'([\u4e00-\u9fff，。：、）＋+/])")

for fn in FILES:
    s = io.open(fn, encoding='utf-8').read()
    lines = s.split('\n')
    out = []
    for ln in lines:
        # 拆出单引号包裹的字符串段并修复内部
        # 简单策略：把「前面是中文字符、内容 1-14 字、后面还是中文」的 'xxx' 替换成「xxx」
        new = PATTERN.sub(lambda m: m.group(1) + '「' + m.group(2) + '」' + m.group(3), ln)
        # 多轮迭代处理连续模式
        for _ in range(3):
            new2 = PATTERN.sub(lambda m: m.group(1) + '「' + m.group(2) + '」' + m.group(3), new)
            if new2 == new:
                break
            new = new2
        out.append(new)
    io.open(fn, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
    print('swept', fn)
