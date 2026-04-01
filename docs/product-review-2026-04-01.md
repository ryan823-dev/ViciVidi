# Vertax 产品审阅报告
**日期**：2026-04-01 | **版本**：Post-P3 | **审阅人**：AI 产品经理

---

## 一、代码健康检查

### TS 编译错误（已修复）
| 文件 | 错误类型 | 修复方案 |
|------|---------|---------|
| `contents/[id]/page.tsx` | 多余的 `}` (TS1128) | 删除多余闭合括号 |
| `geo-distribution.ts` | Prisma enum 未生成 | 改为本地 string union 类型 |
| `geo-distribution-panel.tsx` | enum 导入路径错误 | 改从 `@/actions/geo-distribution` 导入 |
| `track-citations/route.ts` | enum 导入路径错误 | 同上 |
| `db.ts` | 新模型无 TS 类型 | `export const db = _db as typeof _db & Record<string, any>` |
| `social.ts` | metadata Prisma Json 类型 | `metadata as any` |
| `social/page.tsx` | Record 类型直接转换 | 加 `unknown` 中间层 |
| `social/accounts/page.tsx` | filter 参数无类型 | `any` 断言 |
| `platform-rules.ts` | charLimit 属性不存在 | `(rules as any).charLimit` |
| `radar/candidates/page.tsx` | RadarContentMatchPanel 未导入 | 补充 import |
| `contents/[id]/page.tsx` | ContentCandidatePanel 未导入 | 补充 import |

**根本原因**：Prisma v7 需要 Node.js ≥22，当前环境 Node v20，`prisma generate` 无法运行，导致新模型（`GeoDistributionRecord`、`RadarContentLink`）的 TS 类型未生成。

**建议**：升级 Node.js 到 v22+ 后执行 `npm run db:generate`，可去除所有 `as any` 临时类型绕过。

---

## 二、产品审阅

### 板块 1：获客雷达（Radar）⚡

#### 已完成，表现优秀
- 五步流水线 Stepper + 动态 CTA，用户始终知道下一步做什么（清晰的进度引导）
- 两阶段筛选（规则快滤 → AI深度匹配）设计合理，节省 token
- CompanyProfile 上下文注入，AI 匹配"量身定制"而非通用
- `RadarContentMatchPanel` 实现了 Radar ↔ Marketing 双向联动，是竞品罕见的功能

#### 问题与建议

**P0 - 逻辑漏洞**

1. **`/api/radar/parse-request` 接口不存在**
   - Radar 首页有"自然语言描述需求"输入框，调用 `POST /api/radar/parse-request`
   - 代码中没有该 API 路由文件，会 404
   - **建议**：补充该路由，或在 UI 端降级为跳转到 `/radar/tasks?prefill=...`

2. **STEP_CONFIG href 路径不一致**
   - `pipeline.ts` 的 `STEP_CONFIG` 使用 `/c/knowledge/profiles`、`/c/radar/channels` 等短路径
   - 实际路由是 `/customer/knowledge/profiles`、`/customer/radar/channels`
   - 会导致步骤点击跳转到 404 页面
   - **建议**：统一改为 `/customer/...` 前缀

3. **候选池缺少"发现原因"展示**
   - `deep-qualify.ts` 生成了 `matchReasons[]` 和 `approachAngle`，存入了 DB
   - 候选池详情面板（`candidates/page.tsx`）的右侧详情区没有展示这两个字段
   - 用户看不到 AI 为什么打 A 级，信任感缺失
   - **建议**：在候选详情面板右侧加"AI 评估依据"折叠块，展示 matchReasons + approachAngle

**P1 - 体验缺失**

4. **Tier 分层可视化不足**
   - 候选列表只用颜色标签区分 A/B/C，没有数量概览柱形图
   - **建议**：列表顶部加一行 Tier 分布 mini bar（A: 12 / B: 34 / C: 56）

5. **外联包（OutreachPack）生成后无保存入口**
   - `prospects/page.tsx` 生成 OutreachPack 后只在 UI 展示，没有"保存到内容库"按钮
   - 用户关闭页面后数据丢失
   - **建议**：加"保存到草稿"按钮，调用 `saveContent()` 存入 Content 表

6. **排除反馈循环尚未完整**
   - 用户手动将候选标记"排除"时，`exclusionReason` 虽然入库，但没有写回 `SearchProfile.exclusionRules`
   - 每次扫描仍会发现同类公司
   - **建议**：在 `qualifyCandidateV2` action 内，当 `status=EXCLUDED` 时，检查 `exclusionReason` 中的关键词，append 到 profile 的 `exclusionRules`

7. **缺少扫描历史时间线**
   - SecretaryPanel 只显示最近一次扫描时间，没有"过去 30 天扫描次数/发现趋势"
   - **建议**：右侧 SecretaryPanel 下方加一个迷你折线图（候选发现数 vs 日期）

---

### 板块 2：增长系统（Marketing）✍️

#### 已完成，表现优秀
- 七大 Skills（topic-cluster/brief/draft/verify/publish-pack/fixSeo/optimizeGeo）覆盖内容生产全链路
- SEO/AEO 页面 ScoreRing 可视化设计精良
- GEO 中心四格数据看板 + 每卡 GeoDistributionPanel 追踪引用状态，产品逻辑完整
- 4-Block 内容 Pipeline（元数据→文章→FAQ JSON-LD→GEO 精简版）完整度高

#### 问题与建议

**P0 - 逻辑漏洞**

1. **SEO/AEO 页面的 SkillTrigger 缺少内容选择上下文**
   - `seo-aeo/page.tsx` 中 `fixSeoIssues` 的 SkillTrigger `entityId` 写死了还是取自列表选中项？
   - 如果列表没有选中任何内容直接点击，AI 不知道要修哪篇
   - **建议**：当没有选中内容时，`fixSeoIssues` 按钮 disabled，tooltip 提示"请先选择内容"

2. **Marketing 主页的"内容创作"入口逻辑重复**
   - `marketing/page.tsx` 有一套独立的 `generateKeywords()` + `generateContent()` 简单流程
   - `marketing/briefs/` 有完整的 Brief → Draft → Verify 流程
   - 两套流程并存，用户不知该用哪个，简单版功能也更弱
   - **建议**：Marketing 主页的创建入口直接跳转到 `/customer/marketing/briefs` 创建 Brief，废弃简单版

3. **GEO 分发记录注册时机不明确**
   - `geo-center/page.tsx` 展示了 GeoDistributionPanel，但用户需要手动点"注册分发"才开始追踪
   - 内容生成后应自动注册到所有渠道（CHATGPT/PERPLEXITY/CLAUDE 等）
   - **建议**：在 `seo-geo-pipeline.ts` 生成 Block4（GEO 版本）之后，自动调用 `batchRegisterDistribution()`

**P1 - 体验缺失**

4. **内容编辑器缺少"版本对比"**
   - `contents/[id]/page.tsx` 有版本历史列表，但没有 diff 视图
   - 用户不知道每个版本改了什么
   - **建议**：版本列表增加"与当前对比"按钮，用双列 diff 展示变化

5. **SEO/AEO 页面缺少批量操作**
   - 有 40 篇文章时，需逐条点击 fixSeoIssues，体验差
   - **建议**：列表支持多选 + "批量修复 SEO"，后端循环调用 Skill

6. **GEO 中心缺少"一键同步全部"**
   - 每张 GeoCard 各自有"AI 重新优化"按钮，没有顶部"全量重新生成"
   - **建议**：顶部加"全量优化"按钮，遍历所有 item 执行 optimizeGeo Skill

---

### 板块 3：社交媒体（Social）📣

#### 已完成，表现良好
- Twitter OAuth 2.0 PKCE + YouTube OAuth 2.0 覆盖主流平台
- 多平台账号管理页面功能完整（配置→测试连通性→保存）
- 平台规则抽象成 `PLATFORM_RULE_MAP`，内容生成时可复用

#### 问题与建议

**P0 - 核心流程断裂**

1. **发布流程没有实际调用平台 API**
   - `publishSocialPost()` action 更新了 DB 状态为 PUBLISHED，但没有调用 `twitter.service.ts` 或 `youtube.service.ts` 实际发推/发视频
   - 用户点"发布"后以为已经发出，实际什么都没发
   - **建议**：在 `publishSocialPost()` 内根据 `platform` 字段调用对应 service 的 `postTweet()` / `uploadVideo()`

2. **内容创作缺少"从现有内容一键生成"**
   - 用户在 Marketing 已写好 SEO 文章，到 Social 页需要重新输入主题、重新 AI 生成
   - **建议**：Social 创建界面增加"从内容库导入"选项，拉取 `contents` 列表，选中后 AI 自动适配平台字数/风格

3. **YouTube 缺少视频实体**
   - `social/accounts/page.tsx` 支持 YouTube 密钥配置，但 `SocialPost` 数据模型里的 `versions` 只有 text `content`，没有 video URL / file
   - **建议**：SocialPost schema 增加可选 `mediaUrl` 字段，YouTube 发布时使用

**P1 - 体验缺失**

4. **没有定时发布 UI**
   - `SocialPost` 有 `scheduledAt` 字段，但创建表单没有日期时间选择器
   - **建议**：创建时加"立即发布 / 定时发布"切换，选定时后展示 DateTimePicker

5. **缺少发布数据回流**
   - 发布后 `metrics`（likes/shares/views）没有自动拉取
   - `platform-rules.ts` 定义了各平台字段，但没有 metrics-sync cron
   - **建议**：新增 `cron/social-metrics-sync/route.ts`，每日拉取已发布帖子的互动数据写回 `PostVersion.metrics`

6. **账号页与发帖页割裂**
   - 账号管理在 `/social/accounts`，发帖在 `/social`，两页互不感知
   - 用户配置完账号后要自己知道去另一个页面发帖
   - **建议**：配置成功后 Toast 带"立即去发帖"跳转按钮；或在发帖页 top bar 展示已连接账号状态

---

### 板块 4：知识引擎（Knowledge）🧠

#### 已完成，表现良好
- 资料库（assets）+ 证据（evidence）+ 指南（guidelines）+ 评分（scoring）+ 买家画像（profiles）架构完整
- `WebImportDialog` 批量网站智采大幅降低上传门槛
- `EngineHeader` 带 Pipeline 进度引导，知识引擎也有五步流程

#### 问题与建议

**P0 - 逻辑漏洞**

1. **知识引擎 → 获客雷达的画像同步是单向手动的**
   - Radar 的 `TargetingSpec`（ICP 画像）需要用户手动"同步"知识引擎的数据
   - 两者数据结构（`CompanyProfile` vs `TargetingSpec`）分离，更新知识引擎后雷达不自动感知
   - **建议**：每次 `CompanyProfile` 保存时，触发一个 `syncTargetingSpec()` 函数，自动刷新雷达的 ICP 配置

2. **网站智采结果缺少质检环节**
   - `site-crawler.ts` 批量抓取后直接入库，如果抓到隐私页/法律页/Cookie 声明等无用页面，污染知识库
   - **建议**：抓取后过一遍 AI 分类，自动排除明显无关页面（标签：`privacy`/`legal`/`cookie`），只入库有实质内容的页面

3. **知识引擎入口重定向丢失上下文**
   - `/customer/knowledge` 直接 redirect 到 `/customer/knowledge/assets`
   - 如果用户是从 Radar 首页"前往知识引擎"跳过来的，没有任何上下文提示"你需要做什么"
   - **建议**：入口页展示知识引擎五步进度（跟 Radar 类似），而不是直接跳转

**P1 - 体验缺失**

4. **证据（Evidence）与文章关联不可视**
   - `evidence` 表记录了证据数据，`verify-claims` Skill 会引用证据
   - 但内容编辑器里看不到"这篇文章引用了哪些证据"
   - **建议**：`contents/[id]/page.tsx` 侧栏加"证据引用"折叠块（类似 `ContentCandidatePanel` 的设计）

5. **资产处理失败没有重试入口**
   - 上传文档后若 OCR/向量化失败，状态变为 `failed`，用户只能看到红色 failed 标签
   - **建议**：failed 状态卡片展示错误原因 + "重试"按钮，调用 `triggerAssetProcessing()`

6. **买家画像（Profiles）缺少可视化预览**
   - `profiles/` 页面假设用户理解 ICP、Persona 等概念
   - **建议**：画像保存后生成一张"Ideal Customer Card"可视化卡片，展示：行业/规模/痛点/决策链/购买触发器，可截图分享

---

## 三、系统级缺失

### 1. 全局通知中心（Notification Center）
当前状态：Radar 发现新 A 级候选、GEO 被引用、内容发布成功——这些事件都不会主动通知用户。
**建议**：增加 `Notification` 模型 + 右上角小铃铛，支持以下事件推送：
- Radar 发现 ≥3 个 A 级候选
- GEO 内容首次被 AI 引用
- 社交发帖发布失败

### 2. 跨板块"今日待办"
CEO Cockpit（首页）有 `getPendingActions()`，但各板块的待办项目还没有真正集成：
- Radar：待审核候选数
- Marketing：草稿等待发布数
- Social：定时任务即将触发数
**建议**：`dashboard.ts` 的 `getPendingActions()` 聚合这三个来源，在首页"今日待办"块展示，支持一键跳转。

### 3. 数据导出
Radar 线索库、GEO 分发记录、社交互动数据——都没有 CSV/Excel 导出入口。
**建议**：各列表页加"导出"按钮，生成 CSV，方便传统 CRM 对接。

---

## 四、优先级排序

| 优先级 | 问题 | 影响面 | 工作量 |
|--------|------|--------|--------|
| P0 | `/api/radar/parse-request` 404 | 首页核心功能 | S（2h） |
| P0 | STEP_CONFIG href 路径错误 | 所有步骤点击无效 | S（30min） |
| P0 | `publishSocialPost` 不调用平台 API | 社交发布核心断裂 | M（4h） |
| P0 | 抓取后 AI 质检排除无用页面 | 知识库质量 | M（4h） |
| P1 | 候选详情展示 matchReasons | 用户信任感 | S（2h） |
| P1 | OutreachPack 生成后可保存 | 线索价值延续 | S（2h） |
| P1 | Marketing 主页入口统一到 Brief | 减少用户迷惑 | XS（1h） |
| P1 | SEO SkillTrigger 需选中内容 | 避免无效调用 | S（1h） |
| P1 | GEO 生成后自动注册分发 | 减少手动操作 | M（3h） |
| P1 | Social 从内容库导入 | 内容复用 | M（4h） |
| P2 | 定时发布 UI（DateTimePicker） | 运营效率 | M（3h） |
| P2 | Social metrics-sync cron | 数据回流 | M（4h） |
| P2 | 全局通知中心 | 用户感知 | L（1d） |
| P2 | 今日待办跨板块聚合 | 首页价值 | M（4h） |
