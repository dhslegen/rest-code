import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
  showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('saveFile', filePath, content),
})
