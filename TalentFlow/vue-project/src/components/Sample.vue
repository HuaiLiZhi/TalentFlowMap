<script setup lang="ts">
import { onMounted } from 'vue'
import '../assets/sample.css'
import initializeMap from './js/sample'

// 在组件挂载后初始化地图
onMounted(() => {
  initializeMap()
})
</script>

<template>
  <div>
    <div id="map"></div>
    <div class="demo-title">
      <h1>连接线——中国各年代的建交国家</h1>
      <h3>通过连接线展示中国与各国建立外交关系历年的变化</h3>
    </div>
    <div class="time-container">
      <div class="item active">
        <span data-year="50" data-info="50年代"></span>
      </div>
      <div class="item">
        <span data-year="60" data-info="60年代"></span>
      </div>
      <div class="item">
        <span data-year="70" data-info="70年代"></span>
      </div>
      <div class="item">
        <span data-year="80" data-info="80年代"></span>
      </div>
      <div class="item">
        <span data-year="90" data-info="90年代"></span>
      </div>
      <div class="item">
        <span data-year="2000" data-info="2000年后"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>