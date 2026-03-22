const fs = require('fs');
const path = require('path');

// 复制 _headers 文件到 out 目录
const sourceFile = path.join(__dirname, '..', 'public', '_headers');
const destFile = path.join(__dirname, '..', 'out', '_headers');

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ _headers 文件已复制到 out 目录');
} else {
  console.log('⚠️ public/_headers 文件不存在');
}
