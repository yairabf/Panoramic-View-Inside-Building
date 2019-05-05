const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');
const admZip = require('adm-zip');
const extract = require('extract-zip');
var PropertiesReader = require('properties-reader');
const uploadFolder = __dirname + "/uploads/";
const dataFolder = __dirname + "/Data/";

const rimraf = require("rimraf");

document.getElementById('select-file').addEventListener('click', function () {
    dialog.showOpenDialog(function (fileNames) {
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            oldPath = fileNames[0];
            var zip = new admZip(oldPath);
            zip.extractAllTo(/*target path*/uploadFolder, /*overwrite*/true);
            try {
                fs.rmdirSync(uploadFolder + "__MACOSX");
            } catch (error) {
                console.log("no __MAXOSX folder");
            }
            fs.renameSync(uploadFolder + "info.json", dataFolder + "info.json");
            fs.renameSync(uploadFolder + "map.JPEG", dataFolder + "map.JPEG");
            let rawdata = fs.readFileSync(dataFolder + "info.json");
            let scenes = JSON.parse(rawdata)['scenes'];
            console.log(scenes);

            files = fs.readdirSync(uploadFolder);
            scenes.forEach(scene => {
                var minTime = scene.end - scene.start;
                var dest = __dirname + "/tiles/";
                let fileToTile = filterImages(files, scene, minTime);
                var fileToRemove = fileToTile.split('/').pop();
                index = files.indexOf(fileToRemove);
                if (index > -1) {
                    files.splice(index, 1);
                }
                fs.renameSync(fileToTile, dest + scene.id + ".JPG");
            });

            var APP_DATA = {
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
            var deleteFiles = fs.readdirSync(uploadFolder);
            for (let i = 0; i < deleteFiles.length; i++) {
                fs.unlinkSync(uploadFolder + deleteFiles[i]);
            }
            fs.writeFileSync(dataFolder + "data.js", "var APP_DATA = " + JSON.stringify(APP_DATA));
            var win = remote.getCurrentWindow();
            main.openWindow("marz");
        }
    });
}, false);

function filterImages(files, scene, minTime) {
    var fileToTile = "";
    var fileToRemocw = "";
    for (var i = 0; i < files.length; i++) {
        var filePath = uploadFolder + files[i];
        var stats = fs.statSync(filePath);
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