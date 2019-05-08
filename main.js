const electron = require('electron');
const url = require('url');
const path = require('path');
const {app, BrowserWindow} = electron;
const PAGES_FOLDER = __dirname;

var mainWindow = null;
app.on('ready', function(){
    mainWindow = new BrowserWindow({});
    mainWindow.loadURL(url.format({
        pathname: path.join(PAGES_FOLDER, 'mainWindow.html'),
        protocol:'file',
        slashes: true
    }));
    mainWindow.maximize();
})

exports.openWindow = (page) => {
    mainWindow.loadURL(url.format({
        pathname: path.join(PAGES_FOLDER, page+'.html'),
        protocol:'file',
        slashes: true
    }));
    mainWindow.maximize();
    //let devtools = new BrowserWindow();
    //mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
    //mainWindow.webContents.openDevTools({ mode: 'detach' });
}