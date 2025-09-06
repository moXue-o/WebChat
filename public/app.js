// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username');

// 存储当前用户的用户名
let username = localStorage.getItem('username') || '';
usernameInput.value = username;

// 保存用户名到本地存储
usernameInput.addEventListener('change', () => {
  username = usernameInput.value.trim() || '匿名用户';
  localStorage.setItem('username', username);
});

// 发送消息函数
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit('chat message', {
      username: username || '匿名用户',
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

// 将消息添加到聊天窗口
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  
  // 判断消息是否来自当前用户
  const isCurrentUser = message.userId === socket.id;
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

// 关于图标和模态框交互逻辑
function setupAboutModal() {
  const aboutIcon = document.getElementById('about-icon');
  const aboutModal = document.getElementById('about-modal');
  const closeBtn = document.getElementById('close-btn');
  const appVersion = document.getElementById('app-version');
  const updateDate = document.getElementById('update-date');
  const onlineCount = document.getElementById('online-count');

  // 定义版本号
  const version = { major: 1, minor: 0, patch: 1 };
  appVersion.textContent = `${version.major}.${version.minor}.${version.patch}`;

  // 设置更新日期为当前日期
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  updateDate.textContent = formattedDate;

  // 初始化在线人数
  onlineCount.textContent = '0';

  // 监听在线人数更新
  socket.on('online count', (count) => {
    onlineCount.textContent = count;
  });

  // 显示模态框
  aboutIcon.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止点击图标时触发窗口点击事件
    aboutModal.style.display = 'block';
  });

  // 关闭模态框
  closeBtn.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });

  // 点击模态框外部（包括主页面）关闭
  window.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });

  // 防止点击模态框内容时关闭
  aboutModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

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

// 确保DOM加载完成后再初始化关于模态框
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAboutModal);
} else {
  setupAboutModal();
}