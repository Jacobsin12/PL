FROM php:8.2-apache

# Habilitar módulo de reescritura de Apache
RUN a2enmod rewrite

# Instalar dependencias del sistema y extensiones de PDO (MySQL y PostgreSQL)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql

# Copiar el código del proyecto al directorio web de Apache
COPY . /var/www/html/

# Establecer permisos adecuados
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
