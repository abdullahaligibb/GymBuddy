const router=require('express').Router();
const auth=require('../middlewares/authMiddleware');
const {asyncRoute}=require('../lib/errors');
const service=require('../services/authService');
const prisma=require('../lib/prisma');
router.post('/register',asyncRoute(async(req,res)=>res.status(201).json(await service.registerUser(req.body))));
router.post('/login',asyncRoute(async(req,res)=>res.json(await service.loginUser(req.body))));
router.get('/me',auth,asyncRoute(async(req,res)=>res.json({user:await service.getUserById(req.user.id)})));
router.post('/logout',auth,asyncRoute(async(req,res)=>{
 await prisma.revokedToken.upsert({where:{tokenHash:req.auth.tokenHash},update:{},create:{...req.auth,userId:req.user.id}});
 await prisma.revokedToken.deleteMany({where:{expiresAt:{lt:new Date()}}});res.sendStatus(204);
}));
module.exports=router;
