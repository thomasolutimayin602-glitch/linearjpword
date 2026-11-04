# 語詞 · 日语背单词（toword-jp）

移动优先的日语背单词 Web App / PWA。产品范围、页面路由与验收标准见仓库上一级的 `拓词日语开发蓝图-v1.md` 和 `拓词英语版分析与日语版产品需求文档-v1.md`。

## 技术栈

- React 19 + TypeScript + Vite 8
- React Router 7
- Zustand
- Dexie / IndexedDB
- Tailwind CSS 4
- Vitest

## 常用命令

```sh
npm run dev      # 本地开发服务器
npm run build    # TypeScript 检查 + 生产构建
npm run lint     # oxlint
npm test         # Vitest 单元测试
npm run preview  # 预览生产构建
```

## 当前能力

- 欢迎页、协议确认、游客试学（10 题）、本地学习档案与 4 步 onboarding。
- 每日计划持久化，首页、档案页和训练会话共享同一份计划与完成进度。
- 五步训练链：听读 → 选义 → 选词 → 假名拼写 → 例句。
- 假名键盘（清音 / 浊音 / 拗音 / 片假名）、罗马音输入、平假名/片假名宽松判定。
- 1 / 7 / 15 / 30 天复习阶梯、置顶、错词本、错词专项训练、撤销。
- 查词、单词详情、收藏、学习统计、设置持久化。
- PWA manifest 与生产环境 Service Worker 离线壳。

## 目录

```text
src/
  components/   通用 UI 与图标
  data/         开发期种子词条
  db/           Dexie schema 与迁移
  engine/       复习调度、罗马音/假名判定
  lib/          本地日期等工具
  pages/        路由页面
  stores/       Zustand 学习状态
  types/        领域类型与默认设置
```

## 说明

- 当前内容为开发期种子数据，释义/例句仍待替换为「日语原文 + 中文释义」的授权内容模型。
- 账号、云同步、支付、语音评测与社区服务尚未接入；未配置的能力不会伪装为可用。
- 学习数据只保存在本机 IndexedDB。
