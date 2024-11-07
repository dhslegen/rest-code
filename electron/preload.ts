import { ipcRenderer, contextBridge, shell } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, basename, dirname } from 'path'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
  showOpenDialog: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('showOpenDialog', options),
  readFile: (filePath: string) => readFileSync(filePath, 'utf-8'),
  writeFile: (filePath: string, content: string) => writeFileSync(filePath, content, 'utf-8'),
  exists: (filePath: string) => existsSync(filePath),
  batchRename: (renameOperations: { oldPath: string; newPath: string }[]) => ipcRenderer.invoke('batch-rename', renameOperations),
  getAllFiles: (dir: string): string[] => {
    const files: string[] = []
    const readDir = (currentPath: string) => {
      const items = readdirSync(currentPath)
      items.forEach(item => {
        const itemPath = join(currentPath, item)
        const stats = statSync(itemPath)
        if (stats.isDirectory()) {
          readDir(itemPath)
        } else {
          files.push(itemPath)
        }
      })
    }
    readDir(dir)
    return files
  },
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
})
