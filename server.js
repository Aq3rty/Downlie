const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

let users = {}; 
let messages = [];

io.on('connection', (socket) => {
    socket.on('auth', (userData) => {
        socket.username = userData.username;
        if (users[socket.username]) {
            users[socket.username].online = true;
            users[socket.username].socketId = socket.id;
        } else {
            users[socket.username] = {
                ...userData,
                socketId: socket.id,
                online: true
            };
        }
        socket.emit('init_data', { messages, users });
        io.emit('update_users', users);
    });

    socket.on('message', (msgData) => {
        const fullMsg = {
            ...msgData,
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            // Если это файл, у него будут поля fileData и fileName
            type: msgData.fileData ? 'file' : 'text' 
        };
        messages.push(fullMsg);
        io.emit('new_message', fullMsg);
    });

    socket.on('read_chat', (data) => {
        messages.forEach(m => {
            if (m.recipient === data.me && m.sender_user === data.withWhom) {
                m.read = true;
            }
        });
        io.emit('messages_read', { by: data.me, from: data.withWhom });
    });

    socket.on('admin_clear', () => {
        if (socket.username === 'admin') {
            messages = [];
            io.emit('init_data', { messages, users });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username && users[socket.username]) {
            users[socket.username].online = false;
            io.emit('update_users', users);
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`PRINCE ELITE Server started on port ${PORT}`));