const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const UPLOAD_FOLDER = __dirname + "/uploads/";

const QUICk_OPTION = document.getElementById('quickOpt');
const CUSTOM_OPTION = document.getElementById('customOpt');
const OPTION_DIV = document.getElementById('optionDiv');
const UPLOAD_BUTTON = document.getElementById('select-file');


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
        fs.rename(fileToTile, dest + scene.id + ".JPG", (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

const initData = async (path) => {
    let scenes = await main.readSences();
    let files = await main.loadImageFiles();
    let prom = scenes.map(scene => initCurrentScene(scene, files));
    await Promise.all(prom);
    main.cleanUploadFolder();
    await main.createDataFile(scenes);
    let win = remote.getCurrentWindow();
    main.openWindow("panoramicView");

}

OPTION_DIV.addEventListener('change', function () {
    if (QUICk_OPTION.checked == true || CUSTOM_OPTION.checked == true) {
        UPLOAD_BUTTON.disabled = false;
    }
});


UPLOAD_BUTTON.addEventListener('click', async function () {
    dialog.showOpenDialog(async function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            let path = fileNames[0];
            await main.extractZipFile(path);
            await main.moveInfoToDataFolder();
            if (QUICk_OPTION.checked == true) {
                await initData(path);
            } else {
                let win = remote.getCurrentWindow();
                main.openWindow("customOptonPage");
            }
        }
    });
}, false);

function filterImages(files, scene, minTime) {
    let fileToTile = "";
    let fileToRemocw = "";
    for (let i = 0; i < files.length; i++) {
        let filePath = UPLOAD_FOLDER + files[i];
        let stats = fs.statSync(filePath);
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