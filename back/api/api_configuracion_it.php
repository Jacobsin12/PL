<?php
session_start();
require_once '../config/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $estatus = isset($_GET['estatus']) ? $_GET['estatus'] : null;
        
        $sql = "SELECT c.*, 
                       i.mug, i.numero_nomina, i.nombre, i.apellido_paterno, i.apellido_materno,
                       i.puesto, i.jefe_directo, i.fecha_ingreso, i.fecha_registro,
                       p.nombre_completo as nombre_planta, a.nombre_area, t.descripcion as tipo_ingreso_desc,
                       u.nombre as nombre_responsable
                FROM configuracion_it c
                INNER JOIN ingresos i ON c.id_ingreso = i.id_ingreso
                LEFT JOIN planta p ON i.id_planta = p.id_planta
                LEFT JOIN area a ON i.id_area = a.id_area
                LEFT JOIN tipo_ingreso t ON i.id_tipo = t.id_tipo
                LEFT JOIN usuarios_sistema u ON c.id_responsable_it = u.id_usuario
                WHERE i.mug IS NOT NULL AND TRIM(i.mug) != '' AND TRIM(i.mug) != '-'";
        
        if ($estatus) {
            $sql .= " AND c.estatus = :estatus";
        }
        
        $sql .= " ORDER BY i.fecha_registro DESC";
        
        $stmt = $conn->prepare($sql);
        if ($estatus) {
            $stmt->execute([':estatus' => $estatus]);
        } else {
            $stmt->execute();
        }
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $data]);

    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            echo json_encode(['status' => 'error', 'message' => 'Datos inválidos.']);
            exit;
        }

        // Normalizar a array de items
        $items = (isset($data[0]) && is_array($data[0])) ? $data : [$data];
        $currentUserId = isset($_SESSION['usuario_id']) ? $_SESSION['usuario_id'] : null;

        $conn->beginTransaction();

        $sql = "UPDATE configuracion_it SET 
                    correo_asignado = :correo_asignado,
                    password_asignado = :password_asignado,
                    correo_creado = :correo_creado,
                    password_configurada = :password_configurada,
                    permisos_ad = :permisos_ad,
                    equipo_entregado = :equipo_entregado,
                    config_completada = :config_completada,
                    id_responsable_it = COALESCE(:id_responsable_it, id_responsable_it),
                    estatus = :estatus,
                    fecha_completada = CASE WHEN :estatus_check = 'completada' AND fecha_completada IS NULL THEN CURRENT_TIMESTAMP ELSE fecha_completada END,
                    notas = :notas
                WHERE id_config = :id_config OR id_ingreso = :id_ingreso";

        $stmt = $conn->prepare($sql);
        $completedCount = 0;
        $namesCompleted = [];

        foreach ($items as $item) {
            $idConfig = isset($item['id_config']) ? $item['id_config'] : null;
            $idIngreso = isset($item['id_ingreso']) ? $item['id_ingreso'] : null;

            if (!$idConfig && !$idIngreso) {
                continue;
            }

            $correo = isset($item['correo_asignado']) ? trim($item['correo_asignado']) : null;
            $password = isset($item['password_asignado']) ? trim($item['password_asignado']) : 'QueretaroMex2026*';
            $cComp = !empty($item['config_completada']) ? 1 : 0;
            $notas = isset($item['notas']) ? trim($item['notas']) : null;

            // Determinar estatus
            $estatus = isset($item['estatus']) ? $item['estatus'] : 'pendiente';
            if ($cComp == 1 || $estatus === 'completada') {
                $estatus = 'completada';
                $cComp = 1;
            } elseif (!empty($correo)) {
                if ($estatus !== 'completada') {
                    $estatus = 'en_proceso';
                }
            }

            $stmt->execute([
                ':correo_asignado' => $correo,
                ':password_asignado' => $password,
                ':correo_creado' => $cComp,
                ':password_configurada' => $cComp,
                ':permisos_ad' => $cComp,
                ':equipo_entregado' => $cComp,
                ':config_completada' => $cComp,
                ':id_responsable_it' => $currentUserId,
                ':estatus' => $estatus,
                ':estatus_check' => $estatus,
                ':notas' => $notas,
                ':id_config' => $idConfig,
                ':id_ingreso' => $idIngreso
            ]);

            if ($estatus === 'completada') {
                $completedCount++;
                // Obtener nombre del empleado para la notificación
                $stmtEmp = $conn->prepare("SELECT nombre, apellido_paterno FROM ingresos WHERE id_ingreso = :id OR id_ingreso = (SELECT id_ingreso FROM configuracion_it WHERE id_config = :ic)");
                $stmtEmp->execute([':id' => $idIngreso, ':ic' => $idConfig]);
                $emp = $stmtEmp->fetch(PDO::FETCH_ASSOC);
                if ($emp) {
                    $namesCompleted[] = $emp['nombre'] . ' ' . $emp['apellido_paterno'];
                }
            }
        }

        // Si se completaron altas, notificar a RH (rol_id = 2)
        if ($completedCount > 0) {
            $titulo = $completedCount === 1 ? 'Alta Configurada por IT' : "{$completedCount} Altas Configuradas por IT";
            $msgNames = count($namesCompleted) > 0 ? implode(', ', array_slice($namesCompleted, 0, 3)) . (count($namesCompleted) > 3 ? '...' : '') : '';
            $mensaje = $completedCount === 1 
                ? "IT completó la configuración para {$msgNames}."
                : "IT completó la configuración de {$completedCount} empleados ({$msgNames}).";

            $stmtNotif = $conn->prepare("INSERT INTO notificaciones (id_rol_destino, tipo, titulo, mensaje, url_referencia) VALUES (2, 'alta_completada', :titulo, :mensaje, 'rh_dashboard.html')");
            $stmtNotif->execute([
                ':titulo' => $titulo,
                ':mensaje' => $mensaje
            ]);
        }

        $conn->commit();
        echo json_encode(['status' => 'success', 'message' => 'Configuración actualizada correctamente.']);

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);
    }
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
