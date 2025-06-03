function encodeMessage(type, message){
    return JSON.stringify({ type: type, message: message });
}

function showNotification(message = "Notification", response = "Success", duration = 3000) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.classList.add('show');
    notif.style.backgroundColor = response === "Success" ? "#4CAF50" : "#f44336"; // Green for success, red for error
    notif.style.color = "#fff";
    setTimeout(() => {
        notif.classList.remove('show');
    }, duration);
}

function handleJoinMessage(data) {
    if(data.id === window.userID){
        return;
    } //Yea do we even need this anymore?
}

function handleAccountMessage(data) {
    if(data.type == "error"){
        showNotification(data.message, "Error");
    }else if(data.type == "success"){
        showNotification(data.message.response, "Success");
        localStorage.setItem("sessionID", data.message.sessionID);
        localStorage.setItem("username", data.message.username);
        setTimeout(() => {
           window.location.href = "/"
        }, 3000);
    }

}

function handlefightJoinMessage(data){
    return;
}

function handleAccountDataMessage(data) {
    if(data.type == "error"){
        showNotification("Account data error, try logging in again", "Error");
        return;
    }
    if(window.location.pathname === "/") {
        const level_bar = document.querySelector('.progress-fill');
        const profileName = document.querySelector('.profile-name')
        const wins = document.getElementById('WinsInfo')
        const level = document.getElementById('LvlInfo')
        const id = document.querySelector('.profile-id')
        const coins = document.getElementById('CoinsInfo')
        profileName.textContent = "Username: " + data.username;
        wins.textContent = "Wins: " + data.wins;
        level.textContent = "Level: " + data.level;
        id.textContent = "ID: " + data.id;
        coins.textContent = "Coins: " + data.coins;

        const exp_progress = parseInt(data.exp, 10) / parseInt(data.exp_required, 10) * 100;

        level_bar.style.width = `${exp_progress}%`;

        showNotification("Account data loaded!", "Success");
    }
}

function handleLogoutMessage(data) {
    if(data.type == "error"){
        return
    }
    localStorage.removeItem("sessionID");
    localStorage.removeItem("username");
    let allCookies = document.cookie.split(';');

    // The "expire" attribute of every cookie is 
    // Set to "Thu, 01 Jan 1970 00:00:00 GMT"
    for (let i = 0; i < allCookies.length; i++)
        document.cookie = allCookies[i] + "=;expires="
            + new Date(0).toUTCString();
    window.username = "Guest";
    location.reload();
}

function handleMoveMessage(data) {
    return
}

//Peakaboo
const linked_functions = {
    joinMessage: handleJoinMessage,
    moveMessage: handleMoveMessage,
    accountMessage: handleAccountMessage,
    fightJoinMessage: handlefightJoinMessage,
    FightJoinFail: (data) => {
        console.warn("Fight join failed:", data.message);
    },
    clientDisconnect: (data) => {
        return
    },
    updateClients: (data) => {        
    },
    assignID: (data) => {
        window.userID = data.id;
        window.username = data.username;
        if(window.location.pathname == "/"){
        const logoutButton = document.querySelector('.logout-button');
        if (window.username === "Guest" ){
            localStorage.setItem("username", "Guest"); //Prevents incorrect username when in game on client
            logoutButton.textContent = "Login";
            logoutButton.onclick = function() {
                window.location.href = '/account';
        }}}
    },
    accountDataMessage: handleAccountDataMessage,
    logoutMessage: handleLogoutMessage,
}

function handleMessage(data){
    //for now just consolelog
    let parsedData = data;

    if(typeof data.data !== 'object'){
        parsedData = JSON.parse(parsedData);
    }

    if(parsedData.type === undefined || parsedData.message === undefined){
        console.warn("Received malformed message:", data);
        return;
    }

    if(linked_functions[parsedData.type]){
        linked_functions[parsedData.type](parsedData.message);
    } else {
        console.warn(`No handler for message type: ${parsedData.type}`);
    }

}