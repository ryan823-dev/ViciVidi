#!/bin/bash

# ============================================
# ViciVidi AI - Stripe 快速配置脚本
# ============================================

echo "🎯 ViciVidi AI - Stripe 配置向导"
echo "================================"
echo ""

# 检查是否已存在 .env.local
if [ -f ".env.local" ]; then
  echo "⚠️  检测到 .env.local 已存在"
  echo "   建议先备份：mv .env.local .env.local.backup"
  echo ""
  read -p "是否继续？(y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 1
  fi
fi

# 复制模板
echo "📋 正在创建 .env.local 文件..."
cp .env.stripe-example .env.local
echo "✅ 创建成功！"
echo ""

# 提示用户编辑
echo "📝 现在请编辑 .env.local 文件："
echo ""
echo "1. 打开文件："
echo "   code .env.local  (VS Code)"
echo "   或 nano .env.local"
echo "   或 vim .env.local"
echo ""
echo "2. 替换以下占位符为你的 Stripe 密钥："
echo "   - sk_test_YOUR_SECRET_KEY_HERE"
echo "   - pk_test_YOUR_PUBLISHABLE_KEY_HERE"
echo "   - whsec_YOUR_WEBHOOK_SECRET_HERE"
echo ""
echo "📖 详细配置指南："
echo "   查看 docs/STRIPE_SETUP_GUIDE.md"
echo ""
echo "🔗 Stripe Dashboard:"
echo "   https://dashboard.stripe.com/test/apikeys"
echo ""

# 询问是否需要帮助
read -p "需要我帮你打开 Stripe Dashboard 吗？(y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # 根据操作系统打开浏览器
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://dashboard.stripe.com/test/apikeys"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://dashboard.stripe.com/test/apikeys"
  else
    echo "请手动访问：https://dashboard.stripe.com/test/apikeys"
  fi
fi

echo ""
echo "✨ 配置完成后，运行以下命令测试："
echo "   npm run dev"
echo ""
echo "祝你配置顺利！🚀"
