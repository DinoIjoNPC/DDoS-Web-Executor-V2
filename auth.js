// auth.js - Simplified session-based authentication
const OXYLUS = {
    // Check if session exists
    checkSession() {
        const session = localStorage.getItem('oxylus_session');
        const sessionTime = localStorage.getItem('oxylus_session_time');
        
        if(!session || !sessionTime) return false;
        
        // Check if session is not expired (12 hours)
        const now = Date.now();
        const sessionAge = now - parseInt(sessionTime);
        const maxAge = 12 * 60 * 60 * 1000;
        
        return sessionAge < maxAge;
    },
    
    // Require authentication for commands
    requireAuth() {
        if(!this.checkSession()) {
            console.log(`
⚠️  SESSION EXPIRED ⚠️

Please login again at the main page.
            `);
            return false;
        }
        return true;
    },
    
    // Logout
    logout() {
        localStorage.removeItem('oxylus_session');
        localStorage.removeItem('oxylus_session_time');
        localStorage.removeItem('oxylus_auth');
        window.location.href = 'index.html';
    }
};
