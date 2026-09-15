<?php
session_start();
require_once '../config/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$userId = isset($_SESSION['usuario_id']) ? $_SESSION['usuario_id'] : null;
$rolId = isset($_SESSION['rol_id']) ? $_SESSION['rol_id'] : null;

if (!$userId || !$rolId) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado.']);
    exit;
}

try {
    if ($method === 'GET') {
        $onlyCount = isset($_GET['count']) && $_GET['count'] === 'true';

        $dbDriver = $conn->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($onlyCount) {
            $sql = "SELECT COUNT(*) as total FROM notificaciones 
                    WHERE leida = 0 
                    AND (id_usuario_destino = :userId OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId))";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':userId' => $userId, ':rolId' => $rolId]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get latest unread notification for push purposes
            if ($dbDriver === 'sqlsrv') {
                $sqlLatest = "SELECT TOP 1 id_notificacion, titulo, mensaje FROM notificaciones 
                              WHERE leida = 0 
                              AND (id_usuario_destino = :userId2 OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId2))
                              ORDER BY id_notificacion DESC";
            } else {
                $sqlLatest = "SELECT id_notificacion, titulo, mensaje FROM notificaciones 
                              WHERE leida = 0 
                              AND (id_usuario_destino = :userId2 OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId2))
                              ORDER BY id_notificacion DESC LIMIT 1";
            }
            $stmtLatest = $conn->prepare($sqlLatest);
            $stmtLatest->execute([':userId2' => $userId, ':rolId2' => $rolId]);
            $latest = $stmtLatest->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success', 
                'unread_count' => (int)$res['total'],
                'latest_unread' => $latest ? $latest : null
            ]);
        } else {
            if ($dbDriver === 'sqlsrv') {
                $sql = "SELECT TOP 30 * FROM notificaciones 
                        WHERE (id_usuario_destino = :userId OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId))
                        ORDER BY leida ASC, fecha_creacion DESC";
            } else {
                $sql = "SELECT * FROM notificaciones 
                        WHERE (id_usuario_destino = :userId OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId))
                        ORDER BY leida ASC, fecha_creacion DESC LIMIT 30";
            }
            $stmt = $conn->prepare($sql);
            $stmt->execute([':userId' => $userId, ':rolId' => $rolId]);
            $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['status' => 'success', 'data' => $notificaciones]);
        }

    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        $markAll = isset($data['mark_all_read']) && $data['mark_all_read'] === true;
        $idNotif = isset($data['id_notificacion']) ? $data['id_notificacion'] : null;

        if ($markAll) {
            $sql = "UPDATE notificaciones SET leida = 1 
                    WHERE (id_usuario_destino = :userId OR (id_usuario_destino IS NULL AND id_rol_destino = :rolId))";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':userId' => $userId, ':rolId' => $rolId]);
            echo json_encode(['status' => 'success', 'message' => 'Todas las notificaciones fueron marcadas como leídas.']);
        } elseif ($idNotif) {
            $sql = "UPDATE notificaciones SET leida = 1 WHERE id_notificacion = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':id' => $idNotif]);
            echo json_encode(['status' => 'success', 'message' => 'Notificación marcada como leída.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Falta parámetro id_notificacion o mark_all_read.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
