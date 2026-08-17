---
name: CinePalette
description: 把电影截图检索、参考图识色与项目收集串成一个近黑电影工作台。
colors:
  cinema-black: "#0c0d0f"
  bench-black: "#141518"
  elevated-charcoal: "#1b1c20"
  glass-black: "rgba(16, 17, 20, 0.82)"
  projector-white: "#ececee"
  silver-muted: "#a0a2a8"
  silver-faint: "#80838a"
  hairline-white: "rgba(255, 255, 255, 0.07)"
  warm-rust: "#b85437"
  warm-coral: "#f29a7c"
  rust-shadow: "#29201d"
  rust-wash: "rgba(196, 93, 62, 0.10)"
  on-accent: "#ffffff"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  data:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace"
    fontSize: "9px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  small: "6px"
  segment: "7px"
  control: "8px"
  standard: "10px"
  nav: "11px"
  panel: "14px"
  sheet-top: "16px 16px 0 0"
  pill: "999px"
  circle: "50%"
spacing:
  micro: "4px"
  tight: "6px"
  compact: "8px"
  control: "12px"
  gutter: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.warm-rust}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  button-quiet:
    backgroundColor: "{colors.glass-black}"
    textColor: "{colors.projector-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.bench-black}"
    textColor: "{colors.projector-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "44px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.silver-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.nav}"
    width: "60px"
    height: "48px"
  nav-item-active:
    backgroundColor: "{colors.rust-shadow}"
    textColor: "{colors.warm-coral}"
    typography: "{typography.label}"
    rounded: "{rounded.nav}"
    width: "60px"
    height: "48px"
  film-frame-card:
    backgroundColor: "{colors.bench-black}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.standard}"
    width: "100%"
  chip-active:
    backgroundColor: "{colors.rust-wash}"
    textColor: "{colors.projector-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  segmented-active:
    backgroundColor: "{colors.elevated-charcoal}"
    textColor: "{colors.projector-white}"
    typography: "{typography.body}"
    rounded: "{rounded.segment}"
    padding: "0 10px"
    height: "44px"
  color-data-panel:
    backgroundColor: "{colors.bench-black}"
    textColor: "{colors.projector-white}"
    typography: "{typography.data}"
    rounded: "{rounded.standard}"
    width: "100%"
---

# Design System: CinePalette

## Overview

**Creative North Star: "The Film Edit Bench / 电影剪辑台"**

“电影剪辑台”把界面理解为一张正在工作的台面：用户来这里找画面、比颜色、归项目，而不是停留在一座被动陈列的图库。CinePalette 保持成熟世界的 Operate 模式，界面负责让任务路径清晰，不为重新塑造品牌而增加新的视觉体系。

视觉重心始终落在电影截图上。近黑表面、克制暖色、紧凑控制和测量感等宽数据共同构成工作台；控件像剪辑工具一样退后，只有当前状态、关键动作和色彩读数获得强调。

从图库到识色、从详情到项目板、再从收藏回到已保存工作，四个一级入口组成稳定的生产闭环。最近浏览留在收藏内部，避免用低价值永久历史导航稀释第一视口。

**The Active Tool Owns the Canvas Rule.** 第一视口先呈现当前工具和它的主要内容，导航保持可达但不抢夺画面。

**Key Characteristics:**

- 近黑电影工作台，以细微明度层级区分结构。
- 暖锈与柔珊瑚只用于当前状态、关键动作和反馈。
- 电影截图几乎无额外框饰，标题与色点贴近画面。
- 色相、饱和度、亮度与 HEX 使用紧凑等宽读数。
- 移动端是四入口浮动 dock，桌面端从 900px 起转为 78px 左轨。

## Colors

色彩系统以低彩度近黑和银灰构成工具台，只用一组克制暖色表达选择、动作与收藏状态。

### Primary

- **Warm Rust / 暖锈** (`#b85437`): 主动作、分析进度和关键可操作状态；面积要小，出现即代表行动。
- **Warm Coral / 柔珊瑚** (`#f29a7c`): 深色背景上的活动导航文字与链接，比主强调色更明亮但不扩大面积。
- **Rust Shadow / 锈影** (`#29201d`): 一级导航当前项的深暖底色，让状态可见而不形成明亮色块。
- **Rust Wash / 锈色薄洗** (`rgba(196, 93, 62, 0.10)`): 筛选、项目选中和展开状态的低强度背景反馈。

### Neutral

- **Cinema Black / 影院黑** (`#0c0d0f`): 页面底色，也是所有画面的静默基座。
- **Bench Black / 台面黑** (`#141518`): 搜索框、卡片、工作台和次级控件的基础表面。
- **Elevated Charcoal / 抬升炭灰** (`#1b1c20`): 分段选中、确认控件和更高一层的交互表面。
- **Glass Black / 玻璃黑** (`rgba(16, 17, 20, 0.82)`): 粘性搜索、浮层工具和需要保留背景语境的半透明表面。
- **Projector White / 放映白** (`#ececee`): 标题、关键数据与主要文字，避免纯白大面积眩光。
- **Muted Silver / 柔银灰** (`#a0a2a8`): 辅助说明、默认导航和次级按钮文字。
- **Faint Silver / 暗银灰** (`#80838a`): 计数、占位、提示和最低层级元数据。
- **Hairline White / 发丝白** (`rgba(255, 255, 255, 0.07)`): 深色表面之间的细边界，负责结构而非装饰。
- **On Accent / 强调色上白** (`#ffffff`): 暖锈实心按钮及画面遮罩上的短标签文字。

**The Warm Accent Is a Cue Rule.** 暖色只标记当前、可执行与可保存的状态，不把内容区铺成品牌色面。

## Typography

**Display Font:** 无独立展示字体；大标题继续使用系统无衬线字体。
**Body Font:** 系统无衬线栈（`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, sans-serif）。
**Label/Mono Font:** 系统等宽栈（`ui-monospace`, `SF Mono`, `Cascadia Code`, `Menlo`, monospace）。

**Character:** 系统无衬线保持专业、紧凑和快速扫描；等宽字体只在色彩数据、角度、百分比、计数与短编号中出现，把“看画面”与“读测量”清楚分开。桌面左轨的单字母品牌标记可保留 Georgia 作为局部识别，不扩展为全局标题字体。

### Hierarchy

- **Headline** (700, 25px, 1.5, -0.025em): 工具页唯一的一级标题。
- **Title** (700, 19px；详情标题可到 21px, 1.5): 结果区、项目板和详情中的局部标题。
- **Body** (400, 12.5–15px, 1.5): 说明、影片元数据、表单与按钮正文；说明文字通常控制在 44–62ch。
- **Label** (550–700, 8–12.5px, 1–1.4): 导航、筛选、缩略图标题与短状态，不依赖全大写制造层级。
- **Data** (600, 8–13px, 0.04–0.14em): HEX、HUE、SAT、BRI、匹配分、计数和索引，使用等宽与表格数字。

**The Image Leads, Data Measures Rule.** 影片标题和任务标题使用无衬线，色彩数值与计数才使用等宽；不要让等宽字体覆盖整段正文。

## Layout

页面从移动端开始组织。图库在手机和平板保持双列自然比例瀑布流；1100px 以上切换为整齐的 16:9 电影画幅墙，并随视口从三列扩展到四列、五列，直接铺满桌面导航之外的可用宽度。默认内容按每两排一个色系分带排列，从红、黄、绿、蓝到紫和中性色循环过渡；搜索和筛选工作区仍限制在 1320px 内，避免控件随超宽屏被无意义拉长。工具页最大宽度为 1080px。移动端水平 gutter 为 16px，680px 起工具页扩为 28px。常用密度以 6–8px 小间距组织同组控件，以 12–16px 形成控件内距，以 24–34px 分开任务段落。

移动端一级导航固定在左右各 8px、底部安全区上方，是高 58px 的四入口 dock；内容底部为它预留 78px。900px 起导航变为固定 78px 左轨，内容同步左移 78px，dock 的圆角与阴影消失。四个入口固定为图库、识色、项目板、收藏；最近浏览只作为收藏页内的二级分段。

识色工作台在窄屏纵向堆叠，在 680px 起按约 1.35:0.65 分为参考图与分析面板。匹配结果和项目截图从两列开始，680px 为三列、900px 为四列；桌面图库以全宽色带墙使用空间，让超宽屏同时看到更多电影画面并形成可扫读的色彩序列。

**The Four Actions Rule.** 一级导航永远保持四个高频生产动作；不要把最近浏览恢复成第五个永久入口。

## Elevation & Depth

系统先用明度层级和发丝边界建立结构，再在真正浮起的对象上使用阴影。普通影片卡片不靠阴影与背景分离；工作台、移动 dock、上传浮钮和底部 sheet 才获得定向阴影。搜索条与覆盖层使用模糊玻璃保留背景语境，但不能降低文字对比。

### Shadow Vocabulary

- **Raised Workbench** (`0 14px 36px rgba(0, 0, 0, 0.34)`): 识色工作台等独立任务容器。
- **Floating Dock** (`0 8px 20px rgba(0, 0, 0, 0.34)`): 仅用于移动端四入口 dock。
- **Floating Control** (`0 8px 22px rgba(0, 0, 0, 0.34)`): 画面上的上传、更换等临时动作。
- **Upward Sheet** (`0 -12px 48px rgba(0, 0, 0, 0.5–0.6)`): 搜索抽屉与截图详情从底部升起时使用。

**The Tonal Before Shadow Rule.** 先用影院黑、台面黑、抬升炭灰和发丝边界表达层级，阴影只证明对象确实浮在画布之上。

## Shapes

工作台的基础圆角是 10px，紧凑控件收至 6–8px，独立面板放大到 14px，底部 sheet 顶角为 16px。导航项使用 11px 软矩形；圆形只留给覆盖在画面上的关闭、收藏与前后切换，999px 胶囊只留给计数或位置芯片。电影画面可以裁切进圆角，但不再套额外装饰框。

**The Radius Follows Function Rule.** 控件越小圆角越紧，浮层越完整圆角越大；不要把所有对象统一成胶囊或同一种圆角。

## Components

### Buttons

- **Shape:** 主要表单按钮与紧凑动作采用 8px 圆角，最小触控高度为 44px。
- **Primary:** 暖锈实心底、白字、600 字重，左右内距 12px；只用于新建、确认等明确推进工作流的动作。
- **Hover / Focus:** hover 保持克制；键盘焦点使用 2px 柔珊瑚轮廓并外移 2px，按压反馈约为 0.94–0.98 缩放。
- **Secondary / Ghost:** 台面黑或透明底、发丝边界、柔银文字；危险动作只把文字移向偏暖的警示色，不制造大面积红底。

### Chips

- **Style:** 筛选与项目选项使用 6–8px 圆角、发丝边界和紧凑文字；选中时叠加锈色薄洗与暖色边界。
- **State:** 状态同时由图标、文字或勾选表达，不能只靠底色变化。

### Cards / Containers

- **Corner Style:** 影片卡片与项目截图使用 10px 圆角并裁切画面。
- **Background:** 图片加载前以台面黑承接；标题以底部黑色渐变直接叠在画面上。
- **Shadow Strategy:** 普通卡片无阴影；识色工作台使用 Raised Workbench。
- **Border:** 图片卡片通常无边框，任务容器才使用发丝边界。
- **Internal Padding:** 图像不留内边距，文字覆盖层使用约 8–10px 的边缘内距。

### Inputs / Fields

- **Style:** 44px 高，台面黑底、发丝边界、8–10px 圆角，正文尺寸 13–15px。
- **Focus:** 使用全局柔珊瑚焦点轮廓，不能只移除浏览器 outline。
- **Error / Disabled:** 禁用主动作降至约 42% 不透明度并保持文字标签；错误用明确中文说明与重试入口。

### Navigation

移动端是 58px 高的四入口 dock，每项图标在上、10px 标签在下，当前项使用锈影底与柔珊瑚前景。900px 起转为 78px 左轨，每项为 60px 方形工作区，顶部出现克制的 `C` 品牌标记；导航名称、顺序和层级在两种布局中保持不变。

### Color Workbench

识色区把参考图与分析读数组成单一工作台。五色色板等分宽度，HEX 叠在半透明黑底上；HUE、SAT、BRI 三项使用等宽表格数字和细分隔线。详情 sheet 重复同一测量语法，形成跨页面的稳定识别。

### Saved Switcher

收藏与最近浏览使用二段分段控件，容器为台面黑，当前段为抬升炭灰；数量用 9px 等宽文字显示。它是收藏内部的二级切换，不与一级导航竞争。

**The 44px Control Rule.** 所有高频触控动作保持至少 44px 高或 44×44px，紧凑来自排版与间距而不是缩小可点击区域。

## Do's and Don'ts

### Do:

- Do keep the active tool and film imagery dominant in the first viewport.
- Do use near-black tonal layers and hairline borders before adding elevation.
- Do reserve warm rust and coral for current state, decisive actions, and feedback.
- Do keep color values, counts, angles, and percentages in measured mono typography.
- Do preserve the same four primary actions when the mobile dock becomes the desktop left rail.

### Don't:

- Don't turn CinePalette into a passive gallery that stops at browsing.
- Don't promote recent history into a fifth permanent navigation item.
- Don't spread the warm accent across large backgrounds or decorative gradients.
- Don't wrap film frames in ornamental cards, thick borders, or generic dashboard chrome.
- Don't replace precise Chinese task copy and measurable color data with mood labels.
