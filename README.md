# 陕西省地理人文 3D 互动沙盘 (Shaanxi Geography & Humanities Sandbox)

基于 Vue 3 和 Three.js 的地理互动沙盘。首页提供“秦岭南北”导览和自由探索。导览从找到西安与汉中开始，接着标记山脊、生成地形剖面，最后判断渭河和汉江的水系归属。

## 运行和验证

    npm ci
    npm run dev
    npm run build
    npm run preview
    node --test test/geography.test.js

运行时需要 Node.js 20.19+ 或 22.12+。Vite 使用相对路径构建，生产目录为 dist，可在静态 HTTP 服务的子路径下预览。

## 画面与控制

- 桌面左侧可收起章节栏，右侧工具提供图层、外观、剖面、点位查询与重置正北。手机竖屏可点按或滑动章节抽屉的把手，依次打开简介、任务和全文。
- 点击“测量”后依次标记起点和终点，拖动剖面游标会同时标出地形取样点。键盘用户可聚焦画布，按方向键平移，按 Enter 在视野中心落点。
- 图层随主题和导览站点调整。在“图层与外观”中选择高程或坡度时，使用白昼和自然季节。夜景、雪景与云海可以在自由探索中选择。
- 读图文字与语音解说独立。浏览器缺少可用语音时可读正文。系统启用“减少动态效果”时，镜头直接定位到关键视角。

## 数据口径与素材

| 对象 | 口径与来源 |
| --- | --- |
| 全省地形 | Z8 的 6 × 8 幅瓦片。原始影像脚本使用 Esri World Imagery，高程脚本使用 AWS Terrarium。栅格是 1536 × 2048 像素，在北纬 34° 每像素约 0.5 km。 |
| 高程和距离 | 150–3800 m 线性编码，灰度量化步长约 14.3 m。透明像素表示缺测，界面高程取近似值。剖面横轴为投影直线取样的累计水平距离。 |
| 行政区和地标 | 使用项目内的 DataV 市级 GeoJSON。点位查询、地标和测线共用 terrainExtent.json 定义的 Web Mercator 拼接范围。 |
| 秦岭水系 | 渭河归黄河水系，汉江归长江水系。参考《陕西省秦岭污染防治专项规划》2.1.3 节。河道与秦岭主脊使用概略线用于课堂比较。 |
| 局部盆景 | Z12 的 3 × 3 幅瓦片。界面显示近似水平跨度和相对于水平比例的垂直夸张倍数。 |
| 章节配图 | 图注与文件关联见 src/data/chapterMedia.json。当前图片沿用项目素材，来源条目缺失时界面标注原始文件页待核对。 |

地形预览、影像贴图和遮罩可用 python scripts/build_terrain_previews.py 从现有资产生成，需要 NumPy 和 Pillow。摄影和图解脚本将新素材写入独立的候选目录，审核后可更新图注和图片清单。

数据参考链接见 [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)、[AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) 和 [陕西省秦岭污染防治专项规划](https://sthjt.shaanxi.gov.cn/xxgk/fdnr/zcgh/202105/P020250227647255162702.pdf)。

## 代码入口

| 文件 | 职责 |
| --- | --- |
| src/App.vue | 应用模式、导览步骤、互斥工具和章节镜头请求 |
| src/components/ThreeCanvas.vue | 跟随界面可视区更新镜头，绘制地形、图层和标记 |
| src/utils/geography.js | 瓦片坐标正反变换、栅格采样、水平距离和行政区查询 |
| src/utils/terrainSurface.js | 地形显示高度、环境着色和分析色带 |
| src/utils/terrainResources.js | 渐进加载、像素缓存和场景释放 |
| src/data/qinlingGuide.js | 秦岭南北导览和西安至汉中教学测线 |
| src/data/mapThemes.js | 章节、导览预设和图例 |
