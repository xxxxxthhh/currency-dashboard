# 快速部署指南

## 方法1：使用 gh CLI（推荐）

在项目目录下运行：

```bash
cd /workspace/group/currency-dashboard

# 创建GitHub仓库并推送
gh repo create currency-dashboard --public --source=. --remote=origin --push

# 配置GitHub Pages
gh api repos/:owner/currency-dashboard/pages -X POST -f source[branch]=main -f source[path]=/

# 获取访问链接
gh repo view --web
```

## 方法2：手动创建仓库

### 步骤1：在GitHub上创建仓库
1. 访问 https://github.com/new
2. 仓库名：`currency-dashboard`
3. 设置为 Public
4. 不要初始化 README
5. 点击 Create repository

### 步骤2：推送代码
```bash
cd /workspace/group/currency-dashboard

# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/currency-dashboard.git

# 推送代码
git push -u origin main
```

### 步骤3：启用GitHub Pages
1. 进入仓库 Settings
2. 找到 Pages 选项
3. Source 选择 `main` 分支
4. 点击 Save

### 步骤4：访问Dashboard
等待1-2分钟后访问：
`https://YOUR_USERNAME.github.io/currency-dashboard/`
