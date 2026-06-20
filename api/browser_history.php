<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['url']) && isset($input['title'])) {
        try {
            $stmt = $pdo->prepare("INSERT INTO browser_history (url, title) VALUES (?, ?)");
            $stmt->execute([$input['url'], $input['title']]);
            echo json_encode(["status" => "success", "message" => "History entry saved successfully"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Failed to save history: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM browser_history ORDER BY visited_at DESC LIMIT 100");
        $results = $stmt->fetchAll();
        echo json_encode($results);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Failed to retrieve history: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
