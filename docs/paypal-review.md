# PayPal 审核收款说明

OmniMedia 现在提供完整的数字服务收款流程：

1. 访问 `https://useomnimedia.com/pricing/`，点击「登录 / 注册」，使用 Clerk 创建或登录账户。
2. 在账户中心选择「使用 PayPal 支付」。服务器通过 PayPal Orders API 创建固定金额的数字服务订单。
3. 页面跳转到 PayPal 官方结账页。买家登录 PayPal、确认金额并付款。
4. PayPal 将买家返回 `https://useomnimedia.com/billing/success/`。服务器校验当前 Clerk 用户与订单的绑定关系，并调用 Capture API 完成扣款。
5. 成功页显示支付完成和订单额度；账户页可以查看订单状态、金额、时间和支付方式。
6. 如果买家取消，会返回 `/billing/cancel/`，页面明确显示未产生扣款。

## 提交审核时可截图的页面

- `https://useomnimedia.com/pricing/`：产品名称、价格、数字服务说明和 PayPal 按钮。
- Clerk 登录/注册弹窗：说明账户创建和身份绑定。
- PayPal 官方结账页：显示 OmniMedia、金额和无物流数字服务。
- `https://useomnimedia.com/billing/success/`：支付完成确认页。
- `https://useomnimedia.com/account/`：订单历史和已记录额度。

## 商品与退款说明

- 商品：OmniMedia Creator Credits，数字媒体处理额度，不发货。
- 价格和币种由服务器端环境变量固定，浏览器不能修改金额。
- 每个订单只允许为创建该订单的 Clerk 用户 Capture，重复回调采用幂等处理。
- 退款、争议和账户支持请通过网站支持入口联系，并提供 PayPal 交易号。

## 上线前配置

在 Railway Variables/Secrets 中配置 Clerk 和 PayPal 的变量（真实 Secret 不要写入仓库）：

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_ISSUER`（例如 Clerk 实例的 HTTPS issuer）
- `CLERK_JWKS_URL`（例如 issuer 后的 `/.well-known/jwks.json`）
- `PAYPAL_ENVIRONMENT=sandbox`（审核测试阶段）或 `live`（正式收款）
- `PAYPAL_CLIENT_ID`、`PAYPAL_CLIENT_SECRET`
- `PUBLIC_APP_URL=https://useomnimedia.com`
- `DATABASE_PATH=/data/omnimedia.db`，并在 Railway 挂载 `/data` Volume 以持久化订单记录

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 必须作为 Railway 的 Build Variable（同时保留为运行时 Variable），因为 Next.js 静态导出会在镜像构建时嵌入公钥。PayPal Secret、Clerk issuer/JWKS 仍只在运行时作为 Secret/Variable 使用。
