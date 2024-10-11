/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface IpcRendererAPI {
  on(channel: string, listener: (event: import('electron').IpcRendererEvent, ...args: any[]) => void): void
  off(channel: string, listener: (...args: any[]) => void): void
  send(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
  showSaveDialog(): Promise<string | undefined>
}

interface Window {
  ipcRenderer: IpcRendererAPI
}
