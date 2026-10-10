// Executes the real bootstrap component without a browser or production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../Hadijam    frontend');
const source = fs.readFileSync(path.join(root, 'libs/auth/AuthBootstrap.tsx'), 'utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2021}}).outputText;
for (const pathname of ['/services/repair-restoration','/services/ultrasonic-cleaning','/my-page','/admin','/services/ring-resizing','/services']) {
  const module = {exports:{}};
  const context = vm.createContext({exports:module.exports,module,require:name=> {
    if(name==='react')return {useState:value=>[value,()=>{}],useEffect:()=>{},Fragment:'fragment'};
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
    if(name==='next/router')return {useRouter:()=>({pathname})};
    if(name==='./index')return {initializeAuth:()=>Promise.resolve(),startActivityTracking:()=>()=>{}};
    throw new Error('Unexpected import '+name);
  }});
  vm.runInContext(code,context);
  const result=module.exports.default({children:'page'});
  const protectedRoute=!['/services/ring-resizing','/services'].includes(pathname);
  assert.equal(result.type,protectedRoute?'main':'fragment');
  if(protectedRoute)assert.equal(result.props.role,'status');
}
console.log('PASS: repair/cleaning and private pages wait for session restore; public workflows preserve rendering.');
