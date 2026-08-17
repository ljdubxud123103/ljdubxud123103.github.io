# CinePalette 项目交接文档（2026-08-17）

## 1. 项目目标
面向电影制片人的**按色调检索电影截图**参考工具：选色相 → 瀑布流浏览匹配截图 → 详情页查看色彩数据/色卡/同片其他截图，辅助拍摄现场的配色与构图参考。MVP 为 H5（PWA），验证稳定后再做原生 iOS。

- 线上地址：https://ljdubxud123103.github.io/
- 部署仓库：`ljdubxud123103/ljdubxud123103.github.io`
  - `main` 分支 = 构建产物（Pages 直接serve，勿放源码）
  - `source` 分支 = **完整源码**（2026-08-17 已推送，含 src/、public/、data/、scripts/、docs/、package.json + 锁文件）
- 最新部署提交（main）：`ab27522`；本地 `f:\cinepalette` 已是 git 仓库，本地 `main` 对应远程 `source` 分支

## 2. 目录结构
```
f:\cinepalette\
├── data/                  # movies.json + hue_index.json（全量数据，打包进 JS）
├── docs/                  # 决策报告 decision-report-20260817.html、本文档
├── scripts/               # 抓取与色彩分析（scrape.mjs / enrich-cast.mjs / scraper.py / color_analyzer.py）
├── public/                # manifest.json、sw.js、图标
├── src/
│   ├── App.tsx            # 主布局 + 底部 Tab（浏览/最近/收藏）+ 数据加载
│   ├── types.ts           # Movie / ScreenshotColor / FavoriteItem / RecentItem
│   ├── store/appStore.ts  # Zustand 全局状态
│   ├── hooks/useFavorites.ts
│   ├── components/        # SpectrumBar / ScreenshotGrid / ScreenshotCard /
│   │                      # MovieDetail / SearchBar / SearchDrawer /
│   │                      # FavoritesPage / RecentPage
│   └── utils/             # dataLoader / colorUtils / exportUtils / searchUtils / registerSW
└── dist/                  # vite build 产物（最新已部署）
```
注：`.deploy-tmp/` 为残留的废弃克隆目录，可删除。

## 3. 已完成功能
- **数据**：30 部电影 / 1843 张截图（film-grab.com），每张含主色相、饱和度、亮度、5 色 HEX 色板
- **首页**：双列瀑布流；顶部横向色带（SpectrumBar）拖动选色，按 ±15° 色差过滤并按色差排序；一键清除筛选
- **详情页**：色板点击复制 HEX；HUE/SAT/BRI 读数；导演/年份/摄影/主演；同片缩略图（当前张自动滚动定位）；左右滑动 + 箭头按钮 + 键盘 ←/→/Esc 切换；`n / 总数` 位置指示
- **导出**：下载色卡（Canvas 绘制 1080px PNG：截图+5 色板+片名+导演/年份+HUE/SAT/BRI）；导出原图 JPG
- **最近 / 收藏**：localStorage 持久化（最近上限 50 条）
- **搜索**：按片名/导演，抽屉式结果（SearchDrawer）
- **PWA**：manifest + Service Worker（CACHE_NAME=`cinepalette-v3`，activate 时自动清理旧缓存）
- **修复**：「最近/收藏/首页」卡死（原因见第 7 节）

## 4. 正在开发的功能
无进行中的半成品。最新一轮改动（顶部色带、色卡下载、滑动切换、卡死修复）已全部上线。**当前处于等待用户体验反馈阶段。**

## 5. 关键技术栈
React 19 + TypeScript 5.8 + Vite 6 + Zustand 5 + Framer Motion 12 + react-router-dom 7（HashRouter）+ @phosphor-icons/react；数据抓取 Node（undici/cheerio）+ Python（Pillow 色彩分析）。

## 6. 重要文件说明
| 文件 | 说明 |
|---|---|
| `src/store/appStore.ts` | 全局状态。**派生数据严禁放 store/selector**（见第 7 节），`hueDistance()` 从此处导出 |
| `src/components/SpectrumBar.tsx` | 顶部横向色带，替代已删除的左侧 ColorWheel（勿恢复 ColorWheel） |
| `src/components/MovieDetail.tsx` | 详情页：滑动/键盘导航（`navigateDetail`）、色卡下载（`handlePaletteExport`） |
| `src/utils/exportUtils.ts` | `exportScreenshot`（原图 JPG）+ `exportPaletteCard`（Canvas 色卡 PNG） |
| `src/hooks/useFavorites.ts` | 派生数据正确写法范例：订阅原始 state + useMemo |
| `public/sw.js` | PWA 缓存，cache-first；**每次改动前端资源必须 bump CACHE_NAME** |
| `scripts/` | 扩充影片库时使用，抓取需代理 |

## 7. 已知问题
- **Zustand 卡死根因（已修复，勿复发）**：store 中返回新数组的派生 selector 会导致无限重渲染。正确模式 = 订阅原始 state（`movies`、`recentItems`、`favorites`）+ 组件内 `useMemo` 派生。
- 主 bundle 727KB（数据内联 JS），Vite 报 chunk 警告，未做代码分割。
- 本机 `vite build` 结束时 exit code 1 但实际成功（PowerShell 警告管道所致），以 `✓ built` 输出为准。
- SW 为 cache-first：不 bump CACHE_NAME，用户端拿不到新版本。

## 8. 下一步
1. 收集用户新版顶部色带/全宽布局/色卡下载的体验反馈，按需微调
2. （可选）代码分割减小 bundle；图片懒加载进一步优化
3. （可选）扩充影片库：跑 `scripts/` 抓取（需代理 127.0.0.1:7897），重跑色彩分析后更新 `data/`
4. H5 稳定后启动原生 iOS 版

## 9. 约束与注意事项（不可改动）
- 截图**只来自 film-grab.com**，存本地预设库
- 只做**色调分类**，禁止情绪/氛围类标签
- 截图详情必须含：导演、上映年份、主演、同片其他截图
- 先 H5（PWA），后原生 iOS
- film-grab.com 抓取需代理 `127.0.0.1:7897`
- **环境特殊**（本机 shell 无 node/git/npx in PATH）：
  - node：`C:\Users\27760\.trae-cn\binaries\node\versions\v24.14.0\node.exe`
  - git：`F:\ComfyUI\ComfyUI-aki-v3\git\cmd\git.exe`（凭据已存，可直推仓库）
  - 沙箱写文件仅允许 `C:\Users\27760` 下；`.gitignore` 已排除 node_modules/dist/.refs/.deploy-tmp
- **新机器接手**：`git clone -b source https://github.com/ljdubxud123103/ljdubxud123103.github.io.git` → `npm install` → `npm run dev`
- **部署流程**：源码提交推送到 `source` 分支 → `vite build` → 在 main 分支覆盖 `index.html`、`sw.js`、新增 `assets/*`、删除旧 hash bundle → push main（图片未变时不重推 images/）→ 等 ~2 分钟后线上验证新 hash 文件名
- UI 深色电影感风格（--bg #0c0d0f 系、accent #c45d3e 橙红、mono 数据字体），用户为电影制片人，审美要求高
