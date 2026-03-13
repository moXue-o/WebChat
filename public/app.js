// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const fileSelectButton = document.getElementById('file-select-button');

// 存储当前用户信息
let currentUser = null;

// 生成随机用户名
function generateRandomUsername() {
  // 常见英文名字列表
  const firstNames = ['John', 'Emma', 'Michael', 'Olivia', 'William', 'Ava', 'James', 'Sophia', 'Robert', 'Isabella', 'David', 'Charlotte', 'Joseph', 'Mia', 'Thomas', 'Amelia', 'Charles', 'Harper', 'George', 'Evelyn'];
  // 常见英文姓氏列表
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${randomFirstName} ${randomLastName}`;
}

// 初始化用户
function initUser() {
  // 尝试从本地存储获取用户名，如果没有则生成新的
  let username = localStorage.getItem('username');
  if (!username) {
    username = generateRandomUsername();
    localStorage.setItem('username', username);
  }
  currentUser = { username: username };
  console.log('当前用户:', currentUser);
  
  // 向服务器发送用户信息
  socket.emit('user join', { username: username });
}

// 确保DOM加载完成后初始化用户
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUser);
} else {
  initUser();
}

// 处理用户加入结果
socket.on('user join result', (result) => {
  if (result.success) {
    console.log('用户加入成功');
  } else {
    console.log('用户加入失败:', result.message);
  }
});

// 发送消息函数
function sendMessage() {
  const text = messageInput.value.trim();
  const files = fileInput.files;
  
  if (text || files.length > 0) {
    if (files.length > 0) {
      // 处理文件上传
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const fileData = e.target.result;
          socket.emit('chat message', {
            text: text,
            file: {
              name: file.name,
              type: file.type,
              data: fileData
            }
          });
        };
        
        reader.readAsDataURL(file);
      }
    } else {
      // 只发送文本消息
      socket.emit('chat message', {
        text: text
      });
    }
    
    messageInput.value = '';
    fileInput.value = '';
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

// 处理切换按钮点击
let isExpanded = false;
fileSelectButton.addEventListener('click', () => {
  isExpanded = !isExpanded;
  
  // 切换按钮样式和动画
  fileSelectButton.classList.toggle('active');
  
  // 显示/隐藏额外功能
  const additionalFeatures = document.querySelector('.additional-features');
  if (isExpanded) {
    // 先显示元素，再添加active类触发动画
    additionalFeatures.style.display = 'flex';
    // 强制重排
    void additionalFeatures.offsetWidth;
    additionalFeatures.classList.add('active');
  } else {
    // 先移除active类触发动画，动画结束后隐藏元素
    additionalFeatures.classList.remove('active');
    setTimeout(() => {
      additionalFeatures.style.display = 'none';
    }, 100); // 与CSS过渡时间一致
  }
  
  // 调整输入栏位置
  const messageInputContainer = document.querySelector('.message-input-container');
  messageInputContainer.classList.toggle('expanded');
});

// 处理文件上传按钮点击
const fileUploadButton = document.querySelector('.file-upload-button');
fileUploadButton.addEventListener('click', () => {
  fileInput.click();
});

// 处理文件输入变化
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    console.log(`选择了 ${files.length} 个文件`);
    // 选择文件后自动收起额外功能
    isExpanded = false;
    fileSelectButton.classList.remove('active');
    const additionalFeatures = document.querySelector('.additional-features');
    additionalFeatures.classList.remove('active');
    setTimeout(() => {
      additionalFeatures.style.display = 'none';
    }, 100); // 与CSS过渡时间一致
    document.querySelector('.message-input-container').classList.remove('expanded');
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
});

// 处理被踢下线
socket.on('kicked', (data) => {
  alert(data.message);
  // 生成新的用户名
  const newUsername = generateRandomUsername();
  localStorage.setItem('username', newUsername);
  currentUser = { username: newUsername };
  socket.emit('user join', { username: newUsername });
});

// 将消息添加到聊天窗口
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  
  // 判断消息是否来自当前用户
  const isCurrentUser = currentUser && message.username === currentUser.username;
  messageElement.classList.add(isCurrentUser ? 'user' : 'other');

  let messageContent = `
    <div class="username">${message.username}</div>
    <div class="text">${escapeHtml(message.text || '')}</div>
  `;

  // 如果消息包含文件
  if (message.file) {
    const file = message.file;
    if (file.type.startsWith('image/')) {
      // 图片文件显示预览
      messageContent += `
        <div class="file-attachment">
          <img src="${file.data}" alt="${escapeHtml(file.name)}" class="file-preview">
          <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
        </div>
      `;
    } else {
      // 其他文件显示下载链接
      messageContent += `
        <div class="file-attachment">
          <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
        </div>
      `;
    }
  }

  messageContent += `
    <div class="timestamp">${message.timestamp}</div>
  `;

  messageElement.innerHTML = messageContent;
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

// 隐藏退出登录按钮
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.style.display = 'none';
  }
}

// 确保DOM加载完成后隐藏退出登录按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogoutButton);
} else {
  setupLogoutButton();
}

