<?php
require_once '../config/conexion.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $catalogos = [];
    
    // Plantas
    $stmt = $conn->query("SELECT id_planta, siglas, nombre_completo FROM planta ORDER BY nombre_completo");
    $catalogos['plantas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Areas
    $stmt = $conn->query("SELECT id_area, nombre_area FROM area ORDER BY nombre_area");
    $catalogos['areas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Tipos de Ingreso
    $stmt = $conn->query("SELECT id_tipo, descripcion FROM tipo_ingreso ORDER BY descripcion");
    $catalogos['tipos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'data' => $catalogos]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
