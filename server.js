const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// 推送更新功能已移除

// 创建 Express 应用
const app = express();
// 创建 HTTP 服务器并将 Express 应用挂载其上
const server = http.createServer(app);
// 创建 Socket.IO 服务器并将其附加到 HTTP 服务器
const io = new Server(server);

// 提供静态文件（前端资源）
app.use(express.static(path.join(__dirname, 'public')));

// 处理根路径请求，发送 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 存储聊天历史
const chatHistory = [];
const MAX_HISTORY = 50;

// 在线用户计数
let onlineUsers = 0;

// 处理 Socket.IO 连接
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 增加在线人数
  onlineUsers++;
  console.log('当前在线人数:', onlineUsers);

  // 广播在线人数更新
  io.emit('online count', onlineUsers);

  // 发送聊天历史给新连接的客户端
  socket.emit('chat history', chatHistory);

  // 处理新消息
  socket.on('chat message', (msg) => {
    const messageWithId = {
      id: Date.now(),
      userId: socket.id,
      username: msg.username || '匿名用户',
      text: msg.text,
      timestamp: new Date().toLocaleTimeString()
    };

    // 保存到聊天历史
    chatHistory.push(messageWithId);

    // 如果历史记录超过最大限制，删除最早的消息
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }

    // 广播给所有客户端，包括发送者
    io.emit('chat message', messageWithId);
  });

  // 处理用户断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);

    // 减少在线人数
    onlineUsers = Math.max(0, onlineUsers - 1);
    console.log('当前在线人数:', onlineUsers);

    // 广播在线人数更新
    io.emit('online count', onlineUsers);
  });
});

// 推送更新功能已移除

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 或 http://<服务器IP>:${PORT} 开始聊天`);
  
  // 推送更新功能已移除
});