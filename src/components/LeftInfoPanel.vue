<template>
  <aside
    class="left-info-panel glass-panel"
    :class="{
      collapsed: isCollapsed,
      'mobile-sheet': isMobile,
      'sheet-half': isMobile && mobileSheetState === 'half',
      'sheet-full': isMobile && mobileSheetState === 'full',
      'sheet-peek': isMobile && mobileSheetState === 'peek'
    }"
  >
    <!-- 移动端抽屉手柄条 (Mobile Bottom Sheet Drag Handle) -->
    <div
      v-if="isMobile"
      class="mobile-drag-handle-bar"
      @click="cycleMobileSheetState"
      role="button"
      title="点击调整抽屉高度 (收起/半屏/全屏)"
    >
      <div class="drag-pill"></div>
    </div>

    <!-- 桌面端侧栏收起/展开微动滑钮 -->
    <button
      v-if="!isMobile"
      class="panel-collapse-toggle"
      @click="isCollapsed = !isCollapsed"
      :title="isCollapsed ? '展开左侧面板 (L)' : '收起面板以纯净浏览 3D 沙盒 (L)'"
      aria-label="展开或收起图文面板"
    >
      <ChevronLeft v-if="!isCollapsed" :size="16" />
      <ChevronRight v-else :size="16" />
      <span class="toggle-v-text" v-if="isCollapsed">展开图文</span>
    </button>

    <!-- 折叠为微轨时的迷你状态 (Micro-rail state) -->
    <div v-if="isCollapsed && !isMobile" class="micro-rail-content" @click="isCollapsed = false">
      <span class="micro-seal-tag">{{ chapter.num }}</span>
      <span class="micro-title-v">{{ chapter.title }}</span>
      <Maximize2 :size="14" class="micro-icon" />
    </div>

    <!-- 正常展开面板主容器 -->
    <div v-show="!isCollapsed || isMobile" class="panel-content-wrap custom-scrollbar">
      <!-- 📸 16:9 置顶真实地理实景大图 -->
      <div
        v-if="currentPhotoUrl"
        class="hero-photo-banner"
        @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)"
        title="点击放大查看高清摄影大图"
      >
        <img :src="currentPhotoUrl" :alt="chapter.title" class="hero-photo-img" loading="lazy" />
        <div class="hero-photo-gradient"></div>
        <div class="hero-photo-top-bar">
          <span class="photo-live-badge">
            <span class="pulse-dot"></span>
            {{ showAltPhoto ? (chapter.altBadge || '胜迹/文物') : '真实地理摄影' }}
          </span>
          <div class="banner-actions" @click.stop>
            <button
              v-if="chapter.altPhotoUrl"
              class="photo-toggle-pill"
              @click="showAltPhoto = !showAltPhoto"
              :title="showAltPhoto ? '切换为今日实景摄影' : '切换为胜迹/复原风物'"
            >
              {{ showAltPhoto ? '📸 今日实景 ⇋' : '🏛️ 胜迹风物 ⇋' }}
            </button>
            <button
              class="photo-expand-pill"
              @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)"
              title="全屏放大"
            >
              <Maximize2 :size="11" />
              <span>放大</span>
            </button>
          </div>
        </div>
        <div class="hero-photo-caption" v-if="currentPhotoCaption">
          {{ currentPhotoCaption }}
        </div>
      </div>

      <!-- 章节核心信息头 (序号印章 + 主副标题) -->
      <div class="panel-header-block">
        <div class="title-meta-row">
          <span class="chapter-seal-tag">{{ chapter.num }} / {{ totalChapters }}</span>
          <span class="theme-context-lbl">{{ currentThemeTitle }}</span>
        </div>
        <h2 class="main-title">{{ chapter.title }}</h2>
        <div class="sub-title">{{ chapter.subTitle }}</div>
      </div>

      <!-- 四段式分段导航标签 (概览 · 地质剖面 · 实景风物 · 空间地标) -->
      <div class="segmented-nav" role="tablist">
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
          role="tab"
          :aria-selected="activeTab === 'overview'"
        >
          <BookOpen :size="13" />
          <span>史地概览</span>
        </button>
        <button
          v-if="chapter.diagramTitle"
          class="seg-tab"
          :class="{ active: activeTab === 'diagram' }"
          @click="activeTab = 'diagram'"
          role="tab"
          :aria-selected="activeTab === 'diagram'"
        >
          <Activity :size="13" />
          <span>地质剖面</span>
        </button>
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'scenery' }"
          @click="activeTab = 'scenery'"
          role="tab"
          :aria-selected="activeTab === 'scenery'"
        >
          <Camera :size="13" />
          <span>实景风物</span>
        </button>
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'pois' }"
          @click="activeTab = 'pois'"
          role="tab"
          :aria-selected="activeTab === 'pois'"
        >
          <MapPin :size="13" />
          <span>空间地标</span>
        </button>
      </div>

      <!-- 选项卡 1：史地概览 (逐句朗读高亮与印章指标) -->
      <div v-show="activeTab === 'overview'" class="tab-pane">
        <div class="desc-content">
          <p class="sentence-stream">
            <span
              v-for="(sent, sIdx) in sentences"
              :key="sIdx"
              class="sentence-span"
              :class="{ active: isPlaying && activeSentenceIndex === sIdx }"
            >
              {{ sent }}
            </span>
          </p>
        </div>

        <!-- 时代与核心指标印章卡片 -->
        <div class="badge-row">
          <div class="badge-card" v-if="chapter.timeBadge">
            <div class="badge-val">{{ chapter.timeBadge }}</div>
            <div class="badge-lbl">时代 · 地理特征</div>
          </div>
          <div class="badge-card highlight" v-if="chapter.highlight">
            <div class="badge-val">{{ chapter.highlight }}</div>
            <div class="badge-lbl">核心要点</div>
          </div>
        </div>
      </div>

      <!-- 选项卡 2：交互式地质剖面图解 (修复 { chapter.diagramTitle } 单括号 Bug) -->
      <div v-if="chapter.diagramTitle" v-show="activeTab === 'diagram'" class="tab-pane diagram-tab-pane">
        <div class="diagram-card glass-panel">
          <div class="diagram-card-title">
            <Activity :size="14" class="diag-icon" />
            <span>{{ chapter.diagramTitle }}</span>
          </div>

          <!-- 选项卡 2：交互式地质剖面图解 (国家地理典藏级矢量剖面) -->
          <!-- 1. 陕西南北地质大剖面 -->
          <svg
            v-if="chapter.diagramType === 'profile_shaanxi'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <defs>
              <linearGradient id="sxSkyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0b1728" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#040812" stop-opacity="0.4" />
              </linearGradient>
              <linearGradient id="loessGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" />
                <stop offset="35%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#451a03" />
              </linearGradient>
              <linearGradient id="grabenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#15803d" />
                <stop offset="40%" stop-color="#065f46" />
                <stop offset="100%" stop-color="#022c22" />
              </linearGradient>
              <linearGradient id="qinlingGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="25%" stop-color="#0284c7" />
                <stop offset="70%" stop-color="#0f172a" />
                <stop offset="100%" stop-color="#020617" />
              </linearGradient>
              <linearGradient id="bashanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#059669" />
                <stop offset="40%" stop-color="#047857" />
                <stop offset="100%" stop-color="#064e3b" />
              </linearGradient>
              <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#bae6fd" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="url(#sxSkyGrad)" rx="8" />

            <!-- 深层古老结晶基底 (Basement) -->
            <rect x="10" y="118" width="340" height="14" fill="#090d16" stroke="#1e293b" stroke-width="0.8" />
            <text x="14" y="128" font-size="6.5" fill="#64748b" letter-spacing="0.5">华北克拉通与扬子板块深部汇聚带 (Archaean - Proterozoic)</text>

            <!-- 陕北黄土高原地质体 (北侧) -->
            <path d="M 12 72 Q 45 68, 85 75 L 85 118 L 12 118 Z" fill="url(#loessGrad2)" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <line x1="12" y1="88" x2="85" y2="90" stroke="#f59e0b" stroke-width="0.7" stroke-dasharray="3 2" opacity="0.6" />
            <text x="18" y="64" font-size="8" fill="#fbbf24" font-weight="700" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">陕北黄土高原 ↗</text>
            <text x="18" y="76" font-size="6" fill="#fde68a" opacity="0.85">厚层风成黄土 (800-1400m)</text>

            <!-- 关中地堑断陷盆地与阶地 -->
            <path d="M 85 75 L 105 96 L 180 96 L 195 68 L 195 118 L 85 118 Z" fill="url(#grabenGrad)" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <!-- 渭河主水道与冲积层 -->
            <path d="M 115 95 Q 140 92 175 95" stroke="#38bdf8" stroke-width="2.5" fill="none" filter="url(#neonGlow)" />
            <text x="110" y="87" font-size="8" fill="#86efac" font-weight="700" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·八百里秦川 ↗</text>
            <text x="122" y="108" font-size="6" fill="#6ee7b7">渭河冲积扇 (350-500m)</text>

            <!-- 正断层 F1 北山断裂 & F2 华山秦岭北麓断裂 -->
            <line x1="85" y1="58" x2="105" y2="118" stroke="#ef4444" stroke-width="1.4" stroke-dasharray="3 2" />
            <text x="76" y="92" font-size="6" fill="#f87171">F1 ⇣</text>
            <line x1="195" y1="42" x2="180" y2="118" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="3 2" />
            <text x="184" y="62" font-size="6" fill="#f87171">⇡ F2</text>

            <!-- 秦岭中央造山带 (太白主峰 3771m 冰川极顶) -->
            <path d="M 195 68 L 222 24 L 235 32 L 250 16 L 270 78 L 270 118 L 195 118 Z" fill="url(#qinlingGrad2)" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <!-- 拔仙台冰川残积雪帽 -->
            <polygon points="250,16 242,28 258,28" fill="url(#snowGrad)" filter="url(#neonGlow)" />
            <text x="216" y="12" font-size="8.5" fill="#e0f2fe" font-weight="700" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">太白山 3771.2m ↗</text>
            <text x="204" y="48" font-size="6" fill="#93c5fd">花岗岩深成侵入岩</text>

            <!-- 汉江谷地 (汉中-安康) -->
            <path d="M 270 78 L 285 94 L 310 94 L 320 80 L 320 118 L 270 118 Z" fill="#047857" opacity="0.9" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <path d="M 285 93 Q 298 90 310 93" stroke="#06b6d4" stroke-width="2.5" fill="none" filter="url(#neonGlow)" />
            <text x="278" y="86" font-size="7.5" fill="#6ee7b7" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉江谷地 ↗</text>

            <!-- 大巴山 / 米仓山 (陕南南屏) -->
            <path d="M 320 80 L 340 45 L 354 55 L 354 118 L 320 118 Z" fill="url(#bashanGrad)" class="hotspot" @click="flyTo([3.02, 6.04, 47.39])" />
            <text x="325" y="42" font-size="8" fill="#34d399" font-weight="700" class="svg-lbl" @click="flyTo([3.02, 6.04, 47.39])">大巴山 2500m ↗</text>

            <!-- 800mm 水热分界天际光带 -->
            <line x1="250" y1="16" x2="250" y2="118" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.75" />
            <rect x="252" y="28" width="58" height="13" rx="3" fill="#0b1a2b" stroke="#38bdf8" stroke-width="0.8" />
            <text x="255" y="38" font-size="6.5" fill="#38bdf8" font-weight="700">800mm 降水分界</text>

            <!-- 南北指示器 -->
            <text x="14" y="20" font-size="7" fill="#94a3b8">◀ 北 (塞上高原)</text>
            <text x="306" y="20" font-size="7" fill="#94a3b8">南 (巴山汉水) ▶</text>
          </svg>

          <!-- 2. 秦岭气候水热屏障阻隔剖面 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_qinling'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <defs>
              <linearGradient id="warmMonsoonGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
                <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2" />
              </linearGradient>
              <linearGradient id="coldDryGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#1d4ed8" />
              </linearGradient>
            </defs>

            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="#0b1320" rx="8" />

            <!-- 北侧关中平原台塬 -->
            <path d="M 12 105 L 80 105 L 110 88 L 180 22 L 280 88 L 348 100 L 348 126 L 12 126 Z" fill="#132338" stroke="#38bdf8" stroke-width="1.2" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />

            <!-- 太白山主峰常年冰雪与第四纪冰川石海 -->
            <polygon points="180,22 170,36 190,36" fill="#ffffff" />
            <text x="145" y="15" font-size="9" fill="#fff" font-weight="700" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭主脊·太白山 3771.2m ↗</text>

            <!-- 北坡：西伯利亚冷高压干冷气团受阻下沉 -->
            <path d="M 24 35 Q 90 45 135 68" stroke="url(#coldDryGrad)" stroke-width="3" stroke-linecap="round" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <path d="M 130 63 L 138 72 L 126 73 Z" fill="#38bdf8" />
            <text x="24" y="27" font-size="7.5" fill="#38bdf8" font-weight="700" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">西伯利亚干冷气流被坚决阻断 ⬇</text>
            <text x="28" y="118" font-size="6.5" fill="#94a3b8">关中暖温带气候区</text>

            <!-- 南坡：太平洋/印度洋夏季风迎风坡抬升成云致雨 -->
            <path d="M 340 75 Q 260 62 205 38" stroke="url(#warmMonsoonGrad)" stroke-width="3.5" stroke-linecap="round" fill="none" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <path d="M 208 34 L 198 38 L 206 46 Z" fill="#10b981" />
            <text x="228" y="58" font-size="8" fill="#34d399" font-weight="700" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">暖湿气流迎风成雨 (降水>1000mm) ⬆</text>
            <text x="270" y="118" font-size="6.5" fill="#6ee7b7">陕南亚热带常绿落叶混交林</text>

            <!-- 雨水与云朵凝结微标 -->
            <g opacity="0.85">
              <circle cx="218" cy="48" r="1.5" fill="#38bdf8" />
              <circle cx="228" cy="52" r="1.5" fill="#38bdf8" />
              <circle cx="236" cy="46" r="1.5" fill="#38bdf8" />
              <circle cx="248" cy="54" r="1.5" fill="#38bdf8" />
            </g>

            <!-- 垂直地带性标签 -->
            <line x1="180" y1="22" x2="180" y2="126" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3 2" />
            <text x="184" y="80" font-size="6" fill="#f59e0b">0°C 一月等温线</text>
            <text x="184" y="92" font-size="6" fill="#f59e0b">亚热带 / 暖温带天然界线</text>
          </svg>

          <!-- 3. 关中地堑断陷盆地与八水环绕图 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_guanzhong'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <defs>
              <linearGradient id="grabenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#15803d" />
                <stop offset="40%" stop-color="#14532d" />
                <stop offset="100%" stop-color="#052e16" />
              </linearGradient>
            </defs>

            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="#080f1e" rx="8" />

            <!-- 北侧：北山阶梯断块 -->
            <path d="M 12 45 L 75 56 L 75 118 L 12 118 Z" fill="#1e293b" class="hotspot" @click="flyTo([3.0, 3.5, 6.0])" />
            <text x="18" y="40" font-size="7.5" fill="#94a3b8" font-weight="700">北山断阶 (铜川-耀州)</text>

            <!-- 中央地堑与巨厚第四纪冲积平原 (八百里沃野) -->
            <path d="M 75 56 L 95 92 L 255 92 L 275 35 L 275 118 L 75 118 Z" fill="url(#grabenFill)" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="135" y="84" font-size="8.5" fill="#86efac" font-weight="700" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·八百里沃野 ↗</text>
            <text x="138" y="104" font-size="6.5" fill="#4ade80">三级河流阶地与深厚冲积沉积 (深达数千米)</text>

            <!-- 渭河主河道 -->
            <path d="M 95 90 Q 175 86 255 90" stroke="#38bdf8" stroke-width="3" fill="none" />
            <text x="165" y="78" font-size="6.5" fill="#bae6fd">渭河主槽</text>

            <!-- 断裂带指示：F1 北山断裂，F2 秦岭北麓巨型正断裂 (华山断崖) -->
            <line x1="75" y1="42" x2="95" y2="118" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="3 2" />
            <text x="64" y="80" font-size="6" fill="#f87171">F1 ⇣</text>

            <line x1="275" y1="20" x2="255" y2="118" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="3 2" />
            <text x="264" y="60" font-size="6.5" fill="#f87171">⇡ F2 华山大断裂</text>

            <!-- 南侧：秦岭大断崖与华山千仞绝壁 -->
            <path d="M 275 35 L 315 14 L 348 38 L 348 118 L 275 118 Z" fill="#0369a1" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <text x="282" y="12" font-size="8" fill="#e0f2fe" font-weight="700" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭大断崖 (华山 2154m) ↗</text>
            <text x="288" y="30" font-size="6" fill="#7dd3fc">2000m 构造垂直断差</text>
          </svg>

          <!-- 4. 黄土塬梁峁侵蚀演变模式 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_loess'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="#100d07" rx="8" />

            <!-- ① 原生黄土塬 (平坦完整) -->
            <path d="M 12 45 L 85 45 L 85 118 L 12 118 Z" fill="#d97706" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <text x="22" y="38" font-size="8" fill="#fbbf24" font-weight="700" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">① 黄土塬 ↗</text>
            <text x="18" y="58" font-size="6" fill="#fde68a">宽广平坦塬面</text>
            <text x="18" y="68" font-size="6" fill="#fde68a">(如洛川塬/董志塬)</text>

            <!-- ② 切割黄土梁 (水流沿垂直节理深切成条状) -->
            <path d="M 100 56 Q 135 44 170 56 L 170 118 L 100 118 Z" fill="#b45309" class="hotspot" @click="flyTo([11.46, 4.2, -17.31])" />
            <text x="114" y="40" font-size="8" fill="#fde68a" font-weight="700" class="svg-lbl" @click="flyTo([11.46, 4.2, -17.31])">② 黄土梁 ↗</text>
            <text x="110" y="70" font-size="6" fill="#fcd34d">长条状分水岭脊梁</text>

            <!-- ③ 破碎黄土峁 (重力崩塌分割为孤立圆顶丘) -->
            <path d="M 185 68 Q 212 48 240 68 L 240 118 L 185 118 Z" fill="#92400e" class="hotspot" @click="flyTo([14.0, 3.5, -25.0])" />
            <text x="194" y="44" font-size="8" fill="#fed7aa" font-weight="700" class="svg-lbl" @click="flyTo([14.0, 3.5, -25.0])">③ 黄土峁 ↗</text>
            <text x="190" y="82" font-size="6" fill="#fed7aa">馒头状破碎丘陵</text>

            <!-- ④ 现代生态治理梯田与淤地坝 -->
            <path d="M 255 76 L 275 76 L 275 66 L 298 66 L 298 56 L 322 56 L 322 46 L 348 46 L 348 118 L 255 118 Z" fill="#15803d" class="hotspot" @click="flyTo([13.78, 4.82, -44.8])" />
            <text x="268" y="38" font-size="8" fill="#86efac" font-weight="700" class="svg-lbl" @click="flyTo([13.78, 4.82, -44.8])">④ 生态水土保持 ↗</text>
            <text x="268" y="92" font-size="6" fill="#86efac">梯田保墒 · 淤地坝固沙</text>
            <text x="268" y="102" font-size="6" fill="#bbf7d0">林草固土退耕还林</text>
          </svg>

          <!-- 5. 汉江水系与南水北调中线生态走廊 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_hanjiang'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="#04121a" rx="8" />

            <!-- 汉中盆地水源涵养地 -->
            <rect x="18" y="52" width="85" height="48" rx="4" fill="#047857" opacity="0.85" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="26" y="45" font-size="8" fill="#6ee7b7" font-weight="700" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉中盆地水源区 ↗</text>
            <text x="26" y="72" font-size="6" fill="#a7f3d0">汉江发源地 (宁强玉带河)</text>
            <text x="26" y="82" font-size="6" fill="#a7f3d0">朱鹮国家级保护湿地</text>

            <!-- 汉江干流碧水廊道 -->
            <path d="M 20 75 Q 120 70 190 75 T 340 75" stroke="#06b6d4" stroke-width="4.5" fill="none" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />

            <!-- 安康瀛湖深谷大水库 -->
            <circle cx="190" cy="75" r="16" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />
            <text x="156" y="52" font-size="8" fill="#e0f2fe" font-weight="700" class="svg-lbl" @click="flyTo([7.09, 0.85, 41.71])">安康瀛湖水库 ↗</text>
            <text x="162" y="104" font-size="6" fill="#bae6fd">I-II 类清冽水源 (大水缸)</text>

            <!-- 引汉济渭工程超深输水隧洞 -->
            <path d="M 90 75 L 140 25" stroke="#10b981" stroke-width="2.5" stroke-dasharray="4 2" fill="none" />
            <rect x="100" y="16" width="65" height="13" rx="3" fill="#032b1e" stroke="#10b981" stroke-width="0.8" />
            <text x="104" y="25" font-size="6.5" fill="#34d399" font-weight="700">引汉济渭秦岭隧洞 98km</text>

            <!-- 南水北调中线总干渠北上 -->
            <path d="M 300 75 L 340 35" stroke="#38bdf8" stroke-width="3" stroke-dasharray="4 2" fill="none" />
            <text x="268" y="28" font-size="8" fill="#38bdf8" font-weight="700">送水华北·京津冀 ➔</text>
            <text x="268" y="38" font-size="6" fill="#7dd3fc">丹江口水库出水北上</text>
          </svg>

          <!-- 6. 古代长安八水水系与都会空间格局 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_rivers'"
            viewBox="0 0 360 140"
            class="interactive-svg"
          >
            <!-- 背景面板 -->
            <rect x="0" y="0" width="360" height="140" fill="#09111e" rx="8" />

            <!-- 唐长安城规整方形里坊轮廓 -->
            <rect x="145" y="48" width="70" height="52" rx="3" fill="#111c30" stroke="#f59e0b" stroke-width="1.8" class="hotspot" @click="flyTo([6.24, 1.32, 16.98])" />
            <!-- 宫城与大雁塔标注 -->
            <rect x="165" y="52" width="30" height="16" fill="#1e293b" stroke="#f59e0b" stroke-width="0.8" />
            <text x="171" y="63" font-size="6" fill="#fde68a">太极宫/皇城</text>
            <text x="156" y="86" font-size="8.5" fill="#fde68a" font-weight="700" class="svg-lbl" @click="flyTo([6.24, 1.32, 16.98])">长安帝都 ↗</text>

            <!-- 渭河主干流水系 (北侧清流) -->
            <path d="M 18 32 Q 170 24 342 32" stroke="#06b6d4" stroke-width="3.5" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="26" y="24" font-size="7.5" fill="#06b6d4" font-weight="700">渭河水运主干 (横贯八百里秦川)</text>

            <!-- 泾河汇入与泾渭分明 -->
            <path d="M 235 6 Q 252 18 260 29" stroke="#eab308" stroke-width="3" fill="none" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="225" y="14" font-size="7" fill="#eab308" font-weight="700">泾水黄浊</text>
            <circle cx="260" cy="29" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="268" y="28" font-size="7.5" fill="#fca5a5" font-weight="700" class="svg-lbl" @click="flyTo([6.5, 4.0, 15.2])">泾渭分明 ↗</text>

            <!-- 西侧：沣河、涝河 -->
            <path d="M 60 115 Q 110 95 145 78" stroke="#38bdf8" stroke-width="1.8" fill="none" />
            <path d="M 30 115 Q 75 88 120 70" stroke="#38bdf8" stroke-width="1.4" fill="none" />
            <text x="45" y="106" font-size="6.5" fill="#93c5fd">沣河 · 涝河西来 (丰镐旧京)</text>

            <!-- 南侧：潏河、滈河 (出终南峪口) -->
            <path d="M 120 125 Q 170 108 215 125" stroke="#38bdf8" stroke-width="1.6" fill="none" />
            <text x="145" y="120" font-size="6.5" fill="#93c5fd">潏河 · 滈河南环 (终南诸峪)</text>

            <!-- 东侧：浐河、灞河 (灞桥折柳) -->
            <path d="M 215 78 Q 260 92 310 115" stroke="#38bdf8" stroke-width="1.8" fill="none" />
            <path d="M 225 60 Q 285 75 330 95" stroke="#38bdf8" stroke-width="1.4" fill="none" />
            <text x="245" y="98" font-size="6.5" fill="#93c5fd">浐河 · 灞河东流 (灞柳风雪)</text>
          </svg>

          <div class="card-caption">点选上方地质单元标签，镜头自动飞越到对应真实地貌</div>
        </div>
      </div>

      <!-- 选项卡 3：实景风物摄影 (大图全景与摄影志) -->
      <div v-show="activeTab === 'scenery'" class="tab-pane">
        <div class="scenery-feature-card glass-panel">
          <div class="feature-img-box" @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)">
            <img :src="currentPhotoUrl" :alt="chapter.title" class="feature-img" />
            <span class="preview-tag">点击开启画廊</span>
          </div>
          <div class="feature-meta">
            <span class="meta-title">{{ chapter.title }} · 摄影志</span>
            <p class="meta-desc">{{ currentPhotoCaption }}</p>
          </div>
        </div>
      </div>

      <!-- 选项卡 4：空间地标信标 (本章关联 POI 一键直达) -->
      <div v-show="activeTab === 'pois'" class="tab-pane">
        <div class="poi-quick-list">
          <div
            v-for="poi in relatedPois"
            :key="poi.id"
            class="poi-row-card glass-panel"
            @click="flyToPoi(poi)"
          >
            <div class="poi-row-left">
              <span class="poi-dot-indicator" :class="poi.type"></span>
              <div class="poi-text-col">
                <span class="poi-name-txt">{{ poi.name }}</span>
                <span class="poi-badge-txt">{{ poi.badge }}</span>
              </div>
            </div>
            <span class="poi-fly-arrow">飞向 ➔</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定操作栏 (永不被内容滚动遮挡) -->
    <div v-show="!isCollapsed || isMobile" class="fixed-action-footer">
      <button class="footer-btn listen-btn" :class="{ playing: isPlaying }" @click="$emit('listen-current')">
        <Volume2 v-if="!isPlaying" :size="14" />
        <VolumeX v-else :size="14" />
        <span>{{ isPlaying ? '暂停朗读' : '🎧 听这段' }}</span>
      </button>

      <button class="footer-btn focus-btn" @click="$emit('focus-feature')">
        <Crosshair :size="14" />
        <span>聚焦视点</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  BookOpen,
  Activity,
  Camera,
  MapPin,
  Volume2,
  VolumeX,
  Crosshair
} from 'lucide-vue-next';
import { POI_LIST } from '../data/shaanxiData.js';

const props = defineProps({
  chapter: { type: Object, required: true },
  totalChapters: { type: Number, default: 6 },
  currentThemeTitle: { type: String, default: "自然地理" },
  currentThemeId: { type: String, default: "geo" },
  themes: { type: Array, default: () => [] },
  isPlaying: { type: Boolean, default: false }
});

const emit = defineEmits([
  'listen-current',
  'focus-feature',
  'fly-strata',
  'view-photo',
  'change-theme',
  'collapse-change'
]);

const isCollapsed = ref(false);
const activeTab = ref('overview');
const activeSentenceIndex = ref(0);
const showAltPhoto = ref(false);
let timer = null;

// 移动端响应式侦测与 Bottom Sheet 状态 ('peek' | 'half' | 'full')
const isMobile = ref(false);
const mobileSheetState = ref('half');

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const cycleMobileSheetState = () => {
  if (mobileSheetState.value === 'peek') mobileSheetState.value = 'half';
  else if (mobileSheetState.value === 'half') mobileSheetState.value = 'full';
  else mobileSheetState.value = 'peek';
};

watch(isCollapsed, (val) => {
  emit('collapse-change', val);
});

const sentences = computed(() => {
  if (!props.chapter || !props.chapter.desc) return [];
  return props.chapter.desc.split(/(?<=[。！？；])/).filter(s => s.trim().length > 0);
});

const currentPhotoUrl = computed(() => {
  if (showAltPhoto.value && props.chapter?.altPhotoUrl) {
    return props.chapter.altPhotoUrl;
  }
  return props.chapter?.photoUrl || '';
});

const currentPhotoCaption = computed(() => {
  if (showAltPhoto.value && props.chapter?.altPhotoCaption) {
    return props.chapter.altPhotoCaption;
  }
  return props.chapter?.photoCaption || '';
});

// 本章节关联的地标点
const relatedPois = computed(() => {
  return POI_LIST.slice(0, 5);
});

const flyTo = (pos) => {
  emit('fly-strata', pos);
};

const flyToPoi = (poi) => {
  emit('fly-strata', [poi.pos[0] + 4, poi.pos[1] + 14, poi.pos[2] + 16], [poi.pos[0], poi.pos[1], poi.pos[2]]);
};

watch(() => props.chapter?.id, () => {
  showAltPhoto.value = false;
  activeTab.value = 'overview';
});

watch(() => props.isPlaying, (playing) => {
  if (playing) {
    activeSentenceIndex.value = 0;
    if (timer) clearInterval(timer);
    const intervalMs = Math.max(2500, Math.floor(18000 / (sentences.value.length || 1)));
    timer = setInterval(() => {
      if (activeSentenceIndex.value < sentences.value.length - 1) {
        activeSentenceIndex.value++;
      } else {
        clearInterval(timer);
      }
    }, intervalMs);
  } else {
    if (timer) clearInterval(timer);
    activeSentenceIndex.value = 0;
  }
}, { immediate: true });

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.left-info-panel {
  position: absolute;
  top: 76px;
  left: 20px;
  width: 370px;
  /* 严格限制最大高度，留出至少 104px 底部空间，坚决不遮挡底部时间轴 */
  max-height: calc(100vh - 180px);
  bottom: 104px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  background: var(--bg-glass-heavy, rgba(11, 26, 43, 0.94));
  border: 1px solid var(--border-light, rgba(56, 189, 248, 0.28));
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.8), 0 0 24px rgba(2, 132, 199, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform var(--motion-slow, 0.35s), max-height 0.3s ease;
  overflow: hidden;
}

.left-info-panel.collapsed {
  transform: translateX(calc(-100% - 24px));
}

/* 侧栏折叠拉手 */
.panel-collapse-toggle {
  position: absolute;
  top: 16px;
  right: -28px;
  width: 28px;
  height: 52px;
  background: rgba(11, 26, 43, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-left: none;
  border-radius: 0 10px 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--brand-cyan, #38bdf8);
  cursor: pointer;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.5);
  transition: all 0.2s;
  z-index: 20;
}

.panel-collapse-toggle:hover {
  background: #0284c7;
  color: #fff;
  width: 32px;
  right: -32px;
}

.toggle-v-text {
  writing-mode: vertical-rl;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* 滚动主容器 */
.panel-content-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 58px; /* 留出底部操作栏高度 */
}

/* 📸 16:9 比例实景横幅 */
.hero-photo-banner {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 190px;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  background: #060d17;
  flex-shrink: 0;
}

.hero-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.hero-photo-banner:hover .hero-photo-img {
  transform: scale(1.04);
}

.hero-photo-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(11, 26, 43, 0.2) 0%,
    rgba(11, 26, 43, 0.4) 50%,
    rgba(11, 26, 43, 0.95) 100%
  );
  pointer-events: none;
}

.hero-photo-top-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.photo-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(6, 13, 23, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: var(--brand-cyan, #38bdf8);
  font-size: var(--text-xs, 11px);
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.photo-toggle-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(11, 26, 43, 0.88);
  border: 1px solid rgba(245, 185, 66, 0.45);
  color: #fde68a;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.photo-toggle-pill:hover {
  background: rgba(245, 185, 66, 0.25);
  border-color: var(--accent-gold, #f5b942);
  color: #fff;
}

.photo-expand-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(6, 13, 23, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.photo-expand-pill:hover {
  border-color: var(--brand-cyan, #38bdf8);
  color: var(--brand-cyan, #38bdf8);
}

.hero-photo-caption {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  font-size: var(--text-xs, 11px);
  color: #f1f5f9;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 2;
}

/* 章节头部信息 */
.panel-header-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-seal-tag {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs, 11px);
  font-weight: 800;
  color: #fff;
  background: rgba(220, 38, 38, 0.35);
  border: 1px solid rgba(220, 38, 38, 0.55);
  padding: 2px 6px;
  border-radius: 4px;
}

.theme-context-lbl {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
}

.main-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl, 22px);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
}

.sub-title {
  font-size: var(--text-xs, 11.5px);
  color: var(--text-muted, #94a3b8);
}

/* 分段标签导航 */
.segmented-nav {
  display: flex;
  align-items: center;
  background: rgba(6, 13, 23, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 3px;
  gap: 2px;
}

.seg-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted, #94a3b8);
  font-size: var(--text-xs, 11.5px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.seg-tab.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  color: var(--brand-cyan, #38bdf8);
}

/* 选项卡内容区 */
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.desc-content {
  line-height: 1.65;
  font-size: var(--text-base, 13.5px);
  color: var(--text-sub, #cbd5e1);
}

.sentence-span {
  transition: all 0.25s;
  padding: 1px 2px;
  border-radius: 3px;
}

.sentence-span.active {
  background: rgba(245, 185, 66, 0.25);
  color: #fff;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(245, 185, 66, 0.4);
}

/* 印章指标卡片 */
.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.badge-card {
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-card.highlight {
  border-color: rgba(245, 185, 66, 0.35);
  background: rgba(245, 185, 66, 0.08);
}

.badge-val {
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  color: #fff;
}

.badge-lbl {
  font-size: 10px;
  color: var(--text-dim, #64748b);
  margin-top: 2px;
}

/* 地质剖面卡片 */
.diagram-card {
  padding: 10px;
  background: rgba(6, 13, 23, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: var(--radius-md, 10px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diagram-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs, 11.5px);
  font-weight: 700;
  color: #fff;
}

.diag-icon {
  color: var(--brand-cyan, #38bdf8);
}

.interactive-svg {
  width: 100%;
  border-radius: 6px;
  background: rgba(11, 26, 43, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.hotspot {
  cursor: pointer;
  transition: opacity 0.2s;
}

.hotspot:hover {
  opacity: 1 !important;
}

.svg-lbl {
  cursor: pointer;
}

.card-caption {
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
  text-align: center;
}

/* 实景风物卡片 */
.scenery-feature-card {
  padding: 10px;
  border-radius: var(--radius-md, 10px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.feature-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 4px;
}

.feature-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-title {
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  color: #fff;
}

.meta-desc {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
  line-height: 1.5;
}

/* 空间地标列表 */
.poi-quick-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.poi-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s;
}

.poi-row-card:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
}

.poi-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.poi-dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-cyan, #38bdf8);
}

.poi-dot-indicator.mountain { background: #10b981; }
.poi-dot-indicator.nature { background: #06b6d4; }
.poi-dot-indicator.relic { background: #f59e0b; }

.poi-text-col {
  display: flex;
  flex-direction: column;
}

.poi-name-txt {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: #fff;
}

.poi-badge-txt {
  font-size: 10px;
  color: var(--text-dim, #64748b);
}

.poi-fly-arrow {
  font-size: var(--text-xs, 11px);
  color: var(--brand-cyan, #38bdf8);
}

/* 固定底部操作栏 (Fixed Footer) */
.fixed-action-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(6, 13, 23, 0.94);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  z-index: 10;
}

.footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.listen-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
}

.listen-btn:hover,
.listen-btn.playing {
  background: rgba(245, 185, 66, 0.2);
  border-color: var(--accent-gold, #f5b942);
  color: #fde68a;
}

.focus-btn {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #fff;
}

.focus-btn:hover {
  background: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

/* 移动端底部抽屉 (Bottom Sheet) 样式 */
@media (max-width: 768px) {
  .left-info-panel.mobile-sheet {
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    border-radius: 20px 20px 0 0 !important;
    border-left: none;
    border-right: none;
    border-bottom: none;
    transform: none !important;
  }

  .mobile-sheet.sheet-peek {
    max-height: 160px;
  }

  .mobile-sheet.sheet-half {
    max-height: 48vh;
  }

  .mobile-sheet.sheet-full {
    max-height: 85vh;
  }

  .mobile-drag-handle-bar {
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    flex-shrink: 0;
    padding-top: 4px;
  }

  .drag-pill {
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
}
</style>
