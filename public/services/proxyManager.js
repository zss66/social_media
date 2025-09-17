// proxyManager.js - 代理管理模块
const http = require('http');
const net = require('net');
const { URL } = require('url');

/**
 * HTTP 代理服务器实现
 */
async function httpProxyRules(proxyRules) {
    const proxyRulesList = proxyRules.match(
        /http:\/\/(.*):(.*?)@(.*):(\d+)/
    ) || proxyRules.match(
        /http:\/\/([^:@]*)(?::([^@]*))?@(.*):(\d+)/
    );

    if (!proxyRulesList) throw new Error("Invalid proxy rules format");

    const [, userId, password, host, port] = proxyRulesList;
    const proxyConfig = {
        host,
        port: Number(port),
        authHeader: userId ? `Basic ${Buffer.from(`${userId}:${password}`).toString('base64')}` : null
    };

    const activeSockets = new Set();
    let httpServer;

    // 创建 HTTP 服务器
    httpServer = http.createServer(async (req, res) => {
        try {
            const url = req.url.startsWith('http') ? req.url : `http://${req.headers.host}${req.url}`;
            const target = new URL(url);

            const socket = net.createConnection({
                host: proxyConfig.host,
                port: proxyConfig.port
            });

            activeSockets.add(socket);
            socket.once('close', () => activeSockets.delete(socket));

            await new Promise((resolve, reject) => {
                socket.once('connect', resolve);
                socket.once('error', reject);
            });

            // 构建请求头
            const headers = {
                ...req.headers,
                Host: `${target.hostname}:${target.port || 80}`,
                Connection: 'close'
            };

            if (proxyConfig.authHeader) {
                headers['Proxy-Authorization'] = proxyConfig.authHeader;
            }

            delete headers['proxy-connection'];

            const headerString = Object.entries(headers)
                .map(([k, v]) => `${k}: ${v}\r\n`)
                .join("");

            const requestLine = `${req.method} ${target.pathname}${target.search || ''} HTTP/1.1\r\n`;
            socket.write(requestLine + headerString + '\r\n');

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

                        const headers = headerLines.reduce((acc, line) => {
                            const [key, value] = line.split(': ');
                            if (key && value) acc[key] = value;
                            return acc;
                        }, {});

                        res.writeHead(statusCode, headers);

                        const body = buffer.slice(headerEnd + 4);
                        if (body.length > 0) {
                            res.write(body);
                        }
                    }
                } else {
                    res.write(data);
                }
            });

            socket.on('end', () => res.end());
            socket.on('error', () => {
                res.writeHead(502, { "Content-Type": "text/plain" });
                res.end("Proxy connection error");
            });

            req.pipe(socket);

        } catch (error) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Proxy request error: " + error.message);
        }
    });

    // 处理 HTTPS CONNECT 请求
    httpServer.on("connect", async (req, clientSocket, head) => {
        try {
            const [targetHost, targetPort] = req.url.split(':');
            const socket = net.createConnection({
                host: proxyConfig.host,
                port: proxyConfig.port
            });

            activeSockets.add(socket);
            socket.once('close', () => activeSockets.delete(socket));

            await new Promise((resolve, reject) => {
                socket.once('connect', resolve);
                socket.once('error', reject);
            });

            // 发送 CONNECT 请求到远程代理
            const connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
                `Host: ${targetHost}:${targetPort}\r\n` +
                (proxyConfig.authHeader ? `Proxy-Authorization: ${proxyConfig.authHeader}\r\n` : '') +
                `\r\n`;

            await new Promise((resolve, reject) => {
                let responseData = '';
                const onData = (data) => {
                    responseData += data.toString();
                    if (responseData.includes('\r\n\r\n')) {
                        socket.removeListener('data', onData);
                        if (responseData.match(/^HTTP\/\d\.\d 200/)) {
                            resolve();
                        } else {
                            reject(new Error(`Proxy refused connection: ${responseData.split('\r\n')[0]}`));
                        }
                    }
                };

                socket.on('data', onData);
                socket.once('error', reject);
                socket.write(connectRequest);
            });

            clientSocket.on("error", (err) => {
                clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
                clientSocket.end("Proxy socket error: " + err.message);
                clientSocket.destroy();
                socket.destroy();
            });

            socket.on("error", (err) => {
                clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
                clientSocket.end("Proxy socket error: " + err.message);
                clientSocket.destroy();
                socket.destroy();
            });

            clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
            socket.write(head);

            socket.pipe(clientSocket);
            clientSocket.pipe(socket);

        } catch (error) {
            clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
            clientSocket.end("Proxy socket error: " + error.message);
            clientSocket.destroy();
        }
    });

    // 启动服务器
    httpServer.listen(0);

    return new Promise(resolve => {
        httpServer.on('listening', () => {
            const port = httpServer.address().port;
            resolve({
                url: `http://127.0.0.1:${port}`,
                close: async () => {
                    return new Promise((resolve) => {
                        activeSockets.forEach(s => s.destroy());
                        activeSockets.clear();
                        httpServer.close(() => resolve());
                    });
                }
            });
        });
    });
}

/**
 * SOCKS 代理服务器实现
 */
async function sockProxyRules(proxyRules) {
    const { SocksClient } = require('socks');
    
    const proxyRulesList = proxyRules.match(
        /socks(\d+):\/\/(.*):(.*?)@(.*):(\d+)/
    );

    if (!proxyRulesList) throw new Error("Invalid SOCKS proxy rules");

    const [, type, userId, password, host, port] = proxyRulesList;
    const socksOptions = {
        proxy: {
            host,
            port: Number.parseInt(port),
            type: Number.parseInt(type),
            userId,
            password,
        },
        command: "connect",
        destination: { host: "", port: 0 },
    };

    const activeSockets = new Set();
    const connectionPool = new Map();
    let httpServer;

    // 创建 HTTP 服务器
    httpServer = http.createServer(async (req, res) => {
        if (!req.url) return;

        const urlObject = req.url.startsWith('http') ? 
            new URL(req.url) : 
            new URL(`http://${req.headers.host}${req.url}`);
        
        socksOptions.destination.host = urlObject.hostname;
        socksOptions.destination.port = Number.parseInt(urlObject.port || "80");

        try {
            const key = `${urlObject.hostname}:${socksOptions.destination.port}`;
            let socket;

            // 连接池管理
            if (connectionPool.has(key)) {
                socket = connectionPool.get(key);
                if (socket.destroyed) {
                    connectionPool.delete(key);
                    socket = (await SocksClient.createConnection(socksOptions)).socket;
                }
            } else {
                const result = await SocksClient.createConnection(socksOptions);
                socket = result.socket;
            }

            activeSockets.add(socket);

            socket.once('close', () => {
                activeSockets.delete(socket);
                connectionPool.delete(key);
            });

            socket.setTimeout(30000, () => {
                socket.destroy();
                connectionPool.delete(key);
            });

            req.pipe(socket);
            socket.pipe(res);

            res.on('finish', () => {
                if (!socket.destroyed) {
                    connectionPool.set(key, socket);
                }
            });

        } catch (error) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("SOCKS proxy request error: " + error.message);
        }
    });

    // 处理 HTTPS CONNECT 请求
    httpServer.on("connect", async (req, clientSocket, head) => {
        const [hostname, port] = req.url.split(':');
        if (!hostname || !port) {
            clientSocket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
            return;
        }

        socksOptions.destination.host = hostname;
        socksOptions.destination.port = Number.parseInt(port);

        try {
            const { socket } = await SocksClient.createConnection(socksOptions);
            activeSockets.add(socket);

            const errorHandler = (err) => {
                clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
                clientSocket.end("Proxy socket error: " + err.message);
                clientSocket.destroy();
                socket.destroy();
            };

            clientSocket.on("error", errorHandler);
            socket.on("error", errorHandler);
            socket.on('close', () => activeSockets.delete(socket));

            clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
            socket.write(head);

            socket.pipe(clientSocket);
            clientSocket.pipe(socket);
        } catch (error) {
            clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
            clientSocket.end("Proxy socket error: " + error.message);
            clientSocket.destroy();
        }
    });

    httpServer.on("error", (error) => {
        console.error("SOCKS Proxy Server Error: ", error.message);
    });

    // 启动服务器
    const randomPort = Math.floor(1e4 * Math.random()) + 5e4;
    await new Promise((resolve) => {
        httpServer.listen(randomPort, resolve);
    });

    return {
        url: `http://127.0.0.1:${randomPort}`,
        close: async () => {
            return new Promise((resolve) => {
                activeSockets.forEach(socket => socket.destroy());
                activeSockets.clear();
                connectionPool.clear();
                httpServer.close(() => resolve());
            });
        }
    };
}

/**
 * 代理管理器类
 */
class ProxyManager {
    constructor() {
        this.proxyServers = new Map(); // containerId -> proxyServer
    }

    /**
     * 为容器创建认证代理
     */
    async createAuthenticatedProxy(containerId, proxyConfig) {
        // 停止旧的代理服务器
        await this.stopProxy(containerId);
        
        if (!proxyConfig.username || !proxyConfig.password) {
            // 无需认证，返回直连配置
            return this.generateDirectProxyRules(proxyConfig);
        }

        let proxyServer;
        
        if (proxyConfig.type === 'socks5') {
            const proxyUrl = `socks5://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
            proxyServer = await sockProxyRules(proxyUrl);
        } else {
            const proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
            proxyServer = await httpProxyRules(proxyUrl);
        }
        
        // 保存服务器引用
        this.proxyServers.set(containerId, proxyServer);
        
        // 返回本地代理 URL
        const url = new URL(proxyServer.url);
        return `http://${url.host}`;
    }

    /**
     * 生成直连代理规则（无认证）
     */
    generateDirectProxyRules(proxyConfig) {
        const { type, host, port } = proxyConfig;
        
        if (type === "https" || type === "http") {
            return `http://${host}:${port}`;
        } else if (type === "socks5") {
            return `socks5://${host}:${port}`;
        } else {
            throw new Error(`不支持的代理类型: ${type}`);
        }
    }

    /**
     * 停止容器的代理服务器
     */
    async stopProxy(containerId) {
        const proxyServer = this.proxyServers.get(containerId);
        if (proxyServer && proxyServer.close) {
            await proxyServer.close();
            this.proxyServers.delete(containerId);
        }
    }

    /**
     * 停止所有代理服务器
     */
    async stopAllProxies() {
        const stopPromises = Array.from(this.proxyServers.keys()).map(
            containerId => this.stopProxy(containerId)
        );
        await Promise.all(stopPromises);
    }
}

module.exports = {
    ProxyManager,
    httpProxyRules,
    sockProxyRules
};