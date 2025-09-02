<?php
// upload.php
$targetDir = __DIR__ . "/img/avatar/uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];

    // Sicherheitschecks
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Allowed files: JPG, PNG, GIF, WEBP']);
        exit;
    }

    if ($file['size'] > 2 * 1024 * 1024) { // 2 MB
        http_response_code(400);
        echo json_encode(['error' => 'File size to large']);
        exit;
    }

    // Eindeutiger Dateiname (z. B. user123.jpg)
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid("user_", true) . "." . $ext;

    $targetFile = $targetDir . $filename;
    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        $url = "https://dein-server.de/uploads/" . $filename;
        echo json_encode(['url' => $url]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Upload failed']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request']);
}

?>