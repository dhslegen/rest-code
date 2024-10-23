import { ipcRenderer, contextBridge } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename, dirname } from 'path'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
  showOpenDialog: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('showOpenDialog', options),
  readFile: (filePath: string) => readFileSync(filePath, 'utf-8'),
  writeFile: (filePath: string, content: string) => writeFileSync(filePath, content, 'utf-8'),
  exists: (filePath: string) => existsSync(filePath),
  join: (...paths: string[]) => join(...paths),
  basename: (path: string) => basename(path),
  dirname: (path: string) => dirname(path),
  mkdir: (path: string) => {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
  }
})
