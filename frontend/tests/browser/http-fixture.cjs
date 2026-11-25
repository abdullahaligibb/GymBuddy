/* Isolated HTTP contract fixture, bound only to localhost; never imported by the application. */
const http=require('node:http');
const clone=value=>JSON.parse(JSON.stringify(value));
const initial={id:'db-workout',name:'Servertraining',date:'2026-11-23',duration:60,time:'18:30',status:'GEPLANT',type:'Push',intensity:'Mittel',muscles:['Brust'],exercises:[{id:'db-association',exerciseId:'db-exercise',position:1,sets:3,repetitions:'8–12',weight:0,restSeconds:90,exercise:{externalId:'server-press',name:'Server Presse',description:'Gespeicherte Anleitung',targetMuscles:['chest'],equipments:['cable']}}]};

async function startHttpFixture(){
 const accounts=new Map([
  ['server@example.test',{user:{id:'one',username:'ServerTest',email:'server@example.test'},password:'secret'}],
  ['second@example.test',{user:{id:'two',username:'ServerZwei',email:'second@example.test'},password:'secret'}],
 ]);
 const sessions=new Map();let sequence=0;
 const data=new Map([['one',{workouts:[clone(initial)],plans:[],profile:null,target:null,logs:[]}],['two',{workouts:[],plans:[],profile:null,target:null,logs:[]}]]);
 const state={requests:[],failNextWrite:false,catalogUnavailable:false,holdNextWorkouts:false,releaseOldLoad:null,onHold:null};
 const server=http.createServer(async(req,res)=>{
  function reply(status,value){if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, PUT, PATCH, DELETE, OPTIONS'});res.end(status===204?undefined:JSON.stringify(value));}
  try{
   if(req.method==='OPTIONS')return reply(204);
   const path=new URL(req.url,'http://localhost').pathname;
   let raw='';for await(const part of req){raw+=part;if(raw.length>1000000)throw Error('body too large');}
   const body=raw?JSON.parse(raw):{};
   state.requests.push({method:req.method,path,body});
   if(path==='/api/auth/login'||path==='/api/auth/register'){
    const entry=accounts.get(body.email);
    if(!entry||entry.password!==body.password)return reply(401,{});
    const token=`fixture-${++sequence}`;sessions.set(token,entry.user);
    return reply(200,{token,user:entry.user});
   }
   if(path==='/api/exercises')return state.catalogUnavailable?reply(502,{}):reply(200,{exercises:[]});
   const token=(req.headers.authorization||'').replace(/^Bearer /,'');const user=sessions.get(token);
   if(!user)return reply(401,{});
   if(path==='/api/auth/me')return reply(200,{user});
   if(path==='/api/auth/logout'){sessions.delete(token);return reply(204);}
   const store=data.get(user.id);
   if(path==='/api/workouts'&&req.method==='GET'){
    if(state.holdNextWorkouts){state.holdNextWorkouts=false;await new Promise(resolve=>{state.releaseOldLoad=resolve;state.onHold?.();});return reply(401,{});}
    return reply(200,{workouts:store.workouts});
   }
   if(state.failNextWrite&&req.method==='PUT'){state.failNextWrite=false;return reply(503,{});}
   if(path.startsWith('/api/workouts/by-date/')&&req.method==='PUT'){
    const day=decodeURIComponent(path.split('/').pop());
    if(day!==body.date||!Array.isArray(body.exercises)||body.exercises.some(row=>!row.catalogId||!Number.isInteger(row.position)||typeof row.repetitions!=='string'))return reply(400,{});
    const existing=store.workouts.find(item=>item.date===day);
    const saved={...body,id:existing?.id??`db-${++sequence}`,exercises:body.exercises.map(row=>({id:row.id??`association-${++sequence}`,exerciseId:'db-exercise',position:row.position,sets:row.sets,repetitions:row.repetitions,weight:row.weight,restSeconds:row.restSeconds,notes:row.notes,exercise:{catalogId:row.catalogId,externalId:row.externalId,name:'Server Presse',targetMuscles:['chest'],equipments:['cable']}}))};
    store.workouts=[...store.workouts.filter(item=>item.date!==day),saved];return reply(200,{workout:saved});
   }
   if(path.endsWith('/status')&&req.method==='PATCH'){
    const workout=store.workouts.find(item=>item.id===decodeURIComponent(path.split('/')[3]));
    if(!workout)return reply(404,{});workout.status=body.status;return reply(200,{workout});
   }
   if(path.startsWith('/api/workouts/')&&req.method==='DELETE'){store.workouts=store.workouts.filter(item=>item.id!==decodeURIComponent(path.split('/')[3]));return reply(204);}
   if(path==='/api/plans'&&req.method==='GET')return reply(200,{plans:store.plans});
   if(path.startsWith('/api/plans/')){
    const id=decodeURIComponent(path.split('/').pop());store.plans=store.plans.filter(plan=>plan.id!==id);
    if(req.method==='DELETE')return reply(204);store.plans.push(clone(body));return reply(200,{plan:body});
   }
   if(path==='/api/profile'){if(req.method==='PUT')store.profile=clone(body);return reply(200,{profile:store.profile});}
   if(path==='/api/macros/target'){if(req.method==='PUT')store.target=clone(body);return reply(200,{target:store.target});}
   if(path==='/api/macros/logs'&&req.method==='GET')return reply(200,{logs:store.logs});
   if(path.startsWith('/api/macros/logs/')){
    const day=decodeURIComponent(path.split('/').pop());store.logs=store.logs.filter(log=>log.dateIso!==day);
    if(req.method==='DELETE')return reply(204);store.logs.push(clone(body));return reply(200,{log:body});
   }
   reply(404,{});
  }catch{reply(500,{});}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {url:`http://127.0.0.1:${server.address().port}`,state,data,close:async()=>{state.releaseOldLoad?.();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
module.exports={startHttpFixture};
