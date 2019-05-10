const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const rimraf = require("rimraf");

const UPLOAD_FOLDER = __dirname + "/uploads/";
const DATA_FOLDER = __dirname + "/data/";

const QUICk_OPTION = document.getElementById('quickOpt');
const CUSTOM_OPTION = document.getElementById('customOpt');
const OPTION_DIV = document.getElementById('optionDiv');
const UPLOAD_BUTTON = document.getElementById('select-file');


const createBackground = () => {
    let panoElement = document.querySelector('#pano');
    let viewerOpts = {
        controls: {
            mouseViewMode: "drag"
        }
    };
    let viewer = new Marzipano.Viewer(panoElement, viewerOpts);

    let source = Marzipano.ImageUrlSource.fromString("img/background.jpg");
    //  { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    let geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    let limiter = Marzipano.RectilinearView.limit.traditional(1448, 100 * Math.PI / 180, 120 * Math.PI / 180);
    let view = new Marzipano.RectilinearView(null, limiter);

    let scene = viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true,
    });


    // Set up autorotate, if enabled.
    let autorotate = Marzipano.autorotate({
        yawSpeed: 0.03,
        targetPitch: 0,
        targetFov: Math.PI / 2
    });
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
    scene.switchTo();
}



const extractZipFile = (path) => {
    return new Promise((resolve, reject) => {
        extract(path, { dir: UPLOAD_FOLDER }, (err) => {
            if (err) {
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
            if (err) {
                return reject(err)
            }
            fs.rename(UPLOAD_FOLDER + "map.JPEG", DATA_FOLDER + "map.JPEG", (err) => {
                if (err) {
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
            if (err) {
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
            if (err) {
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
        fs.rename(fileToTile, dest + scene.id + ".JPG", (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
const cleanUploadFolder = () => {
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
    let files = await loadImageFiles();
    let prom = scenes.map(initCurrentScene => (files));
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
        if (err) {
            reject(err);
        }
        let win = remote.getCurrentWindow();
        main.openWindow("marz");
    });
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
            if (QUICk_OPTION.checked == true) {
                await initData(path);
            } else {
                let win = remote.getCurrentWindow();
                main.openWindow("customOptonPage");
            }
        }
    });
}, false);

createBackground();

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