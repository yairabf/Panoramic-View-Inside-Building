const createBackground = () => {
    let pano = document.querySelector('#pano');
    let viewerOpts = {
        controls: {
            mouseViewMode: "drag"
        }
    };
    let viewer = new Marzipano.Viewer(pano, viewerOpts);

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

createBackground();