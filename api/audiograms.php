<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['loss_left']) && isset($input['loss_right']) && isset($input['data'])) {
        try {
            $stmt = $pdo->prepare("INSERT INTO audiograms (loss_left, loss_right, data) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['loss_left'],
                $input['loss_right'],
                is_array($input['data']) ? json_encode($input['data']) : $input['data']
            ]);
            echo json_encode(["status" => "success", "message" => "Audiogram saved successfully", "id" => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Failed to save audiogram: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM audiograms ORDER BY test_date DESC");
        $results = $stmt->fetchAll();
        
        // Decode data field
        foreach ($results as &$row) {
            $row['data'] = json_decode($row['data'], true);
        }
        
        echo json_encode($results);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Failed to retrieve audiograms: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
