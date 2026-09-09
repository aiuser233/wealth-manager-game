<script setup lang="ts">
import { computed } from 'vue';
import { state, getGame, pushLog } from '../state';
import { SUBORDINATES } from '@fm/core';

const g = computed(() => getGame());
const team = computed(() => g.value.team);
const members = computed(() => team.value?.members ?? []);
const lastEvents = computed(() => g.value.teamEvents ?? []);

const traitName: Record<string, string> = {
  eager: '进取型', steady: '稳健型', reckless: '冒进型', bookish: '学院型',
};

const coachLevel = computed(() => g.value.coachLevel ?? 0);

function setCoach(v: number) {
  g.value.coachLevel = v;
  pushLog(`【团队】本月辅导投入调整为「${['放手', '常规', '重点', '强化'][v]}」。`);
}

function assign(subId: string, big: boolean) {
  const r = team.value?.assignClient(subId, big);
  if (r) pushLog(`【团队】${r.text}`);
}

const graduating = computed(() => members.value.filter((m) => m.graduated).length);
</script>

<template>
  <div class="team">
    <section class="panel overview">
      <div class="head"><h3>团队概况</h3></div>
      <div class="stats-row">
        <div class="stat"><span class="dim">成员</span><b>{{ members.length }} / 5</b></div>
        <div class="stat"><span class="dim">团队士气</span><b :class="team && team.morale < 30 ? 'down' : 'gold'">{{ Math.round(team?.morale ?? 60) }}</b></div>
        <div class="stat"><span class="dim">已出师</span><b class="gold">{{ graduating }}</b></div>
        <div class="stat"><span class="dim">本月辅导投入</span><b>{{ ['放手', '常规', '重点', '强化'][coachLevel] }}</b></div>
      </div>
      <p class="dim tip">卷四起配下属（2023 小唐 → 2024 周远航/刘晴 → 2025 肖何）。辅导影响成长与士气，士气过低会闯祸/离职；出师人数是晋升"私行团队主管"的硬条件。</p>
      <div class="coach-ctrl">
        <span class="dim">辅导投入：</span>
        <button v-for="(label, i) in ['放手', '常规', '重点', '强化']" :key="i"
          :class="{ active: coachLevel === i }" @click="setCoach(i)">{{ label }}</button>
      </div>
    </section>

    <section v-if="members.length === 0" class="panel empty">
      <p class="dim">还没有下属。进入卷四（2023 年后），总行会给你配人。</p>
    </section>

    <section v-for="m in members" :key="m.id" class="panel member">
      <div class="head">
        <h3>{{ SUBORDINATES.find((d) => d.id === m.id)?.name ?? m.id }}</h3>
        <span class="dim">{{ traitName[SUBORDINATES.find((d) => d.id === m.id)?.trait ?? 'steady'] }}</span>
        <span v-if="m.graduated" class="grad">✦ 已出师</span>
      </div>
      <p class="bio dim">{{ SUBORDINATES.find((d) => d.id === m.id)?.bio }}</p>
      <div class="bars">
        <div class="bar-row"><span class="dim">能力</span>
          <div class="bar"><div class="fill" :style="{ width: m.skill + '%' }" /></div>
          <span class="num dim">{{ Math.round(m.skill) }}</span>
        </div>
        <div class="bar-row"><span class="dim">士气</span>
          <div class="bar"><div class="fill" :class="{ warn: m.morale < 30 }" :style="{ width: m.morale + '%' }" /></div>
          <span class="num dim">{{ Math.round(m.morale) }}</span>
        </div>
      </div>
      <div class="meta dim">带教 {{ m.coachedMonths }} 个月 · 闯祸 {{ m.incidents }} 次</div>
      <div class="assign">
        <button @click="assign(m.id, true)">分大客户（公平性 -）</button>
        <button @click="assign(m.id, false)">分练手客户（轮岗）</button>
      </div>
    </section>

    <section v-if="lastEvents.length" class="panel events">
      <div class="head"><h3>本月团队事件</h3></div>
      <p v-for="(ev, i) in lastEvents" :key="i" :class="['ev', ev.kind]">{{ ev.text }}</p>
    </section>
  </div>
</template>

<style scoped>
.team { display: flex; flex-direction: column; gap: 12px; }
.panel { background: var(--bg1); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; }
.head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
h3 { font-size: 15px; }
.stats-row { display: flex; gap: 26px; margin: 6px 0; }
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat b { font-size: 18px; }
.tip { margin: 6px 0; line-height: 1.8; }
.coach-ctrl { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
.coach-ctrl button.active { border-color: var(--gold); color: var(--gold); }
.bio { margin: 2px 0 8px; line-height: 1.7; }
.grad { color: var(--gold); font-weight: 700; }
.bars { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-row span { width: 34px; }
.bar { flex: 1; height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--accent2); }
.fill.warn { background: var(--down); }
.num { width: 30px; text-align: right; }
.meta { margin-bottom: 8px; }
.assign { display: flex; gap: 8px; }
.events .ev { line-height: 1.8; }
.events .ev.incident { color: var(--down); }
.events .ev.graduation { color: var(--gold); }
.events .ev.attrition { color: var(--down); }
</style>
