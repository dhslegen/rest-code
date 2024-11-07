import { app, ipcMain, dialog, BrowserWindow, Menu } from 'electron';
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

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
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      allowRunningInsecureContent: false,
      nodeIntegration: true
    }
  });

  Menu.setApplicationMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

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

ipcMain.handle('batch-rename', async (_event, renameOperations: { oldPath: string; newPath: string }[]) => {
  try {
    for (const { oldPath, newPath } of renameOperations) {
      fs.renameSync(oldPath, newPath);
    }
    return { success: true };
  } catch (error: any) {
    console.error('批量重命名错误:', error);
    return { success: false, error: (error as Error).message };
  }
});

