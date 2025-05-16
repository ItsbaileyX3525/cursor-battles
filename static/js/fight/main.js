//Everything the player sees during gameplay

const cursor = document.getElementById('cursor1');
const cursor2 = document.getElementById('cursor2');
const nametag1 = document.getElementById('nametag1');
const nametag2 = document.getElementById('nametag2');

let firstPos = [];
let secondPos = [];

let firstPosQueue = [];
let secondPosQueue = [];

let canAttack = true;

let canUpdate = true;

let firstPlayer = localStorage.getItem("player"); //True if is player 1
nametag1.textContent = localStorage.getItem("username") || "Guest";

let cursor2Current = { x: 0, y: 0 };
let cursor2Target = { x: 0, y: 0 };
let lerpSpeed = 0.15; // Adjust for smoothness

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function positionNametag(nametag, cursorEl) {
    nametag.style.left = (parseFloat(cursorEl.style.left) + cursorEl.width / 2 - nametag.offsetWidth / 2) + 'px';
    nametag.style.top = (parseFloat(cursorEl.style.top) - 10) + 'px';
}

function animateCursor2() {
    cursor2Current.x = lerp(cursor2Current.x, cursor2Target.x, lerpSpeed);
    cursor2Current.y = lerp(cursor2Current.y, cursor2Target.y, lerpSpeed);
    cursor2.style.left = cursor2Current.x + 'px';
    cursor2.style.top = cursor2Current.y + 'px';
    if (cursor2.style.display !== 'none') {
        nametag2.style.display = 'block';
        positionNametag(nametag2, cursor2);
    } else {
        nametag2.style.display = 'none';
    }
    requestAnimationFrame(animateCursor2); //Updates every frame
}

requestAnimationFrame(animateCursor2); //Same as above ^^^

function isColliding(el1, el2) {
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    return !(
        r1.right-12 < r2.left ||
        r1.left-12 > r2.right ||
        r1.bottom-12 < r2.top ||
        r1.top-12 > r2.bottom
    );
}

function processSocketUpdates() {
    if (firstPlayer == "False") { // Receiving stuff from the host
        if (firstPosQueue.length > 0) {
            console.log("Player 1 update")
            const data = firstPosQueue.shift();
            firstPos = data;
            cursor2.style.display = 'block';
            cursor2Target.x = firstPos[0];
            cursor2Target.y = firstPos[1];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = firstPos[0];
                cursor2Current.y = firstPos[1];
            }
            updatePlayer2CursorColors(firstPos[3]);
        }
    } else { // Receiving stuff from the client
        if (secondPosQueue.length > 0) {
            console.log("Player 2 update")
            const data = secondPosQueue.shift();
            secondPos = data;
            cursor2.style.display = 'block';
            cursor2Target.x = secondPos[0];
            cursor2Target.y = secondPos[1];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = secondPos[0];
                cursor2Current.y = secondPos[1];
            }
            updatePlayer2CursorColors(secondPos[3]);
        }
    }

    requestAnimationFrame(processSocketUpdates); // Continue processing updates
}

// Queue incoming socket data
if (firstPlayer == "False") {
    socket.on("FirstPos", function(data) {
        const MAX_QUEUE_LENGTH = 60;
        if (firstPosQueue.length < MAX_QUEUE_LENGTH) {
            firstPosQueue.push(data);
        }else{
            firstPosQueue = [] //Reset if too long
        }
        
    });
} else {
    socket.on("SecondPos", function(data) {
        const MAX_QUEUE_LENGTH = 60;
        if (secondPosQueue.length < MAX_QUEUE_LENGTH) {
            secondPosQueue.push(data);
        }else{
            secondPosQueue = [] //Reset if too long
        }
        
    });
}

// Start processing updates
requestAnimationFrame(processSocketUpdates);

socket.on("receiveAttack", function(data) {
    //Nah we will only send the event to the player who didnt call it 
    console.log("Recieved attack event: ", data);
    const isPlayer1 = data[2];
    const attackPos = [data[0], data[1]];

    const body = document.querySelector('body');
    const square = document.createElement('div');
    square.classList.add("square");

    square.style.left = attackPos[0] + 'px';
    square.style.top = attackPos[1] + 'px';

    body.appendChild(square);
    setTimeout(() => {
        body.removeChild(square);
    }, 1000); // Remove the square after 1 second

    if(isPlayer1 == "True" && firstPlayer == "False") {
        //Player 2 sent attack, player 1 gets hurt
        if (isColliding(cursor, square)) {
            console.log("Player 1 got hit");
            //Do code related to getting hurt ig
        }
    }
    else if(isPlayer1 == "False" && firstPlayer == "True") {
        //Player 1 sent attack, player 2 gets hurt
        if (isColliding(cursor, square)) {
            console.log("Player 2 got hit");
            //Do code related to getting hurt ig
        }
    }

})

function sendFirstPos(pos) {
    socket.emit("updateFirstPosition", pos);
}

function sendSecondPos(pos) {
    socket.emit("updateSecondPosition", pos);
}

function sendAttack(attackPos) {
    socket.emit("attackPlayer", { "fightCode": roomCode, "attackData": [attackPos[0], attackPos[1]], "isPlayer1": localStorage.getItem("player") });
    console.log("Attack sent");
}

function update_game_state(data) {
    if (!canUpdate) return; //Prevent sending too many updates
    canUpdate = false;
    console.log("Updatd game state with:", data);
    socket.emit("updateGameState", { "fightCode": roomCode, "username": username, "isPlayer1": localStorage.getItem("player"), "GameData": data });
}

function allowGameStateUpdate() {
    setInterval(() => {
        canUpdate = true;
    }, 2000);
}
allowGameStateUpdate();


allowGameStateUpdate();

function handle_game_state(data) {
    console.log("Received game state:", data);
    const isPlayer1 = localStorage.getItem("player");
    if (isPlayer1 == "True") {//They are player 1 and testing if player 2 joined
        console.log("Server thinks you are player 1");
        if (data.player2 != "None") {
            nametag2.textContent = data.player2.name;
            cursor2.style.display = 'block';
            cursor2Target.x = data.player2.data[0];
            cursor2Target.y = data.player2.data[1];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = data.player2.data[0];
                cursor2Current.y = data.player2.data[1];
            }
            updatePlayer2CursorColors(data.player2.data[3]);
        }
    } else {
        if (data.player1 != "None") {
            cursor2.style.display = 'block';
            nametag2.textContent = data.player1.name;
            cursor2Target.x = data.player1.data[0];
            cursor2Target.y = data.player1.data[1];
            nametag2.style.display = 'block';
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = data.player1.data[0];
                cursor2Current.y = data.player1.data[1];
            }
            updatePlayer2CursorColors(data.player1.data[3]);
        }
    }
}

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && canAttack) { // LMB
        //Perhaps show some attack animation?
        canAttack = false;

        const squareSize = 80;
        const x = e.clientX - squareSize / 2;
        const y = e.clientY - squareSize / 2;

        pos = [x, y, squareSize];
        sendAttack(pos);

        setTimeout(() => {
            canAttack = true;
        }, 750);
    }
});

document.addEventListener('mousemove', (e) => {//Update current player cursor
    cursor.style.display = 'block';
    nametag1.style.display = 'block';
    cursor.style.left = (e.clientX + 3 - cursor.width / 2) + 'px';
    cursor.style.top = (e.clientY + 3 - cursor.height / 2) + 'px';
    positionNametag(nametag1, cursor);
    pos = [e.clientX + 3 - cursor.width / 2, e.clientY + 3 - cursor.height / 2, roomCode, [insideColor, outlineColor]];
    update_game_state(pos);
    if (firstPlayer == "True") {
        sendFirstPos(pos);
    } else {
        sendSecondPos(pos);
    }
});