// decrypt.js
const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

function renameFiles(directory) {
  const files = getAllFiles(directory);
  files.forEach((file) => {
    const newFilePath = file + '.json';
    fs.renameSync(file, newFilePath);
  });
  // 等待3秒
  setTimeout(() => {
    files.forEach((file) => {
      const newFilePath = file + '.json';
      fs.renameSync(newFilePath, file);
    });
  }, 3000);
}

// 获取命令行参数中的目录路径
const directory = process.argv[2];
if (!directory) {
  console.error('请提供需要处理的目录路径');
  process.exit(1);
}

renameFiles(directory);

