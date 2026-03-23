const fs = require("fs");
const path = require("path");

// 复制 _headers 文件到 out 目录
const headersSource = path.join(__dirname, "..", "public", "_headers");
const headersDest = path.join(__dirname, "..", "out", "_headers");

if (fs.existsSync(headersSource)) {
  fs.copyFileSync(headersSource, headersDest);
  console.log("✅ _headers 文件已复制到 out 目录");
} else {
  console.log("⚠️ public/_headers 文件不存在");
}

// 复制 functions 目录到 out 目录（用于 EdgeOne Pages Functions）
const functionsSource = path.join(__dirname, "..", "functions");
const functionsDest = path.join(__dirname, "..", "out", "functions");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log("⚠️ functions 目录不存在");
    return;
  }

  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 读取源目录内容
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDir(srcPath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log("✅ functions 目录已复制到 out 目录");
}

copyDir(functionsSource, functionsDest);
