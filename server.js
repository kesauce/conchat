const WebSocket = require('ws');

var clients = []; // A list of socket connections

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) =>{
    console.log('New client');

    // Add the new client
    clients.push(ws);

    // Listen in for any new messages and write it to every other client
    ws.on('message', (message) => {
        clients.forEach(client => {
            if(client !== ws){
                client.send(message);
            }
        });
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        ws.on('close', () => {
            clients = clients.filter(client => client !== ws); // Keep the clients that aren't the one we just closed
        });
    });

    // Handle errors
    ws.on('error', () => {
        console.log('An error has occurred');
    });
});
