// 简单的用户数据库
const bcrypt = require('bcrypt');

// 存储用户的数组（实际应用中应使用数据库）
let users = [];

// 预设一个管理员用户（密码: admin123）
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
users.push({
  id: 1,
  username: 'admin',
  password: adminPasswordHash,
  createdAt: new Date()
});

// 预设两个内测用户
const testUser1PasswordHash = bcrypt.hashSync('test123', 10);
users.push({
  id: 2,
  username: 'tester1',
  password: testUser1PasswordHash,
  createdAt: new Date()
});

const testUser2PasswordHash = bcrypt.hashSync('test456', 10);
users.push({
  id: 3,
  username: 'tester2',
  password: testUser2PasswordHash,
  createdAt: new Date()
});

// 查找用户 by 用户名
function findUserByUsername(username) {
  return users.find(user => user.username === username);
}

// 查找用户 by ID
function findUserById(id) {
  return users.find(user => user.id === id);
}

// 添加新用户（注册）
function addUser(username, password) {
  // 检查用户是否已存在
  if (findUserByUsername(username)) {
    return null;
  }

  // 哈希密码
  const passwordHash = bcrypt.hashSync(password, 10);

  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username,
    password: passwordHash,
    createdAt: new Date()
  };

  // 添加到用户数组
  users.push(newUser);

  return newUser;
}

// 验证用户密码
function verifyUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) {
    return null;
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  return isMatch ? user : null;
}

// 导出函数
module.exports = {
  findUserByUsername,
  findUserById,
  addUser,
  verifyUser
};

// 测试函数（仅用于开发环境）
function testUsers() {
  console.log('=== 用户数据库测试 ===');
  console.log('当前用户:', users);

  // 测试验证
  const testUser = verifyUser('admin', 'admin123');
  console.log('验证结果:', testUser ? '成功' : '失败');

  // 测试注册
  const newUser = addUser('test', 'test123');
  console.log('注册新用户:', newUser);

  // 测试重复注册
  const duplicateUser = addUser('admin', 'admin123');
  console.log('重复注册:', duplicateUser);
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testUsers();
}