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
  let Marzipano = window.Marzipano;
  //let bowser = window.bowser;
  //let screenfull = window.screenfull;
  let data = window.APP_DATA;

  // Grab elements from DOM.
  let panoElement = document.querySelector('#pano');
  let sceneNameElement = document.querySelector('#titleBar .sceneName');
  let sceneListElement = document.querySelector('#sceneList');
  let sceneElements = document.querySelectorAll('#sceneList .scene');
  let sceneListToggleElement = document.querySelector('#sceneListToggle');
  let autorotateToggleElement = document.querySelector('#autorotateToggle');
  let fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  let keyboardPlace = document.getElementById("keyboardPlace");
  let mapContainer = document.getElementById('mapContainer')
  let mapDiv = document.getElementById('mapDiv');
  let showHideText = document.getElementById('showHideText');
  let mapInstructions = document.getElementById('mapInstructions');
  let mainPageButton = document.getElementById('backToMainPage');
  let arrowDiv = document.getElementById('arrowDiv');

  console.log(data.scenes);
  for (let i = 1; i <= data.scenes.length; i++) {
    let sceneList = document.getElementById('scenes');
    let aScene = document.createElement('a');
    aScene.setAttribute("class", "scene");
    aScene.setAttribute("data-id", i);
    aScene.setAttribute("href", "#");
    let liScence = document.createElement('li');
    liScence.setAttribute("class", "text");
    liScence.innerHTML = i;
    aScene.appendChild(liScence);
    sceneList.appendChild(aScene);
  }

  console.log(data.scenes);
  for (let i = 1; i <= data.scenes.length; i++) {
    let aScene = document.createElement('button');
    // aScene.setAttribute("class", "scene");
    aScene.setAttribute("data-id", i);
    aScene.setAttribute("href", "#");
    aScene.classList.add("mapBtn", "scene");
    aScene.style.top = data.scenes[i - 1].y;
    aScene.style.left = data.scenes[i - 1].x;
    aScene.innerHTML = i;
    mapDiv.appendChild(aScene);
  }

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    let setMode = function () {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    let mql = matchMedia("(max-width: 500px), (max-height: 500px)");
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
  let viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  let viewer = new Marzipano.Viewer(panoElement, viewerOpts);
  let listOfLinkHotspots = [];
  data.scenes.forEach(function (scence) {
    listOfLinkHotspots.push(scence.linkHotspots);
  });


  let scenes = data.scenes.map(function (data) {
    let urlPrefix = "tiles/";

    let source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + data.id + ".JPG");
    //  { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    let geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
    let initialViewParameters = {
      "pitch": 0,
      "yaw": 4,
      "fov": 1.5707963267948966
    };
    let limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100 * Math.PI / 180, 120 * Math.PI / 180);
    let view = new Marzipano.RectilinearView(initialViewParameters, limiter);

    let scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true,
    });

    data.linkHotspots.forEach(function (hotspot) {
      let element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });
    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  let autorotate = Marzipano.autorotate({
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

  // Dynamic parameters for controls.
  let velocity = 0.7;
  let friction = 3;
  // DOM elements for view controls.
  let viewUpElement = document.querySelector('#viewUp');
  let viewDownElement = document.querySelector('#viewDown');
  let viewLeftElement = document.querySelector('#viewLeft');
  let viewRightElement = document.querySelector('#viewRight');

  let controls = viewer.controls();
  controls.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  controls.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  controls.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);

  // Set handler for scene switch.
  scenes.forEach(function (scene) {
    let listEl = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    listEl.addEventListener('click', function () {
      switchScene(scene);
    });
    let mapEl = document.querySelector('#mapDiv .scene[data-id="' + scene.data.id + '"]');
    mapEl.addEventListener('click', function () {
      switchScene(scene);
    });
  });

  mainPageButton.addEventListener('click', function () {
    onbeforeunload();
  });


  arrowDiv.addEventListener('click', function () {
    let arrow = document.getElementById('arrow');
    if (mapContainer.style.height == '60px' || mapContainer.style.height == '') {
      arrowDiv.style.backgroundColor = "rgba(58,68,84,0.8)";
      mapContainer.style.height = '500px';
      arrow.src = "img/down.png";
      arrow.style.maxHeight = "30px";
      arrow.style.maxWidth = "30px";
      showHideText.innerText = "HIDE MAP";
      showHideText.style.margin = "7px";
      mapInstructions.innerText = "Click on point to jump to that point view";
    } else {
      mapContainer.style.height = '60px';
      arrow.src = "img/up.png";
      arrow.style.maxHeight = "100%";
      arrow.style.maxWidth = "100%";
      arrow.style.marginLeft = "0%";
      showHideText.innerText = "SHOW\nMAP";
      showHideText.style.margin = "13px";
      arrowDiv.style.backgroundColor = "";
      mapInstructions.innerText = "";
    }
  }, false);
  arrowDiv.click();

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    let keyboardList = document.getElementById("keyboardList");
    if (keyboardList != null) {
      keyboardPlace.removeChild(keyboardList);
    }
    stopAutorotate();
    //scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    keyboardList = document.createElement("ul");
    listOfLinkHotspots[scene.data.index - 1].forEach((element, index) => {
      keyboardList.appendChild(createKeyboardElement(element, index));
    });

    keyboardList.setAttribute("id", "keyboardList");
    keyboardPlace.appendChild(keyboardList);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = "Current Scene " + sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (let i = 0; i < sceneElements.length; i++) {
      let el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    let wrapperLink = document.createElement('div');
    wrapperLink.classList.add('hotspot');
    wrapperLink.classList.add('link-hotspot');

    // Create image element.
    let icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    let transformProperties = ['-ms-transform', '-webkit-transform', 'transform'];
    for (let i = 0; i < transformProperties.length; i++) {
      let property = transformProperties[i];
      icon.style[property] = 'rotate(' + 0 + 'rad)';
    }

    // Add click event handler.
    wrapperLink.addEventListener('click', function () {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapperLink);

    // Create tooltip element.
    let tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapperLink.appendChild(icon);
    wrapperLink.appendChild(tooltip);

    return wrapperLink;
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
    let wrapper = document.createElement('li');
    //wrapper.setAttribute("role", "button;");

    // Create image element.
    let icon = document.createElement('button');

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
    let eventList1 = ['touchstart', 'touchmove', 'touchend', 'touchcancel',
      'wheel', 'mousewheel'];
    for (let i = 0; i < eventList1.length; i++) {
      element.addEventListener(eventList1[i], function (event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (let i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();

