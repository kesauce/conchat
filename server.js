const WebSocket = require('ws');

var clients = []; // A list of socket connections

const port = process.env.port || 8080
const server = new WebSocket.Server({ port: port });

server.on('connection', (ws) =>{
    console.log('New client');

    // Add the new client
    clients.push(ws);

    // Listen in for any new messages and write it to every other client
    ws.on('message', (message) => {
        console.log(message.toString());
        clients.forEach(client => {
            if(client !== ws){
                let data;
                try {
                    data = JSON.parse(message);
                } catch (err) {
                    console.log('Invalid JSON received:', message.toString());
                    return;
                }

                client.send(JSON.stringify(data));
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
