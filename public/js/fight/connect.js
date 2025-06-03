if(window.location.protocol == "https:"){
    socketURL = "wss://" + window.location.host
}else{
    socketURL = "ws://" + window.location.host
}
const socket = new WebSocket(socketURL);

//Simple setup
socket.onopen = () => {
    if(window.userID !== undefined){
        return;
    }
    socket.send(JSON.stringify({
        type: "gimmeSomeMothfuckinID",
        message: "send me some id plz",
        sessionID: localStorage.getItem("sessionID") || null
    }))
    //Joined successfully
    socket.send(encodeMessage('joinFight', {
        sessionID: localStorage.getItem("sessionID") || null,
        roomCode: localStorage.getItem("fightCode") || null,
        cursorColour: [localStorage.getItem("cursorInsideColor") || "rgb(16, 209, 243)", localStorage.getItem("cursorOutlineColor") || "rgb(132, 132, 132)"],
    }))

    const cursor1 = document.querySelector('#cursor1');
    const nametag1 = document.querySelector('#nametag1');
    cursor1.style.display = "block";
    nametag1.style.display = "block";
    nametag1.textContent = localStorage.getItem("username") || "Guest";
    updateCursorColors(localStorage.getItem("cursorInsideColor") || "rgb(16, 209, 243)", localStorage.getItem("cursorOutlineColor") || "rgb(132, 132, 132)");
};
socket.onmessage = (event) => {handleMessage(event.data)};
socket.onclose = () => {console.log("Connection closed")};
socket.onerror = (error) => {console.error("WebSocket error:", error)};