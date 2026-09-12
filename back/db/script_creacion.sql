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
-- password_hash = $2y$10$wO0oH7tXF8v1... (hash de '12345')
INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Administrador', 'admin@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 1);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Recursos Humanos', 'rh@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 2);

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) 
VALUES ('Soporte IT', 'it@safran.com', '$2y$10$N.Qp.x8oR1Z.T2o1k1xZ9eU8vN1yH9d7XlGZ1zJ5kC7pA9t/M8y0O', 3);
GO
