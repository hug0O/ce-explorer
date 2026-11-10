import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandLine, exePath } from '../utils/delphiBuild';
import { commandFor, detectKinds } from '../utils/projectBuild';

test('Delphi: Clean, Build and Install in Win32, Win64 or both, with one MSBuild per platform and the program copied on Install', () => {
    const base = { rsvars: 'C:\\R\\rsvars.bat', dproj: 'C:\\p\\App.dproj', config: 'Debug' };
    assert.equal(buildCommandLine({ ...base, platform: 'Win64', target: 'Clean' }), 'call "C:\\R\\rsvars.bat" && msbuild "C:\\p\\App.dproj" /t:Clean /p:Config=Debug /p:Platform=Win64 /p:DCC_MapFile=3 /nologo /v:minimal /clp:NoSummary');
    const both = buildCommandLine({ ...base, platform: 'Both', target: 'Build' });
    assert.equal(both.match(/msbuild /g)!.length, 2);
    assert.match(both, /\/p:Platform=Win32.*&& msbuild.*\/p:Platform=Win64/);
    assert.equal(exePath('C:\\p\\App.dproj', 'Win64', 'Release'), 'C:\\p\\Win64\\Release\\App.exe');
    const one = buildCommandLine({ ...base, platform: 'Win32', target: 'Build', install: { dir: 'D:\\out' } });
    assert.ok(one.includes('copy /Y "C:\\p\\Win32\\Debug\\App.exe" "D:\\out\\"'), one);
    const two = buildCommandLine({ ...base, platform: 'Both', target: 'Build', install: { dir: 'D:\\out' } });
    assert.ok(two.includes('"D:\\out\\Win32\\"') && two.includes('"D:\\out\\Win64\\"'), two);
    assert.doesNotMatch(buildCommandLine({ ...base, platform: 'Win32', target: 'Clean', install: { dir: 'D:\\out' } }), /copy/);
});

test('the other languages: the project is found from its files, and Clean / Build / Install run its usual tool, 32 or 64 bit where it has both', () => {
    assert.deepEqual(detectKinds(['Cargo.toml', 'src']).map(k => k.id), ['cargo']);
    assert.deepEqual(detectKinds(['App.sln', 'package.json']).map(k => k.id), ['dotnet', 'node']);
    assert.deepEqual(detectKinds(['readme.md']), []);
    const c = (k: string, a: 'clean' | 'build' | 'install', arch?: 'x86' | 'x64', scripts: string[] = []) => commandFor(k, a, arch, n => scripts.includes(n), true)!.command;
    assert.equal(c('cargo', 'build', 'x86'), 'cargo build --target i686-pc-windows-msvc');
    assert.equal(c('cargo', 'install', 'x64'), 'cargo install --path . --target x86_64-pc-windows-msvc');
    assert.equal(c('cargo', 'clean'), 'cargo clean');
    assert.equal(c('go', 'build', 'x86'), 'set GOARCH=386&& go build ./...');
    assert.equal(commandFor('go', 'build', 'x64', () => false, false)!.command, 'GOARCH=amd64 go build ./...');
    assert.equal(c('dotnet', 'build', 'x64'), 'dotnet build -r win-x64');
    assert.equal(c('dotnet', 'install', 'x86'), 'dotnet publish -r win-x86');
    assert.equal(c('cmake', 'build', 'x86'), 'cmake -S . -B build-x86 -A Win32 && cmake --build build-x86');
    assert.equal(c('cmake', 'install', 'x64'), 'cmake -S . -B build-x64 -A x64 && cmake --build build-x64 && cmake --install build-x64');
    assert.equal(c('cmake', 'clean', 'x64'), 'cmake --build build-x64 --target clean');
    assert.equal(c('maven', 'install'), 'mvn install');
    assert.equal(c('gradle', 'clean'), 'gradle clean');
    assert.equal(c('make', 'build'), 'make');
    assert.equal(c('node', 'build', undefined, ['build']), 'npm run build');
    assert.equal(c('node', 'clean', undefined, ['clean']), 'npm run clean');
    assert.equal(c('node', 'clean'), 'npx --yes rimraf dist build out');
    assert.equal(c('python', 'install'), 'python -m pip install .');
    assert.equal(commandFor('cargo', 'build', 'x86', () => false, true)!.label, 'Build (32 bit)');
    assert.equal(commandFor('nothing', 'build'), undefined);
});
