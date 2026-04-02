# Vertax Processor Service

独立文档处理微服务，用于处理大型文档和图片 OCR。

## 功能

- **PDF 处理**: 使用 pdf-parse 提取文本
- **Word 处理**: 使用 mammoth 提取文本
- **图片 OCR**: 使用 Tesseract.js 进行中英文 OCR
- **视频帧 OCR**: 处理预提取的视频帧（需主应用提取）

## API 接口

### 健康检查
```
GET /health
Response: { status: "ok", timestamp: "..." }
```

### 单文件处理
```
POST /process
Body: {
  assetId: string,
  storageKey: string,
  mimeType: string,
  tenantId: string,
  apiKey: string
}
Response: {
  success: boolean,
  assetId: string,
  textLength: number,
  chunkCount: number
}
```

### 批量处理
```
POST /process/batch
Body: {
  assets: [...],
  apiKey: string
}
```

## Railway 快速部署

Railway CLI 已安装。请在终端执行以下命令：

```bash
# 进入项目目录
cd /Users/oceanlink/Documents/Qoder-1/processor-service

# 步骤 1: 登录 Railway (会打开浏览器进行 OAuth 认证)
railway login

# 步骤 2: 创建项目
railway init
# 选择 "Empty Project"，命名为 "vertax-processor"

# 步骤 3: 设置环境变量 (替换为你的实际值)
railway variables set DATABASE_URL="你的数据库URL"
railway variables set DIRECT_URL="你的数据库URL"
railway variables set OSS_REGION="oss-cn-hangzhou"
railway variables set OSS_ACCESS_KEY_ID="你的OSSKeyId"
railway variables set OSS_ACCESS_KEY_SECRET="你的OSSSecret"
railway variables set OSS_BUCKET="你的Bucket名"
railway variables set PROCESSOR_API_KEY="$(openssl rand -base64 32)"

# 步骤 4: 部署服务
railway up

# 步骤 5: 获取服务 URL
railway domain

# 步骤 6: 验证部署
curl https://你的域名.railway.app/health
```

### GitHub 自动部署（备选方案）

1. 打开 https://railway.app/dashboard
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 `ryan823-dev/vertax` 仓库
4. 设置 Root Directory: `processor-service`
5. 在 Variables 标签添加所有环境变量
6. Railway 会自动部署并监控更新

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | ✓ |
| DIRECT_URL | Prisma 直接连接 URL | ✓ |
| OSS_REGION | 阿里云 OSS 区域 | ✓ |
| OSS_ACCESS_KEY_ID | OSS Access Key | ✓ |
| OSS_ACCESS_KEY_SECRET | OSS Secret | ✓ |
| OSS_BUCKET | OSS Bucket 名称 | ✓ |
| PROCESSOR_API_KEY | API 认证密钥 | ✓ |
| PORT | 服务端口（默认 3001） | |
| LOG_LEVEL | 日志级别（默认 info） | |

## 本地开发

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 启动服务
npm run dev
```

## 主应用集成

在主应用 `.env` 中添加：
```
PROCESSOR_SERVICE_URL=https://your-service.railway.app
PROCESSOR_API_KEY=<相同的密钥>
```

处理逻辑会自动选择：
- 小文件 (<8MB): 浏览器端处理
- 大文件/图片: 微服务处理
- 其他: 服务端本地处理