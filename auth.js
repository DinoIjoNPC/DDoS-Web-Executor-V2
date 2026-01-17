// auth.js - Authentication system for GUI
const OXYLUS = {
    password: "DinoProtocol",
    authenticated: false,
    
    // Check if user is coming from login
    checkAuth() {
        // Check localStorage or session
        const authStatus = localStorage.getItem('oxylus_auth');
        if(authStatus === 'granted') {
            this.authenticated = true;
            return true;
        }
        
        // Check URL parameter (fallback)
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get('auth') === 'true') {
            this.authenticated = true;
            localStorage.setItem('oxylus_auth', 'granted');
            return true;
        }
        
        return false;
    },
    
    // Set authentication
    setAuth(status) {
        this.authenticated = status;
        if(status) {
            localStorage.setItem('oxylus_auth', 'granted');
        } else {
            localStorage.removeItem('oxylus_auth');
        }
    },
    
    // Require authentication for commands
    requireAuth() {
        if(!this.authenticated) {
            console.log(`
⚠️  AUTHENTICATION REQUIRED ⚠️

Please login at the main page.
            `);
            return false;
        }
        return true;
    },
    
    // Logout
    logout() {
        this.authenticated = false;
        localStorage.removeItem('oxylus_auth');
        window.location.href = 'index.html';
    }
};

// Auto-check on system.html
if(window.location.pathname.includes('system.html')) {
    if(!OXYLUS.checkAuth()) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
    }
