import app from './app.js';
import env from './configs/env.js';
import { prisma } from './lib/prisma.js';
const PORT = env.PORT;

const startServer = async ( ) => {
    try{
        await prisma.$connect();
        console.log("Connected to the database successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }catch(e){
        console.error("Error starting server:", e);
        prisma.$disconnect();
        process.exit(1);
    }

}

startServer();
