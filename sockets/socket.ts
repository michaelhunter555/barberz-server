import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
  // Socket.IO connection handler
  io.on('connection', (socket: Socket) => {
    console.log(`[${socket.id}] connected`)

    // Handle 'register' event to join a specific user room
    socket.on('register', (userId: string) => {
      socket.join(userId); // Join user-specific room
      console.log(`User ${userId} joined their room.`);
    });

       // Handle socket disconnections
       socket.on('disconnect', (reason: string) => {
        console.log(`[${socket.id}] disconnected - ${reason}`);
      });

      socket.on("connect_error", (err) => {
        console.log("❌ Socket connection error:", err.message);
      });

  });
};
