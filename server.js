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

let privateRooms = {};

const port = process.env.port || 8080
const server = new WebSocket.Server({ port: port });

server.on('connection', (ws) =>{
    console.log('New client connection');
    ws.clientInfo = {
        username: null,
        hex: null,
        connectionType: null,
        roomNumber: null,
    };

    // Listen in for any new messages and write it to every other client
    ws.on('message', (message) => {
        console.log('New message: ' + message.toString());

        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.log('Invalid JSON received:', message.toString());
            return;
        }

        if(data.type == 'RequestRoom'){
            // Create a room code that doesn't exist 
            let roomCode = Math.floor(Math.random() * 1000).toString().padStart(4, '0');;
            privateRooms[roomCode] = [];
            ws.clientInfo.roomNumber = roomCode;
            
            ws.send(JSON.stringify({ 'type': 'System', 'text': `Use the code ${roomCode} to join`}));
            ws.send(JSON.stringify({ 'type': 'RoomResponse', 'code': roomCode}));
        }
        // Add the client to the list of clients and hand over the previous messages
        else if (data.type == 'Greet'){
            ws.clientInfo.username = data.username;
            ws.clientInfo.hex = data.hex;
            ws.clientInfo.connectionType = data.connectionType;
            ws.clientInfo.roomNumber = data.roomNumber;

            let room, roomHistory;
            if (data.connectionType == 'Online'){
                room = clients[ws.clientInfo.roomNumber];
                roomHistory = messages[ws.clientInfo.roomNumber];
                ws.send(JSON.stringify({ 'type': 'MessageHistory', history: roomHistory }));
            }
            else if (data.connectionType == 'Private'){
                room = privateRooms[ws.clientInfo.roomNumber];
                if (!room){
                    ws.send(JSON.stringify({ 'type': 'System', 'text': `Room doesn't exist`}));
                    return;
                }

            }
            
            room.push(ws);
            room.forEach(client => {
                client.send(JSON.stringify({ 'type': 'System', 'text': `${data.username} has entered the chat`}));
            });

            const otherUsers = room.filter(client => client !== ws).map(client => client.clientInfo.username);
            function formatUserList(usernames) {
                if (usernames.length === 0) return "You're the only one here";
                if (usernames.length === 1) return `${usernames[0]} is online`;
                if (usernames.length === 2) return `${usernames[0]} and ${usernames[1]} are online`;
                
                const last = usernames.pop();
                return `${usernames.join(', ')}, and ${last} are in the room`;
            }

            ws.send(JSON.stringify({ 'type': 'System', 'text': formatUserList(otherUsers) }));
        }
        else if (data.type == 'Message'){
            let room, roomHistory;
            if (data.connectionType == 'Online'){
                room = clients[ws.clientInfo.roomNumber];
                messages[ws.clientInfo.roomNumber].unshift(data);
                roomHistory = messages[ws.clientInfo.roomNumber].slice(0, 49);
            }
            else if (data.connectionType == 'Private'){
                room = privateRooms[ws.clientInfo.roomNumber];
            }

            room.forEach(client => {
                if (client !== ws){
                    client.send(JSON.stringify(data));
                }
                
            });
        } 
        else if (data.type == 'Closing'){
            let isPrivate = ws.clientInfo.connectionType == 'Private';
            let room = isPrivate ? privateRooms[ws.clientInfo.roomNumber] : clients[ws.clientInfo.roomNumber];

            room = room.filter(c => c !== ws); 
            room.forEach(client => {
                client.send(JSON.stringify({ 'type': 'System', 'text': `${ws.clientInfo.username} has left the chat`}));
            });

            if (isPrivate){
                privateRooms[ws.clientInfo.roomNumber] = room;

                // Delete private room if empty
                if (room.length == 0){
                    delete privateRooms[ws.clientInfo.roomNumber];
                    console.log('Deleted private room ' + ws.clientInfo.roomNumber);
                }
            }
            else{
                clients[ws.clientInfo.roomNumber] = room;
            }
        }
        
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        let room = clients[ws.clientInfo.roomNumber];
        if (!room || !Array.isArray(room)) {
            return;
        }
        
    });

    // Handle errors
    ws.on('error', () => {
        console.log('An error has occurred');
    });
});
