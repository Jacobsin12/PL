#!/bin/bash
# ==============================================================================
# 🔒 SCRIPT AUTOMÁTICO DE CERTIFICADO SSL (HTTPS) CON CERTBOT & LET'S ENCRYPT
# ==============================================================================

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Debes ingresar tu nombre de dominio."
    echo "Uso: bash configurar_ssl.sh tu-dominio.duckdns.org [tu-correo@ejemplo.com]"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    EMAIL="admin@$DOMAIN"
fi

echo "=========================================================="
echo "  Configurando HTTPS 🔒 para: $DOMAIN"
echo "=========================================================="

# 1. Instalar Certbot para Apache
echo "📦 Instalando Certbot..."
sudo apt-get update -y
sudo apt-get install -y certbot python3-certbot-apache

# 2. Configurar ServerName en Apache si no está configurado
if ! grep -q "ServerName $DOMAIN" /etc/apache2/sites-available/000-default.conf; then
    sudo sed -i "/<VirtualHost \*:80>/a \    ServerName $DOMAIN" /etc/apache2/sites-available/000-default.conf
fi

# 3. Obtener el certificado SSL y configurar redirección HTTPS automática
echo "🔐 Solicitando certificado SSL gratuito de Let's Encrypt..."
sudo certbot --apache --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN" --redirect

# 4. Reiniciar Apache
sudo systemctl restart apache2

echo "=========================================================="
echo "🎉 ¡CONEXIÓN SEGURA ACTIVADA!"
echo "=========================================================="
echo "Tu aplicación ahora está protegida con cifrado SSL."
echo ""
echo "🔗 Entra con el candadito 🔒 a:"
echo "   https://$DOMAIN"
echo "=========================================================="
