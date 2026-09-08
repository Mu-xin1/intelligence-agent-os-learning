# AI FDE 三周实战学习页

公开的独立静态课程，沿用已有学习工作台的周 / 日目录与展开式学习结构。课程为 3 周、15 个练习日，每日按 20 分钟理解、80 分钟操作、20 分钟复盘安排。

## 维护

- `source/course.mjs`：课程正文与官方学习资料。
- `source/styles.css`：响应式布局、深浅色与打印样式。
- `source/progress.mjs`：本地进度与备份格式；使用独立存储键。
- `source/app.js`：搜索、导航、笔记、进度、导入导出。
- `build.mjs`：生成正文完整、脚本样式内嵌的两份 HTML。

在仓库根目录运行 `node fde-practice/build.mjs`。无需安装依赖。运行 `node --test fde-practice/source/progress.test.mjs` 验证备份与验收状态的边界。

HTML 可直接托管于 GitHub Pages。用户笔记不进入仓库，也不会被页面上传；点击资料链接会前往对应外部网站。浏览器记录不同步，换设备可导出和导入 JSON。

## 验证范围

执行内容完整性、HTML 引用、内嵌脚本语法、进度归一化和备份边界检查。未进行浏览器视觉或交互验收。

浏览器若提供 `document.modelContext`，页面可注册只读进度与课程导航工具。不支持该接口时不影响课程使用。本次环境未执行受支持 WebMCP 上下文中的合同验证，不能声称已验证这两个工具。
