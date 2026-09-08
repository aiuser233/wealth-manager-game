<script setup lang="ts">
import { computed } from 'vue';
import { state, questNext, chooseQuest, closeQuestDialog } from '../state';

const d = computed(() => state.questDialog);
const currentLine = computed(() => d.value?.quest.dialogues[d.value.idx]);
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
        <span class="vol">卷一 · 黄金年代</span>
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
        <p class="grade" :class="d.resultGrade">{{ gradeLabel(d.resultGrade) }}</p>
        <p class="outcome">{{ d.resultText }}</p>
        <button class="primary" @click="closeQuestDialog">继续工作</button>
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
</style>
