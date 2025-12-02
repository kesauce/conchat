const WebSocket = require('ws');

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8080');

const botName = "Bot";
const messages = [
    "Hello everyone!",
    "How's it going?",
    "This is an automated message",
    "Testing 1, 2, 3",
    "Bot reporting in!",
    "Anyone here?",
    "Just checking the connection",
    "Ping!",
    "Beep boop 🤖"
];

ws.on('open', () => {
    console.log(`🤖 Bot connected to ws://localhost:8080`);
    
    // Send a message every 3 seconds
    let index = 0;
    setInterval(() => {
        const message = messages[index % messages.length];
        const data = {
            type: 'Message',
            username: botName,
            text: message,
            hex: '#FFFFFF',
            connectionType: 'Online',
            roomNumber: 'Room A',
        };
        
        ws.send(JSON.stringify(data));
        console.log(`📤 Sent: ${message}`);
        
        index++;
    }, 3000); // 3 seconds
});

ws.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Bot disconnected');
});