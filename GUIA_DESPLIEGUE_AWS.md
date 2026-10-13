# ☁️ Guía Paso a Paso: Despliegue de ManeU en AWS Lightsail

Esta guía está diseñada especialmente para desplegar la aplicación en **AWS** desde cero, de forma rápida, económica y sin complicaciones técnicas.

---

## 🎯 ¿Por qué AWS Lightsail + PostgreSQL?

1. **Facilidad Total:** No tienes que configurar redes complejas de AWS (VPCs, Security Groups, llaves SSH).
2. **Terminal Web en 1 Clic:** Te conectas directamente desde tu navegador sin instalar programas externos (como PuTTY).
3. **Costo Predecible:** Cuesta solo **$3.50 a $5.00 USD al mes** (e incluye **90 días gratis** en el Free Tier de AWS).
4. **Base de Datos PostgreSQL:** 
   - Es el motor de código abierto más similar y compatible con **SQL Server** en tipos de datos, transacciones y consultas.
   - Es 100% gratuita (sin costos de licencias de Microsoft).
   - El proyecto ya cuenta con su script de esquema listo (`script_creacion_pgsql.sql`).

---

## 📋 Pasos para Desplegar

### Paso 1: Entrar a AWS y abrir Lightsail
1. Entra a [https://aws.amazon.com/](https://aws.amazon.com/) e inicia sesión en la consola.
2. En la barra de búsqueda superior, escribe **Lightsail** y entra al servicio.

---

### Paso 2: Crear tu Servidor (Instancia)
1. En el panel de Lightsail, haz clic en el botón naranja **"Crear instancia"** (*Create instance*).
2. **Ubicación (Región):** Déjala en **us-east-1 (N. Virginia)** u **us-west-2 (Oregon)**.
3. **Plataforma:** Selecciona **Linux/Unix**.
4. **Plano (Blueprint):** Selecciona la pestaña **"Solo SO" (*OS Only*)** y elige **Ubuntu 22.04 LTS**.
5. **Plan de la instancia:** Selecciona el plan de **$3.50 USD** o **$5.00 USD / mes** (ambos califican para los primeros 3 meses gratis).
6. **Nombre de la instancia:** Escribe un nombre identificable, por ejemplo: `maneu-server`.
7. Haz clic al final en **"Crear instancia"**.
8. Espera aproximadamente **1 minuto** hasta que el estado cambie a **"En ejecución" (*Running*)**.

---

### Paso 3: Abrir la Terminal del Servidor en el Navegador
1. En la tarjeta de tu instancia recién creada, verás un icono cuadrado con el símbolo `>_` (o haz clic en los tres puntos y selecciona **"Conectarse mediante SSH"**).
2. Se abrirá una ventana de terminal negra directamente en tu navegador web.

---

### Paso 4: Ejecutar el Instalador Automático
En esa ventana de terminal negra, copia y pega el siguiente comando completo y presiona **Enter**:

```bash
curl -fsSL https://raw.githubusercontent.com/Jacobsin12/PL/main/deploy_aws.sh -o deploy.sh && bash deploy.sh
```

> **¿Qué hace este comando automáticamente por ti?**
> - Instala Apache, PHP 8.2 y extensiones requeridas (`pdo_pgsql`, etc.).
> - Instala y arranca la base de datos **PostgreSQL**.
> - Crea la base de datos `maneu_db` y el usuario seguro.
> - Descarga la versión más reciente de tu código desde GitHub (`Jacobsin12/PL`).
> - Genera el archivo de conexión `.env`.
> - Ejecuta el script SQL para crear las tablas, catálogos y usuarios iniciales.
> - Enciende y optimiza el servidor web.

El proceso tarda unos **2 a 3 minutos**. Al finalizar, verás un mensaje verde de:
`¡DESPLIEGUE EXITOSO!` junto con la dirección IP de tu servidor.

---

### Paso 5: Asignar una IP Estática (Fija)
Para evitar que la dirección IP de tu servidor cambie si se reinicia:
1. En el panel de Lightsail, ve a la pestaña superior **"Redes" (*Networking*)**.
2. Haz clic en **"Crear IP estática" (*Create static IP*)**.
3. Selecciona tu instancia `maneu-server` y haz clic en **Crear**.
4. Ahora tendrás una dirección IP fija (por ejemplo: `34.201.85.120`).

---

### Paso 6: Verificar el Firewall
1. Haz clic en tu instancia `maneu-server` y ve a la pestaña **"Redes" (*Networking*)**.
2. En la sección **Reglas de firewall**, asegúrate de que estén activos:
   - **HTTP** (Puerto 80)
   - **HTTPS** (Puerto 443)
   - **SSH** (Puerto 22)

---

## 🔑 Acceso al Sistema

Abre una pestaña en tu navegador web y escribe tu IP:
```text
http://TU_IP_ESTATICA
```

### Usuarios y Contraseñas por Defecto:
| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@safran.com` | `12345` |
| **Recursos Humanos (RH)** | `rh@safran.com` | `12345` |
| **Service Desk IT** | `it@safran.com` | `12345` |

---

## 🔄 ¿Cómo actualizar el código en AWS en el futuro?

Cada vez que hagas cambios en tu computadora y los subas a GitHub con `git push`, para actualizar tu servidor en AWS solo abres la terminal web de Lightsail y ejecutas:

```bash
cd /var/www/html && sudo git pull origin main && sudo systemctl restart apache2
```
¡Y tus cambios estarán en vivo al instante!
