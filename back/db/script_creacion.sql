-- =========================================================
-- SCRIPT DE CREACIÓN COMPLETA DE BASE DE DATOS (ManeU_DB)
-- Incluye estructura de RH, módulo de IT, formatos y notificaciones.
-- =========================================================

USE master;
GO

IF DB_ID('ManeU_DB') IS NOT NULL
BEGIN
    ALTER DATABASE ManeU_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ManeU_DB;
END
GO

CREATE DATABASE ManeU_DB;
GO

USE ManeU_DB;
GO

-- 1. Tabla: planta
CREATE TABLE planta (
    id_planta INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    siglas VARCHAR(20) NOT NULL
);
GO

-- 2. Tabla: tipo_ingreso
CREATE TABLE tipo_ingreso (
    id_tipo INT IDENTITY(1,1) PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL -- "Nuevo", "Reingreso"
);
GO

-- 3. Tabla: area
CREATE TABLE area (
    id_area INT IDENTITY(1,1) PRIMARY KEY,
    nombre_area VARCHAR(100) NOT NULL
);
GO

-- 4. Tabla: roles
CREATE TABLE roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);
GO

-- 5. Tabla: usuarios_sistema
CREATE TABLE usuarios_sistema (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_UsuarioSistema_Rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);
GO

-- 6. Tabla principal: ingresos (Empleados registrados)
CREATE TABLE ingresos (
    id_ingreso INT IDENTITY(1,1) PRIMARY KEY,
    mug VARCHAR(50) NOT NULL,
    numero_nomina VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    jefe_directo VARCHAR(150) NULL,
    id_planta INT NULL,
    id_area INT NULL,
    id_tipo INT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_registro DATETIME DEFAULT GETDATE(),
    
    -- Campos adicionales para Formatos EPP, Seguridad, Transporte y Médico
    imss VARCHAR(50) NULL,
    curp VARCHAR(50) NULL,
    domicilio VARCHAR(255) NULL,
    tipo_alta VARCHAR(50) NULL,
    talla_zapato VARCHAR(20) NULL,
    talla_pantalon VARCHAR(20) NULL,
    talla_playera VARCHAR(20) NULL,
    camisola VARCHAR(50) NULL,
    sobrelente VARCHAR(50) NULL,
    tarjeta_solicitada VARCHAR(50) NULL,
    numero_tarjeta VARCHAR(50) NULL,
    ruta_acceso VARCHAR(100) NULL,
    ruta_entrada VARCHAR(100) NULL,
    parada_entrada VARCHAR(100) NULL,
    ruta_salida VARCHAR(100) NULL,
    parada_salida VARCHAR(100) NULL,
    
    CONSTRAINT FK_Ingreso_Planta FOREIGN KEY (id_planta) REFERENCES planta(id_planta),
    CONSTRAINT FK_Ingreso_Area FOREIGN KEY (id_area) REFERENCES area(id_area),
    CONSTRAINT FK_Ingreso_TipoIngreso FOREIGN KEY (id_tipo) REFERENCES tipo_ingreso(id_tipo)
);
GO

-- 7. Tabla: configuracion_it (Módulo IT)
CREATE TABLE configuracion_it (
    id_config INT IDENTITY(1,1) PRIMARY KEY,
    id_ingreso INT NOT NULL UNIQUE,
    correo_asignado VARCHAR(150) NULL,
    password_asignado VARCHAR(100) DEFAULT 'QueretaroMex2026*',
    correo_creado BIT DEFAULT 0,
    password_configurada BIT DEFAULT 0,
    permisos_ad BIT DEFAULT 0,
    equipo_entregado BIT DEFAULT 0,
    config_completada BIT DEFAULT 0,
    id_responsable_it INT NULL,
    fecha_completada DATETIME NULL,
    estatus VARCHAR(30) DEFAULT 'pendiente',
    notas VARCHAR(500) NULL,
    
    CONSTRAINT FK_Config_Ingreso FOREIGN KEY (id_ingreso) REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    CONSTRAINT FK_Config_Responsable FOREIGN KEY (id_responsable_it) REFERENCES usuarios_sistema(id_usuario)
);
GO

-- 8. Tabla: notificaciones
CREATE TABLE notificaciones (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario_destino INT NULL,
    id_rol_destino INT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BIT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    url_referencia VARCHAR(200) NULL,
    
    CONSTRAINT FK_Notif_Usuario FOREIGN KEY (id_usuario_destino) REFERENCES usuarios_sistema(id_usuario)
);
GO

-- =========================================================
-- INSERCIÓN DE DATOS INICIALES Y CATÁLOGOS
-- =========================================================

-- Tipos de Ingreso
INSERT INTO tipo_ingreso (descripcion) VALUES ('Nuevo');
INSERT INTO tipo_ingreso (descripcion) VALUES ('Reingreso');
GO

-- Plantas Safran
INSERT INTO planta (siglas, nombre_completo) VALUES ('MDS', 'MDS (Por definir)');
INSERT INTO planta (siglas, nombre_completo) VALUES ('P3', 'Planta 3');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SAEM', 'Safran Aerosystems Mexico');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SAESA REP', 'SAESA Reparaciones');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SAESA SHOP', 'SAESA Taller');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SAFRAN MEXICO', 'Safran Mexico');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SLSM', 'SLSM (Por definir)');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SLSSA', 'SLSSA (Por definir)');
INSERT INTO planta (siglas, nombre_completo) VALUES ('SSNA', 'SSNA (Por definir)');
GO

-- Áreas
INSERT INTO area (nombre_area) VALUES ('Mejora continua');
INSERT INTO area (nombre_area) VALUES ('Metodos');
INSERT INTO area (nombre_area) VALUES ('Cadena de suministros');
INSERT INTO area (nombre_area) VALUES ('Calidad');
INSERT INTO area (nombre_area) VALUES ('Procesos especiales');
INSERT INTO area (nombre_area) VALUES ('Mantenimiento');
INSERT INTO area (nombre_area) VALUES ('Produccion');
GO

-- Roles
INSERT INTO roles (nombre_rol) VALUES ('Admin');
INSERT INTO roles (nombre_rol) VALUES ('RH');
INSERT INTO roles (nombre_rol) VALUES ('IT');
GO

-- Usuarios del Sistema (Contraseña por defecto: 12345)
INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Administrador', 'admin@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 1);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Recursos Humanos', 'rh@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 2);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Soporte IT', 'it@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 3);
GO
