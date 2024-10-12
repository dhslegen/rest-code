/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface IpcRendererAPI {
  showSaveDialog(): Promise<string | undefined>
  showOpenDialog(): Promise<string | undefined>
}

interface Window {
  ipcRenderer: IpcRendererAPI
}
