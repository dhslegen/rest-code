/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface IpcRendererAPI {
  showSaveDialog(): Promise<string | undefined>
  showOpenDialog(): Promise<{ filePaths: string[]; canceled: boolean }>
  readFile(filePath: string): Promise<string | null>
  saveFile(filePath: string, content: string): Promise<boolean>
}

interface Window {
  ipcRenderer: IpcRendererAPI
}