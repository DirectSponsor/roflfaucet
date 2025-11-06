# 🚨 IMPORTANT: Server Include Files

## When You Update Include Files Locally:

### **These files have copies on the server that need manual updates:**
- `nav.html` → Server copy used by project HTML files
- `footer.html` → Server copy used by project HTML files
- `chat-sidebar.html` → Server copy used by project HTML files

### **Why Manual Sync is Needed:**
- Project HTML files are in `/var/roflfaucet-data/projects/` (contains user data)
- Deploy script doesn't touch this folder to protect user data
- Server has `build.sh` that processes includes for server-generated files
- Local changes to includes won't affect project pages until server copies are updated

### **When to Update Server Includes:**
- ✅ After changing navigation links
- ✅ After updating footer content  
- ✅ After modifying chat sidebar
- ✅ After any include file changes

### **How to Update:**
1. Deploy local changes normally with `./deploy.sh`
2. SSH to server and run `build.sh` to process server includes
3. OR manually copy include changes to server include files

**Remember: Project fundraiser pages won't show navigation/footer changes until server includes are updated!**