// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const usernameInput = document.getElementById('register-username');
const passwordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('register-confirm-password');
const registerButton = document.getElementById('register-button');
const loginLink = document.getElementById('login-link');

// 注册函数
function register() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // 验证输入
  if (!username) {
    alert('请输入用户名');
    return;
  }

  if (!password) {
    alert('请输入密码');
    return;
  }

  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }

  if (password.length < 6) {
    alert('密码长度至少为6位');
    return;
  }

  // 向服务器发送注册请求
  socket.emit('register', { username, password });
}

// 点击注册按钮
registerButton.addEventListener('click', register);

// 按下 Enter 键注册
confirmPasswordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    register();
  }
});

// 登录链接
loginLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// 处理注册结果
socket.on('register result', (result) => {
  if (result.success) {
    alert('注册成功，请登录');
    window.location.href = 'login.html';
  } else {
    alert(result.message || '注册失败');
  }
});

// 处理错误消息
socket.on('error message', (data) => {
  alert(data.message || '发生错误');
});