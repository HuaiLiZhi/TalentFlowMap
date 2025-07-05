<template>
  <div class="map-container">
    <!-- 左侧人员信息侧边栏 -->
    <div class="person-sidebar">
      <div class="sidebar-header">
        <h3>
          {{ selectedProvince ? `${selectedProvince.name} 人员信息` : '请选择省份' }}
        </h3>
        <p class="year-indicator">当前年份: {{ selectedYear }}</p>
      </div>
      <div class="person-list">
        <div v-if="filteredPersons.length === 0" class="empty提示">
          暂无该省份在{{ selectedYear }}年的人员数据
        </div>

        <div
            v-for="person in filteredPersons"
            :key="person.person_id"
            class="person-card"
            @click="selectPerson(person)"
        >
          <!-- 姓名和行业 -->
          <div class="person-header">
            <h4>{{ person.name }}</h4>
            <span class="industry-tag">{{ person.industry }}</span>
          </div>

          <!-- 人员信息 -->
          <div class="person-info">
            <div class="info-row">
              <p>ID: {{ person.person_id }}</p>
              <p>职位: {{ person.position }}</p>
            </div>
            <div class="info-row">
              <p>工作年限: {{ person.work_years }}年</p>
            </div>
          </div>

          <!-- 能力信息 -->
          <div class="abilities">
            <div class="ability-row">
              <div class="ability-item">
                <span>基础能力: {{ person.basic_ability }}</span>
              </div>
              <div class="ability-item">
                <span>专业能力: {{ person.professional_ability }}</span>
              </div>
            </div>
            <div class="ability-row">
              <div class="ability-item">
                <span>创新能力: {{ person.innovative_ability }}</span>
              </div>
              <div class="ability-item">
                <span>综合评分: {{ person.score }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增：人员详细信息显示框 -->
    <div class="person-detail-panel">
      <h3>人员详细信息</h3>
      <div v-if="!selectedPerson" class="empty-detail">
        请点击左侧人员卡片查看详细信息
      </div>
      <div v-else class="detail-content">
        <!-- 基本信息（两列布局） -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="two-column">
            <p>姓名: {{ selectedPerson.name }}</p>
            <p>ID: {{ selectedPerson.person_id }}</p>
            <p>性别: {{ selectedPerson.sex }}</p>
            <p>年龄: {{ selectedPerson.age }}岁</p>
            <p>籍贯: {{ selectedPerson.native_place }}</p>
          </div>
        </div>

        <!-- 教育背景（两列布局） -->
        <div class="detail-section">
          <h4>教育背景</h4>
          <div class="two-column">
            <p>最高学历: {{ selectedPerson.highest_education }}</p>
            <p>毕业院校: {{ selectedPerson.graduated_school }}</p>
          </div>
        </div>

        <!-- 工作信息（两列布局） -->
        <div class="detail-section">
          <h4>工作信息</h4>
          <div class="two-column">
            <p>行业: {{ selectedPerson.industry }}</p>
            <p>职位: {{ selectedPerson.position }}</p>
            <p>工作年限: {{ selectedPerson.work_years }}年</p>
          </div>
        </div>

        <!-- 能力评估（两列布局） -->
        <div class="detail-section">
          <h4>能力评估</h4>
          <div class="two-column">
            <p>综合评分: {{ selectedPerson.score }}</p>
            <p>基础能力: {{ selectedPerson.basic_ability }}</p>
            <p>专业能力: {{ selectedPerson.professional_ability }}</p>
            <p>创新能力: {{ selectedPerson.innovative_ability }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 地图容器 -->
    <div id="m-container"></div>

    <!-- 右侧控制面板 -->
    <div class="control-panel">
      <h3>中国省市选择</h3>
      <div class="province-list">
        <div
            v-for="province in provinces"
            :key="province.adcode"
            :class="{'province-item': true, 'active': activeProvince === province.adcode}"
            @click="selectProvince(province)"
        >
          {{ province.name }}
        </div>
      </div>
      <div v-if="selectedProvince" class="province-info">
        <h4>{{ selectedProvince.name }}</h4>
        <p>中心坐标: {{ selectedProvince.center.join(', ') }}</p>
      </div>
    </div>

    <!-- 时间轴组件 -->
    <div class="timeline-container">
      <div class="timeline-header">
        <span class="timeline-title">年份选择</span>
        <div class="timeline-track">
          <div
              v-for="year in years"
              :key="year"
              :class="{'timeline-item': true, 'active': selectedYear === year}"
              @click="handleYearClick(year)"
          >
            {{ year }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import provincesData from './json/china-provinces.json'
import populationData from './json/data/province_population_frequency.json'
import traceData from './json/data/province_migration_frequency.json'
import personData from './json/data/persons_track.json'
import personDetailData from './json/data/persons_info.json'  // 导入人员详细信息JSON

// 定义数据
const provinces = ref(provincesData.provinces)
const selectedProvince = ref(null)
const activeProvince = ref('')
const map = ref(null)
const textOverlays = ref([])
const circleOverlays = ref([])

// 时间轴相关
const years = ref<number[]>([])
const selectedYear = ref<number>(0)
const yearGroupData = ref<Record<number, Record<string, any>>>({})

// 轨迹线相关
const traceLines = ref([])
const yearTraceData = ref({})

// 人员数据相关
const personTracks = ref(personData)
const yearProvincePersons = ref<Record<number, Record<string, any[]>>>({})
const filteredPersons = ref([])

// 新增：人员详细信息相关
const personDetails = ref(personDetailData)  // 存储所有人员的详细信息
const selectedPerson = ref(null)  // 存储当前选中的人员


// 初始化数据处理
const initPopulationData = () => {
  const uniqueYears = Array.from(new Set(populationData.map(item => item.time))).sort((a, b) => a - b)
  years.value = uniqueYears
  if (uniqueYears.length > 0) {
    selectedYear.value = uniqueYears[0]
  }

  const grouped = {}
  populationData.forEach(item => {
    if (!grouped[item.time]) grouped[item.time] = {}
    grouped[item.time][item.province] = {
      population: item.population,
      frequency: item.frequency
    }
  })
  yearGroupData.value = grouped
}

const initPersonData = () => {
  const grouped = {};
  personTracks.value.forEach(track => {
    if (!grouped[track.time]) {
      grouped[track.time] = {};
    }
    const province = track.province;
    if (!grouped[track.time][province]) {
      grouped[track.time][province] = [];
    }
    grouped[track.time][province].push(track);
  });
  yearProvincePersons.value = grouped;
};

const initTraceData = () => {
  const grouped = {}
  traceData.forEach(item => {
    if (!grouped[item.time]) grouped[item.time] = []
    grouped[item.time].push(item)
  })
  yearTraceData.value = grouped
}

const currentYearData = computed(() => {
  return yearGroupData.value[selectedYear.value] || {}
})

const filterPersonsByYearAndProvince = () => {
  if (!selectedProvince || !selectedYear.value) {
    filteredPersons.value = [];
    return;
  }

  const provincePersons = yearProvincePersons.value[selectedYear.value]?.[selectedProvince.value.name] || [];
  const uniquePersons = [];
  const personIds = new Set();
  provincePersons.forEach(person => {
    if (!personIds.has(person.person_id)) {
      personIds.add(person.person_id);
      uniquePersons.push(person);
    }
  });

  filteredPersons.value = uniquePersons;
};

// 新增：处理人员选择
const selectPerson = (person) => {
  // 查找并合并人员的基础信息和详细信息
  const detail = personDetails.value.find(d => d.person_id === person.person_id) || {};
  selectedPerson.value = { ...person, ...detail };
};

watch([() => selectedYear.value, () => selectedProvince.value], () => {
  filterPersonsByYearAndProvince()
})

const districtLayer = ref(null)

// 高亮选中省份相关线段，淡化其他线段
const highlightRelatedLines = (provinceName) => {
  traceLines.value.forEach(lineInfo => {
    const { polyline, start, end } = lineInfo;
    const isRelated = start === provinceName || end === provinceName;
    polyline.setOptions({
      strokeOpacity: isRelated ? 1 : 0.05
    });
  });
};

// 初始化地图
onMounted(() => {
  initPopulationData()
  initTraceData()
  initPersonData()

  window._AMapSecurityConfig = {
    securityJsCode: "8459a6561ceacfac5ce2615f9b602d7e"
  }

  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/loader.js'
  script.onload = () => {
    window.AMapLoader.load({
      key: "304e8147b61d6b38035924f4cd41237e",
      version: "2.0",
      plugins: ['AMap.Text', 'AMap.DistrictLayer', 'AMap.Polyline']
    }).then((AMap) => {
      map.value = new AMap.Map("m-container", {
        showLabel: false,
        zoom: 4.6,
        center: [105.855339, 36.544393],
        viewMode: '3D',
        mapStyle: 'amap://styles/light',
        pitch: 30,
        rotation: 0
      })

      createProvinceLabels(AMap)
      createDistrictLayer(AMap)
      updateDistrictColorsByYear(AMap)
      createProvinceTraces(AMap)
      updateTracesByYear(AMap)
    })
  }
  document.body.appendChild(script)
})


// 创建带点击和悬停效果的省份标签
const createProvinceLabels = (AMap) => {
  provinces.value.forEach(province => {
    const defaultStyle = {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '3px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.1s ease'
    }

    const hoverStyle = {
      ...defaultStyle,
      backgroundColor: 'rgba(64, 158, 255, 0.9)',
      fontSize: '14px',
      boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
    }

    const activeStyle = {
      ...defaultStyle,
      backgroundColor: 'rgba(64, 158, 255, 1)',
      color: 'white',
      fontSize: '14px',
      boxShadow: '0 3px 10px rgba(64, 158, 255, 0.5)'
    }

    const label = new AMap.Text({
      text: province.name,
      position: province.center,
      offset: new AMap.Pixel(-25, -15),
      style: defaultStyle,
      zIndex: 11
    })

    label._provinceData = province

    label.on('mouseover', () => {
      if (activeProvince.value !== province.adcode) {
        label.setStyle(hoverStyle)
      }
    })

    label.on('mouseout', () => {
      if (activeProvince.value !== province.adcode) {
        label.setStyle(defaultStyle)
      }
    })

    label.on('click', () => {
      selectProvince(province)
    })

    label.setMap(map.value)
    textOverlays.value.push({ label, province: province.name })
  })
}

// 更新标签选中状态样式
const updateLabelStyles = (provinceCode) => {
  textOverlays.value.forEach(({ label }) => {
    const province = label._provinceData
    if (province.adcode === provinceCode) {
      label.setStyle({
        backgroundColor: 'rgba(64, 158, 255, 1)',
        color: 'white',
        fontSize: '14px',
        boxShadow: '0 3px 10px rgba(64, 158, 255, 0.5)'
      })
    } else {
      label.setStyle({
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        fontSize: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      })
    }
  })
}

// 创建行政区域图层
const createDistrictLayer = (AMap) => {
  const provinceAdcodes = provinces.value.map(province => province.adcode)

  districtLayer.value = new AMap.DistrictLayer.Province({
    zIndex: 8,
    adcodes: provinceAdcodes,
    depth: 0,
    styles: {
      'fill': (props) => {
        const province = provinces.value.find(
            p => String(p.adcode) === String(props.adcode)
        )?.name

        if (!province) {
          console.log(`未找到匹配省份: ${props.adcode}`)
          return 'rgba(200,200,200,0.3)'
        }

        const data = currentYearData.value
        const provinceData = data[province] || { frequency: 0 }

        const allFrequencies = Object.values(data).map(item => item.frequency)
        const minFreq = Math.min(...allFrequencies, 0)
        const maxFreq = Math.max(...allFrequencies, 0)
        const freqRange = maxFreq - minFreq || 1
        const normalizedFreq = (provinceData.frequency - minFreq) / freqRange

        return getColorByFrequency(normalizedFreq)
      }
    }
  })

  districtLayer.value.setMap(map.value)
}

const getColorByFrequency = (frequency: number) => {
  const normalized = Math.max(0, Math.min(1, frequency))
  const blue = Math.round(255 * (1 - normalized))
  const red = Math.round(255 * normalized)
  return `rgba(${red}, 0, ${blue}, 0.5)`
}

const updateDistrictColorsByYear = (AMap) => {
  if (!districtLayer.value) return

  const latestData = currentYearData.value
  const allFrequencies = Object.values(latestData).map(item => item.frequency)
  const minFreq = allFrequencies.length > 0 ? Math.min(...allFrequencies) : 0
  const maxFreq = allFrequencies.length > 0 ? Math.max(...allFrequencies) : 0
  const freqRange = maxFreq - minFreq || 1

  districtLayer.value.setStyles({
    'fill': (props) => {
      const province = provinces.value.find(
          p => String(p.adcode) === String(props.adcode)
      )?.name

      if (!province) return 'rgba(200,200,200,0.3)'

      const provinceData = latestData[province] || { frequency: 0 }
      const normalizedFreq = (provinceData.frequency - minFreq) / freqRange

      return getColorByFrequency(normalizedFreq)
    }
  })
}

const createProvinceTraces = () => {
  traceLines.value.forEach(lineInfo => map.value?.remove(lineInfo.polyline));
  traceLines.value = [];
};

// 更新轨迹线
const updateTracesByYear = () => {
  traceLines.value.forEach(lineInfo => map.value?.remove(lineInfo.polyline));
  traceLines.value = [];

  const currentTraces = yearTraceData.value[selectedYear.value] || [];
  if (currentTraces.length === 0) return;

  const frequencies = currentTraces.map(trace => trace.frequency);
  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);
  const freqRange = maxFreq - minFreq || 1;

  currentTraces.forEach(trace => {
    const startProvince = provinces.value.find(p => p.name === trace.start_province);
    const endProvince = provinces.value.find(p => p.name === trace.end_province);

    if (!startProvince || !endProvince) return;

    const normalizedFreq = (trace.frequency - minFreq) / freqRange;
    const [startLng, startLat] = startProvince.center;
    const [endLng, endLat] = endProvince.center;

    const polyline = new window.AMap.Polyline({
      path: [
        [startLng, startLat],
        [endLng, endLat]
      ],
      strokeColor: getColorByFrequency(normalizedFreq),
      strokeWeight: 1,
      strokeOpacity: 0.7,
      zIndex: 10,
      strokeStyle: 'solid',
      depth: 10000
    });

    traceLines.value.push({
      polyline,
      start: startProvince.name,
      end: endProvince.name
    });

    map.value?.add(polyline);
  });

  if (selectedProvince.value) {
    highlightRelatedLines(selectedProvince.value.name);
  }
};


// 选择省份
const selectProvince = (province) => {
  selectedProvince.value = province;
  activeProvince.value = province.adcode;
  map.value?.setZoomAndCenter(6, province.center);
  filterPersonsByYearAndProvince();
  updateLabelStyles(province.adcode);
  highlightRelatedLines(province.name);
};

const handleYearClick = (year) => {
  selectedYear.value = year;
  updateDistrictColorsByYear(null);
  updateTracesByYear();
};
</script>

<style scoped>
/* 原有样式保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#m-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 250px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.province-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
}

.province-item {
  padding: 8px 10px;
  margin: 3px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.province-item:hover {
  background-color: #f0f0f0;
}

.province-item.active {
  background-color: #409eff;
  color: white;
}

.province-info {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.timeline-container {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 0 20px;
}

.timeline-header {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px 20px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
}

.timeline-title {
  display: inline-block;
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.timeline-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: thin;
}

.timeline-item {
  padding: 8px 18px;
  background-color: #f1f5f9;
  border-radius: 20px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-size: 14px;
}

.timeline-item:hover {
  background-color: #e2e8f0;
  transform: translateY(-1px);
}

.timeline-item.active {
  background-color: #409eff;
  color: white;
  font-weight: 500;
}

/* 人员信息侧边栏样式 */
.person-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.sidebar-header h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.year-indicator {
  color: #666;
  font-size: 13px;
  opacity: 0.8;
}

.person-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* 人员卡片样式 */
.person-card {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer; /* 显示可点击光标 */
}

.person-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1); /* 增强悬停效果 */
}

.person-card:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* 点击效果 */
}

.person-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.person-header h4 {
  color: #333;
  font-size: 15px;
}

.industry-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #e8f4fd;
  color: #409eff;
}

/* 人员信息布局 */
.person-info {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.info-row p {
  color: #666;
  font-size: 12px;
  flex: 1;
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 能力信息布局 */
.abilities {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
}

.ability-row {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}

.ability-item {
  flex: 1;
  font-size: 12px;
  color: #555;
}

.empty提示 {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
  background-color: white;
  border-radius: 8px;
}

.person-list::-webkit-scrollbar {
  width: 6px;
}

.person-list::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

/* 新增：人员详细信息面板样式 */
.person-detail-panel {
  position: absolute;
  top: 0;
  left: 320px;
  width: 400px; /* 加宽面板（原300px → 400px） */
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.15);
  z-index: 2;
  padding: 20px;
  overflow-y: auto;
}

.person-detail-panel h3 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.detail-section {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #eee;
}


.detail-section h4 {
  color: #409eff;
  margin-bottom: 12px; /* 增加标题与内容的间距 */
  font-size: 14px;
  padding-bottom: 5px;
  border-bottom: 1px solid #f0f0f0; /* 增加小标题下划线 */
}

.detail-content p {
  color: #555;
  font-size: 13px;
  margin-bottom: 0; /* 移除默认底部间距，通过grid-gap控制间距 */
  line-height: 1.5;
  white-space: nowrap; /* 防止文字换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 超长文本显示省略号 */
}

.empty-detail {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 平均分成两列 */
  gap: 10px 0; /* 行间距10px，列间距20px */
}
</style>
