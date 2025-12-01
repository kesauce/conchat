const readline = require("readline");
const WebSocket = require('ws');
const { Select, Input } = require('enquirer');
const { stdout } = require("process");
const { read } = require("fs");
const chalk = require('chalk').default;

const ws = new WebSocket("ws://localhost:8080");
let username = '';
let color = '';
let hex = ''
let messages = [];
let rl;
const separator = '────────────────────────────';

const palette = [
    {name: 'White', hex: '#e0def4'},
    {name: 'Love', hex: '#eb6f92'},
    {name: 'Gold', hex: '#f6c177'},
    {name: 'Rose', hex: '#ea9a97'},
    {name: 'Pine', hex: '#3e8fb0'},
    {name: 'Foam', hex: '#9ccfd8'},
    {name: 'Iris', hex: '#c4a7e7'}
]
const colorPrompt = new Select({
    name: 'color',
    message: 'Pick your color',
    choices: palette.map(p => ({
        name: p.name,
        message: chalk.hex(p.hex)(p.name)
    }))
});

function displayMessages(){
    // Clear the console
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    readline.cursorTo(process.stdout, 0, process.stdout.rows - 2);

    // // Print all previous messages
    // messages.forEach(msg => console.log(msg));

    // Print the separator
    console.log('────────────────────────────'); 
    rl.setPrompt(chalk.hex(hex)(`${username}: `));
    rl.prompt();
}

async function initialiseChat() {
    const usernameReadLine = readline.createInterface({
        input: process.stdin, 
        output: process.stdout,
    });
    usernameReadLine.question('Enter your username: ', (name) => {
        username = name.trim() || 'Anonymous';

        usernameReadLine.close();

        colorPrompt.run().then(selectedColor => {
            color = selectedColor;
            hex = palette.find(c => c.name === color).hex;

            startChat();
        });
    });    
}

async function startChat(){
    
    rl = readline.createInterface({
        input: process.stdin, 
        output: process.stdout,
    });
    displayMessages();

    rl.on('line', (line) => {
        ws.send(JSON.stringify({ username: username, text: line, hex: hex }));
        readline.moveCursor(process.stdout, 0, -2);
        readline.clearLine(process.stdout, 0);
        console.log(chalk.hex(hex)(`${username}: ${line}`));
        readline.clearLine(process.stdout, 0);
        console.log('────────────────────────────');
        rl.prompt();
    });

    // Listen for messages and executes when a message is received from the server.
    ws.on('message', (message) => {
        let data = JSON.parse(message);

        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);

        // Find the color of the user
        console.log(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
        console.log('────────────────────────────');
        messages.push(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
        rl.prompt();
    });

    // Ensures the user types in their designated colour
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(chalk.hex(hex)(`${username}: ${rl.line}`));
    });
}

initialiseChat();



