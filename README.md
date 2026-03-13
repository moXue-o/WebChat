# WebChat

## 项目简介

WebChat 是一个基于 Web 的局域网即时通讯应用，支持多用户实时聊天、消息同步、用户认证等功能。适合小团队内部沟通、局域网内快速交流或学习WebSocket技术使用。

## 功能特性

- 实时消息推送与接收（基于Socket.IO）
- 用户登录与身份认证
- 聊天消息历史记录（最多保存50条）
- 响应式界面，适配多终端（手机、平板、桌面）
- 用户被挤下线通知
- 会话管理与过期清理
- 密码加密存储

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript
- 后端：Node.js + Express
- 实时通信：Socket.IO
- 密码加密：bcrypt
- 用户存储：内存存储（开发环境）

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

### 预设用户
系统内置了三个测试用户：

| 用户名 | 密码 | 角色 |
|-------|------|------|
| admin | admin123 | 管理员 |
| tester1 | test123 | 测试用户 |
| tester2 | test456 | 测试用户 |

### 登录流程
1. 访问应用首页，系统会自动跳转到登录页面
2. 输入预设用户名和密码
3. 点击登录按钮进入聊天界面

### 聊天操作
1. 在消息输入框中输入文本
2. 点击"发送"按钮或按下Enter键发送消息
3. 查看聊天历史记录
4. 点击"退出登录"按钮退出系统

### 注册功能
系统支持用户注册，点击登录页面的"注册"链接即可进入注册页面。

## 项目结构

```
WebChat/
├── public/             # 前端静态文件
│   ├── app.js          # 聊天客户端逻辑
│   ├── login.html      # 登录页面
│   ├── login.js        # 登录逻辑
│   ├── register.html   # 注册页面
│   ├── register.js     # 注册逻辑
│   ├── index.html      # 聊天主页面
│   └── styles.css      # 样式文件
├── server.js           # 服务器主文件
├── users.js            # 用户管理模块
├── package.json        # 项目配置和依赖
└── README.md           # 项目说明文档
```

## 核心功能实现

### 实时通信
使用Socket.IO实现实时消息推送，支持多用户同时在线聊天。

### 用户认证
- 使用bcrypt对密码进行加密存储
- 生成唯一令牌进行会话管理
- 会话过期自动清理（24小时）

### 消息管理
- 消息历史记录最多保存50条
- 新用户登录时自动同步历史消息
- 消息包含发送者、内容和时间戳

## 安全特性

- 密码加密存储
- 会话令牌验证
- 防止XSS攻击（消息内容HTML转义）
- 用户重复登录挤下线机制

## 开发说明

### 环境要求
- Node.js 12.0+
- npm 6.0+

### 依赖包
- express: ^4.18.2
- socket.io: ^4.7.2
- bcrypt: ^6.0.0
- sqlite: ^5.1.1
- sql.js: ^1.13.0

### 启动开发服务器
```bash
npm start
```

## 注意事项

1. 本项目为开发环境示例，用户数据存储在内存中，重启服务器后数据会丢失
2. 生产环境部署时建议使用持久化数据库存储
3. 局域网部署时请确保防火墙允许3000端口访问

## License

本项目采用 MIT License，详情请见 LICENSE 文件。

## 联系作者

- GitHub: [moXue-o](https://github.com/moXue-o)
- Gitee: [moXue_o](https://gitee.com/moXue_o)
- Issues: 欢迎通过 [Issue](https://github.com/moXue-o/WebChat/issues) 提交反馈和建议
