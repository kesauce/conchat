#!/usr/bin/env node
const WebSocket = require('ws');
const { Select } = require('enquirer');
const term = require( 'terminal-kit' ).terminal ;

const ws = new WebSocket("ws://localhost:8080");
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
            },
            result(){
                return this.focused.value;
            }
        }).run();

    }
    // else if (connectionType == 'Private'){

    // }
    let data = {
        'type': 'Greet',
        'username': username,
        'hex': hex,
        'connectionType': connectionType,
        'roomNumber': roomNumber
    }
    ws.send(JSON.stringify(data));

    openChat();
}

async function openChat(){
    function displayMessages(){
        let msgHeight = term.height - 3;
        messages.forEach(message => {
            term.moveTo(1, msgHeight);
            term.eraseLine();
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

    term.clear();
    displayMessages();
    let currentInput = '';
    let cursorPos = 0;

    // Typing mechanics
    term.on('key', (name) => {
        if (name === 'CTRL_C') {
            term.grabInput(false);
            term.processExit(0);
        }
        if (name === 'ESCAPE') {
            term.clear();
            term.removeAllListeners('key');
            term.removeAllListeners('resize');
            ws.removeAllListeners('message');
            term.grabInput(false);
            openMenu();
            return;
        }

        if (name === 'ENTER') {
            // Send message and reset
            messages.unshift({ 'username': username, 'text': currentInput, 'hex': hex });
            ws.send(JSON.stringify({ 'type': 'Message', 'username': username, 'hex': hex, 'text': currentInput, 'connectionType': connectionType, 'roomNumber': roomNumber }));
            term.eraseLine();
            displayMessages();
            currentInput = '';
            cursorPos = 0;
        } else if (name === 'BACKSPACE') {
            // Handle backspace
            if (cursorPos >= 0) {
                currentInput = currentInput.slice(0, -1);
                term.moveTo((username + ': ').length + cursorPos + 1, term.height - 1);
                term.eraseLineAfter();
                cursorPos--;
            }
        } else if (name.length === 1) {
            // Add character at cursor with user's color
            currentInput += name;
            term(colorString(hex, name));
            cursorPos++;
        }
        
    });

    // Reset display if you resize
    term.on('resize', () => {
        term.clear();
        displayMessages();
        term(colorString(hex, currentInput));
    });

    // Receiving messages over the server
    ws.on('message', (message) => {
        let data = JSON.parse(message);
        if (data.type == 'MessageHistory'){
            messages = data.history;
            term.clear();
        }
        else if (data.type == 'Message'){
            messages.unshift(data);
            messages = messages.slice(0, 49);
        }
        displayMessages();
    });

    
    
}

initialiseUser()
