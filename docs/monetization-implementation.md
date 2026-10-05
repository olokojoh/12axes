# 付费报告实施记录 - 2026-10-03

## 当前状态

正式站：https://12axes.net ，对应 Cloudflare Pages 的 GitHub `main` 分支。沙盒预览：https://dev.12axes-1dg.pages.dev ，使用 `dev` 预览分支。全部支付验收使用 Stripe 沙盒，不使用 Link，不进行真实扣款。正式站使用生产收款配置；预览继续使用测试密钥、价格与 webhook。

用户明确批准 Cloudflare D1 保存加密结果，要求跳过内容授权核查，保留既有免费结果，以 US$4.99 一次性报告变现。未做真实付款；测试卡产生的订单不能算真实收入。

## 已实施

- 保留 36 / 60 / 240 题、12 轴百分比、既有意识形态 / 国家 / 人物匹配及免费分享。增加可选一次性报告，未加订阅、假折扣或结果拦截弹窗。
- 付费内容为逐轴方向与中点偏离说明、轴阅读指南、前 10 意识形态匹配、私人链接和浏览器打印 / 保存 PDF。没有声称国家人口均值、科学诊断或永久访问。
- 六类商业页面各有五语版本，共 30 页。单独征求结果存储同意；不声称匿名、不声称结果完全不保存。
- GA4 脚本先取得分析同意才加载。事件仅允许 `variant`、`language`、`device`、`quiz_length`、`entry_type`；页面路径剔除参数和凭证。代码关闭 Google Signals 与广告个性化；预览没有第三方广告脚本。
- Cloudflare D1 用 AES-GCM 保存结果快照；不保存逐题答案。订单关联付款邮箱；私人令牌哈希用于查询，加密副本用于找回。密钥不能在已有记录时直接替换。
- 免费分享另需同意；保存加密分数与题量一年。分享链接不携带分数、实验分组或付费凭证。
- Stripe Checkout → 验签 webhook → 订单授权 → Cloudflare Queue → Resend 邮件。只由已付款成功事件授权；页面跳转不会解锁。
- 以订单身份生成邮件幂等键，重复 / 不同成功事件不会生成不同邮件。持久队列写入失败时 webhook 返回可重试失败，不提前确认。
- 支持邮箱找回、付款页直接复制私人报告链接、退款后撤销访问；无法收回已保存的 PDF。
- 支持请求加密存储，有输入验证和邮箱频率限制。操作脚本支持查看、标记处理、删除结果；标记处理不会退款。
- 葡语页面显示有来源和日期的 BRL 参考价；实际扣款为 USD，披露银行汇兑 / 税费差异。汇率超过七天不展示。
- 当前实验版本为 `baseline`；尚未开启 A/B，也没有转化率或实验获胜结论。

## 线上资源

| 资源 | 状态 |
| --- | --- |
| Cloudflare Pages `12axes` | 正式站与沙盒预览均已部署 |
| D1 `12axes-db` | 已创建，迁移 0001-0003 已应用 |
| Queue `12axes-report-email` | 已创建，Worker 消费者运行 |
| DLQ `12axes-report-email-failed` | 已启用 HTTP 取回；重发脚本在线测试通过 |
| Resend | 复用默认 Google 账户；`reports.12axes.net` 已验证 |
| SPF / DKIM / DMARC | 已配置；配置完成不等于收件箱送达保证 |
| 邮件 Worker | 版本 `97b64f98-bd6f-491c-b465-49f0415388c5`，邮件链接已指向正式域名；已增加收信原因和帮助 / 退款入口 |
| Stripe 测试价格 | 英语、葡语、西语、俄语、中文分别绑定对应的 499 USD cents 测试价格 |
| Stripe 测试 webhook | 四类 Checkout 成功 / 延迟成功 / 延迟失败 / 退款事件 |
| Stripe 生产配置 | 五语分别绑定对应的 499 USD cents 正式价格；Pages 两环境密钥与变量已配置 |
| Stripe 真实 webhook | `we_1UM9lZLKxZkUyWipVrr9sJjB` 已恢复指向正式站 `https://12axes.net/api/stripe/webhook` |

Stripe 香港账户同时服务其他产品，只添加本站配置，不覆盖其他产品全局设置。

## 已验证

- 最新五语画像翻译部署后，构建、TypeScript、ESLint 通过，22 项自动测试通过；预览与正式站的五语结果页及匹配接口已核验。
- 英语、葡语、西语、俄语、中文的沙盒 Checkout 均显示本地化商品名、说明、条款及退款链接，金额为 US$4.99，均为 `cs_test_` 会话；五个正式定价页返回 200，正式环境的五个价格绑定已只读核对。
- 线上 Stripe 测试卡 Checkout 成功；订单由 webhook 标记 paid，队列发送报告邮件；葡语页面展示 12 条个性化说明及前 10 匹配。
- 邮箱找回实际可用，两封报告邮件均到达 **Gmail Spam**，不能把它计为收件箱送达通过。
- 没有 Cookie 的报告请求返回 paid，证明账号不是访问前提。
- Stripe 原测试成功事件重签名并重放两次，均返回 200，邮件发送时间未改变。
- Stripe 实际测试退款 499 cents 后，订单 revoked，报告接口不可访问。已验证退款流程，但未发生真实资金退款。
- 同一合成测试订单再执行数据删除：结果密文、令牌密文、邮箱被清除；订单保留 revoked 和会计字段。
- 将已撤权测试订单送入 DLQ 后，重发脚本跳过它；没有误发报告邮件。
- Stripe 测试模式 3DS 挑战实际完成，浏览器返回解锁的葡语报告，订单 paid，队列发信完成。该合成订单全额测试退款后撤权，报告接口返回 404，随后清除结果密文、令牌密文及邮箱。
- 真实模式 Checkout 已创建，API 确认 `livemode=true`、499 USD cents、必选条款及预览站成功 / 取消返回地址。实际点击取消后，浏览器恢复 12 轴免费结果，没有付费解读；这不是已付款订单。
- 原真实结账会话已过期，支付状态仍为 unpaid，没有真实扣款。本站新 Checkout 会话明确关闭 Link；后续验收仅使用沙盒测试卡。
- 通过公共 DNS 查询确认 SPF、DKIM、DMARC 已生效；DMARC 当前为 `p=none`。现有 Resend 密钥只有发信权限，不能读取投递详情；垃圾箱诊断仍需在浏览器查看 Gmail 收件头和 Resend 后台。
- 线上付费报告在 390 × 844 和 1280 × 900 CSS 像素下均无横向溢出，私人链接复制按钮可用。
- 修复 `gtag` 使用数组导致不发送 collect 请求的问题，改用 Google 标准 Arguments 对象。新版预览定价页未同意时没有 GA 脚本 / 请求；同意后实际发出 `page_view`，页面地址不带参数、referrer 为空，没有政治结果或报告凭证字段。
- 同一默认 Google 账户的 GA4 管理端尚未找到 `G-CE8EXPY4K6` 对应资源，没有修改所见的其他网站资源，也没有创建替代资源。
- 恢复沙盒配置时重新写入原加密密钥与两个环境的支付密钥，修复一次预览 Checkout 503；没有轮换加密密钥。
- 最新沙盒会话 API 确认 `livemode=false`、499 USD cents、`wallet_options.link.display=never`、必选条款；页面显示沙盒并可直接输入测试卡，无 Link 验证。
- 最新测试卡完成支付后，实际 webhook 授权报告；无需 Cookie 的接口返回完整 12 轴和前 10 匹配。新版邮件已到达 Gmail，报告链接匹配该订单，但仍在 Spam。
- 最新沙盒全额退款成功，实际退款 webhook 撤权，报告接口返回 404。随后清除该测试订单的结果、邮箱和报告凭证。
- 正式发布后通过只读 Stripe API 核对生产价格与正式 webhook；Pages 生产部署的 D1、队列、价格与域名绑定均通过。正式首页、葡语 / 西语首页和商业页面返回 200，未授权 webhook 返回 400。未创建新的真实结账会话或真实扣款。

## 仍待完成

1. 进一步诊断 Gmail Spam；四封报告邮件均在 Spam，包含最新模板，未验证 Outlook / 巴西邮箱的收件箱送达。保留直接复制链接与 PDF 作为即时交付方式，不承诺邮件一定进入收件箱。
2. 找到或取得现有 GA4 资源权限，检查增强型衡量和数据分享设置。代码过滤及 collect 请求通过不能代替管理端验收。
3. 收款稳定后按语言 × 设备固定浏览器分组测试两种 CTA；分享链接不携带分组。用净收入判读，并检查分享率 / 完成率；没有同意 GA4 的人群不可由 GA4 样本直接代表。

## 每日运营

本机环境需有 `CLOUDFLARE_API_TOKEN`，不要把令牌放进命令参数。下面的 `show` 会展示私人请求内容，不能上传公共日志。

```bash
node --experimental-strip-types scripts/support-inbox.mjs list
node --experimental-strip-types scripts/support-inbox.mjs show <请求编号>
node scripts/retry-report-emails.mjs
```

每天检查未处理请求、DLQ 和 Stripe 失败 / 退款 / 争议订单。DLQ 每次处理最多十条，先解决发信故障再重发；脚本失败会保留未确认的任务，租约到期可重试。服务商接受邮件不能证明进入收件箱。

退款在 Stripe 执行，确认全额退款后再核对撤权。删除请求必须先验证所有权：表单填入的邮箱、订单号或公开分享链接本身不构成身份验证。通过付款邮箱的验证流程或私人凭证确认本人请求；证据不足时不要仅凭未验证表单删除他人记录。

```bash
node --experimental-strip-types scripts/support-inbox.mjs delete-report <订单编号>
node --experimental-strip-types scripts/support-inbox.mjs delete-share <分享编号>
node --experimental-strip-types scripts/support-inbox.mjs resolve <请求编号>
```

`delete-report` 删除政治结果与访问凭证、清除邮箱并撤权，保留会计字段；`delete-share` 删除分享结果；`resolve` 只标记已处理。公开链接是访问凭证，不应当作创建者身份凭证。

## 数据与限制

- 密钥只存在忽略目录 `.openai` 或 Cloudflare secret，文件权限 0600；不得提交到 git。
- 本地匹配导入固定来源提交 `40ec789a2843232b30ae5e5fbeea66208ef3e88e`：250 意识形态、199 国家画像、418 人物。五语名称、说明和人物身份已接入匹配接口；授权核查按用户要求跳过。
- 旧带分数 URL 在到达边缘前无法由前端清除，不能声称历史 CDN / 日志从未有分数。新私人链接使用 fragment，并通过 POST 取回报告。
- 请求日志、错误追踪不得记录答案、结果、报告凭证或请求体。存储加密不是匿名化。
