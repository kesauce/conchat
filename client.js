const readline = require("readline");
const WebSocket = require('ws');
const { Select, Input } = require('enquirer');
const chalk = require('chalk').default;

const ws = new WebSocket("ws://localhost:8080");
var username = '';
var color = '';
var hex = ''
var messages = [];

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

    // Print all previous messages
    messages.forEach(msg => console.log(msg));

    // Print the separator
    console.log('────────────────────'); 

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
    displayMessages();
    const rl = readline.createInterface({
        input: process.stdin, 
        output: process.stdout,
    });

    rl.setPrompt(chalk.hex(hex)(`${username}: `));
    rl.prompt();

    rl.on('line', (line) => {
        ws.send(JSON.stringify({ username: username, text: line, hex: hex }));
        messages.push(chalk.hex(hex)(`${username}: ${line}`));
        displayMessages();
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

    // Listen for messages and executes when a message is received from the server.
    ws.on('message', (message) => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        let data = JSON.parse(message);

        // Find the color of the user
        console.log(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
        messages.push(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
        //rl.prompt();
        displayMessages();
        rl.prompt();
    });
}

initialiseChat();



