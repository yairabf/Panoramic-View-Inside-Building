const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const UPLOAD_FOLDER = __dirname + "/uploads/";
const DATA_FOLDER = __dirname + "/Data/";

const rimraf = require("rimraf");

const extractZipFile = (path) => {
    return new Promise((resolve, reject) => {
        extract(path, {dir: UPLOAD_FOLDER},(err) => {
            if(err){
                reject(err);
            }
            resolve();
            // extraction is complete. make sure to handle the err
           });
    });
}

const moveInfoToDataFolder = () => {
    return new Promise((resolve, reject) => {
        fs.rename(UPLOAD_FOLDER + "info.json", DATA_FOLDER + "info.json", (err) => {
            if(err) {
                return reject(err)
            }
            fs.rename(UPLOAD_FOLDER + "map.JPEG", DATA_FOLDER + "map.JPEG", (err) => {
                if(err) {
                    return reject(err)
                }
                resolve()
            });
        });
   
    });
}

const readSences = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(DATA_FOLDER + "info.json", (err, rawdata) => {
            if(err){
                return reject(err)
            }
            let scenes = JSON.parse(rawdata)['scenes'];
            console.log(scenes);
            resolve(scenes)
        });
   
    });
}

const loadImageFiles = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOAD_FOLDER, (err, files) => {
            if(err){
                return reject(err);
            }
            resolve(files)
        });
    });
}

const initCurrentScene = (scene, files) => {
    return new Promise((resolve, reject) => {
        let minTime = scene.end - scene.start;
        let dest = __dirname + "/tiles/";
        let fileToTile = filterImages(files, scene, minTime);
        let fileToRemove = path.basename(fileToTile)
        index = files.indexOf(fileToRemove);
        if (index > -1) {
            files.splice(index, 1);
        }
        fs.rename(fileToTile, dest + scene.id + ".JPG",( err) => {
            if(err) {
                return reject(err);
            }
            resolve();
        });
    });
}
const cleanUploadFolder = () =>{
    return new Promise((resolve, reject) => {
        fs.readdir(UPLOAD_FOLDER, (err, deleteFiles) => {
            console.log('====================================');
            console.log(`${deleteFiles} was deleted`);
            console.log('====================================');
            for (let i = 0; i < deleteFiles.length; i++) {
                fs.unlinkSync(UPLOAD_FOLDER + deleteFiles[i]);
            }
            resolve();
        });
    });
    
}
const initData = async (path) => {
    await extractZipFile(path);
    await moveInfoToDataFolder();
    let scenes = await readSences();
    let files  = await loadImageFiles();
    let prom  = scenes.map(initCurrentScene => (files));
    await Promise.all(prom);

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
            "name": scenes[i].id + "",
            "faceSize": 1448,
            "linkHotspots": scenes[i].links
        };
        APP_DATA.scenes.push(dataScene);
    }
   
    cleanUploadFolder();
    fs.writeFile(DATA_FOLDER + "data.js", "var APP_DATA = " + JSON.stringify(APP_DATA), (err) => {
        if(err){
            reject(err);
        }
        let win = remote.getCurrentWindow();
        main.openWindow("marz");
    });
}

document.getElementById('select-file').addEventListener('click', async function () {
    dialog.showOpenDialog(async function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            let path = fileNames[0];
            await initData(path);
        }
    });
}, false);

function filterImages(files, scene, minTime) {
    let fileToTile = "";
    let fileToRemocw = "";
    for (let i = 0; i < files.length; i++) {
        let filePath = UPLOAD_FOLDER + files[i];
        let stats = fs.statSync(filePath);
        console.log(stats);
        if (stats === null) {
            console("error");
        }
        if (stats['birthtimeMs'] >= scene.start && stats['birthtimeMs'] <= scene.end) {
            if (scene.end - stats['birthtimeMs'] <= minTime) {
                minTime = scene.end - stats['birthtimeMs'];
                fileToTile = filePath;
            }
        }
    }
    return fileToTile;
}