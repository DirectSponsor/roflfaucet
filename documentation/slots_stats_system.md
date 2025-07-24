# Slots Statistics System Documentation

## Overview

The Slots Statistics System is designed to track and analyze player's gameplay statistics within the **RoflFaucet** application. This document outlines both the current state of the system and future implementation proposals to be considered for deployment.

## Current Implementation

### Local Gameplay Statistics

- **Data Storage**: The current implementation uses `localStorage` in the browser to store gameplay statistics. This approach confines the data to the user's browser session and does not allow for cross-user analysis.
  
- **Risk Analysis UI**: The Slots Statistics page includes a "New User Risk Analysis" section that contains:
  - Probability of losing 10+ credits in a row (a "wipeout")
  - Longest loss streak
  - Average loss streak
  - Loss streak distribution chart

- **CSS Styling**: The UI elements are styled for highlighting and responsiveness, making them adaptable to different device sizes and resolutions.

### Script Functionality

- **Data Analysis**: The script `slots-stats.js` is responsible for analyzing the gameplay data to calculate loss streaks and update the risk analysis UI elements.
- The analysis is limited to a single user's gameplay data due to the use of localStorage.

## Future Proposals for Deployment

To scale the risk analysis and statistical tracking to accommodate all users collectively, server-side data collection and processing must be implemented. Here are some proposed methods:

### Server-Side Data Collection

1. **API Integration**: Implement API calls to a backend server after each spin or transaction to log results.
2. **Batch Uploads**: Periodically upload summarized statistics from clients to the central server for processing.
3. **Unified Transaction System**: Utilize an existing unified balance transaction system on the server to automatically log and analyze loss streak data across all users.

### Data Processing and Analysis

- **Aggregation**: Aggregate the collected data on the server for real-time and historical statistical analysis.
- **Global Metrics**: Produce collective metrics such as loss streak probabilities, average streaks, and more, based on aggregated data.

### Benefits of Server-Side Implementation

- **Cross-User Insights**: Gain insights into global risk conditions and user behavior, aiding more comprehensive game balancing.
- **Security and Reliability**: Enhance data security by handling sensitive data on the server, away from user browsers.

## Conclusion

The current implementation serves as a useful tool for individual gameplay analysis. However, transitioning to a server-side system will enable comprehensive data analysis, enhance the user experience, and provide valuable insights for further development and balancing.
