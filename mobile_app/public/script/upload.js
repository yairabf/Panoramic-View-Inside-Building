var form = document.getElementById('myForm');
form.addEventListener('submit', function(ev) {
    
    var myFile = document.getElementById('myFile').files[0];

    var oData = new FormData(form);

    var oReq = new XMLHttpRequest();
    oReq.open('POST', "/myAction", true);

    oReq.onload = function(oEvent) {
        if (oReq.status == 200) {
            window.location = oReq.responseURL;
        } else {
            console.log('status is: ' + oReq.status);
        }
    };

    oReq.send(oData);
    ev.preventDefault();

}, false);