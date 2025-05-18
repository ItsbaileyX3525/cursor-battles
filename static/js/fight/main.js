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

let firstPlayer = localStorage.getItem("player"); //True if is player 1
nametag1.textContent = localStorage.getItem("username") || "Guest";

let MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility = false;
let currentScore = [0,0];
let myHP = 3;
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
            console.log("Other player is lagging, resetting queue");
        }
        
    });
} else {
    socket.on("SecondPos", function(data) {
        const MAX_QUEUE_LENGTH = 60;
        if (secondPosQueue.length < MAX_QUEUE_LENGTH) {
            secondPosQueue.push(data);
        }else{
            secondPosQueue = [] //Reset if too long
            console.log("Other player is lagging, resetting queue");
        }
        
    });
}

// Start processing updates
requestAnimationFrame(processSocketUpdates);

socket.on("updateHealth", function(data){
    //Called when the player gets hurt
    const playerDamanged = data[0];
    const newEnemyHP = data[1];

    if(firstPlayer == "True" && playerDamanged == "2"){ 
        //You are player 1 and player 2 got hurt, so update player 2s heart
        elementOrderEnemy[newEnemyHP].style.backgroundImage = "url('/static/assets/background.png')";
        
        //Player hit so give them blink effect to indicate invincibility
        cursor2.classList.add('blink');
        setTimeout(() => {
            cursor2.classList.remove('blink');
        }, 3000); // Remove the blink effect

        if(newEnemyHP == 0){
            //Update scoreboard, player 2 lost all hearts so update my score
            currentScore[0] += 1;
            scoreboard.textContent = currentScore[0] + " - " + currentScore[1];

            if (currentScore[0] == 3){//you, player 1, won
                winlossscreen.style.display = 'flex';
                winLossMessage.textContent = "You won!";
                cursor.style.display = 'none';
                nametag1.style.display = 'none';
                cursor2.style.display = 'none';
                nametag2.style.display = 'none';
                //Display some victory screen
                //Perhaps play some victory sound
                
                //Will have to use post to update the stats
                fetch('/updateStats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ outcome: true })
                });

                //Disconnect from server
                socket.disconnect();
            }else{
                //reset health and hp variables
                myHP = 3;
                for (let i = 0; i < elementOrderEnemy.length; i++) {
                    elementOrderEnemy[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
                for (let i = 0; i < elementOrder.length; i++) {
                    elementOrder[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
            }
        }
    }else if(firstPlayer == "False" && playerDamanged == "1"){ 
        //You are player 2 and player 1 got hurt, so update player 1s heart
        elementOrderEnemy[newEnemyHP].style.backgroundImage = "url('/static/assets/background.png')";
        
        //Player hit so give them blink effect to indicate invincibility
        cursor2.classList.add('blink');
        setTimeout(() => {
            cursor2.classList.remove('blink');
        }, 3000); // Remove the blink effect

        if(newEnemyHP == 0){
            currentScore[0] += 1;
            scoreboard.textContent = currentScore[0] + " - " + currentScore[1];

            if (currentScore[0] == 3){//you, player 2, won
                winlossscreen.style.display = 'flex';
                winLossMessage.textContent = "You won!";
                cursor.style.display = 'none';
                nametag1.style.display = 'none';
                cursor2.style.display = 'none';
                nametag2.style.display = 'none';
                //Display some victory screen
                //Perhaps play some victory sound
                
                fetch('/updateStats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ outcome: true })
                });

                //Disconnect from server
                socket.disconnect();
            }else{
                //reset health and hp variables
                myHP = 3;
                for (let i = 0; i < elementOrderEnemy.length; i++) {
                    elementOrderEnemy[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
                for (let i = 0; i < elementOrder.length; i++) {
                    elementOrder[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
            }
        }
    }    
})

socket.on("receiveAttack", function(data) {
    //Nah we will only send the event to the player who didnt call it 
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
        //You are player 1 and player 2 sent the attack
        if (isColliding(cursor, square) && !MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility) {
            myHP--;
            elementOrder[myHP].style.backgroundImage = "url('/static/assets/background.png')";
            socket.emit("UpdatePlayerHealth", [roomCode, "2", myHP]);
            MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility = true;
            cursor.classList.add('blink');
            setTimeout(() => {
                cursor.classList.remove('blink');
                MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility = false;
            }, 3000); // Remove the blink effect

            if(myHP == 0) {
                currentScore[1] += 1;
                scoreboard.textContent = currentScore[0] + " - " + currentScore[1];

                if (currentScore[1] == 3){
                    winlossscreen.style.display = 'flex';
                    winLossMessage.textContent = "You lost!";
                    cursor.style.display = 'none';
                    nametag1.style.display = 'none';
                    cursor2.style.display = 'none';
                    nametag2.style.display = 'none';
                    //Display some loss screen
                    //Perhaps play a loss sound

                    //say to the server that we lost
                    fetch('/updateStats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ outcome: false })
                    });

                    //Disconnect from server
                    socket.disconnect();
                }else{
                    //reset health and hp variables
                    myHP = 3;
                    for (let i = 0; i < elementOrderEnemy.length; i++) {
                        elementOrderEnemy[i].style.backgroundImage = "url('/static/assets/heart.png')";
                    }
                    for (let i = 0; i < elementOrder.length; i++) {
                        elementOrder[i].style.backgroundImage = "url('/static/assets/heart.png')";
                    }
            }
            }
        }
    }
    else if(isPlayer1 == "False" && firstPlayer == "True") {
        //If you are player 2 and player 1 sent the attack
        if (isColliding(cursor, square) && !MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility) {
            myHP--;
            elementOrder[myHP].style.backgroundImage = "url('/static/assets/background.png')";
            socket.emit("UpdatePlayerHealth", [roomCode, "1", myHP]);
            MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility = true;
            cursor.classList.add('blink');
            setTimeout(() => {
                cursor.classList.remove('blink');
                MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility = false;
            }, 3000); // Remove the blink effect after 1 second

            if(myHP == 0) {
                currentScore[1] += 1;
                scoreboard.textContent = currentScore[0] + " - " + currentScore[1];
                
                if (currentScore[1] == 3){
                    //Player 1 won (you, player 2, lost)
                    winlossscreen.style.display = 'flex';
                    winLossMessage.textContent = "You lost!";
                    cursor.style.display = 'none';
                    nametag1.style.display = 'none';
                    cursor2.style.display = 'none';
                    nametag2.style.display = 'none';
                    //Display some loss screen
                    //Perhaps play a loss sound

                    fetch('/updateStats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ outcome: false })
                    });

                    //Disconnect from server
                    socket.disconnect();
                }else{
                //reset health and hp variables
                myHP = 3;
                for (let i = 0; i < elementOrderEnemy.length; i++) {
                    elementOrderEnemy[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
                for (let i = 0; i < elementOrder.length; i++) {
                    elementOrder[i].style.backgroundImage = "url('/static/assets/heart.png')";
                }
            }
            }
        }
    }

})

socket.on("disconnect", function(data) {
    if (data == "io client disconnect"){
        //idk what I was gonna put here tbh
        pass
    }
});

function sendFirstPos(pos) {
    socket.emit("updateFirstPosition", pos);
}

function sendSecondPos(pos) {
    socket.emit("updateSecondPosition", pos);
}

function sendAttack(attackPos) {
    socket.emit("attackPlayer", { "fightCode": roomCode, "attackData": [attackPos[0], attackPos[1]], "isPlayer1": localStorage.getItem("player") });
}

function update_game_state(data) {
    if (!canUpdate) return; //Prevent sending too many updates
    canUpdate = false;
    socket.emit("updateGameState", { "fightCode": roomCode, "username": username, "isPlayer1": localStorage.getItem("player"), "GameData": data });
}

pos = [100, 100, roomCode, [insideColor, outlineColor]];
update_game_state(pos); //Send initial position

setInterval(() => {
    canUpdate = true;
}, 2000);

function handle_game_state(data) {
    const isPlayer1 = localStorage.getItem("player");
    if (isPlayer1 == "True") {//They are player 1 and testing if player 2 joined
        if (data.player2 != "None") {
            console.log("Welcome:", data.player2.name);
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
    if (e.button === 0 && canAttack && !MakeMeInvinciblePlsDontCheatThisLiterallyGivesYouInvincibility) { // LMB
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