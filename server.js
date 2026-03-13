const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
// 引入用户数据库
const userDB = require('./users');

// 存储在线用户
const onlineUsers = new Map();

// 推送更新功能已移除

// 创建 Express 应用
const app = express();
// 创建 HTTP 服务器并将 Express 应用挂载其上
const server = http.createServer(app);
// 创建 Socket.IO 服务器并将其附加到 HTTP 服务器
const io = new Server(server);

// 提供静态文件（前端资源）
app.use(express.static(path.join(__dirname, 'public')));

// 处理根路径请求
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 处理聊天页面请求
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 存储聊天历史
const chatHistory = [];
const MAX_HISTORY = 50;

// 处理 Socket.IO 连接
io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);
  let currentUser = null;

  // 处理用户加入
  socket.on('user join', (data) => {
    const { username } = data;
    
    // 检查用户名是否已被其他连接使用
    for (const [socketId, user] of onlineUsers.entries()) {
      if (user.username === username && socketId !== socket.id) {
        // 通知旧连接已被挤下线
        io.to(socketId).emit('kicked', { message: '您的用户名已被其他设备使用' });
        // 移除旧连接
        onlineUsers.delete(socketId);
        break;
      }
    }

    // 存储用户信息
    currentUser = { username: username, id: socket.id };
    onlineUsers.set(socket.id, currentUser);

    console.log(`用户 ${username} 加入`);

    // 发送加入成功响应
    socket.emit('user join result', {
      success: true
    });

    // 发送聊天历史给新加入的客户端
    socket.emit('chat history', chatHistory);
  });

  // 处理新消息
  socket.on('chat message', (msg) => {
    // 检查用户是否已加入
    if (!currentUser) {
      socket.emit('error message', { message: '请先加入聊天' });
      return;
    }

    const messageWithId = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      text: msg.text,
      file: msg.file,
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

    // 如果是已加入的用户
    if (currentUser) {
      onlineUsers.delete(socket.id);
      console.log(`用户 ${currentUser.username} 断开连接`);
    }
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