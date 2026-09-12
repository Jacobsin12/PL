-- Script para módulo de IT y sistema de notificaciones

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'configuracion_it')
BEGIN
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
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notificaciones')
BEGIN
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
END;

-- Generar registros de configuracion_it para ingresos existentes que no tengan
INSERT INTO configuracion_it (id_ingreso, estatus)
SELECT id_ingreso, 'pendiente'
FROM ingresos
WHERE id_ingreso NOT IN (SELECT id_ingreso FROM configuracion_it);
