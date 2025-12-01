const readline = require("readline");
const WebSocket = require('ws');
const { Select } = require('enquirer');
const chalk = require('chalk').default;

const ws = new WebSocket("ws://localhost:8080");
var username = '';
var color = '';

const palette = [
    {name: 'White', hex: '#e0def4'},
    {name: 'Love', hex: '#eb6f92'},
    {name: 'Gold', hex: '#f6c177'},
    {name: 'Rose', hex: '#ea9a97'},
    {name: 'Pine', hex: '#3e8fb0'},
    {name: 'Foam', hex: '#9ccfd8'},
    {name: 'Iris', hex: '#c4a7e7'}
]

async function startChat() {
    const usernameReadLine = readline.createInterface({
        input: process.stdin, 
        output: process.stdout,
    })
    usernameReadLine.question('Enter your username: ', (name) => {
        username = name.trim() || 'Anonymous';

        usernameReadLine.close();

        const colorPrompt = new Select({
        name: 'color',
        message: 'Pick your color',
        choices: palette.map(p => ({
            name: p.name,
            message: chalk.hex(p.hex)(p.name)
            }))
        });

        colorPrompt.run().then(selectedColor => {
            color = selectedColor;

            const chatReadLine = readline.createInterface({
                input: process.stdin, 
                output: process.stdout,
                prompt: `${username}: `
            })

            chatReadLine.prompt();

            chatReadLine.on("line", (text) => {
                if (!text) {
                    chatReadLine.prompt();
                    return;
                }

                ws.send(JSON.stringify({ username: username, text: text.trim(), color: color}));
                chatReadLine.prompt();
            });
            
            // Listen for messages and executes when a message is received from the server.
            ws.on('message', (message) => {
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0);

                let data = JSON.parse(message);

                // Find the color of the user
                const color = palette.find(c => c.name === data.color);
                console.log(chalk.hex(color.hex)(`${data.username}: ${data.text}`));
                chatReadLine.prompt();
            });
        });
    });    
}

startChat();

