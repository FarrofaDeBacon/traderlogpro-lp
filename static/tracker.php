<?php
// PHP self-hosted lead capture & download tracker
// Deployed as part of SvelteKit static build to Hostinger Apache server

// Handle CORS for development (allowing localhost calls to local/staging PHP server)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
$dataDir = __DIR__ . '/data';
$downloadsFile = $dataDir . '/downloads.txt';
$visitsFile = $dataDir . '/visits.txt';
$leadsFile = $dataDir . '/leads.csv';

$baseDownloads = 92;
$baseVisits = 150;

// Ensure data directory exists and is protected
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Enforce Apache Deny from all on the database folder
if (!file_exists($dataDir . '/.htaccess')) {
    file_put_contents($dataDir . '/.htaccess', "Deny from all\n");
}

// Load current stats
$downloadsOffset = file_exists($downloadsFile) ? (int)file_get_contents($downloadsFile) : 0;
$visitsOffset = file_exists($visitsFile) ? (int)file_get_contents($visitsFile) : 0;

$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'status';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'status') {
    // Return current global counts
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'downloads' => $baseDownloads + $downloadsOffset,
        'visits' => $baseVisits + $visitsOffset
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    if ($action === 'visit') {
        $visitsOffset++;
        file_put_contents($visitsFile, $visitsOffset, LOCK_EX);
        
        echo json_encode([
            'success' => true,
            'downloads' => $baseDownloads + $downloadsOffset,
            'visits' => $baseVisits + $visitsOffset
        ]);
        exit;
    }
    
    if ($action === 'download') {
        // Read input JSON
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }
        
        $name = isset($input['name']) ? trim($input['name']) : '';
        $email = isset($input['email']) ? trim($input['email']) : '';
        $whatsapp = isset($input['whatsapp']) ? trim($input['whatsapp']) : '';
        
        if (empty($name) || empty($email)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Nome e E-mail são obrigatórios.'
            ]);
            exit;
        }
        
        // 1. Increment download count
        $downloadsOffset++;
        file_put_contents($downloadsFile, $downloadsOffset, LOCK_EX);
        
        // 2. Append lead to leads.csv with concurrency lock
        $isNewFile = !file_exists($leadsFile);
        $fp = fopen($leadsFile, 'a');
        if ($fp) {
            if (flock($fp, LOCK_EX)) {
                if ($isNewFile) {
                    fputcsv($fp, ['date', 'name', 'email', 'whatsapp', 'ip']);
                }
                
                $ip = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'];
                $date = date('Y-m-d H:i:s');
                
                fputcsv($fp, [$date, $name, $email, $whatsapp, $ip]);
                flock($fp, LOCK_UN);
            }
            fclose($fp);
        }
        
        echo json_encode([
            'success' => true,
            'downloads' => $baseDownloads + $downloadsOffset,
            'visits' => $baseVisits + $visitsOffset
        ]);
        exit;
    }
}

// Invalid request
http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Ação inválida.']);
exit;
