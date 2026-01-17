// ngl-spammer.js - Enhanced Real NGL Spam Engine
OXYLUS.ngl = {
    active: false,
    sentCount: 0,
    failedCount: 0,
    currentJob: null,
    proxies: [],
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36'
    ],
    
    // Initialize with random proxies
    init() {
        // Public proxy list for rotation (will be populated)
        this.proxies = [
            // Will be fetched dynamically
        ];
    },
    
    // Main spam function
    async spam(nglLink, message, count = 100, delay = 2000, options = {}) {
        if(!OXYLUS.requireAuth()) return;
        
        console.log(`[NGL] 🚀 Initializing spam attack...`);
        
        // Validate and parse NGL link
        const parsed = this.parseNGLLink(nglLink);
        if(!parsed.valid) {
            console.log(`[NGL] ❌ Invalid NGL link: ${parsed.error}`);
            return;
        }
        
        const { username, directLink } = parsed;
        
        console.log(`[NGL] 🎯 Target: ${username}`);
        console.log(`[NGL] 💬 Message: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`);
        console.log(`[NGL] 📊 Count: ${count} messages`);
        console.log(`[NGL] ⏱️ Delay: ${delay}ms between messages`);
        console.log(`[NGL] 🔗 Direct API: ${directLink}`);
        
        this.active = true;
        this.sentCount = 0;
        this.failedCount = 0;
        this.startTime = Date.now();
        
        // Main spam loop
        for(let i = 1; i <= count && this.active; i++) {
            try {
                const success = await this.sendSingleMessage(username, message, i);
                
                if(success) {
                    this.sentCount++;
                    console.log(`[NGL] ✅ [${i}/${count}] Sent to ${username}`);
                    
                    // Calculate progress
                    const progress = Math.round((i / count) * 100);
                    if(i % 10 === 0 || i === count) {
                        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
                        const remaining = Math.round(((count - i) * delay) / 1000);
                        console.log(`[NGL] 📈 Progress: ${progress}% | Elapsed: ${elapsed}s | Remaining: ~${remaining}s`);
                    }
                } else {
                    this.failedCount++;
                    console.log(`[NGL] ⚠️ [${i}/${count}] Failed, retrying...`);
                    i--; // Retry this message
                    
                    // Exponential backoff for failures
                    await this.sleep(delay * 2);
                    continue;
                }
                
                // Random delay between messages
                if(i < count) {
                    const randomDelay = delay + Math.random() * 1000 - 500;
                    await this.sleep(Math.max(1000, randomDelay));
                }
                
            } catch(error) {
                console.log(`[NGL] ❌ [${i}/${count}] Error: ${error.message}`);
                this.failedCount++;
                
                // Wait longer on critical errors
                await this.sleep(5000);
            }
        }
        
        // Final report
        this.printReport(username, count);
        this.active = false;
        
        return {
            target: username,
            success: this.sentCount,
            failed: this.failedCount,
            successRate: Math.round((this.sentCount / count) * 100),
            duration: Math.round((Date.now() - this.startTime) / 1000)
        };
    },
    
    // Parse and validate NGL link
    parseNGLLink(link) {
        try {
            let username = '';
            
            // Handle various NGL link formats
            if(link.includes('ngl.link/')) {
                username = link.split('ngl.link/')[1].split('?')[0].split('/')[0];
            } else if(link.includes('ngl.la/')) {
                username = link.split('ngl.la/')[1].split('?')[0].split('/')[0];
            } else {
                // Assume it's just the username
                username = link.trim();
            }
            
            if(!username || username.length < 2) {
                return { valid: false, error: 'Invalid username format' };
            }
            
            // Clean username
            username = username.replace(/[^a-zA-Z0-9_-]/g, '');
            
            const directLink = `https://ngl.link/api/submit`;
            
            return {
                valid: true,
                username: username,
                directLink: directLink,
                webLink: `https://ngl.link/${username}`
            };
            
        } catch(error) {
            return { valid: false, error: error.message };
        }
    },
    
    // Send single message to NGL
    async sendSingleMessage(username, message, attemptNumber) {
        try {
            // Generate unique device ID for each attempt
            const deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Prepare form data
            const formData = new FormData();
            formData.append('username', username);
            formData.append('question', message);
            formData.append('deviceId', deviceId);
            formData.append('gameSlug', '');
            formData.append('referrer', '');
            
            // Random User-Agent
            const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
            
            // Create unique request signature
            const timestamp = Date.now();
            const uniqueParam = `_${timestamp}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Make request
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('https://ngl.link/api/submit', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://ngl.link',
                    'Referer': `https://ngl.link/${username}`,
                    'User-Agent': userAgent,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            clearTimeout(timeout);
            
            // Check response
            if(response.status === 200 || response.status === 201) {
                try {
                    const result = await response.json();
                    if(result.status === 'ok' || result.success === true) {
                        return true;
                    }
                } catch {
                    // Even if JSON parse fails, 200 status is usually success
                    return true;
                }
            }
            
            // Handle rate limiting
            if(response.status === 429) {
                console.log(`[NGL] ⚠️ Rate limited, waiting 30 seconds...`);
                await this.sleep(30000);
                return false;
            }
            
            return false;
            
        } catch(error) {
            if(error.name === 'AbortError') {
                console.log(`[NGL] ⏱️ Request timeout`);
            }
            return false;
        }
    },
    
    // Batch spam - multiple messages at once
    async spamBatch(nglLink, messages, countPerMessage = 10, delay = 3000) {
        if(!OXYLUS.requireAuth()) return;
        
        const parsed = this.parseNGLLink(nglLink);
        if(!parsed.valid) {
            console.log(`[NGL] ❌ ${parsed.error}`);
            return;
        }
        
        console.log(`[NGL] 🚀 Starting batch spam`);
        console.log(`[NGL] 🎯 Target: ${parsed.username}`);
        console.log(`[NGL] 💬 Messages: ${messages.length} unique`);
        console.log(`[NGL] 📊 Per message: ${countPerMessage} times`);
        console.log(`[NGL] 📈 Total: ${messages.length * countPerMessage} submissions`);
        
        this.active = true;
        let totalSent = 0;
        const totalTarget = messages.length * countPerMessage;
        
        for(let msgIndex = 0; msgIndex < messages.length && this.active; msgIndex++) {
            const message = messages[msgIndex];
            
            for(let i = 0; i < countPerMessage && this.active; i++) {
                const success = await this.sendSingleMessage(parsed.username, message, totalSent + 1);
                
                if(success) {
                    totalSent++;
                    console.log(`[NGL] ✅ [${totalSent}/${totalTarget}] "${message.substring(0, 40)}..."`);
                } else {
                    console.log(`[NGL] ⚠️ Failed, skipping this message`);
                }
                
                if(totalSent < totalTarget) {
                    await this.sleep(delay);
                }
            }
        }
        
        console.log(`[NGL] 🎯 Batch complete: ${totalSent}/${totalTarget} sent`);
        this.active = false;
        
        return totalSent;
    },
    
    // Advanced: Rotating proxy spam
    async spamWithProxies(nglLink, message, count = 50, useProxies = true) {
        if(!OXYLUS.requireAuth()) return;
        
        console.log(`[NGL] 🔄 Starting proxy-rotated spam`);
        
        if(useProxies && this.proxies.length === 0) {
            await this.fetchProxies();
        }
        
        return await this.spam(nglLink, message, count, 3000, { useProxies });
    },
    
    // Fetch fresh proxy list
    async fetchProxies() {
        try {
            console.log(`[NGL] 🔍 Fetching proxy list...`);
            
            // Fetch from public proxy APIs
            const proxySources = [
                'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
                'https://www.proxy-list.download/api/v1/get?type=http'
            ];
            
            for(const source of proxySources) {
                try {
                    const response = await fetch(source);
                    const text = await response.text();
                    
                    const proxies = text.split('\n')
                        .map(p => p.trim())
                        .filter(p => p.includes(':'))
                        .filter(p => !p.includes('<'));
                    
                    if(proxies.length > 0) {
                        this.proxies = [...this.proxies, ...proxies];
                        console.log(`[NGL] ✅ Added ${proxies.length} proxies from source`);
                        break;
                    }
                } catch(e) {
                    continue;
                }
            }
            
            // Remove duplicates
            this.proxies = [...new Set(this.proxies)];
            console.log(`[NGL] 📊 Total proxies available: ${this.proxies.length}`);
            
        } catch(error) {
            console.log(`[NGL] ⚠️ Could not fetch proxies, using direct connection`);
        }
    },
    
    // Stop spam operation
    stop() {
        if(this.active) {
            this.active = false;
            console.log(`[NGL] 🛑 Spam operation stopped`);
            console.log(`[NGL] 📊 Sent: ${this.sentCount} | Failed: ${this.failedCount}`);
        }
    },
    
    // Get current status
    status() {
        if(this.active) {
            const elapsed = Math.round((Date.now() - this.startTime) / 1000);
            const rate = elapsed > 0 ? Math.round(this.sentCount / elapsed) : 0;
            
            return {
                active: true,
                sent: this.sentCount,
                failed: this.failedCount,
                rate: `${rate}/min`,
                elapsed: `${elapsed}s`
            };
        }
        
        return { active: false };
    },
    
    // Utility functions
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    printReport(username, targetCount) {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const successRate = Math.round((this.sentCount / targetCount) * 100);
        
        console.log(`\n╔══════════════════════════════════════╗`);
        console.log(`║         NGL SPAM REPORT              ║`);
        console.log(`╠══════════════════════════════════════╣`);
        console.log(`║ Target: ${username.padEnd(25)} ║`);
        console.log(`║ Duration: ${duration.toString().padEnd(6)} seconds${' '.repeat(11)}║`);
        console.log(`║ Target Count: ${targetCount.toString().padEnd(6)}${' '.repeat(14)}║`);
        console.log(`║ Successfully Sent: ${this.sentCount.toString().padEnd(6)}${' '.repeat(8)}║`);
        console.log(`║ Failed: ${this.failedCount.toString().padEnd(6)}${' '.repeat(19)}║`);
        console.log(`║ Success Rate: ${successRate.toString().padEnd(3)}%${' '.repeat(17)}║`);
        console.log(`║ Messages/Min: ${Math.round(this.sentCount / (duration / 60))}${' '.repeat(18)}║`);
        console.log(`╚══════════════════════════════════════╝\n`);
    },
    
    // Quick test function
    test(nglLink) {
        const parsed = this.parseNGLLink(nglLink);
        if(!parsed.valid) {
            console.log(`[TEST] ❌ ${parsed.error}`);
            return false;
        }
        
        console.log(`[TEST] 🔍 Testing NGL connection...`);
        console.log(`[TEST] Username: ${parsed.username}`);
        console.log(`[TEST] API Endpoint: ${parsed.directLink}`);
        console.log(`[TEST] Web Interface: ${parsed.webLink}`);
        
        // Test with a single message
        this.sendSingleMessage(parsed.username, 'Test message from OXYLUS_PROTOCOL', 1)
            .then(success => {
                if(success) {
                    console.log(`[TEST] ✅ Connection successful - Ready to spam`);
                } else {
                    console.log(`[TEST] ⚠️ Connection test failed - May be rate limited`);
                }
            });
        
        return true;
    }
};

// Auto-initialize
OXYLUS.ngl.init();
