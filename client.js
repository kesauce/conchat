#!/usr/bin/env node
const readline = require("readline");
const WebSocket = require('ws');
const { Select } = require('enquirer');
const { stdout } = require("process");
const { read } = require("fs");
const chalk = require('chalk').default;
const term = require( 'terminal-kit' ).terminal ;

const ws = new WebSocket("https://conchat-ns3b.onrender.com");
let username = '';
let color = '';
let hex = ''
let connectionType;
let roomNumber;
let messages = [];

const palette = [
    {name: 'White', hex: '#e0def4'},
    {name: 'Love', hex: '#eb6f92'},
    {name: 'Gold', hex: '#f6c177'},
    {name: 'Rose', hex: '#ea9a97'},
    {name: 'Pine', hex: '#3e8fb0'},
    {name: 'Foam', hex: '#9ccfd8'},
    {name: 'Iris', hex: '#c4a7e7'}
]
// const colorPrompt = new Select({
//     name: 'color',
//     message: 'Pick your color',
//     choices: palette.map(p => ({
//         name: p.name,
//         message: chalk.hex(p.hex)(p.name)
//     })),
//     symbols: {
//         symbols: '',
//         prefix: chalk.white(`☆`),
//         ellipsis: '',
//     }
// });

// function displayMessages(){
//     // Clear the console
//     readline.cursorTo(process.stdout, 0, 0);
//     readline.clearScreenDown(process.stdout);
//     readline.cursorTo(process.stdout, 0, process.stdout.rows - 2);

//     // // Print all previous messages
//     // messages.forEach(msg => console.log(msg));

//     // Print the separator
//     console.log('────────────────────────────'); 
//     rl.setPrompt(chalk.hex(hex)(`${username}: `));
//     rl.prompt();
// }

// async function initialiseChat() {
//     const usernameReadLine = readline.createInterface({
//         input: process.stdin, 
//         output: process.stdout,
//     });
//     usernameReadLine.question('☆ Enter your username: ', (name) => {
//         username = name.trim() || 'Anonymous';

//         usernameReadLine.close();

//         colorPrompt.run().then(selectedColor => {
//             color = selectedColor;
//             hex = palette.find(c => c.name === color).hex;

//             startChat();
//         });
//     });    
// }

// async function startChat(){
    
//     rl = readline.createInterface({
//         input: process.stdin, 
//         output: process.stdout,
//     });
//     displayMessages();

//     rl.on('line', (line) => {
//         ws.send(JSON.stringify({ username: username, text: line, hex: hex }));
//         readline.moveCursor(process.stdout, 0, -2);
//         readline.clearLine(process.stdout, 0);
//         console.log(chalk.hex(hex)(`${username}: ${line}`));
//         readline.clearLine(process.stdout, 0);
//         console.log('────────────────────────────');
//         rl.prompt();
//     });

//     // Listen for messages and executes when a message is received from the server.
//     ws.on('message', (message) => {
//         let data = JSON.parse(message);

//         readline.cursorTo(process.stdout, 0);
//         readline.moveCursor(process.stdout, 0, -1);
//         readline.clearLine(process.stdout, 0);

//         // Find the color of the user
//         console.log(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
//         console.log('────────────────────────────');
//         messages.push(chalk.hex(data.hex)(`${data.username}: ${data.text}`));
//         rl.prompt();
//     });

//     // Ensures the user types in their designated colour
//     readline.emitKeypressEvents(process.stdin);
//     process.stdin.setRawMode(true);

//     process.stdin.on('keypress', (str, key) => {
//         readline.clearLine(process.stdout, 0);
//         readline.cursorTo(process.stdout, 0);
//         process.stdout.write(chalk.hex(hex)(`${username}: ${rl.line}`));
//     });
// }

// initialiseChat();

/**
 * Colours a string using ANSI codes.
 * @param {String} h Hex code
 * @param {String} text The text to display
 * @returns The coloured string
 */
function colorString(h, text) {
    h = h.replace('#', '');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

async function initialiseUser(){
    // Asking user for their username and designated colour
    term.bold('★ Enter your username: ');
    username = await term.inputField().promise;
    username = username || 'Anonymous';

    term('\n');

    const colorPrompt = new Select({
        name: 'color',
        message: 'Pick your color: ',
        choices: palette.map(p => ({
            name: colorString(p.hex, p.name),
            message: colorString(p.hex, p.name),
            value: p.name
        })),
        symbols: {
            symbols: '',
            prefix: colorString('#FFFFFF', '★'),
            ellipsis: '',
        },
        result() {
            return this.focused.value;
        }
    });

    colorPrompt.run().then(selectedColor => {
        color = selectedColor;
        hex = palette.find(p => p.name === selectedColor).hex;

        openMenu();
    });
}

async function openMenu(){
    connectionType = await new Select({
        name: 'connection',
        message: 'Select connection type: ',
        // choices: [colorString('#ea9a97', 'Online'), colorString('#3e8fb0', 'LAN'), colorString('#c4a7e7', 'Private')],
        choices: [
            {
                name: colorString('#ea9a97', 'Online'),
                message: colorString('#ea9a97', 'Online'),
                value: 'Online'
            },
            {
                name: colorString('#3e8fb0', 'LAN'),
                message: colorString('#3e8fb0', 'LAN'),
                value: 'LAN'
            },
            {
                name: colorString('#c4a7e7', 'Private'),
                message: colorString('#c4a7e7', 'Private'),
                value: 'Private'
            }
        ],
        symbols: {
            symbols: '',
            prefix: colorString('#FFFFFF', '★'),
            ellipsis: '',
        },
        result(){
            return this.focused.value;
        }
        
    }).run();

    if (connectionType == 'Online'){
        roomNumber = await new Select({
            name: 'roomNumber',
            message: 'Select room number: ',
            //choices: [colorString('#f6c177', 'Room A'), colorString('#ea9a97', 'Room B'), colorString('#3e8fb0', 'Room C'), colorString('#9ccfd8', 'Room D'), colorString('#c4a7e7', 'Room E')],
            choices: [
                {
                    name: colorString('#f6c177', 'Room A'),
                    message: colorString('#f6c177', 'Room A'),
                    value: 'Room A'
                },
                {
                    name: colorString('#ea9a97', 'Room B'),
                    message: colorString('#ea9a97', 'Room B'),
                    value: 'Room B'
                },
                {
                    name: colorString('#3e8fb0', 'Room C'),
                    message: colorString('#3e8fb0', 'Room C'),
                    value: 'Room C'
                },
                {
                    name: colorString('#9ccfd8', 'Room D'),
                    message: colorString('#9ccfd8', 'Room D'),
                    value: 'Room D'
                },
                {
                    name: colorString('#c4a7e7', 'Room E'),
                    message: colorString('#c4a7e7', 'Room E'),
                    value: 'Room E'
                }
                ],

            symbols: {
                symbols: '',
                prefix: colorString('#FFFFFF', '★'),
                ellipsis: '',
            }
        }).run();

    }
    // else if (connectionType == 'Private'){

    // }
    
    openChat();
}

async function openChat(){
    function displayMessages(){
        let msgHeight = term.height - 3;
        messages.forEach(message => {
            term.moveTo(1, msgHeight);
            term(colorString(message.hex, message.username + ': ' + message.text));
            msgHeight--;
        });

        // Draw separator line
        term.moveTo(1, term.height - 2);
        term.eraseLine();
        term('─'.repeat(term.width));

        term.moveTo(1, term.height - 1);
        term(colorString(hex, username + ': '));

        term.grabInput();
    }
    function initialiseChat(){
        term.clear();

        displayMessages();
        let currentInput = '';
        let cursorPos = 0;

        term.on('key', (name) => {
            if (name === 'ENTER') {
                // Send message and reset
                messages.unshift({ username: username, text: currentInput, hex: hex });
                ws.send(JSON.stringify({ username: username, text: currentInput, hex: hex}));
                term.eraseLine();
                displayMessages();
                currentInput = '';
                cursorPos = 0;
            } else if (name === 'BACKSPACE') {
                // Handle backspace
                if (cursorPos >= 0) {
                    term.moveTo((username + ': ').length + cursorPos + 1, term.height - 1);
                    term.eraseLineAfter(); // Erase everything after cursor
                    cursorPos--;
                }
            } else if (name.length === 1) {
                // Add character at cursor with user's color
                currentInput += name;
                term(colorString(hex, name));
                
                cursorPos++;
            }
            
            //redrawInputField();
        });
    }

    initialiseChat();

    
    
}

initialiseUser()
