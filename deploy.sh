#!/bin/bash

# Diary-v3 自动化部署脚本
# 适用于 Linux 云环境部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查系统要求
check_system() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        log_error "无法识别的操作系统"
        exit 1
    fi
    
    # 检查内存
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 2 ]]; then
        log_warning "系统内存少于 2GB，可能影响性能"
    fi
    
    # 检查磁盘空间
    DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_SPACE -lt 10 ]]; then
        log_error "可用磁盘空间少于 10GB，无法继续部署"
        exit 1
    fi
    
    log_success "系统检查通过"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker 已安装，版本: $(docker --version)"
        return
    fi
    
    log_info "安装 Docker..."
    
    # 更新包索引
    sudo apt-get update -y || sudo yum update -y
    
    # 安装 Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # 启动 Docker 服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER
    
    log_success "Docker 安装完成"
    log_warning "请注销并重新登录以使 Docker 组权限生效"
}

# 安装 Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose 已安装，版本: $(docker-compose --version)"
        return
    fi
    
    log_info "安装 Docker Compose..."
    
    # 下载 Docker Compose
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose 安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp
        sudo ufw allow 3001/tcp
        sudo ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --permanent --add-port=3001/tcp
        sudo firewall-cmd --reload
    else
        log_warning "未检测到防火墙管理工具，请手动配置防火墙"
    fi
    
    log_success "防火墙配置完成"
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 检查是否存在生产环境配置
    if [[ ! -f .env.prod ]]; then
        if [[ -f .env.prod.example ]]; then
            cp .env.prod.example .env.prod
            log_warning "已创建 .env.prod 文件，请编辑其中的配置"
        else
            log_error "未找到 .env.prod.example 文件"
            exit 1
        fi
    fi
    
    # 检查后端环境变量
    if [[ ! -f apps/api/.env ]]; then
        if [[ -f apps/api/.env.example ]]; then
            cp apps/api/.env.example apps/api/.env
            log_warning "已创建 apps/api/.env 文件，请编辑其中的配置"
        else
            log_error "未找到 apps/api/.env.example 文件"
            exit 1
        fi
    fi
    
    log_success "环境变量设置完成"
}

# 构建和启动服务
deploy_services() {
    log_info "构建和启动服务..."
    
    # 停止现有服务
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_info "停止现有服务..."
        docker-compose -f docker-compose.prod.yml down
    fi
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查数据库
    if docker-compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost --silent; then
        log_success "数据库服务正常"
    else
        log_error "数据库服务异常"
        return 1
    fi
    
    # 检查后端 API
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "后端 API 服务正常"
    else
        log_error "后端 API 服务异常"
        return 1
    fi
    
    # 检查前端
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo
    echo "服务访问地址："
    echo "  前端应用: http://$(curl -s ifconfig.me):3000"
    echo "  后端 API: http://$(curl -s ifconfig.me):3001"
    echo "  API 文档: http://$(curl -s ifconfig.me):3001/docs"
    echo
    echo "管理命令："
    echo "  查看服务状态: docker-compose -f docker-compose.prod.yml ps"
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo
    echo "重要提醒："
    echo "  1. 请确保已正确配置 .env.prod 和 apps/api/.env 文件"
    echo "  2. 生产环境建议配置 HTTPS 和域名"
    echo "  3. 定期备份数据库数据"
}

# 主函数
main() {
    echo "========================================"
    echo "    Diary-v3 自动化部署脚本"
    echo "========================================"
    echo
    
    # 检查参数
    if [[ $1 == "--help" ]] || [[ $1 == "-h" ]]; then
        echo "使用方法: $0 [选项]"
        echo
        echo "选项:"
        echo "  --skip-deps    跳过依赖安装"
        echo "  --help, -h     显示帮助信息"
        exit 0
    fi
    
    check_root
    check_system
    
    if [[ $1 != "--skip-deps" ]]; then
        install_docker
        install_docker_compose
        configure_firewall
    fi
    
    setup_environment
    deploy_services
    
    if health_check; then
        show_deployment_info
    else
        log_error "部署过程中出现问题，请检查日志"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# 执行主函数
main "$@"