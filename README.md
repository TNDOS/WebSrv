# TNDOS 官网 / WebSrv

TNDDOS 的下载与介绍页。**纯静态**，没有构建步骤，没有依赖 —— 直接推到 GitHub Pages 就能用。

## 它解决什么问题

历史版本其实一直都在：GitHub 对每个 tag 都会自动生成源码归档，
URL 是确定性的：

```
https://github.com/TNDOS/<repo>/archive/refs/tags/<tag>.tar.gz
https://github.com/TNDOS/<repo>/archive/refs/tags/<tag>.zip
```

**源码从来不会丢。** 问题只是这个入口太隐蔽、没有说明、也没有一个地方能一次看到全部历史。
这个页面就是那个地方。

## 为什么不用 GitHub API 取版本列表

匿名调用 api.github.com 是 **每小时 60 次、按 IP 计**，
共享出口很容易直接吃 403（我们实测撞到过）。如果一个下载页要靠它才显示得出来，
那它随时会白屏。

所以：**版本清单是提交在仓库里的 `data/versions.json`**，页面只读它。
发布新版本时更新这个文件 —— 或者等 CI 刷新（见下）。

唯一需要联网的是**下载链接本身**，那走的是 github.com 的归档地址，不受 API 限流影响。

## 目录

```
index.html                     页面
assets/style.css               样式（用 TNDDOS 自己的 VGA 调色板）
assets/app.js                  渲染版本列表
data/versions.json             版本清单（唯一的真相来源）
.github/workflows/refresh.yml  可选：定时从 GitHub API 刷新清单
```

## 加一个新版本

在 `data/versions.json` 对应的组件里，往 `versions` 数组**最前面**插一条：

```json
{
  "tag": "v0.3.2-M3",
  "date": "2026-10-02",
  "sha": "abc1234",
  "latest": true,
  "subject_zh": "一句话中文说明",
  "subject_en": "one-line English description"
}
```

记得把上一条的 `latest` 去掉。

## 附件（内核 / 构建产物）

页面会渲染 `assets` 数组里的任何条目。它对应 GitHub Release 的附件：

```json
"assets": [
  { "name": "esp.img", "size": 33554432, "label": "可启动磁盘映像" },
  { "name": "kernel.efi", "size": 67072, "label": "内核映像" }
]
```

链接会自动指向 `releases/download/<tag>/<name>`。
**要产出这些附件需要在 CI 里构建**（见 TNDOS-SysCore 的 `.github/workflows/`）——
在那之前，这一项是空的，页面不会显示悬空链接。

## 部署

推到 `main`，然后在仓库 Settings -> Pages 里选 **Deploy from a branch** -> `main` / `/ (root)`。

**私有仓库 + GitHub Pages 需要付费计划**（Pro/Team/Enterprise）。
免费账号下 Pages 只能用于公开仓库 —— 如果这个仓库要保持私有，
页面本身就没法用 Pages 托管，得换 Netlify / Cloudflare Pages / 自己的服务器。
**页面里没有任何私密内容**（全是公开仓库的下载链接），所以设成公开更省事。
