-- Script de Creación de Base de Datos para MySQL / MariaDB

CREATE TABLE IF NOT EXISTS planta (
    id_planta INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    siglas VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS tipo_ingreso (
    id_tipo INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS area (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ingresos (
    id_ingreso INT AUTO_INCREMENT PRIMARY KEY,
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
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    FOREIGN KEY (id_planta) REFERENCES planta(id_planta),
    FOREIGN KEY (id_area) REFERENCES area(id_area),
    FOREIGN KEY (id_tipo) REFERENCES tipo_ingreso(id_tipo)
);

CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

INSERT INTO tipo_ingreso (id_tipo, descripcion) VALUES (1, 'Nuevo'), (2, 'Reingreso') ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

INSERT INTO planta (id_planta, siglas, nombre_completo) VALUES 
(1, 'MDS', 'MDS (Por definir)'),
(2, 'P3', 'Planta 3'),
(3, 'SAEM', 'Safran Aerosystems Mexico'),
(4, 'SAESA REP', 'SAESA Reparaciones'),
(5, 'SAESA SHOP', 'SAESA Taller'),
(6, 'SAFRAN MEXICO', 'Safran Mexico'),
(7, 'SLSM', 'SLSM (Por definir)'),
(8, 'SLSSA', 'SLSSA (Por definir)'),
(9, 'SSNA', 'SSNA (Por definir)')
ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo);

INSERT INTO area (id_area, nombre_area) VALUES 
(1, 'Mejora continua'),
(2, 'Metodos'),
(3, 'Cadena de suministros'),
(4, 'Calidad'),
(5, 'Procesos especiales'),
(6, 'Mantenimiento'),
(7, 'Produccion')
ON DUPLICATE KEY UPDATE nombre_area=VALUES(nombre_area);

INSERT INTO roles (id_rol, nombre_rol) VALUES (1, 'Admin'), (2, 'RH'), (3, 'IT') ON DUPLICATE KEY UPDATE nombre_rol=VALUES(nombre_rol);

INSERT INTO usuarios_sistema (id_usuario, nombre, correo, password_hash, id_rol) VALUES 
(1, 'Administrador', 'admin@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 1),
(2, 'Recursos Humanos', 'rh@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 2),
(3, 'Soporte IT', 'it@safran.com', '$2y$10$s.37eY2Fz2PptNbwSe8yYu7Yn1Vi5DooNs8oXb7i50P958xMoyu1W', 3)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

CREATE TABLE IF NOT EXISTS configuracion_it (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    id_ingreso INT NOT NULL,
    correo_asignado VARCHAR(150) NULL,
    password_asignado VARCHAR(100) NULL,
    config_completada TINYINT(1) DEFAULT 0,
    id_responsable_it INT NULL,
    fecha_completada DATETIME NULL,
    estatus VARCHAR(30) DEFAULT 'pendiente',
    notas VARCHAR(500) NULL,
    FOREIGN KEY (id_ingreso) REFERENCES ingresos(id_ingreso) ON DELETE CASCADE,
    FOREIGN KEY (id_responsable_it) REFERENCES usuarios_sistema(id_usuario)
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_destino INT NULL,
    id_rol_destino INT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    url_referencia VARCHAR(200) NULL,
    FOREIGN KEY (id_usuario_destino) REFERENCES usuarios_sistema(id_usuario)
);
