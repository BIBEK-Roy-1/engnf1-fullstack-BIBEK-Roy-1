import mongoose from 'mongoose';


export async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('mongoDb connected')
    }catch(err){
        console.log(err);
        process.exit(1);
    }
};

