const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

let msgHistory = []; // Общий чат
let users = {}; 

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    users[socket.id] = { 
        name: 'Принц_' + socket.id.substr(0, 3), 
        avatar: `https://ui-avatars.com/api/?name=P&background=8b5cf6&color=fff` 
    };
    
    socket.emit('load history', msgHistory);
    io.emit('update users', users);

    socket.on('update profile', (data) => {
        if(data.name) users[socket.id].name = data.name;
        if(data.avatar) users[socket.id].avatar = data.avatar;
        io.emit('update users', users);
    });

    socket.on('message', (data) => {
        const fullMsg = {
            sender: users[socket.id].name,
            sender_id: socket.id,
            avatar: users[socket.id].avatar,
            text: data.text,
            recipient: data.recipient,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (data.recipient === 'global') {
            msgHistory.push(fullMsg);
            if (msgHistory.length > 50) msgHistory.shift();
            io.emit('new message', fullMsg); 
        } else {
            socket.to(data.recipient).emit('new message', fullMsg);
            socket.emit('new message', fullMsg);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update users', users);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});