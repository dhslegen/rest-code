/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface CommonAPI {
  showSaveDialog(): Promise<string | undefined>
  showOpenDialog(options?: Electron.OpenDialogOptions): Promise<{ filePaths: string[]; canceled: boolean }>
  readFile(filePath: string): string
  writeFile(filePath: string, content: string): void
  exists(filePath: string): boolean
  renameFile(oldPath: string, newPath: string): void
  getAllFiles(dir: string): string[]
  appPath(): Promise<string>
  join(...paths: string[]): string
  basename(path: string): string
  dirname(path: string): string
  mkdir(path: string): void
  openExternal(url: string): void
  onOpenFile(callback: (event: Electron.IpcRendererEvent, filePath: string) => void): void
}

interface Window {
  api: CommonAPI
}