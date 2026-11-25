const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHttpApi}=require('../src/services/httpApi.ts');
const {configuredApi}=require('../src/services/configuredApi.ts');
const {ApiError,FeatureUnavailableError}=require('../src/services/api.ts');
const {toWorkoutDto}=require('../src/services/workoutAdapter.ts');
const {workoutTemplates}=require('../src/data/templates.ts');
const {initialHealthProfile}=require('../src/data/profile.ts');
const account={id:'user-one',username:'Test',email:'test@example.test'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const dto={id:'workout-db',name:'Servertraining',date:'2026-11-23',duration:60,time:'18:30',status:'GEPLANT',type:'Push',intensity:'Mittel',muscles:['Brust'],exercises:[{id:'association',exerciseId:'exercise-db',position:1,sets:3,repetitions:'8–12',weight:0,restSeconds:0,exercise:{name:'Gespeicherte Presse',externalId:'remote-id',targetMuscles:['chest'],equipments:['cable']}}]};
const target={calories:2000,protein:120,carbs:245,fat:60};
const daily={dateIso:'2026-11-23',...target};

test('HTTP auth normalizes email, keeps server-compatible login, validates sessions and scopes tokens',async()=>{
  const calls=[];const api=createHttpApi('https://example.test/root/',{request:async(url,init)=>{calls.push({url,init});return json({user:account,token:'test-token'});}});
  assert.equal((await api.login({email:' TEST@example.test ',password:'secret'})).token,'test-token');
  assert.equal(calls[0].url,'https://example.test/root/api/auth/login');
  assert.equal(JSON.parse(calls[0].init.body).email,'test@example.test');
  assert.equal(calls[0].init.headers.Authorization,undefined);
  await api.register({email:' NEW@example.test ',username:' New User ',password:'new-password'});
  assert.equal(calls[1].url,'https://example.test/root/api/auth/register');
  assert.deepEqual(JSON.parse(calls[1].init.body),{email:'new@example.test',username:'New User',password:'new-password'});
  const count=calls.length;
  await assert.rejects(()=>api.register({email:'new@example.test',username:'New User',password:'short'}),error=>error.status===400);
  assert.equal(calls.length,count);
  assert.notEqual(api.sessionKey,createHttpApi('https://second.test').sessionKey);
  assert.match(api.sessionKey,/^[\w.-]+$/);
  assert.throws(()=>createHttpApi('https://user:password@example.test'));
  assert.throws(()=>createHttpApi('file:///example'));
  const bad=createHttpApi('https://example.test',{request:async()=>json({user:{id:'broken'},token:'test'})});
  await assert.rejects(()=>bad.login({email:'test@example.test',password:'secret'}),error=>error.status===502);
});

test('legacy backend supports real reads and status/delete but refuses unsafe partial writes',async()=>{
  const calls=[];const api=createHttpApi('https://example.test',{request:async(url,init)=>{
    calls.push({url,init});
    if(init.method==='DELETE')return new Response(null,{status:204});
    if(url.endsWith('/api/auth/me'))return json({user:account});
    if(url.includes('/api/exercises'))return json({exercises:[{id:'remote-id',name:'Presse'}]});
    return json(init.method==='GET'?{workouts:[dto]}:{workout:dto});
  }});
  const [saved]=await api.listWorkouts('test-token');
  assert.equal(saved.exercises[0].catalogEntry.name,'Gespeicherte Presse');
  assert.equal(saved.exercises[0].catalogEntry.id,'api:remote-id');
  assert.equal((await api.me('test-token')).id,account.id);
  assert.equal((await api.listExercises())[0].id,'api:remote-id');
  await api.setStatus('test-token',saved,'erledigt');await api.deleteWorkout('test-token',saved);
  const before=calls.length;
  for(const action of [()=>api.saveWorkout('test-token',saved),()=>api.listPlans('test-token'),()=>api.getProfile('test-token'),()=>api.getMacroTarget('test-token')])await assert.rejects(action,FeatureUnavailableError);
  assert.equal(calls.length,before,'unsupported operations must not create half-saved records');
  assert.equal(calls[0].init.headers.Authorization,'Bearer test-token');
  assert.equal(calls.find(call=>call.url.includes('/api/exercises')).init.headers.Authorization,undefined);
});

test('complete contract transports ordered exercise values and all profile/plan/macro operations',async()=>{
  const calls=[];const plan=workoutTemplates[0];
  const api=createHttpApi('https://example.test',{contract:'v1',request:async(url,init)=>{
    calls.push({url,init});if(init.method==='DELETE'||url.endsWith('/logout'))return new Response(null,{status:204});
    if(url.includes('/workouts/'))return json({workout:dto});
    if(url.endsWith('/plans'))return json({plans:[plan]});
    if(url.includes('/plans/'))return json({plan});
    if(url.endsWith('/profile'))return json({profile:initialHealthProfile});
    if(url.endsWith('/target'))return json({target});
    if(url.endsWith('/logs'))return json({logs:[daily]});
    return json({log:daily});
  }});
  const real=createHttpApi('https://example.test',{request:async()=>json({workouts:[dto]})});
  const [saved]=await real.listWorkouts('test-token');
  await api.saveWorkout('test-token',saved);
  const write=calls[0];assert.match(write.url,/\/api\/workouts\/by-date\/2026-11-23$/);
  assert.deepEqual(JSON.parse(write.init.body).exercises,[{id:'association',catalogId:'api:remote-id',externalId:'remote-id',position:1,sets:3,repetitions:'8–12',weight:0,restSeconds:0,notes:null}]);
  assert.equal(toWorkoutDto(saved).exercises[0].weight,0);
  assert.equal((await api.listPlans('test-token'))[0].id,plan.id);
  await api.savePlan('test-token',plan);await api.deletePlan('test-token',plan);
  await api.getProfile('test-token');await api.saveProfile('test-token',initialHealthProfile);
  await api.getMacroTarget('test-token');await api.saveMacroTarget('test-token',target);
  await api.listMacroLogs('test-token');await api.saveMacroLog('test-token',daily);await api.deleteMacroLog('test-token',daily.dateIso);await api.logout('test-token');
  assert.ok(calls.every(call=>call.init.headers.Authorization==='Bearer test-token'));
  assert.equal(calls.filter(call=>call.init.method==='PUT').length,5);
});

test('HTTP errors, timeout, invalid JSON and absent endpoints stay failures without demo fallback',async()=>{
  for(const status of [401,403,409,500]){
    const api=createHttpApi('https://example.test',{request:async()=>json({message:'private server details'},status)});
    await assert.rejects(()=>api.me('test-token'),error=>error instanceof ApiError&&error.status===status&&!error.message.includes('private'));
  }
  const absent=createHttpApi('https://example.test',{contract:'v1',request:async()=>json({},404)});
  await assert.rejects(()=>absent.listPlans('test-token'),FeatureUnavailableError);
  await assert.rejects(()=>absent.savePlan('test-token',workoutTemplates[0]),error=>error.status===404&&!(error instanceof FeatureUnavailableError));
  const broken=createHttpApi('https://example.test',{request:async()=>new Response('not JSON')});
  await assert.rejects(()=>broken.me('test-token'),error=>error.status===502);
  for(const patch of [{status:'toString'},{notes:{}},{muscles:[42]},{exercises:[{...dto.exercises[0],exercise:{name:42}}]}]) {
    const malformed=createHttpApi('https://example.test',{request:async()=>json({workouts:[{...dto,...patch}]})});
    await assert.rejects(()=>malformed.listWorkouts('test-token'),error=>error.status===502);
  }
  const timeout=createHttpApi('https://example.test',{timeoutMs:5,request:(_url,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(Error('abort'))))});
  await assert.rejects(()=>timeout.me('test-token'),error=>error.status===504);
  for(const config of [{mode:'server'},{mode:'server',baseUrl:'invalid'},{mode:'typo'},{mode:'server',baseUrl:'https://example.test',contract:'typo'}])assert.equal(configuredApi(config).api,undefined);
  assert.equal(configuredApi({}).api.mode,'demo');
  assert.equal(configuredApi({baseUrl:'https://example.test'}).api.mode,'server');
});
