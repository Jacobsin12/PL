-- Script de Creación de Base de Datos para PostgreSQL (Compatible con Render PostgreSQL)

-- Tabla: planta
CREATE TABLE IF NOT EXISTS planta (
    id_planta SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    siglas VARCHAR(20) NOT NULL
);

-- Tabla: tipo_ingreso
CREATE TABLE IF NOT EXISTS tipo_ingreso (
    id_tipo SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: area
CREATE TABLE IF NOT EXISTS area (
    id_area SERIAL PRIMARY KEY,
    nombre_area VARCHAR(100) NOT NULL
);

-- Tabla: ingresos
CREATE TABLE IF NOT EXISTS ingresos (
    id_ingreso SERIAL PRIMARY KEY,
    mug VARCHAR(50) NOT NULL,
    numero_nomina VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    jefe_directo VARCHAR(150),
    id_planta INT REFERENCES planta(id_planta),
    id_area INT REFERENCES area(id_area),
    id_tipo INT REFERENCES tipo_ingreso(id_tipo),
    fecha_ingreso DATE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    sobrelente VARCHAR(50) NULL
);

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

-- Tabla: usuarios_sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES roles(id_rol),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos por defecto (evita duplicar si ya existen)
INSERT INTO tipo_ingreso (descripcion) VALUES ('Nuevo'), ('Reingreso') ON CONFLICT DO NOTHING;

INSERT INTO planta (siglas, nombre_completo) VALUES 
('MDS', 'MDS (Por definir)'),
('P3', 'Planta 3'),
('SAEM', 'Safran Aerosystems Mexico'),
('SAESA REP', 'SAESA Reparaciones'),
('SAESA SHOP', 'SAESA Taller'),
('SAFRAN MEXICO', 'Safran Mexico'),
('SLSM', 'SLSM (Por definir)'),
('SLSSA', 'SLSSA (Por definir)'),
('SSNA', 'SSNA (Por definir)')
ON CONFLICT DO NOTHING;

INSERT INTO area (nombre_area) VALUES 
('Mejora continua'),
('Metodos'),
('Cadena de suministros'),
('Calidad'),
('Procesos especiales'),
('Mantenimiento'),
('Produccion')
ON CONFLICT DO NOTHING;

INSERT INTO roles (nombre_rol) VALUES ('Admin'), ('RH'), ('IT') ON CONFLICT DO NOTHING;

INSERT INTO usuarios_sistema (nombre, correo, password_hash, id_rol) VALUES 
('Administrador', 'admin@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 1),
('Recursos Humanos', 'rh@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 2),
('Soporte IT', 'it@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 3)
ON CONFLICT DO NOTHING;

-- Tabla: configuracion_it
CREATE TABLE IF NOT EXISTS configuracion_it (
    id_config SERIAL PRIMARY KEY,
    id_ingreso INT NOT NULL REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    correo_asignado VARCHAR(150) NULL,
    password_asignado VARCHAR(100) NULL,
    config_completada BOOLEAN DEFAULT FALSE,
    id_responsable_it INT NULL REFERENCES usuarios_sistema(id_usuario),
    fecha_completada TIMESTAMP NULL,
    estatus VARCHAR(30) DEFAULT 'pendiente',
    notas VARCHAR(500) NULL
);

-- Tabla: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario_destino INT NULL REFERENCES usuarios_sistema(id_usuario),
    id_rol_destino INT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    url_referencia VARCHAR(200) NULL
);
