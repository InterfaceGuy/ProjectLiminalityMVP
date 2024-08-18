const { BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

jest.mock('electron');
jest.mock('fs-extra');
jest.mock('child_process');

const { createWindow, VAULT_PATH } = require('../index');

describe('Electron app functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createWindow function creates a new BrowserWindow', () => {
    const mockLoadFile = jest.fn();
    BrowserWindow.mockImplementation(() => ({
      loadFile: mockLoadFile,
    }));

    const win = createWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    expect(mockLoadFile).toHaveBeenCalledWith(expect.stringContaining('src/index.html'));
  });

  test('create-dreamnode event handler creates a new dreamnode', () => {
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
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    ipcMain.emit('open-in-finder', mockEvent, repoName);

    expect(shell.openPath).toHaveBeenCalledWith(path.join(VAULT_PATH, repoName));
  });

  test('open-in-gitfox event handler opens the repository in GitFox', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    ipcMain.emit('open-in-gitfox', mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `cd "${VAULT_PATH}" && gitfox "${repoName}"`,
      expect.any(Function)
    );
  });
});
