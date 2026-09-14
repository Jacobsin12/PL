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
        // Soporte para URL completa de Render DATABASE_URL o INTERNAL_DATABASE_URL
        $envUrl = getenv('DATABASE_URL') ?: getenv('INTERNAL_DATABASE_URL') ?: getenv('EXTERNAL_DATABASE_URL');
        if ($envUrl) {
            $parsed = parse_url($envUrl);
            if ($parsed && isset($parsed['host'])) {
                $serverName = $parsed['host'];
                if (isset($parsed['user'])) $uid = $parsed['user'];
                if (isset($parsed['pass'])) $pwd = $parsed['pass'];
                if (isset($parsed['path'])) $database = ltrim($parsed['path'], '/');
                if (isset($parsed['port'])) $port = $parsed['port'];
            }
        }

        if (strpos($serverName, 'pg-') === 0) {
            $serverName = 'd' . $serverName;
        }

        $baseId = (strpos($serverName, 'dpg-') === 0) ? explode('.', $serverName)[0] : $serverName;
        $fqdn   = (strpos($serverName, 'dpg-') === 0 && strpos($serverName, '.') === false) 
                  ? $serverName . '.oregon-postgres.render.com' 
                  : $serverName;
        $portVal = $port ?: '5432';
        $caCert  = '/etc/ssl/certs/ca-certificates.crt';

        $dsnCandidates = [
            // Sintaxis LibPQ con espacios (Estándar recomendado de PostgreSQL en PHP/Docker)
            "pgsql:host=$fqdn port=$portVal dbname=$database sslmode=require",
            "pgsql:host=$fqdn port=$portVal dbname=$database sslmode=require sslrootcert=$caCert",
            "pgsql:host=$fqdn port=$portVal dbname=$database sslmode=prefer",
            "pgsql:host=$baseId port=$portVal dbname=$database sslmode=disable",
            "pgsql:host=$baseId port=$portVal dbname=$database",

            // Sintaxis clásica PDO con punto y coma
            "pgsql:host=$fqdn;port=$portVal;dbname=$database;sslmode=require",
            "pgsql:host=$fqdn;port=$portVal;dbname=$database;sslmode=require;sslrootcert=$caCert",
            "pgsql:host=$fqdn;port=$portVal;dbname=$database;sslmode=prefer",
            "pgsql:host=$baseId;port=$portVal;dbname=$database;sslmode=disable",
            "pgsql:host=$baseId;port=$portVal;dbname=$database",
        ];

        $connected = false;
        $errors = [];

        foreach ($dsnCandidates as $dsn) {
            try {
                $conn = new PDO($dsn, $uid, $pwd);
                $connected = true;
                break;
            } catch (PDOException $ex) {
                $errors[] = "[$dsn]: " . $ex->getMessage();
            }
        }

        if (!$connected) {
            throw new PDOException("Fallaron todos los intentos de conexión:\n" . implode("\n", array_slice($errors, 0, 4)));
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





