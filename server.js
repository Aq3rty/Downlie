const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

let msgHistory = []; 
let users = {}; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // При входе даем временное имя
    users[socket.id] = { name: 'Принц #' + socket.id.substr(0, 4), avatar: '' };
    
    // Отправляем историю и список юзеров
    socket.emit('load history', msgHistory);
    io.emit('update users', users);

    // Обновление профиля (ник и аватарка)
    socket.on('update profile', (data) => {
        users[socket.id] = { name: data.name, avatar: data.avatar };
        io.emit('update users', users);
    });

    // Пофиксенная отправка сообщений
    socket.on('message', (data) => {
        const fullMsg = {
            sender: users[socket.id].name,
            sender_id: socket.id,
            avatar: users[socket.id].avatar,
            text: data.text,
            recipient: data.recipient, // 'global' или id
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (data.recipient === 'global') {
            msgHistory.push(fullMsg);
            if (msgHistory.length > 50) msgHistory.shift();
            io.emit('new message', fullMsg); // Всем
        } else {
            // Личка
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
    console.log(`Prince Server Online on port ${PORT}`);
});