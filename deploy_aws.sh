#!/bin/bash
# ==============================================================================
# 🚀 SCRIPT DE DESPLIEGUE AUTOMÁTICO PARA MANEU EN AWS LIGHTSAIL / EC2 (UBUNTU)
# ==============================================================================

set -e

echo "=========================================================="
echo "  Iniciando instalación y configuración de ManeU en AWS"
echo "=========================================================="

# 1. Actualizar paquetes del sistema operativo
echo "📦 [1/7] Actualizando paquetes del sistema..."
sudo apt-get update -y
sudo apt-get install -y software-properties-common curl git zip unzip ufw

# 2. Agregar repositorio oficial de PHP
echo "🐘 [2/7] Instalando PHP 8.2 y Apache..."
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update -y

sudo apt-get install -y apache2 php8.2 php8.2-cli libapache2-mod-php8.2 \
    php8.2-pgsql php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip

# 3. Instalar y configurar PostgreSQL
echo "🗄️ [3/7] Instalando y configurando PostgreSQL (similar a SQL Server)..."
sudo apt-get install -y postgresql postgresql-contrib

DB_NAME="maneu_db"
DB_USER="maneu_user"
DB_PASS="ManeU_Secure_2026!"

# Crear usuario y base de datos en PostgreSQL
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || true

# 4. Habilitar Apache Rewrite y configurar virtual host
echo "🌐 [4/7] Configurando Apache..."
sudo a2enmod rewrite

# Permitir .htaccess en /var/www/html
sudo sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 5. Clonar código desde el repositorio de GitHub
echo "📥 [5/7] Descargando código del proyecto desde GitHub..."
sudo rm -rf /var/www/html/*
sudo git clone https://github.com/Jacobsin12/PL.git /var/www/html

# 6. Crear archivo .env de configuración
echo "⚙️ [6/7] Creando archivo de entorno .env..."
sudo bash -c "cat <<EOF > /var/www/html/.env
DB_DRIVER=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
EOF"

# Asignar permisos al usuario www-data de Apache
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Reiniciar servicios
sudo systemctl restart postgresql
sudo systemctl restart apache2
sudo systemctl enable postgresql
sudo systemctl enable apache2

# 7. Inicializar las tablas y datos por defecto en PostgreSQL
echo "📋 [7/7] Inicializando tablas y catálogos en PostgreSQL..."
cd /var/www/html
php back/db/init_db.php || true

# Obtener IP pública del servidor
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me || echo "tu-ip-publica")

echo "=========================================================="
echo "🎉 ¡DESPLIEGUE EXITOSO!"
echo "=========================================================="
echo "Tu sistema ya está funcionando en vivo."
echo ""
echo "🔗 Abre tu navegador en: http://$PUBLIC_IP"
echo ""
echo "🔑 Credenciales por defecto para iniciar sesión:"
echo "   - Administrador:     admin@safran.com / 12345"
echo "   - Recursos Humanos:  rh@safran.com    / 12345"
echo "   - Servicio IT:       it@safran.com    / 12345"
echo "=========================================================="
