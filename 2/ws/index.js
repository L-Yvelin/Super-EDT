const WebSocket = require('ws');
const schedule = require('node-schedule');

const ws = new WebSocket.Server({ port: 8001 });

let courseData = [];
let groups = [];
let tram = [];

let IPs = [];

let isFetchingCourses = false;
let isFetchingGroups = false;
let isFetchingTram = false;

lastUpdate = new Date();

presenteSemaine = getSemaine();
presenteAnnee = new Date().getFullYear();
departement = 'INFO';
promotion = 'BUT3';
groupe = '2';

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

function getSemaine() {
  return new Date().getDay() == 6 || new Date().getDay() == 0 ? getWeekNumber(new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * 2)) : getWeekNumber(new Date()); // Ou la suivante si samedi ou dimanche
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

// Function to fetch and update course data
async function updateCourseData() {
  if (isFetchingCourses) {
    // console.log('Fetch operation is already in progress, skipping this update.');
    return false;
  }

  isFetchingCourses = true;

  try {
    const response = await fetchCourseData();
    courseData = await response.json();
    console.log('Course data updated.');

    ws.clients.forEach(sendCourseData);
  } catch (error) {
    console.error('Error updating course data:', error);
  } finally {
    isFetchingCourses = false;
    return true;
  }
}

// Function to fetch and update groups
async function updateGroupsData() {
  if (isFetchingGroups) {
    console.log('Fetch operation is already in progress, skipping this update.');
    return;
  }

  isFetchingGroups = true;

  try {
    const departments = await fetchAllDepartments();
    const departmentArray = await departments.json();

    const departmentPromises = departmentArray.map(async (department) => {
      const response = await fetchGroups(department.abbrev);
      return [department.abbrev, await response.json()];
    });

    groups = await Promise.all(departmentPromises);

    console.log('Groups updated.');
    ws.clients.forEach(sendGroupsData);

  } catch (error) {
    console.error('Error updating groups:', error);
  } finally {
    isFetchingGroups = false;
  }
}

async function updateTramData() {
  if (isFetchingTram) {
    console.log('Fetch operation is already in progress, skipping this update.');
    return;
  }

  isFetchingTram = true;
  same = false;

  try {
    const [responseMeett, responsePDJ] = await Promise.all([
      fetchTisseoMeett(),
      fetchTisseoPDJ(),
    ]);

    if (!responseMeett.ok || !responsePDJ.ok) {
      throw new Error('One or more fetch operations failed.');
    }

    const dataMeett = await responseMeett.json();
    const dataPDJ = await responsePDJ.json();

    // Create an associative array with the keys "MEETT" and "PDJ"
    same = JSON.stringify(tram) == JSON.stringify([dataMeett, dataPDJ]);
    tram = [dataMeett, dataPDJ];

    console.log(`Tram data ${same ? 'identical' : 'updated'}.`);

    !same && ws.clients.forEach(sendTramData);
  } catch (error) {
    console.error('Error updating tram data:', error);
  } finally {
    isFetchingTram = false;
  }
}

async function updateTimeData() {
  presenteSemaine = getSemaine();
  console.log('Week number updated.');
  ws.clients.forEach(sendTimeData);
}

async function fetchCourseData() {
  presenteSemaine = getSemaine();
  const response = await fetch(`https://flopedt.iut-blagnac.fr/en/api/fetch/scheduledcourses/?week=${presenteSemaine}&year=${presenteAnnee}&dept=${departement}&train_prog=${promotion}&group=${groupe}`);
  return response;
}

async function fetchGroups() {
  const response = await fetch(`https://flopedt.iut-blagnac.fr/en/api/groups/structural/tree/?dept=${departement}`);
  return response;
}

async function fetchAllDepartments() {
  const response = await fetch(`https://flopedt.iut-blagnac.fr/en/api/fetch/alldepts/`);
  return response;
}

async function fetchTisseoMeett() {
  const response = await fetch(`https://plan-interactif.tisseo.fr/api/schedules?stop=stop_point:SP_1150&route=line:68_f&date=&count=6`);
  return response;
}

async function fetchTisseoPDJ() {
  const response = await fetch(`https://plan-interactif.tisseo.fr/api/schedules?stop=stop_point:SP_4947&route=line:68_b&date=&count=6`);
  return response;
}

function sendCourseData(client) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'courseData', data: courseData }));
  }
}

function sendGroupsData(client) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'groupsData', data: groups }));
  }
}

function sendTramData(client) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'tramData', data: tram }));
  }
}

function sendUsers() {
  ws.clients.forEach(client => {
    client.send(JSON.stringify({ type: 'users', data: IPs }));
  });
}

function sendTimeData(client) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: 'timeData', data: [presenteSemaine, presenteAnnee] }));
  }
}

function updateLastUpdate() {
  lastUpdate = new Date();
  console.log('Last update date updated.');

  ws.clients.forEach(client => { client.send(JSON.stringify({ type: 'lastUpdate', data: lastUpdate.toLocaleTimeString('fr-FR') })) });
}

function sendFetching(fetching) {
  ws.clients.forEach(client => { client.send(JSON.stringify({ type: 'isFetching', data: fetching })) });
}

function isLastUpdateOld() {
  const now = new Date();
  const timeDifference = now - lastUpdate;
  const oneHourInMilliseconds = 1000 * 60 * 60; // 1 minute
  return timeDifference > oneHourInMilliseconds;
}

async function updateAll() {
  try {
    sendFetching(true);
    // updateGroupsData();
    if (await updateCourseData()) {
      updateLastUpdate(); // Better user experience to put it here
    }
  } finally {
    sendFetching(isFetchingCourses);
  }
}

ws.on('connection', (client, req) => {
  let user = {
    id: getClientIP(req),
    pseudo: null,
  };

  IPs.push(user);
  sendUsers();

  sendCourseData(client);
  sendGroupsData(client);
  sendTramData(client);
  sendTimeData(client);

  newDate = new Date();
  dayPassed = newDate.getDate() > lastUpdate.getDate() || newDate.getMonth() > lastUpdate.getMonth();

  client.send(JSON.stringify({ type: 'lastUpdate', data: lastUpdate.toLocaleTimeString('fr-FR') }));

  client.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'update') {
        updateAll();
      } else if (parsedMessage.type === 'pseudo') {
        user.pseudo = parsedMessage.data;
        sendUsers();
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  client.on('close', () => {
    const index = IPs.indexOf(user);
    if (index !== -1) {
      IPs.splice(index, 1);
    }
    sendUsers();
  });
});

function updateTramPeriodically() {
  if (ws.clients.size > 0) {
    updateTramData();
  }
}

schedule.scheduleJob('*/20 * * * * *', updateTramPeriodically);
schedule.scheduleJob('0 0 * * 1', updateTimeData);
schedule.scheduleJob('0 * * * *', updateAll);

updateAll();
updateGroupsData();
updateTramData();
updateTimeData();