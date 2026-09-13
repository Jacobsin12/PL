<?php
date_default_timezone_set('America/Mexico_City');

// Configuración de la conexión a SQL Server
$serverName = "localhost\\SQLEXPRESS"; // O la IP del servidor, ej. "192.168.1.100"
$database = "ManeU_DB";
$uid = "sa"; // Usuario de SQL Server
$pwd = "0512"; // Contraseña de SQL Server

try {
    // Se establece la conexión utilizando PDO_SQLSRV
    $conn = new PDO("sqlsrv:server=$serverName;Database=$database;TrustServerCertificate=true", $uid, $pwd);
    
    // Configurar PDO para que lance excepciones en caso de error
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Descomentar la siguiente línea para pruebas
    // echo "Conexión establecida correctamente a SQL Server."; 
} catch(PDOException $e) {
    die("Error de conexión a SQL Server: " . $e->getMessage());
}
?>
