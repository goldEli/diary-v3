#!/bin/bash

# Diary-v3 应用更新脚本
# 用于生产环境的应用更新

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    BACKUP_FILE="$BACKUP_DIR/diary_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f docker-compose.prod.yml exec -T db mysqldump -u root -p${DB_ROOT_PASSWORD} diary > $BACKUP_FILE; then
        log_success "数据库备份完成: $BACKUP_FILE"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 更新代码
update_code() {
    log_info "更新代码..."
    
    # 检查是否有未提交的更改
    if ! git diff --quiet; then
        log_warning "检测到未提交的更改，请先提交或暂存"
        git status
        read -p "是否继续更新？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 拉取最新代码
    git pull origin main
    
    log_success "代码更新完成"
}

# 重新构建和部署
rebuild_and_deploy() {
    log_info "重新构建和部署应用..."
    
    # 停止服务
    log_info "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down
    
    # 清理旧镜像
    log_info "清理旧镜像..."
    docker system prune -f
    
    # 重新构建
    log_info "重新构建镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "应用部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查尝试 $attempt/$max_attempts"
        
        # 检查后端 API
        if curl -f http://localhost:3001/health &> /dev/null; then
            log_success "后端 API 服务正常"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                log_error "后端 API 服务异常"
                return 1
            fi
            log_warning "后端 API 服务未就绪，等待 10 秒后重试..."
            sleep 10
            ((attempt++))
        fi
    done
    
    # 检查前端
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
        return 1
    fi
    
    log_success "健康检查通过"
}

# 回滚功能
rollback() {
    log_warning "开始回滚..."
    
    # 停止当前服务
    docker-compose -f docker-compose.prod.yml down
    
    # 恢复到上一个 commit
    git reset --hard HEAD~1
    
    # 重新部署
    rebuild_and_deploy
    
    if health_check; then
        log_success "回滚完成"
    else
        log_error "回滚失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "    Diary-v3 应用更新脚本"
    echo "========================================"
    echo
    
    # 检查参数
    case $1 in
        --help|-h)
            echo "使用方法: $0 [选项]"
            echo
            echo "选项:"
            echo "  --rollback     回滚到上一个版本"
            echo "  --no-backup    跳过数据库备份"
            echo "  --help, -h     显示帮助信息"
            exit 0
            ;;
        --rollback)
            rollback
            exit 0
            ;;
    esac
    
    # 检查是否在项目根目录
    if [[ ! -f docker-compose.prod.yml ]]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 加载环境变量
    if [[ -f .env.prod ]]; then
        source .env.prod
    fi
    
    # 执行更新流程
    if [[ $1 != "--no-backup" ]]; then
        backup_database
    fi
    
    update_code
    rebuild_and_deploy
    
    if health_check; then
        log_success "应用更新完成！"
        echo
        echo "服务状态："
        docker-compose -f docker-compose.prod.yml ps
    else
        log_error "更新过程中出现问题"
        read -p "是否回滚到上一个版本？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        else
            log_info "请手动检查服务状态："
            docker-compose -f docker-compose.prod.yml logs
        fi
        exit 1
    fi
}

# 执行主函数
main "$@"