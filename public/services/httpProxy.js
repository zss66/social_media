const { createServer } = require("node:http");
const net = require("node:net");
const tls = require("node:tls");
const { URL } = require("node:url");

class ProxyServer {
    constructor(proxyRules) {
        this.proxyRules = proxyRules;
        this.activeSockets = new Set();
        this.parseProxyRules();
    }

    parseProxyRules() {
        // 支持 http:// 和 https:// 协议
        const proxyRulesList = this.proxyRules.match(
            /https?:\/\/(.*):(.*?)@(.*):(\d+)/
        ) || this.proxyRules.match(
            /https?:\/\/([^:@]*)(?::([^@]*))?@(.*):(\d+)/
        );

        if (!proxyRulesList) {
            console.error('代理规则格式错误:', this.proxyRules);
            console.log('支持的格式:');
            console.log('  http://username:password@proxy.example.com:8080');
            console.log('  https://username:password@proxy.example.com:8080');
            console.log('  http://username@proxy.example.com:8080 (无密码)');
            throw new Error("Invalid proxy rules format");
        }

        const [fullMatch, userId, password, host, port] = proxyRulesList;
        const isHttps = fullMatch.startsWith('https://');
        
        this.proxyConfig = {
            host,
            port: Number(port),
            isHttps, // 记录代理服务器是否使用HTTPS
            authHeader: userId ? `Basic ${Buffer.from(`${userId}:${password || ''}`).toString('base64')}` : null
        };
        
        console.log(`代理配置解析成功: ${isHttps ? 'HTTPS' : 'HTTP'} ${host}:${port}`);
    }

    async start() {
        this.server = createServer(this.handleHttpRequest.bind(this));
        this.server.on("connect", this.handleHttpsConnect.bind(this));

        // 使用0让系统自动分配端口
        this.server.listen(0);

        return new Promise(resolve => {
            this.server.on('listening', () => {
                this.port = this.server.address().port;
                console.log(`代理服务器启动，支持 HTTP/HTTPS，端口: ${this.port}`);
                resolve({
                    url: `http://127.0.0.1:${this.port}`,
                    port: this.port,
                    close: this.close.bind(this)
                });
            });
        });
    }

    async handleHttpRequest(req, res) {
        try {
            const url = this.getRequestUrl(req);
            const target = new URL(url);
            
            console.log(`HTTP请求: ${req.method} ${url}`);

            const socket = await this.createProxyConnection();

            // 构造请求头
            const headers = this.buildHeaders(req, target);

            // 发送请求
            const requestLine = `${req.method} ${target.pathname}${target.search || ''} HTTP/1.1\r\n`;
            socket.write(requestLine + headers + '\r\n');

            // 处理响应
            let responseHeaders = null;
            let buffer = Buffer.alloc(0);

            socket.on('data', (data) => {
                buffer = Buffer.concat([buffer, data]);

                if (!responseHeaders) {
                    const headerEnd = buffer.indexOf('\r\n\r\n');
                    if (headerEnd !== -1) {
                        responseHeaders = buffer.slice(0, headerEnd).toString();
                        const [statusLine, ...headerLines] = responseHeaders.split('\r\n');
                        const statusCode = parseInt(statusLine.split(' ')[1], 10);

                        // 写入响应头
                        const headers = headerLines.reduce((acc, line) => {
                            const [key, value] = line.split(': ');
                            if (key && value) acc[key] = value;
                            return acc;
                        }, {});

                        res.writeHead(statusCode, headers);

                        // 写入剩余数据
                        const body = buffer.slice(headerEnd + 4);
                        if (body.length > 0) {
                            res.write(body);
                        }
                    }
                } else {
                    res.write(data);
                }
            });

            socket.on('end', () => {
                res.end();
                this.cleanupSocket(socket);
            });
            
            socket.on('error', (err) => {
                this.handleProxyError(res, err);
                this.cleanupSocket(socket);
            });

            // 处理客户端请求体
            req.on('data', chunk => socket.write(chunk));
            req.on('end', () => socket.end());
            req.on('error', (err) => {
                socket.destroy();
                this.handleRequestError(res, err);
            });

        } catch (error) {
            this.handleRequestError(res, error);
        }
    }

    async handleHttpsConnect(req, clientSocket, head) {
        try {
            const [targetHost, targetPort] = req.url.split(':');
            const port = targetPort || '443'; // 默认HTTPS端口
            
            console.log(`HTTPS CONNECT: ${targetHost}:${port}`);

            const proxySocket = await this.createProxyConnection();

            // 发送CONNECT请求到上游代理
            await this.sendConnectRequest(proxySocket, targetHost, port);

            // 设置错误处理
            const cleanup = () => {
                this.cleanupSocket(clientSocket);
                this.cleanupSocket(proxySocket);
            };

            clientSocket.on("error", (err) => {
                console.error("Client socket error:", err.message);
                cleanup();
            });
            
            proxySocket.on("error", (err) => {
                console.error("Proxy socket error:", err.message);
                cleanup();
            });

            clientSocket.on("close", cleanup);
            proxySocket.on("close", cleanup);

            // 发送200响应给客户端
            clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

            // 如果有初始数据，转发给代理
            if (head && head.length > 0) {
                proxySocket.write(head);
            }

            // 建立双向数据流
            proxySocket.pipe(clientSocket, { end: false });
            clientSocket.pipe(proxySocket, { end: false });

            console.log(`HTTPS隧道建立成功: ${targetHost}:${port}`);

        } catch (error) {
            console.error("HTTPS CONNECT失败:", error.message);
            try {
                clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
                clientSocket.end();
            } catch (e) {
                // 忽略写入错误
            }
            this.cleanupSocket(clientSocket);
        }
    }

    async createProxyConnection() {
        return new Promise((resolve, reject) => {
            let socket;
            
            if (this.proxyConfig.isHttps) {
                // 如果代理服务器使用HTTPS，使用TLS连接
                socket = tls.connect({
                    host: this.proxyConfig.host,
                    port: this.proxyConfig.port,
                    rejectUnauthorized: false // 在生产环境中可能需要设置为true
                });
            } else {
                // 普通HTTP代理连接
                socket = net.createConnection({
                    host: this.proxyConfig.host,
                    port: this.proxyConfig.port
                });
            }

            // 设置超时
            socket.setTimeout(30000, () => {
                socket.destroy();
                reject(new Error('代理连接超时'));
            });

            this.activeSockets.add(socket);
            
            socket.once('connect', () => {
                socket.setTimeout(0); // 清除连接超时
                console.log(`已连接到${this.proxyConfig.isHttps ? 'HTTPS' : 'HTTP'}代理: ${this.proxyConfig.host}:${this.proxyConfig.port}`);
                resolve(socket);
            });
            
            socket.once('error', (err) => {
                this.activeSockets.delete(socket);
                console.error(`代理连接错误 (${this.proxyConfig.host}:${this.proxyConfig.port}):`, err.message);
                reject(err);
            });

            socket.once('close', () => {
                this.activeSockets.delete(socket);
            });
        });
    }

    getRequestUrl(req) {
        if (req.url.startsWith('http')) return req.url;
        
        // 确定协议
        const protocol = req.connection.encrypted ? 'https' : 'http';
        return `${protocol}://${req.headers.host}${req.url}`;
    }

    buildHeaders(req, targetUrl) {
        const headers = { ...req.headers };
        
        // 设置目标主机
        headers.Host = targetUrl.hostname + (targetUrl.port ? `:${targetUrl.port}` : '');
        
        // 添加代理认证
        if (this.proxyConfig.authHeader) {
            headers['Proxy-Authorization'] = this.proxyConfig.authHeader;
        }

        // 清理不需要的头部
        delete headers['proxy-connection'];
        delete headers['connection'];

        return Object.entries(headers)
            .map(([k, v]) => `${k}: ${v}\r\n`)
            .join("");
    }

    async sendConnectRequest(socket, host, port) {
        const connectRequest = `CONNECT ${host}:${port} HTTP/1.1\r\n` +
            `Host: ${host}:${port}\r\n` +
            (this.proxyConfig.authHeader ? `Proxy-Authorization: ${this.proxyConfig.authHeader}\r\n` : '') +
            `\r\n`;

        return new Promise((resolve, reject) => {
            let responseData = '';
            const onData = (data) => {
                responseData += data.toString();
                if (responseData.includes('\r\n\r\n')) {
                    socket.removeListener('data', onData);
                    const statusLine = responseData.split('\r\n')[0];
                    if (responseData.match(/^HTTP\/\d\.\d 200/)) {
                        console.log(`CONNECT成功: ${host}:${port}`);
                        resolve();
                    } else {
                        console.error(`CONNECT失败: ${statusLine}`);
                        reject(new Error(`Proxy refused connection: ${statusLine}`));
                    }
                }
            };

            socket.on('data', onData);
            socket.once('error', reject);
            socket.write(connectRequest);
            
            // 设置CONNECT请求超时
            setTimeout(() => {
                socket.removeListener('data', onData);
                reject(new Error('CONNECT请求超时'));
            }, 10000);
        });
    }

    cleanupSocket(socket) {
        if (socket && !socket.destroyed) {
            try {
                socket.destroy();
            } catch (e) {
                // 忽略销毁错误
            }
        }
        this.activeSockets.delete(socket);
    }

    handleProxyError(res, err) {
        console.error('代理连接错误:', err.message);
        if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("代理连接错误: " + err.message);
        }
    }

    handleRequestError(res, error) {
        console.error('代理请求错误:', error.message);
        if (!res.headersSent) {
            res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("代理请求错误: " + error.message);
        }
    }

    async close() {
        return new Promise((resolve) => {
            this.activeSockets.forEach(s => s.destroy());
            this.activeSockets.clear();
            this.server.close(() => resolve());
        });
    }
}

async function httpProxyRules(proxyRules) {
    const proxy = new ProxyServer(proxyRules);
    return proxy.start();
}

module.exports = { httpProxyRules };