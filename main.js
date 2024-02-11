const path = require('path');
const os = require('os');
const fs =  require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow ({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 700,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    //open dev tools if in development environment
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// create the about window
function createAboutWindow() {
    const aboutWindow = new BrowserWindow ({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

app.whenReady().then(() => {
    createMainWindow();

    //implementing the menu created 
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    //remove main window from memory on close
    mainWindow.on('closed', () => (mainWindow = null));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow()
        }
      })
});

// menu template (creating a custom menu instead of using provided default
// window or mac menu)

const menu = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow,
                },
            ],
        },
    ] : []),
    {
        role: 'fileMenu',
    }, 
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click: createAboutWindow,
        }]
    }] : []),
];

// respond to ipc resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'image-resizer');
    resizeImage(options);
});

// resize the image function
async function resizeImage({ imgPath, width, height, dest }) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        })

        // create filename (remain as the original filename)
        const filename = path.basename(imgPath);

        //create a  destination folder if it does not exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // write file to destination folder
        fs.writeFileSync(path.join(dest, filename), newPath);

        //SEND SUCCES TO RENDER
        mainWindow.webContents.send('image:done');

        // open destination folder after saving file into destination folder
        shell.openPath(dest);

    } catch (error) {
        console.error(error);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })