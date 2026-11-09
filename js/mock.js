import { todayParts } from "./format.js";

const MOCKS = {
  通勤: {
    weatherTitle: "薄雾暖瓷晴",
    icon: "rose-sun",
    sentence: "今天的光线把人放得很近，清楚，但一点也不刺，适合被从容地看见。",
    score: 90,
    dimensions: {
      skin: { name: "肤质天气", summary: "薄雾转晴", detail: "气色是匀的，底妆贴住光就好，不必盖住细纹和毛孔。" },
      light: { name: "五官光线", summary: "顺光微侧", detail: "眉骨和鼻梁自己会亮，高光点到颧骨最高处就停。" },
      color: { name: "色彩风向", summary: "暖玫瑰", detail: "腮红和唇色走同一支玫瑰，米白或燕麦色衣服会很干净。" },
      moisture: { name: "妆容湿度", summary: "中湿偏润", detail: "看起来水润，定妆用很少的量，别把这层光拍干。" },
    },
    compliments: [
      "眉眼清楚，像天气正好时看远处。",
      "气色是暖的，近看也干净。",
      "轮廓柔，但五官没有被光抹掉。",
    ],
    recipes: [
      {
        occasion: "通勤",
        base: "薄涂暖米色气垫，眼下和鼻翼用指腹补第二层，额角用余粉扫开。",
        eyes: "眉峰少染一点，眼尾铺灰棕阴影，睫毛根部夹一下再刷。",
        lips: "豆沙玫瑰，先用指腹把颜色晕出唇线，再轻轻点回唇中。",
        technique: "全脸用粉扑按，不要来回擦，最后用大刷把颧骨和太阳穴连成一片。",
      },
      {
        occasion: "约会",
        base: "遮瑕留在眼下，颧骨最高处点一粒细碎高光，其余地方保持薄。",
        eyes: "眼皮中段铺暖杏，眼尾用深一号的棕轻轻拉长，眉尾顺着骨线收尖。",
        lips: "同一支玫瑰在唇中心再叠一层，唇峰用指腹抹掉硬边。",
        technique: "腮红从太阳穴斜向唇角，边缘用干净刷晕开，夜灯下也不会一块一块。",
      },
      {
        occasion: "轻松出门",
        base: "润色隔离打底，遮瑕只点一颗在最在意的地方，用余温推开。",
        eyes: "眉毛梳顺，深棕眼影沿睫毛根扫一条细线，代替眼线笔。",
        lips: "带玫瑰调的润唇膏，比口红色更轻，出门补涂也方便。",
        technique: "用手温把妆按进皮肤，见到光再决定要不要加腮红。",
      },
    ],
    tip: "出门前对窗看一眼。窗光比镜子更接近今天别人看见你的样子。",
  },
  约会: {
    weatherTitle: "月色玫瑰晴",
    icon: "moon",
    sentence: "今天适合被放在暖一点的灯下看，五官清楚，气色像刚被玫瑰光沾过。",
    score: 93,
    dimensions: {
      skin: { name: "肤质天气", summary: "缎面微晴", detail: "皮肤看着细，底妆走缎面，保留一点反光，不要磨成哑光。" },
      light: { name: "五官光线", summary: "眼神聚光", detail: "眼睛是今天的光源，眼下提亮一小块，其余高光克制。" },
      color: { name: "色彩风向", summary: "深玫瑰", detail: "颜色可以比白天浓半度，仍然停在玫瑰和杏子里，不跳到正红。" },
      moisture: { name: "妆容湿度", summary: "夜湿", detail: "唇和眼下留一点水光，两颊用很薄的粉固定，避免全脸发干。" },
    },
    compliments: [
      "眼睛今天很会接光。",
      "唇色不用很重，轮廓已经够清楚。",
      "近看有气色，远看也不花。",
    ],
    recipes: [
      {
        occasion: "通勤",
        base: "白天把约会妆减半：气垫薄涂，高光先不点，只留眼下的亮度。",
        eyes: "眉色填空隙，眼影只留睫毛根的一层暖棕。",
        lips: "玫瑰奶茶薄涂，下午再决定要不要加深。",
        technique: "定妆压在鼻翼和额头，两颊少拍，给晚上的腮红留位置。",
      },
      {
        occasion: "约会",
        base: "中等遮瑕，眼下用亮一号的膏体点三下，颧骨高光米粒大小。",
        eyes: "暖杏铺满眼皮中段，眼尾用梅子棕加深，睫毛膏把根部夹翘。",
        lips: "玫瑰豆沙铺满后，唇中心点更深的一层，唇线用颜色自己晕出来。",
        technique: "腮红斜扫到太阳穴，耳垂附近轻轻带过，灯光下脸会更完整。",
      },
      {
        occasion: "轻松出门",
        base: "如果临时改成白天见面，用保湿霜把妆揉薄，只留唇色和眉毛。",
        eyes: "用干净手指把眼影晕开，直到只看见一条暖影。",
        lips: "把唇色拍到唇中，边缘几乎看不见。",
        technique: "宁肯薄，也不要在日光下留下昨夜的边界。",
      },
    ],
    tip: "暖黄的室内灯会把唇色骗红。进门后对镜子把唇中心的颜色收淡一点。",
  },
  轻松出门: {
    weatherTitle: "朝露清透风",
    icon: "dew",
    sentence: "今天的好看来自干净，妆像朝露，停一会儿就该让皮肤自己透出来。",
    score: 86,
    dimensions: {
      skin: { name: "肤质天气", summary: "露水晴", detail: "气色轻快，底妆越薄越像今天的天气，遮瑕点到为止。" },
      light: { name: "五官光线", summary: "散射光", detail: "没有强烈的高光点，五官靠眉毛和唇色站住，不用描得很深。" },
      color: { name: "色彩风向", summary: "杏奶", detail: "颜色往杏子和牛奶走，避开冷粉，阳光下会更温柔。" },
      moisture: { name: "妆容湿度", summary: "高湿", detail: "保湿比定妆重要，粉只压容易出油的鼻翼，其余留着水光。" },
    },
    compliments: [
      "不用化妆也已经有光，妆只是把光留住。",
      "眉形清楚，随便梳一梳就很整齐。",
      "这种天气里，薄唇色比浓口红更衬你。",
    ],
    recipes: [
      {
        occasion: "通勤",
        base: "气垫只在眼下和鼻翼按两下，额头基本留白。",
        eyes: "眉笔补三笔空隙，睫毛膏刷一层就停。",
        lips: "杏奶色唇釉薄涂，用纸按掉多余的油光。",
        technique: "全程用粉扑点，不拖拽，五分钟内可以出门。",
      },
      {
        occasion: "约会",
        base: "在轻松出门的底上，眼下再提亮一点，颧骨扫很淡的杏子腮红。",
        eyes: "眼尾加一层暖棕，范围不要超过瞳孔外缘。",
        lips: "杏奶打底，唇中心点一粒玫瑰，用指腹揉开。",
        technique: "仍然保持能看见皮肤，浓的部分只留给眼睛和唇中。",
      },
      {
        occasion: "轻松出门",
        base: "防晒之后用润色隔离，遮瑕只用米粒大小。",
        eyes: "眉毛梳顺，不起眼线，深棕眼影在睫毛根蹭出一条影子。",
        lips: "有颜色的润唇膏来回两遍，咬唇后再补中心。",
        technique: "用手的温度按实，见到太阳再看要不要加一笔腮红。",
      },
    ],
    tip: "风大的时候先涂润唇，口红色放在包里。干了再补，比一开始涂厚更自然。",
  },
};

export function buildMock(occasion) {
  const key = Object.prototype.hasOwnProperty.call(MOCKS, occasion) ? occasion : "通勤";
  const forecast = structuredClone(MOCKS[key]);
  forecast.dateLabel = todayParts().label;
  forecast.focusOccasion = key;
  return forecast;
}
