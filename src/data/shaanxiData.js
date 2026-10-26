// 陕西省地理人文 3D 互动沙盘数据结构 (100% 真实 GIS 与 DEM 物理高度对齐)
const baseUrl = import.meta.env.BASE_URL || './';
const imgPrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

export const SHAANXI_STATS = {
  name: "陕西省",
  pinyin: "SHAANXI PROVINCE",
  area: "20.56 万平方千米",
  population: "3954 万人",
  dynasties: "14 个王朝定都",
  cities: "10 个地级市",
  description: "三秦大地，华夏文明重要发祥地。北依长城、横跨秦岭，纵贯黄河、长江两大流域，拥有陕北黄土高原、八百里秦川、陕南秦巴山地三大自然区。"
};

export const THEMES = [
  {
    id: "geo",
    title: "自然地理",
    enTitle: "NATURAL GEOGRAPHY",
    chapters: [
      {
        id: "geo_01",
        num: "01",
        title: "地形骨架",
        subTitle: "三段阶梯：陕北、关中、陕南",
        timeBadge: "三秦地形",
        highlight: "三大自然区纵贯南北",
        desc: "陕西地势由西向东、由南北向中部倾斜，南北跨度达870千米。全省自北向南自然分为三大地貌单元：北部陕北黄土高原、中部关中八百里秦川平原、南部陕南秦巴山地。宛如大自然的立体屏风。",
        camera: { pos: [0, 95, 125], target: [0, 5, 0], pitch: 35 },
        diagramTitle: "陕西省南北地质地貌阶梯剖面示意图",
        diagramType: "profile_shaanxi",
        photoUrl: imgPrefix + "images/chapters/geo_01_shaanxi.jpg",
        photoCaption: "三秦大地立体阶梯：黄土高原、关中平原与秦巴山地对峙"
      },
      {
        id: "geo_02",
        num: "02",
        title: "秦岭巍峨",
        subTitle: "华夏之父 · 南北气候分界线",
        timeBadge: "800mm 降水分界",
        highlight: "一山分南北，江河分两系",
        desc: "秦岭横亘中央，是中国地理南北分界线、长江黄河分水岭、亚热带与暖温带的自然屏障。主峰太白山拔仙台海拔3771米。云横秦岭，北阻寒风，南留湿润，造就了‘南稻北麦、南船北马’的生动地理奇观。",
        camera: { pos: [-4.84, 38, 48], target: [-4.84, 14, 22.75], pitch: 28 },
        diagramTitle: "秦岭阻挡冷暖气流垂直剖面模式图",
        diagramType: "profile_qinling",
        photoUrl: imgPrefix + "images/chapters/geo_02_qinling.jpg",
        photoCaption: "秦岭主峰太白山拔仙台（3771.2m）云海与第四纪冰川遗迹"
      },
      {
        id: "geo_03",
        num: "03",
        title: "八百里秦川",
        subTitle: "关中平原 · 天府之国最早所指",
        timeBadge: "沃野千里",
        highlight: "渭河滋润的天赋粮仓",
        desc: "关中盆地地处秦岭以北、北山以南，渭河横贯东西。沃野千里，土质疏松肥沃，自古有‘金城千里，天府之国’之称。周、秦、汉、唐等14个王朝在此建都，奠定了中华农耕文明的坚实基石。",
        camera: { pos: [3.97, 24, 32], target: [3.97, 2, 16], pitch: 22 },
        diagramTitle: "关中地堑断陷盆地与八水环绕图",
        diagramType: "profile_guanzhong",
        photoUrl: imgPrefix + "images/chapters/geo_03_guanzhong.jpg",
        photoCaption: "八百里秦川沃野千里与渭河冲积扇农业基石"
      },
      {
        id: "geo_04",
        num: "04",
        title: "陕北黄土高原",
        subTitle: "千沟万壑 · 风积黄土的沧桑史诗",
        timeBadge: "深厚黄土层 100-200m",
        highlight: "塬、梁、峁地貌与水土变迁",
        desc: "陕北黄土高原是全球黄土分布最集中、最深厚的区域。数百万年西伯利亚季风携沙尘在此堆积。黄土质地疏松，经流水数万年侵蚀，形成塬、梁、峁纵横交错的壮阔地貌，近年来退耕还林使绿色版图大幅北移。",
        camera: { pos: [8.71, 40, -5], target: [8.71, 5, -22], pitch: 28 },
        diagramTitle: "黄土塬梁峁侵蚀演变模式",
        diagramType: "profile_loess",
        photoUrl: imgPrefix + "images/chapters/geo_04_loess.jpg",
        photoCaption: "陕北延安安塞黄土高原塬梁峁地貌与生态梯田绿意"
      },
      {
        id: "geo_05",
        num: "05",
        title: "陕南秦巴汉水",
        subTitle: "青山秀水 · 南水北调核心水源区",
        timeBadge: "南水北调中线",
        highlight: "一江清水送北方",
        desc: "秦岭以南、大巴山以北为陕南地区。汉江、丹江发源于此，两岸青山如黛，气候湿润多雨，属于典型的长江水系。这里承担着南水北调中线工程超70%的水源涵养重任，堪称华夏水塔与生态宝库。",
        camera: { pos: [2.0, 30, 62], target: [2.0, 2, 38], pitch: 28 },
        diagramTitle: "汉江水系与丹江口水库上游生态走廊",
        diagramType: "profile_hanjiang",
        photoUrl: imgPrefix + "images/chapters/geo_05_hanjiang.jpg",
        photoCaption: "陕南汉江上游安康瀛湖碧水青山生态长廊"
      },
      {
        id: "geo_06",
        num: "06",
        title: "八水绕长安",
        subTitle: "泾渭分明 · 古代关中水利奇迹",
        timeBadge: "八水相映",
        highlight: "渭、泾、沣、涝、潏、滈、浐、灞",
        desc: "司马相如《上林赋》写道‘荡荡乎八川分流，相背而异态’。渭、泾、沣、涝、潏、滈、浐、灞八水滋养了长安城。秦汉开凿郑国渠、白渠，以浑水灌溉改良碱地，造就了天下第一粮仓。",
        camera: { pos: [6.34, 18, 25], target: [6.34, 2, 16], pitch: 20 },
        diagramTitle: "古代长安八水水系与引渠复原示意",
        diagramType: "profile_rivers",
        photoUrl: imgPrefix + "images/chapters/geo_06_rivers.jpg",
        photoCaption: "高陵泾河渭河交汇处清浊分明的自然奇景"
      }
    ]
  },
  {
    id: "history",
    title: "历史人文",
    enTitle: "HISTORY & HUMANITIES",
    chapters: [
      {
        id: "his_01",
        num: "01",
        title: "华夏发祥之根",
        subTitle: "蓝田古人类至仰韶半坡",
        timeBadge: "163万年前 - 6000年前",
        highlight: "文明晨曦在关中破晓",
        desc: "蓝田直立人化石记录了早期人类活动。临潼半坡仰韶文化遗址见证了新石器时代彩陶与聚落文明；黄陵县桥山之上，轩辕黄帝陵寝千秋肃穆，被誉为中华第一陵，凝聚着海内外中华儿女的精神纽带。",
        camera: { pos: [11.5, 26, 0], target: [11.5, 3, -15], pitch: 24 },
        photoUrl: imgPrefix + "images/chapters/his_01_huangdi.jpg",
        photoCaption: "黄陵桥山黄帝陵古柏群与仰韶半坡人面鱼纹彩陶"
      },
      {
        id: "his_02",
        num: "02",
        title: "西周礼乐 · 丰镐定鼎",
        subTitle: "封邦建国与青铜器之乡",
        timeBadge: "公元前1046年",
        highlight: "礼乐文明从宝鸡周原奠基",
        desc: "周人起于岐山周原，武王伐纣后定都丰镐（今西安西南）。周公制礼作乐，奠定了中国三千年儒家文明与宗法制度之源。宝鸡被誉为青铜器之乡，大盂鼎、毛公鼎铭刻着厚重国史。",
        camera: { pos: [-10.78, 20, 25], target: [-10.78, 2, 16.67], pitch: 20 },
        photoUrl: imgPrefix + "images/chapters/his_02_zhouyuan.jpg",
        photoCaption: "宝鸡周原遗址青铜器何尊‘宅兹中国’铭文"
      },
      {
        id: "his_03",
        num: "03",
        title: "大秦帝国 · 天下一统",
        subTitle: "咸阳宫阙与地下秦俑军阵",
        timeBadge: "公元前221年",
        highlight: "书同文，车同轨，统一度量衡",
        desc: "秦孝公用商鞅变法，奋六世之余烈。始皇帝横扫六合，建立中国第一个大一统中央集权王朝。骊山脚下的秦始皇陵与兵马俑坑，以规模浩大的地下陶俑军阵，展现了横扫八荒的无匹雄风。",
        camera: { pos: [12.0, 18, 23], target: [9.46, 2, 16.34], pitch: 18 },
        photoUrl: imgPrefix + "images/chapters/his_03_bingmayong.jpg",
        photoCaption: "临潼秦始皇兵马俑一号坑威武地下陶俑军阵"
      },
      {
        id: "his_04",
        num: "04",
        title: "盛唐气象 · 万国衣冠",
        subTitle: "百万人口的世界第一大都会",
        timeBadge: "公元618 - 907年",
        highlight: "九天阊阖开宫殿，万国衣冠拜冕旒",
        desc: "唐都长安是当时全球最大的国际大都会，城垣规整，里坊棋布。大明宫含元殿居高临下，大雁塔慈恩寺梵音悠扬。丝路胡商云集西市，李白杜甫等无数诗人在此留下了千古绝唱。",
        camera: { pos: [6.24, 18, 24], target: [6.24, 2, 16.98], pitch: 18 },
        photoUrl: imgPrefix + "images/chapters/his_04_changan.jpg",
        photoCaption: "西安大慈恩寺大雁塔与大唐不夜城壮阔盛唐气象"
      }
    ]
  },
  {
    id: "silkroad",
    title: "丝路起点",
    enTitle: "SILK ROAD ORIGIN",
    chapters: [
      {
        id: "silk_01",
        num: "01",
        title: "凿空西域 · 张骞西行",
        subTitle: "建元二年从长安未央宫领命出发",
        timeBadge: "公元前138年",
        highlight: "十三年不辱使命的和平开拓",
        desc: "汉武帝招募张骞，率百余人出长安西行，联合大月氏夹攻匈奴。历经十三年艰难险阻，张骞‘凿空’通西域。随后汉朝在河西走廊设立四郡，开通了连接欧亚大陆的东西方陆上大通道。",
        camera: { pos: [0.0, 22, 26], target: [-6.0, 2, 16.0], pitch: 20 },
        photoUrl: imgPrefix + "images/chapters/silk_01_zhangqian.jpg",
        photoCaption: "莫高窟第323窟汉武帝送张骞出使西域壁画"
      },
      {
        id: "silk_02",
        num: "02",
        title: "长安西市 · 东方商都",
        subTitle: "丝绸之路商贸物资汇聚的总源头",
        timeBadge: "唐代国际商圈",
        highlight: "买卖全球，胡商云集西市开埠",
        desc: "唐长安西市被称为‘金市’，是丝绸之路的真正起点。来自波斯、粟特的大食商人带着琉璃、香料、葡萄酒在此交易，换回大唐名扬天下的丝绸、瓷器、茶叶与铁器，开启了人类早期全球化盛况。",
        camera: { pos: [6.24, 16, 22], target: [6.24, 2, 16.98], pitch: 16 },
        photoUrl: imgPrefix + "images/chapters/silk_02_xishi.jpg",
        photoCaption: "大唐西市遗址博物馆石板路车辙痕迹与丝路起点"
      }
    ]
  }
];

export const BONSAIS = [
  {
    id: "bonsai_huashan",
    title: "西岳华山天险切块",
    location: "渭南市华阴市 · 范围约 8 × 8 千米",
    elevation: "主峰南峰 2154.9 米",
    scaleRatio: "垂直高差放大 1.6 倍",
    desc: "奇险天下第一山。巨大的整块花岗岩断块拔地而起，四周绝壁万仞。此微观切块清晰还原花岗岩垂直节理、长空栈道险境与回心石绝壁。",
    elevationMarks: ["海拔 2154m (南峰落雁)", "海拔 1614m (北峰云台)", "海拔 400m (山麓谷底)"],
    colors: { top: "#78716c", side: "#44403c" }
  },
  {
    id: "bonsai_hukou",
    title: "黄河壶口瀑布切块",
    location: "延安市宜川县与山西吉县交界 · 范围约 4 × 4 千米",
    elevation: "黄河水面海拔 440 米",
    scaleRatio: "峡谷下切放大 2.0 倍",
    desc: "千里黄河一壶收。原本数百米宽的黄河河槽在此猛缩至几十米，倾泻入深槽，形成世界第一大黄色瀑布。模型展示十里龙槽河床下切与断裂带。",
    elevationMarks: ["河谷阶地 520m", "瀑布跌水 440m", "龙槽深潭 390m"],
    colors: { top: "#ca8a04", side: "#713f12" }
  },
  {
    id: "bonsai_taibai",
    title: "秦岭太白山拔仙台切块",
    location: "宝鸡市眉县/太白县 · 范围约 10 × 10 千米",
    elevation: "主峰拔仙台 3771.2 米",
    scaleRatio: "高差放大 1.4 倍",
    desc: "青藏高原以东第一高峰。六月积雪天，保存有极其典型的第四纪冰川遗迹：角峰、刃脊、冰斗及高山冰斗湖‘大爷海’，立体气候带分布完备。",
    elevationMarks: ["拔仙台 3771m", "大爷海冰斗湖 3590m", "落叶松林带 2800m"],
    colors: { top: "#3b82f6", side: "#1e3a8a" }
  }
];

export const EVOLUTION_STAGES = [
  {
    stage: 1,
    name: "深厚黄土堆积",
    period: "更新世（200万年前）",
    subText: "强劲季风卷起粉砂，在关中北缘高原面层层堆叠，形成厚达百米的平坦古地表。",
    meshState: "flat"
  },
  {
    stage: 2,
    name: "完整原始黄土塬",
    period: "全新世早期",
    subText: "黄土台地平坦开阔，周边冲沟尚浅，植被覆盖尚好，塬面犹如巨大的天然桌面。",
    meshState: "plateau"
  },
  {
    stage: 3,
    name: "暴雨细沟下切侵蚀",
    period: "历史时期早期",
    subText: "黄土土质垂直节理发育，夏季暴雨汇聚冲刷，塬边开始出现密集的‘V’形切入深沟。",
    meshState: "groove"
  },
  {
    stage: 4,
    name: "黄土梁形成",
    period: "沟谷拓宽期",
    subText: "沟谷两边不断坍塌拓宽，大面积平坦塬面被分割破坏，演变为长条脊状的‘黄土梁’。",
    meshState: "ridge"
  },
  {
    stage: 5,
    name: "黄土峁孤丘出现",
    period: "严重割裂期",
    subText: "横向沟谷进一步截断长梁，山梁破碎为一个个圆馒头状的孤立黄土丘陵——‘黄土峁’。",
    meshState: "hill"
  },
  {
    stage: 6,
    name: "千沟万壑严重流失",
    period: "近现代侵蚀巅峰",
    subText: "沟壑纵横、水土流失加剧，泥沙滚滚涌入黄河，形成著名的陕北千沟万壑风貌。",
    meshState: "canyon"
  },
  {
    stage: 7,
    name: "当代生态梯田治理",
    period: "当今退耕还林",
    subText: "打坝淤地、植树造林、修筑水平梯田，黄土高原主色调实现‘由黄变绿’的生态奇迹。",
    meshState: "green"
  }
];

// 真实 GIS 投影坐标对齐的 POI 列表 (与 3D 光柱及卫星影像 100% 重合)
export const POI_LIST = [
  { id: "xian", name: "西安 (长安)", type: "capital", pos: [6.24, 1.32, 16.98], badge: "十三朝古都 · 丝路起点" },
  { id: "huashan", name: "西岳华山", type: "mountain", pos: [17.1, 6.67, 14.77], badge: "天下奇险第一山 (2154m)" },
  { id: "taibai", name: "太白山拔仙台", type: "mountain", pos: [-4.84, 17.33, 22.75], badge: "秦岭主峰 (3771.2m)" },
  { id: "bingmayong", name: "秦始皇陵兵马俑", type: "relic", pos: [9.46, 1.81, 16.34], badge: "世界第八大奇迹" },
  { id: "hukou", name: "黄河壶口瀑布", type: "nature", pos: [20.57, 1.94, -10.53], badge: "千里黄河一壶收" },
  { id: "yanan", name: "延安宝塔山", type: "red", pos: [11.46, 4.2, -17.31], badge: "革命圣地 · 延河水" },
  { id: "yulin", name: "榆林古城镇北台", type: "city", pos: [13.78, 4.82, -44.8], badge: "塞上驼城 · 万里长城第一台" },
  { id: "baoji", name: "宝鸡青铜器之乡", type: "city", pos: [-10.78, 2.26, 16.67], badge: "炎帝故里 · 陈仓要塞" },
  { id: "hanzhong", name: "汉中拜将坛", type: "city", pos: [-11.93, 1.94, 36.04], badge: "汉家发祥地 · 天府之国" },
  { id: "ankang", name: "安康瀛湖", type: "city", pos: [7.09, 0.85, 41.71], badge: "秦巴明珠 · 汉江秀水" }
];

export const CAMPAIGNS = [
  {
    id: "camp_chencang",
    title: "楚汉相争 · 明修栈道 暗度陈仓",
    period: "公元前206年 · 楚汉战争奠基之役",
    belligerents: "汉军（刘邦、韩信）VS 雍王章邯（秦降将）",
    strategicOutcome: "一举平定三秦，大汉由此奠定一统天下基业",
    overview: "汉高祖刘邦困守汉中，大将韩信祭出军事史上最经典声东击西之策：明修褒斜栈道以惑敌主力，暗由陈仓故道出大散关奇袭宝鸡陈仓，席卷八百里秦川。",
    camera: { pos: [-10.73, 26, 26], target: [-10.73, 2.21, 16.7], pitch: 30 },
    stages: [
      {
        step: 1,
        title: "第一阶段：栈道佯动 · 疑兵诱敌",
        desc: "韩信派樊哙率偏师大张旗鼓抢修被刘邦入汉中时烧毁的褒斜道险峻栈道。章邯闻讯，判断汉军需数月修路，将主力重心移至眉县、郿坞以东防备。",
        highlight: "褒斜道栈道佯动，牵制雍军主力",
        routeColor: "#f59e0b",
        routes: [
          [ [-11.96, 1.89, 36.15], [-7.88, 8.6, 27.36], [-5.04, 2.34, 19.11] ]
        ],
        checkpoints: [
          { name: "汉中南郑 (拜将坛)", pos: [-11.96, 1.89, 36.15], role: "汉军大本营" },
          { name: "褒斜谷口", pos: [-5.04, 2.34, 19.11], role: "佯修栈道诱敌" }
        ]
      },
      {
        step: 2,
        title: "第二阶段：奇出故道 · 飞越大散关",
        desc: "与此同时，韩信亲率汉军精锐主力，沿废弃已久的陈仓古道秘密穿插，星夜兼程翻越秦岭天险大散关，如天降神兵直扑陈仓（今宝鸡）。",
        highlight: "暗出险僻陈仓古道，神速飞越大散关",
        routeColor: "#ef4444",
        routes: [
          [ [-11.96, 1.89, 36.15], [-14.99, 7.42, 28.86], [-15.47, 6.05, 19.87], [-12.62, 6.19, 18.36], [-10.73, 2.21, 16.7] ]
        ],
        checkpoints: [
          { name: "大散关 (川陕咽喉)", pos: [-12.62, 6.19, 18.36], role: "天险奇袭突防" },
          { name: "陈仓重镇 (宝鸡)", pos: [-10.73, 2.21, 16.7], role: "决战突袭目标" }
        ]
      },
      {
        step: 3,
        title: "第三阶段：奇袭陈仓 · 席卷八百里秦川",
        desc: "汉军猝然攻破陈仓，截断雍军退路。章邯仓皇率部驰援迎战，两军激战于陈仓城下，章邯大败退守废丘。汉军分兵席卷塞王司马欣、翟王董翳，两月内平定关中三秦。",
        highlight: "章邯兵败废丘，汉王刘邦一统关中",
        routeColor: "#38bdf8",
        routes: [
          [ [-10.73, 2.21, 16.7], [-2.19, 1.95, 17.61], [3.97, 1.33, 17.31], [8.71, 1.33, 16.1] ]
        ],
        checkpoints: [
          { name: "废丘 (章邯绝境之地)", pos: [3.97, 1.33, 17.31], role: "决胜终局" },
          { name: "咸阳·关中全境", pos: [6.24, 1.32, 16.98], role: "平定三秦" }
        ]
      }
    ]
  },
  {
    id: "camp_wuzhangyuan",
    title: "三国演义 · 诸葛亮北伐与五丈原对峙",
    period: "公元234年 · 蜀魏秦岭争锋巅峰",
    belligerents: "蜀汉丞相诸葛亮 VS 曹魏太尉司马懿",
    strategicOutcome: "秋风五丈原，死诸葛吓走活仲达，蜀军全师而退",
    overview: "诸葛亮率蜀军最后一次大举北伐，自汉中出斜谷，屯兵渭水南岸五丈原高原，分兵与民屯田。司马懿坚守不出，双方在秦岭北麓与渭水沿岸拉锯对峙百余日。",
    camera: { pos: [-4.75, 20, 24], target: [-4.75, 1.76, 17.91], pitch: 26 },
    stages: [
      {
        step: 1,
        title: "第一阶段：出斜谷 · 扎营五丈原",
        desc: "诸葛亮率大军出斜谷，占据高出渭河平原百余米的五丈原台地，居高临下，扼守关中入川孔道，分兵屯田以作持久计。",
        highlight: "十万蜀汉精锐进驻五丈原",
        routeColor: "#10b981",
        routes: [
          [ [-11.96, 1.89, 36.15], [-6.46, 8.52, 25.12], [-4.75, 1.76, 17.91] ]
        ],
        checkpoints: [
          { name: "五丈原大营", pos: [-4.75, 1.76, 17.91], role: "诸葛亮统帅中枢" },
          { name: "斜谷道北口", pos: [-6.46, 8.52, 25.12], role: "蜀汉粮道生命线" }
        ]
      },
      {
        step: 2,
        title: "第二阶段：隔渭河对峙 · 坚壁拒战",
        desc: "司马懿进驻渭水北岸筑垒，背依北原。诸葛亮多次挑战、送巾帼妇人服以激之，司马懿深知其弱点在粮尽，忍辱不应，死守不出。",
        highlight: "两军隔渭水列阵，坚壁拒战",
        routeColor: "#3b82f6",
        routes: [
          [ [-5.99, 1.89, 17.31], [-3.14, 2.01, 17.31] ]
        ],
        checkpoints: [
          { name: "曹魏北原大营", pos: [-3.14, 2.01, 17.31], role: "司马懿指挥部" },
          { name: "渭河对峙前线", pos: [-5.99, 1.89, 17.31], role: "两军对垒阵地" }
        ]
      },
      {
        step: 3,
        title: "第三阶段：星陨五丈原 · 秘退全师",
        desc: "八月，诸葛亮积劳成疾逝于五丈原军中。杨仪、姜维密不发丧，整军徐退。司马懿引军追击，见蜀军战鼓齐鸣、木雕诸葛现身，疑有伏兵仓皇退走。",
        highlight: "死诸葛走生仲达，蜀军从容退回汉中",
        routeColor: "#8b5cf6",
        routes: [
          [ [-4.75, 1.76, 17.91], [-6.46, 8.52, 25.12], [-11.96, 1.89, 36.15] ]
        ],
        checkpoints: [
          { name: "诸葛亮落星台", pos: [-4.75, 1.76, 17.91], role: "鞠躬尽瘁之地" }
        ]
      }
    ]
  },
  {
    id: "camp_yanan",
    title: "解放战争 · 延安保卫战与转战陕北",
    period: "1947年 · 西北战场伟大转折",
    belligerents: "西北野战军（彭德怀、习仲勋）VS 国民党胡宗南部",
    strategicOutcome: "两万对二十三万，以少胜多，三战三捷扭转西北战局",
    overview: "胡宗南调集23万兵力进犯延安。中枢主动撤离延安拖住胡宗南主力，彭德怀指挥两万余兵力运用‘蘑菇战术’，在陕北千沟万壑中三战三捷，歼灭敌精锐近七万人。",
    camera: { pos: [11.46, 26, -5], target: [11.46, 4.2, -17.31], pitch: 30 },
    stages: [
      {
        step: 1,
        title: "第一阶段：主动撤离 · 诱敌深入",
        desc: "党中央与西北野战军主动撤出延安空城，胡宗南进占后成为沉重包袱。彭德怀利用陕北黄土千沟万壑隐蔽兵力，诱敌北上疲惫其心智。",
        highlight: "存人失地，人地皆存",
        routeColor: "#f43f5e",
        routes: [
          [ [11.37, 4.29, -17.22], [12.98, 4.29, -19.86] ]
        ],
        checkpoints: [
          { name: "延安宝塔山", pos: [11.37, 4.29, -17.22], role: "主动撤退起点" },
          { name: "青化砭预设伏击点", pos: [12.98, 4.29, -19.86], role: "伏击圈核心" }
        ]
      },
      {
        step: 2,
        title: "第二阶段：青化砭羊马河 · 三战三捷",
        desc: "1947年3月青化砭战役，仅用1小时40分全歼敌三十一旅；4月羊马河战役再歼第一三五旅；5月奇袭蟠龙镇攻破胡宗南最大军需补给基地，缴获面粉万袋、军服四万套！",
        highlight: "蘑菇战术在黄土沟壑展现神威",
        routeColor: "#ec4899",
        routes: [
          [ [12.98, 4.29, -19.86], [14.4, 4.7, -18.31], [14.87, 4.91, -21.41] ]
        ],
        checkpoints: [
          { name: "青化砭战场", pos: [12.98, 4.29, -19.86], role: "全歼三十一旅" },
          { name: "蟠龙大本营", pos: [14.87, 4.91, -21.41], role: "夺取敌后方补给基地" }
        ]
      },
      {
        step: 3,
        title: "第三阶段：沙家店战役 · 彻底扭转乾坤",
        desc: "8月沙家店战役，西北野战军全歼胡宗南三大主力之一整编三十六师，毛泽东赞誉‘沙家店这一仗，不仅扭转了西北战局，而且标志着全国战略反攻的开始’。",
        highlight: "沙家店大捷，西北战场转入战略反攻",
        routeColor: "#10b981",
        routes: [
          [ [14.87, 4.91, -21.41], [17.72, 4.29, -30.78] ]
        ],
        checkpoints: [
          { name: "沙家店", pos: [17.72, 4.29, -30.78], role: "战略决战转折点" }
        ]
      }
    ]
  }
];
