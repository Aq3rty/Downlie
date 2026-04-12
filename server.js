const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

let users = {}; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('auth', (userData) => {
        users[socket.id] = {
            name: userData.name || 'User',
            username: userData.username || 'id' + socket.id.substr(0,4),
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name}&background=334155&color=fff`
        };
        io.emit('update users', users);
    });

    socket.on('message', (data) => {
        const fullMsg = {
            sender: users[socket.id]?.name || 'System',
            sender_user: users[socket.id]?.username || 'anon',
            text: data.text,
            recipient: data.recipient,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        io.emit('new message', fullMsg); 
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update users', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Prince Server: Port ${PORT}`));