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
        $hostsToTry = [$serverName];
        if (strpos($serverName, 'dpg-') === 0 && strpos($serverName, '.') === false) {
            $hostsToTry[] = $serverName . '.oregon-postgres.render.com';
            $hostsToTry[] = $serverName . '.frankfurt-postgres.render.com';
            $hostsToTry[] = $serverName . '.ohio-postgres.render.com';
            $hostsToTry[] = $serverName . '.singapore-postgres.render.com';
        }

        $lastException = null;
        $connected = false;
        foreach ($hostsToTry as $h) {
            $dsn = "pgsql:host=$h$portStr;dbname=$database";
            try {
                $conn = new PDO($dsn, $uid, $pwd);
                $connected = true;
                break;
            } catch (PDOException $ex1) {
                try {
                    $conn = new PDO("$dsn;sslmode=require", $uid, $pwd);
                    $connected = true;
                    break;
                } catch (PDOException $ex2) {
                    $lastException = $ex2;
                }
            }
        }
        if (!$connected && $lastException) {
            throw $lastException;
        }
    } else {
        // Se establece la conexión utilizando PDO_SQLSRV (Local / Azure)
        $conn = new PDO("sqlsrv:server=$serverName;Database=$database;TrustServerCertificate=true", $uid, $pwd);
    }
    
    // Configurar PDO para que lance excepciones en caso de error
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Auto-crear tablas e insertar datos iniciales en PostgreSQL/MySQL si aún no existen
    if ($driver === 'pgsql' || $driver === 'mysql') {
        try {
            $conn->query("SELECT 1 FROM usuarios_sistema LIMIT 1");
        } catch (Exception $eTable) {
            $sqlFile = __DIR__ . '/../db/script_creacion_' . ($driver === 'pgsql' ? 'pgsql' : 'mysql') . '.sql';
            if (file_exists($sqlFile)) {
                $conn->exec(file_get_contents($sqlFile));
            }
        }
    }

} catch(PDOException $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode(["status" => "error", "message" => "Error de conexión a BD: " . $e->getMessage()]);
    exit;
}
?>




