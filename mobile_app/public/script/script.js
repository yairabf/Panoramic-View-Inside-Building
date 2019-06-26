// x = document.createElement('div');
// x.style.setProperty('left',"30px");
// x.style.setProperty('top',"30px");
// x.style.setProperty("background-color",'red')
// x.
// my_div = document.getElementById("mapDiv");
// my_div.appendChild(x);

let data = window.APP_DATA;
let numOfScenes = [];
let imageMap = document.getElementById('mapDiv');
var queue = [];

for (let i = 1; i <= data.scenes.length; i++) {
    let aScene = document.createElement('button');
    // aScene.setAttribute("class", "scene");
    aScene.setAttribute("id", "mapbtn" + i);
    aScene.setAttribute("data-targetsize","0.08");
    aScene.setAttribute("data-duration","600");
   
    aScene.classList.add("mapBtn", "scene","zoomTarget");
    aScene.style.top = (parseInt(data.scenes[i - 1].y.slice(0,data.scenes[i - 1].y.length-2)) * 2) + "px";
    aScene.style.left = (parseInt(data.scenes[i - 1].x.slice(0,data.scenes[i - 1].x.length-2)) * 2) + "px";
    imageMap.appendChild(aScene);
}

const hasMoreScene = () => {
    return numOfScenes.length > 0;
};


for (let i = 0; i < data.scenes.length; i++) {
    numOfScenes.push(i);
}
let currentIndexScene = numOfScenes.shift();

let startBtn = document.getElementById('startBtn')
let endBtn = document.getElementById('endBtn')
endBtn.setAttribute("hidden", true);
let skipBtn = document.getElementById('skipBtn')
let currentSceneName = document.getElementById("currentSceneName");
currentSceneName.innerText = "Current PointView: " + data.scenes[currentIndexScene].id;

startBtn.addEventListener("click", () => {
    var d = new Date();
    let startTime = d.getTime();
    console.log("start time: " + startTime);
    data.scenes[currentIndexScene].start = startTime;
    endBtn.hidden = false;
    startBtn.hidden = true;
    skipBtn.disabled = true;
});

endBtn.addEventListener("click", () => {
    var d = new Date();
    let endTime = d.getTime();
    console.log("end time: " + endTime);
    data.scenes[currentIndexScene].end = endTime;
    endBtn.hidden = true;
    startBtn.hidden = false;
    if (hasMoreScene() == true) {
        currentIndexScene = numOfScenes.shift();
        currentSceneName.innerText = "Current PointView: " + data.scenes[currentIndexScene].id;
        skipBtn.disabled = false;
        document.getElementById('mapbtn'+data.scenes[currentIndexScene].id).click()
    } else {
        alert("finished!!");
        endBtn.hidden = true;
        startBtn.hidden = true;
        skipBtn.hidden = true;
        currentSceneName.innerText = "Finish to capture all points"
    }
});

skipBtn.addEventListener("click", () => {

    console.log("pointview number: " + (currentIndexScene + 1) + " been skipped");
    let temp = currentIndexScene;
    currentIndexScene = numOfScenes.shift();
    numOfScenes.push(temp);
    currentSceneName.innerText = "Current PointView: " + data.scenes[currentIndexScene].id;
    document.getElementById('mapbtn'+data.scenes[currentIndexScene].id).click()
});



// $(document).ready(function() {
//     $("#mapbtn1").click(function(evt) {
//         $(this).zoomTo({targetsize:0.75, duration:600});
//         evt.stopPropagation();
//     });
// });

let dateTile = document.getElementById('mapbtn1');
let datePosition = dateTile.getBoundingClientRect();

var event = new MouseEvent('mousedown', {
    'view': window,
    'bubbles': true,
    'cancelable': true,
    'screenX': datePosition.left,
    'screenY': datePosition.top
});
$( document ).ready(function() {
    document.getElementById('mapbtn1').click()
});


