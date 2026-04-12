const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

let msgHistory = []; // Массив для хранения последних 50 сообщений

app.use(express.static('public')); // На будущее для картинок/стилей

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Новый принц вошел в сеть');

    // 1. Отправляем историю сообщений новому пользователю
    socket.emit('load history', msgHistory);

    // 2. Слушаем новые сообщения
    socket.on('chat message', (data) => {
        msgHistory.push(data);
        if (msgHistory.length > 50) msgHistory.shift(); // Лимит истории
        io.emit('chat message', data);
    });

    // 3. Слушаем статус "печатает"
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data); 
    });

    socket.on('disconnect', () => {
        console.log('Пользователь покинул замок');
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Prince Messenger запущен на http://localhost:${PORT}`);
});