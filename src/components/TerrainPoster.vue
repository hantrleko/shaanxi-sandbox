<template>
  <figure class="relief-poster" :style="{ aspectRatio: poster.width + ' / ' + poster.height }">
    <img
      :src="asset"
      :width="poster.width"
      :height="poster.height"
      alt="根据高程数据绘制的陕西地形，陕北高原、关中平原与陕南山地由北向南排列"
      fetchpriority="high"
      draggable="false"
    />
    <span
      v-for="point in poster.points"
      :key="point.name"
      class="relief-label"
      :class="{ 'label-west': point.name === '汉中' }"
      :style="{ left: point.left + '%', top: point.top + '%' }"
    >{{ point.name }}</span>
  </figure>
</template>

<script setup>
import poster from '../data/reliefPoster.json';

const asset = import.meta.env.BASE_URL + 'textures/shaanxi_relief.webp';
</script>

<style scoped>
.relief-poster {
  position: relative;
  width: 100%;
  isolation: isolate;
}

.relief-poster img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(10px 18px 18px rgba(0, 0, 0, .34));
}

.relief-label {
  position: absolute;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  color: #f7efdb;
  font-size: clamp(10px, 1vw, 13px);
  font-weight: 650;
  text-shadow: 0 1px 4px #071c1e, 0 0 8px #071c1e;
  white-space: nowrap;
}

.relief-label::before {
  content: '';
  width: 6px;
  height: 6px;
  margin: 0 7px 0 -3px;
  background: #ecd096;
  border: 1px solid #314a46;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(7, 28, 30, .35);
}

.relief-label.label-west {
  flex-direction: row-reverse;
  transform: translate(-100%, -50%);
}

.relief-label.label-west::before { margin: 0 -3px 0 7px; }
</style>
