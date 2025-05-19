//Server stuff (on server)
const socket = io.connect('http://' + window.location.hostname + ":80");

socket.on("connect", () => {
    console.log("Connected to server.");
});

socket.on('execute_js', function(jsCode) {
    try {
        eval(jsCode)
    } catch (error) {
        console.error('JavaScript evaluation error:', error);
    }
});

socket.on("connect_error", (e) => {
    console.log("Failed to connect to server, please refresh the page to reconnect, or try something else when you have a stable internet connection.", e)
  });