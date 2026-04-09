<?php
// Allow this page to be embedded in iframes from any origin
header('X-Frame-Options: ALLOWALL');
header('Content-Security-Policy: frame-ancestors *');

// Read JWT from URL param (passed by embedding site)
$jwt = $_GET['jwt'] ?? '';
$jwtJson = json_encode($jwt); // safely escape for JS
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ROFLFaucet Chat</title>
    <link rel="stylesheet" href="chat/chat-widget.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; background: #fff; }
        #sidebar-chat-widget-container { width: 100%; height: 100%; }
        /* Hide the Pool/Online/status bar row — not useful in sidebar embed */
        .chat-bottom-status { display: none !important; }
        /* Height set by JS below after render */
        .chat-messages { overflow-y: auto; }
    </style>
</head>
<body>
    <div id="sidebar-chat-widget-container"></div>

    <script>
    (function() {
        var jwt = <?php echo $jwtJson; ?>;
        if (jwt) {
            try {
                var parts = jwt.split('.');
                var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                var username = payload.username || null;
                var userId   = payload.user_id || payload.sub || null;
                if (username && userId) {
                    var combinedId = userId + '-' + username;
                    window.unifiedBalance = {
                        isLoggedIn: true,
                        userId: combinedId,
                        getCombinedUserIdFromToken: function() { return combinedId; },
                        getValidUsername: function() { return username; }
                    };
                }
            } catch (e) {
                console.warn('Chat frame: could not decode JWT', e);
            }
        }
    })();
    </script>

    <script defer src="chat/chat.js?v=3.1-polling-only-messages"></script>
    <script>
    function fitChatMessages() {
        var container = document.getElementById('sidebar-chat-widget-container');
        var tabs      = document.querySelector('.chat-tabs');
        var footer    = document.querySelector('.chat-footer');
        var messages  = document.getElementById('messages-general');
        if (!container || !tabs || !footer || !messages) return;
        var available = container.offsetHeight - tabs.offsetHeight - footer.offsetHeight - 4;
        if (available > 50) messages.style.height = available + 'px';
    }
    // Run after chat.js has had time to render the widget
    setTimeout(fitChatMessages, 1200);
    window.addEventListener('resize', fitChatMessages);
    </script>
</body>
</html>
