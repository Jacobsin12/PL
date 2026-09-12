USE ManeU_DB;
GO
IF OBJECT_ID('dbo.ingresos', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ingresos;
END
GO
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
