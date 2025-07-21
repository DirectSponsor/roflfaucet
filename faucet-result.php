<?php
/**
 * 🚰 ROFLFaucet Result Page (Step 3) - PHP Version
 * Dynamic gallery image rotation
 */
require_once 'includes/gallery-system.php';
?>
<!-- TITLE=_ROFLFaucet - Claim Success_ -->
<!-- DESC=_Congratulations! You claimed UselessCoins successfully._ -->
<!-- KEYWORDS=_crypto faucet, claim successful, cryptocurrency, uselesscoins, reward_ -->
<!-- STYLES=_guest-base.css, member-base.css_ -->
<!-- SCRIPTS=_scripts/core/faucet-bridge.js_ -->

<!-- include start header.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ROFLFaucet - Claim Success</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤣</text></svg>">
    <meta name="description" content="Congratulations! You claimed UselessCoins successfully.">
    
    <!-- Base Layout CSS -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- Additional page-specific styles -->
        <link rel="stylesheet" href="guest-base.css">
    <link rel="stylesheet" href="member-base.css">

    
    <!-- Site-wide scripts -->
    <script src="scripts/core/unified-balance.js"></script>
    <script src="scripts/core/site-utils.js"></script>
</head>
<body>
    <!-- Header Navigation -->
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <h1>🤣 ROFLFaucet</h1>
            </div>
            
            <nav class="nav">
                <a href="index.html" class="nav-link">Faucet</a>
                <a href="slots.html" class="nav-link">Slots</a>
                <a href="about.html" class="nav-link">About</a>
            </nav>
            
            <div class="header-auth">
                <button id="oauth-login-btn" class="header-auth-btn">Login</button>
            </div>
        </div>
    </header>
    
    <div class="container">
<!-- include end header.html -->

<!-- include start left-sidebar.html -->
        <aside class="left-sidebar">
            <h3>Left Sidebar</h3>
            <p>Navigation items here</p>
            
            <!-- A-Ads placeholder - no min-width constraint for testing -->
            <div style="height: 250px; background: #e0e0e0; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; text-align: center; max-width: 100%; box-sizing: border-box;">
                <div>
                    A-Ads Placeholder<br>
                    300x250px<br>
                    (scales to fit)
                </div>
            </div>
        </aside>
<!-- include end left-sidebar.html -->

        <main class="main-content">
<!-- Unique content for Step 3: Claim Success -->
            <div class="content-container">
                <div id="result-step" class="faucet-step">
                    <div class="content-header">
                        <h1>🎉 Congratulations!</h1>
                        <p>You successfully claimed your reward!</p>
                    </div>
                    
                    <!-- Result Display -->
                    <div class="result-display" style="text-align: center; margin: 30px 0;">
                        <div class="result-amount">
                            <span class="result-number" id="won-amount">10</span>
                            <span class="result-label currency"></span>
                        </div>
                        <p id="result-message">added to your balance!</p>
                    </div>
                    
                    <!-- Gallery Image Display -->
                    <div class="gallery-display" style="text-align: center; margin: 20px 0;">
                        <img src="<?php echo getRandomGalleryImage(); ?>" id="gallery-image" style="max-width: 100%; max-height: 400px; display: block; margin: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <p style="margin-top: 10px; color: #666; font-size: 0.9em;">🎨 Random Portrait Gallery</p>
                    </div>

                    <!-- Action Buttons -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="index.html" class="nav-button">← Try Again</a>
                        <a href="slots.html" class="nav-button">🎰 Try Slots</a>
                        <a href="illusions.html" class="nav-button">🌀 View Illusions</a>
                    </div>
                </div>
            </div>
            <!-- End unique content for Step 3 -->
        </main>

<!-- include start right-sidebar.html -->
        <aside class="right-sidebar">
            <h3 class="padded">Right Sidebar</h3>
            <p class="padded">Additional info here</p>
            <!-- Image goes edge to edge (no padding) -->
            <img src="/home/andy/Documents/websites/- archived_sites/directsponsor/directsponsor.net/bloukrans.directsponsor.net/static/wp-content/uploads/2016/04/IMG_1293-300x224.jpg" alt="Test image 300px wide" class="full-width">
        </aside>
<!-- include end right-sidebar.html -->

<!-- include start footer.html -->
    </div>
    
    <!-- Additional page-specific scripts -->
        <script src="scripts/core/faucet-bridge.js"></script>
    <!-- Gallery now server-side rendered - no JS needed! -->

</body>
</html>
<!-- include end footer.html -->
