# EdgeOne Pages 部署指南

## 当前架构

- **Pages 托管**: EdgeOne Pages（腾讯云）
- **域名 DNS**: Cloudflare
- **域名**: 050815.xyz
- **CNAME**: moments-blog-xxx.edgeone.app

## 部署步骤

### 1. EdgeOne Pages 创建项目

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 点击顶部 **Pages** 标签
3. 点击 **创建项目**
4. 选择代码仓库（GitHub/GitLab）或上传静态文件
5. 配置构建设置：
   - 构建命令: `npm run build`
   - 输出目录: `out`
   - 根目录: `/`

### 2. 配置自定义域名

#### 方式一：使用 EdgeOne 分配的域名（简单）
- 部署成功后，EdgeOne 会分配一个域名如 `moments-blog-xxx.edgeone.app`
- 直接使用此域名访问

#### 方式二：使用自己的域名 050815.xyz（推荐）

**EdgeOne 端配置：**
1. 进入 EdgeOne 控制台 -> Pages -> 你的项目
2. 点击 **自定义域名** -> **添加域名**
3. 输入域名: `moments.050815.xyz` 或 `www.050815.xyz`
4. 记录 EdgeOne 提供的 CNAME 记录值

**Cloudflare DNS 配置：**
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com)
2. 选择域名 `050815.xyz`
3. 进入 **DNS** -> **记录**
4. 添加 CNAME 记录：
   ```
   类型: CNAME
   名称: moments（或 www）
   目标: moments-blog-xxx.edgeone.app（EdgeOne 提供的值）
   代理状态: 已代理（橙色云）或 仅 DNS（灰色云）
   TTL: 自动
   ```

### 3. 配置 CORS 跨域

由于 `edgeone.json` 已配置，部署后会自动生效：
- `/recent-moments.json` 已添加 CORS 响应头
- 允许所有来源访问 (`*`)
- 支持 GET 和 OPTIONS 方法

### 4. 验证部署

部署完成后，访问以下地址验证：

```bash
# 测试主页面
curl https://moments.050815.xyz

# 测试 JSON API（带 CORS）
curl -H "Origin: https://example.com" \
  -I https://moments.050815.xyz/recent-moments.json

# 检查响应头中是否有 Access-Control-Allow-Origin: *
```

## 常见问题

### 1. 域名解析不生效
- 检查 Cloudflare DNS 记录是否正确
- 等待 DNS 传播（通常几分钟到几小时）
- 使用 `nslookup moments.050815.xyz` 检查解析

### 2. SSL 证书问题
- EdgeOne Pages 会自动配置 SSL 证书
- 确保 Cloudflare 的 SSL/TLS 模式设置为 **完全（严格）** 或 **完全**

### 3. CORS 不生效
- 检查 `edgeone.json` 是否已提交到仓库
- 重新部署项目
- 清除浏览器缓存

### 4. 静态资源 404
- 检查 `next.config.js` 的 `output: 'export'` 配置
- 确认 `out` 目录包含所有文件

## 更新部署

每次代码更新后：
1. 提交代码到 Git 仓库
2. EdgeOne Pages 会自动触发重新部署
3. 等待部署完成（约 1-2 分钟）

## 环境变量（可选）

如果需要在构建时使用环境变量：
1. EdgeOne Pages 控制台 -> 项目设置 -> 环境变量
2. 添加变量：
   - `NEXT_PUBLIC_TWIKOO_URL`
   - `NEXT_PUBLIC_BLOG_URL`
