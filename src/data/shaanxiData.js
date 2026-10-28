// 陕西省地理人文 3D 互动沙盘数据结构 (100% 真实 GIS 与 DEM 物理高度对齐)
const baseUrl = import.meta.env.BASE_URL || './';
const imgPrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
export const BRAND_LOGO_BADGE = imgPrefix + 'images/brand/eugene_logo_badge.png';
export const BRAND_LOGO_WHITE = imgPrefix + 'images/brand/eugene_logo_white.png';

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


// ==========================================
// 1. 🎬 电影级自动巡航导览航线（航拍三秦）
// ==========================================
export const CINEMATIC_WAYPOINTS = [
  {
    id: "tour_01",
    title: "第一站 · 黄河壶口瀑布",
    location: "陕晋大峡谷 · 宜川",
    elevation: "海拔 448m",
    poetry: "君不见黄河之水天上来，奔流到海不复回。",
    narration: "欢迎启程三秦漫游。第一站来到秦晋大峡谷的壶口瀑布。黄河奔腾至此，河床由数百米猛收至四五十米，如巨壶注水，浊浪滔天，这是华夏民族自强不息的母亲河象征。",
    camera: { pos: [26, 18, -2], target: [24.5, 2.8, -4.2], duration: 4.5 },
    ambient: "waterfall"
  },
  {
    id: "tour_02",
    title: "第二站 · 延安宝塔山",
    location: "陕北黄土高原丘陵沟壑区",
    elevation: "海拔 1135m",
    poetry: "几回回梦里回延安，双手搂定宝塔山。",
    narration: "镜头向西升入陕北高原。黄土层深厚达两百米，在流水千万年的冲刷下，撕裂出塬、梁、峁的壮阔褶皱。延安宝塔山巍巍伫立，见证了中国革命从困境走向胜利的伟大转折。",
    camera: { pos: [3.2, 28, -6], target: [3.2, 5.0, -18.5], duration: 4.5 },
    ambient: "wind"
  },
  {
    id: "tour_03",
    title: "第三站 · 八百里秦川沃野",
    location: "关中地堑断陷盆地 · 渭河两岸",
    elevation: "海拔 410m",
    poetry: "秦中自古帝王州，八百里秦川尽朝晖。",
    narration: "镜头南下飞越北山，俯瞰八百里秦川。关中盆地土层松软肥沃，八水润泽。从周原青铜器、大秦兵马俑到大唐长安大雁塔，十四朝古都的厚重历史在此沉淀。",
    camera: { pos: [8, 22, 20], target: [0.5, 2.8, 13.2], duration: 4.5 },
    ambient: "chime"
  },
  {
    id: "tour_04",
    title: "第四站 · 西岳华山万仞绝壁",
    location: "关中东大门 · 华阴",
    elevation: "海拔 2154m",
    poetry: "势飞向天，削成万仞；巨灵擘两山，一石开天堑。",
    narration: "顺着渭河向东眺望，西岳华山拔地千仞，整座山峰由中生代燕山期坚硬花岗岩整体隆升而成。刀削斧劈的千尺幢、长空栈道，铸就了中华民族傲骨峥嵘的骨气。",
    camera: { pos: [22, 18, 15], target: [18.5, 9.8, 11.5], duration: 4.5 },
    ambient: "mountain"
  },
  {
    id: "tour_05",
    title: "第五站 · 秦岭之巅太白拔仙台",
    location: "中国中央水塔 · 南北地理分界",
    elevation: "海拔 3771.2m",
    poetry: "西上太白峰，夕阳穷登攀。太白与我语，为我开天关。",
    narration: "向西南攀升至中国地理屋脊——秦岭主峰太白山。拔仙台冰川遗迹冰斗湖如璀璨明珠。秦岭横亘中央，一山分南北，江河分两系，阻挡了北方寒流，锁住了南方湿润。",
    camera: { pos: [-3, 26, 26], target: [-3, 16.8, 16.0], duration: 5.0 },
    ambient: "breeze"
  },
  {
    id: "tour_06",
    title: "第六站 · 陕南天府汉中盆地",
    location: "秦巴山地 · 汉江上游",
    elevation: "海拔 510m",
    poetry: "何处寻仙境，汉上水云乡；两山夹一水，朱鹮振翅飞。",
    narration: "翻过秦岭南麓，气候豁然开朗，来到宛如江南水乡的汉中盆地。汉江奔流东去滋养汉室刘邦基业，朱鹮与大熊猫在此生息繁衍。这是三秦大地生态最秀美的江南天府。",
    camera: { pos: [-14.5, 22, 42], target: [-14.5, 3.2, 33.2], duration: 4.5 },
    ambient: "river"
  }
];

// ==========================================
// 2. 🍜 人文风物图层（非遗 / 美食 / 方言地标）
// ==========================================
export const CULTURAL_ITEMS = [
  {
    id: "cul_01",
    name: "陕北说书 & 信天游",
    region: "陕北高原",
    category: "非遗曲艺",
    icon: "🎭",
    pos: [11.37, 4.29, -17.22],
    badge: "国家级非遗 · 黄土放歌",
    desc: "一把三弦、甩板击节，在黄土高坡的沟梁之间，陕北说书吼出了黄土地人的苍凉悲壮与乐观豁达；信天游更是漫山遍野即兴创作的生命交响曲。",
    tags: ["国家级非遗", "黄土地交响", "陕北风情"]
  },
  {
    id: "cul_02",
    name: "陕北羊肉与荞麦饸饹",
    region: "陕北高原",
    category: "地理风味",
    icon: "🍲",
    pos: [17.72, 4.29, -30.78],
    badge: "塞上风味 · 地理标志",
    desc: "陕北高原高寒少雨，耐瘠薄的杂粮荞麦在此繁衍，地椒草饲育的横山白绒山羊肉质鲜嫩无膻味，二者搭配成就了御寒暖胃的边塞风味。",
    tags: ["横山羊肉", "定边荞麦", "御寒暖味"]
  },
  {
    id: "cul_03",
    name: "安塞腰鼓",
    region: "陕北高原",
    category: "民间舞蹈",
    icon: "🥁",
    pos: [8.5, 4.5, -22.0],
    badge: "天下第一鼓 · 磅礴狂澜",
    desc: "‘一群茂腾腾的后生，沉重而又极具爆发力’。安塞腰鼓源自古代边防驻军的传递信号与战舞，狂放热烈，展现了黄土高原不可遏止的生命元气。",
    tags: ["非物质文化遗产", "生命之力", "黄土民俗"]
  },
  {
    id: "cul_04",
    name: "陕西碳水之冠 · 羊肉泡馍 & biangbiang面",
    region: "关中平原",
    category: "饮食文化",
    icon: "🍜",
    pos: [0.5, 2.8, 13.2],
    badge: "千年关中味道 · 碳水盛宴",
    desc: "关中冬麦沃野千里，诞生了登峰造极的面食文化。‘料重味醇、肉烂汤浓’的牛羊肉泡馍，与宽如裤带的油泼biangbiang面，烙印着秦人豪爽质朴的性格。",
    tags: ["面食之都", "老字号泡馍", "关中八大怪"]
  },
  {
    id: "cul_05",
    name: "秦腔 & 华阴老腔",
    region: "关中平原",
    category: "古老戏曲",
    icon: "🎭",
    pos: [18.5, 9.8, 11.5],
    badge: "中国最古老的摇滚 · 吼动秦川",
    desc: "秦腔起于秦汉，华阴老腔更以大枣木块击凳为拍，如黄河咆哮般气吞山河，是中国传统戏剧的活化石，被誉为黄土地上的原生古老摇滚。",
    tags: ["华阴老腔", "秦腔鼻祖", "中国古老摇滚"]
  },
  {
    id: "cul_06",
    name: "凤翔泥塑 & 西安唐三彩",
    region: "关中平原",
    category: "民间美术",
    icon: "🏺",
    pos: [-14.5, 3.5, 9.8],
    badge: "陶泥神韵 · 周秦汉唐意象",
    desc: "汲取关中黏土，凤翔泥塑色彩斑斓、大红大绿纳吉避邪；唐三彩更以黄绿褐多色釉料再现盛唐丝路驼队、胡人乐舞的雍容风范。",
    tags: ["凤翔泥塑", "唐三彩", "丝路印记"]
  },
  {
    id: "cul_07",
    name: "汉中热米皮 & 菜豆腐",
    region: "陕南秦巴",
    category: "亚热带稻风",
    icon: "🥣",
    pos: [-14.5, 3.2, 33.2],
    badge: "稻香江南 · 巴蜀交融",
    desc: "汉中盆地地处秦岭南麓，气候温润盛产水稻。磨浆蒸制的热米皮软糯筋道，配以微酸清香的菜豆腐与油泼辣子，体现了南北交汇独特的稻作美食精髓。",
    tags: ["汉中米皮", "菜豆腐", "水乡稻作"]
  },
  {
    id: "cul_08",
    name: "紫阳富硒茶",
    region: "陕南秦巴",
    category: "生态名茶",
    icon: "🍵",
    pos: [-6.2, 3.8, 44.5],
    badge: "贡茶古源 · 汉水富硒仙茗",
    desc: "大巴山北麓汉江之滨，土壤天然富含微量元素硒。自唐代即为朝廷贡茶，高山云雾滋养，条索紧细，汤色碧翠，兼具秦之醇与楚之秀。",
    tags: ["天然富硒", "唐代贡茶", "秦巴绿金"]
  },
  {
    id: "cul_09",
    name: "汉调二簧",
    region: "陕南秦巴",
    category: "南派戏曲",
    icon: "🎭",
    pos: [-2.0, 3.0, 39.5],
    badge: "京剧声腔重要源头 · 汉江遗音",
    desc: "流传于安康、汉中一带的皮簧声腔，既融汇了北调的刚劲，又汲取了南腔的婉转，是徽汉合流孕育国粹京剧的关键源流之一。",
    tags: ["汉调二簧", "京剧之源", "汉江流域"]
  }
];

// ==========================================
// 3. ⚔️ 历史战役双路线兵棋推演对比
// ==========================================
export const WARGAME_COMPARISONS = {
  "camp_north": {
    title: "三国诸葛亮北伐：稳健祁山道 VS 奇险子午谷",
    context: "建兴六年（228年），诸葛亮首次北伐，面临进军关中的两条截然相反的战略抉择。",
    routes: [
      {
        id: "qishan",
        name: "诸葛亮所选 · 祁山出陇右",
        status: "历史实际路线",
        color: "#38bdf8",
        distanceKm: 480,
        elevationGainM: 1450,
        maxElevationM: 1980,
        averageSlope: 4.8,
        defendedPasses: 3,
        supplyLossRate: 38,
        tacticalVerdict: "稳健持重，以逸待劳。陇右地势平缓、粮草充沛且易于就地补给，利于大军团步步为营推进。",
        terrainAdvantage: "避开秦岭深处悬崖绝壁，可迂回切断魏军西凉战马补给线。"
      },
      {
        id: "ziwugu",
        name: "魏延所献 · 子午谷奇谋",
        status: "兵家争论千古方案",
        color: "#ef4444",
        distanceKm: 260,
        elevationGainM: 3200,
        maxElevationM: 2780,
        averageSlope: 18.6,
        defendedPasses: 7,
        supplyLossRate: 85,
        tacticalVerdict: "奇险莫测，置之死地。子午谷悬崖栈道不足数米宽，遇阴雨则人马俱陷。若长安守军坚守不降，魏军援兵截断谷口，全军将进退维谷。",
        terrainAdvantage: "直线距离极短，若夏侯楙弃城逃跑可实现十日内兵临长安城下的雷霆突袭。"
      }
    ],
    radarMetrics: [
      { label: "行军安全性", qishan: 90, ziwu: 25 },
      { label: "突袭突发性", qishan: 30, ziwu: 95 },
      { label: "粮道保全率", qishan: 75, ziwu: 15 },
      { label: "地形平缓度", qishan: 80, ziwu: 20 },
      { label: "容错空间度", qishan: 85, ziwu: 10 }
    ]
  },
  "camp_chencang": {
    title: "楚汉相争：暗度陈仓道 VS 明修褒斜道",
    context: "公元前206年，汉王刘邦拜韩信为大将，欲破秦岭天堑重返关中与项羽逐鹿中原。",
    routes: [
      {
        id: "chencang",
        name: "韩信奇兵 · 陈仓故道",
        status: "暗度奇谋制胜路线",
        color: "#10b981",
        distanceKm: 380,
        elevationGainM: 1650,
        maxElevationM: 2150,
        averageSlope: 6.2,
        defendedPasses: 2,
        supplyLossRate: 35,
        tacticalVerdict: "出其不意，迂回奇袭。借嘉陵江与故道之势避开已被烧毁的险峻主栈道，神兵天降直插章邯防守空虚的陈仓城。",
        terrainAdvantage: "沿故道河谷行军，水源充足且地势起伏较缓，适宜兵车步骑快速通过。"
      },
      {
        id: "baoxie",
        name: "正面佯动 · 褒斜栈道",
        status: "明修诱敌牵制线",
        color: "#f59e0b",
        distanceKm: 240,
        elevationGainM: 2850,
        maxElevationM: 2650,
        averageSlope: 15.4,
        defendedPasses: 6,
        supplyLossRate: 70,
        tacticalVerdict: "崇山峻岭，栈道万丈。章邯重兵在此严阵以待。正面强攻死伤必众，但佯修栈道极大麻痹了雍军主力对西线的警惕。",
        terrainAdvantage: "悬崖高耸，只需数百老弱疑兵大张声势即可牵制敌方主力兵团。"
      }
    ],
    radarMetrics: [
      { label: "战役隐蔽性", chencang: 95, baoxie: 20 },
      { label: "行军平坦度", chencang: 80, baoxie: 30 },
      { label: "攻其不备度", chencang: 92, baoxie: 15 },
      { label: "后勤补给率", chencang: 78, baoxie: 35 },
      { label: "战略欺骗性", chencang: 88, baoxie: 95 }
    ]
  }
};

// ==========================================
// 4. 🎯 “寻迹三秦”空间探秘挑战 5 关题库
// ==========================================
export const GEO_DETECTIVE_QUESTIONS = [
  {
    id: "q1",
    question: "【华夏原点】请在沙盘上点击指出全中国大地测绘基准的绝对坐标原点所在！",
    hint: "提示：位于关中平原腹地、西安以北的咸阳泾阳县永乐镇，北纬34°32'、东经108°55'附近。",
    targetName: "中华人民共和国大地原点",
    targetPos: [-1.2, 2.5, 11.2],
    toleranceKm: 18,
    explanation: "恭喜答对！泾阳地处我国领土几何中心圈，这里建有地下观测室与投影标志塔，全国所有测绘经纬度的统一起算基准就在这里！"
  },
  {
    id: "q2",
    question: "【千古军威】请在沙盘上定位被誉为世界第八大奇迹的大秦兵马俑一号坑！",
    hint: "提示：位于西安临潼骊山北麓、渭河南岸冲积阶地上。",
    targetName: "秦始皇兵马俑博物馆",
    targetPos: [3.6, 2.7, 12.8],
    toleranceKm: 15,
    explanation: "精准命中！1974年当地村民打井时发现了世界奇迹，地下军阵威仪万千，展现了两千多年前大秦虎狼之师吞并六国的宏大气魄！"
  },
  {
    id: "q3",
    question: "【中央水塔】请找出阻挡北下西伯利亚寒流与南方暖湿气流的秦岭最高峰！",
    hint: "提示：位于秦岭中部周至与太白交界处，山顶有拔仙台，六月仍有白雪遗存，海拔3771米。",
    targetName: "秦岭主峰太白山",
    targetPos: [-3.0, 16.8, 16.0],
    toleranceKm: 16,
    explanation: "太棒了！太白山不仅是中国南北地理分界线的极顶，更保存着第四纪古冰川遗迹冰斗湖，堪称中国地理与气候的天然分水岭。"
  },
  {
    id: "q4",
    question: "【九曲怒吼】请在沙盘上指出黄河两岸收窄如壶、千里奔腾跌落的著名水文奇观！",
    hint: "提示：位于陕西北部宜川县与山西吉县交界的黄河大峡谷中。",
    targetName: "黄河壶口瀑布",
    targetPos: [24.5, 2.8, -4.2],
    toleranceKm: 16,
    explanation: "完全正确！九曲黄河在壶口猛烈收缩，跌水四十米，声如奔雷，浊浪冲天，是世界上唯一的金色大瀑布！"
  },
  {
    id: "q5",
    question: "【汉室基石】请指出刘邦拜韩信为大将、明修栈道暗度陈仓的战略大后方盆地！",
    hint: "提示：位于秦岭以南、大巴山以北，汉江流经其间，两山夹一水。",
    targetName: "汉中天府盆地",
    targetPos: [-14.5, 3.2, 33.2],
    toleranceKm: 20,
    explanation: "全部通关！汉中物产丰饶有小江南之称，汉王刘邦以此为根据地蓄积粮草兵马，最终出陈仓定三秦、夺天下创立汉朝！"
  }
];


// ==========================================
// 5. 🌸 V2.0 四季气候与流转着色数据
// ==========================================
export const SEASONS_DATA = [
  { id: 'natural', name: '遥感原貌', icon: '🛰️', tag: '30m 真实高精', desc: '原始遥感卫星影像与物理高程本色' },
  { id: 'spring', name: '春·秦巴花海', icon: '🌸', tag: '3–4月 花海漫野', desc: '汉中安康盆地金色油菜花海光晕与关中麦田新绿' },
  { id: 'summer', name: '夏·翠峦云海', icon: '🌲', tag: '6–8月 绿树浓荫', desc: '秦岭与大巴山翡翠绿林与充沛水系蒸腾' },
  { id: 'autumn', name: '秋·太白金枫', icon: '🍁', tag: '10–11月 霜叶如霞', desc: '太白山落叶松金橙色带与陕北黄土暖阳' },
  { id: 'winter', name: '冬·北国雪原', icon: '❄️', tag: '12–2月 冰封千里', desc: '动量雪线覆盖算法，陕北与秦岭主脊银装素裹' }
];

// ==========================================
// 6. 🛣️ V2.0 经典三秦 3D 研学/自驾路书预设库
// ==========================================
export const ROADBOOK_PRESETS = [
  {
    id: "road_qinling210",
    title: "翻越秦岭分水岭 · 国道210穿越之旅",
    subtitle: "从渭河平原至汉中盆地，横跨中国南北地理分水岭",
    tag: "国家地理推荐",
    badge: "自驾巅峰",
    totalDistKm: 286,
    climbM: 2680,
    maxElevM: 2120,
    difficulty: "中高级自驾 · 山路盘旋",
    waypoints: [
      { name: "西安南郊", elevation: 420, pos: [2.5, 2.2, 16.5], desc: "关中平原起点，自大雁塔南行入秦岭终南山口" },
      { name: "沣峪口", elevation: 620, pos: [0.8, 4.2, 19.8], desc: "秦岭七十二峪著名峪口，高崖壁立，溪流奔涌" },
      { name: "鸡窝子", elevation: 1380, pos: [-0.5, 8.8, 22.4], desc: "盘山公路九曲回肠，植被从温带阔叶林渐变落叶松" },
      { name: "秦岭分水岭", elevation: 2120, pos: [-1.8, 13.5, 24.8], desc: "海拔2100m黄河长江两大水系分水岭石碑，南北风物在此一分为二" },
      { name: "广货街", elevation: 1250, pos: [-3.2, 8.2, 27.5], desc: "秦岭腹地古集镇，陕南腊肉与山野菜香气四溢" },
      { name: "佛坪大熊猫谷", elevation: 820, pos: [-7.8, 5.5, 30.2], desc: "秦岭大熊猫与金丝猴核心栖息地，空气湿润青山如黛" },
      { name: "汉中天汉湿地", elevation: 510, pos: [-14.5, 3.2, 33.2], desc: "终点抵达汉江之滨，满城油菜花香，一派江南气象" }
    ]
  },
  {
    id: "road_baoxie",
    title: "李白蜀道难 · 褒斜栈道千年寻古",
    subtitle: "朝发关中渭水，暮抵汉上天府，太白南麓古栈道绝壁行",
    tag: "千年古蜀道",
    badge: "诗仙叹绝",
    totalDistKm: 235,
    climbM: 1980,
    maxElevM: 1540,
    difficulty: "文化徒步/自驾 · 绝壁栈道",
    waypoints: [
      { name: "眉县斜谷口", elevation: 520, pos: [-6.8, 2.8, 14.5], desc: "北出斜谷入关中，诸葛亮北伐屯兵五丈原之北口" },
      { name: "太白桃川谷", elevation: 1540, pos: [-7.5, 10.2, 19.5], desc: "秦岭太白山南坡高山台地，夏季凉爽如秋" },
      { name: "留坝张良庙", elevation: 1020, pos: [-11.2, 6.8, 26.5], desc: "紫柏山麓汉留侯隐退仙祠，千年银杏与幽篁古柏掩映" },
      { name: "褒谷口石门栈道", elevation: 580, pos: [-13.8, 3.8, 30.8], desc: "世界上最早的人工通车穿山隧道石门，摩崖石刻瑰宝" },
      { name: "汉中古汉台", elevation: 500, pos: [-14.5, 3.2, 33.2], desc: "汉高祖刘邦拜韩信为大将的拜将坛古城核心" }
    ]
  },
  {
    id: "road_redyanan",
    title: "陕北红色圣地 · 延安延河与黄土长征",
    subtitle: "穿行千沟万壑的黄土塬梁峁，瞻仰革命摇篮与黄河奇观",
    tag: "红色长征路",
    badge: "黄土地史诗",
    totalDistKm: 395,
    climbM: 2420,
    maxElevM: 1150,
    difficulty: "黄土高原全景自驾",
    waypoints: [
      { name: "铜川照金", elevation: 1120, pos: [-0.8, 6.2, 4.5], desc: "陕甘边革命根据地，红日照金的丹霞崖壁与林海" },
      { name: "黄陵黄帝陵", elevation: 930, pos: [3.8, 5.2, -3.2], desc: "桥山沮水，五千年人文初祖黄帝衣冠冢与古柏苍苍" },
      { name: "洛川苹果塬", elevation: 1060, pos: [5.8, 5.8, -9.5], desc: "典型黄土残塬巨厚剖面，享誉海内外的洛川苹果之乡" },
      { name: "延安宝塔山", elevation: 980, pos: [7.2, 5.2, -18.5], desc: "几回回梦里回延安，双手搂定宝塔山，巍巍延河水" },
      { name: "延川黄河乾坤湾", elevation: 680, pos: [20.5, 3.6, -15.2], desc: "天下黄河第一湾，S形巨型太极曲流大峡谷" },
      { name: "榆林红石峡与镇北台", elevation: 1150, pos: [11.2, 6.2, -34.5], desc: "万里长城第一台，大漠孤烟与塞上明珠榆林古城" }
    ]
  },
  {
    id: "road_guanzhong",
    title: "八百里秦川 · 渭河帝王文明走廊",
    subtitle: "横跨关中金城千里，历览周秦汉唐十四朝建都兴替史",
    tag: "周秦汉唐之源",
    badge: "文明中轴",
    totalDistKm: 310,
    climbM: 2890,
    maxElevM: 2154,
    difficulty: "人文历史深度研学",
    waypoints: [
      { name: "宝鸡青铜器峡", elevation: 580, pos: [-16.2, 2.9, 13.5], desc: "青铜器之乡与石鼓出土地，八百里秦川最西端咽喉" },
      { name: "岐山周原遗址", elevation: 620, pos: [-11.5, 3.2, 14.2], desc: "周公庙与凤鸣岐山之地，周礼发祥沃土" },
      { name: "咸阳古渡秦都", elevation: 410, pos: [-1.2, 2.4, 12.8], desc: "秦咸阳宫与汉阳陵俯瞰渭水，关中八景之咸阳古渡" },
      { name: "西安明城墙钟楼", elevation: 410, pos: [2.5, 2.2, 16.5], desc: "盛唐长安城中心，天下第一古都万国商贸汇聚之所" },
      { name: "临潼秦始皇兵马俑", elevation: 450, pos: [6.8, 2.8, 14.8], desc: "千古一帝地下军阵与骊山华清池华清宫温泉" },
      { name: "华阴西岳华山", elevation: 2154, pos: [28.5, 12.8, 16.8], desc: "奇险天下第一山，花岗岩天险南峰绝壁傲视渭河" }
    ]
  }
];

// ==========================================
// 7. 📜 V2.0 版本更迭历史与架构升级日志
// ==========================================
export const CHANGELOG_DATA = [
  {
    version: "v2.0.0 PRO",
    name: "生态活化 · 空间智能感知与路书飞行",
    date: "2026-10-28",
    isLatest: true,
    summary: "三秦三维沙盒迈入全新 V2.0 时代！彻底打破传统静态沙盘束缚，实装 GLSL 片元级四季气候流转着色器、多点自驾/研学 3D 路书工坊、第一人称贴地低空飞行预演 (FPV)，以及零体积依赖的 Web Audio 三维空间自然音景系统。",
    features: [
      {
        tag: "气候流转",
        title: "四季地貌气候流转系统 (Four Seasons GLSL Engine)",
        desc: "自主研发基于物理高程 Y 与纬度 Z 梯度的片元着色器实时混色算法。提供【春·秦巴花海】（汉中金黄油菜花海微光）、【夏·翠峦云海】（秦巴高饱和翡翠深绿）、【秋·太白金枫】（漫山落叶松与枫红）、【冬·北国雪原】（动量雪线覆盖演算）。"
      },
      {
        tag: "路书飞行",
        title: "3D 多点路书工坊与 FPV 低空贴地飞行预演",
        desc: "全面升级单条剖面仪为多点研学/自驾路书工坊！支持自由在沙盘打点连线，内置 4 条经典三秦历史自驾名线（秦岭210国道、李白褒斜道、陕北长征延安行、八百里秦川走廊）。点击【低空飞行预演】镜头自动贴地滑翔，配有航速、姿态角、高度表座舱 HUD！"
      },
      {
        tag: "空间音景",
        title: "Web Audio 三维空间自然音景系统 (Procedural Soundscape)",
        desc: "100% 浏览器原生 Web Audio 程序化噪声合成，0 外部音频文件依赖，0 加载延迟。根据相机三维空间坐标自适应混音：陕北高原长风、秦岭山涧鸟鸣、关中晨钟暮鼓与高速穿梭破空风啸。"
      },
      {
        tag: "审计演更",
        title: "全周期版本演化日志中心 (Changelog Center)",
        desc: "提供透明规范的版本更迭脉络、技术架构演进图解与核心性能指标追溯。"
      }
    ]
  },
  {
    version: "v1.5.0",
    name: "视觉精修与文旅互动矩阵",
    date: "2026-10-27",
    summary: "EUGENE FINANCE 品牌深度融入，构建多维文旅与研学互动矩阵，包括《航拍三秦》电影级导览、地表剖面仪、军事兵棋推演、空间探秘挑战赛与高清海报生成器。",
    features: [
      {
        tag: "品牌植入",
        title: "EUGENE FINANCE 品牌徽章与国风印章融合",
        desc: "全站深度定制黑曜石晶体徽章、透光白色矢量 Logo，打上金融科技与地理人文交相辉映的专属数字凭证。"
      },
      {
        tag: "电影导览",
        title: "《航拍三秦》6 站电影级全景自动巡航",
        desc: "专业宽画幅遮幅设计、电影运镜曲线、唐诗意境配衬与 Web Speech API 原生中文语音解说。"
      },
      {
        tag: "空间测绘",
        title: "任意地表 DEM 物理海拔剖面切片分析仪",
        desc: "在 3D 沙盘上自由划线，沿线动态采样 60 个高程点，绘制互动式矢量剖面图与坡度分析。"
      },
      {
        tag: "战役推演",
        title: "三国古蜀道军事兵棋地形攻防对比",
        desc: "子午谷 vs 祁山道、陈仓道 vs 褒斜道，直观对比行军隐蔽性、险峻度与粮道损失率。"
      },
      {
        tag: "挑战证书",
        title: "“寻迹三秦”空间探秘挑战赛与文牒证书",
        desc: "5 关地理与历史空间点位测验，计算实地误差千米数并一键生成专属通关荣誉证书。"
      },
      {
        tag: "打卡海报",
        title: "1200×1600 高清国风地理明信片海报工坊",
        desc: "捕获 3D 视口渲染帧，附带遥测参数、经典诗句与官方认证水印，支持一键下载。"
      }
    ]
  },
  {
    version: "v1.2.0",
    name: "遥感精度突围与交互重构",
    date: "2026-10-26",
    summary: "攻克 3D 宏观沙盘地形扁平、标签重叠遮挡与四周悬空三大痛点，大幅跃升视觉质感。",
    features: [
      {
        tag: "法线烘焙",
        title: "315° 西北定向光影法线图 (Sobel Normal Map)",
        desc: "基于真实 DEM 矩阵卷积烘焙高精法线贴图，大幅锐化秦岭断崖、华山绝壁与陕北千沟万壑的微观凹凸立体感。"
      },
      {
        tag: "防撞算法",
        title: "屏幕空间 AABB 碰撞检测避让算法 (Collision Culling)",
        desc: "每帧动态计算 24+ 个地标 POI 的屏幕投影包围盒，彻底消灭文字重叠撞车，优先展示高层级重要地标。"
      },
      {
        tag: "基岩岩壁",
        title: "四壁实心基岩岩壁封边 (Terrain Skirt)",
        desc: "沿地形起伏下探构建 4 面垂直地质剖面岩壁与沉稳底座，根除网格边缘悬空穿帮现象。"
      },
      {
        tag: "微观盆景",
        title: "微观高精 3D 盆景模式联动 (Zoom 12)",
        desc: "提供兵马俑、大雁塔、华山三处局部微观高精 3D 切块与夸张度交互调节。"
      }
    ]
  },
  {
    version: "v1.0.0",
    name: "初始沙盘原型构建",
    date: "2026-10-25",
    summary: "首个高精度三秦 3D 地形交互系统原型诞生，奠定项目核心框架。",
    features: [
      {
        tag: "地形引擎",
        title: "真实 SRTM 30m DEM 高程置换地形",
        desc: "PlaneGeometry 220×300 细分网格，真实还原陕西自南向北三级阶梯地势格局。"
      },
      {
        tag: "三大单元",
        title: "陕北高原、关中平原、陕南秦巴视角联动",
        desc: "提供自然地理、历史人文、丝路起点等篇章叙事卡片与相机位点巡航。"
      }
    ]
  }
];
