// auth-system.js - Multi-User Authentication System
const AUTH_SYSTEM = {
    // Master developer account
    MASTER_DEV: {
        password: "DinoDevProtocol",
        type: "developer",
        permissions: ["all"],
        expired: null // Never expires
    },
    
    // User accounts storage
    users: {},
    
    // Current session
    currentUser: null,
    sessionExpiry: null,
    
    // Initialize
    init() {
        // Load users from localStorage
        this.loadUsers();
        
        // Check for existing session
        this.checkExistingSession();
        
        console.log('[AUTH] Multi-user system initialized');
    },
    
    // Load users from storage
    loadUsers() {
        const stored = localStorage.getItem('oxylus_users');
        if(stored) {
            this.users = JSON.parse(stored);
        }
        
        // Always include master dev
        this.users['dev_master'] = this.MASTER_DEV;
    },
    
    // Save users to storage
    saveUsers() {
        localStorage.setItem('oxylus_users', JSON.stringify(this.users));
    },
    
    // Authenticate user
    authenticate(username, password) {
        // Check master dev
        if(password === this.MASTER_DEV.password) {
            this.currentUser = {
                username: 'dev_master',
                type: 'developer',
                permissions: ['all'],
                created: new Date().toISOString()
            };
            this.createSession(0); // Never expires
            return { success: true, user: this.currentUser };
        }
        
        // Check regular users
        const user = this.users[username];
        if(user && user.password === password) {
            // Check if account expired
            if(user.expired && new Date(user.expired) < new Date()) {
                return { success: false, error: 'Account expired' };
            }
            
            this.currentUser = {
                username: username,
                type: user.type,
                permissions: user.permissions || [],
                created: user.created
            };
            
            // Calculate session duration based on account type
            const sessionHours = user.type === 'developer' ? 12 : 2;
            this.createSession(sessionHours);
            
            return { success: true, user: this.currentUser };
        }
        
        return { success: false, error: 'Invalid credentials' };
    },
    
    // Create session
    createSession(hours) {
        this.sessionExpiry = hours > 0 ? 
            Date.now() + (hours * 60 * 60 * 1000) : 
            null; // Never expires for dev
        
        localStorage.setItem('oxylus_session', JSON.stringify({
            user: this.currentUser,
            expiry: this.sessionExpiry
        }));
    },
    
    // Check existing session
    checkExistingSession() {
        const session = localStorage.getItem('oxylus_session');
        if(!session) return false;
        
        try {
            const data = JSON.parse(session);
            
            // Check if session expired
            if(data.expiry && data.expiry < Date.now()) {
                this.clearSession();
                return false;
            }
            
            this.currentUser = data.user;
            this.sessionExpiry = data.expiry;
            return true;
        } catch(e) {
            this.clearSession();
            return false;
        }
    },
    
    // Check permission
    hasPermission(permission) {
        if(!this.currentUser) return false;
        
        // Developer has all permissions
        if(this.currentUser.type === 'developer') return true;
        
        // Check specific permissions
        if(this.currentUser.permissions.includes('all')) return true;
        
        return this.currentUser.permissions.includes(permission);
    },
    
    // Check if feature is allowed for current user
    isFeatureAllowed(feature) {
        const featureRestrictions = {
            'ddos_extreme': ['developer', 'special'],
            'dev_panel': ['developer'],
            'user_management': ['developer'],
            'scheduler': ['developer', 'special', 'guest'],
            'multi_target': ['developer', 'special'],
            'ngl_spam': ['developer', 'special', 'guest']
        };
        
        if(!featureRestrictions[feature]) return true;
        
        return featureRestrictions[feature].includes(this.currentUser.type);
    },
    
    // Create new account
    createAccount(data) {
        if(!this.currentUser || this.currentUser.type !== 'developer') {
            return { success: false, error: 'Permission denied' };
        }
        
        const { username, password, type, expiry } = data;
        
        // Validate
        if(this.users[username]) {
            return { success: false, error: 'Username already exists' };
        }
        
        if(!['guest', 'special', 'developer'].includes(type)) {
            return { success: false, error: 'Invalid account type' };
        }
        
        // Calculate expiry date
        let expiredDate = null;
        if(expiry && expiry.value > 0) {
            const now = new Date();
            switch(expiry.unit) {
                case 'minutes':
                    now.setMinutes(now.getMinutes() + expiry.value);
                    break;
                case 'hours':
                    now.setHours(now.getHours() + expiry.value);
                    break;
                case 'days':
                    now.setDate(now.getDate() + expiry.value);
                    break;
            }
            expiredDate = now.toISOString();
        }
        
        // Create user object
        const newUser = {
            password: password,
            type: type,
            created: new Date().toISOString(),
            expired: expiredDate,
            permissions: this.getDefaultPermissions(type),
            createdBy: this.currentUser.username
        };
        
        // Save user
        this.users[username] = newUser;
        this.saveUsers();
        
        return { success: true, user: { username, type, expired: expiredDate } };
    },
    
    // Get default permissions for account type
    getDefaultPermissions(type) {
        const permissions = {
            developer: ['all'],
            special: ['ddos_extreme', 'multi_target', 'scheduler', 'ngl_spam'],
            guest: ['ddos_medium', 'ngl_spam']
        };
        return permissions[type] || [];
    },
    
    // Delete account
    deleteAccount(username) {
        if(!this.currentUser || this.currentUser.type !== 'developer') {
            return { success: false, error: 'Permission denied' };
        }
        
        if(!this.users[username]) {
            return { success: false, error: 'User not found' };
        }
        
        // Cannot delete master dev
        if(username === 'dev_master') {
            return { success: false, error: 'Cannot delete master developer' };
        }
        
        delete this.users[username];
        this.saveUsers();
        
        return { success: true };
    },
    
    // List all accounts
    listAccounts() {
        if(!this.currentUser || this.currentUser.type !== 'developer') {
            return { success: false, error: 'Permission denied' };
        }
        
        const accounts = [];
        for(const [username, data] of Object.entries(this.users)) {
            accounts.push({
                username,
                type: data.type,
                created: data.created,
                expired: data.expired,
                createdBy: data.createdBy || 'system'
            });
        }
        
        return { success: true, accounts };
    },
    
    // Clear session
    clearSession() {
        this.currentUser = null;
        this.sessionExpiry = null;
        localStorage.removeItem('oxylus_session');
    },
    
    // Logout
    logout() {
        this.clearSession();
        window.location.href = 'index.html';
    },
    
    // Get current user info
    getUserInfo() {
        return this.currentUser;
    },
    
    // Check if user can access feature
    canAccess(feature) {
        return this.isFeatureAllowed(feature) && this.hasPermission(feature);
    }
};

// Initialize on load
AUTH_SYSTEM.init();
