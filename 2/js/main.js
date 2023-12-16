let coursData;
let groupsData;

const abbreviations = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

indexJour = getCurrentAbbreviation(new Date().getDay());
indexJour = ['su', 'sa'].includes(indexJour) ? 'm' : indexJour;

const elementBody = document.body;
const backgroundSticker = document.getElementById('background-sticker');
const statusConnexion = document.getElementById('status-connexion');
const customTooltip = document.getElementById('custom-tooltip');
const ledConnexion = document.getElementById('led-connexion');
const nbUtilisateurs = document.getElementById('nb-utilisateurs');
const elementTitre = document.getElementById('titre');
const numeroSemaine = document.getElementById('numero-semaine');
const elementSurtom = document.getElementById('surtom');
const elementModeUnJour = document.getElementById('mode-un-jour');
// const elementInterface = document.querySelector('element-interface');
const updateButton = document.getElementById('updateButton');
const lastUpdate = document.getElementById('derniere-actualisation');
const nomJour = document.getElementById('nom-jour');
const boutonGroupes = document.getElementById('choisirGroupe');
const departements = document.getElementById('departements');
const formulaireGroupes = document.getElementById('formulaire-groupe');
const fermerFormulaireGroupes = document.getElementById('fermer-groupe');
const tramDataElements = {
    MEETT: document.getElementById('MEETT-horaires'),
    PDJ: document.getElementById('PDJ-horaires'),
};
const logoTram = document.getElementById('logo-tram');
const tramWagons = document.getElementById('tram-wagons');

let pingInterval;
let reconnectInterval;
let animationInterval;
let lastUpdateTime;

function displayCourseData(data, indexJour) {
    const mainElement = document.querySelector('main');
    mainElement.innerHTML = '';
    const elementInterface = new Interface(data, indexJour, "Jour");
    elementInterface.render();
    mainElement.appendChild(elementInterface);
}

// Function to check if an object is iterable
function isIterable(obj) {
    if (obj == null) return false;
    return typeof obj[Symbol.iterator] === 'function';
}

// Function to update the groups in the form
function updateGroups() {
    const departementsSelect = document.getElementById("departement");
    const anneesSelect = document.getElementById("annee");
    const groupesSelect = document.getElementById("groupe");
    const sousGroupesSelect = document.getElementById("sousgroupe");

    // Clear previous options
    departementsSelect.innerHTML = "<option value='' disabled selected>Select Année</option>";
    anneesSelect.innerHTML = "<option value='' disabled selected>Select Année</option>";
    groupesSelect.innerHTML = "<option value='' disabled selected>Select Groupe</option>";
    sousGroupesSelect.innerHTML = "<option value='' disabled selected>Select Sous Groupe</option>";

    // Replace 'groupsData' with your actual data
    for (const departements of groupsData) {
        const departementOption = document.createElement("option");
        departementOption.value = departements[0];
        departementOption.text = departements[0];
        departementsSelect.appendChild(departementOption);
    }

    departementsSelect.addEventListener("change", _ => {
        const selectedDepartement = departementsSelect.value;

        // Find the selected Département in the data
        const selectedDepartementData = groupsData.find(departement => departement[0] === selectedDepartement);

        // Clear and update Année options
        anneesSelect.innerHTML = "<option value='' disabled selected>Select Année</option>";
        groupesSelect.innerHTML = "<option value='' disabled selected>Select Groupe</option>";
        sousGroupesSelect.innerHTML = "<option value='' disabled selected>Select Sous Groupe</option>";

        if (selectedDepartementData) {
            for (const annees of selectedDepartementData[1]) {
                const anneeOption = document.createElement("option");
                anneeOption.value = annees.promo; // Update to the correct field in your data
                anneeOption.text = annees.promo; // Update to the correct field in your data
                anneesSelect.appendChild(anneeOption);
            }
        }

        // Store the selected Département in localStorage
        localStorage.setItem("selectedDepartement", selectedDepartement);
    });

    anneesSelect.addEventListener("change", _ => {
        const selectedDepartement = departementsSelect.value;
        const selectedAnnee = anneesSelect.value;

        // Find the selected Département in the data
        const selectedDepartementData = groupsData.find(departement => departement[0] === selectedDepartement);

        // Find the selected Année in the Département data
        if (!selectedDepartementData) return;
        const selectedAnneeData = selectedDepartementData[1].find(annee => annee.promo === selectedAnnee);

        // Clear and update Groupe options
        groupesSelect.innerHTML = "<option value='' disabled selected>Select Groupe</option>";
        sousGroupesSelect.innerHTML = "<option value='' disabled selected>Select Sous Groupe</option>";

        if (selectedAnneeData) {
            for (const groupes of selectedAnneeData.children) {
                const groupeOption = document.createElement("option");
                groupeOption.value = groupes.name; // Update to the correct field in your data
                groupeOption.text = groupes.name; // Update to the correct field in your data
                groupesSelect.appendChild(groupeOption);
            }
        }

        // Store the selected Année in localStorage
        localStorage.setItem("selectedAnnee", selectedAnnee);
    });

    groupesSelect.addEventListener("change", _ => {
        const selectedDepartement = departementsSelect.value;
        const selectedAnnee = anneesSelect.value;
        const selectedGroupe = groupesSelect.value;

        // Find the selected Département in the data
        const selectedDepartementData = groupsData.find(departement => departement[0] === selectedDepartement);

        // Find the selected Année in the Département data
        if (!selectedDepartementData) return;
        const selectedAnneeData = selectedDepartementData[1].find(annee => annee.promo === selectedAnnee);

        // Find the selected Groupe in the Année data
        const selectedGroupeData = selectedAnneeData.children.find(groupe => groupe.name === selectedGroupe);

        // Clear and update Sous Groupe options
        sousGroupesSelect.innerHTML = "<option value='' disabled selected>Select Sous Groupe</option>";

        if (selectedGroupeData && isIterable(selectedGroupeData.children)) {
            for (const sousgroupes of selectedGroupeData.children) {
                const sousgroupeOption = document.createElement("option");
                sousgroupeOption.value = sousgroupes.name; // Update to the correct field in your data
                sousgroupeOption.text = sousgroupes.name; // Update to the correct field in your data
                sousGroupesSelect.appendChild(sousgroupeOption);
            }
        }

        // Store the selected Groupe in localStorage
        localStorage.setItem("selectedGroupe", selectedGroupe);
    });

    sousGroupesSelect.addEventListener("change", _ => {
        const selectedSousGroupe = sousGroupesSelect.value;
        localStorage.setItem("selectedSousGroupe", selectedSousGroupe);
    });

    // Check if values are stored in localStorage and pre-fill the form
    const storedDepartement = localStorage.getItem("selectedDepartement");
    const storedAnnee = localStorage.getItem("selectedAnnee");
    const storedGroupe = localStorage.getItem("selectedGroupe");
    const storedSousGroupe = localStorage.getItem("selectedSousGroupe");

    if (storedDepartement) {
        departementsSelect.value = storedDepartement;
        departementsSelect.dispatchEvent(new Event('change'));
    }

    if (storedAnnee) {
        anneesSelect.value = storedAnnee;
        anneesSelect.dispatchEvent(new Event('change'));
    }

    if (storedGroupe) {
        groupesSelect.value = storedGroupe;
        groupesSelect.dispatchEvent(new Event('change'));
    }

    if (storedSousGroupe) {
        sousGroupesSelect.value = storedSousGroupe;
    }
}

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

function getFrenchDay(abbrev) {
    return frenchDays[abbreviations.indexOf(abbrev)];
}

function sortCourseData(data) {
    return data.sort((a, b) => {
        return a.start_time - b.start_time;
    });
}

function fetching(fetching) {
    fetching ? updateButton.classList.add('fetching') : updateButton.classList.remove('fetching');
}

function getDateFromWeekNumber(weekNumber, year, dayAbbreviation) {
    if (!abbreviations.includes(dayAbbreviation)) {
        return "Invalid day abbreviation";
    }
    const firstDayOfYear = new Date(year, 0, 1);
    const dayIndex = abbreviations.indexOf(dayAbbreviation);
    const resultDate = new Date(firstDayOfYear);
    resultDate.setDate(firstDayOfYear.getDate() + dayIndex + (weekNumber - 1) * 7);
    const day = String(resultDate.getDate()).padStart(2, "0");
    const month = String(resultDate.getMonth() + 1).padStart(2, "0"); // Month is 0-based

    return `${day}/${month}`;
}

function minutesToTime(minutes) {
    // Divisez les minutes par 60 pour obtenir les heures et les minutes.
    const hours = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;

    // Formate l'heure au format "hh:nn".
    const formattedTime = `${hours}h${minutesPart.toString().padStart(2, '0')}`;

    return formattedTime;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getCurrentAbbreviation(abbrev) {
    return abbreviations[abbrev];
}

function calculateTimeDifference(timestamp) {
    // Split the timestamp into hours, minutes, and seconds
    const [hours, minutes, seconds] = timestamp.split(':').map(Number);
    const now = new Date();
    const messageTime = new Date();

    // Set the messageTime to the provided hours, minutes, and seconds
    messageTime.setHours(hours, minutes, seconds);

    const timeDifference = now - messageTime;

    if (timeDifference < 10000) { // Less than 10 seconds
        return `-${Math.max(Math.floor(timeDifference / 1000), 0)}s`;
    } else if (timeDifference < 60000) { // Less than 1 minute
        return `-${Math.max(Math.floor(timeDifference / 1000), 0)}s`;
    } else if (timeDifference < 300000) { // Less than 5 minutes
        return `-${Math.max(Math.floor(timeDifference / 60000), 0)}m`;
    } else { // More than 5 minutes
        return `-${Math.max(Math.floor(timeDifference / 60000), 0)}m`;
    }
}

function formatDate(dateStr) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6) - 1; // Months are zero-based
    const day = dateStr.slice(6, 8);
    const hours = dateStr.slice(9, 11);
    const minutes = dateStr.slice(11, 13);
    const seconds = dateStr.slice(13, 15);
    return new Date(year, month, day, hours, minutes, seconds);
}

function updateTramData(ligne) {
    const currentTime = new Date();

    ligne.forEach(horaire => {
        destinationElement = horaire.destination === "MEETT (BEAUZELLE)" ? tramDataElements.MEETT : horaire.destination === "Palais de Justice (TOULOUSE)" ? tramDataElements.PDJ : null;
        if (!destinationElement) return;
        const formattedDate = formatDate(horaire.date_time);
        updateTramElement(destinationElement, formattedDate, horaire.data_freshness, currentTime);
    });
}

function updateTramElement(element, date_time, data_freshness, currentTime) {
    const timeDifference = Math.floor((date_time - currentTime) / 1000);
    const isRealtime = data_freshness === 'realtime';
    const timeDisplay = Math.max(Math.floor(timeDifference / 60), 0); // Sometimes -1 ?

    element.innerHTML += isRealtime ? `<span class="realtime">${timeDisplay}</span> ` : `${timeDisplay} `;
}

function simplifyData(inputData) {
    const simplifiedMap = new Map();

    inputData.forEach(item => {
        const { start_time, room, tutor, day, course } = item;
        const { name: salle } = room;
        const { module: { name: libelle } } = course;
        const professeur = tutor || null; // If tutor is null, set it to "N/A"

        if (!simplifiedMap.has(day)) {
            simplifiedMap.set(day, []);
        }

        simplifiedMap.get(day).push([start_time, salle, libelle, professeur]);
    });

    // Sort the arrays within each day by the start_time
    simplifiedMap.forEach((value, key) => {
        simplifiedMap.set(key, value.sort((a, b) => a[0] - b[0]));
    });

    return simplifiedMap;
}

let ws;
function connectWs() {
    function updateData() {
        ws.send(JSON.stringify({ type: 'update' }));
    }

    ws = new WebSocket('wss://edt.yvelin.net/ws');

    // Handle incoming WebSocket messages
    ws.addEventListener('message', (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log("Message reçu :", message.type);
            console.log(message.data);
            if (message.type === 'courseData') {
                displayCourseData(simplifyData(message.data));
            } else if (message.type === 'lastUpdate') {
                lastUpdateTime = message.data; // 19:51:05
                lastUpdate.textContent = calculateTimeDifference(lastUpdateTime);
            } else if (message.type === 'groupsData') {
                groupsData = message.data;
                updateGroups();
            } else if (message.type === 'isFetching') {
                message.data == true ? fetching(true) : fetching(false);
            } else if (message.type === 'users') {
                nbUtilisateurs.textContent = message.data.length;
                stringIP = '';
                for (const [index, ip] of message.data.entries()) {
                    stringIP += ip.pseudo != null ? ip.pseudo : ip.id;
                    if (index < message.data.length - 1) stringIP += "</br>";
                }
                customTooltip.innerHTML = stringIP;
            } else if (message.type === 'tramData') {
                const tramData = message.data;
                Object.values(tramDataElements).forEach(e => e.innerHTML = '');
                tramData.forEach(ligne => {
                    updateTramData(ligne);
                });
                Object.values(tramDataElements).forEach(e => e.innerHTML = e.innerHTML || 'FINI');
            } else if (message.type === 'timeData') {
                numeroSemaine.textContent = message.data[0];
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    // Handle WebSocket open connection
    ws.addEventListener('open', _ => {
        ledConnexion.classList.add('connected');
        pseudo = Cookies.get('pseudo');
        if (pseudo) ws.send(JSON.stringify({ type: 'pseudo', data: pseudo }));

        clearInterval(reconnectInterval);
        pingInterval = setInterval(_ => { ws.send(JSON.stringify({ type: 'ping' })) }, 29000);

        updateButton.addEventListener('click', updateData);

        console.log('Connected to the WebSocket server');
    });

    // Handle WebSocket errors
    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Handle WebSocket close
    ws.addEventListener('close', _ => {
        ledConnexion.classList.remove('connected');
        nbUtilisateurs.textContent = '';

        clearInterval(pingInterval);
        reconnectInterval = setTimeout(connectWs, 2000);

        updateButton.removeEventListener('click', updateData);

        console.log('WebSocket connection closed');
    });
}
connectWs();

// function mettreAJourBoutons() {
//     if (indexJour == 'm') {
//         document.querySelector('.jour-precedent').classList.add('deactive');
//     } else {
//         document.querySelector('.jour-precedent').classList.remove('deactive');
//     }

//     if (indexJour == 'f') {
//         document.querySelector('.jour-suivant').classList.add('deactive');
//     } else {
//         document.querySelector('.jour-suivant').classList.remove('deactive');
//     }
// }

// document.querySelector('.jour-precedent').addEventListener('click', _ => {
//     if (indexJour === 'm') return;
//     indexJour = abbreviations[abbreviations.indexOf(indexJour) - 1];
//     displayCourseData(coursData);
//     mettreAJourBoutons();
//     document.querySelector('.jour-suivant').classList.remove('deactive');
// });

// document.querySelector('.jour-suivant').addEventListener('click', _ => {
//     if (indexJour == 'f') return;
//     indexJour = abbreviations[abbreviations.indexOf(indexJour) + 1];
//     displayCourseData(coursData);
//     mettreAJourBoutons();
//     document.querySelector('.jour-precedent').classList.remove('deactive');
// });

// document.addEventListener('keydown', (event) => {
//     if (event.key === 'ArrowLeft') {
//         document.querySelector('.jour-precedent').click();
//     } else if (event.key === 'ArrowRight') {
//         document.querySelector('.jour-suivant').click();
//     }
// });

// let startX = null;
// let startY = null;
// let isMouseDown = false;

// elementInterface.addEventListener('touchstart', (event) => {
//     handleStart(event.touches[0].clientX, event.touches[0].clientY);
// });

// elementInterface.addEventListener('mousedown', (event) => {
//     isMouseDown = true;
//     handleStart(event.clientX, event.clientY);
// });

// elementInterface.addEventListener('touchend', handleEnd);
// elementInterface.addEventListener('mouseup', handleEnd);

// function handleStart(x, y) {
//     // console.log("start:", x, y);
//     startX = x;
//     startY = y;
// }

// function handleEnd(event) {
//     if (startX === null) {
//         resetStart();
//         return; // No swipe detected
//     }

//     const endX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
//     const endY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
//     // console.log("start:", endX, endY);

//     const deltaX = Math.abs(endX - startX);
//     const deltaY = Math.abs(endY - startY);

//     if (deltaX >= 1.5 * deltaY && Math.abs(deltaX) > 5 * window.innerWidth / 100) {
//         if (endX > startX) {
//             // Right swipe, trigger the previous day action
//             document.querySelector('.jour-precedent').click();
//         } else {
//             // Left swipe, trigger the next day action
//             document.querySelector('.jour-suivant').click();
//         }
//     }

//     resetStart();
// }

// function resetStart() {
//     startX = null;
//     startY = null;
//     isMouseDown = false;
// }


boutonGroupes.addEventListener('click', _ => {
    formulaireGroupes.classList.toggle('show');
});

fermerFormulaireGroupes.addEventListener('click', _ => {
    formulaireGroupes.classList.toggle('show');
});



// Vivent dessous les méandres et tourments de ma difficile vie de programmeur :

function animation(loop = false) {
    let timeout, test3, test4, test_bis;
    [timeout, test3, test4, test_bis].forEach(element => { clearTimeout(element) });
    clearInterval(animationInterval);

    elements = document.querySelectorAll('.cours');
    elements.forEach(element => { element.style.scale = '1' });
    if (loop) {
        animationInterval = setInterval(_ => {
            i = 0;
            test();
        }, 3000);
    } else {
        timeout = setTimeout(_ => {
            i = 0;
            test();
        }, 100);
    }
}

function test() {
    test3 = setTimeout(_ => {
        if (i >= elements.length) {
            return;
        }

        elements[i].style.scale = '1.05';

        test2(i);

        test_bis = setTimeout(_ => {
            i++;
            test();
        }, 10);
    }, 50);
}

function test2(y) {
    test4 = setTimeout(_ => {
        if (elements[y]) {
            elements[y].style.scale = '1';
            elements[y].style.transform = "rotateX(0deg)";
            elements[y].style.transform = "rotateX(360deg)";
        }
    }, 150);
}

// Retour au bonheur

statusConnexion.addEventListener('mouseover', _ => {
    customTooltip.style.display = 'block';
});

statusConnexion.addEventListener('mouseout', _ => {
    customTooltip.style.display = 'none';
});

elementSurtom.addEventListener('click', _ => {
    window.open('https://surtom.yvelin.net', '_self');
});

setInterval(_ => {
    lastUpdate.textContent = calculateTimeDifference(lastUpdateTime);
}, 1000);

function yahoo() {
    elementBody.style.transform = elementBody.style.transform == "rotate3d(1, 1, 1, 360deg)" ? "rotate3d(1, 1, 1, 0deg)" : "rotate3d(1, 1, 1, 360deg)";
}

backgroundSticker.addEventListener('click', _ => {
    yahoo();
});

canClick = true;
logoTram.addEventListener('click', _ => {
    if (canClick) {
        const newImage = new Image();
        newImage.onload = function () {
            const audio = new Audio('sons/tram_toulouse.mp3');
            audio.volume = 0.3;
            setTimeout(() => {
                audio.play();
            }, 500);

            tramWagons.src = newImage.src;
            tramWagons.classList.toggle('passed');
            canClick = false;
            setTimeout(() => {
                canClick = true;
            }, 2000);
        };
        newImage.src = `images/trams/tram${Math.floor(Math.random() * 7) + 1}.png`;
    }
});

// pratique
function updateGroups2() {
    content = '';

    for (const departements of groupsData) {

        for (const annees of departements[1]) {

            for (const groupes of annees.children) {

                if (!isIterable(groupes.children)) continue;
                for (const sousgroupes of groupes.children) {
                }
            }
        }
    }
}

setInterval(_ => {
    d = new Date(); //object of date()
    hr = d.getHours();
    min = d.getMinutes();
    sec = d.getSeconds();
    hr_rotation = 30 * hr + min / 2; //converting current time
    min_rotation = 6 * min;
    sec_rotation = 6 * sec;

    hour.style.transform = `rotate(${hr_rotation}deg)`;
    minute.style.transform = `rotate(${min_rotation}deg)`;
    second.style.transform = `rotate(${sec_rotation}deg)`;
}, 1000);