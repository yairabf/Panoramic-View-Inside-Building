const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");

const QUICk_OPTION = document.getElementById('quickOpt');
const CUSTOM_OPTION = document.getElementById('customOpt');
const OPTION_DIV = document.getElementById('optionDiv');
const UPLOAD_BUTTON = document.getElementById('select-file');


const initCurrentScene = async (scene, files) => {
    let minTime = scene.end - scene.start;
    let fileToTile = "";
    for (let i = 0; i < files.length; i++) {
        let currentMin = await main.imageCreationTime(files[i], scene);
        if (currentMin < minTime && currentMin != null) {
            minTime = currentMin;
            fileToTile = files[i]
        }
    }
    await main.moveFileToTileFolder(scene, fileToTile ,files);
}

const initData = async (path) => {
    let scenes = await main.readSences();
    let files = await main.loadImageFiles();
    let prom = scenes.map(scene => initCurrentScene(scene, files));
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

