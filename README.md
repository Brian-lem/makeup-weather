# 今日妆容天气预报

一张自拍，一份只属于今天的妆容天气。页面把光线、气色和场合写成预报：天气式标题、当天日期、天气图标、一句夸赞、出镜指数，以及四维天气——肤质天气、五官光线、色彩风向、妆容湿度。下面还有三句夸赞、三套配方和一句轻轻的提醒。三套配方分别是通勤、约会、轻松出门，每套都写清底妆、眉眼、唇色和手法。也可以把这张预报下载成竖版分享卡。

**美学娱乐建议，不是医疗诊断。** 它不判断皮肤病，不开处方，也不给医美建议。出镜指数只落在 78 到 96，用来形容今天适不适合被看见，不是客观评分。

线上页面：[https://brian-lem.github.io/makeup-weather/](https://brian-lem.github.io/makeup-weather/)

打开即可使用。选一张自拍，点「生成今日预报」，不用填写地址，也不用准备 API 密钥。请求发往页面内置的预报服务：

`https://makeup-weather-veefqfizvy.cn-hangzhou.fcapp.run`

从 GitHub Pages 打开时，浏览器会带上来源 `https://brian-lem.github.io`。这个地址是接口位置，不是密钥。

## 照片去了哪里

- 选择图片后，浏览器会把长边收到大约 1280px，重新编码成 JPEG。这一步顺便去掉原图里的位置信息。
- 「预览示例」完全在本地运行，不上传，不请求第三方。
- 点击「生成今日预报」时，缩小后的照片才会发给上面的预报服务。普通访问不会先弹出接入设置。
- 这个静态网站没有数据库，不写相册，也不把照片放进 `localStorage`。
- 以前保存在 `makeup-weather.workerUrl` 里的地址，普通访问不会拿来发请求。只有地址栏带 `?dev=1` 时，才会用它覆盖内置服务。
- 预报服务把当次图片转给通义千问兼容接口，响应返回后即丢弃。

通义千问会在那一次请求里看到图片，这是生成预报所需要的。密钥留在服务端，不出现在网页和仓库中。

## 本地预览

在仓库根目录启动一个静态服务器：

```bash
python3 -m http.server 8080
```

打开 [http://localhost:8080](http://localhost:8080)。直接双击 `index.html` 时，浏览器通常会拦截模块脚本，所以请用上面的方式。

先点「预览示例」，可以不选照片，看完整结果和分享卡。真实预报直接点「生成今日预报」。

## 可选：临时改地址

在页面地址后加上 `?dev=1`（例如 `https://brian-lem.github.io/makeup-weather/?dev=1`）会露出「接入设置」。那里可以把这台浏览器的请求临时改到别的地址，保存在 `localStorage` 的 `makeup-weather.workerUrl`。清除后恢复内置预报服务。

如果输入看起来像密钥（例如以 `sk-` 开头）、带有 `api_key` 一类的查询参数，或直接填了 `dashscope.aliyuncs.com`，页面会拒绝保存。

不带 `?dev=1` 时，这个面板是藏起来的，请求固定走内置地址。

## 可选：自己部署 Worker

线上流量走的是上面的预报服务，不是 Cloudflare Worker。仓库里的 `worker/` 仍是同一套协议的自托管示例。网页不会向你索取 DashScope API 密钥。部署由你自己完成，本仓库不代为部署。

```bash
cd worker
npm install
npx wrangler secret put DASHSCOPE_API_KEY
npx wrangler deploy
```

`DASHSCOPE_API_KEY` 只用 `wrangler secret` 或 Cloudflare 控制台写入。不要写进 `wrangler.toml`、`.dev.vars`（如果提交的话）或网页输入框。`.gitignore` 已忽略 `.dev.vars` 和 `.env`。

部署完成后，用 `?dev=1` 打开接入设置，粘贴 `https://<你的子域>.workers.dev`。可以先点「测试地址」。地址只保存在这台浏览器，而且只在这次开发覆盖里生效。

### Worker 协议

`POST` JSON：

```json
{
  "imageBase64": "<不带 data: 前缀>",
  "mimeType": "image/jpeg",
  "occasion": "通勤"
}
```

`occasion` 只能是 `通勤`、`约会` 或 `轻松出门`。图片只接受 JPEG、PNG、WebP。

Worker 使用密钥调用：

`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`

模型是 `qwen3-vl-plus`。成功时返回 `{ "ok": true, "forecast": { ... } }`。`forecast` 含天气标题、图标、夸赞句、78–96 的出镜指数、四个维度、三句夸赞、三套配方、一句提醒和日期。

`GET` 同一地址可做连通性检查，返回 `{ "ok": true, "service": "makeup-weather", "storesPhotos": false }`，不消耗模型额度。

### CORS

允许的浏览器来源：

- `https://brian-lem.github.io`
- `https://Brian-lem.github.io`（按主机名不区分大小写，并原样回写 `Origin`）
- `http://localhost`、`http://127.0.0.1`、`http://[::1]`，以及它们的 https 和任意端口

其他网站的浏览器请求会被拒绝。这不能代替密钥保管：拿到 Worker 地址的人仍可能用非浏览器客户端调用它，从而消耗你的额度。密钥泄露时，在 Cloudflare 轮换 `DASHSCOPE_API_KEY`。

## 目录

```
index.html          页面
css/styles.css      样式
js/                 压缩图片、预览示例、结果、分享卡；内置预报地址
worker/             可选的自托管 Cloudflare Worker 与 wrangler.toml
worker/test/        协议、CORS、隐私相关的本地测试
```

本地测试：

```bash
npm test
```

## 发布

静态站点从 `main` 分支的根目录发布。仓库所有者在 GitHub 的 Settings → Pages 里选择 Deploy from a branch，分支 `main`，目录 `/ (root)`。启用后的地址是 [https://brian-lem.github.io/makeup-weather/](https://brian-lem.github.io/makeup-weather/)。

也可以用自己的管理员令牌调用：

```bash
gh api --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/Brian-lem/makeup-weather/pages \
  -f build_type=legacy \
  -f source[branch]=main \
  -f source[path]=/
```

Worker 不在 Pages 上运行。
