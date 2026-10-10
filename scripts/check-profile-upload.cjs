require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { MemberResolver } = require('../src/components/members/member.resolver.ts');
const { MemberUpdate } = require('../src/libs/dto/member/member.update.ts');
const { ValidationPipe } = require('@nestjs/common');
async function main() {
  const originalCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-upload-'));
  try {
    process.chdir(dir);
    const resolver = new MemberResolver({});
    const upload = (createReadStream) => Promise.resolve({ filename: 'avatar.png', mimetype: 'image/png', createReadStream });
    const saved = await resolver.imageUploader(upload(() => Readable.from(Buffer.from([137,80,78,71,13,10,26,10]))), 'member');
    assert.deepEqual(fs.readFileSync(saved), Buffer.from([137,80,78,71,13,10,26,10]));
    await assert.rejects(resolver.imageUploader(Promise.resolve({filename:'payload.html',mimetype:'image/png',createReadStream:()=>Readable.from('<script>alert(1)</script>')}),'member'), /contents/);
    const filesBefore = fs.readdirSync('uploads/member');
    await assert.rejects(resolver.imageUploader(upload(() => new Readable({ read() { this.destroy(new Error('source interrupted')); } })), 'member'), /source interrupted/);
    assert.deepEqual(fs.readdirSync('uploads/member'), filesBefore);
    await assert.rejects(resolver.imageUploader(upload(() => Readable.from('unused')), '../outside'));
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    const input = { _id: 'member-id', memberImage: saved };
    assert.equal((await pipe.transform(input, { type: 'body', metatype: MemberUpdate })).memberImage, saved);
    await assert.rejects(pipe.transform({ ...input, memberFullName: '' }, { type: 'body', metatype: MemberUpdate }));
    console.log('PASS: image-only profile update, upload write, source failure cleanup, and unsafe-target rejection.');
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
