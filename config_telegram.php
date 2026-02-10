<?php
/**
 * TEST DE TELEGRAM BOT
 * ====================
 * Este archivo sirve para probar que tu bot de Telegram funciona correctamente
 * 
 * INSTRUCCIONES:
 * 1. Subí este archivo a tu servidor
 * 2. Abrilo en tu navegador: http://tudominio.com/test_telegram.php
 * 3. Deberías recibir un mensaje en tu bot de Telegram
 * 4. Si no lo recibís, revisá el token y chat ID
 */

// ⚠️ PEGÁ TUS DATOS AQUÍ (los mismos que en procesar_pago.php)
define('TELEGRAM_BOT_TOKEN', '8454773246:AAF64i_9OA_L9zbKBlJXlPdKvyUCj5pBvR4');
define('TELEGRAM_CHAT_ID', '8454773246');

echo "<h1>Test de Telegram Bot</h1>";
echo "<p>Bot Token: " . substr(TELEGRAM_BOT_TOKEN, 0, 20) . "...</p>";
echo "<p>Chat ID: " . TELEGRAM_CHAT_ID . "</p>";
echo "<hr>";

// Construir URL de la API
$apiUrl = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";

// Mensaje de prueba
$mensaje = "🧪 <b>TEST DE CONEXIÓN</b>\n\n";
$mensaje .= "✅ El bot de Telegram está funcionando correctamente\n";
$mensaje .= "📅 Fecha: " . date('d/m/Y H:i:s') . "\n";
$mensaje .= "🌐 IP: " . $_SERVER['REMOTE_ADDR'];

// Datos a enviar
$data = [
    'chat_id' => TELEGRAM_CHAT_ID,
    'text' => $mensaje,
    'parse_mode' => 'HTML'
];

echo "<h2>Enviando mensaje de prueba...</h2>";
echo "<pre>Mensaje: " . htmlspecialchars($mensaje) . "</pre>";

// Enviar usando cURL
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Mostrar resultados
echo "<hr>";
echo "<h2>Resultados:</h2>";
echo "<p><strong>HTTP Code:</strong> $httpCode</p>";

if ($curlError) {
    echo "<p style='color: red;'><strong>Error cURL:</strong> $curlError</p>";
}

echo "<h3>Respuesta de Telegram:</h3>";
echo "<pre>" . htmlspecialchars($result) . "</pre>";

// Decodificar y mostrar bonito
$response = json_decode($result, true);

if ($httpCode === 200 && isset($response['ok']) && $response['ok'] === true) {
    echo "<h2 style='color: green;'>✅ ¡ÉXITO! El mensaje fue enviado</h2>";
    echo "<p>Revisá tu bot de Telegram, deberías haber recibido el mensaje de prueba.</p>";
} else {
    echo "<h2 style='color: red;'>❌ ERROR</h2>";
    
    if (isset($response['description'])) {
        echo "<p><strong>Descripción del error:</strong> " . $response['description'] . "</p>";
        
        // Ayuda según el error
        if (strpos($response['description'], 'bot token') !== false) {
            echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;'>";
            echo "<h3>⚠️ Problema con el Token</h3>";
            echo "<p>El token del bot es incorrecto. Verificá que:</p>";
            echo "<ol>";
            echo "<li>Hayas copiado el token completo de BotFather</li>";
            echo "<li>No tenga espacios al principio o al final</li>";
            echo "<li>Sea del formato: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz</li>";
            echo "</ol>";
            echo "</div>";
        }
        
        if (strpos($response['description'], 'chat not found') !== false || strpos($response['description'], 'PEER_ID_INVALID') !== false) {
            echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;'>";
            echo "<h3>⚠️ Problema con el Chat ID</h3>";
            echo "<p>El Chat ID es incorrecto. Para obtenerlo correctamente:</p>";
            echo "<ol>";
            echo "<li>Buscá tu bot en Telegram (el username que elegiste)</li>";
            echo "<li>Enviále el mensaje: /start</li>";
            echo "<li>Abrí esta URL en tu navegador (reemplazá con TU token):</li>";
            echo "<li><code>https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/getUpdates</code></li>";
            echo "<li>Buscá el número en 'chat':{'id': NUMERO_AQUI}</li>";
            echo "<li>Ese número es tu Chat ID</li>";
            echo "</ol>";
            echo "</div>";
        }
    }
}

echo "<hr>";
echo "<h3>📚 Pasos para solucionar problemas:</h3>";
echo "<ol>";
echo "<li><strong>Verificar el Token:</strong> Asegurate de que el token sea correcto (obtenido de BotFather)</li>";
echo "<li><strong>Iniciar el bot:</strong> Abrí Telegram, buscá tu bot y enviále /start</li>";
echo "<li><strong>Obtener Chat ID:</strong> Abrí esta URL: https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/getUpdates</li>";
echo "<li><strong>Copiar Chat ID:</strong> Buscá el número en 'chat':{'id': NUMERO} y copialo</li>";
echo "<li><strong>Actualizar archivos:</strong> Pegá el Chat ID correcto en procesar_pago.php y test_telegram.php</li>";
echo "</ol>";

echo "<hr>";
echo "<p><a href='test_telegram.php'>🔄 Probar de nuevo</a></p>";
?>