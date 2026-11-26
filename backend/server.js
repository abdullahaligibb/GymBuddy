require('dotenv').config({quiet:true});
const {createApp}=require('./src/app');
const prisma=require('./src/lib/prisma');
const port=Number(process.env.PORT) || 3000;
const server=createApp().listen(port,process.env.HOST || '0.0.0.0',()=>console.log(`GymBuddy API läuft auf Port ${port}`));
async function shutdown() {server.close(async()=>{await prisma.$disconnect();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
