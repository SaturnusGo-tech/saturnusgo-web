import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:https';
import {spawn,spawnSync} from 'node:child_process';

export async function captureRelayPost(referrerPolicy) {
 const browser=[process.env.FALCON_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(path=>path&&existsSync(path));
 if(!browser)return null;
 const directory=await mkdtemp(join(tmpdir(),'falcon-relay-origin-'));
 let source,target,child;
 try {
  const key=join(directory,'key.pem'),cert=join(directory,'cert.pem');
  const certificate=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=127.0.0.1'],{stdio:'ignore'});
  if(certificate.status!==0)throw new Error('Could not create the disposable local HTTPS fixture.');
  const tls={key:await readFile(key),cert:await readFile(cert)};
  let finish;
  const consumed=new Promise(resolve=>{finish=resolve;});
  target=createServer(tls,(request,response)=>{
   if(request.url!=='/consume'){response.writeHead(404).end();return;}
   let body='';request.setEncoding('utf8');request.on('data',chunk=>{body+=chunk;});
   request.on('end',()=>{finish({origin:request.headers.origin,referer:request.headers.referer,method:request.method,body});
    response.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Local handoff consumed</title>');});
  });
  await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve));
  const destination=`https://127.0.0.1:${target.address().port}/consume`;
  source=createServer(tls,(_request,response)=>{
   response.writeHead(200,{'content-type':'text/html','referrer-policy':referrerPolicy,'cache-control':'no-store'});
   response.end(`<!doctype html><form method="post" action="${destination}"><input name="code" value="local-test-only"></form><script>document.forms[0].requestSubmit()</script>`);
  });
  await new Promise(resolve=>source.listen(0,'127.0.0.1',resolve));
  const sourceOrigin=`https://127.0.0.1:${source.address().port}`;
  let stderr='';
  child=spawn(browser,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking',
   '--disable-component-update','--disable-sync','--no-proxy-server','--ignore-certificate-errors',`--user-data-dir=${join(directory,'profile')}`,
   '--dump-dom',`${sourceOrigin}/relay?private=must-not-leak`],{stdio:['ignore','ignore','pipe']});
  child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-2000);});
  const stopped=new Promise((_,reject)=>{child.once('error',reject);child.once('exit',code=>reject(new Error(`Headless browser exited before form submission (${code}): ${stderr}`)));});
  let timer;
  try {
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('The local HTTPS browser handoff timed out.')),20000);});
   return {...await Promise.race([consumed,stopped,timeout]),sourceOrigin};
  } finally {clearTimeout(timer);}
 } finally {
  if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
  await Promise.all([source,target].filter(Boolean).map(server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})));
  await rm(directory,{recursive:true,force:true});
 }
}
