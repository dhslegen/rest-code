import { app, ipcMain, dialog, BrowserWindow, Menu } from 'electron';
import path from "path";
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

// 重建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow | null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 当第二个实例启动时
  app.on('second-instance', (_event, argv, _workingDirectory) => {
    // 当运行第二个实例时，聚焦到主窗口
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();

      // Windows 平台下，文件路径作为参数传递
      if (process.platform === 'win32' && argv.length >= 2) {
        const filePath = argv[argv.length - 1];
        if (filePath && filePath.endsWith('.rcs')) {
          win.webContents.send('open-file', filePath);
        }
      }
    }
  });

  // macOS 下处理 'open-file' 事件
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (win) {
      win.webContents.send('open-file', filePath);
    } else {
      // 如果窗口尚未创建，等待窗口创建后再发送事件
      app.whenReady().then(() => {
        createWindow();
        win!.webContents.once('did-finish-load', () => {
          win!.webContents.send('open-file', filePath);
        });
      });
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // 应用启动时，处理传入的文件路径（Windows 平台）
    if (process.platform === 'win32' && process.argv.length >= 2) {
      const filePath = process.argv[process.argv.length - 1];
      if (filePath && filePath.endsWith('.rcs')) {
        win!.webContents.once('did-finish-load', () => {
          win!.webContents.send('open-file', filePath);
        });
      }
    }
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1250,
    height: 870,
    frame: false, // 无边框窗口
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined, // macOS隐藏标题栏但保留交通灯
    trafficLightPosition: process.platform === 'darwin' ? { x: 20, y: 15 } : undefined, // macOS交通灯位置，稍微向上调整
    transparent: false, // 保持不透明，避免性能问题
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined, // macOS毛玻璃效果
    backgroundMaterial: process.platform === 'win32' ? 'acrylic' : undefined, // Windows亚克力效果
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      allowRunningInsecureContent: false,
      nodeIntegration: true,
      // 启用开发者工具
      devTools: true
    }
  });

  Menu.setApplicationMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 开发环境自动打开开发者工具
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 添加快捷键支持
  win.webContents.on('before-input-event', (event, input) => {
    // F12 或 Cmd/Ctrl+Shift+I 打开开发者工具
    if (input.key === 'F12' || 
        (input.control && input.shift && input.key === 'I') ||
        (input.meta && input.alt && input.key === 'I')) {
      win!.webContents.toggleDevTools();
    }
  });

  win.on("closed", () => {
    win = null;
  });
}

ipcMain.handle("showSaveDialog", async () => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: "Rcs Files", extensions: ["rcs"] }]
  });
  return filePath;
});

ipcMain.handle("showOpenDialog", async (_event, options) => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    ...options
  });
  return { filePaths, canceled };
});

ipcMain.handle('appPath', () => {
  return app.getAppPath();
});

ipcMain.handle('decrypt-files', async (_event, directory: string) => {
  return new Promise((resolve) => {
    let decryptExePath;
    if (app.isPackaged) {
      // 生产环境
      decryptExePath = path.join(process.resourcesPath, 'decrypt.exe');
    } else {
      // 开发环境
      decryptExePath = path.join(__dirname, '../decrypt/decrypt.exe');
    }
    execFile(decryptExePath, [directory], (error, _stdout) => {
      if (error) {
        console.error('解密失败:', error);
        resolve({ success: false, error: error.message });
        return;
      }
      console.log('解密成功');
      resolve({ success: true });
    });
  });
});

// 窗口控制IPC处理器
ipcMain.handle('minimize-window', () => {
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (win && !win.isDestroyed()) {
    win.close();
  }
});