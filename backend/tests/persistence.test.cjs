const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const net=require('node:net');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const path=require('node:path');
const dbUrl=process.env.TEST_DATABASE_URL;
if(!dbUrl || !new URL(dbUrl).pathname.endsWith('_test') || !['127.0.0.1','localhost'].includes(new URL(dbUrl).hostname)) throw new Error('TEST_DATABASE_URL must name an isolated local *_test database.');
process.env.DATABASE_URL=dbUrl;process.env.DIRECT_URL=dbUrl;
const prisma=require('../src/lib/prisma');
const users=[];let child,base,source,sourceUrl;let stderr='';
const password='Integration-2026!';
async function start() {
 const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 base=`http://127.0.0.1:${port}`;
 child=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:String(port),HOST:'127.0.0.1',JWT_SECRET:'test-only-session-secret-32-characters-minimum',EXERCISE_API_URL:sourceUrl},stdio:['ignore','ignore','pipe']});
 child.stderr.on('data',x=>stderr+=x);
 for(let i=0;i<100;i++) {if(child.exitCode!==null) throw new Error('API exited: '+stderr);try{if((await fetch(base+'/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}
 throw new Error('API start timeout: '+stderr);
}
async function stop(){if(child && child.exitCode===null){const done=once(child,'exit');child.kill();await done;}}
async function request(method,url,token,body,expected=200){
 const response=await fetch(base+url,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=response.status===204?null:await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;
}
async function account(){const id=randomUUID().slice(0,12);const input={username:'it-'+id,email:`it-${id}@example.test`,password};const result=await request('POST','/api/auth/register',null,input,201);users.push(result.user.id);return {...result,input};}
const workout=(extra={})=>({name:'Push Training',date:'2026-11-23',duration:45,time:'18:30',status:'GEPLANT',type:'Push',intensity:'Mittel',muscles:['Brust'],notes:'Notiz behalten',sourceTemplateId:'push-day',trainingPlanId:null,exercises:[{catalogId:'bankdruecken',position:1,sets:3,repetitions:'8–12',weight:0,restSeconds:0,notes:'langsam'},{catalogId:'kabelrudern',position:2,sets:4,repetitions:'30 Sek.',weight:12.5,restSeconds:90,notes:null}],...extra});
before(async()=>{
 source=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{exerciseId:'remote-persistence',name:'Remote Press',targetMuscles:['chest'],equipments:['cable'],instructions:['Kontrolliert drücken.']}]}));});
 source.listen(0,'127.0.0.1');await once(source,'listening');sourceUrl=`http://127.0.0.1:${source.address().port}`;await start();
});
after(async()=>{await stop();if(users.length)await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();if(source)await new Promise(r=>source.close(r));});
test('full training survives a real API process restart and a new login',async()=>{
 const a=await account();const sent=workout();const {workout:saved}=await request('PUT','/api/workouts/by-date/'+sent.date,a.token,sent);
 assert.equal(saved.exercises[0].repetitions,'8–12');assert.equal(saved.exercises[0].weight,0);assert.equal(saved.exercises[0].restSeconds,0);assert.equal(saved.exercises[1].repetitions,'30 Sek.');
 assert.equal(saved.exercises[0].exercise.catalogId,'bankdruecken');assert.equal(saved.notes,sent.notes);
 await stop();await start();const login=await request('POST','/api/auth/login',null,{email:a.input.email,password});
 assert.deepEqual((await request('GET','/api/workouts',login.token)).workouts,[saved]);
});
test('failed replacements roll back and each account has only one training per date',async()=>{
 const a=await account();const sent=workout();const saved=(await request('PUT','/api/workouts/by-date/'+sent.date,a.token,sent)).workout;
 await request('PUT','/api/workouts/by-date/'+sent.date,a.token,workout({exercises:[...sent.exercises,{catalogId:'does-not-exist',position:3,sets:3,repetitions:'8'}]}),400);
 assert.deepEqual((await request('GET','/api/workouts',a.token)).workouts,[saved]);
 const reversed=sent.exercises.slice().reverse().map((x,i)=>({...x,position:i+1}));
 const updated=(await request('PUT','/api/workouts/by-date/'+sent.date,a.token,workout({name:'Neu',exercises:reversed}))).workout;
 assert.equal(updated.id,saved.id);assert.deepEqual(updated.exercises.map(x=>x.exercise.catalogId),['kabelrudern','bankdruecken']);
 const parallel=await Promise.all([1,2,3].map(n=>fetch(base+'/api/workouts/by-date/'+sent.date,{method:'PUT',headers:{Authorization:`Bearer ${a.token}`,'Content-Type':'application/json'},body:JSON.stringify(workout({name:'Parallel '+n}))})));
 assert.ok(parallel.every(x=>[200,409].includes(x.status)));assert.ok(parallel.some(x=>x.ok));
 assert.equal((await request('GET','/api/workouts',a.token)).workouts.length,1);
});
test('account ownership, rest days, invalid inputs and logout are enforced by PostgreSQL-backed routes',async()=>{
 const a=await account(),b=await account();const sent=workout();const saved=(await request('PUT','/api/workouts/by-date/'+sent.date,a.token,sent)).workout;
 assert.deepEqual((await request('GET','/api/workouts',b.token)).workouts,[]);
 for(const [method,suffix,body] of [['GET','',undefined],['PATCH','/status',{status:'ERLEDIGT'}],['DELETE','',undefined]])await request(method,'/api/workouts/'+saved.id+suffix,b.token,body,404);
 for(const duration of [0,601,1.5,'45'])await request('PUT','/api/workouts/by-date/'+sent.date,a.token,workout({duration}),400);
 await request('PUT','/api/workouts/by-date/2026-02-30',a.token,workout({date:'2026-02-30'}),400);
 await request('PUT','/api/workouts/by-date/2199-01-01',a.token,workout({date:'2199-01-01',status:'ERLEDIGT'}),400);
 const rest=(await request('PUT','/api/workouts/by-date/'+sent.date,a.token,workout({duration:0,status:'RUHE',type:'Rest Day',muscles:[],exercises:[],time:null}))).workout;
 await request('PATCH','/api/workouts/'+rest.id+'/status',a.token,{status:'ERLEDIGT'},400);
 await request('POST','/api/auth/logout',a.token,undefined,204);await stop();await start();await request('GET','/api/auth/me',a.token,undefined,401);
 const fresh=await request('POST','/api/auth/login',null,{email:a.input.email,password});await request('DELETE','/api/workouts/'+rest.id,fresh.token,undefined,204);
 assert.deepEqual((await request('GET','/api/workouts',fresh.token)).workouts,[]);
});
test('loaded external exercise IDs and local catalog IDs stay distinct after saving',async()=>{
 const a=await account();await request('GET','/api/exercises?limit=25');
 const sent=workout({exercises:[{catalogId:'api:remote-persistence',externalId:'remote-persistence',position:1,sets:3,repetitions:'8-12',weight:0,restSeconds:0}]});
 const saved=(await request('PUT','/api/workouts/by-date/'+sent.date,a.token,sent)).workout;
 assert.equal(saved.exercises[0].exercise.catalogId,'api:remote-persistence');assert.equal(saved.exercises[0].exercise.name,'Remote Press');
 await request('POST','/api/auth/register',null,{username:42,email:[],password:{}},400);
 await request('POST','/api/auth/register',null,{username:'Short',email:'short@example.test',password:'1234567'},400);
});
