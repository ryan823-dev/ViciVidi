# Railway 部署命令清单
# 复制并粘贴到终端执行

# ==========================================
# 步骤 0: 登录 Railway (需要浏览器)
# ==========================================
cd /Users/oceanlink/Documents/Qoder-1/processor-service
railway login

# ==========================================
# 步骤 1: 创建项目
# ==========================================
railway init --name vertax-processor

# ==========================================
# 步骤 2: 设置环境变量
# ==========================================
# 替换以下值为你实际的配置

railway variables set DATABASE_URL="postgresql://user:password@host:5432/database"
railway variables set DIRECT_URL="postgresql://user:password@host:5432/database"
railway variables set OSS_REGION="oss-cn-hangzhou"
railway variables set OSS_ACCESS_KEY_ID="your-oss-key-id"
railway variables set OSS_ACCESS_KEY_SECRET="your-oss-secret"
railway variables set OSS_BUCKET="your-bucket-name"
railway variables set PROCESSOR_API_KEY="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"

# ==========================================
# 步骤 3: 部署
# ==========================================
railway up

# ==========================================
# 步骤 4: 获取 URL
# ==========================================
railway domain

# ==========================================
# 步骤 5: 验证健康状态
# ==========================================
# 替换 URL 为上一步获取的域名
curl https://your-service.railway.app/health

# ==========================================
# 步骤 6: 查看日志 (如有问题)
# ==========================================
railway logs

# ==========================================
# 完成! 在 Vercel 设置以下环境变量:
# ==========================================
# PROCESSOR_SERVICE_URL = Railway 提供的 URL
# PROCESSOR_API_KEY = 你设置的密钥