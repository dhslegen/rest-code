"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  showSaveDialog: () => electron.ipcRenderer.invoke("showSaveDialog"),
  showOpenDialog: () => electron.ipcRenderer.invoke("showOpenDialog"),
  showMessageBox: (options) => electron.ipcRenderer.invoke("showMessageBox", options)
});
