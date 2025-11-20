/**
 * ROFLFaucet Profile Page JavaScript
 * Integrates with the new simple-profile.php and coins-balance.php APIs
 */

class ProfileManager {
    constructor() {
        this.balanceSystem = null;
        this.levelsSystem = null;
        this.isLoggedIn = false;
        this.profileData = null;
        this.currentTab = 'basic';
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Profile Manager initializing...');
        
        // Simple initialization - no complex waiting
        this.initializeSystems();
        
        // Check login status and load profile
        await this.checkLoginStatus();
        
        // Initialize UI
        this.initializeUI();
        
        console.log('✅ Profile Manager ready');
    }
    
    initializeSystems() {
        // Try to get systems if available, but don't wait
        if (typeof UnifiedBalanceSystem !== 'undefined') {
            this.balanceSystem = new UnifiedBalanceSystem();
        }
        
        if (window.levelsSystem) {
            this.levelsSystem = window.levelsSystem;
        }
    }
    
    async checkLoginStatus() {
        // Use the consistent localStorage authentication system
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('user_id');
        this.isLoggedIn = !!(username && userId);
        
        console.log('🔐 Login status:', this.isLoggedIn ? `Logged In as ${username}` : 'Guest');
        
        if (this.isLoggedIn) {
            await this.loadProfileData();
        }
        
        // Note: UI visibility is handled by site-utils.js using CSS classes
    }
    
    async loadProfileData() {
        try {
            console.log('📊 Loading profile data...');
            
            // Load profile from new simple-profile.php API using combined user_id
            const combinedUserId = localStorage.getItem('combined_user_id');
            const response = await fetch(`api/simple-profile.php?action=profile&user_id=${combinedUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.profileData = data.profile;
                    console.log('✅ Profile data loaded:', this.profileData);
                    this.updateProfileDisplay();
                } else {
                    throw new Error(data.error || 'Failed to load profile');
                }
            } else {
                throw new Error('Profile API request failed');
            }
            
        } catch (error) {
            console.error('❌ Failed to load profile:', error);
            // Fallback to default profile data
            this.profileData = {
                user_id: 'unknown',
                level: 1,
                username: 'Member',
                email: '',
                joined_date: Date.now() / 1000,
                stats: {
                    total_claims: 0,
                    total_games_played: 0,
                    total_won: 0
                },
                settings: {
                    notifications: true,
                    theme: 'default'
                }
            };
        }
    }
    
    
    async updateProfileDisplay() {
        if (!this.profileData) {
            console.warn('🚨 No profile data to display!');
            return;
        }
        
        console.log('👤 Updating profile display with:', this.profileData);
        
        // Update balance directly from API
        await this.updateBalance();
        
        // Update profile info (only if element exists - edit page doesn't have these)
        const profileUsername = document.getElementById('profile-username');
        if (profileUsername) {
            const displayName = this.profileData.display_name || this.profileData.username || 'Member';
            profileUsername.textContent = displayName;
        }
        
        // Update avatar display
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            this.updateAvatarElement(profileAvatar, this.profileData.avatar || '👤');
        }
        
        // Update navigation to show display name
        this.updateNavigationDisplayName();
        
        // Format and display member since date (only if element exists)
        const memberSince = document.getElementById('member-since');
        if (memberSince) {
            const joinedDate = new Date(this.profileData.joined_date * 1000);
            memberSince.textContent = joinedDate.toLocaleDateString();
        }
        
        // Update stats (only if elements exist)
        const totalClaims = document.getElementById('total-claims');
        const totalGames = document.getElementById('total-games');
        const totalWon = document.getElementById('total-won');
        const currentLevel = document.getElementById('current-level');
        
        if (totalClaims) totalClaims.textContent = this.profileData.stats.total_claims || 0;
        if (totalGames) totalGames.textContent = this.profileData.stats.total_games_played || 0;
        if (totalWon) totalWon.textContent = this.profileData.stats.total_won || 0;
        if (currentLevel) currentLevel.textContent = this.profileData.level || 1;
        
        // Update bio section
        const bioSection = document.getElementById('bio-section');
        const profileBio = document.getElementById('profile-bio');
        if (bioSection && profileBio && this.profileData.bio) {
            profileBio.textContent = this.profileData.bio;
            bioSection.style.display = 'block';
        } else if (bioSection) {
            bioSection.style.display = 'none';
        }
        
        // Update location section
        const locationSection = document.getElementById('location-section');
        const profileLocation = document.getElementById('profile-location');
        if (locationSection && profileLocation && this.profileData.location) {
            profileLocation.textContent = this.profileData.location;
            locationSection.style.display = 'block';
        } else if (locationSection) {
            locationSection.style.display = 'none';
        }
        
        // Update website section
        const websiteSection = document.getElementById('website-section');
        const profileWebsite = document.getElementById('profile-website');
        if (websiteSection && profileWebsite && this.profileData.website) {
            profileWebsite.href = this.profileData.website.startsWith('http') ? this.profileData.website : 'https://' + this.profileData.website;
            profileWebsite.textContent = '🌐 Website';
            websiteSection.style.display = 'block';
        } else if (websiteSection) {
            websiteSection.style.display = 'none';
        }
        
        // Update form fields with current data
        this.populateFormFields();
        
        // Load recent activity
        await this.loadRecentActivity();
        
        // Load fundraisers if user has recipient role
        await this.loadUserFundraisers();
        
        // Show/hide role-specific sections based on user roles
        this.updateRoleBasedSections();
    }
    
    async updateBalance() {
        try {
            const combinedUserId = localStorage.getItem('combined_user_id');
            if (!combinedUserId) {
                console.log('No combined user ID available for balance update');
                return;
            }
            
            // Get balance directly from API using combined user_id parameter
            const response = await fetch(`api/coins-balance.php?action=balance&user_id=${combinedUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.balance !== undefined) {
                    const balanceEl = document.getElementById('balance');
                    if (balanceEl) {
                        balanceEl.textContent = data.balance;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    }
    
    async loadRecentActivity() {
        try {
            // Get recent transactions from balance API using combined user_id
            const combinedUserId = localStorage.getItem('combined_user_id');
            const response = await fetch(`api/coins-balance.php?action=balance&user_id=${combinedUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.recent_transactions) {
                    this.displayRecentActivity(data.recent_transactions);
                }
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }
    
    displayRecentActivity(transactions) {
        const container = document.getElementById('recent-transactions');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        const activityHTML = transactions.slice(0, 10).map(tx => {
            const date = new Date(tx.timestamp * 1000).toLocaleString();
            const amountClass = tx.amount >= 0 ? 'positive' : 'negative';
            const amountSign = tx.amount >= 0 ? '+' : '';
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: rgba(255, 255, 255, 0.5); border-radius: 4px; border-left: 4px solid ${tx.amount >= 0 ? '#27ae60' : '#e74c3c'};">
                    <div style="flex: 1;">
                        <strong>${tx.description}</strong><br>
                        <small style="color: #666;">${date}</small>
                    </div>
                    <div style="text-align: right; font-weight: bold; color: ${tx.amount >= 0 ? '#27ae60' : '#e74c3c'};">
                        ${amountSign}${Math.abs(tx.amount)} coins
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = activityHTML;
    }
    
    // Tab functionality
    showTab(tabName, activeButton = null) {
        console.log('🔄 Showing tab:', tabName);
        
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.style.display = 'none');
        
        // Show selected tab
        const targetTab = document.getElementById('tab-' + tabName);
        if (targetTab) {
            targetTab.style.display = 'block';
            this.currentTab = tabName;
        }
        
        // Update button states
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => btn.style.background = '#4A90E2');
        
        // Highlight active button (if provided or find by tab name)
        if (activeButton) {
            activeButton.style.background = '#357abd';
        } else {
            // Find the active button by content
            buttons.forEach(btn => {
                const btnText = btn.textContent.toLowerCase();
                if ((tabName === 'basic' && btnText.includes('basic')) ||
                    (tabName === 'preferences' && btnText.includes('preferences')) ||
                    (tabName === 'activity' && btnText.includes('activity'))) {
                    btn.style.background = '#357abd';
                }
            });
        }
        
        // Load tab-specific content
        if (tabName === 'activity') {
            this.loadRecentActivity();
        }
    }
    
    // Profile update functions
    async updateProfile(updates) {
        if (!this.isLoggedIn) {
            alert('You must be logged in to update your profile');
            return false;
        }
        
        try {
            const combinedUserId = localStorage.getItem('combined_user_id');
            const updateData = {
                user_id: combinedUserId,
                ...updates
            };
            
            const response = await fetch('api/simple-profile.php?action=update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Profile updated successfully');
                    this.profileData = data.profile;
                    this.updateProfileDisplay();
                    return true;
                } else {
                    throw new Error(data.error || 'Update failed');
                }
            } else {
                throw new Error('Profile update request failed');
            }
        } catch (error) {
            console.error('❌ Failed to update profile:', error);
            alert('Failed to update profile: ' + error.message);
            return false;
        }
    }
    
    // Save basic info
    async saveBasicInfo() {
        try {
            const displayName = document.getElementById('display-name')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const bio = document.getElementById('bio')?.value || '';
            const location = document.getElementById('location')?.value || '';
            const website = document.getElementById('website')?.value || '';
            
            console.log('Saving profile data:', { displayName, email, bio, location, website });
            
            const updates = {};
            if (displayName.trim()) updates.display_name = displayName.trim();
            if (email.trim()) updates.email = email.trim();
            if (bio.trim()) updates.bio = bio.trim();
            if (location.trim()) updates.location = location.trim();
            if (website.trim()) updates.website = website.trim();
            
            if (Object.keys(updates).length === 0) {
                alert('No changes to save');
                return;
            }
            
            console.log('Sending updates:', updates);
            const success = await this.updateProfile(updates);
            if (success) {
                alert('Profile updated successfully!');
                // Reload profile data to show updated info
                await this.loadProfileData();
            }
        } catch (error) {
            console.error('Error in saveBasicInfo:', error);
            alert('Error saving profile: ' + error.message);
        }
    }
    
    // Save preferences
    async savePreferences() {
        try {
            const themeSelect = document.querySelector('select');
            // Only get checkboxes in the preferences tab, not mobile menu checkbox
            const checkboxes = document.querySelectorAll('#tab-preferences input[type="checkbox"]');
            
            const theme = themeSelect?.value || 'default';
            const notifications = checkboxes[0]?.checked || false;
            const publicProfile = checkboxes[1]?.checked || false;
            
            console.log('Saving preferences:', { theme, notifications, publicProfile });
            
            const updates = {
                settings: {
                    theme: theme,
                    notifications: notifications,
                    public_profile: publicProfile
                }
            };
            
            console.log('Sending preference updates:', updates);
            const success = await this.updateProfile(updates);
            if (success) {
                alert('Preferences saved successfully!');
                // Reload profile data to show updated settings
                await this.loadProfileData();
            }
        } catch (error) {
            console.error('Error in savePreferences:', error);
            alert('Error saving preferences: ' + error.message);
        }
    }
    
    updateNavigationDisplayName() {
        if (!this.profileData) return;
        
        const displayName = this.profileData.display_name || this.profileData.username || 'User';
        const avatar = this.profileData.avatar || '👤';
        
        // Update the main navigation user menu button
        const userMenuButton = document.getElementById('user-menu-button');
        if (userMenuButton) {
            if (avatar.startsWith('uploaded:')) {
                // For navigation, show emoji fallback since images are too complex
                userMenuButton.textContent = `📷 ${displayName}`;
            } else {
                userMenuButton.textContent = `${avatar} ${displayName}`;
            }
            console.log('🗂 Updated navigation:', userMenuButton.textContent);
        }
    }
    
    // Helper method to update avatar elements (handles both emojis and uploaded images)
    updateAvatarElement(element, avatarValue) {
        if (avatarValue.startsWith('uploaded:')) {
            // Show uploaded image
            const filename = avatarValue.replace('uploaded:', '');
            const imageUrl = `images/avatars/${filename}?v=${Date.now()}`;
            
            // Replace with img element
            element.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.parentNode.innerHTML='👤';">`;
        } else {
            // Show emoji
            element.textContent = avatarValue;
        }
    }
    
    // Force refresh profile data (useful for debugging)
    async forceRefresh() {
        console.log('🔄 Force refreshing profile data...');
        await this.loadProfileData();
    }
    
    populateFormFields() {
        if (!this.profileData) return;
        
        console.log('Populating form fields with:', this.profileData);
        
        // Basic info fields - use proper IDs
        const displayNameInput = document.getElementById('display-name');
        const emailInput = document.getElementById('email');
        const bioInput = document.getElementById('bio');
        const locationInput = document.getElementById('location');
        const websiteInput = document.getElementById('website');
        
        if (displayNameInput) displayNameInput.value = this.profileData.display_name || this.profileData.username || '';
        
        // Update avatar in edit form if present
        const avatarInput = document.getElementById('avatar');
        if (avatarInput) {
            const avatar = this.profileData.avatar || '👤';
            avatarInput.value = avatar;
            console.log('🎨 Updated edit form avatar to:', avatar);
            
            // Use the edit page's updateAvatarDisplay function if available
            if (typeof updateAvatarDisplay === 'function') {
                updateAvatarDisplay(avatar);
            }
        }
        if (emailInput) emailInput.value = this.profileData.email || '';
        if (bioInput) bioInput.value = this.profileData.bio || '';
        if (locationInput) locationInput.value = this.profileData.location || '';
        if (websiteInput) websiteInput.value = this.profileData.website || '';
        
        // Preferences fields - only target checkboxes in the preferences tab
        const themeSelect = document.querySelector('select');
        const checkboxes = document.querySelectorAll('#tab-preferences input[type="checkbox"]');
        
        if (themeSelect && this.profileData.settings) {
            themeSelect.value = this.profileData.settings.theme || 'default';
        }
        if (checkboxes[0] && this.profileData.settings) {
            checkboxes[0].checked = this.profileData.settings.notifications !== false;
        }
        if (checkboxes[1] && this.profileData.settings) {
            checkboxes[1].checked = this.profileData.settings.public_profile === true;
        }
    }
    
    updateRoleBasedSections() {
        const userRoles = this.profileData?.roles || ['member'];
        console.log('🎨 Updating role-based sections for roles:', userRoles);
        
        // Show admin panel only if user has admin role
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            if (userRoles.includes('admin')) {
                console.log('✅ Showing admin panel');
                adminPanel.style.display = 'block';
            } else {
                console.log('❌ Hiding admin panel (not admin)');
                adminPanel.style.display = 'none';
            }
        }
        
        // Fundraiser section visibility is handled by loadUserFundraisers()
    }
    
    async loadUserFundraisers() {
        try {
            console.log('💝 Loading user fundraisers...');
            
            // Check if user has recipient capability (recipient or admin)
            const userRoles = this.profileData?.roles || ['member'];
            const canCreateFundraisers = userRoles.includes('recipient') || userRoles.includes('admin');
            
            if (!canCreateFundraisers) {
                console.log('User does not have recipient role, hiding projects section');
                const fundraisersSection = document.getElementById('fundraisers-section');
                if (fundraisersSection) {
                    fundraisersSection.style.display = 'none';
                }
                return;
            }
            
            // Show fundraisers section
            const fundraisersSection = document.getElementById('fundraisers-section');
            if (fundraisersSection) {
                fundraisersSection.style.display = 'block';
            }
            
            // Load user's projects from new API
            const currentUserId = localStorage.getItem('combined_user_id');
            const currentUsername = currentUserId ? (currentUserId.includes('-') ? currentUserId.split('-')[1] : currentUserId) : null;
            console.log('🔍 Current username:', currentUsername);
            
            const response = await fetch('api/project-management-api-v2.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'list_user_projects',
                    username: currentUsername
                })
            });
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ User projects loaded:', data.projects);
                this.displayUserFundraisers(data.projects || []);
            } else {
                throw new Error(data.error || 'Failed to load projects');
            }
            
        } catch (error) {
            console.error('❌ Failed to load user fundraisers:', error);
            const fundraisersContainer = document.getElementById('user-projects');
            if (fundraisersContainer) {
                fundraisersContainer.innerHTML = '<p style="color: #e74c3c;">Failed to load fundraisers</p>';
            }
        }
    }
    
    displayUserFundraisers(fundraisers) {
        const container = document.getElementById('user-projects');
        if (!container) return;
        
        if (fundraisers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>📝 No fundraisers yet</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">Create your first fundraiser to start raising funds for your project!</p>
                </div>
            `;
            return;
        }
        
        const fundraisersHTML = fundraisers.map(fundraiser => {
            const progressPercentage = fundraiser.goal_amount > 0 ? 
                (fundraiser.current_amount / fundraiser.goal_amount) * 100 : 0;
            const isVerified = fundraiser.verification && fundraiser.verification.verified;
            
                            const isCompleted = fundraiser.status === 'completed' || 
                                (fundraiser.completion_info && fundraiser.completion_info.completed);
                            const statusColor = isCompleted ? '#28a745' : '#4caf50';
                            
                            return `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 5px 0; color: #333;">
                                ${fundraiser.is_pending ? 
                                    `<span style="color: #333;">${fundraiser.title}</span>` :
                                    `<a href="fundraiser.html?id=${fundraiser.id}" style="text-decoration: none; color: #333;">${fundraiser.title} ${isCompleted ? '🎉' : ''}</a>`
                                }
                            </h4>
                            <p style="color: #666; margin: 0 0 10px 0; font-size: 0.9rem;">${fundraiser.tagline}</p>
                            <div style="margin-top: 8px;">
                                ${fundraiser.is_pending ? 
                                    `<button onclick="previewProject('${fundraiser.id}', '${fundraiser.filename}')" style="background: #4A90E2; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px; cursor: pointer;">👁️ Preview</button>` : ''
                                }
                                <button onclick="editProject('${fundraiser.id}')" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">✏️ Edit</button>
                            </div>
                        </div>
                        <div style="margin-left: 15px;">
                            ${isCompleted ?
                                '<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">🎉 Completed</span>' :
                                isVerified ? 
                                    '<span style="background: #4caf50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">✅ Active</span>' :
                                    '<span style="background: #ff9800; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">⏳ Pending</span>'
                            }
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #4caf50; height: 100%; width: ${Math.min(progressPercentage, 100)}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-top: 5px;">
                            <span style="color: #4caf50; font-weight: bold;">
                                ${fundraiser.currency === 'USD' ? '$' : ''}${fundraiser.current_amount.toLocaleString()} raised
                            </span>
                            <span style="color: #666;">
                                of ${fundraiser.currency === 'USD' ? '$' : ''}${fundraiser.goal_amount.toLocaleString()} ${fundraiser.type === 'recurring' ? '/month' : 'goal'}
                            </span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; font-size: 0.9rem;">
                        <span style="background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 12px;">
                            ${fundraiser.type === 'one-time' ? '🎯 One-time' : '🔄 Monthly'}
                        </span>
                        <span style="background: #f3e5f5; color: #7b1fa2; padding: 3px 8px; border-radius: 12px;">
                            ${fundraiser.category}
                        </span>
                        <span style="color: #666;">
                            Created: ${new Date(fundraiser.created_date * 1000).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = fundraisersHTML;
    }
    
    initializeUI() {
        // Temporarily removed to test mobile menu issue
        console.log('UI initialized - no tab switching');
    }
}

// Global functions for HTML onclick handlers
function showTab(tabName) {
    if (window.profileManager) {
        window.profileManager.showTab(tabName);
    }
}

function saveBasicInfo() {
    if (window.profileManager) {
        window.profileManager.saveBasicInfo();
    }
}

function savePreferences() {
    if (window.profileManager) {
        window.profileManager.savePreferences();
    }
}

function createNewFundraiser() {
    // Redirect to the project creation page
    window.location.href = 'create-project.html';
}

function createNewProject() {
    // Unified workflow: Create draft project immediately and redirect to edit page
    createDraftProjectAndRedirect();
}

async function createDraftProjectAndRedirect() {
    // Use the proper authentication system from site-utils.js
    const username = getValidUsername();
    
    console.log('DEBUG: Create project called');
    console.log('DEBUG: username from getValidUsername() =', username);
    console.log('DEBUG: localStorage username =', localStorage.getItem('username'));
    console.log('DEBUG: localStorage keys =', Object.keys(localStorage));
    
    if (!username) {
        alert('You must be logged in to create a project. Please log in and try again.');
        return;
    }
    
    try {
        // Show loading state - find the button
        const button = document.querySelector('.project-creation-tools button');
        let originalText = '+ New Project';
        if (button) {
            originalText = button.textContent;
            button.textContent = 'Creating...';
            button.disabled = true;
        }
        
        // Call API to create draft project
        console.log('DEBUG: About to call API with username:', username);
        const apiData = {
            action: 'create_draft_project',
            username: username
        };
        console.log('DEBUG: API payload:', JSON.stringify(apiData));
        
        const response = await fetch('/api/project-management-api-v2.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiData)
        });
        
        console.log('DEBUG: API response status:', response.status);
        const result = await response.json();
        console.log('DEBUG: API result:', result);
        
        if (result.success) {
            // Redirect to edit page with the new project ID
            window.location.href = `edit-project-v2.html?project=${result.project_id}`;
        } else {
            alert('Failed to create project: ' + (result.error || 'Unknown error'));
            if (button) {
                button.textContent = originalText;
                button.disabled = false;
            }
        }
    } catch (error) {
        console.error('Failed to create draft project:', error);
        alert('Failed to create project. Please try again.');
        if (button) {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
}

function previewProject(projectId, filename) {
    // Create preview URL for pending projects
    // For now, redirect to a pending project preview page
    window.open(`pending-preview.html?id=${projectId}&file=${filename}`, '_blank');
}

function editProject(projectId) {
    // Redirect to project edit page
    window.location.href = `edit-project-v2.html?project=${projectId}`;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});

console.log('📄 Profile.js loaded');
// Test sync: Second test - only this file should be transferred
