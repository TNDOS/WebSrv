# 贡献 / Contributing

## 1. 提交信息必须双语 / Commit messages must be bilingual

**主题行 = 中文 + English，一行。**

```
站点：版本清单加缓存绕过，补一份 CONTRIBUTING  Site: cache-bust the manifest, add CONTRIBUTING
```

正文可以以中文为主，但**主题行必须有英文**。
仓库是公开的，看不懂中文的人至少要知道这次提交干了什么。

## 2. 页面文案中文在前 / Chinese first in page copy

每段文案都是 `<span lang="zh">` 紧跟 `<span lang="en">`，**中文在前**。
中文用户不该被迫先跳过一段英文。

**英文是全文，不是摘要** —— 同一处内容，中文有什么，英文就要有什么。

## 3. 版本清单 / The version manifest

`data/versions.json` 是页面唯一的数据源，**页面本身不碰 GitHub API**。

```
手工加版本     直接编辑 versions.json（README 里有字段说明）
自动刷新       node tools/refresh.mjs   —— 从 GitHub Releases 重建列表；
              API 失败时保留原清单，不会把已经正确的东西写坏
tag 与 release 索引跟着 Release 走。只有 tag 没有 Release 的版本不会出现在页面上
```

## 4. 链接 / Links

**站内链接用相对路径；指向仓库文件的链接用绝对地址。**

Release 正文里的相对链接会按「该 tag 下的仓库根目录」解析，
和仓库里 `docs/` 下的解析基准不同 —— 同一行文字在两边一个通一个 404。

## 5. 改完要验 / Verify before committing

```
node tools/verify-links.mjs     所有外链必须是 200
node tools/serve.mjs            本地起一个服务看渲染效果
```

**「看起来对」不等于「跑过」。**
