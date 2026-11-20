/**
 * @file server.js
 * @description Application server entry point: establishes MongoDB connection, attaches Socket.IO, and starts HTTP listener.
 */

const http = require('http');
const { Server } = require('socket.io');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const server = http.createServer(app);

// Socket.IO real-time event pipeline
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Real-time client subscription
  socket.on('join', (room) => {
    socket.join(room);
  });
});

const PORT = env.PORT || 8080;

// Connect to MongoDB and start listening
(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();

module.exports = { app, server, io };
