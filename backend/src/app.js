const express = require('express');
const cors = require('cors');
const {errorHandler} = require('./lib/errors');
function createApp() {
  if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET muss mindestens 32 Zeichen enthalten.');
  const app=express();
  app.use(cors());app.use(express.json({limit:'256kb'}));
  app.get('/health',(req,res)=>res.json({status:'ok',app:'GymBuddy API',contract:'v1',environment:process.env.NODE_ENV || 'development'}));
  app.use('/api/auth',require('./routes/authRoutes'));
  app.use('/api/exercises',require('./routes/exerciseRoutes'));
  app.use('/api/workouts',require('./routes/trainingRoutes'));
  app.use(errorHandler);
  return app;
}
module.exports={createApp};
