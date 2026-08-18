# CinePalette 便携运行与重新部署

## 无开发环境直接打开

完整交付包的 `01_直接运行网站` 已包含构建结果和 Windows 本地服务器。双击 `打开_CinePalette.bat` 后，脚本会在可用端口启动本地网站并打开浏览器。

- 不需要安装 Node.js、npm、Python 或数据库。
- 关闭启动脚本的终端窗口即可停止本地网站。
- 个人收藏、最近浏览和项目板保存在启动该网站的浏览器中。

## 从源码运行

需要 Node.js 20 或更高版本：

```bash
npm install
npm run dev
```

生成生产构建：

```bash
npm run build
```

构建完成后也可以在源码目录双击 `打开本地网站.bat`，它会使用 `dist/` 启动本地服务器。

## 部署一个相同的新网站

最简单的方法是把 `dist/` 目录内的所有文件上传到静态托管平台根目录。以下平台均可使用：

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel 静态部署
- 普通 Nginx／Apache 静态目录

GitHub Pages 的源分支根目录应直接包含 `index.html`、`assets/`、`images/`、`sw.js` 和 `manifest.json`，不能再多套一层 `dist` 文件夹。

如果使用新域名或子路径，检查 `vite.config.ts` 的 `base` 设置并重新执行 `npm run build`。当前配置用于站点根路径 `/`。

## 发布前检查

1. `npm run build` 成功。
2. `dist/images/film-grab/` 中共有 2463 张图片。
3. `dist/sw.js` 的缓存版本已提升。
4. 手机和桌面浏览器均能打开图库、识色、项目板和收藏。
5. 新部署首页返回新的 JS／CSS 哈希文件。

