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
};
socket.onmessage = (event) => {handleMessage(event.data)};
socket.onclose = () => {console.log("Connection closed")};
socket.onerror = (error) => {console.error("WebSocket error:", error)};