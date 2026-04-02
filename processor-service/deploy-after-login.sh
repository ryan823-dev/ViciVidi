#!/bin/bash
# Railway 一键部署脚本（登录后执行）
# 使用方法: ./deploy-after-login.sh

set -e

echo "=========================================="
echo "Vertax Processor Service - Railway 部署"
echo "=========================================="
echo ""
echo "前提条件: 已执行 railway login 并完成浏览器认证"
echo ""

# 检查 Railway CLI 认证状态
echo "检查 Railway 认证状态..."
if ! railway whoami 2>/dev/null; then
    echo "错误: 未登录 Railway，请先执行: railway login"
    exit 1
fi

echo ""
echo "认证成功，开始部署流程..."
echo ""

# 步骤 1: 初始化项目
echo "步骤 1: 创建 Railway 项目"
echo "----------------------------------------"
if railway project list 2>/dev/null | grep -q "vertax-processor"; then
    echo "项目已存在，跳过创建"
else
    echo "创建新项目..."
    railway init --name vertax-processor 2>/dev/null || {
        echo "请手动执行: railway init"
        echo "选择 'Empty Project'，命名 'vertax-processor'"
        read -p "完成后按 Enter 继续..."
    }
fi

# 步骤 2: 设置环境变量
echo ""
echo "步骤 2: 设置环境变量"
echo "----------------------------------------"
echo "请提供以下配置信息:"
echo ""

# 从主应用 .env 获取数据库 URL 提示
read -p "DATABASE_URL (PostgreSQL 连接字符串): " DB_URL
read -p "OSS_REGION (默认 oss-cn-hangzhou): " OSS_REGION
OSS_REGION=${OSS_REGION:-oss-cn-hangzhou}
read -p "OSS_ACCESS_KEY_ID: " OSS_KEY_ID
read -p "OSS_ACCESS_KEY_SECRET: " OSS_KEY_SECRET
read -p "OSS_BUCKET: " OSS_BUCKET

# 生成随机 API Key
API_KEY=$(openssl rand -base64 32)
echo "PROCESSOR_API_KEY 已自动生成: $API_KEY"
echo ""

# 设置所有环境变量
echo "设置环境变量..."
railway variables set DATABASE_URL="$DB_URL"
railway variables set DIRECT_URL="$DB_URL"
railway variables set OSS_REGION="$OSS_REGION"
railway variables set OSS_ACCESS_KEY_ID="$OSS_KEY_ID"
railway variables set OSS_ACCESS_KEY_SECRET="$OSS_KEY_SECRET"
railway variables set OSS_BUCKET="$OSS_BUCKET"
railway variables set PROCESSOR_API_KEY="$API_KEY"
railway variables set NODE_ENV="production"

echo "环境变量设置完成"
echo ""

# 步骤 3: 部署
echo "步骤 3: 部署服务"
echo "----------------------------------------"
railway up

echo ""
echo "步骤 4: 配置域名"
echo "----------------------------------------"
# 生成 Railway 域名
railway domain

# 获取服务 URL
SERVICE_URL=$(railway domain 2>/dev/null | tail -1)
echo ""
echo "服务 URL: $SERVICE_URL"
echo ""

# 步骤 5: 健康检查
echo "步骤 5: 健康检查"
echo "----------------------------------------"
echo "等待服务启动..."
sleep 10

if curl -s "${SERVICE_URL}/health" | grep -q "ok"; then
    echo "健康检查通过!"
else
    echo "健康检查失败，请检查日志:"
    railway logs
fi

echo ""
echo "=========================================="
echo "部署完成!"
echo "=========================================="
echo ""
echo "请将以下环境变量添加到 Vercel (主应用):"
echo ""
echo "  PROCESSOR_SERVICE_URL = $SERVICE_URL"
echo "  PROCESSOR_API_KEY = $API_KEY"
echo ""
echo "查看部署状态: railway status"
echo "查看日志: railway logs"
echo ""