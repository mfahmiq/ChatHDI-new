const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;


function startBackend() {
  const isPackaged = app.isPackaged;
  let backendPath;
  let backendArgs = [];

  if (isPackaged) {
    // In production, use the bundled executable
    backendPath = path.join(process.resourcesPath, 'server.exe');
  } else {
    // In development, we assume backend is running separately or we could spawn python
    // For now, let's skip spawning in dev to avoid conflicts if user runs it manually
    console.log('Development mode: Skipping backend spawn. Please run server.py manually.');
    return;
  }

  console.log(`Spawning backend from: ${backendPath}`);

  backendProcess = spawn(backendPath, backendArgs, {
    stdio: 'inherit',
    windowsHide: true
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
  });
}



function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'default',
    backgroundColor: '#212121',
    show: false
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'build/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  // Handle Popups for Google Auth
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isAuthUrl = url.includes('google.com') || url.includes('supabase.co') || url.includes('supabase.in');

    if (isAuthUrl) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          width: 600,
          height: 700,
          nodeIntegration: false,
          contextIsolation: true
        }
      };
    }

    // Default: Open in external browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercept Main Window Navigation (Crucial for Supabase Redirects)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isAuthUrl = url.includes('google.com') || url.includes('supabase.co') || url.includes('supabase.in');
    if (isAuthUrl) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Monitor popup windows for Auth Callback
  mainWindow.webContents.on('did-create-window', (childWindow) => {
    const checkUrl = (urlStr) => {
      console.log('Popup URL:', urlStr); // Debugging

      // Case 1: Implicit Flow (access_token in hash)
      if (urlStr.includes('#access_token=') || urlStr.includes('&access_token=')) {
        const hashIndex = urlStr.indexOf('#');
        if (hashIndex !== -1) {
          const hash = urlStr.substring(hashIndex);
          mainWindow.webContents.executeJavaScript(`
                window.location.hash = '${hash}';
                window.location.reload();
             `).catch(e => console.log('Injection failed', e));
        }
        childWindow.close();
      }

      // Case 2: PKCE Flow (code in query param) - Likely what is happening
      else if (urlStr.includes('?code=') || urlStr.includes('&code=')) {
        console.log("Auth Code found in popup URL");

        // Extract the code parameter safely
        try {
          const urlObj = new URL(urlStr);
          const code = urlObj.searchParams.get('code');
          if (code) {
            // Inject code into Main Window and Reload
            // We preserve valid file:// path but add search param
            mainWindow.webContents.executeJavaScript(`
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set('code', '${code}');
                    window.location.href = currentUrl.toString();
                 `).catch(e => console.log('Injection failed', e));

            childWindow.close();
          }
        } catch (e) {
          console.error("Error parsing auth code url", e);
        }
      }
    };

    childWindow.webContents.on('will-navigate', (e, url) => checkUrl(url));
    childWindow.webContents.on('did-redirect-navigation', (e, url) => checkUrl(url));
    // Also check current url just in case
    checkUrl(childWindow.webContents.getURL());
  });

  // Create menu
  const template = [
    {
      label: 'ChatHDI',
      submenu: [
        { label: 'About ChatHDI', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/chathdi/docs')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/chathdi/issues')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (backendProcess) {
      backendProcess.kill();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
