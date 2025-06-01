import { app, ipcMain, dialog, BrowserWindow, Menu, shell } from 'electron';
import path from "path";
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import https from 'https';

// 重建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 应用版本和更新相关
const CURRENT_VERSION = '1.1.1';
const UPDATE_CHECK_URL = 'https://api.github.com/repos/dhslegen/rest-code/releases/latest';

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
    height: 925,
    frame: false, // 无边框窗口
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined, // macOS隐藏标题栏但保留交通灯
    trafficLightPosition: process.platform === 'darwin' ? { x: 20, y: 15 } : undefined, // macOS交通灯位置，稍微
    transparent: false, // 保持不透明，避免性能问题
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined, // macOS毛玻璃效果
    backgroundMaterial: process.platform === 'win32' ? 'acrylic' : undefined, // Windows亚克力效果
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      allowRunningInsecureContent: false,
      nodeIntegration: true,
      // 禁用开发者工具
      devTools: true
    }
  });

  Menu.setApplicationMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 禁用开发环境自动打开开发者工具
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 禁用快捷键支持开发者工具
  // win.webContents.on('before-input-event', (event, input) => {
  //   // F12 或 Cmd/Ctrl+Shift+I 打开开发者工具
  //   if (input.key === 'F12' || 
  //       (input.control && input.shift && input.key === 'I') ||
  //       (input.meta && input.alt && input.key === 'I')) {
  //     win!.webContents.toggleDevTools();
  //   }
  // });

  win.on("closed", () => {
    win = null;
  });

  // 窗口加载完成后进行自动更新检查
  win.webContents.once('did-finish-load', () => {
    // 延迟3秒后检查更新，避免影响启动速度
    setTimeout(() => {
      autoCheckForUpdates();
    }, 3000);
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
        // console.error('解密失败:', error);
        resolve({ success: false, error: error.message });
        return;
      }
      // console.log('解密成功');
      resolve({ success: true });
    });
  });
});

// 更新检查功能
function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion?: string; downloadUrl?: string; releaseNotes?: string }> {
  return new Promise((resolve) => {
    console.log('开始检查更新，URL:', UPDATE_CHECK_URL);
    const req = https.get(UPDATE_CHECK_URL, { headers: { 'User-Agent': 'Rest-Code' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          console.log('获取到发布信息:', release.tag_name, release.name);
          const latestVersion = release.tag_name?.replace('v', '') || release.name;
          const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;
          
          console.log(`当前版本: ${CURRENT_VERSION}, 最新版本: ${latestVersion}, 需要更新: ${hasUpdate}`);
          
          resolve({
            hasUpdate,
            latestVersion,
            downloadUrl: release.html_url,
            releaseNotes: release.body
          });
        } catch (error) {
          console.error('解析更新信息失败:', error);
          resolve({ hasUpdate: false });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('检查更新失败:', error);
      resolve({ hasUpdate: false });
    });
    
    req.setTimeout(10000, () => {
      console.log('更新检查超时');
      req.destroy();
      resolve({ hasUpdate: false });
    });
  });
}

function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
}

// 自动检查更新（应用启动时）
async function autoCheckForUpdates() {
  try {
    const updateInfo = await checkForUpdates();
    if (updateInfo.hasUpdate && win) {
      // 添加当前版本号到更新信息中
      const updateDataWithCurrentVersion = {
        ...updateInfo,
        currentVersion: CURRENT_VERSION
      };
      win.webContents.send('update-available', updateDataWithCurrentVersion);
    }
  } catch (error) {
    // 静默失败，不显示错误
    console.error('检查更新失败:', error);
  }
}

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

// 更新检查IPC处理器
ipcMain.handle('check-for-updates', async () => {
  return await checkForUpdates();
});

ipcMain.handle('get-current-version', () => {
  return CURRENT_VERSION;
});

ipcMain.handle('open-download-page', (_, url: string) => {
  shell.openExternal(url);
});