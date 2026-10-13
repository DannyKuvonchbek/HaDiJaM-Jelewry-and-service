require('reflect-metadata');
const assert = require('node:assert/strict');
const {AtelierChatGateway} = require('../dist/components/atelier-chat/atelier-chat.gateway');
const {AtelierChatService} = require('../dist/components/atelier-chat/atelier-chat.service');
async function main() {
 const customer={_id:'507f1f77bcf86cd799439011',memberType:'USER',memberNick:'customer'};
 const owner={_id:'507f1f77bcf86cd799439012',memberType:'SELLER',memberNick:'Martin'};
 const chatService=new AtelierChatService({}, {findOne:filter=>{assert.equal(filter.memberType,'SELLER');assert.ok(filter.memberNick.test('Martin'));assert.ok(!filter.memberNick.test('Danny'));return {lean:()=>({exec:async()=>owner})};}});
 assert.equal(chatService.isOwner(owner),true);
 assert.equal(chatService.isOwner({...owner,memberNick:'Danny'}),false);
 assert.equal(chatService.isOwner({...owner,memberType:'USER'}),false);
 assert.equal(await chatService.owner(),owner);
 let saved=0,revoked=false;
 const gateway=new AtelierChatGateway({getAuthenticatedMember:async token=>{if(revoked)throw new Error('revoked');return token==='owner'?owner:customer;}},{owner:async()=>owner,isOwner:member=>member._id===owner._id,canSellerOpenCustomer:async()=>true,saveMessage:async input=>{saved++;const data={_id:String(saved),senderId:customer._id,recipientId:owner._id,messageContent:input.messageContent};return {...data,toObject:()=>data};}});
 const makeSocket=()=>({readyState:1,packets:[],send(value){this.packets.push(JSON.parse(value));},close(){this.closed=true;}});
 const sender=makeSocket(),recipient=makeSocket();gateway.server={clients:new Set([sender,recipient])};
 await gateway.authenticate(sender,{token:'customer',atelier:'milano-heritage-restoration'});
 await gateway.authenticate(recipient,{token:'owner',atelier:'milano-heritage-restoration',customerId:customer._id});
 const RealDate=Date;
 try {
  for(const time of ['2026-10-17T03:00:00+09:00','2026-10-18T23:00:00+09:00','2026-10-19T22:00:00+09:00']) {
   global.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[time]));}static now(){return new RealDate(time).getTime();}};
   await gateway.sendMessage(sender,{messageContent:'After-hours private message'});
   assert.equal(sender.packets.at(-1).event,'message:new');assert.equal(recipient.packets.at(-1).event,'message:new');
  }
  assert.equal(saved,3);revoked=true;await gateway.sendMessage(sender,{messageContent:'must not be saved'});assert.equal(saved,3);assert.equal(sender.closed,true);
 } finally {global.Date=RealDate;}
 console.log('PASS: Martin seller ownership, Saturday/Sunday/night messaging and revoked-session rejection.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
