const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const rimraf = require("rimraf");

const AdmZip = require('adm-zip');
const {app, BrowserWindow} = electron;

const PAGES_FOLDER = __dirname;
const UPLOAD_FOLDER = PAGES_FOLDER + "/uploads/";
const DATA_FOLDER = PAGES_FOLDER + "/data/";
const STYLE_FOLDER = PAGES_FOLDER + "/style/data/";
const TILE_FOLDER = PAGES_FOLDER + "/tiles/";


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

exports.getUploadFolder = () => {
    return UPLOAD_FOLDER;
}

exports.cleanUploadFolder = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOAD_FOLDER, (err, deleteFiles) => {
            console.log('====================================');
            console.log(`${deleteFiles} was deleted`);
            console.log('====================================');
            if(deleteFiles.indexOf('__MACOSX') > -1){
                rimraf(UPLOAD_FOLDER+'__MACOSX', (err) => { 
                    if(err){
                        reject();
                    }
                    for (let i = 0; i < deleteFiles.length; i++) {
                        fs.unlink(UPLOAD_FOLDER + deleteFiles[i], (err)=>{
                            if(err){
                                reject();
                            }
                        });
                    }
                    resolve();
                });
            }
            for (let i = 0; i < deleteFiles.length; i++) {
                fs.unlink(UPLOAD_FOLDER + deleteFiles[i], (err)=>{
                    if(err){
                        reject();
                    }
                });
            }
            resolve();
        });
    });
}
exports.moveFileToTileFolder = (scene, fileToTile, files) => {
    return new Promise((resolve, reject) => {
        index = files.indexOf(fileToTile);
        if (index > -1) {
            files.splice(index, 1);
        }
        fs.rename(UPLOAD_FOLDER + fileToTile, TILE_FOLDER + scene.id + ".JPG", (err) => {
            if (err) {
                return reject(err);
            }
            resolve(); 
        });
    });
}

exports.imageCreationTime = (file, scene) => {
    return new Promise((resolve, reject) => {
        let filePath = UPLOAD_FOLDER + file;
        fs.stat(filePath, (err ,stats) => {
            if (err) {
                return reject(err);
            }
            if (stats['mtimeMs'] >= scene.start && stats['mtimeMs'] <= scene.end) {
                resolve(scene.end - stats['mtimeMs']);
            } else {
                resolve(null);
            }
        });
    });
}

exports.moveInfoToDataFolder = () => {
    return new Promise((resolve, reject) => {
        fs.rename(UPLOAD_FOLDER + "info.json", DATA_FOLDER + "info.json", (err) => {
            if (err) {
                return reject(err)
            }
            fs.rename(UPLOAD_FOLDER + "map.JPEG", STYLE_FOLDER + "map.JPEG", (err) => {
                if (err) {
                    return reject(err)
                }
                resolve()
            });
        });

    });
}

exports.loadImageFiles = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOAD_FOLDER, (err, files) => {
            if (err) {
                return reject(err);
            }
            resolve(files)
        });
    });
}

exports.readSences = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(DATA_FOLDER + "info.json", (err, rawdata) => {
            if (err) {
                return reject(err)
            }
            let scenes = JSON.parse(rawdata)['scenes'];
            console.log(scenes);
            resolve(scenes)
        });

    });
}

exports.extractZipFile = (path) => {
    return new Promise((resolve, reject) => {
        var zip = new AdmZip(path);
        zip.extractAllTo(/*target path*/UPLOAD_FOLDER, /*overwrite*/true);
        if(zip === null){
            reject();
        }
        else{
            resolve();
        }
        // extract(path, { dir: UPLOAD_FOLDER }, (err) => {
        //     if (err) {
        //         reject(err);
        //     }
        //     resolve();
        //     // extraction is complete. make sure to handle the err
        // });
    });
}

exports.createDataFile = (scenes)=>{
    return new Promise((resolve, reject) => {
        let APP_DATA = {
            "scenes": [],
            "name": "Project Title",
            "settings": {
                "mouseViewMode": "drag",
                "autorotateEnabled": true,
                "fullscreenButton": false,
                "viewControlButtons": false
            }
        };
    
        for (let i = 0; i < scenes.length; i++) {
            let dataScene = {
                "index": scenes[i].id + "",
                "id": scenes[i].id + "",
                "y": scenes[i].y + "px",
                "x": scenes[i].x + "px",
                "name": scenes[i].id + "",
                "faceSize": 1448,
                "linkHotspots": scenes[i].links
            };
            APP_DATA.scenes.push(dataScene);
        }
        fs.writeFile(DATA_FOLDER + "data.js", "var APP_DATA = " + JSON.stringify(APP_DATA), (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}