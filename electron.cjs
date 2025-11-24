const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 1. 创建浏览器窗口
  const win = new BrowserWindow({
    width: 450,  // 设置成手机比例的宽度
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 允许在页面中使用 Node.js 能力(如读写文件)
    },
    autoHideMenuBar: true, // 隐藏菜单栏，更像APP
    icon: path.join(__dirname, 'public/favicon.ico') // 这里的图标你自己准备一个
  });

  // 2. 加载应用
  // 如果是开发环境，加载 localhost
  // 如果是打包后，加载本地文件
  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools(); // 如果你想调试，可以把这行注释解开
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
    win.webContents.openDevTools(); 
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});