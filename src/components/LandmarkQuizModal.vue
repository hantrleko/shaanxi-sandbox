<template>
  <div class="quiz-modal-overlay" v-if="isOpen">
    <div class="quiz-modal glass-panel">
      <!-- 模态框顶部导航 -->
      <div class="modal-header">
        <div class="tab-switcher">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'codex' }"
            @click="currentTab = 'codex'"
          >
            📖 陕西地标与人文之最 (14条)
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'quiz' }"
            @click="currentTab = 'quiz'"
          >
            🎯 探究小测验 (联动 3D 验真)
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 内容区 1: 陕西之最图鉴 -->
      <div class="modal-body codex-body" v-if="currentTab === 'codex'">
        <div class="codex-grid">
          <div
            v-for="item in CODEX_LIST"
            :key="item.title"
            class="codex-card"
            @click="flyToTarget(item.pos)"
          >
            <div class="c-tag">{{ item.tag }}</div>
            <div class="c-title">{{ item.title }}</div>
            <div class="c-val">{{ item.val }}</div>
            <div class="c-desc">{{ item.desc }}</div>
            <div class="c-fly">🔍 点击飞向 3D 实景 ➔</div>
          </div>
        </div>
      </div>

      <!-- 内容区 2: 互动小测验 -->
      <div class="modal-body quiz-body" v-if="currentTab === 'quiz'">
        <div class="quiz-container">
          <div class="quiz-progress">
            <span>问题 {{ quizIndex + 1 }} / {{ QUIZ_LIST.length }}</span>
            <span class="quiz-score">当前得分: {{ score }} 分</span>
          </div>

          <div class="question-title">
            {{ currentQuestion.question }}
          </div>

          <div class="options-list">
            <button
              v-for="(opt, oIdx) in currentQuestion.options"
              :key="oIdx"
              class="opt-btn"
              :class="{
                correct: selectedOption !== null && oIdx === currentQuestion.answer,
                wrong: selectedOption === oIdx && oIdx !== currentQuestion.answer
              }"
              :disabled="selectedOption !== null"
              @click="submitAnswer(oIdx)"
            >
              <span class="opt-alpha">{{ ['A', 'B', 'C', 'D'][oIdx] }}.</span>
              <span class="opt-text">{{ opt }}</span>
            </button>
          </div>

          <!-- 解析与 3D 联动卡片 -->
          <div class="answer-feedback" v-if="selectedOption !== null">
            <div class="fb-status" :class="{ pass: selectedOption === currentQuestion.answer }">
              {{ selectedOption === currentQuestion.answer ? '🎉 回答正确！' : '❌ 回答有误' }}
            </div>
            <div class="fb-explain">{{ currentQuestion.explain }}</div>
            <button class="fly-verify-btn" @click="flyToTarget(currentQuestion.targetPos)">
              🚀 在 3D 沙盘上检验位置
            </button>

            <button
              class="next-q-btn"
              v-if="quizIndex < QUIZ_LIST.length - 1"
              @click="nextQuestion"
            >
              下一题 ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineProps({
  isOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'fly-to']);

const currentTab = ref('codex');
const quizIndex = ref(0);
const selectedOption = ref(null);
const score = ref(0);

const CODEX_LIST = [
  { tag: "最高峰", title: "秦岭主峰太白山", val: "海拔 3771.2 米", desc: "青藏高原以东第一高峰，保存有极其完整的第四纪冰川冰斗湖大爷海。", pos: [-4.84, 18.5, 22.75] },
  { tag: "奇险第一", title: "西岳华山南峰落雁", val: "海拔 2154.9 米", desc: "巨大完整花岗岩岩体拔地而起，长空栈道与千尺幢奇险绝伦。", pos: [17.10, 14.5, 14.77] },
  { tag: "第一大黄色瀑布", title: "黄河壶口瀑布", val: "河槽收缩至数十米", desc: "千里黄河一壶收，十里龙槽深切峡谷，水雾腾空雷霆万钧。", pos: [20.57, 5.5, -10.53] },
  { tag: "华夏第一陵", title: "桥山黄帝陵", val: "上古轩辕始祖寝陵", desc: "群柏掩映万古常青，海内外中华儿女寻根祭祖圣地。", pos: [9.20, 8.5, 2.5] },
  { tag: "世界第八大奇迹", title: "秦始皇兵马俑", val: "临潼地下威武军阵", desc: "千人千面栩栩如生，尽显大秦横扫六合席卷天下的磅礴气魄。", pos: [9.50, 4.2, 16.5] },
  { tag: "丝路第一商埠", title: "大唐西市金市", val: "隋唐全球最大商贸城", desc: "胡商云集车辙如注，东西方物质文化大流通的总源头。", pos: [6.24, 4.0, 16.98] }
];

const QUIZ_LIST = [
  {
    question: "楚汉相争中，韩信受封大将后‘明修栈道，暗度陈仓’，暗中出兵翻越了秦岭的哪座险关奇袭陈仓（宝鸡）？",
    options: ["潼关 (扼守晋陕豫咽喉)", "大散关 (川陕陈仓道咽喉)", "萧关 (六盘山北通道)", "武关 (秦楚古道要塞)"],
    answer: 1,
    explain: "韩信表面派樊哙大修褒斜栈道吸引章邯主力，实则亲率主力沿故道翻越大散关奇袭陈仓，两月内平定三秦。",
    targetPos: [-10.5, 12.0, 19.5]
  },
  {
    question: "著名的‘八水绕长安’滋润了八百里秦川。被称为‘清浊交汇、泾渭分明’的是哪两条河流在关中平原汇合？",
    options: ["汉江与丹江", "泾河与渭河", "沣河与涝河", "渭河与黄河"],
    answer: 1,
    explain: "泾河多沙浊、渭河水清（或依季节清浊各异），两河在西安高陵交汇处形成长达数里的清浊分明自然奇观。",
    targetPos: [6.5, 4.0, 15.2]
  },
  {
    question: "秦岭主峰太白山拔仙台是中国东部大陆的最高点，其海拔高度是多少？",
    options: ["2154 米 (此为西岳华山高度)", "3771.2 米", "1545 米 (泰山高度)", "3099 米 (峨眉山高度)"],
    answer: 1,
    explain: "太白山主峰拔仙台海拔3771.2米，气候垂直带谱极为完备，六月常有未化积雪。",
    targetPos: [-4.84, 18.5, 22.75]
  },
  {
    question: "1947年延安保卫战中，彭德怀指挥西北野战军运用‘蘑菇战术’，仅用1小时40分全歼敌整编三十一旅的首战是在哪里？",
    options: ["沙家店战役", "青化砭伏击战", "羊马河奔袭战", "蟠龙攻坚战"],
    answer: 1,
    explain: "1947年3月青化砭战役首战告捷，随后羊马河、蟠龙连捷，以少胜多扭转西北战局。",
    targetPos: [11.5, 8.5, -18.2]
  }
];

const currentQuestion = computed(() => QUIZ_LIST[quizIndex.value]);

const submitAnswer = (idx) => {
  selectedOption.value = idx;
  if (idx === currentQuestion.value.answer) {
    score.value += 25;
  }
};

const nextQuestion = () => {
  if (quizIndex.value < QUIZ_LIST.length - 1) {
    quizIndex.value++;
    selectedOption.value = null;
  }
};

const flyToTarget = (pos) => {
  emit('fly-to', pos);
  emit('close');
};
</script>

<style scoped>
.quiz-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.quiz-modal {
  width: 820px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-switcher {
  display: flex;
  gap: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.codex-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.codex-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}

.codex-card:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.c-tag {
  font-size: 10px;
  font-weight: 700;
  color: #fbbf24;
}

.c-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.c-val {
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
}

.c-desc {
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.5;
  margin-top: 4px;
}

.c-fly {
  font-size: 10.5px;
  color: #38bdf8;
  margin-top: 6px;
  font-weight: 600;
}

.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.quiz-progress {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.quiz-score {
  color: #fbbf24;
  font-weight: 700;
}

.question-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.opt-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.opt-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #fff;
}

.opt-btn.correct {
  background: rgba(16, 185, 129, 0.25) !important;
  border-color: #10b981 !important;
  color: #6ee7b7 !important;
}

.opt-btn.wrong {
  background: rgba(239, 68, 68, 0.25) !important;
  border-color: #ef4444 !important;
  color: #fca5a5 !important;
}

.opt-alpha {
  font-weight: 700;
  color: #38bdf8;
}

.answer-feedback {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fb-status {
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

.fb-status.pass {
  color: #10b981;
}

.fb-explain {
  font-size: 12.5px;
  line-height: 1.6;
  color: #cbd5e1;
}

.fly-verify-btn {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3));
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

.fly-verify-btn:hover {
  background: rgba(56, 189, 248, 0.4);
  color: #fff;
}

.next-q-btn {
  background: #38bdf8;
  border: none;
  color: #0f172a;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
</style>
