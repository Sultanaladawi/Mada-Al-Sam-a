<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['freq_high']) && isset($input['noise_reduction']) && isset($input['voice_enhance'])) {
        try {
            // Check if settings table has any rows
            $check = $pdo->query("SELECT id FROM audio_settings LIMIT 1")->fetch();
            
            if ($check) {
                $stmt = $pdo->prepare("UPDATE audio_settings SET freq_high = ?, noise_reduction = ?, voice_enhance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$input['freq_high'], $input['noise_reduction'], $input['voice_enhance'], $check['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO audio_settings (freq_high, noise_reduction, voice_enhance) VALUES (?, ?, ?)");
                $stmt->execute([$input['freq_high'], $input['noise_reduction'], $input['voice_enhance']]);
            }
            echo json_encode(["status" => "success", "message" => "Settings updated successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Failed to save settings: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM audio_settings ORDER BY id DESC LIMIT 1");
        $result = $stmt->fetch();
        
        if (!$result) {
            // default fallback
            $result = [
                "freq_high" => 65,
                "noise_reduction" => 80,
                "voice_enhance" => 70
            ];
        }
        echo json_encode($result);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Failed to retrieve settings: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
