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
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) =>{
    console.log('New client');
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
            clients[data.roomNumber].push(ws);
            ws.send(JSON.stringify({ type: 'MessageHistory', history: messages[data.roomNumber] }))
        }
        else if (data.type == 'Message'){
            messages[data.roomNumber].unshift(data);
            messages[data.roomNumber] = messages[data.roomNumber].slice(0, 49);

            clients[data.roomNumber].forEach(client => {
                if (client !== ws){
                    client.send(JSON.stringify(data));
                }
                
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        
        // Remove from all rooms
        Object.keys(clients).forEach(room => {
            clients[room] = clients[room].filter(client => client !== ws);
        });
    });

    // Handle errors
    ws.on('error', () => {
        console.log('An error has occurred');
    });
});
