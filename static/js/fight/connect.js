//Stuff relating to setuping the fight on the server

let isDisconnected = false

//Server stuff (on server)
const socket = io.connect('http://' + "localhost" + ":80");
const username = localStorage.getItem("username") || "Guest";
const roomCode = localStorage.getItem("fightCode"); //Fight room code

if (roomCode === null || roomCode === undefined || roomCode === "1") { //If its 1 then some little shit has tempted fate sigma
    console.log("No room code found, redirecting to lobby.");
    window.location.href = '../';
}

socket.on("connect", () => {
    console.log("Connected to server.");
    isDisconnected = false
    socket.emit('connectFight', { "fightCode": roomCode, "username": username});
    socket.emit('OnConnectFight', { "fightCode": roomCode, "username": username, "isPlayer1": localStorage.getItem("player")});

});

socket.on('execute_js', function(jsCode) {
    try {
        eval(jsCode)
    } catch (error) {
        console.error('JavaScript evaluation error:', error);
    }
});

socket.on("disconnect", (e) => {
    console.log("You have been disconnected from the server, please refresh the page to reconnect, or type /connect when you have a stable internet connection.", e)
    isDisconnected = true
  });

socket.on("connect_error", (e) => {
    console.log("Failed to connect to server, please refresh the page to reconnect, or try something else when you have a stable internet connection.", e)
    isDisconnected = true
  });//Update to remove user from fight