#!/bin/bash
# GitHub部署脚本
# 此脚本包含部署到GitHub的所有命令

echo "==================================================="
echo "Currency Dashboard - GitHub部署脚本"
echo "==================================================="
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "错误：请在currency-dashboard目录下运行此脚本"
    exit 1
fi

echo "步骤1: 检查Git状态..."
git status

echo ""
echo "步骤2: 创建GitHub仓库..."
echo "运行命令: gh repo create currency-dashboard --public --source=. --remote=origin --push"
gh repo create currency-dashboard --public --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo "✅ 仓库创建成功！"
else
    echo "❌ 仓库创建失败，请手动创建"
    echo ""
    echo "手动步骤："
    echo "1. 访问 https://github.com/new"
    echo "2. 仓库名：currency-dashboard"
    echo "3. 设置为Public"
    echo "4. 不要初始化README"
    echo "5. 创建后运行："
    echo "   git remote add origin https://github.com/你的用户名/currency-dashboard.git"
    echo "   git push -u origin main"
    exit 1
fi

echo ""
echo "步骤3: 配置GitHub Pages..."
gh api repos/:owner/currency-dashboard/pages -X POST -f source[branch]=main -f source[path]=/

echo ""
echo "步骤4: 获取仓库信息..."
REPO_URL=$(gh repo view --json url -q .url)
PAGES_URL=$(gh repo view --json homepageUrl -q .homepageUrl)

echo ""
echo "==================================================="
echo "✅ 部署完成！"
echo "==================================================="
echo ""
echo "📦 仓库地址: $REPO_URL"
echo "🌐 Pages地址: $PAGES_URL"
echo ""
echo "注意：GitHub Pages可能需要几分钟才能生效"
echo "==================================================="
