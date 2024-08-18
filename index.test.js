const { BrowserWindow, ipcMain, shell, app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

jest.mock('electron');
jest.mock('fs-extra');
jest.mock('child_process');

const VAULT_PATH = '/Users/davidrug/InterBrain';

describe('Electron app functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app.whenReady = jest.fn().mockResolvedValue();
  });

  test('createWindow function creates a new BrowserWindow', () => {
    jest.mock('../index', () => ({
      createWindow: jest.fn()
    }));
    createWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const mockWin = BrowserWindow.mock.instances[0];
    expect(mockWin.loadFile).toHaveBeenCalledWith(expect.stringContaining('src/index.html'));
  });

  test('create-dreamnode event handler creates a new dreamnode', () => {
    const { createWindow } = require('../index');
    createWindow();

    const mockEvent = { reply: jest.fn() };
    const options = {
      name: 'testNode',
      clone: false,
      type: 'idea'
    };

    fs.existsSync.mockReturnValue(false);

    ipcMain.emit('create-dreamnode', mockEvent, options);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(VAULT_PATH, 'testNode'));
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(VAULT_PATH, 'testNode', '.pl'),
      'type: idea'
    );
    expect(exec).toHaveBeenCalledWith(
      `git init "${path.join(VAULT_PATH, 'testNode')}"`,
      expect.any(Function)
    );
  });

  test('open-in-finder event handler opens the repository in Finder', () => {
    createWindow();

    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    ipcMain.emit('open-in-finder', mockEvent, repoName);

    expect(shell.openPath).toHaveBeenCalledWith(path.join(VAULT_PATH, repoName));
  });

  test('open-in-gitfox event handler opens the repository in GitFox', () => {
    const { createWindow } = require('./index');
    createWindow();

    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    ipcMain.emit('open-in-gitfox', mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `cd "${VAULT_PATH}" && gitfox "${repoName}"`,
      expect.any(Function)
    );
  });
});
