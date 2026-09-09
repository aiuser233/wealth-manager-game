<script setup lang="ts">
import { computed } from 'vue';
import { state, questNext, chooseQuest, closeQuestDialog } from '../state';
import { VOLUME_META } from '../volume-meta';

const d = computed(() => state.questDialog);
const currentLine = computed(() => d.value?.quest.dialogues[d.value.idx]);
const volLabel = computed(() => {
  const v = d.value?.quest.volume ?? 1;
  return VOLUME_META[v] ?? `卷${v}`;
});
const isFinalVol = computed(() => (d.value?.quest.volume ?? 1) === 5);
const isSystem = computed(() => currentLine.value?.speaker === '系统');
const moodColor = (mood?: string): string => {
  switch (mood) {
    case 'smile': return '#f0b429';
    case 'serious': return '#ff7a45';
    case 'angry': return '#ff5a5a';
    case 'sad': return '#8b98b8';
    case 'shock': return '#c9b8ff';
    default: return '#4f8cff';
  }
};
const gradeLabel = (g?: string): string => {
  switch (g) {
    case 'best': return '✦ 最佳抉择';
    case 'good': return '✓ 良好';
    case 'normal': return '○ 平平';
    case 'bad': return '✗ 隐患';
    default: return '';
  }
};
</script>

<template>
  <div v-if="d" class="mask" @click="d.phase === 'dialogue' && questNext()">
    <div class="panel story" @click.stop>
      <div class="head">
        <span class="vol">{{ volLabel }}</span>
        <h3>{{ d.quest.title }}</h3>
        <span class="date dim">{{ d.quest.date }}</span>
      </div>

      <!-- 对话阶段 -->
      <div v-if="d.phase === 'dialogue'" class="dialog-stage" @click="questNext()">
        <div class="dialog-box">
          <div class="speaker" :style="{ color: isSystem ? '#8b98b8' : moodColor(currentLine?.mood) }">
            {{ currentLine?.speaker }}
          </div>
          <p class="line" :class="{ sys: isSystem }">{{ currentLine?.text }}</p>
        </div>
        <div class="hint dim">点击继续（{{ d.idx + 1 }} / {{ d.quest.dialogues.length }}）</div>
      </div>

      <!-- 选择阶段 -->
      <div v-else-if="d.phase === 'choice'" class="choice-stage">
        <p class="dim tip">你的抉择——每个选择都在书写你的职业口碑：</p>
        <button v-for="(c, i) in d.quest.choices" :key="i" class="choice" @click="chooseQuest(i)">
          {{ c.text }}
        </button>
      </div>

      <!-- 结果阶段 -->
      <div v-else class="result-stage">
        <template v-if="state.ending">
          <p class="ending-title">✦ {{ state.ending.def.title }}</p>
          <p class="ending-tag">{{ state.ending.def.tagline }}</p>
          <div class="ending-scenes">
            <p v-for="(sc, i) in state.ending.def.scenes" :key="i" class="line" :class="{ sys: sc.speaker === '系统' }">
              <span class="speaker" :style="{ color: sc.speaker === '系统' ? '#8b98b8' : '#4f8cff' }">{{ sc.speaker }}</span>
              {{ sc.text }}
            </p>
          </div>
          <p class="outcome">{{ state.ending.def.epilogue }}</p>
          <p class="dim">{{ state.ending.summary[0] }}</p>
          <p class="dim">{{ state.ending.summary[1] }}</p>
        </template>
        <template v-else-if="state.volumeReview">
          <p class="vol-title">{{ state.volumeReview.headline }}</p>
          <div class="dim-grid">
            <div v-for="gd in state.volumeReview.grades" :key="gd.dim" class="dim-card">
              <span class="dim-name">{{ gd.dim }}</span>
              <span class="dim-grade">{{ gd.grade }}</span>
            </div>
          </div>
          <p v-for="(l, i) in state.volumeReview.lines" :key="i" class="outcome">{{ l }}</p>
        </template>
        <template v-else>
          <p class="grade" :class="d.resultGrade">{{ gradeLabel(d.resultGrade) }}</p>
          <p class="outcome">{{ d.resultText }}</p>
        </template>
        <button class="primary" @click="closeQuestDialog">
          {{ state.ending ? '结束生涯（归档）' : state.volumeReview ? (isFinalVol ? '生涯档案' : '开启下一卷') : '继续工作' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0; z-index: 70;
  background: rgba(4, 6, 14, 0.82);
  display: flex; align-items: center; justify-content: center;
}
.story { width: 680px; padding: 20px 26px; border-color: var(--accent2); }
.head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; }
.vol { color: var(--gold); font-size: 12px; letter-spacing: 2px; }
h3 { font-size: 17px; flex: 1; }

.dialog-stage { cursor: pointer; min-height: 220px; display: flex; flex-direction: column; }
.dialog-box { flex: 1; background: var(--bg2); border-radius: 10px; padding: 18px 22px; }
.speaker { font-weight: 700; font-size: 15px; margin-bottom: 8px; letter-spacing: 1px; }
.line { line-height: 2; font-size: 15px; }
.line.sys { color: var(--text-dim); font-style: italic; }
.hint { text-align: center; margin-top: 10px; font-size: 12px; }

.choice-stage { display: flex; flex-direction: column; gap: 10px; min-height: 180px; }
.tip { margin-bottom: 2px; }
.choice { text-align: left; padding: 12px 16px; line-height: 1.6; font-size: 14px; }

.result-stage { text-align: center; min-height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.grade { font-size: 18px; font-weight: 700; }
.grade.best { color: var(--gold); }
.grade.good { color: var(--down); }
.grade.normal { color: var(--text-dim); }
.grade.bad { color: var(--up); }
.outcome { line-height: 2; }

.vol-title { font-size: 17px; font-weight: 700; color: var(--gold); line-height: 1.6; }
.ending-title { font-size: 22px; font-weight: 800; color: var(--gold); letter-spacing: 2px; }
.ending-tag { color: var(--text-dim); margin-top: -6px; }
.ending-scenes { text-align: left; background: var(--bg2); border-radius: 10px; padding: 14px 18px; max-height: 260px; overflow-y: auto; }
.ending-scenes .speaker { font-weight: 700; margin-right: 8px; }
.ending-scenes .line { line-height: 1.9; font-size: 14px; }
.ending-scenes .line.sys { color: var(--text-dim); font-style: italic; }
.dim-grid { display: flex; justify-content: center; gap: 10px; }
.dim-card { display: flex; flex-direction: column; align-items: center; background: var(--bg2); border-radius: 8px; padding: 8px 18px; min-width: 72px; }
.dim-name { font-size: 12px; color: var(--text-dim); }
.dim-grade { font-size: 22px; font-weight: 800; color: var(--gold); }
</style>
