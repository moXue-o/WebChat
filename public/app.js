// 连接到 Socket.IO 服务器
const socket = io();

// DOM 元素
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const fileInput = document.getElementById('file-input');
const fileSelectButton = document.getElementById('file-select-button');
const filePreviewContainer = document.getElementById('file-preview-container');

// 存储选中的文件
let selectedFiles = [];
// 防止重复发送消息的标志
let isSending = false;

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

// 初始化文件预览容器
function initFilePreview() {
  filePreviewContainer.style.display = 'none';
}

// 确保DOM加载完成后初始化用户和文件预览
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initUser();
    initFilePreview();
  });
} else {
  initUser();
  initFilePreview();
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
  // 防止重复发送
  if (isSending) {
    return;
  }
  
  const text = messageInput.value.trim();
  
  if (text || selectedFiles.length > 0) {
    if (selectedFiles.length > 0) {
      // 设置发送标志
      isSending = true;
      // 处理文件上传 - 收集所有文件数据
      const filesData = [];
      let filesRead = 0;
      
      if (selectedFiles.length === 0) {
        // 没有文件，直接发送文本消息
        socket.emit('chat message', {
          text: text
        });
        clearInputs();
        isSending = false;
        return;
      }
      
      selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const fileData = e.target.result;
          filesData.push({
            name: file.name,
            type: file.type,
            data: fileData
          });
          
          filesRead++;
          if (filesRead === selectedFiles.length) {
            // 所有文件都读取完成，发送消息
            console.log(`发送 ${filesData.length} 个文件`);
            socket.emit('chat message', {
              text: text,
              files: filesData
            });
            clearInputs();
            // 重置发送标志
            isSending = false;
          }
        };
        
        reader.onerror = function(error) {
          console.error('文件读取错误:', error);
          alert(`文件 ${file.name} 读取失败: ${error.message}`);
          filesRead++;
          if (filesRead === selectedFiles.length) {
            // 即使有错误，也发送其他文件
            console.log(`发送 ${filesData.length} 个文件`);
            socket.emit('chat message', {
              text: text,
              files: filesData
            });
            clearInputs();
            // 重置发送标志
            isSending = false;
          }
        };
        
        reader.readAsDataURL(file);
      });
    } else {
      // 只发送文本消息
      isSending = true;
      socket.emit('chat message', {
        text: text
      });
      clearInputs();
      isSending = false;
    }
  }
}

// 清空输入和文件预览
function clearInputs() {
  messageInput.value = '';
  selectedFiles = [];
  updateFilePreviews();
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
    
    // 保存当前文件数量，用于新文件的索引
    const currentCount = selectedFiles.length;
    
    // 添加新文件到数组并创建预览
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      selectedFiles.push(file);
      createFilePreview(file, currentCount + i);
    }
    
    // 显示预览容器
    if (selectedFiles.length > 0) {
      filePreviewContainer.style.display = 'flex';
    } else {
      filePreviewContainer.style.display = 'none';
    }
    
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

// 创建文件预览
function createFilePreview(file, index) {
  const fileItem = document.createElement('div');
  fileItem.className = 'preview-file-item';
  fileItem.dataset.index = index;
  
  // 文件图标
  const fileIcon = document.createElement('div');
  fileIcon.className = 'preview-file-icon';
  
  // 根据文件类型设置图标和样式
  const fileIconInfo = getFileIconInfo(file);
  if (fileIconInfo) {
    fileIcon.innerHTML = fileIconInfo.icon;
    fileIcon.classList.add(fileIconInfo.className);
  } else {
    // 如果getFileIconInfo返回null（如图片和视频文件），使用通用文件图标
    fileIcon.innerHTML = '<i class="fas fa-file"></i>';
    fileIcon.classList.add('file-icon-other');
  }
  
  // 文件信息
  const fileInfo = document.createElement('div');
  fileInfo.className = 'preview-file-info';
  
  const fileName = document.createElement('div');
  fileName.className = 'preview-file-name';
  fileName.textContent = file.name;
  
  const fileSize = document.createElement('div');
  fileSize.className = 'preview-file-size';
  fileSize.textContent = formatFileSize(file.size);
  
  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  
  // 移除文件按钮
  const removeButton = document.createElement('button');
  removeButton.className = 'remove-file-button';
  removeButton.textContent = '×';
  removeButton.addEventListener('click', () => {
    removeFile(index);
  });
  
  fileItem.appendChild(fileIcon);
  fileItem.appendChild(fileInfo);
  fileItem.appendChild(removeButton);
  
  filePreviewContainer.appendChild(fileItem);
}

// 移除文件
function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilePreviews();
}

// 更新文件预览
function updateFilePreviews() {
  filePreviewContainer.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    createFilePreview(file, index);
  });
  
  if (selectedFiles.length > 0) {
    filePreviewContainer.style.display = 'flex';
  } else {
    filePreviewContainer.style.display = 'none';
  }
  
  // 重置文件输入
  fileInput.value = '';
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 根据文件类型获取图标和样式类
function getFileIconInfo(file) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;
  
  // 图片文件 - 直接预览，不需要图标
  if (fileType.startsWith('image/') || 
      fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
      fileName.endsWith('.png') || fileName.endsWith('.gif') || 
      fileName.endsWith('.bmp') || fileName.endsWith('.svg') || 
      fileName.endsWith('.webp')) {
    return null; // 图片文件直接预览，不需要图标
  }
  
  // 视频文件 - 直接预览，不需要图标
  else if (fileType.startsWith('video/') || 
           fileName.endsWith('.mp4') || fileName.endsWith('.avi') || 
           fileName.endsWith('.mov') || fileName.endsWith('.wmv') || 
           fileName.endsWith('.flv') || fileName.endsWith('.mkv')) {
    return null; // 视频文件直接预览，不需要图标
  }
  
  // 音频文件
  else if (fileType.startsWith('audio/') || 
           fileName.endsWith('.mp3') || fileName.endsWith('.wav') || 
           fileName.endsWith('.ogg') || fileName.endsWith('.flac') || 
           fileName.endsWith('.m4a') || fileName.endsWith('.wma')) {
    return { 
      icon: '<i class="fas fa-file-audio"></i>', 
      className: 'file-icon-audio' 
    };
  }
  
  // 文本文件
  else if (fileType.includes('text') || 
           fileName.endsWith('.txt') || fileName.endsWith('.md') || 
           fileName.endsWith('.rtf') || fileName.endsWith('.csv')) {
    return { 
      icon: '<i class="fas fa-file-lines"></i>', 
      className: 'file-icon-text' 
    };
  }
  
  // PDF文件
  else if (fileName.endsWith('.pdf')) {
    return { 
      icon: '<i class="fas fa-file-pdf"></i>', 
      className: 'file-icon-pdf' 
    };
  }
  
  // Word文档
  else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return { 
      icon: '<i class="fas fa-file-word"></i>', 
      className: 'file-icon-doc' 
    };
  }
  
  // Excel表格
  else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return { 
      icon: '<i class="fas fa-file-excel"></i>', 
      className: 'file-icon-xls' 
    };
  }
  
  // PowerPoint演示文稿
  else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
    return { 
      icon: '<i class="fas fa-file-powerpoint"></i>', 
      className: 'file-icon-ppt' 
    };
  }
  
  // 压缩文件
  else if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || 
           fileName.endsWith('.7z') || fileName.endsWith('.tar') || 
           fileName.endsWith('.gz') || fileName.endsWith('.bz2')) {
    return { 
      icon: '<i class="fas fa-file-archive"></i>', 
      className: 'file-icon-zip' 
    };
  }
  
  // 代码文件
  else if (fileName.endsWith('.js') || fileName.endsWith('.ts') || 
           fileName.endsWith('.html') || fileName.endsWith('.css') || 
           fileName.endsWith('.php') || fileName.endsWith('.py') || 
           fileName.endsWith('.java') || fileName.endsWith('.c') || 
           fileName.endsWith('.cpp') || fileName.endsWith('.cs') || 
           fileName.endsWith('.go') || fileName.endsWith('.rb') || 
           fileName.endsWith('.swift') || fileName.endsWith('.kt')) {
    return { 
      icon: '<i class="fas fa-file-code"></i>', 
      className: 'file-icon-code' 
    };
  }
  
  // 可执行文件
  else if (fileName.endsWith('.exe') || fileName.endsWith('.msi') || 
           fileName.endsWith('.bat') || fileName.endsWith('.sh') ||
           fileName.endsWith('.iso')) {
    return { 
      icon: '<i class="fas fa-file"></i>', 
      className: 'file-icon-exe' 
    };
  }
  
  // 字体文件
  else if (fileName.endsWith('.ttf') || fileName.endsWith('.otf') || 
           fileName.endsWith('.woff') || fileName.endsWith('.woff2')) {
    return { 
      icon: '<i class="fas fa-file-font"></i>', 
      className: 'file-icon-font' 
    };
  }
  
  // 数据库文件
  else if (fileName.endsWith('.db') || fileName.endsWith('.sqlite') || 
           fileName.endsWith('.sql') || fileName.endsWith('.mdb')) {
    return { 
      icon: '<i class="fas fa-database"></i>', 
      className: 'file-icon-db' 
    };
  }
  
  // 其他文件
  else {
    return { 
      icon: '<i class="fas fa-file"></i>', 
      className: 'file-icon-other' 
    };
  }
}

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

  // 如果消息包含单个文件
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
      // 其他文件显示图标和下载链接
      const fileIconInfo = getFileIconInfo(file);
      if (fileIconInfo) {
        messageContent += `
          <div class="file-attachment" style="display: flex; align-items: center;">
            <span class="file-icon ${fileIconInfo.className}">${fileIconInfo.icon}</span>
            <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
          </div>
        `;
      } else {
        // 如果getFileIconInfo返回null（如图片和视频文件），直接显示下载链接
        messageContent += `
          <div class="file-attachment">
            <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
          </div>
        `;
      }
    }
  }
  
  // 如果消息包含多个文件
  else if (message.files && message.files.length > 0) {
    message.files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        // 图片文件显示预览
        messageContent += `
          <div class="file-attachment">
            <img src="${file.data}" alt="${escapeHtml(file.name)}" class="file-preview">
            <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
          </div>
        `;
      } else {
        // 其他文件显示图标和下载链接
        const fileIconInfo = getFileIconInfo(file);
        if (fileIconInfo) {
          messageContent += `
            <div class="file-attachment" style="display: flex; align-items: center;">
              <span class="file-icon ${fileIconInfo.className}">${fileIconInfo.icon}</span>
              <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
            </div>
          `;
        } else {
          // 如果getFileIconInfo返回null（如图片和视频文件），直接显示下载链接
          messageContent += `
            <div class="file-attachment">
              <a href="${file.data}" download="${escapeHtml(file.name)}" class="file-link">${escapeHtml(file.name)}</a>
            </div>
          `;
        }
      }
    });
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

