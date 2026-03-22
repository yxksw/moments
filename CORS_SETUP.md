# EdgeOne CORS 跨域配置指南

## 方案一：EdgeOne 控制台配置 HTTP 响应头（推荐）

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 选择你的站点
3. 进入 **规则引擎** -> **添加规则**
4. 配置规则：

```
规则名称: CORS 跨域配置
匹配条件: 请求路径 - 等于 - /recent-moments.json
          或 请求路径 - 前缀匹配 - /api/

操作:
  - 修改 HTTP 响应头
    - Access-Control-Allow-Origin: * (或指定域名)
    - Access-Control-Allow-Methods: GET, POST, OPTIONS
    - Access-Control-Allow-Headers: Content-Type, Authorization
    - Access-Control-Allow-Credentials: true
```

## 方案二：EdgeOne 边缘函数

1. 进入 **边缘函数** -> **创建函数**
2. 函数名称: `cors-handler`
3. 将 `edge-functions/cors.js` 中的代码复制到函数编辑器
4. 修改 `allowedOrigins` 为你的实际域名
5. 保存并发布
6. 进入 **规则引擎** 添加触发规则：
   - 匹配条件: 请求路径 - 等于 - /recent-moments.json
   - 操作: 执行边缘函数 - 选择 `cors-handler`

## 方案三：使用 Cloudflare Workers / Vercel Edge Functions

如果 EdgeOne 的边缘函数不满足需求，可以将 API 部分部署到支持边缘函数的平台。

## 测试 CORS 是否生效

使用 curl 测试：

```bash
# 测试预检请求
curl -X OPTIONS -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: GET" \
  -I https://your-domain.edgeone.app/recent-moments.json

# 查看响应头中是否包含 Access-Control-Allow-Origin
```

## 注意事项

1. 如果前端和 API 同源（同域名），不需要 CORS
2. `Access-Control-Allow-Credentials: true` 时，`Access-Control-Allow-Origin` 不能为 `*`，必须指定具体域名
3. 开发环境可以设置 `allowAllOrigins = true`，生产环境建议指定具体域名
