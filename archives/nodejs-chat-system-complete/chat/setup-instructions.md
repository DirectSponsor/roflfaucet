# ROFLFaucet Chat Setup

## Overview
This document outlines the setup and deployment process for the ROFLFaucet Chat system, including local testing and production deployment instructions.

## Local Development
1. **Run WebSocket Server Locally**:
   - Use `npm install ws` to install the WebSocket library.
   - Start the WebSocket server: `node websocket-server.js`
   - Test locally by running multiple browsers connecting to `ws://localhost:8081/chat`.

2. **Testing Mode**:
   - Automatically creates random test users without needing authentication.
   - Mock users are used for chat interaction in a development environment.

## Production Deployment
1. **Server Requirements**:
   - Ensure Node.js is installed on the server: `apt-get install nodejs`
   - Install WebSocket library: `npm install ws`

2. **WebSocket Server on Production**:
   - Run the WebSocket server in the background using:
     - `nohup node websocket-server.js > websocket.log 2>&1 &`

3. **Configuration**:
   - WebSocket server listens on `wss://roflfaucet.com:8081/chat`.
   - Ensure the port 8081 is open and secure.

## Connection Details
- **WebSocket Path**: `/chat`
- **Change Log**: Adjusted WebSocket URL to point to production server.

## Commit Changes
1. **Commit the Documentation**:
   - Make sure all changes are committed to the version control system.
   - Use appropriate commit messages to document updates.

---
*Document created on 2025-08-02*
