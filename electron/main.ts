// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

// 主进程处理保存对话框事件
ipcMain.handle('showSaveDialog', async () => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'Ras Files', extensions: ['ras'] }],
  })
  return filePath
})
