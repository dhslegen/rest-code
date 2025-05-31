import { ipcRenderer, contextBridge, shell } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename, dirname } from 'path'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
  showOpenDialog: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('showOpenDialog', options),
  readFile: (filePath: string) => readFileSync(filePath, 'utf-8'),
  writeFile: (filePath: string, content: string) => writeFileSync(filePath, content, 'utf-8'),
  exists: (filePath: string) => existsSync(filePath),
  appPath: () => ipcRenderer.invoke('appPath'),
  join: (...paths: string[]) => join(...paths),
  basename: (path: string) => basename(path),
  dirname: (path: string) => dirname(path),
  mkdir: (path: string) => {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
  },
  openExternal: (url: string) => shell.openExternal(url),
  onOpenFile: (callback: (event: Electron.IpcRendererEvent, filePath: string) => void) => {
    ipcRenderer.on('open-file', callback);
  },
  decryptFiles: (directory: string) => ipcRenderer.invoke('decrypt-files', directory),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  openDownloadPage: (url: string) => ipcRenderer.invoke('open-download-page', url),
  onUpdateAvailable: (callback: (updateData: any) => void) => {
    ipcRenderer.on('update-available', (_, updateData) => callback(updateData));
  },
})
