<?php
session_start();
require '../config/conexion.php'; // Incluir la conexión a SQL Server

header('Content-Type: application/json');

// Recibir los datos enviados por JS
$data = json_decode(file_get_contents("php://input"), true);
$correo = isset($data['correo']) ? $data['correo'] : '';
$password = isset($data['password']) ? $data['password'] : '';

if(empty($correo) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Por favor ingresa correo y contraseña."]);
    exit;
}

try {
    // Buscar al usuario por correo
    $sql = "SELECT id_usuario, nombre, correo, password_hash, id_rol FROM usuarios_sistema WHERE correo = :correo";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':correo', $correo);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verificar si el usuario existe y la contraseña coincide (usando password_verify para bcrypt)
    if ($user && password_verify($password, $user['password_hash'])) {
        // Credenciales correctas, iniciar sesión
        $_SESSION['usuario_id'] = $user['id_usuario'];
        $_SESSION['nombre'] = $user['nombre'];
        $_SESSION['rol_id'] = $user['id_rol'];

        echo json_encode([
            "status" => "success", 
            "message" => "Inicio de sesión exitoso.",
            "rol_id" => $user['id_rol']
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Correo o contraseña incorrectos."]);
    }

} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error en la base de datos."]);
}
?>
