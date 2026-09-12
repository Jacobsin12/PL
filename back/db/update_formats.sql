USE ManeU_DB;
GO

-- Agregar campos para los nuevos formatos (EPP, Seguridad, Transporte, Servicio Médico)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'imss')
    ALTER TABLE ingresos ADD imss VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'curp')
    ALTER TABLE ingresos ADD curp VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'domicilio')
    ALTER TABLE ingresos ADD domicilio VARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'tipo_alta')
    ALTER TABLE ingresos ADD tipo_alta VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'talla_zapato')
    ALTER TABLE ingresos ADD talla_zapato VARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'talla_pantalon')
    ALTER TABLE ingresos ADD talla_pantalon VARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'talla_playera')
    ALTER TABLE ingresos ADD talla_playera VARCHAR(20) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'camisola')
    ALTER TABLE ingresos ADD camisola VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'sobrelente')
    ALTER TABLE ingresos ADD sobrelente VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'tarjeta_solicitada')
    ALTER TABLE ingresos ADD tarjeta_solicitada VARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'ruta_acceso')
    ALTER TABLE ingresos ADD ruta_acceso VARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'ruta_entrada')
    ALTER TABLE ingresos ADD ruta_entrada VARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'parada_entrada')
    ALTER TABLE ingresos ADD parada_entrada VARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'ruta_salida')
    ALTER TABLE ingresos ADD ruta_salida VARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'parada_salida')
    ALTER TABLE ingresos ADD parada_salida VARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ingresos') AND name = 'numero_tarjeta')
    ALTER TABLE ingresos ADD numero_tarjeta VARCHAR(50) NULL;
GO
