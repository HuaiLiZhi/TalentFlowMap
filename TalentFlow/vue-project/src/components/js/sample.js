export default function initializeMap() {
    // 加载高德地图和Loca库
    const loadScript = (url) => {
        return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = url
            script.type = 'text/javascript'
            script.onload = resolve
            document.body.appendChild(script)
        })
    }

    // 先加载高德地图主库
    loadScript('https://webapi.amap.com/maps?v=2.0&key=304e8147b61d6b38035924f4cd41237e')
        .then(() => {
            // 再加载Loca库
            return loadScript('https://webapi.amap.com/loca?v=2.0.0&key=304e8147b61d6b38035924f4cd41237e')
        })
        .then(() => {
            // 初始化地图
            const map = new AMap.Map('map', {
                zoom: 3.2,
                pitch: 32,
                showLabel: false,
                viewMode: '3D',
                center: [59.890102, 29.256014],
                mapStyle: 'amap://styles/45311ae996a8bea0da10ad5151f72979',
            })

            // 文字图层
            const labelLayer = new AMap.LabelsLayer({
                rejectMapMask: true,
                collision: true,
                animation: true,
            })
            map.add(labelLayer)

            const loca = new Loca.Container({
                map,
            })

            const linkLayer = new Loca.LinkLayer({
                zIndex: 20,
                opacity: 1,
                visible: true,
                zooms: [2, 22],
            })

            const scatterLayer1 = new Loca.ScatterLayer({
                zIndex: 10,
                opacity: 1,
                visible: true,
                zooms: [2, 22],
            })
            const scatterLayer2 = new Loca.ScatterLayer({
                zIndex: 10,
                opacity: 0.8,
                visible: true,
                zooms: [2, 22],
            })
            const scatterLayer3 = new Loca.ScatterLayer({
                zIndex: 10,
                opacity: 0.8,
                visible: true,
                zooms: [2, 22],
            })

            // 中国中心点
            const centerPoint = new Loca.GeoJSONSource({
                data: {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [116.39, 39.9],
                            },
                        },
                    ],
                },
            })
            scatterLayer3.setSource(centerPoint)
            scatterLayer3.setStyle({
                size: [300000, 300000],
                unit: 'meter',
                texture: 'https://a.amap.com/Loca/static/static/center-point.png',
            })
            loca.add(scatterLayer3)

            let lineGeoMap
            let scatterGeoMap

            // 过滤GeoJSON数据
            const filterGeoJSON = (json, type) => {
                const newJSON = {
                    type: 'FeatureCollection',
                    features: [...json.features.filter((item) => item.properties.type === type)],
                }
                return new Loca.GeoJSONSource({
                    data: newJSON,
                })
            }

            // 设置标签图层
            const setLabelsLayer = (data) => {
                labelLayer.clear()
                data.features.forEach((item) => {
                    const labelsMarker = new AMap.LabelMarker({
                        name: item.properties.flagName,
                        position: item.geometry.coordinates,
                        zooms: [2, 22],
                        opacity: 1,
                        zIndex: 10,
                        text: {
                            content: item.properties.country,
                            direction: 'bottom',
                            offset: [0, -5],
                            style: {
                                fontSize: 13,
                                fontWeight: 'normal',
                                fillColor: '#fff',
                            },
                        },
                    })
                    labelLayer.add(labelsMarker)
                })
                labelLayer.add(
                    new AMap.LabelMarker({
                        name: 'china',
                        position: [116.39, 39.9],
                        zooms: [2, 22],
                        opacity: 1,
                        zIndex: 10,
                        rank: 100,
                        text: {
                            content: '中国',
                            direction: 'bottom',
                            offset: [0, -5],
                            style: {
                                fontSize: 13,
                                fontWeight: 'normal',
                                fillColor: '#fff',
                            },
                        },
                    })
                )
            }

            // 获取点数据
            fetch('https://a.amap.com/Loca/static/static/diplomacy-point.json')
                .then((res) => res.json())
                .then((data) => {
                    scatterGeoMap = data
                    setLabelsLayer(scatterGeoMap[50])
                    const source1 = filterGeoJSON(scatterGeoMap[50], 0)
                    const source2 = filterGeoJSON(scatterGeoMap[50], 1)
                    scatterLayer1.setSource(source1)
                    scatterLayer2.setSource(source2)
                    scatterLayer1.setStyle({
                        size: [500000, 500000],
                        unit: 'miter',
                        animate: true,
                        duration: 1000,
                        texture: 'https://a.amap.com/Loca/static/static/green.png',
                    })
                    scatterLayer2.setStyle({
                        size: [500000, 500000],
                        unit: 'miter',
                        animate: true,
                        duration: 1000,
                        texture: 'https://a.amap.com/Loca/static/static/orange.png',
                    })
                    loca.add(scatterLayer1)
                    loca.add(scatterLayer2)
                    loca.animate.start()
                })

            // 获取线数据
            fetch('https://a.amap.com/Loca/static/static/diplomacy-line.json')
                .then((res) => res.json())
                .then((data) => {
                    lineGeoMap = Object.entries(data).reduce((accu, curr) => {
                        const [key, geo] = curr
                        accu[key] = new Loca.GeoJSONSource({
                            data: geo,
                        })
                        return accu
                    }, {})
                    linkLayer.setSource(lineGeoMap[50])
                    linkLayer.setStyle({
                        lineColors: function (index, item) {
                            return item.link.properties.type === 0 ? ['#25CDEA', '#12BFBF'] : ['#FFD87B', '#FF4F00']
                        },
                        height: function (index, item) {
                            return item.distance / 3
                        },
                        smoothSteps: function (index, item) {
                            return 200
                        },
                    })
                    loca.add(linkLayer)
                })

            // 时间轴点击事件
            const items = document.querySelectorAll('.item')
            for (let i = 0; i < items.length; i++) {
                ;(function (j) {
                    items[j].onclick = () => {
                        const element = items[j]
                        const key = element.children[0].dataset.year
                        document.querySelector('div.item.active').classList.remove('active')
                        element.classList.add('active')
                        linkLayer.setSource(lineGeoMap[key])
                        setLabelsLayer(scatterGeoMap[key])
                        scatterLayer1.setSource(filterGeoJSON(scatterGeoMap[key], 0))
                        scatterLayer2.setSource(filterGeoJSON(scatterGeoMap[key], 1))
                    }
                })(i)
            }
        })
}