-- Reiniciar la base de datos si ya existe (para evitar errores al correr el script varias veces)
USE master;
GO
IF DB_ID('ManeU_DB') IS NOT NULL
BEGIN
    ALTER DATABASE ManeU_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ManeU_DB;
END
GO

-- Creación de la Base de Datos
CREATE DATABASE ManeU_DB;
GO

USE ManeU_DB;
GO

-- Tabla: planta
CREATE TABLE planta (
    id_planta INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    siglas VARCHAR(20) NOT NULL
);
GO

-- Tabla: tipo_ingreso
CREATE TABLE tipo_ingreso (
    id_tipo INT IDENTITY(1,1) PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL -- "Nuevo", "Reingreso"
);
GO

-- Tabla: area
CREATE TABLE area (
    id_area INT IDENTITY(1,1) PRIMARY KEY,
    nombre_area VARCHAR(100) NOT NULL
);
GO

-- Tabla: ingresos (antes usuarios, para los empleados registrados)
CREATE TABLE ingresos (
    id_ingreso INT IDENTITY(1,1) PRIMARY KEY,
    mug VARCHAR(50) NOT NULL,
    numero_nomina VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    jefe_directo VARCHAR(150),
    id_planta INT,
    id_area INT,
    id_tipo INT,
    fecha_ingreso DATE NOT NULL,
    fecha_registro DATETIME DEFAULT GETDATE(),
    imss VARCHAR(50) NULL,
    curp VARCHAR(50) NULL,
    domicilio VARCHAR(255) NULL,
    tipo_alta VARCHAR(50) DEFAULT 'Nuevo Ingreso',
    tarjeta_solicitada VARCHAR(100) NULL,
    numero_tarjeta VARCHAR(50) NULL,
    ruta_acceso VARCHAR(100) NULL,
    ruta_entrada VARCHAR(100) NULL,
    parada_entrada VARCHAR(100) NULL,
    ruta_salida VARCHAR(100) NULL,
    parada_salida VARCHAR(100) NULL,
    talla_zapato VARCHAR(50) NULL,
    talla_pantalon VARCHAR(50) NULL,
    talla_playera VARCHAR(50) NULL,
    camisola VARCHAR(100) NULL,
    sobrelente VARCHAR(50) NULL,
    
    CONSTRAINT FK_Ingreso_Planta FOREIGN KEY (id_planta) REFERENCES planta(id_planta),
    CONSTRAINT FK_Ingreso_Area FOREIGN KEY (id_area) REFERENCES area(id_area),
    CONSTRAINT FK_Ingreso_TipoIngreso FOREIGN KEY (id_tipo) REFERENCES tipo_ingreso(id_tipo)
);
GO

-- Tabla: roles (Para permisos del sistema)
CREATE TABLE roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);
GO

-- Tabla: usuarios_sistema (Los que inician sesión)
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

-- Insertar datos básicos por defecto
INSERT INTO tipo_ingreso (descripcion) VALUES ('Nuevo');
INSERT INTO tipo_ingreso (descripcion) VALUES ('Reingreso');
GO

-- Insertar datos de las 9 Plantas (Puedes editar los nombres completos si lo deseas)
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

-- Insertar áreas
INSERT INTO area (nombre_area) VALUES ('Mejora continua');
INSERT INTO area (nombre_area) VALUES ('Metodos');
INSERT INTO area (nombre_area) VALUES ('Cadena de suministros');
INSERT INTO area (nombre_area) VALUES ('Calidad');
INSERT INTO area (nombre_area) VALUES ('Procesos especiales');
INSERT INTO area (nombre_area) VALUES ('Mantenimiento');
INSERT INTO area (nombre_area) VALUES ('Produccion');
GO

-- Insertar roles
INSERT INTO roles (nombre_rol) VALUES ('Admin');
INSERT INTO roles (nombre_rol) VALUES ('RH');
INSERT INTO roles (nombre_rol) VALUES ('IT');
GO

-- Insertar usuarios del sistema de prueba (La contraseña para todos es '12345' encriptada con bcrypt)
-- password_hash = $2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W (hash de '12345')
INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Administrador', 'admin@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 1);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Recursos Humanos', 'rh@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 2);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Soporte IT', 'it@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 3);
GO

-- Tabla: configuracion_it (Para el dashboard de IT)
CREATE TABLE configuracion_it (
    id_config INT IDENTITY(1,1) PRIMARY KEY,
    id_ingreso INT NOT NULL,
    correo_asignado VARCHAR(150) NULL,
    password_asignado VARCHAR(100) NULL,
    config_completada BIT DEFAULT 0,
    id_responsable_it INT NULL,
    fecha_completada DATETIME NULL,
    estatus VARCHAR(30) DEFAULT 'pendiente',
    notas VARCHAR(500) NULL,
    CONSTRAINT FK_Config_Ingreso FOREIGN KEY (id_ingreso) REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    CONSTRAINT FK_Config_Responsable FOREIGN KEY (id_responsable_it) REFERENCES usuarios_sistema(id_usuario)
);
GO

-- Tabla: notificaciones (Para avisos en tiempo real a diferentes roles)
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
