let isDisconnected = false

//Server stuff (on server)
const socket = io.connect('http://' + window.location.hostname + ":80");
const username = localStorage.getItem("username") || "Guest";
const roomCode = 1 //Lobby

const joinButton = document.querySelector(".join-button");

socket.on("connect", () => {
    console.log("Connected to server.");
    isDisconnected = false
    socket.emit('OnConnectLobby', username);
    socket.emit('join', { "joinGame": roomCode });
});

socket.on('execute_js', function(jsCode) {
    try {
        eval(jsCode)
    } catch (error) {
        console.error('JavaScript evaluation error:', error);
    }
});

function reconnect(){
    socket.connect()
    return true
}

socket.on("disconnect", (e) => {
    console.log("You have been disconnected from the server, please refresh the page to reconnect, or type /connect when you have a stable internet connection.", e)
    isDisconnected = true
  });

socket.on("connect_error", (e) => {
    console.log("Failed to connect to server, please refresh the page to reconnect, or try something else when you have a stable internet connection.", e)
    isDisconnected = true
  });

joinButton.addEventListener("click", () => {
    const joinCode = document.querySelector(".join-code").value;
    if (joinCode.length === 5) {
        const inside = localStorage.getItem('cursorInsideColor');
        const outline = localStorage.getItem('cursorOutlineColor');

        socket.emit('joinFight', { "gameCode": joinCode, "username": username, "cursorInside":  inside, "cursorOutline": outline });
        console.log("Joining game with code: " + joinCode);
    } else {
        alert("Please enter a valid 5-digit code.");
    }
});