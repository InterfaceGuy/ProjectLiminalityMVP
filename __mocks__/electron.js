const path = require('path');

const BrowserWindowMock = jest.fn().mockImplementation((options) => ({
  options,
  webContents: {
    openDevTools: jest.fn(),
  },
  loadFile: jest.fn().mockImplementation((filePath) => {
    this.loadedFile = filePath;
    return Promise.resolve();
  }),
}));

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
