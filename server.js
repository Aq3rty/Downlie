const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

let users = {}; 
let messages = [];

io.on('connection', (socket) => {
    socket.on('auth', (userData) => {
        socket.username = userData.username;
        users[socket.username] = { ...userData, online: true };
        socket.emit('init_data', { messages, users });
        io.emit('update_users', users);
    });

    socket.on('message', (msg) => {
        const fullMsg = {
            ...msg,
            id: 'm_' + Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(fullMsg);
        io.emit('new_message', fullMsg);
    });

    socket.on('disconnect', () => {
        if (users[socket.username]) {
            users[socket.username].online = false;
            io.emit('update_users', users);
        }
    });
});

http.listen(3000, () => console.log('PRINCE ELITE v5.0 Server Online'));