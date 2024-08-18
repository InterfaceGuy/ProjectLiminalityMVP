const path = require('path');
const { createWindow, VAULT_PATH } = require('../index');

jest.mock('electron');

describe('Main Process', () => {
  test('createWindow function', () => {
    const win = createWindow();
    expect(win).toBeDefined();
    expect(win.loadFile).toHaveBeenCalledWith(path.join(__dirname, '..', 'src', 'index.html'));
    expect(win.webContents.openDevTools).toHaveBeenCalled();
  });

  test('VAULT_PATH is defined', () => {
    expect(VAULT_PATH).toBeDefined();
    expect(typeof VAULT_PATH).toBe('string');
  });
});
