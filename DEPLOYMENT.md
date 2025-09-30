# Diary-v3 部署指南

本文档提供了在 Linux 云环境中部署 Diary-v3 项目的详细说明和注意事项。

## 系统要求

### 服务器配置
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 20GB 可用空间
- **CPU**: 最低 2 核心，推荐 4 核心+
- **网络**: 公网 IP 地址，开放端口 80, 443, 3000, 3001

### 必需软件
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 防火墙配置工具 (ufw/firewalld)

## 部署前准备

### 1. 服务器初始化
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y  # CentOS

# 安装必要工具
sudo apt install -y git curl wget vim  # Ubuntu/Debian
# 或
sudo yum install -y git curl wget vim  # CentOS
```

### 2. 安装 Docker
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
# 注销并重新登录以使组权限生效
```

### 3. 安装 Docker Compose
```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 4. 防火墙配置
```bash
# Ubuntu/Debian (使用 ufw)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # 前端 (可选，用于直接访问)
sudo ufw allow 3001/tcp    # 后端 API (可选，用于直接访问)
sudo ufw enable

# CentOS (使用 firewalld)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

## 部署步骤

### 1. 克隆项目
```bash
# 克隆项目到服务器
git clone <your-repository-url> /opt/diary-v3
cd /opt/diary-v3

# 设置适当的权限
sudo chown -R $USER:$USER /opt/diary-v3
```

### 2. 环境配置

#### 后端环境变量
```bash
# 复制并编辑后端环境变量
cp apps/api/.env.example apps/api/.env
vim apps/api/.env
```

**重要配置项**:
```env
# 数据库配置
DB_HOST=db
DB_PORT=3306
DB_USER=diary_user
DB_PASSWORD=your_secure_password_here
DB_NAME=diary

# JWT 配置 - 必须使用强密码
JWT_SECRET=your_very_secure_jwt_secret_here_at_least_32_characters
JWT_EXPIRES_IN=7d

# CORS 配置 - 生产环境应指定具体域名
CORS_ORIGIN=http://your-domain.com,https://your-domain.com

# 应用端口
PORT=3001
```

#### 前端环境变量
```bash
# 创建前端环境变量文件
cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://your-server-ip:3001
# 或使用域名
# NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
EOF
```

### 3. 数据库密码配置
编辑 `docker-compose.yml` 中的数据库密码：
```yaml
environment:
  MYSQL_DATABASE: diary
  MYSQL_USER: diary_user
  MYSQL_PASSWORD: your_secure_password_here  # 与 .env 中保持一致
  MYSQL_ROOT_PASSWORD: your_root_password_here
```

## 安全注意事项

### 1. 密码安全
- **数据库密码**: 使用至少 16 位的强密码，包含大小写字母、数字和特殊字符
- **JWT Secret**: 使用至少 32 位的随机字符串
- **Root 密码**: 数据库 root 密码应与普通用户密码不同

### 2. 网络安全
- 生产环境中，建议只开放必要端口 (80, 443)
- 使用 Nginx 反向代理，不直接暴露应用端口
- 配置 HTTPS 证书 (Let's Encrypt)

### 3. 数据安全
- 定期备份数据库
- 设置数据卷的适当权限
- 考虑使用云数据库服务

## 性能优化

### 1. Docker 优化
```bash
# 设置 Docker 日志轮转
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

### 2. 系统资源监控
```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs  # Ubuntu/Debian
# 或
sudo yum install -y htop iotop nethogs  # CentOS
```

## 常见问题排查

### 1. 容器启动失败
```bash
# 查看容器日志
docker-compose logs api
docker-compose logs web
docker-compose logs db

# 查看容器状态
docker-compose ps
```

### 2. 数据库连接问题
```bash
# 检查数据库是否就绪
docker-compose exec db mysql -u diary_user -p diary

# 检查网络连接
docker-compose exec api ping db
```

### 3. 前端无法访问后端
- 检查 `NEXT_PUBLIC_API_BASE_URL` 配置
- 确认防火墙设置
- 验证 CORS 配置

### 4. 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 如需要，添加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 维护操作

### 1. 更新应用
```bash
cd /opt/diary-v3
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. 数据库备份
```bash
# 创建备份
docker-compose exec db mysqldump -u root -p diary > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker-compose exec -T db mysql -u root -p diary < backup_file.sql
```

### 3. 日志管理
```bash
# 查看应用日志
docker-compose logs -f --tail=100 api
docker-compose logs -f --tail=100 web

# 清理旧日志
docker system prune -f
```

## 生产环境建议

### 1. 使用 Nginx 反向代理
- 配置 SSL 证书
- 启用 gzip 压缩
- 设置静态文件缓存
- 配置负载均衡 (如有多实例)

### 2. 监控和告警
- 设置服务器监控 (CPU, 内存, 磁盘)
- 配置应用健康检查
- 设置日志告警

### 3. 自动化部署
- 使用 CI/CD 管道
- 自动化测试
- 滚动更新策略

## 故障恢复

### 1. 服务重启
```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart api
docker-compose restart web
docker-compose restart db
```

### 2. 完全重建
```bash
# 停止并删除所有容器
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

### 3. 数据恢复
- 从备份恢复数据库
- 检查数据卷完整性
- 验证应用功能

---

**注意**: 本指南假设您有基本的 Linux 系统管理经验。在生产环境中部署前，请务必在测试环境中验证所有步骤。