const electron = require('electron');
const url = require('url');
const path = require('path');
const {app, BrowserWindow} = electron;

var mainWindow = null;
app.on('ready', function(){
    mainWindow = new BrowserWindow({});
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:'file',
        slashes: true
    }));
    mainWindow.maximize();
})

exports.openWindow = (page) => {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, page+'.html'),
        protocol:'file',
        slashes: true
    }));
    mainWindow.maximize();
    //let devtools = new BrowserWindow();
    //mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
    //mainWindow.webContents.openDevTools({ mode: 'detach' });
}