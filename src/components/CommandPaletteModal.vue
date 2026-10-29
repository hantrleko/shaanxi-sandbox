<template>
  <div v-if="active" class="cmd-overlay" @click.self="$emit('close')">
    <div class="cmd-card glass-panel" role="dialog" aria-modal="true" aria-label="全局指令与地标检索">
      <!-- 顶部搜索输入框 -->
      <div class="cmd-search-bar">
        <Search class="cmd-icon" :size="18" />
        <input
          ref="inputRef"
          v-model="query"
          class="cmd-input"
          placeholder="搜索地标、历史章节、沙盒模式或功能 (按 ESC 退出)..."
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="executeCurrent"
          @keydown.esc="$emit('close')"
        />
        <span class="cmd-esc-badge">ESC</span>
      </div>

      <!-- 搜索结果列表 -->
      <div class="cmd-results custom-scrollbar">
        <!-- 章节地貌匹配 -->
        <div v-if="filteredChapters.length" class="cmd-group">
          <div class="cmd-group-title">
            <MapPin :size="13" class="grp-icon" />
            <span>三秦时空章节 ({{ filteredChapters.length }})</span>
          </div>
          <div
            v-for="(item, idx) in filteredChapters"
            :key="item.id"
            class="cmd-item"
            :class="{ active: selectedIndex === idx }"
            @mouseenter="selectedIndex = idx"
            @click="selectChapter(item)"
          >
            <div class="item-left">
              <span class="item-num">{{ item.num }}</span>
              <div class="item-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-sub">{{ item.subTitle }} · {{ item.timeBadge || item.highlight }}</span>
              </div>
            </div>
            <span class="item-shortcut">跳转 ➔</span>
          </div>
        </div>

        <!-- 模式与工具匹配 -->
        <div v-if="filteredTools.length" class="cmd-group">
          <div class="cmd-group-title">
            <Compass :size="13" class="grp-icon" />
            <span>沙盒功能与交互矩阵 ({{ filteredTools.length }})</span>
          </div>
          <div
            v-for="(tool, tIdx) in filteredTools"
            :key="tool.id"
            class="cmd-item"
            :class="{ active: selectedIndex === filteredChapters.length + tIdx }"
            @mouseenter="selectedIndex = filteredChapters.length + tIdx"
            @click="executeTool(tool)"
          >
            <div class="item-left">
              <component :is="tool.icon" :size="16" class="tool-icon" />
              <div class="item-info">
                <span class="item-title">{{ tool.title }}</span>
                <span class="item-sub">{{ tool.desc }}</span>
              </div>
            </div>
            <span class="item-badge">{{ tool.badge }}</span>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-if="!filteredChapters.length && !filteredTools.length" class="cmd-empty">
          <FileQuestion :size="32" class="empty-icon" />
          <p>未找到与“{{ query }}”相匹配的地标或功能</p>
          <span class="empty-tip">可尝试搜索：太白山、华山、兵马俑、路书、航拍、四季</span>
        </div>
      </div>

      <!-- 底部快捷提示栏 -->
      <div class="cmd-footer">
        <div class="footer-keys">
          <span><kbd>↑</kbd> <kbd>↓</kbd> 导航</span>
          <span><kbd>Enter</kbd> 执行</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
        <div class="footer-brand">
          <span>EUGENE FINANCE 三秦空间计算</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
  Search,
  MapPin,
  Compass,
  FileQuestion,
  Image as GalleryIcon,
  Video,
  Navigation,
  Crosshair,
  Camera,
  Layers,
  History,
  Sun,
  CloudSnow,
  Swords,
  Box,
  FlaskConical
} from 'lucide-vue-next';

const props = defineProps({
  active: { type: Boolean, default: false },
  chapters: { type: Array, default: () => [] },
  themes: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'close',
  'select-chapter',
  'open-gallery',
  'open-tour',
  'open-roadbook',
  'open-detective',
  'open-poster',
  'open-changelog',
  'switch-mode',
  'change-lighting',
  'change-season'
]);

const inputRef = ref(null);
const query = ref('');
const selectedIndex = ref(0);

// 工具与快捷操作库
const TOOLS = [
  { id: 'gallery', title: '三秦实景影像集', desc: '16 处国家级地标高清真实自然摄影画廊', badge: '媒体库', icon: GalleryIcon, action: () => emit('open-gallery') },
  { id: 'tour', title: '《航拍三秦》巡航导览', desc: '电影级自动运镜自秦岭穿行至陕北长城', badge: '导览', icon: Video, action: () => emit('open-tour') },
  { id: 'roadbook', title: '3D 贴地飞行路书工坊', desc: '秦岭 210 国道、褒斜道与李白入陕自驾路线', badge: '研学', icon: Navigation, action: () => emit('open-roadbook') },
  { id: 'detective', title: '寻迹三秦 · 空间探秘挑战', desc: '看图辨地理、经纬度测绘答题挑战赛', badge: '探索', icon: Crosshair, action: () => emit('open-detective') },
  { id: 'poster', title: '3D 地理明信片海报', desc: '拍摄沙盘三维快照并生成国风文旅海报', badge: '文创', icon: Camera, action: () => emit('open-poster') },
  { id: 'wargame', title: '历史战役 · 军事沙盘推演', desc: '明修栈道暗度陈仓、子午谷奇谋战术对比', badge: '推演', icon: Swords, action: () => emit('switch-mode', 'campaign') },
  { id: 'bonsai', title: '微观高精地貌切块 (Zoom 12)', desc: '西岳华山天险、黄河壶口瀑布垂直切片剖析', badge: '微观', icon: Box, action: () => emit('switch-mode', 'bonsai') },
  { id: 'model', title: '科学演变 · 4 大互动实验台', desc: '黄土水蚀演化、秦岭造山、季风气候屏障', badge: '实验', icon: FlaskConical, action: () => emit('switch-mode', 'model') },
  { id: 'winter', title: '切换为【冬 · 北国雪原】', desc: '开启秦岭积雪着色与全域飞雪氛围粒子', badge: '季节', icon: CloudSnow, action: () => emit('change-season', 'winter') },
  { id: 'sunset', title: '切换为【夕照霞光】光照', desc: '华岳夕照、关中渭水残阳如血渲染', badge: '光影', icon: Sun, action: () => emit('change-lighting', 'sunset') },
  { id: 'changelog', title: 'V4.0 全景版本演更日志中心', desc: '查看架构重构、Design Token 与升级审计记录', badge: '系统', icon: History, action: () => emit('open-changelog') }
];

// 搜集所有章节
const allChapters = computed(() => {
  const res = [];
  if (props.themes) {
    props.themes.forEach(t => {
      if (t.chapters) {
        t.chapters.forEach(c => {
          res.push({ ...c, themeTitle: t.title, themeId: t.id });
        });
      }
    });
  }
  return res.length > 0 ? res : props.chapters;
});

const filteredChapters = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return allChapters.value.slice(0, 6);
  return allChapters.value.filter(c =>
    (c.title && c.title.toLowerCase().includes(q)) ||
    (c.subTitle && c.subTitle.toLowerCase().includes(q)) ||
    (c.desc && c.desc.toLowerCase().includes(q)) ||
    (c.highlight && c.highlight.toLowerCase().includes(q))
  ).slice(0, 8);
});

const filteredTools = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return TOOLS.slice(0, 5);
  return TOOLS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.badge.toLowerCase().includes(q)
  );
});

const totalItemsCount = computed(() => filteredChapters.value.length + filteredTools.value.length);

const moveSelection = (step) => {
  if (totalItemsCount.value === 0) return;
  selectedIndex.value = (selectedIndex.value + step + totalItemsCount.value) % totalItemsCount.value;
};

const executeCurrent = () => {
  const cLen = filteredChapters.value.length;
  if (selectedIndex.value < cLen) {
    selectChapter(filteredChapters.value[selectedIndex.value]);
  } else {
    const tIdx = selectedIndex.value - cLen;
    if (filteredTools.value[tIdx]) {
      executeTool(filteredTools.value[tIdx]);
    }
  }
};

const selectChapter = (item) => {
  emit('select-chapter', item);
  emit('close');
};

const executeTool = (tool) => {
  if (tool.action) tool.action();
  emit('close');
};

watch(() => props.active, (val) => {
  if (val) {
    query.value = '';
    selectedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});
</script>

<style scoped>
.cmd-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(4, 9, 17, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
  animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.cmd-card {
  width: 90vw;
  max-width: 640px;
  background: rgba(11, 26, 43, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 32px rgba(2, 132, 199, 0.2);
  border-radius: var(--radius-lg, 16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cmd-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 13, 23, 0.4);
}

.cmd-icon {
  color: var(--brand-cyan, #38bdf8);
  flex-shrink: 0;
}

.cmd-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: var(--text-md, 15px);
  font-family: inherit;
}

.cmd-input::placeholder {
  color: var(--text-dim, #64748b);
}

.cmd-esc-badge {
  font-size: 10px;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  color: var(--text-muted, #94a3b8);
  font-family: var(--font-mono, monospace);
}

.cmd-results {
  max-height: 52vh;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cmd-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cmd-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs, 11px);
  font-weight: 700;
  color: var(--text-dim, #64748b);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 8px;
}

.grp-icon {
  color: var(--brand-cyan, #38bdf8);
}

.cmd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: var(--radius-md, 10px);
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.cmd-item:hover,
.cmd-item.active {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.item-num {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs, 11px);
  font-weight: 700;
  color: var(--brand-cyan, #38bdf8);
  background: rgba(56, 189, 248, 0.15);
  padding: 3px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.tool-icon {
  color: var(--accent-gold, #f5b942);
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title {
  color: #fff;
  font-size: var(--text-base, 13.5px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  color: var(--text-muted, #94a3b8);
  font-size: var(--text-xs, 11px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-shortcut {
  font-size: var(--text-xs, 11px);
  color: var(--brand-cyan, #38bdf8);
  opacity: 0.8;
  flex-shrink: 0;
}

.item-badge {
  font-size: var(--text-xs, 11px);
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(245, 185, 66, 0.15);
  border: 1px solid rgba(245, 185, 66, 0.3);
  color: #fde68a;
  flex-shrink: 0;
}

.cmd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted, #94a3b8);
  gap: 10px;
}

.empty-icon {
  color: var(--text-dim, #64748b);
  opacity: 0.6;
}

.empty-tip {
  font-size: var(--text-xs, 11px);
  color: var(--text-dim, #64748b);
}

.cmd-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: rgba(6, 13, 23, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: var(--text-xs, 11px);
  color: var(--text-dim, #64748b);
}

.footer-keys {
  display: flex;
  align-items: center;
  gap: 14px;
}

.footer-keys kbd {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
}

.footer-brand {
  letter-spacing: 0.04em;
  font-size: 10px;
}
</style>
