#!/bin/bash

# ==============================================================================
# Setup Script cho Ubuntu 22.04 VPS - Dự án Antigravity
# Chạy script này bằng user root trên VPS mới.
# Cú pháp: sudo bash setup-vps.sh
# ==============================================================================

set -e

# Đảm bảo chạy dưới quyền root
if [ "$EUID" -ne 0 ]; then
  echo "Vui lòng chạy script này dưới quyền root (sudo)."
  exit 1
fi

DOMAIN="antigravity.yourdomain.com"
EMAIL="your-email@yourdomain.com" # Dùng cho Certbot Let's Encrypt
DEPLOY_USER="deploy"

echo "1. Cập nhật hệ thống..."
apt-get update && apt-get upgrade -y

echo "2. Cài đặt các package cơ bản..."
apt-get install -y curl wget git ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

echo "3. Cài đặt Docker và Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
    echo "Docker đã được cài đặt."
fi

# Cài docker-compose (v1 compatibility nếu cần)
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "4. Cài đặt Nginx và Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

echo "5. Cấu hình Firewall (UFW)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Bật UFW mà không hỏi
ufw --force enable

echo "6. Tạo user deploy..."
if id "$DEPLOY_USER" &>/dev/null; then
    echo "User $DEPLOY_USER đã tồn tại."
else
    useradd -m -s /bin/bash $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    # Tắt password prompt cho sudo của deploy
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/90-deploy
    
    # Tạo thư mục SSH cho deploy
    mkdir -p /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    touch /home/$DEPLOY_USER/.ssh/authorized_keys
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    
    echo "--> Hãy copy public key của bạn (hoặc SSH key cho GitHub Actions) vào /home/$DEPLOY_USER/.ssh/authorized_keys"
fi

echo "7. Thiết lập thư mục dự án..."
mkdir -p /home/$DEPLOY_USER/antigravity
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/antigravity

echo "8. Tạo template .env.prod..."
cat << EOF > /home/$DEPLOY_USER/antigravity/.env.prod
POSTGRES_USER=antigravity
POSTGRES_PASSWORD=generate_a_secure_password_here
POSTGRES_DB=antigravity
DATABASE_URL="postgresql://antigravity:generate_a_secure_password_here@postgres:5432/antigravity?schema=public"

REDIS_PASSWORD=generate_a_secure_redis_password
REDIS_URL="redis://:generate_a_secure_redis_password@redis:6379"

JWT_ACCESS_SECRET=generate_secret_1
JWT_REFRESH_SECRET=generate_secret_2

NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_SOCKET_URL=https://$DOMAIN
EOF
chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/antigravity/.env.prod
chmod 600 /home/$DEPLOY_USER/antigravity/.env.prod

echo "9. Cấu hình Nginx cơ bản..."
# Bạn cần copy file nginx/antigravity.conf vào /etc/nginx/sites-available/antigravity.conf
# Lệnh dưới đây là ví dụ, bạn nên tự copy file từ repo
# cp nginx/antigravity.conf /etc/nginx/sites-available/antigravity.conf
# ln -s /etc/nginx/sites-available/antigravity.conf /etc/nginx/sites-enabled/
# rm -f /etc/nginx/sites-enabled/default
# nginx -t
# systemctl restart nginx

echo "10. Hướng dẫn chạy SSL (Certbot)..."
echo "Sau khi đã cấu hình Nginx và DNS trỏ về server, hãy chạy:"
echo "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL"

echo "====================================================="
echo "Setup hoàn tất! Các bước tiếp theo:"
echo "1. Cập nhật mật khẩu trong /home/$DEPLOY_USER/antigravity/.env.prod"
echo "2. Copy nội dung file nginx/antigravity.conf vào server"
echo "3. Thêm SSH Key vào /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "4. Cấu hình GitHub Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY) cho CI/CD"
echo "====================================================="
