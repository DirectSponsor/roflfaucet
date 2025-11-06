<?php
/**
 * Ultra-Efficient Analytics System
 * Follows project design principles: minimal resources, filesystem-based, no database
 * Target: <1ms per game log, <50ms dashboard load
 */

class SimpleGameAnalytics {
    private static $statsDir = 'userdata/stats/';
    
    /**
     * Log game result - FAST, direct file append
     * Called after every game (high frequency)
     * Target: <1ms execution time
     */
    public static function logGame($userId, $gameData) {
        $today = date('Y-m-d');
        
        // Ensure stats directory exists
        if (!is_dir(self::$statsDir)) {
            mkdir(self::$statsDir, 0755, true);
        }
        
        // Prepare log entry
        $logEntry = [
            'timestamp' => time(),
            'user_id' => $userId,
            'game' => $gameData['game'],
            'bet' => $gameData['bet_amount'],
            'payout' => $gameData['payout'],
            'net' => $gameData['payout'] - $gameData['bet_amount']
        ];
        
        // HYBRID LOGGING: Write to both files simultaneously
        
        // 1. Aggregate stats (for fast dashboard)
        $aggregateFile = self::$statsDir . "aggregate_$today.log";
        file_put_contents($aggregateFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
        
        // 2. Individual user stats (for leaderboards) - only if not aggregate
        if ($userId !== 'aggregate' && $userId !== 'guest') {
            $userFile = self::$statsDir . "user_{$userId}_$today.log";  
            file_put_contents($userFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
        }
        
        // 3. Update daily summary (atomic operation)
        self::updateDailySummary($today, $logEntry);
    }
    
    /**
     * Update daily summary - atomic counters
     * Keeps running totals in single file for instant dashboard
     */
    private static function updateDailySummary($date, $logEntry) {
        $summaryFile = self::$statsDir . "daily_summary_$date.json";
        
        // Load existing summary
        $summary = [];
        if (file_exists($summaryFile)) {
            $summary = json_decode(file_get_contents($summaryFile), true) ?: [];
        }
        
        // Initialize if needed
        if (!isset($summary['games'])) {
            $summary = [
                'date' => $date,
                'games' => 0,
                'total_bet' => 0,
                'total_won' => 0,
                'net_result' => 0,
                'biggest_win' => 0,
                'game_breakdown' => []
            ];
        }
        
        // Update counters
        $summary['games']++;
        $summary['total_bet'] += $logEntry['bet'];
        $summary['total_won'] += $logEntry['payout'];
        $summary['net_result'] += $logEntry['net'];
        $summary['biggest_win'] = max($summary['biggest_win'], $logEntry['payout']);
        
        // Update game-specific counters
        $game = $logEntry['game'];
        if (!isset($summary['game_breakdown'][$game])) {
            $summary['game_breakdown'][$game] = [
                'games' => 0, 'total_bet' => 0, 'total_won' => 0, 'net' => 0
            ];
        }
        $summary['game_breakdown'][$game]['games']++;
        $summary['game_breakdown'][$game]['total_bet'] += $logEntry['bet'];
        $summary['game_breakdown'][$game]['total_won'] += $logEntry['payout'];
        $summary['game_breakdown'][$game]['net'] += $logEntry['net'];
        
        // Atomic write
        file_put_contents($summaryFile, json_encode($summary, JSON_PRETTY_PRINT), LOCK_EX);
    }
    
    /**
     * Get dashboard stats - ULTRA FAST
     * Target: <50ms for multi-day summary
     * Just reads pre-computed daily summaries
     */
    public static function getDashboardStats($days = 7) {
        $totalStats = [
            'total_games' => 0,
            'total_bet' => 0,
            'total_won' => 0,
            'net_result' => 0,
            'biggest_win' => 0,
            'game_breakdown' => [],
            'daily_breakdown' => []
        ];
        
        // Read last N days of pre-computed summaries
        for ($i = 0; $i < $days; $i++) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $summaryFile = self::$statsDir . "daily_summary_$date.json";
            
            if (file_exists($summaryFile)) {
                $daySummary = json_decode(file_get_contents($summaryFile), true);
                
                // Aggregate totals
                $totalStats['total_games'] += $daySummary['games'] ?? 0;
                $totalStats['total_bet'] += $daySummary['total_bet'] ?? 0;
                $totalStats['total_won'] += $daySummary['total_won'] ?? 0;
                $totalStats['net_result'] += $daySummary['net_result'] ?? 0;
                $totalStats['biggest_win'] = max($totalStats['biggest_win'], $daySummary['biggest_win'] ?? 0);
                
                // Aggregate game breakdown
                foreach ($daySummary['game_breakdown'] ?? [] as $game => $stats) {
                    if (!isset($totalStats['game_breakdown'][$game])) {
                        $totalStats['game_breakdown'][$game] = [
                            'games' => 0, 'total_bet' => 0, 'total_won' => 0, 'net' => 0
                        ];
                    }
                    $totalStats['game_breakdown'][$game]['games'] += $stats['games'];
                    $totalStats['game_breakdown'][$game]['total_bet'] += $stats['total_bet'];
                    $totalStats['game_breakdown'][$game]['total_won'] += $stats['total_won'];
                    $totalStats['game_breakdown'][$game]['net'] += $stats['net'];
                }
                
                // Add daily data
                $totalStats['daily_breakdown'][] = $daySummary;
            }
        }
        
        return $totalStats;
    }
    
    /**
     * Get user leaderboard - reads individual user files
     * Called less frequently, can be slightly slower
     */
    public static function getUserLeaderboard($game = null, $days = 7) {
        $users = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $userFiles = glob(self::$statsDir . "user_*_$date.log");
            
            foreach ($userFiles as $userFile) {
                // Extract user ID from filename
                if (preg_match('/user_([^_]+)_/', $userFile, $matches)) {
                    $userId = $matches[1];
                    
                    if (!isset($users[$userId])) {
                        $users[$userId] = [
                            'user_id' => $userId,
                            'games' => 0,
                            'total_bet' => 0,
                            'total_won' => 0,
                            'net_result' => 0,
                            'biggest_win' => 0
                        ];
                    }
                    
                    // Read user's games for this day
                    $lines = file($userFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                    foreach ($lines as $line) {
                        $gameData = json_decode($line, true);
                        if ($gameData && (!$game || $gameData['game'] === $game)) {
                            $users[$userId]['games']++;
                            $users[$userId]['total_bet'] += $gameData['bet'];
                            $users[$userId]['total_won'] += $gameData['payout'];
                            $users[$userId]['net_result'] += $gameData['net'];
                            $users[$userId]['biggest_win'] = max($users[$userId]['biggest_win'], $gameData['payout']);
                        }
                    }
                }
            }
        }
        
        // Sort by net result (biggest winners first)
        uasort($users, function($a, $b) {
            return $b['net_result'] <=> $a['net_result'];
        });
        
        return array_values($users);
    }
}

/**
 * Game Integration Helper
 * Single function call from games - ultra simple
 */
function logGameResult($userId, $gameType, $betAmount, $payout) {
    SimpleGameAnalytics::logGame($userId, [
        'game' => $gameType,
        'bet_amount' => $betAmount,
        'payout' => $payout
    ]);
    
    // Also log to aggregate for site-wide stats
    if ($userId !== 'aggregate') {
        SimpleGameAnalytics::logGame('aggregate', [
            'game' => $gameType,
            'bet_amount' => $betAmount,
            'payout' => $payout
        ]);
    }
}

// Web Interface - Handle HTTP requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Debug logging - write to a simple log file
    $debugLog = "DEBUG: POST request received at " . date('Y-m-d H:i:s') . " with data: " . json_encode($_POST) . " from " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";
    $result = file_put_contents('userdata/stats/debug.log', $debugLog, FILE_APPEND | LOCK_EX);
    if ($result === false) {
        error_log("Failed to write debug log to userdata/stats/debug.log");
        // Try writing to a different location for debugging
        file_put_contents('/tmp/analytics_debug.log', "FAILED: Could not write to userdata/stats/debug.log at " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
    } else {
        // Test if we can create any file at all
        file_put_contents('userdata/stats/test_web.txt', 'Web server can write: ' . date('Y-m-d H:i:s'), LOCK_EX);
    }
    
    header('Content-Type: application/json');
    
    $action = $_POST['action'] ?? '';
    
    if ($action === 'log_game') {
        $userId = $_POST['user_id'] ?? 'guest';
        $gameType = $_POST['game_type'] ?? '';
        $betAmount = (float)($_POST['bet_amount'] ?? 0);
        $payout = (float)($_POST['payout'] ?? 0);
        
        if ($gameType && $betAmount >= 0 && $payout >= 0) {
            logGameResult($userId, $gameType, $betAmount, $payout);
            echo json_encode(['success' => true, 'message' => 'Game logged', 'server_time' => date('Y-m-d H:i:s'), 'file_version' => '2.0']);
        } else {
            echo json_encode(['error' => 'Invalid game data']);
        }
    } else {
        echo json_encode(['error' => 'Unknown action']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    
    $action = $_GET['action'] ?? '';
    
    if ($action === 'dashboard') {
        $days = (int)($_GET['days'] ?? 7);
        $stats = SimpleGameAnalytics::getDashboardStats($days);
        echo json_encode(['success' => true, 'data' => $stats]);
    } elseif ($action === 'leaderboard') {
        $game = $_GET['game'] ?? null;
        $days = (int)($_GET['days'] ?? 7);
        $leaderboard = SimpleGameAnalytics::getUserLeaderboard($game, $days);
        echo json_encode(['success' => true, 'data' => $leaderboard]);
    } else {
        echo json_encode(['error' => 'Unknown action']);
    }
}
?>
