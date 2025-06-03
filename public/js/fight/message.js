let score = [0,0];
let myHealth = 3;
let enemyHealth = 3;
const winLossScreen = document.getElementById('winLossScreen')
const winLossMessage = document.getElementById('winLossMessage')

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


function encodeMessage(type, message){
    return JSON.stringify({ type: type, message: message });
}

function toScreenCoords(x, y) {
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

function handlefightJoinMessage(data){
    const fightData = data.playerData;
    const cursor2 = document.querySelector('#cursor2');
    const nametag2 = document.querySelector('#nametag2');
    window.fightStarted = true;
    cursor2.style.display = "block";
    nametag2.style.display = "block";
    nametag2.textContent = fightData.username || "Guest";
    cursor2.style.left = fightData.x + 'px';
    cursor2.style.top = fightData.y + 'px';
    updatePlayer2CursorColors(fightData.cursor);
    positionNametag(nametag2, cursor2);
}

function handleMoveMessage(data) {
    const cursor2 = document.querySelector('#cursor2');
    const nametag2 = document.querySelector('#nametag2');
    const coords = toScreenCoords(data.x, data.y);
    cursor2.style.left = coords.x + 'px';
    cursor2.style.top = coords.y + 'px';
    positionNametag(nametag2, cursor2);
    return
}

function handleRoundMessage(data) {
    const scoreDisplay = document.getElementById('score');
    if (data.type == "round"){
        //User won the round
        if(data.id == "YOU"){
            score[0]+= 1
            scoreDisplay.textContent = `Score: ${score[0]} - ${score[1]}`;
            showNotification("You won the round!", "Success");
            console.log("Reset health display - me")
        }else if(data.id == "not you"){
            score[1]+= 1
            scoreDisplay.textContent = `Score: ${score[0]} - ${score[1]}`;
            showNotification("You lost the round!", "Success");
        }
    }else if(data.type == "game"){
        if(data.id == "YOU"){
            score[0]+= 1
            scoreDisplay.textContent = `Score: ${score[0]} - ${score[1]}`;
            winLossScreen.style.display = "block";
            winLossMessage.textContent = "You won the game!";
        }else if(data.id == "not you"){
            score[1]+= 1
            scoreDisplay.textContent = `Score: ${score[0]} - ${score[1]}`;
            winLossScreen.style.display = "block";
            winLossMessage.textContent = "You lost the game!";
        }
    }
    myHealth = 3;
    enemyHealth = 3;
    myHeart1.style.display = myHealth >= 1 ? 'block' : 'none';
    myHeart2.style.display = myHealth >= 2 ? 'block' : 'none';
    myHeart3.style.display = myHealth >= 3 ? 'block' : 'none';
    enemyHeart1.style.display = enemyHealth >= 1 ? 'block' : 'none';
    enemyHeart2.style.display = enemyHealth >= 2 ? 'block' : 'none';
    enemyHeart3.style.display = enemyHealth >= 3 ? 'block' : 'none';
}

function handleHealthMessage(data) {
    if (data.type == "youWereHit") {
        myHealth = data.health;
        cursor1 = document.querySelector('#cursor2');
        cursor1.classList.add('blink');
        setTimeout(() => {
            cursor1.classList.remove('blink');
        }, 1500); // Remove the blink effect after 1.5 seconds
        myHeart1.style.display = myHealth >= 1 ? 'block' : 'none';
        myHeart2.style.display = myHealth >= 2 ? 'block' : 'none';
        myHeart3.style.display = myHealth >= 3 ? 'block' : 'none';

    }else if (data.type == "enemyWasHit") { 
        cursor2 = document.querySelector('#cursor2');
        cursor2.classList.add('blink');
        setTimeout(() => {
            cursor2.classList.remove('blink');
        }, 1500); // Remove the blink effect after 1.5 seconds
        enemyHealth = data.health;
        enemyHeart1.style.display = enemyHealth >= 1 ? 'block' : 'none';
        enemyHeart2.style.display = enemyHealth >= 2 ? 'block' : 'none';
        enemyHeart3.style.display = enemyHealth >= 3 ? 'block' : 'none';
    }
}

function handleAttackmessage(data) {
    const attackPos = toScreenCoords(data.x, data.y);

    const body = document.querySelector('body');
    const square = document.createElement('div');
    square.classList.add("square");

    square.style.left = attackPos.x + 'px';
    square.style.top = attackPos.y + 'px';

    body.appendChild(square);
    setTimeout(() => {
        body.removeChild(square);
    }, 500); // Remove the square after .5 seconds
}

//Peakaboo
const linked_functions = {
    moveMessage: handleMoveMessage,
    fightJoinMessage: handlefightJoinMessage,
    attackMessage: handleAttackmessage,
    healthMessage: handleHealthMessage,
    roundMessage: handleRoundMessage,
    FightJoinFail: (data) => {
        console.warn("Fight join failed:", data.message);
    },
    assignID: (data) => {
        window.userID = data.id;
        window.username = data.username;
        if(window.location.pathname == "/"){
        const logoutButton = document.querySelector('.logout-button');
        if (window.username === "Guest" ){
            logoutButton.textContent = "Login";
            logoutButton.onclick = function() {
                window.location.href = '/account';
        }}}
    },
    clientDisconnect: (data) => {
        window.location.href = '/';
    },
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