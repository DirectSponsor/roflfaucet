# ROFLFaucet Chat System - Complete Documentation

## Project Overview
**Location**: `/home/andy/warp/projects/roflfaucet`  
**Live Site**: https://roflfaucet.com/chat.html  
**Deployment**: Uses `./deploy-roflfaucet.sh` script for automated deployment  

## Chat System Implementation

### Core Files
- **`chat.html`** - Main chat page with embedded CSS and structure
- **`chat-php-widget.js`** - JavaScript chat client with polling system
- **`chat-api.php`** - Backend PHP API for message handling (backend file)

### Key Features Implemented

#### 1. **Compact Single-Line Message Format**
- Messages display as: `**username:** message text          timestamp`
- Space-efficient design perfect for sidebars/popups
- Reduced vertical spacing (8px between messages, 6px padding)

#### 2. **Light Theme Integration**
- Uses site's CSS variables (`--bg-primary`, `--text-primary`, `--primary-color`, etc.)
- Consistent styling with main ROFLFaucet site
- White/light backgrounds, blue headers, proper contrast

#### 3. **User Mention Highlighting** (Client-Side Only)
- **Background highlighting**: Light blue background (`rgba(74, 144, 226, 0.05)`) with blue left border
- **Username highlighting**: Blue background with white text for mentioned usernames
- **Smart detection**: Case-insensitive, word boundaries, excludes own messages
- **Accessibility-optimized**: Light colors for excellent text contrast
- **Animation**: Subtle pulse effect when mentions appear

#### 4. **Guest Access Mode**
- Guests can view chat in read-only mode
- Input disabled with "Sign in to chat..." placeholder
- Separate polling system (`pollGuestMessages()`) without auth
- Shows "Sign in to chat" status message

#### 5. **Character Encoding Fixed**
- **`decodeHtmlEntities()`** function properly decodes HTML entities
- Apostrophes (`'`), ampersands (`&`), emojis, and special characters display correctly
- Security maintained against HTML injection
- Uses `textContent` for regular messages, `innerHTML` only for controlled mention highlighting

#### 6. **Polling-Based Real-Time Updates**
- 3-second polling interval for new messages
- Staggered message display (200ms between messages)
- Proper username display (fixed previous mismatch bug)
- Online user count updates
- Connection status monitoring

### Technical Architecture

#### Frontend (`chat-php-widget.js`)
```javascript
class ChatWidget {
    // Key Methods:
    - init() // Initializes based on auth status
    - initializeGuestUI() // Guest read-only mode
    - displayMessage() // Handles message rendering with mention detection
    - highlightMentions() // Username highlighting in messages
    - decodeHtmlEntities() // Fixes character encoding
    - pollMessages() // Authenticated user polling
    - pollGuestMessages() // Guest polling without auth
}
```

#### Authentication Integration
- Integrates with existing `unifiedBalance` system
- Checks `window.simpleFaucet.userProfile` for username
- Falls back to JWT token decoding
- Guest users get read-only access

#### Message Display Logic
1. **Structure Creation**: HTML structure created with `innerHTML`
2. **Content Population**: Message content added with `textContent` (safe)
3. **Mention Detection**: Checks if current user's username is mentioned
4. **Highlighting**: Uses `innerHTML` only for mention highlighting (controlled)
5. **Character Decoding**: All messages processed through `decodeHtmlEntities()`

### CSS Classes & Styling

#### Core Chat Structure
```css
.chat-widget              // Main container with site colors
.chat-header              // Blue header with white text
.chat-tabs                // Tab navigation
.chat-messages            // Scrollable message area
.chat-footer              // Input area
```

#### Message Display
```css
.chat-message             // Individual message container (8px bottom margin)
.message-text             // Message bubble (6px padding, light background)
.message-username         // Bold, colored username
.message-content-text     // Message content
.message-time-inline      // Small timestamp (floated right)
```

#### Mention Highlighting
```css
.mentions-me              // Light blue background + left border + animation
.username-mention         // Blue background + white text for usernames
@keyframes mentionPulse   // Subtle entrance animation
```

### Backend Integration Notes
- **Fixed Issue**: Removed hardcoded fallback `userId='2'` and `username='andytest1'` from `chat-api.php`
- **Polling Endpoints**: Separate guest and authenticated polling
- **Message Storage**: Handles HTML entity encoding properly
- **Online Count**: Tracks and returns active user count

### Deployment & Status
- **Current State**: Production-ready and deployed
- **Last Deploy**: `Auto-deploy: 2025-08-03 23:49` (commit: `ac0925b`)
- **Testing Status**: All features tested and working
- **Character Display**: ✅ Apostrophes, ampersands, emojis all working
- **Mention System**: ✅ Client-side highlighting working perfectly
- **Guest Access**: ✅ Read-only mode functioning
- **Light Theme**: ✅ Consistent with site design

### Usage Scenarios
1. **Full-Page Chat**: Current implementation at `/chat.html`
2. **Sidebar Widget**: Compact format ready for integration
3. **Popup Chat**: Minimal space requirements met
4. **Mobile-Friendly**: Responsive design with site integration

### Security Features
- HTML injection protection via `textContent` for user content
- Controlled `innerHTML` usage only for trusted mention highlighting
- Guest access limitations (read-only)
- Proper character encoding/decoding without security risks

### Performance Optimizations
- 3-second polling (balances real-time feel with server load)
- Message history limited to 100 messages
- Staggered message display for better UX
- Efficient DOM manipulation

## Next Steps Considerations
- Chat system is complete and production-ready
- Can be integrated into sidebars, popups, or other page layouts
- All character encoding, accessibility, and UX issues resolved
- Backend username mismatch bug fixed
- Ready for any additional feature requests or integrations

**Status**: ✅ **COMPLETE AND DEPLOYED** - Fully functional chat system with all requested features implemented and tested.

