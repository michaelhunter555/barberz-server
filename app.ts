import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
import barberRoutes from './routes/barber/barberRoutes';
import stripeRoutes from './routes/stripe/stripeRoutes';
import onboardRoutes from './routes/onboardRoutes';
import chatRoutes from './routes/chat/chatRoutes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './sockets/socket';
import nodeCron from 'node-cron';
import checkBookingExpiration from './controllers/cronjobs/checkBookingExpiration';

dotenv.config();
const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
});

io.engine.on('connection_error', (err) => {
  console.log('Socket.IO server error:', err);
});


setupSocket(io);

app.use('/socket.io', (req, res, next) => next());

app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/plans/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use("/", onboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/barber", barberRoutes);
app.use("/api/marketplace", stripeRoutes);
app.use("/api/chat", chatRoutes);
// TODO: URI redirect address after auth
const port = process.env.PORT || 5001;
 const MONGO_URI: string | undefined = process.env.MONGO_DB_URI;

 if(!MONGO_URI) {
  console.log("MONGO_URI environment variable is not set!");
  process.exit(1);
 }

 nodeCron.schedule("0 0 * * *", () => {
  checkBookingExpiration();
 })

mongoose
.connect(MONGO_URI as string)
.then(() => {
  server.listen(port, () => {
      console.log("listening on port " + port);
  })
}).catch((err) => console.log("Error connecting: " + err));