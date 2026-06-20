<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['lecture_title']) && isset($input['notes'])) {
        try {
            // Check if note for this lecture already exists to update it, or insert new
            $checkStmt = $pdo->prepare("SELECT id FROM lecture_notes WHERE lecture_title = ?");
            $checkStmt->execute([$input['lecture_title']]);
            $existing = $checkStmt->fetch();
            
            if ($existing) {
                $stmt = $pdo->prepare("UPDATE lecture_notes SET notes = ?, saved_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$input['notes'], $existing['id']]);
                echo json_encode(["status" => "success", "message" => "Note updated successfully"]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO lecture_notes (lecture_title, notes) VALUES (?, ?)");
                $stmt->execute([$input['lecture_title'], $input['notes']]);
                echo json_encode(["status" => "success", "message" => "Note created successfully"]);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Failed to save note: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    }
} elseif ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM lecture_notes ORDER BY saved_at DESC");
        $results = $stmt->fetchAll();
        echo json_encode($results);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Failed to retrieve notes: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
