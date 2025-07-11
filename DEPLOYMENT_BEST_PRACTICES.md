# Cross-Server Deployment Best Practices & Policy

## 🎯 **Architecture Overview**

Our ecosystem uses a **distributed server architecture** to prevent conflicts and ensure scalability:

### **Server Responsibilities:**
- **ROFLFaucet Server** (89.116.44.206) → ROFLFaucet site files only
- **UselessCoin Server** (89.116.106.121) → Widget scripts + API + Core functionality  
- **DirectSponsor Server** (TBD) → OAuth authentication + User management
- **ClickForCharity Server** (TBD) → Charity platform integration

---

## 📋 **MANDATORY DEPLOYMENT RULES**

### **❌ NEVER DO:**
1. **❌ Manual file copying** without deploy scripts
2. **❌ Cross-server file mixing** (putting ROFLFaucet files on UselessCoin server)
3. **❌ Local widget dependencies** (embedding widget files locally)
4. **❌ Direct production edits** without git commits
5. **❌ Skipping backups** before deployment
6. **❌ Installing PHP/complex server dependencies** when external APIs exist
7. **❌ Creating local API endpoints** when external solutions work

### **✅ ALWAYS DO:**
1. **✅ Use deploy scripts** for all deployments
2. **✅ Git commit first** with meaningful messages
3. **✅ Create backups** before any changes
4. **✅ Load widgets cross-server** via HTTP includes
5. **✅ Test locally** before deployment
6. **✅ Use external APIs** when they exist (data.directsponsor.org)
7. **✅ Keep architecture simple** - avoid complexity when simple solutions work

---

## 🛠 **Deployment Workflows**

### **ROFLFaucet Deployment:**
```bash
# In ROFLFaucet directory
git add .
git commit -m "Meaningful commit message"
./deploy-roflfaucet.sh
```

**What it does:**
- ✅ Commits changes to git
- ✅ Creates backup on VPS
- ✅ Syncs files to ROFLFaucet server (89.116.44.206)
- ✅ Restarts services
- ✅ Health check

### **UselessCoin Deployment:**
```bash
# In uselesscoin-deployment directory  
git add .
git commit -m "Widget/API updates"
./deploy-fast.sh
```

**What it does:**
- ✅ Commits changes to git
- ✅ Deploys to UselessCoin server (89.116.106.121)
- ✅ Makes widgets available globally

---

## 🏗️ **Architecture Philosophy**

### **Simplicity Over Complexity:**
- **External APIs First**: Use `data.directsponsor.org` instead of local PHP
- **Minimal Server Dependencies**: Static files + external services
- **Proven Solutions**: Don't reinvent what already works
- **CSS Best Practice**: Use relative units (rem, %, vw) for responsive design; fixed pixels only for borders/shadows

### **The PHP Avoidance Policy:**
When tempted to install PHP/complex backend services:
1. **First**: Check if external API already handles this
2. **Second**: Consider if feature is actually needed
3. **Third**: Look for client-side solutions
4. **Last Resort**: Add server complexity

**Real Example**: Slot machine transactions initially planned as local PHP API, but external `data.directsponsor.org/api/user/transaction` was simpler and more reliable.

---

## 🌐 **Cross-Server Integration Pattern**

### **Widget Loading Strategy:**
```html
<!-- ✅ CORRECT: Load from UselessCoin server -->
<script src="http://89.116.106.121/uselesscoin-vote-widget.js"></script>

<!-- ❌ WRONG: Local dependency -->
<script src="./uselesscoin-vote-widget.js"></script>
```

### **API Calls:**
```javascript
// ✅ CORRECT: Cross-server API calls
const apiUrl = 'http://89.116.106.121/uselesscoin-faucet-style.php';

// ❌ WRONG: Local API dependency
const apiUrl = './api/uselesscoin.php';
```

---

## 📁 **File Organization Policy**

### **ROFLFaucet Server Files:**
```
/root/roflfaucet/
├── index.html                   # Main ROFLFaucet page
├── roflfaucet-uselesscoin.html  # Integrated version
├── styles.css                   # ROFLFaucet styling
├── script.js                    # ROFLFaucet logic
├── illusions.html               # Illusions page
└── images/                      # ROFLFaucet assets
```

### **UselessCoin Server Files:**
```
/var/www/html/
├── uselesscoin-vote-widget.js   # Global widget script
├── uselesscoin-dashboard.html   # Dashboard interface  
├── uselesscoin-faucet-style.php # Core API
├── widget-test.html             # Testing interface
└── index.html                   # Beta landing page
```

---

## 🚀 **Benefits of This Architecture**

### **✅ Scalability:**
- Each site can deploy independently
- No server conflicts or overwrites
- Widget updates affect all sites instantly

### **✅ Maintainability:**
- Clear separation of concerns
- Easy to track which files belong where
- Git history stays clean per project

### **✅ Reliability:**
- If one server goes down, others continue working
- Distributed load reduces bottlenecks
- Easy to rollback specific components

### **✅ Development Speed:**
- Teams can work on different servers simultaneously
- No merge conflicts between projects
- Faster testing and iteration

---

## 🧪 **Testing Procedures**

### **Before Deployment:**
1. **Local testing** with cross-server widget loading
2. **Verify API endpoints** are responding
3. **Check widget functionality** on test pages
4. **Confirm authentication** works across servers

### **After Deployment:**
1. **Health check** each deployed server
2. **Widget loading test** from external sites
3. **Cross-server functionality** verification
4. **User flow testing** (login → claim → vote)

---

## 📊 **Monitoring & Logs**

### **Key Metrics to Track:**
- **Widget load success rate** across servers
- **API response times** for cross-server calls
- **Authentication flow** completion rates
- **User retention** across the ecosystem

### **Log Locations:**
- **ROFLFaucet logs**: `/root/roflfaucet/logs/`
- **UselessCoin logs**: `/var/log/nginx/` 
- **Deploy logs**: Created by deploy scripts

---

## 🔒 **Security Considerations**

### **CORS Policy:**
- UselessCoin server must allow cross-origin requests
- Whitelist known domains (roflfaucet.com, etc.)
- Never use `*` for production CORS

### **API Security:**
- All cross-server API calls use HTTPS when possible
- User authentication validated on each request
- Rate limiting to prevent abuse

---

## 📝 **Documentation Updates**

### **When to Update This Document:**
- ✅ Adding new servers to the ecosystem
- ✅ Changing deployment procedures  
- ✅ Modifying cross-server integration patterns
- ✅ Adding new security requirements

### **Review Schedule:**
- **Monthly** - Review for accuracy
- **Before major releases** - Validate all procedures
- **After incidents** - Update based on lessons learned

---

## 🎉 **Success Metrics**

A successful deployment should achieve:
- ✅ **Zero downtime** during deployment
- ✅ **All widgets loading** within 3 seconds
- ✅ **Cross-server authentication** working seamlessly  
- ✅ **No 404 errors** on widget/API calls
- ✅ **Git history** properly maintained

---

## 🆘 **Emergency Procedures**

### **If Widget Loading Fails:**
1. Check UselessCoin server (89.116.106.121) status
2. Verify CORS headers are set correctly
3. Rollback widget updates if necessary
4. Use cached/backup widget version

### **If Cross-Server API Fails:**
1. Check network connectivity between servers
2. Verify API endpoints are responding
3. Check rate limiting/firewall rules
4. Implement graceful degradation

---

**Last Updated:** June 17, 2025  
**Next Review:** July 17, 2025  

*This document is version controlled - always check git for the latest version before deployments.*

