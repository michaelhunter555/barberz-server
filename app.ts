import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
import barberRoutes from './routes/barber/barberRoutes';
import stripeRoutes from './routes/stripe/stripeRoutes';
import onboardRoutes from './routes/onboardRoutes';

dotenv.config();
const app = express();
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
// TODO: URI redirect address after auth
const port = process.env.PORT || 5001;
 const MONGO_URI: string | undefined = process.env.MONGO_DB_URI;

 if(!MONGO_URI) {
  console.log("MONGO_URI environment variable is not set!");
  process.exit(1);
 }

mongoose
.connect(MONGO_URI as string)
.then(() => {
  app.listen(port, () => {
      console.log("listening on port " + port);
  })
}).catch((err) => console.log("Error connecting: " + err));