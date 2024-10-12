import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
  showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
  showMessageBox: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageBox', options),
})