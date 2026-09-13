# 🏗️ Plan de Arquitectura: Migración Futura a Base de Datos SQL

Este documento guarda la propuesta de migración para cuando el proyecto escale y se requiera cambiar la base de datos local (IndexedDB) a una base de datos corporativa.

## 1. El Sistema Actual (IndexedDB Local)
Actualmente, el sistema vive 100% en el navegador de tu computadora.
- **✅ Ventajas:** No cuesta un solo peso de servidores, es rapidísimo y funciona sin internet.
- **❌ Desventajas:** La información solo vive en *tu* computadora. Si otra persona de otra planta abre la página en su computadora, verá el sistema en blanco. Si se te formatea la computadora, pierdes el histórico.

## 2. Lo que implica cambiar a SQL
Los navegadores de internet no pueden conectarse directamente a una base de datos SQL por seguridad. Necesitaríamos construir un **Servidor (Backend)** en el medio.

La nueva arquitectura sería:
1. **Frontend (Lo que ya tenemos):** Tu pantalla actual con gráficas y tablas, pero ahora se comunicará por internet.
2. **Backend (Nuevo):** Un servidor construido en Node.js que recibirá tus archivos de Excel y procesará la lógica.
3. **Base de Datos (Nueva):** Una base de datos real (MySQL, PostgreSQL o SQL Server) para almacenar todo de forma centralizada.

## 3. ¿Por qué SÍ valdría la pena el cambio?
- **Multiusuario y Centralizado:** Los líderes de las 8 plantas podrían entrar a la misma liga de internet desde sus propias computadoras. Lo que tú subas hoy, ellos lo podrán ver al instante.
- **Seguridad y Respaldos:** La base de datos estaría protegida en un servidor central. Si tu computadora sufre algún daño, los datos de los empleados están a salvo.
- **Escalabilidad Extrema:** SQL no se asusta ni con 50 millones de empleados.

## 4. Requisitos antes de iniciar (Open Questions)
Cuando se decida dar el salto, se debe definir lo siguiente:
1. **Hospedaje (Hosting):** Se necesitará un servidor (AWS, Azure, o un servidor interno de la empresa de TI).
2. **Motor de Base de Datos:** Elegir entre MySQL, PostgreSQL, o Microsoft SQL Server.
3. **Sistema de Login:** Al ser multi-usuario, será necesario implementar pantallas de inicio de sesión y contraseñas para proteger la información y que solo personal autorizado pueda subir archivos.

---
*Guardado por Antigravity AI para futura referencia.*
