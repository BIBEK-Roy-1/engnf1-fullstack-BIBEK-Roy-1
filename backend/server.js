import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();

async function startServer() {
  await connectDB();

  const app=express();
  const port =process.env.PORT;
app.get('/api/health',(req,res)=>{
    res.json({
        success: true,
        message: "TriageSync API is running"
    })
})

  app.listen(port,()=>{
    console.log("server is listning at "+port)
  })
}



startServer();
