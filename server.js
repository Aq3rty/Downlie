const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Хранилища данных
let msgHistory = []; // Последние 50 сообщений общего чата
let onlineUsers = {}; // Список юзеров в формате { socketId: username }

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    // 1. При входе отправляем историю общего чата
    socket.emit('load history', msgHistory);

    // 2. Регистрация ника (когда юзер меняет ник в интерфейсе)
    socket.on('set nickname', (username) => {
        onlineUsers[socket.id] = username || 'Анонимный Принц';
        // Рассылаем всем обновленный список онлайн-пользователей
        io.emit('update users', onlineUsers);
    });

    // 3. Обработка сообщений (и общих, и личных)
    socket.on('private message', (data) => {
        const messageData = {
            sender: data.sender,
            sender_id: socket.id,
            recipient: data.recipient, // может быть 'global' или конкретный socket.id
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (data.recipient === 'global') {
            // Сохраняем в историю только общие сообщения
            msgHistory.push(messageData);
            if (msgHistory.length > 50) msgHistory.shift();
            
            // Шлем всем
            io.emit('new message', messageData);
        } else {
            // ЛИЧКА: Шлем конкретному получателю
            socket.to(data.recipient).emit('new message', messageData);
            // И себе тоже отправляем, чтобы отобразилось в окне
            socket.emit('new message', messageData);
        }
    });

    // 4. Статус "печатает"
    socket.on('typing', (user) => {
        socket.broadcast.emit('typing', user);
    });

    // 5. Отключение
    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update users', onlineUsers);
        console.log('Пользователь ушел');
    });
});

// Настройка порта для Render или локального запуска
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Prince Server запущен на порту: ${PORT}`);
});