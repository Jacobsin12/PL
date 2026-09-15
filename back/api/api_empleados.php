<?php
require_once '../config/conexion.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // LEER EMPLEADOS
        $sql = "SELECT e.*, p.nombre_completo as nombre_planta, a.nombre_area, t.descripcion as tipo_ingreso_desc,
                       c.correo_asignado, c.password_asignado, c.estatus as estatus_it, c.fecha_completada,
                       u.nombre as nombre_responsable_it
                FROM ingresos e
                LEFT JOIN planta p ON e.id_planta = p.id_planta
                LEFT JOIN area a ON e.id_area = a.id_area
                LEFT JOIN tipo_ingreso t ON e.id_tipo = t.id_tipo
                LEFT JOIN configuracion_it c ON e.id_ingreso = c.id_ingreso
                LEFT JOIN usuarios_sistema u ON c.id_responsable_it = u.id_usuario
                ORDER BY e.fecha_registro DESC";
        
        $stmt = $conn->query($sql);
        $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['status' => 'success', 'data' => $empleados]);
        
    } elseif ($method === 'POST') {
        // CREAR EMPLEADO(S)
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!$data && !empty($_POST)) {
            if (isset($_POST['mug']) && is_array($_POST['mug'])) {
                $items = [];
                $count = count($_POST['mug']);
                for ($i = 0; $i < $count; $i++) {
                    $items[] = [
                        'mug' => $_POST['mug'][$i] ?? '',
                        'numero_nomina' => $_POST['numero_nomina'][$i] ?? '',
                        'nombre' => $_POST['nombre'][$i] ?? '',
                        'apellido_paterno' => $_POST['apellido_paterno'][$i] ?? '',
                        'apellido_materno' => $_POST['apellido_materno'][$i] ?? '',
                        'puesto' => $_POST['puesto'][$i] ?? '',
                        'jefe_directo' => $_POST['jefe_directo'][$i] ?? '',
                        'id_planta' => $_POST['id_planta'][$i] ?? '',
                        'id_area' => $_POST['id_area'][$i] ?? '',
                        'id_tipo' => $_POST['id_tipo'][$i] ?? '',
                        'fecha_ingreso' => $_POST['fecha_ingreso'][$i] ?? '',
                        'imss' => $_POST['imss'][$i] ?? null,
                        'curp' => $_POST['curp'][$i] ?? null,
                        'domicilio' => $_POST['domicilio'][$i] ?? null,
                        'tipo_alta' => $_POST['tipo_alta'][$i] ?? 'Nuevo Ingreso',
                        'talla_zapato' => $_POST['talla_zapato'][$i] ?? null,
                        'talla_pantalon' => $_POST['talla_pantalon'][$i] ?? null,
                        'talla_playera' => $_POST['talla_playera'][$i] ?? null,
                        'camisola' => $_POST['camisola'][$i] ?? null,
                        'sobrelente' => $_POST['sobrelente'][$i] ?? null,
                        'tarjeta_solicitada' => $_POST['tarjeta_solicitada'][$i] ?? null,
                        'ruta_acceso' => $_POST['ruta_acceso'][$i] ?? null,
                        'ruta_entrada' => $_POST['ruta_entrada'][$i] ?? null,
                        'parada_entrada' => $_POST['parada_entrada'][$i] ?? null,
                        'ruta_salida' => $_POST['ruta_salida'][$i] ?? null,
                        'parada_salida' => $_POST['parada_salida'][$i] ?? null,
                        'numero_tarjeta' => $_POST['numero_tarjeta'][$i] ?? null
                    ];
                }
            } else {
                $items = [$_POST];
            }
        } elseif (isset($data[0]) && is_array($data[0])) {
            $items = $data;
        } else {
            $items = [$data];
        }

        $conn->beginTransaction();
        try {
            $sql = "INSERT INTO ingresos 
                    (mug, numero_nomina, nombre, apellido_paterno, apellido_materno, 
                     puesto, jefe_directo, id_planta, id_area, id_tipo, fecha_ingreso, fecha_registro,
                     imss, curp, domicilio, tipo_alta, talla_zapato, talla_pantalon, talla_playera,
                     camisola, sobrelente, tarjeta_solicitada, ruta_acceso, ruta_entrada,
                     parada_entrada, ruta_salida, parada_salida, numero_tarjeta)
                    VALUES 
                    (:mug, :numero_nomina, :nombre, :apellido_paterno, :apellido_materno, 
                     :puesto, :jefe_directo, :id_planta, :id_area, :id_tipo, :fecha_ingreso, :fecha_registro,
                     :imss, :curp, :domicilio, :tipo_alta, :talla_zapato, :talla_pantalon, :talla_playera,
                     :camisola, :sobrelente, :tarjeta_solicitada, :ruta_acceso, :ruta_entrada,
                     :parada_entrada, :ruta_salida, :parada_salida, :numero_tarjeta)";
                     
            $stmt = $conn->prepare($sql);
            $insertedIds = [];
            $countWithMug = 0;

            foreach ($items as $item) {
                if (empty($item['nombre']) || empty($item['apellido_paterno'])) {
                    throw new Exception('Falta el nombre o apellido paterno del colaborador en al menos un registro.');
                }
                
                $mugVal = isset($item['mug']) ? trim($item['mug']) : '';
                if ($mugVal !== '' && $mugVal !== '-') {
                    $countWithMug++;
                }

                $stmt->execute([
                    ':mug' => $mugVal,
                    ':numero_nomina' => isset($item['numero_nomina']) ? trim($item['numero_nomina']) : '',
                    ':nombre' => $item['nombre'],
                    ':apellido_paterno' => $item['apellido_paterno'] ?? '',
                    ':apellido_materno' => $item['apellido_materno'] ?? '',
                    ':puesto' => $item['puesto'] ?? '',
                    ':jefe_directo' => $item['jefe_directo'] ?? '',
                    ':id_planta' => !empty($item['id_planta']) ? $item['id_planta'] : null,
                    ':id_area' => !empty($item['id_area']) ? $item['id_area'] : null,
                    ':id_tipo' => !empty($item['id_tipo']) ? $item['id_tipo'] : null,
                    ':fecha_ingreso' => !empty($item['fecha_ingreso']) ? $item['fecha_ingreso'] : date('Y-m-d'),
                    ':fecha_registro' => isset($item['fecha_registro']) && !empty($item['fecha_registro']) ? $item['fecha_registro'] : date('Y-m-d H:i:s'),
                    ':imss' => $item['imss'] ?? null,
                    ':curp' => $item['curp'] ?? null,
                    ':domicilio' => $item['domicilio'] ?? null,
                    ':tipo_alta' => $item['tipo_alta'] ?? 'Nuevo Ingreso',
                    ':talla_zapato' => $item['talla_zapato'] ?? null,
                    ':talla_pantalon' => $item['talla_pantalon'] ?? null,
                    ':talla_playera' => $item['talla_playera'] ?? null,
                    ':camisola' => $item['camisola'] ?? null,
                    ':sobrelente' => $item['sobrelente'] ?? null,
                    ':tarjeta_solicitada' => $item['tarjeta_solicitada'] ?? null,
                    ':ruta_acceso' => $item['ruta_acceso'] ?? null,
                    ':ruta_entrada' => $item['ruta_entrada'] ?? null,
                    ':parada_entrada' => $item['parada_entrada'] ?? null,
                    ':ruta_salida' => $item['ruta_salida'] ?? null,
                    ':parada_salida' => $item['parada_salida'] ?? null,
                    ':numero_tarjeta' => $item['numero_tarjeta'] ?? null
                ]);

                $lastId = $conn->lastInsertId();
                if ($lastId) {
                    $insertedIds[] = $lastId;
                }
            }

            // Crear registros de configuracion_it para las nuevas altas
            $stmtConfig = $conn->prepare("INSERT INTO configuracion_it (id_ingreso, estatus) VALUES (:id_ingreso, 'pendiente')");
            foreach ($insertedIds as $idIngreso) {
                $stmtConfig->execute([':id_ingreso' => $idIngreso]);
            }

            // Notificar al departamento de IT (rol_id = 3) solo si TODOS los registros de la carga cuentan con MUG
            $countNew = count($insertedIds);
            if ($countNew > 0 && $countWithMug === $countNew) {
                $titulo = $countNew === 1 ? 'Nueva Alta Registrada con MUG' : 'Nueva Carga Masiva Registrada con MUG';
                $mensaje = $countNew === 1 
                    ? 'RH ha registrado 1 nueva alta con MUG lista para configurar.' 
                    : "RH ha completado {$countNew} nuevas altas con MUG listas para configurar.";
                
                $stmtNotif = $conn->prepare("INSERT INTO notificaciones (id_rol_destino, tipo, titulo, mensaje, url_referencia) VALUES (3, 'nueva_alta', :titulo, :mensaje, 'it_dashboard.html')");
                $stmtNotif->execute([
                    ':titulo' => $titulo,
                    ':mensaje' => $mensaje
                ]);
            }
            
            $conn->commit();
            $msg = count($items) > 1 ? count($items) . ' empleados creados correctamente.' : 'Empleado creado correctamente.';
            echo json_encode(['status' => 'success', 'message' => $msg, 'inserted_ids' => $insertedIds]);
            
        } catch (Exception $ex) {
            $conn->rollBack();
            echo json_encode(['status' => 'error', 'message' => $ex->getMessage()]);
        }
        
    } elseif ($method === 'PUT') {
        // ACTUALIZAR EMPLEADO
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id_ingreso'])) {
            echo json_encode(['status' => 'error', 'message' => 'Falta el ID del empleado a actualizar.']);
            exit;
        }
        
        $sql = "UPDATE ingresos SET 
                    mug = :mug, 
                    numero_nomina = :numero_nomina, 
                    nombre = :nombre, 
                    apellido_paterno = :apellido_paterno, 
                    apellido_materno = :apellido_materno, 
                    puesto = :puesto, 
                    jefe_directo = :jefe_directo, 
                    id_planta = :id_planta, 
                    id_area = :id_area, 
                    id_tipo = :id_tipo, 
                    fecha_ingreso = :fecha_ingreso,
                    imss = :imss,
                    curp = :curp,
                    domicilio = :domicilio,
                    tipo_alta = :tipo_alta,
                    talla_zapato = :talla_zapato,
                    talla_pantalon = :talla_pantalon,
                    talla_playera = :talla_playera,
                    camisola = :camisola,
                    sobrelente = :sobrelente,
                    tarjeta_solicitada = :tarjeta_solicitada,
                    ruta_acceso = :ruta_acceso,
                    ruta_entrada = :ruta_entrada,
                    parada_entrada = :parada_entrada,
                    ruta_salida = :ruta_salida,
                    parada_salida = :parada_salida,
                    numero_tarjeta = :numero_tarjeta
                WHERE id_ingreso = :id_ingreso";
                 
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':mug' => $data['mug'] ?? '',
            ':numero_nomina' => $data['numero_nomina'] ?? '',
            ':nombre' => $data['nombre'] ?? '',
            ':apellido_paterno' => $data['apellido_paterno'] ?? '',
            ':apellido_materno' => $data['apellido_materno'] ?? '',
            ':puesto' => $data['puesto'] ?? '',
            ':jefe_directo' => $data['jefe_directo'] ?? '',
            ':id_planta' => !empty($data['id_planta']) ? $data['id_planta'] : null,
            ':id_area' => !empty($data['id_area']) ? $data['id_area'] : null,
            ':id_tipo' => !empty($data['id_tipo']) ? $data['id_tipo'] : null,
            ':fecha_ingreso' => !empty($data['fecha_ingreso']) ? $data['fecha_ingreso'] : null,
            ':imss' => $data['imss'] ?? null,
            ':curp' => $data['curp'] ?? null,
            ':domicilio' => $data['domicilio'] ?? null,
            ':tipo_alta' => $data['tipo_alta'] ?? 'Nuevo Ingreso',
            ':talla_zapato' => $data['talla_zapato'] ?? null,
            ':talla_pantalon' => $data['talla_pantalon'] ?? null,
            ':talla_playera' => $data['talla_playera'] ?? null,
            ':camisola' => $data['camisola'] ?? null,
            ':sobrelente' => $data['sobrelente'] ?? null,
            ':tarjeta_solicitada' => $data['tarjeta_solicitada'] ?? null,
            ':ruta_acceso' => $data['ruta_acceso'] ?? null,
            ':ruta_entrada' => $data['ruta_entrada'] ?? null,
            ':parada_entrada' => $data['parada_entrada'] ?? null,
            ':ruta_salida' => $data['ruta_salida'] ?? null,
            ':parada_salida' => $data['parada_salida'] ?? null,
            ':numero_tarjeta' => $data['numero_tarjeta'] ?? null,
            ':id_ingreso' => $data['id_ingreso']
        ]);
        
        echo json_encode(['status' => 'success', 'message' => 'Empleado actualizado correctamente.']);
        
    } elseif ($method === 'DELETE') {
        // ELIMINAR EMPLEADO
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id_ingreso'])) {
            echo json_encode(['status' => 'error', 'message' => 'Falta el ID del empleado a eliminar.']);
            exit;
        }
        
        $sql = "DELETE FROM ingresos WHERE id_ingreso = :id_ingreso";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':id_ingreso' => $data['id_ingreso']]);
        
        echo json_encode(['status' => 'success', 'message' => 'Empleado eliminado correctamente.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
