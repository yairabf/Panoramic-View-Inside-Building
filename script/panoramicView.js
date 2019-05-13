/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
const remote = require('electron').remote;
const main = remote.require("./main.js");
const { dialog } = require('electron').remote;

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

(function () {
  var Marzipano = window.Marzipano;
  //var bowser = window.bowser;
  //var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var keyboardPlace = document.getElementById("keyboardPlace");
  var mapContainer = document.getElementById('mapContainer')
  var mapDiv = document.getElementById('mapDiv');
  var mapText = document.getElementById('mapText');
  var mainPageButton = document.getElementById('backToMainPage');
  var arrowDiv = document.getElementById('arrowDiv');

  console.log(data.scenes);
  for (let i = 1; i <= data.scenes.length; i++) {
    var sceneList = document.getElementById('scenes');
    var aScene = document.createElement('a');
    aScene.setAttribute("class", "scene");
    aScene.setAttribute("data-id", i);
    aScene.setAttribute("href", "#");
    var liScence = document.createElement('li');
    liScence.setAttribute("class", "text");
    liScence.innerHTML = i;
    aScene.appendChild(liScence);
    sceneList.appendChild(aScene);
  }

  console.log(data.scenes);
  for (let i = 1; i <= data.scenes.length; i++) {
    var aScene = document.createElement('button');
    // aScene.setAttribute("class", "scene");
    aScene.setAttribute("data-id", i);
    aScene.setAttribute("href", "#");
    aScene.classList.add("mapBtn");
    aScene.innerHTML = i;
    mapDiv.appendChild(aScene);
  }

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function () {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function () {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);
  var listOfLinkHotspots = [];
  data.scenes.forEach(function (scence) {
    listOfLinkHotspots.push(scence.linkHotspots);
  });

  var scenes = data.scenes.map(function (data) {
    var urlPrefix = "tiles/";
    // var source = Marzipano.ImageUrlSource.fromString(
    //   urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
    //   { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    // var geometry = new Marzipano.CubeGeometry(data.levels);

    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + data.id + ".JPG");
    //  { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100 * Math.PI / 180, 120 * Math.PI / 180);
    var view = new Marzipano.RectilinearView(null, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true,
    });


    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI / 2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);
  if (data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function () {
      screenfull.toggle();
    });
    screenfull.on('change', function () {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function (scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function () {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  mainPageButton.addEventListener('click', function () {
    onbeforeunload();
  });


  arrowDiv.addEventListener('click', function () {
    var arrow = document.getElementById('arrow');
    if (mapContainer.style.height == '60px' || mapContainer.style.height == '') {
      arrowDiv.style.backgroundColor = "rgba(58,68,84,0.8)";
      mapContainer.style.height = '500px';
      arrow.src = "img/down.png";
      arrow.style.maxHeight = "30px";
      arrow.style.maxWidth = "30px";
      arrow.style.marginLeft = "35%";
      mapText.innerText = "HIDE MAP";
      mapText.style.margin = "7px";
    } else {
      mapContainer.style.height = '60px';
      arrow.src = "img/up.png";
      arrow.style.maxHeight = "100%";
      arrow.style.maxWidth = "100%";
      arrow.style.marginLeft = "0%";
      mapText.innerText = "SHOW\nMAP";
      mapText.style.margin = "13px";
      arrowDiv.style.backgroundColor = "";
    }
  }, false);
  arrowDiv.click();

  var velocity = 0.7;
  var friction = 3;


  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    keyboardList = document.getElementById("keyboardList");
    if (keyboardList != null) {
      keyboardPlace.removeChild(keyboardList);
    }
    stopAutorotate();
    //scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    var keyboardList = document.createElement("ul");
    listOfLinkHotspots[scene.data.index-1].forEach((element, index) => {
      keyboardList.appendChild(createKeyboardElement(element, index));
    });

    keyboardList.setAttribute("id", "keyboardList");
    keyboardPlace.appendChild(keyboardList);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = "Current Scene " + sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createKeyboardElement(element, index) {
    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('li');
    //wrapper.setAttribute("role", "button;");

    // Create image element.
    var icon = document.createElement('button');

    icon.classList.add('keyboardItem');
    icon.classList.add('btn', 'btn-default', 'btn-circle', 'btn-lg');
    icon.innerText = element.target;
    // Add click event handler.
    wrapper.addEventListener('click', function () {
      switchScene(findSceneById(element.target));
    });

    wrapper.appendChild(icon);

    return wrapper;
  }


  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel',
      'wheel', 'mousewheel'];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function (event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();

