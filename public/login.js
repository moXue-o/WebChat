// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const registerLink = document.getElementById('register-link');

// 尝试使用本地存储中的用户名填充
const savedUsername = localStorage.getItem('username');
if (savedUsername) {
  usernameInput.value = savedUsername;
}

// 登录函数
function login() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert('请输入用户名和密码');
    return;
  }

  // 向服务器发送登录请求
  socket.emit('login', { username, password });
}

// 点击登录按钮
loginButton.addEventListener('click', login);

// 按下 Enter 键登录
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    login();
  }
});

// 注册链接（预留接口）
registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  alert('注册功能即将开放，敬请期待！');
  // 未来可以在这里实现注册逻辑
});

// 处理登录结果
socket.on('login result', (result) => {
  if (result.success) {
    // 登录成功，保存用户名和令牌并跳转到聊天页面
    localStorage.setItem('username', result.username);
    localStorage.setItem('authToken', result.authToken);
    window.location.href = '/';
  } else {
    // 登录失败
    alert(result.message || '登录失败，请检查用户名和密码');
  }
});

// 处理注册结果（预留接口）
socket.on('register result', (result) => {
  if (result.success) {
    alert('注册成功，请登录');
  } else {
    alert(result.message || '注册失败');
  }
});

// 页面加载时检查是否已登录
window.addEventListener('load', () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // 尝试使用令牌自动登录
    socket.emit('authenticate', { token });
  }
});

// 处理身份验证结果
socket.on('authenticate result', (result) => {
  if (result.success) {
    // 验证成功，跳转到聊天页面
    window.location.href = '/';
  } else {
    // 验证失败，清除无效令牌
    localStorage.removeItem('authToken');
  }
});