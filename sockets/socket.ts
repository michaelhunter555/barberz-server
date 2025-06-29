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

    // Handle user appointments
    socket.on('userAppointmentRequest', (notification: { barberId: string, message: string, appointment: { _id: string, time: string, date: string, price: number, customerName: string}}) => {
        console.log('🚀 User appointment:', notification);
        const { barberId, message, appointment} = notification;
        // Process user appointment-specific logic
        io.to(barberId).emit('userAppointmentNotification', { message, appointment });
      });

    // Example: Emit notifications to users
    socket.on('sendNotification', (notificationData: { userId: string, message: string }) => {
      const { userId, message } = notificationData;
      io.to(userId).emit('notification', { message });
      console.log(`Sent notification to ${userId}: ${message}`);
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
