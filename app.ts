import express, { Request, Response} from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
// import { ExpressAuth } from "@auth/express";
// import Google from '@auth/express/providers/google';
// import { authConfig } from './lib/config/auth.config';
// import { currentSession, authenticatedUser } from './lib/config/authmiddleware';

dotenv.config();
const app = express();
app.use(cors());
// app.set("trust proxy", true);
// app.use(currentSession);
// app.use("/auth/*", ExpressAuth(authConfig));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/plans/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use("/api/user", userRoutes);
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