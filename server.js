const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

// База данных в оперативной памяти
let users = {}; 
let messages = [];

io.on('connection', (socket) => {
    // Вход в систему
    socket.on('auth', (userData) => {
        socket.username = userData.username;
        // Если юзер уже был, просто обновляем статус. Если новый — добавляем в базу.
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
        // Отправляем историю и актуальный список людей
        socket.emit('init_data', { messages, users });
        io.emit('update_users', users);
    });

    // Обработка сообщения
    socket.on('message', (msgData) => {
        const fullMsg = {
            ...msgData,
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };
        messages.push(fullMsg);
        io.emit('new_message', fullMsg);
    });

    // Логика "Прочитано"
    socket.on('read_chat', (data) => {
        messages.forEach(m => {
            if (m.recipient === data.me && m.sender_user === data.withWhom) {
                m.read = true;
            }
        });
        io.emit('messages_read', { by: data.me, from: data.withWhom });
    });

    // Админ-панель: Очистка всего
    socket.on('admin_clear', () => {
        if (socket.username === 'admin') {
            messages = [];
            io.emit('init_data', { messages, users });
        }
    });

    // Выход юзера (но не удаление из списка!)
    socket.on('disconnect', () => {
        if (socket.username && users[socket.username]) {
            users[socket.username].online = false;
            io.emit('update_users', users);
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`PRINCE ELITE Server started on port ${PORT}`));