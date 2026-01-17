// auth.js - Authentication system
const OXYLUS = {
    password: "DinoProtocol",
    authenticated: false,
    
    auth(input) {
        if(input === this.password) {
            this.authenticated = true;
            console.log("[AUTH] ✅ Access granted");
            console.log("[SYSTEM] OXYLUS_PROTOCOL v4.0 ACTIVE");
            return true;
        }
        console.log("[AUTH] ❌ Access denied");
        return false;
    },
    
    requireAuth() {
        if(!this.authenticated) {
            console.log("[ERROR] Authentication required");
            return false;
        }
        return true;
    },
    
    showCommands() {
        console.log(`
╔══════════════════════════════════════════════╗
║           OXYLUS_PROTOCOL v4.0              ║
╠══════════════════════════════════════════════╣
║ COMMANDS:                                    ║
║                                              ║
║ 1. DDoS Attack:                              ║
║    OXYLUS.ddos.target("IP/DOMAIN", PORT,    ║
║        INTENSITY, DURATION_SECONDS)         ║
║    • Intensity: low/med/hard                ║
║    • Duration: 0 = unlimited                ║
║                                              ║
║ 2. NGL Spam:                                 ║
║    OXYLUS.ngl.spam("NGL_LINK",              ║
║        "MESSAGE", COUNT, DELAY_MS)          ║
║                                              ║
║ 3. Target Scanner:                           ║
║    OXYLUS.scan.target("IP/DOMAIN")          ║
║                                              ║
║ 4. System Control:                           ║
║    OXYLUS.stop.all()                        ║
║    OXYLUS.status()                          ║
║                                              ║
║ 5. Multi-Target Attack:                      ║
║    OXYLUS.multi.attack(["target1",         ║
║        "target2"], "hard")                  ║
╚══════════════════════════════════════════════╝
        `);
    }
};
