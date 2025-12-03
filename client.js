#!/usr/bin/env node
const WebSocket = require('ws');
const { Select, Input } = require('enquirer');
const term = require( 'terminal-kit' ).terminal ;

//const ws = new WebSocket("https://conchat-ns3b.onrender.com");
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
                name: colorString('#3e8fb0', 'Private'),
                message: colorString('#3e8fb0', 'Private'),
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

        let data = {
            'type': 'Greet',
            'username': username,
            'hex': hex,
            'connectionType': connectionType,
            'roomNumber': roomNumber
        }
        ws.send(JSON.stringify(data));
    }
    else if (connectionType == 'Private'){
        let isHosting = await new Select({
            name: 'isHosting',
            message: 'Host or join a room: ',
            choices: [
                {
                    name: colorString('#f6c177', 'Host'),
                    message: colorString('#f6c177', 'Host'),
                    value: true
                },
                {
                    name: colorString('#c4a7e7', 'Join'),
                    message: colorString('#c4a7e7', 'Join'),
                    value: false
                },
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

        if (!isHosting){
            roomNumber = await new Input({
                name: 'roomNumber',
                message: 'Enter 4-digit room code: ',
                symbols: {
                    symbols: '',
                    prefix: colorString('#FFFFFF', '★'),
                    ellipsis: '',
                    separator: '',
                    suffix: ''
                },
                
            }).run();

            let data = {
                'type': 'Greet',
                'username': username,
                'hex': hex,
                'connectionType': connectionType,
                'roomNumber': roomNumber
            }
            ws.send(JSON.stringify(data));
        }
        else{
            let request = {
                'type': 'RequestRoom',
                'username': username,
                'hex': hex,
                'connectionType': connectionType,
            }
            ws.send(JSON.stringify(request));
        }
    }

    openChat();
}

async function openChat(){
    function displayMessages(){
        let msgHeight = term.height - 3;
        messages.forEach(message => {
            term.moveTo(1, msgHeight);
            term.eraseLine();  
            if (message.type == 'System'){
                let sysMessage = colorString('#FFFFFF', '★ ') + message.text + colorString('#FFFFFF', ' ★');
                const padding = Math.floor((term.width - message.text.length - 2) / 2);
                term(padding > 0 ? ' '.repeat(padding) : '')(sysMessage)('\n');
            }
            else{
                term(colorString(message.hex, message.username + ': ' + message.text));
            }
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
    messages = [];
    displayMessages();
    let currentInput = '';
    let cursorPos = 0;

    // Typing mechanics
    term.on('key', (name) => {
        if (name === 'CTRL_C') {
            term.grabInput(false);
            term.processExit(0);
            ws.send(JSON.stringify({ 'type': 'Closing', 'username': username, 'hex': hex, 'connectionType': connectionType, 'roomNumber': roomNumber }));
        }
        if (name === 'ESCAPE') {
            // Clean up and send closing message
            term.clear();
            term.removeAllListeners('key');
            term.removeAllListeners('resize');
            ws.removeAllListeners('message');
            term.grabInput(false);
            openMenu();

            ws.send(JSON.stringify({ 'type': 'Closing', 'username': username, 'hex': hex, 'connectionType': connectionType, 'roomNumber': roomNumber }));
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
                term.move(-1, 0);
                //term.moveTo((username + ': ').length + cursorPos + 1, term.height - 1);
                term.eraseLineAfter();
                cursorPos--;
            }
        } else if (name.length === 1) {
            try{
                let promptLength = (username + ': ').length;
                // Max length
                if (currentInput.length > term.width - promptLength - 10){
                    return;
                }

                // Add character at cursor with user's color
                currentInput += name;
                term(colorString(hex, name));
                cursorPos++;

                //term.moveTo((username + ': ').length + 1, term.height - 1).eraseLineAfter()(colorString(hex, currentInput));
                    
                // Keep cursor at end
                term.moveTo(promptLength + currentInput.length + 1, term.height - 1);

            } finally {
                setTimeout(() => {}, 10); // Short delay for processing
            }
            
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
        else if (data.type == 'Message' || data.type == 'System'){
            messages.unshift(data);
            messages = messages.slice(0, 49);
        }
        else if (data.type == 'RoomResponse'){
            roomNumber = data.code.toString();
            let greet =  {
                'type': 'Greet',
                'username': username,
                'hex': hex,
                'connectionType': connectionType,
                'roomNumber': roomNumber
        
            }
            ws.send(JSON.stringify(greet));

        }
        displayMessages();
    });

    
    
}

initialiseUser()
