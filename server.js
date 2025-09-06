const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
// 引入用户数据库
const userDB = require('./users');

// 存储已认证的用户会话和令牌
const authenticatedUsers = new Map();
const userSessions = new Map();
const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小时

// 生成唯一令牌
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 清理过期会话
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of userSessions.entries()) {
    if (now - session.createdAt > SESSION_EXPIRY_TIME) {
      userSessions.delete(token);
      console.log(`清理过期会话: ${token}`);
    }
  }
}

// 每小时清理一次过期会话
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

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

  // 处理登录请求
  socket.on('login', (credentials) => {
    const { username, password } = credentials;
    const user = userDB.verifyUser(username, password);

    if (user) {
      // 检查用户是否已在其他地方登录
      for (const [socketId, u] of authenticatedUsers.entries()) {
        if (u.id === user.id && socketId !== socket.id) {
          // 通知旧连接已被挤下线
          io.to(socketId).emit('kicked', { message: '您的账号在其他地方登录' });
          // 移除旧连接
          authenticatedUsers.delete(socketId);
          break;
        }
      }

      // 生成新令牌
      const token = generateToken();

      // 存储认证信息
      currentUser = user;
      authenticatedUsers.set(socket.id, user);
      userSessions.set(token, {
        userId: user.id,
        username: user.username,
        createdAt: Date.now()
      });

      console.log(`用户 ${user.username} 登录`);

      // 发送登录成功响应
      socket.emit('login result', {
        success: true,
        username: user.username,
        authToken: token
      });

      // 发送聊天历史给登录的客户端
      socket.emit('chat history', chatHistory);
    } else {
      // 发送登录失败响应
      socket.emit('login result', {
        success: false,
        message: '用户名或密码错误'
      });
    }
  });

  // 处理注册请求（预留接口）
  socket.on('register', (data) => {
    const { username, password } = data;
    const newUser = userDB.addUser(username, password);

    if (newUser) {
      socket.emit('register result', {
        success: true,
        message: '注册成功，请登录'
      });
    } else {
      socket.emit('register result', {
        success: false,
        message: '用户名已存在'
      });
    }
  });

  // 处理身份验证请求
  socket.on('authenticate', (data) => {
    const { token } = data;
    const session = userSessions.get(token);

    if (session) {
      // 检查会话是否过期
      if (Date.now() - session.createdAt > SESSION_EXPIRY_TIME) {
        userSessions.delete(token);
        socket.emit('authenticate result', {
          success: false,
          message: '会话已过期，请重新登录'
        });
        return;
      }

      // 查找用户
      const user = userDB.findUserByUsername(session.username);

      if (user) {
        // 检查用户是否已在其他地方登录
        for (const [socketId, u] of authenticatedUsers.entries()) {
          if (u.id === user.id && socketId !== socket.id) {
            // 通知旧连接已被挤下线
            io.to(socketId).emit('kicked', { message: '您的账号在其他地方登录' });
            // 移除旧连接
            authenticatedUsers.delete(socketId);
            break;
          }
        }

        // 更新认证信息
        currentUser = user;
        authenticatedUsers.set(socket.id, user);

        console.log(`用户 ${user.username} 通过令牌认证`);

        socket.emit('authenticate result', {
          success: true,
          username: user.username
        });

        // 发送聊天历史
        socket.emit('chat history', chatHistory);
      } else {
        socket.emit('authenticate result', {
          success: false,
          message: '用户不存在'
        });
      }
    } else {
      socket.emit('authenticate result', {
        success: false,
        message: '无效的令牌'
      });
    }
  });

  // 处理新消息
  socket.on('chat message', (msg) => {
    // 检查用户是否已登录
    if (!currentUser) {
      socket.emit('error message', { message: '请先登录' });
      return;
    }

    const messageWithId = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
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

    // 如果是已登录用户
      if (currentUser) {
        authenticatedUsers.delete(socket.id);
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