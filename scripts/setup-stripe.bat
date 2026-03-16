@echo off
REM ============================================
REM ViciVidi AI - Stripe 快速配置脚本 (Windows)
REM ============================================

echo.
echo 🎯 ViciVidi AI - Stripe 配置向导
echo ================================
echo.

REM 检查是否已存在 .env.local
if exist ".env.local" (
  echo ⚠️  检测到 .env.local 已存在
  echo    建议先备份：move .env.local .env.local.backup
  echo.
  set /p continue="是否继续？(y/N): "
  if /i not "%continue%"=="y" (
    echo ❌ 已取消
    exit /b 1
  )
)

REM 复制模板
echo 📋 正在创建 .env.local 文件...
copy .env.stripe-example .env.local
echo ✅ 创建成功！
echo.

REM 提示用户编辑
echo 📝 现在请编辑 .env.local 文件：
echo.
echo 1. 打开文件：
echo    notepad .env.local
echo    或使用你的编辑器打开
echo.
echo 2. 替换以下占位符为你的 Stripe 密钥：
echo    - sk_test_YOUR_SECRET_KEY_HERE
echo    - pk_test_YOUR_PUBLISHABLE_KEY_HERE
echo    - whsec_YOUR_WEBHOOK_SECRET_HERE
echo.
echo 📖 详细配置指南：
echo    查看 docs\STRIPE_SETUP_GUIDE.md
echo.
echo 🔗 Stripe Dashboard:
echo    https://dashboard.stripe.com/test/apikeys
echo.

REM 询问是否需要帮助
set /p open_browser="需要我帮你打开 Stripe Dashboard 吗？(y/N): "
if /i "%open_browser%"=="y" (
  start https://dashboard.stripe.com/test/apikeys
)

echo.
echo ✨ 配置完成后，运行以下命令测试：
echo    npm run dev
echo.
echo 祝你配置顺利！🚀
pause
