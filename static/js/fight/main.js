//Everything the player sees during gameplay


// TODO: Fix octal literals error and add quick play
//Octal literals erro casued by the room code starting with 0 and then somewhere its being treated as an int... I think
const cursor = document.getElementById('cursor1');
const cursor2 = document.getElementById('cursor2');
const nametag1 = document.getElementById('nametag1');
const nametag2 = document.getElementById('nametag2');
const myHeart1 = document.getElementById('heartImage');
const myHeart2 = document.getElementById('heartImage2');
const myHeart3 = document.getElementById('heartImage3');
const enemyHeart1 = document.getElementById('altHeartImage');
const enemyHeart2 = document.getElementById('altHeartImage2');
const enemyHeart3 = document.getElementById('altHeartImage3');
const scoreboard = document.getElementById('score');
const winlossscreen = document.getElementById('winLossScreen');
const winLossMessage = document.getElementById('winLossMessage');
let elementOrder = [myHeart1, myHeart2, myHeart3]
let elementOrderEnemy = [enemyHeart1, enemyHeart2, enemyHeart3]

let firstPos = [];
let secondPos = [];

let firstPosQueue = [];
let secondPosQueue = [];

let canAttack = true;

let canUpdate = true;
const scale = window.innerWidth / 1920;

let firstPlayer = localStorage.getItem("player") || "True"; //True if is player 1
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

function toWorldCoords(x, y) {
    return {
        x: x / scale,
        y: y / scale
    };
}

function toScreenCoords(x, y) {
    return {
        x: x * scale,
        y: y * scale
    };
}

function processSocketUpdates() {
    if (firstPlayer == "False") { // Receiving stuff from the host
        if (firstPosQueue.length > 0) {
            const data = firstPosQueue.shift();
            firstPos = data;
            const screenCoords = toScreenCoords(firstPos[0], firstPos[1]);
            firstPos[0] = screenCoords.x;
            firstPos[1] = screenCoords.y;
            cursor2.style.display = 'block';
            cursor2Target.x = firstPos[0];
            cursor2Target.y = firstPos[1];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = firstPos[0];
                cursor2Current.y = firstPos[1];
            }
        }
    } else { // Receiving stuff from the client
        if (secondPosQueue.length > 0) {
            const data = secondPosQueue.shift();
            secondPos = data;
            console.log("new players cursor colours", secondPos[3])
            const screenCoords = toScreenCoords(secondPos[0], secondPos[1]);
            secondPos[0] = screenCoords.x;
            secondPos[1] = screenCoords.y;
            cursor2.style.display = 'block';
            cursor2Target.x = secondPos[0];
            cursor2Target.y = secondPos[1];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = secondPos[0];
                cursor2Current.y = secondPos[1];
            }
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

socket.on("playerHit", function(data){
    const player_hit = data["hit"];

    if(player_hit == "player1" && firstPlayer == "True"){
        cursor1.classList.add("blink");
        setTimeout(() => {
            cursor1.classList.remove("blink");
        }, 3000);
    }else if(player_hit == "player1" && firstPlayer == "False"){
        cursor2.classList.add("blink");
        setTimeout(() => {
            cursor2.classList.remove("blink");
        }, 3000);
    }

    if(player_hit == "player2" && firstPlayer == "True"){
        cursor2.classList.add("blink");
        setTimeout(() => {
            cursor2.classList.remove("blink");
        }, 3000);
    }else if(player_hit == "player2" && firstPlayer == "False"){
        cursor1.classList.add("blink");
        setTimeout(() => {
            cursor1.classList.remove("blink");
        }, 3000);
    }

})

socket.on("updateGameState", function(data){
    const player1_health = data.player1.data["health"];
    const player2_health = data.player2.data["health"];
    const player1_score = data.player1.data["points"];
    const player2_score = data.player2.data["points"];

    if(firstPlayer == "True") {
        scoreboard.textContent = `Score: ${player1_score} - ${player2_score}`;
        myHeart1.style.display = player1_health >= 1 ? 'block' : 'none';
        myHeart2.style.display = player1_health >= 2 ? 'block' : 'none';
        myHeart3.style.display = player1_health >= 3 ? 'block' : 'none';
        enemyHeart1.style.display = player2_health >= 1 ? 'block' : 'none';
        enemyHeart2.style.display = player2_health >= 2 ? 'block' : 'none';
        enemyHeart3.style.display = player2_health >= 3 ? 'block' : 'none';
    } else {
        scoreboard.textContent = `Score: ${player2_score} - ${player1_score}`;
        myHeart1.style.display = player2_health >= 1 ? 'block' : 'none';
        myHeart2.style.display = player2_health >= 2 ? 'block' : 'none';
        myHeart3.style.display = player2_health >= 3 ? 'block' : 'none';
        enemyHeart1.style.display = player1_health >= 1 ? 'block' : 'none';
        enemyHeart2.style.display = player1_health >= 2 ? 'block' : 'none';
        enemyHeart3.style.display = player1_health >= 3 ? 'block' : 'none';
    
    }
})

socket.on("receiveAttack", function(data) {
    //Nah we will only send the event to the player who didnt call it 
    const attackPos = [data[0], data[1]];

    const body = document.querySelector('body');
    const square = document.createElement('div');
    square.classList.add("square");

    square.style.left = attackPos[0] * scale + 'px';
    square.style.top = attackPos[1] * scale + 'px';

    body.appendChild(square);
    setTimeout(() => {
        body.removeChild(square);
    }, 500); // Remove the square after 1 second
})

socket.on("disconnect", async function(data) {
    if (data != "io client disconnect"){
        await fetch('/removeGame', { //Remove game from server if client disconnects (only works if they regain connection tho)
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fightCode: roomCode, isQuickplay: localStorage.getItem("isQuickplay") || "False" })
        });
        window.location.href = "/";
    }
});

function sendFirstPos(pos) {
    const realPos = toWorldCoords(pos[0], pos[1]);
    pos[0] = realPos.x;
    pos[1] = realPos.y;
    socket.emit("updateFirstPosition", pos);
}

function sendSecondPos(pos) {
    const realPos = toWorldCoords(pos[0], pos[1]);
    pos[0] = realPos.x;
    pos[1] = realPos.y;
    socket.emit("updateSecondPosition", pos);
}

function sendAttack() {
    console.log("isplayer1", localStorage.getItem("player"))
    socket.emit("attackPlayer", [roomCode, localStorage.getItem("player")]);
}

function handle_game_state(data) {
    const isPlayer1 = localStorage.getItem("player");
    if (isPlayer1 == "True") {//They are player 1 and testing if player 2 joined
        if (data.player2 != "None") {
            nametag2.textContent = data.player2.name;
            cursor2.style.display = 'block';
            cursor2Target.x = data.player2.data["pos_x"];
            cursor2Target.y = data.player2.data["pos_y"];
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Target.x = data.player2.data["pos_x"];
                cursor2Target.y = data.player2.data["pos_y"];
            }
            updatePlayer2CursorColors(data.player2.data["cursor_data"]);
        }
    } else {
        if (data.player1 != "None") {
            cursor2.style.display = 'block';
            nametag2.textContent = data.player1.name;
            cursor2Target.x = data.player1.data["pos_x"];
            cursor2Target.y = data.player1.data["pos_y"];
            nametag2.style.display = 'block';
            if (cursor2Current.x === 0 && cursor2Current.y === 0) {
                cursor2Current.x = data.player1.data["pos_x"];
                cursor2Current.y = data.player1.data["pos_y"];
            }
            updatePlayer2CursorColors(data.player1.data["cursor_data"]);
        }
    }
}

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && canAttack) { // LMB
        //Perhaps show some attack animation?
        canAttack = false;

        sendAttack();

        setTimeout(() => { //This doesnt really matter because the server will handle the attack cooldown
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
    pos = [e.clientX + 3 - cursor.width / 2, e.clientY + 3 - cursor.height / 2, roomCode];
    if (firstPlayer == "True") {
        sendFirstPos(pos);
    } else {
        sendSecondPos(pos);
    }
});