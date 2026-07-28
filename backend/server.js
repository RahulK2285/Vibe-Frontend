require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const roomController = require('./controllers/roomController');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173", 
    process.env.FRONTEND_URL
];

const io = new Server(server, {
    cors: { 
        origin: allowedOrigins, 
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ DB Connected"))
.catch(err => console.error("❌ DB Error:", err));

// Memory store for active users per room
const roomUsers = new Map();

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('join-room', ({ roomCode, userName }) => {
        const upperCode = roomCode.toUpperCase(); // ✅ Ensure case consistency
        socket.join(upperCode);
        
        if (!roomUsers.has(upperCode)) roomUsers.set(upperCode, []);
        const users = roomUsers.get(upperCode);
        
        if (!users.find(u => u.id === socket.id)) {
            users.push({ id: socket.id, name: userName || 'Guest' });
        }

        // ✅ Broadcast to the specific room only
        io.to(upperCode).emit('update-vibers', { 
            users, 
            newUser: userName || 'Guest' 
        });
    });

    socket.on('add-song', async ({ roomCode, songData }) => {
        try {
            const upperCode = roomCode.toUpperCase();
            const result = await roomController.addSong(upperCode, songData);
            io.to(upperCode).emit('update-queue', result); 
        } catch (err) {
            socket.emit('error-msg', { message: err.message });
        }
    });

    socket.on('vote-song', async ({ roomCode, songId, userId }) => {
        try {
            const upperCode = roomCode.toUpperCase();
            const result = await roomController.voteSong(upperCode, songId, userId);
            io.to(upperCode).emit('update-queue', result);
        } catch (err) {
            socket.emit('error-msg', { message: "Vote failed" });
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(roomCode => {
            if (roomUsers.has(roomCode)) {
                let users = roomUsers.get(roomCode);
                users = users.filter(u => u.id !== socket.id);
                roomUsers.set(roomCode, users);
                io.to(roomCode).emit('update-vibers', { users });
            }
        });
    });
});

app.get('/health', (req, res) => res.status(200).send('OK'));
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));