<?php
date_default_timezone_set('America/Mexico_City');

// Detectar si estamos en entorno local (localhost / 127.0.0.1)
$isLocal = !isset($_SERVER['HTTP_HOST']) || (
    strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
    strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false
);

// 1. Si existe URL de base de datos en la nube (Render / Supabase) y NO estamos en localhost
$dbUrl = getenv('INTERNAL_DATABASE_URL') ?: getenv('DATABASE_URL') ?: getenv('EXTERNAL_DATABASE_URL');

if ($dbUrl && !$isLocal) {
    $parsed   = parse_url($dbUrl);
    $driver   = 'pgsql';
    $host     = $parsed['host'] ?? 'localhost';
    $database = ltrim($parsed['path'] ?? 'maneu_db', '/');
    $uid      = $parsed['user'] ?? '';
    $pwd      = $parsed['pass'] ?? '';
    $port     = $parsed['port'] ?? 5432;
    
    $sslmode  = (strpos($host, '.') !== false) ? 'require' : 'disable';
    $dsn      = "pgsql:host=$host;port=$port;dbname=$database;sslmode=$sslmode";
} else {
    // 2. Configuración Local (SQL Server en localhost\SQLEXPRESS con Windows Auth o env vars)
    $driver   = getenv('DB_DRIVER') ?: 'sqlsrv';
    $host     = getenv('DB_HOST')   ?: 'localhost\\SQLEXPRESS';
    $database = getenv('DB_NAME')   ?: 'ManeU_DB';
    $uid      = getenv('DB_USER')   ?: null;
    $pwd      = getenv('DB_PASS')   ?: null;
    $port     = getenv('DB_PORT')   ?: '';

    if ($driver === 'mysql') {
        $portStr = $port ? ";port=$port" : "";
        $dsn = "mysql:host=$host$portStr;dbname=$database;charset=utf8mb4";
        $uid = $uid !== null ? $uid : 'root';
        $pwd = $pwd !== null ? $pwd : '';
    } elseif ($driver === 'pgsql') {
        $portStr = $port ? ";port=$port" : ";port=5432";
        $sslmode = (strpos($host, '.') !== false) ? 'require' : 'disable';
        $dsn = "pgsql:host=$host$portStr;dbname=$database;sslmode=$sslmode";
    } else {
        $dsn = "sqlsrv:server=$host;Database=$database;TrustServerCertificate=true";
    }
}

try {
    if ($uid !== null && $pwd !== null) {
        $conn = new PDO($dsn, $uid, $pwd);
    } else {
        $conn = new PDO($dsn);
    }
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 3. Auto-sincronizar el esquema de tablas solo si las tablas no han sido creadas aún
    if ($driver === 'pgsql' || $driver === 'mysql') {
        try {
            $conn->query("SELECT 1 FROM configuracion_it LIMIT 1");
        } catch (Exception $eCheck) {
            try {
                $sqlFile = __DIR__ . '/../db/script_creacion_' . ($driver === 'pgsql' ? 'pgsql' : 'mysql') . '.sql';
                if (file_exists($sqlFile)) {
                    $conn->exec(file_get_contents($sqlFile));
                }
            } catch (Exception $eTable) {
                // Continuar normalmente
            }
        }
    }
} catch (PDOException $e) {
    // Si falla con usuario/contraseña en SQL Server, reintentar con Windows Authentication
    if (isset($driver) && $driver === 'sqlsrv' && $uid !== null) {
        try {
            $conn = new PDO($dsn);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $eWin) {
            if (!headers_sent()) header('Content-Type: application/json');
            echo json_encode(["status" => "error", "message" => "Error de conexion BD Local: " . $eWin->getMessage()]);
            exit;
        }
    } else {
        if (!headers_sent()) header('Content-Type: application/json');
        echo json_encode(["status" => "error", "message" => "Error de conexion BD: " . $e->getMessage()]);
        exit;
    }
}
?>
