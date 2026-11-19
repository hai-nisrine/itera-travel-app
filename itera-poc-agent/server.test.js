import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';

test('HTTP fixture, baseline, no-match and invalid request workflows',async()=>{
 const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited before startup');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout')),5000);timer.unref();})]);
  const base=`http://127.0.0.1:${port}`;
  const fixtures=await fetch(base+'/api/fixtures');assert.equal(fixtures.status,200);const data=await fixtures.json();assert.equal(data.trips.length,15);assert.equal(data.travelers.length,10);
  const post=body=>fetch(base+'/api/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const match=await post({profile:data.travelers[0],useAI:false});assert.equal(match.status,200);const result=await match.json();assert.equal(result.mode,'deterministic_baseline');assert.deepEqual(result.recommendations.map(r=>r.trip.id).sort(),['agadir_beach','essaouira_riad']);
  const noMatch=await post({profile:data.travelers.find(p=>p.id==='nour'),useAI:false});assert.deepEqual(await noMatch.json(),{mode:'no_matches',recommendations:[]});
  const invalid=await fetch(base+'/api/listing',{method:'POST',body:JSON.stringify({history:[null]})});assert.equal(invalid.status,400);assert.equal((await invalid.json()).error,'Invalid conversation');
  assert.equal((await fetch(base+'/api/match',{method:'POST',body:'{'})).status,400);
  assert.equal((await fetch(base+'/missing')).status,404);
 }finally{const exited=once(child,'exit');child.kill();await exited;}
});
