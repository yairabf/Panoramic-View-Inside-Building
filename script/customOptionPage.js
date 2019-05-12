const { dialog } = require('electron').remote;
const remote = require('electron').remote;
const main = remote.require("./main.js");
const fs = require('fs');


const UPLOAD_FOLDER = __dirname + "/uploads/";
const DATA_FOLDER = __dirname + "/data/";

const scenesListsContainer = document.getElementById('scenesListsContainer');
const modal = document.getElementById('myModal');
const modalImg = document.getElementById("img01");
const captionText = document.getElementById("caption");
const closePreviewModalBtn = document.getElementById("closePreviewModal");
const mainPageButton = document.getElementById('backToMainPage');
const submitImagesBtn = document.getElementById('submitImages');



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

// When the user clicks on <span> (x), close the modal
closePreviewModalBtn.onclick = function () {
    modal.style.display = "none";
};


mainPageButton.addEventListener('click', function () {
    onbeforeunload();
  });

submitImagesBtn.addEventListener('click', function () {

});
  
const removeModalChilds = () => {
    while(modalImg.firstElementChild != null){
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

// const QUICk_OPTION = document.getElementById('quickOpt');
// const CUSTOM_OPTION = document.getElementById('customOpt');
// const OPTION_DIV = document.getElementById('optionDiv');
// const UPLOAD_BUTTON = document.getElementById('select-file');
const addImagesToUl = (scene, files) => {
    debugger;
    let ulObj = document.createElement('div');
    ulObj.classList.add('sceneUl');
    for (let i = 0; i < files.length; i++) {
        let filePath = UPLOAD_FOLDER + files[i];
        let stats = fs.statSync(filePath);
        if (stats === null) {
            console("error");
        }
        if (stats['birthtimeMs'] >= scene.start && stats['birthtimeMs'] <= scene.end) {
            let liObj = document.createElement('div');
            liObj.classList.add('sceneImage');
            let image = document.createElement('img');
            image.src = filePath;

            // Get the image and insert it inside the modal - use its "alt" text as a caption
            image.addEventListener('click',function () {
                modal.style.display = "block";
                // modal.removeChild(modalImg);  
                // modalImg.removeChild         
                removeModalChilds();
                modalImg.src = createImageForPreviewModal(this.src);
                
            });
            let checkbox = document.createElement('input');
            checkbox.setAttribute('type',"radio");
            checkbox.setAttribute('name',"imgChose" + scene.id);
            checkbox.setAttribute('value',filePath);
            checkbox.classList.add('imgChose');
            liObj.appendChild(image);
            liObj.appendChild(checkbox);

            ulObj.appendChild(liObj);
        }
    }
    return ulObj;
}

const createUlForScene = (scenes, files) => {
    return new Promise((resolve, reject) => {
        scenes.forEach((element, index) => {
            let divObj = document.createElement('div');
            divObj.classList.add('sceneOptinsContainer');
            let sceneH3 = document.createElement('h2');
            sceneH3.classList.add('sceneH3');
            sceneH3.innerHTML = "Scene number: " + index;
            let ulObj = addImagesToUl(element, files);

            divObj.appendChild(sceneH3);
            divObj.appendChild(ulObj);
            scenesListsContainer.appendChild(divObj);
        });
    });
}

const filterImages = (files, scene) => {
    for (let i = 0; i < files.length; i++) {
        let filePath = UPLOAD_FOLDER + files[i];
        let stats = fs.statSync(filePath);
        if (stats === null) {
            console("error");
        }
        if (stats['birthtimeMs'] >= scene.start && stats['birthtimeMs'] <= scene.end) {

        }
    }
    return fileToTile;
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

const initCurrentScene = (scene, files) => {
    return new Promise((resolve, reject) => {
        let fileToTile = filterImages(files, scene);
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

const createGallery = async () => {
    debugger;
    let scenes = await readSences();
    let files = await loadImageFiles();
    createUlForScene(scenes, files);
    let prom = scenes.map(initCurrentScene => (files));
    await Promise.all(prom);
}

createGallery();