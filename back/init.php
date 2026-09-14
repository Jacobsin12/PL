<?php
require_once __DIR__ . '/config/conexion.php';

header('Content-Type: application/json');

try {
    $driver = getenv('DB_DRIVER') ?: 'sqlsrv';
    
    if ($driver === 'pgsql') {
        $sqlFile = __DIR__ . '/db/script_creacion_pgsql.sql';
    } elseif ($driver === 'mysql') {
        $sqlFile = __DIR__ . '/db/script_creacion_mysql.sql';
    } else {
        $sqlFile = __DIR__ . '/db/script_creacion.sql';
    }

    if (!file_exists($sqlFile)) {
        throw new Exception("Archivo SQL no encontrado: " . basename($sqlFile));
    }

    $sql = file_get_contents($sqlFile);
    
    // Ejecutar el script SQL en la base de datos conectada
    $conn->exec($sql);

    echo json_encode([
        "status" => "success",
        "message" => "¡Base de datos inicializada correctamente!",
        "driver" => strtoupper($driver),
        "script" => basename($sqlFile)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al inicializar la base de datos: " . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
