#!/bin/bash

echo "🏃‍♂️ RunTracker Pro 部署脚本"
echo "=========================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否安装了必要的工具
check_requirements() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查通过${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}构建项目...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 构建成功${NC}"
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 部署选项菜单
deploy_menu() {
    echo ""
    echo "请选择部署方式:"
    echo "1) Vercel 部署"
    echo "2) Docker 本地部署"
    echo "3) 生产模式启动"
    echo "4) 退出"
    
    read -p "请输入选项 (1-4): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_docker
            ;;
        3)
            start_production
            ;;
        4)
            echo "退出部署脚本"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项${NC}"
            deploy_menu
            ;;
    esac
}

# Vercel 部署
deploy_vercel() {
    echo -e "${YELLOW}准备 Vercel 部署...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo "安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    echo -e "${GREEN}请访问 https://vercel.com 完成部署${NC}"
    echo "1. 创建 GitHub 仓库并推送代码"
    echo "2. 在 Vercel 中导入项目"  
    echo "3. 设置环境变量 DATABASE_URL"
    echo "4. 部署完成"
}

# Docker 部署
deploy_docker() {
    echo -e "${YELLOW}Docker 部署...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        echo "请先安装 Docker Compose"
        exit 1
    fi
    
    echo "启动 Docker 容器..."
    docker-compose up --build -d
    
    echo -e "${GREEN}✅ Docker 部署完成${NC}"
    echo "应用地址: http://localhost:3000"
    echo "数据库地址: localhost:5432"
}

# 生产模式启动
start_production() {
    echo -e "${YELLOW}启动生产模式...${NC}"
    
    echo "设置环境变量..."
    export NODE_ENV=production
    
    echo "启动应用..."
    npm start
}

# 主函数
main() {
    check_requirements
    build_project
    deploy_menu
}

# 运行主函数
main 