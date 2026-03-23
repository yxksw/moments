# GitHub Actions 工作流说明

## 工作流：手动部署到 EdgeOne Pages

### 功能

- ✅ 手动触发部署
- ✅ 支持生产环境/预览环境选择
- ✅ 自动拉取最新 Notion 数据
- ✅ 自动部署到 EdgeOne Pages

### 使用方法

#### 1. 配置 GitHub Secrets

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中添加以下 secrets：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `NOTION_TOKEN` | Notion API Token | [Notion Integrations](https://www.notion.so/my-integrations) |
| `NOTION_DATABASE_ID` | Notion 数据库 ID | 从 Notion 页面 URL 中获取 |
| `NEXT_PUBLIC_TWIKOO_URL` | Twikoo 评论系统 URL | 你的 Twikoo 服务地址 |
| `NEXT_PUBLIC_BLOG_URL` | 博客 URL | 如 `https://m.050815.xyz` |
| `EDGEONE_TOKEN` | EdgeOne API Token | [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone) |
| `EDGEONE_PROJECT_ID` | EdgeOne Pages 项目 ID | EdgeOne Pages 项目设置中查看 |

#### 2. 获取 EdgeOne Token

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 点击右上角头像 → **API 密钥管理**
3. 创建新的 API 密钥，复制 Token

#### 3. 获取 EdgeOne Project ID

1. 进入 EdgeOne Pages 项目
2. 点击 **项目设置**
3. 复制 **项目 ID**

#### 4. 触发部署

1. 进入 GitHub 仓库的 **Actions** 标签
2. 选择 **手动部署到 EdgeOne Pages** 工作流
3. 点击 **Run workflow**
4. 选择部署环境（production/preview）
5. 点击 **Run workflow** 开始部署

### 工作流程

```
手动触发
    ↓
检出代码
    ↓
安装依赖
    ↓
设置环境变量
    ↓
构建项目（拉取最新 Notion 数据）
    ↓
上传构建产物
    ↓
部署到 EdgeOne Pages
    ↓
显示部署地址
```

### 注意事项

1. **环境变量**：确保所有 Secrets 都已正确配置
2. **Notion 数据**：每次部署都会拉取最新的 Notion 数据
3. **构建时间**：通常需要 2-5 分钟
4. **部署地址**：工作流完成后会显示部署地址

### 故障排查

#### 构建失败
- 检查 `NOTION_TOKEN` 和 `NOTION_DATABASE_ID` 是否正确
- 检查 Notion 数据库是否允许集成访问

#### 部署失败
- 检查 `EDGEONE_TOKEN` 是否有效
- 检查 `EDGEONE_PROJECT_ID` 是否正确
- 确保 EdgeOne Pages 项目已创建

#### 数据未更新
- 确认 Notion 中已添加新内容
- 检查工作流日志中的构建输出
