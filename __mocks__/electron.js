const path = require('path');

class BrowserWindowMock {
  constructor(options) {
    this.options = options;
    this.webContents = {
      openDevTools: jest.fn(),
    };
  }

  loadFile(filePath) {
    this.loadedFile = filePath;
    return Promise.resolve();
  }
}

const ipcMainMock = {
  on: jest.fn(),
};

const appMock = {
  whenReady: jest.fn().mockResolvedValue(),
  on: jest.fn(),
};

const shellMock = {
  openPath: jest.fn(),
};

module.exports = {
  BrowserWindow: BrowserWindowMock,
  ipcMain: ipcMainMock,
  app: appMock,
  shell: shellMock,
};
