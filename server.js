const WebSocket = require('ws');

let clients = {
    'Room A': [],
    'Room B': [],
    'Room C': [],
    'Room D': [],
    'Room E': []
};

let messages = {
    'Room A': [], 
    'Room B': [],
    'Room C': [],
    'Room D': [],
    'Room E': []
};

const port = process.env.port || 8080
const server = new WebSocket.Server({ port: port });

server.on('connection', (ws) =>{
    console.log('New client');
    let clientInfo = {
        username: null,
        hex: null,
        connectionType: null,
        roomNumber: null,
    };

    // Listen in for any new messages and write it to every other client
    ws.on('message', (message) => {
        console.log(message.toString());
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.log('Invalid JSON received:', message.toString());
            return;
        }

        // Add the client to the list of clients and hand over the previous messages
        if (data.type == 'Greet'){
            clientInfo.username = data.username;
            clientInfo.hex = data.hex;
            clientInfo.connectionType = data.connectionType;
            clientInfo.roomNumber = data.roomNumber;

            const room = clients[clientInfo.roomNumber];
            const roomHistory = messages[clientInfo.roomNumber];

            room.push(ws);
            ws.send(JSON.stringify({ 'type': 'MessageHistory', history: roomHistory }));

            room.forEach(client => {
                client.send(JSON.stringify({ 'type': 'System', 'text': `${data.username} has entered the chat`}));
            });
        }
        else if (data.type == 'Message'){
            const room = clients[clientInfo.roomNumber];
            let roomHistory = messages[clientInfo.roomNumber];

            roomHistory.unshift(data);
            roomHistory = roomHistory.slice(0, 49);

            room.forEach(client => {
                if (client !== ws){
                    client.send(JSON.stringify(data));
                }
                
            });
        } else if (data.type == 'Closing'){
            let room = clients[clientInfo.roomNumber];

            room = room.filter(c => c !== ws); 
            room.forEach(client => {
                client.send(JSON.stringify({ 'type': 'System', 'text': `${clientInfo.username} has left the chat`}));
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        let room = clients[clientInfo.roomNumber];
        room = room.filter(client => client !== ws);
        room.forEach(client => {
            client.send(JSON.stringify({ 'type': 'System', 'text': `${clientInfo.username} has left the chat`}));
        });
        
    });

    // Handle errors
    ws.on('error', () => {
        console.log('An error has occurred');
    });
});
