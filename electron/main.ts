import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import path from "path";
import { fileURLToPath } from 'url';

// 重建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

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

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("closed", () => {
    win = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle("showSaveDialog", async () => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: "Ras Files", extensions: ["ras"] }]
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
  return app.getAppPath()
})
