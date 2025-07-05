<script setup lang="ts">
import { onMounted } from 'vue'

// 初始化地图
onMounted(() => {
  // 配置安全密钥
  window._AMapSecurityConfig = {
    securityJsCode: "8459a6561ceacfac5ce2615f9b602d7e"
  }

  // 加载高德地图 API
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/loader.js'
  script.type = 'text/javascript'
  script.onload = () => {
    // 加载地图核心库
    window.AMapLoader.load({
      key: "304e8147b61d6b38035924f4cd41237e", // 开发者Key
      version: "2.0" // JS API 版本
    }).then((AMap) => {
      // 创建地图实例
      new AMap.Map("m-container")
    }).catch((e) => {
      console.error(e) // 加载错误提示
    })
  }
  document.body.appendChild(script)
})
</script>

<template>
  <div id="m-container"></div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 使用绝对定位确保容器与视口完全对齐 */
#m-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1; /* 确保地图显示在最上层 */
}

/* 完全禁用滚动 */
html, body {
  overflow: hidden;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
</style>