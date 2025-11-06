        class PendingPreview {
            constructor() {
                this.projectId = null;
                this.filename = null;
                this.currentUser = null;
                this.init();
            }
            
            async init() {
                // Get URL parameters
                const params = new URLSearchParams(window.location.search);
                this.projectId = params.get('id');
                this.filename = params.get('file');
                
                if (!this.projectId || !this.filename) {
                    this.showError('Invalid preview URL');
                    return;
                }
                
                // Check authentication
                this.currentUser = getValidUsername();
                if (!this.currentUser) {
                    window.location.href = 'profile.html';
                    return;
                }
                
                // Load and verify project
                await this.loadProject();
            }
            
            async loadProject() {
                try {
                    // Fetch the pending project file via API
                    const response = await fetch(`/api/pending-project-viewer.php?id=${this.projectId}&file=${this.filename}&user=${this.currentUser}`);
                    const data = await response.json();
                    
                    if (!data.success) {
                        if (data.error === 'Access denied') {
                            this.showAccessDenied();
                        } else {
                            this.showError(data.error || 'Failed to load project');
                        }
                        return;
                    }
                    
                    // Show preview content
                    this.showPreview(data.content);
                    
                } catch (error) {
                    console.error('Failed to load project:', error);
                    this.showError('Failed to load project preview');
                }
            }
            
            showPreview(content) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('preview-banner').style.display = 'block';
                document.getElementById('preview-controls').style.display = 'block';
                document.getElementById('project-content').innerHTML = content;
                
                // Set edit link
                document.getElementById('edit-link').href = `edit-project-v2.html?id=${this.projectId}`;
            }
            
            showAccessDenied() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('access-denied').style.display = 'block';
            }
            
            showError(message) {
                document.getElementById('loading').innerHTML = `<p style="color: #e74c3c;">❌ ${message}</p>`;
            }
        }
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            new PendingPreview();
        });
