// Executes the real frontend auth module in isolated browser-like contexts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync(path.resolve(__dirname,'../../Hadijam    frontend/libs/auth/index.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText;
let now=Date.now(),refreshCalls=0,apiCalls=0,failRefresh=false,forceApiUnauthorized=false,cookie=0,revoked=false;
let lockTail=Promise.resolve();const channels=new Set();
const user={_id:'507f1f77bcf86cd799439011',memberNick:'test',memberType:'USER',memberStatus:'ACTIVE'};
const jwt=()=>[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user._id,sid:'507f1f77bcf86cd799439012',exp:Math.floor(now/1000)+240})).toString('base64url'),'test'].join('.');
class Storage{constructor(){this.values=new Map([['accessToken','legacy-sensitive-token'],['memberNick','legacy-name']]);}get length(){return this.values.size;}key(i){return [...this.values.keys()][i]??null;}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}removeItem(k){this.values.delete(k);}}
function makeClient(){
 const listeners=new Map(),storage=new Storage(),sessionStorage=new Storage();const module={exports:{}};
 const window={addEventListener:(name,fn)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeEventListener:(name,fn)=>listeners.get(name)?.delete(fn),dispatchEvent:event=>{for(const fn of listeners.get(event.type)??[])fn(event);},setInterval,clearInterval};
 class Channel{constructor(){channels.add(this);}postMessage(data){for(const ch of channels)if(ch!==this)ch.onmessage?.({data});}}
 const fetch=async(input,init={})=>{
  if(String(input).includes('/auth/')){
   assert.equal(init.credentials,'include');assert.equal(new Headers(init.headers).get('x-hadijam-csrf'),'1');
   const endpoint=String(input).split('/').pop();
   if(endpoint==='refresh'){refreshCalls++;await new Promise(resolve=>setTimeout(resolve,5));if(failRefresh)throw new Error('temporary network error');if(revoked)return new Response('{}',{status:401});cookie++;return Response.json({accessToken:jwt(),member:user});}
   if(endpoint==='logout'||endpoint==='logout-all'){revoked=true;return Response.json({success:true});}
   return Response.json({expiresAt:new Date(now+14*86400000)});
  }
  apiCalls++;assert.equal(init.credentials,'include');assert.ok(new Headers(init.headers).get('authorization')?.startsWith('Bearer '));
  if(forceApiUnauthorized){forceApiUnauthorized=false;return new Response('{}',{status:401});}return Response.json({success:true});
 };
 class TestDate extends Date{static now(){return now;}}
 const context=vm.createContext({exports:module.exports,module,window,document:{visibilityState:'visible'},navigator:{locks:{request:(_name,fn)=>{const value=lockTail.then(fn);lockTail=value.catch(()=>{});return value;}}},BroadcastChannel:Channel,localStorage:storage,sessionStorage,crypto:require('node:crypto').webcrypto,fetch,Response,Headers,AbortSignal,Event,Date:TestDate,atob:value=>Buffer.from(value,'base64').toString(),setTimeout,clearTimeout,clearInterval,console,process:{env:{}}});
 vm.runInContext(code,context);return {auth:module.exports,storage,window};
}
async function main(){
 const a=makeClient(),b=makeClient();await a.auth.initializeAuth();await b.auth.initializeAuth();
 assert.equal(a.storage.getItem('accessToken'),null);assert.equal(a.storage.getItem('memberNick'),null);assert.ok(a.auth.getAccessToken());
 now+=241000;const before=refreshCalls;await Promise.all([a.auth.ensureAccessToken(),a.auth.ensureAccessToken(),b.auth.ensureAccessToken()]);assert.equal(refreshCalls,before+1);assert.equal(a.auth.getAccessToken(),b.auth.getAccessToken());
 for(const value of a.storage.values.values())assert.ok(!value.includes(a.auth.getAccessToken()));
 forceApiUnauthorized=true;apiCalls=0;await a.auth.authorizedFetch('http://localhost/api');assert.equal(apiCalls,2);
 now+=241000;failRefresh=true;const previous=a.auth.getAccessToken();await assert.rejects(a.auth.ensureAccessToken(),/network/);assert.equal(a.auth.getAccessToken(),previous);failRefresh=false;await a.auth.ensureAccessToken();
 await a.auth.logoutSession();assert.equal(a.auth.getAccessToken(),'');assert.equal(b.auth.getAccessToken(),'');assert.equal(a.auth.getSessionMember(),null);
 console.log('PASS: real frontend module removes legacy storage, serializes parallel requests/tabs, retries auth once, retains state on network failure, and clears all tabs on logout.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
