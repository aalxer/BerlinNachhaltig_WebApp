'use strict';

// Variables:
let locationsList = []
let markersList = []
let map
let sessionAsAdmin
const googleAPIKey = "AIzaSyC7aFw_UR1mQnDP7KdDVyk8_Nivu2Mz0cM"
const geocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="

// Events-Targets:
const loginForm = document.getElementById("login-form")
const loginBtn = document.getElementById("login-btn")
const logoutBtn = document.getElementById("logout-btn")
const addLocationBtn = document.getElementById("add-location-btn")
const backToHomepageBtn = document.getElementById("homepage-btn")
const addForm = document.getElementById("add-form")
const cancelAddLocationBtn = document.getElementById("cancel-location-add-btn")
const listUpdateBtn = document.getElementById("locations-list-update-btn")
const saveLocationUpdateBtn = document.getElementById("save-location-update-btn")
const cancelLocationUpdateBtn = document.getElementById("cancel-location-update-btn")
const usernameInput = document.getElementById("username-input")
const passwordInput = document.getElementById("password-input")
const addMessageDisplayText = document.getElementById("add-message");

//let updateButtonList = [];

// Events-Handlers:
loginForm.addEventListener("submit", login)
logoutBtn.addEventListener("click", logout)
addLocationBtn.addEventListener("click", switchToAddLocation)
backToHomepageBtn.addEventListener("click", backToHomePage)
cancelAddLocationBtn.addEventListener("click", backToHomePage)
addForm.addEventListener("submit",addLocation)
listUpdateBtn.addEventListener("click", toggleUpdateTable)
cancelLocationUpdateBtn.addEventListener("click",function (){displayToggle(["update-container","main-area"])})

// Events-Handling Functions:
function login(loginEvent) {

    // deactivate default submit:
    loginEvent.preventDefault()

    // Iteration the users-list:
    for (const user of getUsersAsObj()) {
        if (usernameInput.value === user.userName) {
            if (passwordInput.value === user.password) {
                // Reset the inputs values:
                document.getElementById("login-form").reset()
                // set welcome message:
                document.getElementById("welcome-user").textContent = user.userName
                // prepare the display for user:
                switch (user.admin) {
                    case true: {
                        loginAsAdmin();
                        // get locations:
                        getLocationsAsObj()
                        // Display the Locations:
                        generateLocationList()
                        // Display the Map
                        initMap()
                        return;
                    }
                    case false: {
                        loginAsUser();
                        // get locations:
                        getLocationsAsObj()
                        // Display the Locations:
                        generateLocationList()
                        // Display the Map
                        initMap()
                        return;
                    }
                }
            } else {
                alert("Wrong password !")
                return;
            }
        }
    }
    // if there is no match to the username:
    alert(usernameInput.value + " is not registered !")
}
/**
 * log out current user 
 */
function logout() {

    // ask to confirm the logout:
    let logoutConfirm = confirm("Do you wont to logout ?")
    if (logoutConfirm) {

        displayToggle(["main-area", "login-area", "header-options"])

        // clear admin controls:
        if (sessionAsAdmin) {
            sessionAsAdmin = false
            console.log("Session as admin: " + sessionAsAdmin)
            displayToggle(["locations-options-btns"])
        }

        // clear homepage:
        while (locationList.lastElementChild) {
            locationList.removeChild(locationList.lastElementChild);
        }
    }
}
/**
 * toggles add Location Elements
 */
function switchToAddLocation() {
    displayToggle(["main-area", "header-options", "add-location-page"])
}
/**
 * reset for add form and addform message 
 * enables main page elements
 */
function backToHomePage() {
    // reset all form inputs:
    document.getElementById("add-form").reset()
    document.getElementById("add-message").textContent = ""

    // back to homepage:
    displayToggle(["add-location-page", "main-area", "header-options"])
}
/**
 * reads the add Form  gets geocode for given address 
 * useses input if geocode service not available 
 * @param {*} addEvent 
 */
function addLocation(addEvent) {

    // deactivate default submit:
    addEvent.preventDefault()

    // clear message text:
    addMessageDisplayText.textContent = ""

    // get inputs values:
    let locationName = document.getElementById("new-location-name").value
    let streetName = document.getElementById("new-location-str-name").value
    let streetNr = document.getElementById("new-location-str-nr").value
    let postCode = document.getElementById("new-location-postcode").value
    let co2InT = document.getElementById("new-location-co2").value
    let description = document.getElementById("new-location-description").value
    let photos = document.getElementById("new-location-img").value

    // get geocoding:
    getGeocoding(streetName, streetNr, "Berlin", postCode, function (response) {
        // if we got a geocoding:
        if (response != null) {

            console.log("lat: " + response.results[0].geometry.location.lat)
            console.log("lng: " + response.results[0].geometry.location.lng)

            // Get inputs values:
            let newLocationToAdd = {
                "locationName": locationName,
                "streetName": streetName,
                "streetNumber": streetNr,
                "postcode": postCode,
                "c02InTons": co2InT,
                "description": description,
                // get lat and lang from the object:
                "latitude": response.results[0].geometry.location.lat,
                "longitude": response.results[0].geometry.location.lng,
                "photo": photos
            }
            // save the new location in list variable:
            locationsList.push(newLocationToAdd)

            formCheckandCleanup()// code from before moved to this method to be reusable 

        } else {
            // show failed message:
            let img = new Image()
            img.src = "./img/failed-icon.png"
            addMessageDisplayText.appendChild(img)
            addMessageDisplayText.append(" The address could not be resolved, try again")
        }
    })
}

/**
 * helperfunction for add Location 
 * updates Json file 
 * generates locationlist 
 * update map 
 */
function formCheckandCleanup() {


    // update JSON file:
    let updateResult = updateJsonFileLocations()

    if (updateResult) {
        // show success message:
        let img = new Image()
        img.src = "./img/ok-icon.png"
        addMessageDisplayText.appendChild(img)
        addMessageDisplayText.append(" has been added successfully ")

        // reset form inputs values:
        document.getElementById("add-form").reset()

        // update locations list:
        generateLocationList()

        // update map:
        refreshLocationsMarkers()
    } else {
        // show failed message:
        let img = new Image()
        img.src = "./img/failed-icon.png"
        addMessageDisplayText.appendChild(img)
        addMessageDisplayText.append(" add failed, try again")
    }

}


/**
 * wrapper for generateUpdateform 
 * creates update form for given element updateFormSafe at the end
 * @param {*} key name der Location die Manipuliert werden soll  
 */
function updateLocation(key) {
    console.log("uclicked:" + key.locationName)
    generateUpdateForm(key)
}
/**
 * gets values for the update process calls 
 * @param {*} elem element that shall be updatet 
 */
function generateUpdateForm(elem) {
    // initialize conts for imput field 
    const inputIds = [
        'updLocationName',
        'updStreetNum',
        'updStreetName',
        'updPostcode',
        'updC02InT',
        'updDescription',
        'updLatitude',
        'updLongitude',
        'updFile'];

    const inputElements = {};
        // get inputfields 
    inputIds.forEach(function (id) {
        inputElements[id] = document.getElementById(id);
    });


    elem.locationName;

    inputElements.updLocationName.value = elem.locationName
    inputElements.updStreetNum.value = elem.streetNumber
    inputElements.updStreetName.value = elem.streetName
    inputElements.updPostcode.value = elem.postcode
    inputElements.updC02InT.value = elem.c02InTons
    inputElements.updDescription.value = elem.description
    inputElements.updLatitude.value = elem.latitude
    inputElements.updLongitude.value = elem.longitude
    inputElements.updFile.value = elem.photo

    const safebtn = document.getElementById("save-location-update-btn")
    safebtn.addEventListener("click", function () { updateFormSafe(elem, inputElements),displayToggle(["update-container","main-area"]) })

}
/** 
 * takes form inputs and updates datastruktur 
*/
function updateFormSafe(oldData, inputElements) {
 
    let locationName = inputElements.updLocationName.value
    let streetName = inputElements.updStreetName.value
    let streetNr = inputElements.updStreetNum.value
    let postCode = inputElements.updPostcode.value
    let co2InT = inputElements.updC02InT.value
    let description = inputElements.updDescription.value
    let photos = inputElements.updFile.value
   
    getGeocoding(streetName, streetNr, "Berlin", postCode, function (response) {
        // if we got a geocoding:
        if (response != null) {

            // Get inputs values:
            let newLocationToAdd = {
                "locationName": locationName,
                "streetName": streetName,
                "streetNumber": streetNr,
                "postcode": postCode,
                "c02InTons": co2InT,
                "description": description,
                // get lat and lang from the object:
                "latitude": response.results[0].geometry.location.lat,
                "longitude": response.results[0].geometry.location.lng,
                "photo": photos
            }
            // save the new location in list variable:
            const index = locationsList.findIndex(e =>e.locationName==oldData.locationName);
            console.log("index"+index);
            locationsList[index]= newLocationToAdd;
            console.log(locationsList);

            formCheckandCleanup()
            

        } else {
            // show failed message:
            let img = new Image()
            img.src = "./img/failed-icon.png"
            addMessageDisplayText.appendChild(img)
            addMessageDisplayText.append(" The address could not be resolved, try again")
        }
    })
   
}
/**
 * deltes given Element 
 * resets scene 
 * @param {*} key Element to delete  
 */
function deleteLocation(key) {
  
    let deleteConfirm = confirm("Do you really want to remove " + key.locationName)
    if (deleteConfirm) {
        const index = locationsList.findIndex(elem => key.locationName == elem.locationName)
        locationsList.splice(index, 1)
        document.getElementById(key.locationName).remove()
        generateLocationList()
        refreshLocationsMarkers()
        generateUpdateTableBody()
    }
}

// Sub-Functions:
/**
 * toggles if given elements are displayed or not 
 * @param {*} elementIds elements that should be toggled 
 */
function displayToggle(elementIds) {

    // Iteration the elements as list:
    for (const elementId of elementIds) {
        // Toggle the class "none-display" for the current element:
        document.getElementById(elementId).classList.toggle("none-display")
    }
}

/**
 * sets session var to true if called 
 * displays admin view
 */
function loginAsAdmin() {

    // Change Display:
    displayToggle(["login-area","header-options","main-area", "locations-options-btns"])

    sessionAsAdmin = true
    console.log("session as admin login: " + sessionAsAdmin)
}
/**
 * sets view for user 
 */
function loginAsUser() {

    // Change Display:
    displayToggle(["login-area", "header-options", "main-area"])
    // Display the Locations:
    generateLocationList()
    // Display the Map
    initMap()
}
/**
 * 
 * @returns UserObject data
 */
function getUsersAsObj() {

    let request = new XMLHttpRequest();
    let usersList = []

    request.open("GET", "./json/user.json", false)  // false because we need the data bevor we check

    request.onreadystatechange = function () {
        // state of the XMLHttpRequest-Object (4 = done, date are ready to parse):
        if (request.readyState === 4 && request.status === 200) {
            let data = JSON.parse(request.responseText);
            console.log("json date are ready, there are " + data.length + " users");
            // save in variable as JS-Object:
            usersList = data;
        } else {
            console.log("error on loading jason file")
            console.log("request Status: " + request.status)
            console.log("requestReady status: " + request.readyState)
        }
    };

    request.send();

    // return data as JS-Object:
    return usersList
}
/**
 * syncronize locationList with location Data
 */
function getLocationsAsObj() {

    // get Data from JSON:
    let request = new XMLHttpRequest();
    request.open("GET", "./json/location.json", false);

    request.onreadystatechange = function () {
        // state of the XMLHttpRequest-Object (4 = done, date are ready to parse):
        if (request.readyState === 4 && request.status === 200) {
            let data = JSON.parse(request.responseText);
            console.log("json date are ready, there are " + data.length + " locations");
            // save in variable as JS-Object:
            locationsList = data;
        } else {
            console.log("error on loading jason file")
            console.log("request Status: " + request.status)
            console.log("requestReady status: " + request.readyState)
        }
    };

    request.send();
}
/**
 * updates Json file 
 * @returns 
 */
function updateJsonFileLocations() {
    // get the variable list as JS-Object:
    // TODO

    // convert to JSON:
    // TODO

    // update JSON file:
    // TODO

    // return true if update success or false:
    return true
}
/**
 * initialsiert map, erst nach ausblenden benutzen!!
 */
function initMap() {

    // map as singelton-object:
    if (typeof map === "undefined") {
        const mapInitOptions = {
            position: [52.520008, 13.404954],
            zoom: 10
        }

        // Map Obj:
        map = L.map('map-container');
        map.setView(mapInitOptions.position, mapInitOptions.zoom);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    }

    // Markers:
    refreshLocationsMarkers()
}

function refreshLocationsMarkers() {
    removeAllMarkers()

    // should be already called
    // getLocationsAsObj()

    // to test:
    console.log("locationsList length: " + locationsList.length)

    if (locationsList.length !== 0) {
        locationsList.forEach(location => {
            // Marker Object:
            let marker = L.marker([location.latitude, location.longitude]);
            marker.addTo(map);
            markersList.push(marker);
            // Add Location info in popup window:
            marker.bindPopup(location.locationName);
            // Callback Function:
            marker.on("click", () => {
                setLocationInfoContainer(location)
            })
        })
    }

    function removeAllMarkers() {
        markersList.forEach(marker => {
          map.removeLayer(marker);
        })
      }
}



/**
 * toggles UpdateTable Container
 */
function toggleUpdateTable() {

    generateUpdateTableBody()
    displayToggle(["update-container","main-area","update-form"])
    

}



/**
 * takes the locations const and generates the table body for the 
 * "overview-table"
 */
function generateUpdateTableBody() {
    const updateTable = document.getElementById("updateTable");

     while (updateTable.lastElementChild) {
        updateTable.removeChild(updateTable.lastElementChild);
    }
    
    locationsList.forEach( location => {

        updateTable.appendChild(generateUpdateTableBodyRow(location));
        const delBtn = document.getElementById("del" + location.locationName)
        const updBtn = document.getElementById("upd" + location.locationName)
        updBtn.addEventListener("click", function () { updateLocation(location),displayToggle(["update-form"]) })
        delBtn.addEventListener("click", function () { deleteLocation(location) })

    })
}
/**
 * erstellt auf Basis einer Location eine Tabellein reihe
 * @param {} location 
 * @returns tabellen reihe
 */
function generateUpdateTableBodyRow(location) {

    const row = document.createElement("tr")
    row.setAttribute("id", location.locationName)
    for (const key in location) {
        if ((key !== "latitude") && (key !== "longitude") && (key !== "photo")) {
            const cell = document.createElement("td");
            cell.textContent = location[key];
            row.appendChild(cell);
        }
    }
    const updateButton = document.createElement("button")
    const deleteButton = document.createElement("button")
    const cell = document.createElement("td");
    updateButton.setAttribute("class", "update-btn")
    updateButton.setAttribute("id", "upd" + location.locationName)
    updateButton.textContent = "Update"
    deleteButton.setAttribute("class", "update-btn")
    deleteButton.setAttribute("id", "del" + location.locationName)
    deleteButton.textContent = "Delete"
    //updateButtonList.push(updateButton)
    //updateButtonList.push(deleteButton)
    cell.appendChild(updateButton)
    cell.appendChild(deleteButton)
    row.appendChild(cell)
    return row
}




/**
 * takes the locations const and for each Element
 * generates listelementes and appends them to the locationList const
 * using the Name field as inner Text
 */
function generateLocationList() {
    const locationList = document.getElementById("locations-list");
    // clear the list if there are elements:
    while (locationList.lastElementChild) {
        locationList.removeChild(locationList.lastElementChild);
    }

    // get the locations:
    //getLocationsAsObj()

    // just to test
    console.log("locationsList length: " + locationsList.length)

    if (locationsList.length !== 0) {
        locationsList.forEach(location => {

            const row = document.createElement("li");
            row.setAttribute("class", "locations-list-element");

            row.addEventListener("click", () => {
                // show the info of the location:
                setLocationInfoContainer(location);
                // pan the map to the location:
                map.flyTo([location.latitude, location.longitude], 15)
            })

            //const methodCall = "setLocationInputContainer"+"(\""+location.locationName+"\")"
            //row.setAttribute("onClick",methodCall);

            let img = new Image()
            img.src = "./img/location-icon.png"
            img.classList.add("locations-list-icon")
            row.appendChild(img)

            row.append(location.locationName)
            locationList.appendChild(row)

        })
        // set default values for info container:
        setLocationInfoContainer(locationsList[0])
    } else {
        const row = document.createElement("li");
        row.setAttribute("class", "locations-list-element");
        row.append("No locations right now ..")
        locationList.appendChild(row)
    }
}

/**
 *  sets data displayed in the location Container 
 * @param {*} location location that should be displayed 
 */
function setLocationInfoContainer(location) {

    let locationInfoTitel = document.getElementById("location-info-title-text")
    let locationInfoDes = document.getElementById("location-info-des-text")
    let locationInfoCo2 = document.getElementById("location-info-co2-text")

    locationInfoTitel.textContent = location.locationName
    locationInfoDes.textContent = "- " + location.description
    locationInfoCo2.textContent = "CO2 in T : " + location.c02InTons
}
/**
 * gets lat and long for given addres
 * @param {*} streetname 
 * @param {*} streetnr 
 * @param {*} city 
 * @param {*} postcode 
 * @param {*} callbackResult 
 */
function getGeocoding(streetname, streetnr, city, postcode, callbackResult) {

    // Geocoding API:
    let xhr = new XMLHttpRequest()
    let address = streetname + streetnr + "," + city + "," + postcode

    xhr.open('GET', geocodingUrl + encodeURIComponent(address) + '&key=' + googleAPIKey, true);

    // Callback-Function:
    xhr.onload = function () {

        console.log("trying to get the geocoding of: " + address)

        let response = JSON.parse(xhr.responseText);

        if (xhr.status === 200) {
            if (response.status !== "ZERO_RESULTS") {
                console.log("result-state : " + response.status)
                // callback the parameter function to return the results:
                callbackResult(response)
            } else {
                // just to test:
                console.log("The address could not be resolved!");
                // callback the parameter function to return the results:
                callbackResult(null)
            }
        } else {
            // just to test:
            console.log("Error: " + xhr.status + " , Obj-state: " + response.status);
            // callback the parameter function to return the results:
            callbackResult(null)
        }
    };

    // send request:
    xhr.send();
}
