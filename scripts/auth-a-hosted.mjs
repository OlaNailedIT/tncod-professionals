import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const TEST_PROJECT = 'hyzkearnbhxznkeokacj';
const TEST_ORG = 'qrctrhdndbuypymdxzkr';
const PROD_PROJECT = 'brpppukzqgpzxjelwwrj';
const input = JSON.parse(await new Promise(resolve => {
  let data = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', part => { data += part; });
  process.stdin.on('end', () => resolve(data));
}));
if (input.projectId !== TEST_PROJECT || input.projectId === PROD_PROJECT) {
  throw new Error('Refused: only the named disposable project is permitted');
}
const prefix = `/v1/projects/${TEST_PROJECT}`;
async function manage(suffix, method = 'GET', payload) {
  if (!['', '/api-keys?reveal=true', '/api-keys/legacy', '/api-keys/legacy?enabled=false', '/api-keys/legacy?enabled=true', '/config/auth', '/database/query'].includes(suffix)) {
    throw new Error('Refused: management endpoint not allowlisted');
  }
  const response = await fetch(`https://api.supabase.com${prefix}${suffix}`, {
    method,
    headers: { Authorization: `Bearer ${input.managementToken}`, 'Content-Type': 'application/json', 'Cache-Control':'no-cache' },
    cache:'no-store',
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Management ${method} ${suffix.split('?')[0]} HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}
const checks = [];
let originalAuth, originalLegacy, changedAuth = false, changedLegacy = false;
function check(name, pass, detail = undefined) {
  checks.push({name, pass: Boolean(pass), ...(detail === undefined ? {} : {detail})});
  if (!pass) throw new Error(`Check failed: ${name}`);
}
const url = `https://${TEST_PROJECT}.supabase.co`;
async function authRequest(path, key, body, bearer) {
  const headers = {'Content-Type':'application/json'};
  if (key !== undefined) headers.apikey = key;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  return {status:response.status, bodyHash:createHash('sha256').update(text).digest('hex')};
}
async function waitLegacySetting(expected) {
  const deadline=Date.now()+60_000;
  do {
    const current=await manage('/api-keys/legacy');
    if(current.enabled===expected) return true;
    await new Promise(resolve=>setTimeout(resolve,3000));
  } while(Date.now()<deadline);
  return false;
}
try {
  const project = await manage('');
  if (project.id !== TEST_PROJECT || project.organization_id !== TEST_ORG || project.name !== 'tncod-auth-a-disposable') {
    throw new Error('Refused: disposable project identity mismatch');
  }
  const keys = await manage('/api-keys?reveal=true');
  if (!Array.isArray(keys)) throw new Error('Unsupported key response');
  const config = await manage('/config/auth');
  console.log(JSON.stringify({
    phase: input.phase, projectId: project.id, identityVerified: true,
    keys: keys.map(({name,type,disabled}) => ({name,type,disabled: Boolean(disabled)})),
    auth: {disableSignup:config.disable_signup, externalEmailEnabled:config.external_email_enabled},
    legacySetting: await manage('/api-keys/legacy'), productionChanged: false,
  }));
  if (input.phase === 'recover') {
    const write=await manage('/api-keys/legacy?enabled=true','PUT');
    console.log(JSON.stringify({operation:'restore test-project legacy keys',write}));
    const settled=await waitLegacySetting(true);
    console.log(JSON.stringify({operation:'recovery readback',settled,setting:await manage('/api-keys/legacy')}));
    if(!settled) process.exitCode=1;
  }
  if (input.phase === 'provider-proof') {
    check('owner-controlled mailbox supplied', typeof input.testEmail === 'string' && input.testEmail.includes('@'));
    const publishable = keys.find(k => k.type === 'publishable' && !k.disabled)?.api_key;
    const secret = keys.find(k => k.type === 'secret' && !k.disabled)?.api_key;
    const legacyAnon = keys.find(k => k.name === 'anon')?.api_key;
    const legacyService = keys.find(k => k.name === 'service_role')?.api_key;
    check('required key types available without publishing values', publishable && secret && legacyAnon && legacyService);
    originalAuth = config;
    originalLegacy = await manage('/api-keys/legacy');
    check('legacy keys initially enabled', originalLegacy.enabled === true);
    check('legacy anon works before deactivation', (await authRequest('settings', legacyAnon)).status === 200);
    // Only the isolated project's setting changes; restored in finally.
    await manage('/config/auth', 'PATCH', {disable_signup:true});
    changedAuth = true;
    const admin = createClient(url, secret, {auth:{persistSession:false,autoRefreshToken:false}});
    const existing = await admin.auth.admin.listUsers({perPage:1000});
    check('fixture inventory available', !existing.error);
    let member = existing.data.users.find(u => u.email === input.testEmail);
    if (member) check('existing fixture is this experiment only', member.user_metadata?.auth_a_probe === true);
    else {
      const created = await admin.auth.admin.createUser({email:input.testEmail,email_confirm:true,user_metadata:{auth_a_probe:true}});
      check('fixture registration via admin-only provisioning', !created.error && created.data.user);
      member = created.data.user;
    }
    const other = await admin.auth.admin.createUser({email:`auth-a-other-${randomUUID()}@example.com`,email_confirm:true,user_metadata:{auth_a_probe:true}});
    check('second synthetic identity provisioned', !other.error && other.data.user);
    const otherId = other.data.user.id;
    check('fixture UUIDs validated', [member.id,otherId].every(id => /^[0-9a-f-]{36}$/i.test(id)));
    await manage('/database/query', 'POST', {query:`
      CREATE TABLE IF NOT EXISTS public.auth_a_rls_probe (id uuid PRIMARY KEY, owner_id uuid NOT NULL, value text NOT NULL);
      ALTER TABLE public.auth_a_rls_probe ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT SELECT ON public.auth_a_rls_probe TO anon, authenticated;
      DROP POLICY IF EXISTS auth_a_own ON public.auth_a_rls_probe;
      CREATE POLICY auth_a_own ON public.auth_a_rls_probe FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
      INSERT INTO public.auth_a_rls_probe VALUES
        ('${randomUUID()}','${member.id}','own sentinel'),
        ('${randomUUID()}','${otherId}','other sentinel');
      NOTIFY pgrst, 'reload schema';
    `});
    const jar = new Map();
    const server = () => createServerClient(url, publishable, {
      cookies:{getAll:() => [...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))},
    });
    const client = server();
    const known = await client.auth.signInWithOtp({email:input.testEmail,options:{shouldCreateUser:false}});
    check('hosted existing-user OTP request with server-held publishable', !known.error, known.error?.code);
    const unknownEmail = `auth-a-unknown-${randomUUID()}@example.com`;
    const unknown = await client.auth.signInWithOtp({email:unknownEmail,options:{shouldCreateUser:false}});
    check('unknown identifier rejected without creating account', unknown.error?.code === 'otp_disabled', unknown.error?.code);
    const afterUnknown = await admin.auth.admin.listUsers({perPage:1000});
    check('unknown identity absent from Auth inventory', !afterUnknown.error && !afterUnknown.data.users.some(u=>u.email===unknownEmail));
    // Administrative OTP retrieval is fixture setup only; verification uses the user-scoped SSR client.
    const link = await admin.auth.admin.generateLink({type:'magiclink',email:input.testEmail});
    check('fixture verification token obtained without printing it', !link.error && link.data.properties?.email_otp);
    const verified = await client.auth.verifyOtp({email:input.testEmail,token:link.data.properties.email_otp,type:'email'});
    check('user-scoped SSR OTP verification', !verified.error && verified.data.user?.id===member.id);
    check('SSR session cookies set without API key', jar.size>0 && [...jar.values()].every(v=>!v.includes(publishable)));
    const preToken = verified.data.session.access_token;
    check('fresh request reads SSR session', (await server().auth.getUser()).data.user?.id===member.id);
    const refreshed = await client.auth.refreshSession();
    check('user-scoped session refresh before key deactivation', !refreshed.error && refreshed.data.user?.id===member.id);
    const anonRows = await createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}}).from('auth_a_rls_probe').select('owner_id');
    check('publishable anonymous RLS denies fixture rows', !anonRows.error && anonRows.data.length===0);
    const memberRows = await client.from('auth_a_rls_probe').select('owner_id');
    check('authenticated RLS exposes own rows only', !memberRows.error && memberRows.data.length>0 && memberRows.data.every(r=>r.owner_id===member.id));
    await manage('/api-keys/legacy?enabled=false','PUT');
    changedLegacy = true;
    check('hosted legacy setting disabled', await waitLegacySetting(false));
    let disabledStatus;
    for(let attempt=0;attempt<20;attempt++) {
      disabledStatus=(await authRequest('settings',legacyAnon)).status;
      if(disabledStatus===401) break;
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    check('previous anon key rejected on hosted Auth',disabledStatus===401,{status:disabledStatus});
    check('previous service-role key rejected on hosted Auth',(await authRequest('settings',legacyService)).status===401);
    check('publishable still works after hosted deactivation',(await authRequest('settings',publishable)).status===200);
    for (const [name,key,bearer] of [['missing',undefined,undefined],['invalid','auth-a-invalid',undefined],['user JWT as key',preToken,preToken],['bearer only',undefined,preToken]]) {
      const before=await authRequest('otp',key,{email:input.testEmail,create_user:false},bearer);
      const after=await authRequest('otp',key,{email:unknownEmail,create_user:false},bearer);
      check(`${name}: no identifier-dependent Auth response`,before.status===401 && after.status===401 && before.bodyHash===after.bodyHash,{known:before.status,unknown:after.status});
    }
    check('pre-deactivation JWT works with publishable key',(await server().auth.getUser()).data.user?.id===member.id);
    const afterRefresh=await client.auth.refreshSession();
    check('pre-deactivation session refresh survives legacy deactivation',!afterRefresh.error && afterRefresh.data.user?.id===member.id);
    const rowsAfter=await client.from('auth_a_rls_probe').select('owner_id');
    check('authenticated RLS remains narrow after deactivation',!rowsAfter.error && rowsAfter.data.length>0 && rowsAfter.data.every(r=>r.owner_id===member.id));
    const signedOut=await client.auth.signOut({scope:'local'});
    check('SSR sign-out clears session',!signedOut.error && !(await server().auth.getUser()).data.user);
  }
} catch (error) {
  // Errors are generated locally and omit request headers, credentials and provider response bodies.
  console.error(JSON.stringify({status:'BLOCKED',reason:error.message,projectId:TEST_PROJECT,productionChanged:false}));
  process.exitCode=1;
} finally {
  if (changedLegacy) {
    try {
      await manage(`/api-keys/legacy?enabled=${originalLegacy.enabled ? 'true':'false'}`,'PUT');
      const restored=await waitLegacySetting(originalLegacy.enabled);
      checks.push({name:'legacy-key recovery restored initial setting',pass:restored});
      if(!restored) process.exitCode=1;
    } catch { checks.push({name:'legacy-key recovery restored initial setting',pass:false});process.exitCode=1; }
  }
  if (changedAuth) {
    try { await manage('/config/auth','PATCH',{disable_signup:originalAuth.disable_signup}); checks.push({name:'initial signup setting restored',pass:true}); }
    catch {checks.push({name:'initial signup setting restored',pass:false});process.exitCode=1;}
  }
  if(input.phase==='provider-proof') console.log(JSON.stringify({
    projectId:TEST_PROJECT,scope:'Hosted provider/SSR SDK fixture proof; NOT deployed application acceptance',
    checks,executed:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,
    applicationBundleScan:'NOT EXECUTED',applicationEndToEnd:'NOT EXECUTED',productionChanged:false,
  }));
}
