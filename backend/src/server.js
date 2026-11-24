import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRouter from './routes/auth.router.js';
import { errorHandler } from './middleware/error.middleware.js';
import ticketRouter from './routes/ticket.router.js';


dotenv.config();

async function startServer() {
  await connectDB();

  const app=express();
  const port =process.env.PORT;
   // Middleware
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/tickets", ticketRouter);


app.get('/api/health',(req,res)=>{
    res.json({
        success: true,
        message: "TriageSync API is running"
    })
})


// 4. Handle unknown routes
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    error.code = "ROUTE_NOT_FOUND";
    next(error);
});

  app.use(errorHandler);
  app.listen(port,()=>{
    console.log("server is listning at "+port)
  })
}



startServer();
