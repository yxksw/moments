const fs = require('fs');
const path = require('path');

// 这个脚本在 SSG 模式下用于生成静态 JSON 文件
// 现在使用 SSR 模式，API 路由在运行时动态生成数据
// 所以此脚本不再需要处理 recent-moments.json

console.log('ℹ️ 使用 SSR 模式，API 路由动态生成数据，无需静态 JSON 生成');

// 如果需要，可以在这里添加其他构建后处理逻辑
