# CinePalette 项目交接文档（2026-08-18）

## 1. 当前状态

CinePalette 是面向电影制片、导演、摄影和视觉创作者的电影截图色彩参考工具。当前 H5／PWA 版本已经完成并公开运行。

- 公开网址：<https://ljdubxud123103.github.io/>
- GitHub 仓库：<https://github.com/ljdubxud123103/ljdubxud123103.github.io>
- `source` 分支：完整 React／TypeScript 源码
- `main` 分支：GitHub Pages 直接发布的静态构建
- 当前公开版本提交：`0999a1d`（品牌重设计与片门开场动画）
- 数据规模：40 部电影、2463 张电影截图

本交付版本没有未完成的功能分支。源码工作区中的 `.impeccable/review/` 是本机审查缓存，不属于项目交付内容。

## 2. 已完成功能

- 电影截图图库：移动端双列瀑布流；桌面端三至五列全宽画幅墙。
- 色系排列：默认按红、黄、绿、蓝、紫和中性色分带排列。
- 搜索：按电影片名或导演检索。
- 筛选：点击筛选按钮后选择色块，按色相筛选截图。
- 截图详情：导演、年份、主演、同片截图、色板、HUE／SAT／BRI 数据。
- 导出：原图 JPG 与带电影信息、五色色板的 PNG 色卡。
- 识色：上传参考图，在浏览器内提取五色并匹配本地图库。
- 项目板：按项目整理截图，数据保存在浏览器 localStorage。
- 收藏与最近：收藏及最近浏览均保存在浏览器 localStorage。
- PWA：manifest、应用图标和 Service Worker；当前缓存版本为 `cinepalette-v11`。
- 品牌界面：开放画幅 `C` 与珊瑚取样方块；移动端贴底控制条；桌面端左侧导航。
- 入场动画：整页打开时播放一次约 1.5 秒的片门开场动画，并支持降低动态效果。

## 3. 技术栈

- React 19
- TypeScript 5.8
- Vite 6
- Zustand 5
- Framer Motion 12
- React Router 7（HashRouter）
- Sharp、Cheerio、Undici（数据与图片处理脚本）
- Python 脚本用于抓取／色彩分析的历史工作流

## 4. 目录说明

```text
CinePalette/
├─ data/                         # 40 部电影和 2463 张截图的结构化数据
├─ docs/                         # 交接、设计与决策文档
├─ public/
│  ├─ images/film-grab/          # 2463 张本地电影截图
│  ├─ icon.svg
│  ├─ icon-512x512.jpg
│  ├─ manifest.json
│  └─ sw.js
├─ scripts/                      # 数据抓取、色彩分析、静态站点服务器
├─ src/                          # React 应用源码
├─ DESIGN.md                     # 当前界面设计系统
├─ PRODUCT.md                    # 产品事实与约束
├─ package.json
├─ package-lock.json
└─ vite.config.ts
```

`node_modules/`、`dist/` 和 `*.tsbuildinfo` 是可重建产物，不应提交或跨电脑复制。完整交付包另附已经构建好的静态站点，供没有 Node.js 的电脑直接打开。

## 5. 新电脑继续开发

### 从交付包恢复

1. 解压完整交付包。
2. 进入 `02_完整源代码`，双击 `恢复图库到源码.bat`。
3. 安装 Node.js 20 或更高版本。
4. 在该目录执行：

```bash
npm install
npm run dev
```

5. 浏览器打开终端显示的本地地址。

### 从 GitHub 恢复

```bash
git clone -b source https://github.com/ljdubxud123103/ljdubxud123103.github.io.git CinePalette
cd CinePalette
npm install
npm run dev
```

## 6. 构建与发布

```bash
npm run build
```

构建结果位于 `dist/`。`main` 分支只放 `dist/` 的内容；`source` 分支只放源码。每次修改前端资源后都必须提升 `public/sw.js` 中的 `CACHE_NAME`，否则旧设备可能继续使用缓存。

若要做一个完全相同的新网站，可把 `dist/` 全部内容部署到任意静态托管平台；应用使用 HashRouter，不需要服务器端路由重写。

## 7. 重要约束

- 截图目前只来自 film-grab.com，并以本地预设图库方式发布。
- 只做色调分类与色彩相似度匹配，不增加情绪／氛围标签。
- 截图详情必须保留导演、年份、主演和同片其他截图。
- 收藏、最近浏览和项目板只存于当前浏览器，不会自动跨电脑同步。
- 识色在浏览器本地完成，不在前端暴露第三方 AI 密钥。
- 图片来源事实必须保留；本项目文档不虚构图片版权或商业授权结论。

## 8. 已知技术事项

- `movies-BSNcxooJ.js` 约 629 KB，Vite 会给出大 chunk 警告，但不影响运行。
- 静态网站不能直接用 `file://` 双击 `index.html`，因为浏览器会限制模块和资源读取；交付包提供无依赖的 Windows 本地服务器，双击启动文件即可打开。
- 如果公开网站仍显示旧界面，关闭页面重新打开或清理站点缓存；当前 Service Worker 缓存版本应为 `cinepalette-v11`。

