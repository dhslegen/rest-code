import { app, ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
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

ipcMain.handle("showOpenDialog", async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    filters: [{ name: "Ras Files", extensions: ["ras"] }],
    properties: ['openFile']
  });
  return { filePaths, canceled };
});

ipcMain.handle('readFile', async (_event, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data;
  } catch (error) {
    console.error('读取文件出错：', error);
    return null;
  }
});

ipcMain.handle('saveFile', async (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('保存文件出错：', error)
    return false
  }
})