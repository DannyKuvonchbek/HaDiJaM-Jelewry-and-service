// Disposable database only. Never loads .env or connects to the application's MongoDB.
require('reflect-metadata');
const assert=require('node:assert/strict');
const {MongoMemoryReplSet}=require(process.env.MONGODB_MEMORY_SERVER_MODULE||'mongodb-memory-server');
const {JwtService}=require('@nestjs/jwt');
const {SessionService}=require('../dist/components/auth/sessions/session.service');
const {allowedOrigins,requireBrowserRequest,limitAuth}=require('../dist/components/auth/sessions/auth-security');
const mongoose=require('mongoose');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
async function main(){
 const privateDir=fs.mkdtempSync(path.join(os.tmpdir(),'hadijam-session-security-'));
 const repl=await MongoMemoryReplSet.create({replSet:{count:1},binary:{downloadDir:path.join(os.tmpdir(),'hadijam-mongo-binaries')}});
 let app;
 try{
  process.env.NODE_ENV='test';process.env.MONGODB_URI=repl.getUri('sessions-test');process.env.JWT_SECRET='isolated-security-test-key-not-for-production';process.env.SMS_ENABLED='false';process.env.PRIVATE_DOCUMENT_DIR=privateDir;
  const {NestFactory}=require('@nestjs/core'),{AppModule}=require('../dist/app.module');
  app=await NestFactory.create(AppModule,{logger:false,abortOnError:false});
  app.useWebSocketAdapter(new(require('@nestjs/platform-ws').WsAdapter)(app));
  app.useGlobalPipes(new(require('@nestjs/common').ValidationPipe)({transform:true,whitelist:true}));
  app.enableCors({origin:allowedOrigins(),credentials:true,allowedHeaders:['Content-Type','Authorization','X-Hadijam-CSRF']});
  await app.listen(0,'127.0.0.1');
  const base=await app.getUrl(),conn=app.get(require('@nestjs/mongoose').getConnectionToken()),members=conn.model('Member'),sessions=conn.model('AuthSession'),service=app.get(SessionService);
  await Promise.all(Object.values(conn.models).map(m=>m.init()));
  const password='testPassword123',bcrypt=require('bcryptjs');
  const user=await members.create({memberNick:'sessionUser',memberPhone:'+998901111111',memberPassword:await bcrypt.hash(password,4),memberType:'USER',memberAddress:'Private address'});
  const admin=await members.create({memberNick:'sessionAdmin',memberPhone:'+998902222222',memberPassword:await bcrypt.hash(password,4),memberType:'ADMIN'});
  const headers={Origin:'http://localhost:1017','X-Hadijam-CSRF':'1','Content-Type':'application/json'};
  const login=async nick=>{
   const response=await fetch(base+'/graphql',{method:'POST',headers,body:JSON.stringify({query:'mutation($input:LoginInput!){login(input:$input){_id accessToken memberType}}',variables:{input:{memberNick:nick,memberPassword:password}}})});
   const result=await response.json();assert.equal(result.errors,undefined,JSON.stringify(result.errors));
   const cookie=response.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('SameSite=Lax'));assert.ok(!cookie.includes('Domain='));
   return {...result.data.login,cookie:cookie.split(';')[0]};
  };
  const rest=async(path,cookie,accessToken,customHeaders=headers)=>fetch(base+'/auth/'+path,{method:path==='session'?'GET':'POST',headers:{...customHeaders,...(cookie?{Cookie:cookie}:{}),...(accessToken?{Authorization:'Bearer '+accessToken}:{})}});
  const first=await login('sessionUser'),second=await login('sessionUser');
  const jwt=new JwtService({secret:process.env.JWT_SECRET}),claims=jwt.decode(first.accessToken);
  assert.deepEqual(Object.keys(claims).sort(),['aud','exp','iat','iss','sid','sub']);assert.equal(claims.exp-claims.iat,240);
  assert.notEqual(claims.sid,jwt.decode(second.accessToken).sid);
  const expired=await jwt.signAsync({sub:String(user._id),sid:claims.sid},{issuer:'hadijam-api',audience:'hadijam-web',expiresIn:-1});
  await assert.rejects(service.authenticate(expired));
  await assert.rejects(service.authenticate(await jwt.signAsync({_id:String(user._id)},{expiresIn:'30d'})));
  await assert.rejects(service.authenticate(await jwt.signAsync({sub:String(user._id),sid:claims.sid},{issuer:'wrong',audience:'hadijam-web',expiresIn:240})));
  const original=await sessions.findById(claims.sid).lean();
  const rotation=await rest('refresh',first.cookie);assert.equal(rotation.status,201);
  const rotated=await rotation.json(),newCookie=rotation.headers.get('set-cookie').split(';')[0];assert.notEqual(newCookie,first.cookie);
  const after=await sessions.findById(claims.sid).lean();assert.equal(after.generation,1);assert.equal(+after.expiresAt,+original.expiresAt);assert.equal(+after.lastActivityAt,+original.lastActivityAt);
  assert.ok((await service.authenticate(rotated.accessToken)).member);
  assert.equal((await rest('refresh',first.cookie)).status,401);await assert.rejects(service.authenticate(rotated.accessToken));
  assert.equal((await rest('session',second.cookie,second.accessToken)).status,200);
  const idle=await service.create(String(user._id));const idleClaims=jwt.decode(idle.accessToken),today=Date.now();
  await sessions.updateOne({_id:idleClaims.sid},{$set:{lastActivityAt:new Date(today-13*86400000),expiresAt:new Date(today+86400000)}});
  const idleRotated=await service.refresh(idle.refreshToken);assert.ok(idleRotated.accessToken);
  const activity=await service.activity(idleRotated.accessToken,idleRotated.refreshToken);assert.ok(+new Date(activity.expiresAt)>today+13*86400000);
  const repeatedActivity=await service.activity(idleRotated.accessToken,idleRotated.refreshToken);assert.equal(+new Date(activity.expiresAt),+new Date(repeatedActivity.expiresAt));
  await sessions.updateOne({_id:idleClaims.sid},{$set:{expiresAt:new Date(Date.now()-1)}});await assert.rejects(service.authenticate(idleRotated.accessToken));await assert.rejects(service.refresh(idleRotated.refreshToken));
  const legacyIdle=await service.create(String(user._id));const legacyIdleId=jwt.decode(legacyIdle.accessToken).sid;
  await sessions.updateOne({_id:legacyIdleId},{$set:{lastActivityAt:new Date(Date.now()-14*86400000),expiresAt:new Date(Date.now()+16*86400000)}});
  await assert.rejects(service.authenticate(legacyIdle.accessToken));await assert.rejects(service.refresh(legacyIdle.refreshToken));
  const race=await service.create(String(user._id));const raceResults=await Promise.allSettled([service.refresh(race.refreshToken),service.refresh(race.refreshToken)]);assert.equal(raceResults.filter(r=>r.status==='fulfilled').length,1);await assert.rejects(service.authenticate(race.accessToken));
  const forged=await service.create(String(user._id));await assert.rejects(service.refresh(forged.refreshToken.replace(/.$/,forged.refreshToken.endsWith('a')?'b':'a')));assert.ok(await service.authenticate(forged.accessToken));
  assert.equal((await rest('refresh',second.cookie,undefined,{...headers,Origin:'https://evil.example'})).status,403);
  assert.equal((await rest('refresh',second.cookie,undefined,{Origin:headers.Origin})).status,403);
  assert.throws(()=>requireBrowserRequest({headers:{origin:'https://hadijam.com'}}));
  const cors=await fetch(base+'/auth/refresh',{method:'OPTIONS',headers:{Origin:'https://evil.example','Access-Control-Request-Method':'POST'}});assert.equal(cors.headers.get('access-control-allow-origin'),null);
  const csrfGood=await fetch(base+'/auth/refresh',{method:'OPTIONS',headers:{Origin:headers.Origin,'Access-Control-Request-Method':'POST'}});assert.equal(csrfGood.headers.get('access-control-allow-origin'),headers.Origin);
  const publicQuery=async accessToken=>{const response=await fetch(base+'/graphql',{method:'POST',headers:{...headers,...(accessToken?{Authorization:'Bearer '+accessToken}:{})},body:JSON.stringify({query:'query($id:String!){getMember(memberId:$id){memberPhone memberAddress}}',variables:{id:String(user._id)}})});return response.json();};
  assert.deepEqual((await publicQuery()).data.getMember,{memberPhone:'',memberAddress:null});
  assert.equal((await publicQuery(second.accessToken)).data.getMember.memberPhone,user.memberPhone);
  const adminLogin=await login('sessionAdmin');assert.equal((await publicQuery(adminLogin.accessToken)).data.getMember.memberPhone,user.memberPhone);
  assert.equal((await rest('logout',second.cookie)).status,201);await assert.rejects(service.authenticate(second.accessToken));
  const a=await login('sessionUser'),b=await login('sessionUser');assert.equal((await rest('logout-all',a.cookie,a.accessToken)).status,201);await assert.rejects(service.authenticate(a.accessToken));await assert.rejects(service.authenticate(b.accessToken));
  const blocked=await service.create(String(user._id));await members.updateOne({_id:user._id},{$set:{memberStatus:'BLOCK'}});await assert.rejects(service.authenticate(blocked.accessToken));await assert.rejects(service.refresh(blocked.refreshToken));await members.updateOne({_id:user._id},{$set:{memberStatus:'ACTIVE'}});
  const passwordSession=await service.create(String(user._id));const {MemberService}=require('../dist/components/members/member.service');await app.get(MemberService).updateMember(String(user._id),{memberPassword:'newPassword123'});await assert.rejects(service.authenticate(passwordSession.accessToken));
  const statusSession=await service.create(String(user._id));await app.get(MemberService).updateMembersByAdmin({_id:String(user._id),memberStatus:'BLOCK'});await members.updateOne({_id:user._id},{$set:{memberStatus:'ACTIVE'}});await assert.rejects(service.authenticate(statusSession.accessToken));
  // Private image endpoints and WebSocket authentication use the same live sessions.
  const mediaSession=await service.create(String(user._id));
  const mediaName=String(user._id)+'-'+require('node:crypto').randomUUID()+'.png';
  const mediaPath=path.resolve('uploads/atelier',mediaName);fs.mkdirSync(path.dirname(mediaPath),{recursive:true});fs.writeFileSync(mediaPath,Buffer.from([137,80,78,71,13,10,26,10]));
  try {
   const mediaUrl=base+'/private-media/atelier/'+mediaName;
   assert.equal((await fetch(mediaUrl)).status,401);
   assert.equal((await fetch(mediaUrl,{headers:{Authorization:'Bearer '+mediaSession.accessToken}})).status,200);
   assert.equal((await fetch(mediaUrl,{headers:{Authorization:'Bearer '+adminLogin.accessToken}})).status,200);
   const outsider=await members.create({memberNick:'outsider',memberPhone:'+998903333333',memberPassword:'unused',memberType:'USER'});
   const outsiderSession=await service.create(String(outsider._id));
   assert.equal((await fetch(mediaUrl,{headers:{Authorization:'Bearer '+outsiderSession.accessToken}})).status,404);
   const {AtelierChatGateway}=require('../dist/components/atelier-chat/atelier-chat.gateway');
   const gateway=new AtelierChatGateway(app.get(require('../dist/components/auth/auth.service').AuthService),{owner:async()=>admin,isOwner:()=>false});
   const packets=[];const socket={readyState:1,send:value=>packets.push(JSON.parse(value)),close:()=>{socket.closed=true;}};
   await gateway.authenticate(socket,{token:mediaSession.accessToken,atelier:'test'});assert.equal(packets.at(-1).event,'auth:success');
   await service.logout(mediaSession.refreshToken);await gateway.sendMessage(socket,{messageContent:'must not be stored'});
   assert.equal(socket.closed,true);assert.equal(packets.at(-1).event,'auth:error');
  } finally {fs.rmSync(mediaPath,{force:true});}
  const {setRefresh}=require('../dist/components/auth/sessions/auth-security');process.env.NODE_ENV='production';let cookieDetails;setRefresh({cookie:(...args)=>cookieDetails=args,setHeader:()=>{}},'token',new Date());assert.equal(cookieDetails[0],'__Host-hadijam-refresh');assert.equal(cookieDetails[2].secure,true);assert.deepEqual(allowedOrigins(),['https://hadijam.com','https://www.hadijam.com']);process.env.NODE_ENV='test';
  for(let i=0;i<3;i++)limitAuth({ip:'isolated-test'},'test',3);assert.throws(()=>limitAuth({ip:'isolated-test'},'test',3),/Too many/);
  console.log('PASS: 4-minute minimal JWT, issuer/expiry/legacy rejection, rotation/reuse/parallel races, 13/14-day idle/activity throttle, multi-device logout, logout-all, password/block revocation, member privacy, cookies/CSRF/CORS/rate limits.');
 }finally{if(app)await app.close();await repl.stop();fs.rmSync(privateDir,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
