<?php
date_default_timezone_set('America/Mexico_City');

// Configuración flexible: lee de variables de entorno (Render/Cloud) o usa por defecto la configuración local (XAMPP/SQLServer)
$driver     = getenv('DB_DRIVER') ?: 'sqlsrv';
$serverName = getenv('DB_HOST')   ?: 'localhost\\SQLEXPRESS';
$database   = getenv('DB_NAME')   ?: 'ManeU_DB';
$uid        = getenv('DB_USER')   ?: 'sa';
$pwd        = getenv('DB_PASS')   ?: '0512';
$port       = getenv('DB_PORT')   ?: '';

try {
    if ($driver === 'mysql') {
        $portStr = $port ? ";port=$port" : "";
        $conn = new PDO("mysql:host=$serverName$portStr;dbname=$database;charset=utf8mb4", $uid, $pwd);
    } elseif ($driver === 'pgsql') {
        $portStr = $port ? ";port=$port" : ";port=5432";
        $dsn = "pgsql:host=$serverName$portStr;dbname=$database";
        try {
            $conn = new PDO($dsn, $uid, $pwd);
        } catch (PDOException $ex) {
            $conn = new PDO("$dsn;sslmode=require", $uid, $pwd);
        }
    } else {
        // Se establece la conexión utilizando PDO_SQLSRV (Local / Azure)
        $conn = new PDO("sqlsrv:server=$serverName;Database=$database;TrustServerCertificate=true", $uid, $pwd);
    }
    
    // Configurar PDO para que lance excepciones en caso de error
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode(["status" => "error", "message" => "Error de conexión a BD: " . $e->getMessage()]);
    exit;
}
?>


