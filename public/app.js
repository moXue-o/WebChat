// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// 存储当前用户信息
let currentUser = null;

// 检查是否已登录
function checkLoginStatus() {
  const savedUsername = localStorage.getItem('username');
  const authToken = localStorage.getItem('authToken');
  
  console.log('检查登录状态:');
  console.log('用户名:', savedUsername);
  console.log('令牌:', authToken ? '存在' : '不存在');
  
  if (savedUsername && authToken) {
    // 有保存的用户名和令牌，尝试自动登录
    currentUser = { username: savedUsername };
    // 向服务器验证令牌
    console.log('尝试使用令牌验证');
    socket.emit('authenticate', { token: authToken });
  } else {
    // 如果没有保存的用户名或令牌，重定向到登录页面
    console.log('没有有效的登录信息，重定向到登录页面');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }
}

// 确保DOM加载完成后再检查登录状态
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkLoginStatus);
} else {
  checkLoginStatus();
}

// 处理身份验证结果
socket.on('authenticate result', (result) => {
  if (result.success) {
    // 验证成功
    console.log('身份验证成功');
    currentUser = { username: localStorage.getItem('username') };
  } else {
    // 验证失败，清除无效令牌并重定向到登录页面
    console.log('身份验证失败:', result.message);
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }
})

// 发送消息函数
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit('chat message', {
      text: text
    });
    messageInput.value = '';
  }
}

// 点击发送按钮发送消息
sendButton.addEventListener('click', sendMessage);

// 按下 Enter 键发送消息
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// 接收聊天历史
socket.on('chat history', (history) => {
  chatMessages.innerHTML = '';
  history.forEach(message => {
    appendMessage(message);
  });
  scrollToBottom();
});

// 接收新消息
socket.on('chat message', (message) => {
  appendMessage(message);
  scrollToBottom();
});

// 处理错误消息
socket.on('error message', (error) => {
  alert(error.message);
  if (error.message.includes('请先登录')) {
    window.location.href = '/login.html';
  }
});

// 处理被踢下线
socket.on('kicked', (data) => {
  alert(data.message);
  localStorage.removeItem('username');
  window.location.href = '/login.html';
});

// 将消息添加到聊天窗口
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  
  // 判断消息是否来自当前用户
  const isCurrentUser = currentUser && message.username === currentUser.username;
  messageElement.classList.add(isCurrentUser ? 'user' : 'other');

  messageElement.innerHTML = `
    <div class="username">${message.username}</div>
    <div class="text">${escapeHtml(message.text)}</div>
    <div class="timestamp">${message.timestamp}</div>
  `;

  chatMessages.appendChild(messageElement);
}

// 滚动到聊天窗口底部
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 防止 XSS 攻击，转义 HTML 特殊字符
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 动态调整界面大小
function adjustInterfaceSize() {
  // 获取窗口宽度和高度
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 根据窗口宽度设置基础单位
  let baseUnit;
  if (windowWidth < 576) {
    // 手机
    baseUnit = Math.max(14, Math.min(20, windowWidth / 30)) + 'px';
  } else if (windowWidth < 768) {
    // 平板
    baseUnit = Math.max(16, Math.min(22, windowWidth / 40)) + 'px';
  } else {
    // 桌面
    baseUnit = Math.max(18, Math.min(24, windowWidth / 50)) + 'px';
  }

  // 设置CSS变量
  document.documentElement.style.setProperty('--base-unit', baseUnit);
  document.documentElement.style.setProperty('--spacing-sm', 'calc(var(--base-unit) * 0.5)');
  document.documentElement.style.setProperty('--spacing-md', 'var(--base-unit)');
  document.documentElement.style.setProperty('--spacing-lg', 'calc(var(--base-unit) * 1.5)');
  document.documentElement.style.setProperty('--spacing-xl', 'calc(var(--base-unit) * 2)');

  // 调整聊天容器大小
  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer) {
    if (windowHeight < 480 && window.innerWidth > window.innerHeight) {
      // 横屏模式
      chatContainer.style.height = '95vh';
    } else {
      chatContainer.style.height = 'clamp(80vh, 90vh, 95vh)';
    }
  }
}

// 监听窗口加载和调整大小时调整界面
window.addEventListener('load', adjustInterfaceSize);
window.addEventListener('resize', adjustInterfaceSize);

// 初始调整
adjustInterfaceSize();

// 推送更新功能已移除

// 退出登录功能
function setupLogout() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      // 清除本地存储的用户信息
      localStorage.removeItem('username');
      localStorage.removeItem('authToken');
      // 断开Socket连接
      socket.disconnect();
      // 重定向到登录页面
      window.location.href = '/login.html';
    });
  }
}

// 确保DOM加载完成后设置退出登录功能
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogout);
} else {
  setupLogout();
}

// 设置角落信息
function setupCornerInfo() {
  const appVersion = document.getElementById('app-version');
  const updateDate = document.getElementById('update-date');

  // 定义版本号
  const version = { major: 2, minor: 0, patch: 0 };
  appVersion.textContent = `${version.major}.${version.minor}.${version.patch}`;
  console.log('当前版本: 2.0.0 - 增加了登录系统和用户数据库');

  // 设置更新日期为当前日期
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  updateDate.textContent = formattedDate;

  // 提供一个更新版本号的函数
  window.updateVersion = function(updateType = 'patch') {
    switch(updateType) {
      case 'major':
        version.major++;
        version.minor = 0;
        version.patch = 0;
        break;
      case 'minor':
        version.minor++;
        version.patch = 0;
        break;
      case 'patch':
      default:
        version.patch++;
    }
    appVersion.textContent = `${version.major}.${version.minor}.${version.patch}`;
    console.log(`版本已更新为: ${version.major}.${version.minor}.${version.patch}`);
    return `${version.major}.${version.minor}.${version.patch}`;
  };
}

// 确保DOM加载完成后再设置角落信息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCornerInfo);
} else {
  setupCornerInfo();
}