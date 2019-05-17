const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');
const path = require('path');


const UPLOAD_FOLDER = __dirname + "/uploads/";
const TILES_FOLDER = __dirname + "/tiles/";

const scenesListsContainer = document.getElementById('scenesListsContainer');
const modal = document.getElementById('myModal');
const modalImg = document.getElementById("img01");
const closePreviewModalBtn = document.getElementById("closePreviewModal");
const mainPageButton = document.getElementById('backToMainPageCustom');


const onbeforeunload = () => {
    let choice = dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Are you sure you want to quit?'
        });
    if (choice === 0) {
        main.openWindow("mainWindow");
    }
    else {
        return;
    }
};

const missingInputDialog = () => {
    let choice = dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
            type: 'question',
            buttons: ['Cancel'],
            title: 'Confirm',
            message: 'Please choose a picture for every point view!'
        });
    return;
};

// When the user clicks on <span> (x), close the modal
closePreviewModalBtn.onclick = function () {
    modal.style.display = "none";
};


mainPageButton.addEventListener('click', function () {
    onbeforeunload();
});

const removeModalChilds = () => {
    while (modalImg.firstElementChild != null) {
        modalImg.removeChild(modalImg.firstElementChild);
    }
}

const createImageForPreviewModal = (path) => {
    let panoElement = document.querySelector('#img01');
    let viewerOpts = {
        controls: {
            mouseViewMode: "drag"
        }
    };
    let viewer = new Marzipano.Viewer(panoElement, viewerOpts);

    let source = Marzipano.ImageUrlSource.fromString(path);
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
    return panoElement;
}

const addImagesToUl = async (scene, files) => {
    let ulObj = document.createElement('div');
    ulObj.classList.add('sceneUl');
    for (let i = 0; i < files.length; i++) {
        let time = await main.imageCreationTime(files[i], scene);
        if (time != null) {
            let liObj = document.createElement('div');
            liObj.classList.add('sceneImage');
            let image = document.createElement('img');
            image.classList.add('img-check');
            image.src = main.getUploadFolder() + files[i];
            debugger;
            // Get the image and insert it inside the modal - use its "alt" text as a caption
            image.addEventListener('click', function () {
                modal.style.display = "block";
                // modal.removeChild(modalImg);  
                // modalImg.removeChild         
                removeModalChilds();
                modalImg.src = createImageForPreviewModal(this.src);

            });
            let checkbox = document.createElement('input');
            checkbox.setAttribute('type', "radio");
            checkbox.setAttribute('name', "imgChose" + scene.id);
            checkbox.setAttribute('value', main.UPLOAD_FOLDER + files[i]);
            checkbox.classList.add('imgChose');
            liObj.appendChild(image);
            liObj.appendChild(checkbox);

            ulObj.appendChild(liObj);
        }
    }
    return ulObj;
}

const getCheckedRadio = (selectElements) => {
    for (let i = 0; i < selectElements.length; i++) {
        if (selectElements[i].checked === true) {
            return selectElements[i];
        }
    }
    return false;
}

const validateForm = (scenes) => {
    let form = document.forms[0];
    for (let i = 0; i < scenes.length; i++) {
        let name = "imgChose" + scenes[i].id;
        let selectElements = form.querySelectorAll('input[name="' + name + '"]');
        if (getCheckedRadio(selectElements) === false) {
            return false;
        }
    }
    return true;
}

const initData = async (scenes) => {
    scenes.forEach(async (scene) => {
        let form = document.forms[0];
        let name = "imgChose" + scene.id;
        let selectElements = form.querySelectorAll('input[name="' + name + '"]');
        let checkedElement = getCheckedRadio(selectElements);
        let selectedValue = checkedElement.value;
        await main.moveFileToTileFolder(scene, selectedValue);
    });
}
const createUlForScene = (scene, files, index) => {
    return new Promise(async (resolve) => {
        let divObj = document.createElement('div');
        divObj.classList.add('sceneOptinsContainer');
        let sceneH3 = document.createElement('h2');
        sceneH3.classList.add('sceneH3');
        sceneH3.innerHTML = "Scene number: " + (index + 1);
        divObj.appendChild(sceneH3);
        let ulObj = await addImagesToUl(scene, files);

        divObj.appendChild(ulObj);
        scenesListsContainer.appendChild(divObj);
        resolve();
    });
}

const createForm = async (scenes, files) => {
    debugger;
    let prom = scenes.map((scene, index) => createUlForScene(scene, files, index));
    await Promise.all(prom);
    let submitBtn = document.createElement('button');
    submitBtn.setAttribute('id', 'submitBtn');
    submitBtn.innerHTML = "Create View"
    submitBtn.addEventListener('click', async function () {
        if (validateForm(scenes)) {
            await initData(scenes);
            await main.createDataFile(scenes);
            await main.cleanUploadFolder();
            main.openWindow("panoramicView");
        } else {
            missingInputDialog();
        }
    });
    scenesListsContainer.appendChild(submitBtn);
}

const createGallery = async () => {
    debugger;
    let scenes = await main.readSences();
    let files = await main.loadImageFiles();
    createForm(scenes, files);
    // let prom = scenes.map(initCurrentScene => (files));
    // await Promise.all(prom);
}

createGallery();