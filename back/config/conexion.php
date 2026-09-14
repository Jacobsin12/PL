<?php
date_default_timezone_set('America/Mexico_City');

// 1. Si existe URL de base de datos (Render / Supabase / Railway), la usamos directamente
$dbUrl = getenv('INTERNAL_DATABASE_URL') ?: getenv('DATABASE_URL') ?: getenv('EXTERNAL_DATABASE_URL');

if ($dbUrl) {
    $parsed   = parse_url($dbUrl);
    $driver   = 'pgsql';
    $host     = $parsed['host'] ?? 'localhost';
    $database = ltrim($parsed['path'] ?? 'maneu_db', '/');
    $uid      = $parsed['user'] ?? '';
    $pwd      = $parsed['pass'] ?? '';
    $port     = $parsed['port'] ?? 5432;
    
    // Si la URL tiene dominio .render.com requiere SSL, si es hostname interno (dpg-xxx) va sin SSL
    $sslmode  = (strpos($host, '.') !== false) ? 'require' : 'disable';
    $dsn      = "pgsql:host=$host;port=$port;dbname=$database;sslmode=$sslmode";
} else {
    // 2. Si no hay URL, lee variables individuales o cae en tu configuración local (XAMPP / SQL Server)
    $driver   = getenv('DB_DRIVER') ?: 'sqlsrv';
    $host     = getenv('DB_HOST')   ?: 'localhost\\SQLEXPRESS';
    $database = getenv('DB_NAME')   ?: 'ManeU_DB';
    $uid      = getenv('DB_USER')   ?: 'sa';
    $pwd      = getenv('DB_PASS')   ?: '0512';
    $port     = getenv('DB_PORT')   ?: '';

    if ($driver === 'mysql') {
        $portStr = $port ? ";port=$port" : "";
        $dsn = "mysql:host=$host$portStr;dbname=$database;charset=utf8mb4";
    } elseif ($driver === 'pgsql') {
        $portStr = $port ? ";port=$port" : ";port=5432";
        $sslmode = (strpos($host, '.') !== false) ? 'require' : 'disable';
        $dsn = "pgsql:host=$host$portStr;dbname=$database;sslmode=$sslmode";
    } else {
        $dsn = "sqlsrv:server=$host;Database=$database;TrustServerCertificate=true";
    }
}

try {
    $conn = new PDO($dsn, $uid, $pwd);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 3. Auto-sincronizar el esquema de tablas si falta alguna columna o tabla
    if ($driver === 'pgsql' || $driver === 'mysql') {
        try {
            $sqlFile = __DIR__ . '/../db/script_creacion_' . ($driver === 'pgsql' ? 'pgsql' : 'mysql') . '.sql';
            if (file_exists($sqlFile)) {
                $conn->exec(file_get_contents($sqlFile));
            }
        } catch (Exception $eTable) {
            // Continuar normalmente
        }
    }
} catch(PDOException $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    echo json_encode(["status" => "error", "message" => "Error de conexion BD: " . $e->getMessage()]);
    exit;
}
?>
