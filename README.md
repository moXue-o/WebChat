# WebChat

## 项目简介

WebChat 是一个基于 Web 的局域网即时通讯应用，支持多用户实时聊天、消息同步、文件传输等功能。适合小团队内部沟通、局域网内快速交流或学习WebSocket技术使用。

## 功能特性

- 实时消息推送与接收（基于Socket.IO）
- 自动生成用户昵称（无需登录）
- 聊天消息历史记录（最多保存50条）
- 响应式界面，适配多终端（手机、平板、桌面）
- 文件传输功能，支持多文件同时发送
- 文件类型识别与图标显示
- 图片和视频文件预览
- 用户被挤下线通知

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript
- 后端：Node.js + Express
- 实时通信：Socket.IO
- 文件处理：FileReader API
- 图标库：Font Awesome

## 部署与安装

### 1. 克隆仓库
```bash
git clone https://github.com/moXue-o/WebChat.git
# 或
git clone https://gitee.com/moXue_o/WebChat.git
```

### 2. 安装依赖
```bash
cd WebChat
npm install
```

### 3. 启动服务
```bash
npm start
```

### 4. 访问应用
- 本地访问：http://localhost:3000
- 局域网访问：http://<服务器IP>:3000

## 使用说明

### 自动登录
- 首次访问应用时，系统会自动生成一个随机的英文用户名
- 用户名会保存在本地存储中，刷新页面后保持不变
- 若同一用户名在其他设备登录，旧设备会被挤下线

### 聊天操作
1. 在消息输入框中输入文本
2. 点击"发送"按钮或按下Enter键发送消息
3. 查看聊天历史记录

### 文件传输
1. 点击输入框左侧的"+"按钮打开功能抽屉
2. 点击文件上传按钮选择一个或多个文件
3. 选择的文件会在输入框上方显示预览
4. 点击发送按钮将文件发送到聊天中
5. 接收方可以点击文件链接下载文件
6. 图片和视频文件会直接显示预览

## 项目结构

```
WebChat/
├── public/             # 前端静态文件
│   ├── app.js          # 聊天客户端逻辑
│   ├── index.html      # 聊天主页面
│   └── styles.css      # 样式文件
├── server.js           # 服务器主文件
├── package.json        # 项目配置和依赖
├── LICENSE             # 许可证文件
└── README.md           # 项目说明文档
```

## 核心功能实现

### 实时通信
使用Socket.IO实现实时消息推送，支持多用户同时在线聊天。

### 消息管理
- 消息历史记录最多保存50条
- 新用户加入时自动同步历史消息
- 消息包含发送者、内容、时间戳和文件附件

### 文件传输
- 支持多文件同时选择和发送
- 使用FileReader API读取文件内容
- 图片和视频文件直接预览
- 其他文件类型显示对应图标

### 安全特性
- 防止XSS攻击（消息内容HTML转义）
- 用户重复登录挤下线机制
- 消息历史记录限制（最多50条）

## 开发说明

### 环境要求
- Node.js 12.0+
- npm 6.0+

### 依赖包
- express: ^4.18.2
- socket.io: ^4.7.2

### 启动开发服务器
```bash
npm start
```

## 注意事项

1. 本项目为开发环境示例，消息历史存储在内存中，重启服务器后数据会丢失
2. 生产环境部署时建议使用持久化数据库存储
3. 局域网部署时请确保防火墙允许3000端口访问
4. 文件传输大小限制为100MB（可在server.js中修改）

## License

本项目采用 MIT License，详情请见 LICENSE 文件。

## 联系作者

- GitHub: [moXue-o](https://github.com/moXue-o)
- Gitee: [moXue_o](https://gitee.com/moXue_o)
- Issues: 欢迎通过 [Issue](https://github.com/moXue-o/WebChat/issues) 提交反馈和建议