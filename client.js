const readline = require("readline");
const WebSocket = require('ws');

const ws = new WebSocket("ws://localhost:8080");
var username = '';

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout,
})

// Listen for messages and executes when a message is received from the server.
ws.on('message', (message) => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    console.log(message.toString());
    rl.prompt();
});

// User customisation
rl.question('Enter your username: ', (name) => {
    username = name.trim() || 'Anonymous';

    // Set the prompt to show username
    rl.setPrompt(`${username}: `);
    rl.prompt();
});


rl.on("line", (text) => {
    text = text.trim();

    if (!text) {
        rl.prompt();
        return;
    }

    ws.send(JSON.stringify({ username: username, text: text }));
    rl.prompt();
});