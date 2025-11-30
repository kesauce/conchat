const readline = require("readline");
const WebSocket = require('ws');

const ws = new WebSocket("ws://localhost:8080");

// Listen for messages and executes when a message is received from the server.
ws.on('message', (message) => {
    console.log('Message from server: ', message.toString());
});

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout,
})

rl.on("line", (message) => {
    ws.send(message);
});