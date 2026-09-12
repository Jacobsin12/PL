<?php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION['usuario_id'])) {
    echo json_encode([
        "status" => "success",
        "logged_in" => true,
        "usuario_id" => $_SESSION['usuario_id'],
        "nombre" => $_SESSION['nombre'],
        "rol_id" => $_SESSION['rol_id']
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "logged_in" => false,
        "message" => "No has iniciado sesión"
    ]);
}
?>
