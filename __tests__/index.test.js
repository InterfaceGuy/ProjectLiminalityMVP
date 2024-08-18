jest.mock('electron');
jest.mock('fs-extra');
jest.mock('child_process');

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const {
    createWindow,
    VAULT_PATH,
    handleCreateDreamnode,
    handleOpenInFinder,
    handleOpenInGitfox,
    handleOpenInKeynote,
    handleOpenInC4D,
    handleOpenInSublime
} = require('../index');

describe('Electron app functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createWindow function creates a new BrowserWindow', () => {
    const win = createWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    expect(win.loadFile).toHaveBeenCalledWith(expect.stringMatching(/src[/\\]index\.html$/));
    expect(win.webContents.openDevTools).toHaveBeenCalled();
  });

  test('VAULT_PATH is defined', () => {
    expect(VAULT_PATH).toBeDefined();
    expect(typeof VAULT_PATH).toBe('string');
  });

  test('create-dreamnode event handler creates a new dreamnode', () => {
    const mockEvent = { reply: jest.fn() };
    const options = {
      name: 'testNode',
      clone: false,
      type: 'idea'
    };

    fs.existsSync.mockReturnValue(false);

    handleCreateDreamnode(mockEvent, options);

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

  test('create-dreamnode event handler clones a repository', () => {
    const mockEvent = { reply: jest.fn() };
    const options = {
      name: 'testCloneNode',
      clone: true,
      repoUrl: 'https://github.com/test/repo.git',
      type: 'project'
    };

    fs.existsSync.mockReturnValue(false);

    handleCreateDreamnode(mockEvent, options);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(VAULT_PATH, 'testCloneNode'));
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(VAULT_PATH, 'testCloneNode', '.pl'),
      'type: project'
    );
    expect(exec).toHaveBeenCalledWith(
      `git clone https://github.com/test/repo.git "${path.join(VAULT_PATH, 'testCloneNode')}"`,
      expect.any(Function)
    );
  });

  test('open-in-finder event handler opens the repository in Finder', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    handleOpenInFinder(mockEvent, repoName);

    expect(shell.openPath).toHaveBeenCalledWith(path.join(VAULT_PATH, repoName));
  });

  test('open-in-gitfox event handler opens the repository in GitFox', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';

    handleOpenInGitfox(mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `cd "${VAULT_PATH}" && gitfox "${repoName}"`,
      expect.any(Function)
    );
  });

  test('open-in-keynote event handler opens the Keynote file', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';
    const keynoteFileName = 'testRepo.key';

    fs.readdirSync.mockReturnValue([keynoteFileName]);

    handleOpenInKeynote(mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `open "${path.join(VAULT_PATH, repoName, keynoteFileName)}"`,
      expect.any(Function)
    );
  });

  test('open-in-c4d event handler opens the Cinema 4D file', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';
    const c4dFileName = 'testRepo.c4d';

    fs.readdirSync.mockReturnValue([c4dFileName]);

    handleOpenInC4D(mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `open "${path.join(VAULT_PATH, repoName, c4dFileName)}"`,
      expect.any(Function)
    );
  });

  test('open-in-sublime event handler opens the Sublime Text project file', () => {
    const mockEvent = { reply: jest.fn() };
    const repoName = 'testRepo';
    const sublimeFileName = 'testRepo.sublime-project';

    fs.readdirSync.mockReturnValue([sublimeFileName]);

    handleOpenInSublime(mockEvent, repoName);

    expect(exec).toHaveBeenCalledWith(
      `open -a "Sublime Text" "${path.join(VAULT_PATH, repoName, sublimeFileName)}"`,
      expect.any(Function)
    );
  });
});
