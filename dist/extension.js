"use strict";var zt=Object.create;var ke=Object.defineProperty;var Ht=Object.getOwnPropertyDescriptor;var Kt=Object.getOwnPropertyNames;var qt=Object.getPrototypeOf,Xt=Object.prototype.hasOwnProperty;var Qt=(u,t)=>{for(var e in t)ke(u,e,{get:t[e],enumerable:!0})},wt=(u,t,e,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Kt(t))!Xt.call(u,n)&&n!==e&&ke(u,n,{get:()=>t[n],enumerable:!(s=Ht(t,n))||s.enumerable});return u};var L=(u,t,e)=>(e=u!=null?zt(qt(u)):{},wt(t||!u||!u.__esModule?ke(e,"default",{value:u,enumerable:!0}):e,u)),Jt=u=>wt(ke({},"__esModule",{value:!0}),u);var On={};Qt(On,{activate:()=>Fn,deactivate:()=>_n});module.exports=Jt(On);var w=L(require("vscode"));var I=L(require("vscode")),Ct=L(require("fs"));var N=(i=>(i.Method="method",i.Field="field",i.Property="property",i.Constructor="constructor",i.Destructor="destructor",i))(N||{});var xt={fieldsFirst:{name:"Fields First",order:["field","property","constructor","destructor","method"],groupByVisibility:!0,visibilityOrder:["published","public","protected","private"]},methodsFirst:{name:"Methods First",order:["constructor","destructor","method","property","field"],groupByVisibility:!0,visibilityOrder:["published","public","protected","private"]},visibilityGrouped:{name:"Visibility Grouped",order:["constructor","field","property","method","destructor"],groupByVisibility:!0,visibilityOrder:["public","published","protected","private"]}};var G=class{getVisibilityModifiers(){return["private","protected","public"]}getAvailableModifiers(){return["static","virtual","abstract","override","final","const"]}findPairedFile(t){}synchronizeDeclarationImplementation(t,e,s){return[]}sortMembers(t,e){let s=new Map(e.order.map((i,r)=>[i,r])),n=new Map(e.visibilityOrder.map((i,r)=>[i,r]));return[...t].sort((i,r)=>{let o=s.get(i.kind)??999,a=s.get(r.kind)??999;if(o!==a)return o-a;if(e.groupByVisibility){let c=n.get(i.visibility)??999,d=n.get(r.visibility)??999;if(c!==d)return c-d}return i.name.localeCompare(r.name)})}extractMethod(t,e,s,n){return[]}findMemberAtPosition(t,e){let s=this.parseDocument(t);for(let n of s.classes)for(let i of n.members)if(i.range.contains(e)||i.implementationRange?.contains(e))return i}findClassAtPosition(t,e){return this.parseDocument(t).classes.find(n=>n.range.contains(e))}getDeclarationRange(t,e){return e.range}getImplementationRange(t,e){return e.implementationRange}rewriteStandaloneFunction(t,e){}generateMissingStubs(t,e,s){let n=new Set(s.members.map(r=>r.name)),i=[];for(let r of e.members)if(!n.has(r.name)){if(r.kind==="method"){let o={kind:"method",name:r.name,returnType:r.returnType||void 0,visibility:r.visibility,parameters:r.parameters,modifiers:[],isStatic:r.isStatic,isVirtual:!1,isAbstract:!1,isOverride:!1,isFinal:!1},a=this.generateMethod(t,o,s);a.declaration&&i.push(a.declaration)}else if(r.kind==="property"){let o={kind:"property",name:r.name,type:r.type||r.returnType||"object",visibility:r.visibility,hasGetter:!0,hasSetter:!0,isDefault:!1,isReadOnly:!1},a=this.generateProperty(t,o,s);a.declaration&&i.push(a.declaration)}}return i.length>0?i.join(`
`):void 0}getTypeDefaults(){return{defaultReturnType:"void",defaultFieldType:"int",defaultPropertyType:"string",defaultParamType:"int"}}};var Yt=0;function ye(u){return`${u}_${++Yt}_${Date.now().toString(36)}`}var Zt=["private","protected","public","published"],en={private:"private",protected:"protected",public:"public",published:"published"},tn=["virtual","override","abstract","dynamic","reintroduce","final","overload","message","cdecl","stdcall","pascal","register","safecall","winapi"],Re=class extends G{languageId="pascal";fileExtensions=[".pas",".dpk",".dpr"];displayName="Pascal / Delphi";parseDocument(t){let e=t.getText(),s=e.split(/\r?\n/),n=this.extractUnitName(e),i=this.extractUses(e),r=this.extractClassBlocks(s),o=this.extractImplementations(s),a=[];for(let d of r){let l=this.parseClassMembers(d,s,o),p=new I.Range(new I.Position(d.startLine,0),new I.Position(d.endLine,s[d.endLine]?.length??0)),f=d.isInterface?"interface":d.isRecord?"record":"class";a.push({id:ye("cls"),name:d.name,classType:f,parentClass:d.parentClass,interfaces:d.interfaces,members:l,range:p,declarationRange:new I.Range(new I.Position(d.startLine,0),new I.Position(d.startLine,s[d.startLine]?.length??0)),isInterface:d.isInterface,isRecord:d.isRecord,isSealed:!1,fileUri:t.uri})}let c=this.extractStandaloneProcedures(s,r.map(d=>({startLine:d.startLine,endLine:d.endLine})));return{uri:t.uri,languageId:this.languageId,classes:a,standaloneProcedures:c,imports:i}}qualifiedClassName(t){return t.startsWith("T")?t:"T"+t}getDocumentLines(t){let e=t.fileUri.fsPath;for(let s of I.workspace.textDocuments)if(s.uri.fsPath===e)return s.getText().split(/\r?\n/);try{return Ct.readFileSync(e,"utf8").split(/\r?\n/)}catch{return}}findVisibilityInsertPosition(t,e,s){let n=t.members.filter(i=>i.visibility===s);if(n.length>0){let i=n.reduce((r,o)=>r.range.end.line>o.range.end.line?r:o);return{pos:new I.Position(i.range.end.line+1,0),needsSection:!1}}for(let i=t.range.start.line;i<=t.range.end.line&&!(i>=e.length);i++)if(/^\s*end\s*;/i.test(e[i]))return{pos:new I.Position(i,0),needsSection:!0};return{pos:new I.Position(t.range.end.line,0),needsSection:!0}}computeDeclaration(t,e,s){let n=this.getDocumentLines(s);if(!n)return{text:`
  ${this.visibilityKeyword(e)}
${t}
`,position:new I.Position(s.range.end.line,0)};let i=this.findVisibilityInsertPosition(s,n,e);return{text:i.needsSection?`
  ${this.visibilityKeyword(e)}
${t}
`:`
${t}
`,position:i.pos}}computeImplementation(t,e){let s=this.getDocumentLines(e);return s?{text:t,position:this.findImplementationInsertPosition(s)}:{text:t,position:this.findImplementationEndPosition(e)}}generateMethod(t,e,s,n){console.log("[MMX-PASCAL-FIXED-V2] generateMethod called: className="+t+" isStandalone="+(s.classType==="standalone"));let i=this.formatParameterList(e.parameters),r=s.classType==="standalone",o=r?"":"    ",a=this.buildModifierString(e),c=r?"":this.qualifiedClassName(t)+".",d,l;e.kind==="constructor"?(d=`${o}constructor Create${i};${a}`,l=`constructor ${c}Create${i};`):e.kind==="destructor"?(d=`${o}destructor Destroy;${a}`,l=`destructor ${c}Destroy;`):e.kind==="method"&&e.returnType?(d=`${o}function ${e.name}${i}: ${e.returnType};${a}`,l=`function ${c}${e.name}${i}: ${e.returnType};`):(d=`${o}procedure ${e.name}${i};${a}`,l=`procedure ${c}${e.name}${i};`);let p=this.visibilityKeyword(e.visibility),f=this.generateMethodBody(e,t),g=n!==void 0?`
${l}
${n}end;
`:`
${l}
begin
${f}end;
`,v=this.computeDeclaration(d,e.visibility,s),h=this.computeImplementation(g,s);return{declaration:v.text,implementation:h.text,declarationPosition:v.position,implementationPosition:h.position}}generateField(t,e,s){let i=`    ${e.name}: ${e.type};`,r=this.computeDeclaration(i,e.visibility,s);return{declaration:r.text,implementation:"",declarationPosition:r.position,implementationPosition:r.position}}generateProperty(t,e,s){let i=`    property ${e.name}: ${e.type}`;e.hasGetter&&e.getterName&&(i+=` read ${e.getterName}`),e.hasSetter&&e.setterName&&(i+=` write ${e.setterName}`),e.isDefault&&(i+=" default"),e.isReadOnly,i+=";";let r=this.computeDeclaration(i,e.visibility,s);return{declaration:r.text,implementation:"",declarationPosition:r.position,implementationPosition:r.position}}getInsertPosition(t,e,s){let i=t.getText().split(/\r?\n/),r=this.findDeclarationInsertPosition(e,i,s),o=this.findImplementationInsertPosition(i);return{declaration:r,implementation:o}}getVisibilityModifiers(){return["private","protected","public","published"]}getAvailableModifiers(){return["virtual","override","abstract","dynamic","reintroduce","final","overload","class"]}getTypeDefaults(){return{defaultReturnType:"",defaultFieldType:"Integer",defaultPropertyType:"string",defaultParamType:"Integer"}}getDefaultVisibility(){return"published"}generateMissingStubs(t,e,s){}findPairedFile(t){t.fsPath.toLowerCase().endsWith(".pas")}synchronizeDeclarationImplementation(t,e,s){let i=t.getText().split(/\r?\n/);if(this.findImplementationForMember(i,e.name,s.name)!==void 0)return[];if(s.kind==="field"||s.kind==="property")return[];let o=this.findImplementationInsertPosition(i),a=this.buildImplementationFromMember(e.name,s);return[new I.TextEdit(new I.Range(o,o),a)]}sortMembers(t,e){let s=new Map(e.order.map((i,r)=>[i,r])),n=new Map(e.visibilityOrder.map((i,r)=>[i,r]));return[...t].sort((i,r)=>{let o=s.get(i.kind)??999,a=s.get(r.kind)??999;if(o!==a)return o-a;if(e.groupByVisibility){let c=n.get(i.visibility)??999,d=n.get(r.visibility)??999;if(c!==d)return c-d}return i.name.localeCompare(r.name)})}extractMethod(t,e,s,n){let r=t.document.getText().split(/\r?\n/),o=t.selection??t.range;if(!o)return[];let a=t.document.getText(o),c=s.length>0?`(${s.join("; ")})`:"",d=this.findClassAtPosition(t.document,o.start)?.name,l;n&&n!==""&&n!=="void"?l=d?`function ${this.qualifiedClassName(d)}.${e}${c}: ${n};`:`function ${e}${c}: ${n};`:l=d?`procedure ${this.qualifiedClassName(d)}.${e}${c};`:`procedure ${e}${c};`;let p=`
${l}
begin
  ${a}
end;
`,f=this.findImplementationInsertPosition(r),g=[];return g.push(new I.TextEdit(o,`${e}${c}`)),g.push(new I.TextEdit(new I.Range(f,f),p)),g}extractUnitName(t){let e=t.match(/^\s*unit\s+([\w.]+)\s*;/im);return e?e[1]:""}extractUses(t){let e=[],s=/uses\s+([\s\S]*?);/gi,n;for(;(n=s.exec(t))!==null;){let i=n[1].split(",").map(r=>r.trim()).filter(r=>r.length>0);e.push(...i)}return e}extractClassBlocks(t){let e=[],s=t.join(`
`),n=s.search(/\binterface\b/im),i=s.search(/\bimplementation\b/im),r=i>0?i:s.length,o=n>=0?s.substring(0,r):s,a=/(\w+)\s*=\s*class(?:\s*\(([^)]*)\))?/gi,c=/(\w+)\s*=\s*interface(?:\s*\(([^)]*)\))?/gi,d=/(\w+)\s*=\s*record/gi,l,p=[],f=0;for(;(l=a.exec(o))!==null;){let g=l[1];if(this.isKeyword(g))continue;let{parentClass:v,interfaces:h}=this.parseInheritance(l[2]);p.push({name:g,parentClass:v,interfaces:h,isInterface:!1,isRecord:!1,charOffset:l.index,matchLength:l[0].length})}for(;(l=c.exec(o))!==null;){let g=l[1];if(this.isKeyword(g))continue;let{parentClass:v,interfaces:h}=this.parseInheritance(l[2]);p.push({name:g,parentClass:v,interfaces:h,isInterface:!0,isRecord:!1,charOffset:l.index,matchLength:l[0].length})}for(;(l=d.exec(o))!==null;){let g=l[1];this.isKeyword(g)||p.push({name:g,parentClass:void 0,interfaces:[],isInterface:!1,isRecord:!0,charOffset:l.index,matchLength:l[0].length})}p.sort((g,v)=>g.charOffset-v.charOffset);for(let g=0;g<p.length;g++){let v=p[g],h=this.lineFromOffset(s,v.charOffset+f),y=t.length-1,b=0,x=!1;for(let P=h;P<t.length;P++){let k=t[P],M=k.toLowerCase();if(!x&&M.includes("=")&&(M.includes("class")||M.includes("interface")||M.includes("record"))&&(x=!0,b=0),x)if(v.isRecord){if(P>h&&/^\s*end\s*;/i.test(k)){y=P;break}}else{for(let $ of k)$==="("&&b++,$===")"&&b--;if(b<=0&&/^\s*end\s*;/i.test(k)){y=P;break}}}let C=h+1,m=[];for(let P=C;P<y;P++)m.push(t[P]);e.push({name:v.name,parentClass:v.parentClass,interfaces:v.interfaces,isInterface:v.isInterface,isRecord:v.isRecord,startLine:h,endLine:y,bodyStartLine:C,body:m.join(`
`)})}return e}parseClassMembers(t,e,s){let n=[],i=t.isInterface?"public":"published",r=t.body.split(`
`);for(let o=0;o<r.length;o++){let a=r[o].trim();if(!a||a.startsWith("//")||a.startsWith("{"))continue;let c=this.matchVisibility(a);if(c){i=c;continue}let d=this.parseMemberLine(a,i,t.bodyStartLine+o,e,t.name,s);d&&n.push(d)}return n}matchVisibility(t){let e=t.toLowerCase().replace(/\s+/g," ").trim();if(e==="strict private")return"private";if(e==="strict protected")return"protected";for(let s of Zt)if(e===s)return en[s]}parseMemberLine(t,e,s,n,i,r){if(/^\s*$/.test(t))return;let o=t.match(/^constructor\s+Create\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);if(o){let g=this.parseParams(o[1]),v=this.parseTrailingModifiers(o[2]);return this.buildMember("constructor","Create",e,s,n,g,void 0,v,i,r)}let a=t.match(/^destructor\s+Destroy\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);if(a){let g=this.parseTrailingModifiers(a[2]||"");return this.buildMember("destructor","Destroy",e,s,n,[],void 0,g,i,r)}let c=t.match(/^function\s+(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+)\s*;\s*(.*)$/i);if(c){let g=c[1],v=this.parseParams(c[2]),h=c[3].trim(),y=this.parseTrailingModifiers(c[4]);return this.buildMember("method",g,e,s,n,v,h,y,i,r)}let d=t.match(/^procedure\s+(\w+)\s*(?:\(([^)]*)\))?\s*;\s*(.*)$/i);if(d){let g=d[1],v=this.parseParams(d[2]),h=this.parseTrailingModifiers(d[3]);return this.buildMember("method",g,e,s,n,v,void 0,h,i,r)}let l=t.match(/^class\s+(?:procedure|function)\s+(\w+)\s*(?:\(([^)]*)\))?\s*(?::\s*([^;]+))?\s*;\s*(.*)$/i);if(l){let g=l[1],v=this.parseParams(l[2]),h=l[3]?.trim(),y=["class",...this.parseTrailingModifiers(l[4])];return this.buildMember("method",g,e,s,n,v,h,y,i,r)}let p=t.match(/^property\s+(\w+)\s*(?::\s*([^;]+?))?\s*(?:read\s+(\w+))?\s*(?:write\s+(\w+))?\s*(?:default\s+(\w+))?\s*;(.*)$/i);if(p){let g=p[1],v=(p[2]||"").trim().split(/\s+/)[0]||"",h=p[3],y=p[4],b=p[5],x=p[6]?.trim();return{id:ye("mem"),kind:"property",name:g,type:v,visibility:e,parameters:[],modifiers:[...h?[`read ${h}`]:[],...y?[`write ${y}`]:[],...b?[`default ${b}`]:[]],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new I.Range(new I.Position(s,0),new I.Position(s,n[s]?.length??0))}}let f=t.match(/^([A-Za-z]\w*)\s*:\s*([^;]+);?\s*$/);if(f){let g=f[1],v=f[2].trim().replace(/;.*$/,"").trim();return/^(procedure|function|property|constructor|destructor|class)$/i.test(g)?void 0:{id:ye("mem"),kind:"field",name:g,type:v,visibility:e,parameters:[],modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new I.Range(new I.Position(s,0),new I.Position(s,n[s]?.length??0))}}}buildMember(t,e,s,n,i,r,o,a,c,d){let l=d.find(p=>p.className===c&&p.methodName===e);return{id:ye("mem"),kind:t,name:e,returnType:o,visibility:s,parameters:r,modifiers:a,isStatic:a.includes("class"),isVirtual:a.includes("virtual"),isAbstract:a.includes("abstract"),isOverride:a.includes("override"),range:new I.Range(new I.Position(n,0),new I.Position(n,i[n]?.length??0)),implementationRange:l?new I.Range(new I.Position(l.startLine,0),new I.Position(l.endLine,i[l.endLine]?.length??0)):void 0}}extractImplementations(t){let e=[],s=!1;for(let n=0;n<t.length;n++){let i=t[n].trim();if(/^implementation\b/i.test(i)){s=!0;continue}if(/^end\.\s*$/i.test(i))break;if(!s)continue;let r=i.match(/^constructor\s+(T\w+)\.(Create)\s*(?:\(([^)]*)\))?\s*;/i);if(r){let d=this.findImplementationEnd(t,n);e.push({className:r[1],methodName:r[2],fullSignature:i,startLine:n,endLine:d,params:r[3]||"",returnType:void 0,kind:"constructor"});continue}let o=i.match(/^destructor\s+(T\w+)\.(Destroy)\s*(?:\(([^)]*)\))?\s*;/i);if(o){let d=this.findImplementationEnd(t,n);e.push({className:o[1],methodName:o[2],fullSignature:i,startLine:n,endLine:d,params:o[3]||"",returnType:void 0,kind:"destructor"});continue}let a=i.match(/^function\s+(T\w+)\.(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+)\s*;/i);if(a){let d=this.findImplementationEnd(t,n);e.push({className:a[1],methodName:a[2],fullSignature:i,startLine:n,endLine:d,params:a[3]||"",returnType:a[4].trim(),kind:"method"});continue}let c=i.match(/^procedure\s+(T\w+)\.(\w+)\s*(?:\(([^)]*)\))?\s*;/i);if(c){let d=this.findImplementationEnd(t,n);e.push({className:c[1],methodName:c[2],fullSignature:i,startLine:n,endLine:d,params:c[3]||"",returnType:void 0,kind:"method"});continue}}return e}findImplementationEnd(t,e){let s=0;for(let n=e;n<t.length;n++){let i=t[n].trim().toLowerCase(),r=(i.match(/\bbegin\b/g)||[]).length,o=(i.match(/\bend\b/g)||[]).length;if(s+=r-o,s<=0&&o>0&&n>e)return n}return t.length-1}extractStandaloneProcedures(t,e=[]){let s=[],n=c=>e.some(d=>c>=d.startLine&&c<=d.endLine),i=-1;for(let c=0;c<t.length;c++)if(/^implementation\b/i.test(t[c].trim())){i=c;break}let r=[],o=c=>{let d=0;for(let l of c)if(l==="(")d++;else if(l===")")d--;else if(l===";"&&d<=0)return!0;return!1},a=0;for(;a<t.length&&!(i>=0&&a>=i);){let c=t[a].trim();if(/^end\.\s*$/i.test(c))break;if(n(a)){a++;continue}if(/^\s*(?:procedure|function)\s+T\w+\./.test(c)){a++;continue}let d=c.match(/^(procedure|function)\s+(\w+)\b/i);if(!d){a++;continue}let l=d[1].toLowerCase()==="function",p=a,f="",g=a,v=!1;for(let x=a;x<t.length;x++){if(f+=(x>a?" ":"")+t[x].trim(),o(f)){g=x,v=!0;break}if(i>=0&&x>=i)break}if(!v){a++;continue}let h=f.replace(/\s+/g," ").trim(),y=h.match(/^function\s+(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^;]+);/i),b=h.match(/^procedure\s+(\w+)\s*(?:\(([^)]*)\))?\s*;/i);l&&y?r.push({name:y[1],isFunc:!0,line:p,params:y[2],returnType:y[3].trim()}):!l&&b&&r.push({name:b[1],isFunc:!1,line:p,params:b[2]}),a=g+1}for(let c of r){let d;if(i>=0){let l=this.escapeRegex(c.name),p=c.isFunc?new RegExp("^function\\s+"+l+"\\b","i"):new RegExp("^procedure\\s+"+l+"\\b","i");for(let f=i;f<t.length;f++){let g=t[f].trim();if(/^end\.\s*$/i.test(g))break;if(!/^\s*(?:procedure|function)\s+T\w+\./.test(g)&&p.test(g)){let v=this.findImplementationEnd(t,f);d=new I.Range(new I.Position(f,0),new I.Position(v,t[v]?.length??0));break}}}s.push({id:ye("sproc"),kind:"method",name:c.name,returnType:c.returnType,visibility:"public",parameters:this.parseParams(c.params),modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new I.Range(new I.Position(c.line,0),new I.Position(c.line,t[c.line]?.length??0)),implementationRange:d})}return s}parseParams(t){if(!t||t.trim()==="")return[];let e=[],s=this.splitParams(t);for(let n of s){let i=n.trim();if(!i)continue;let r=i.match(/^const\s+(.+)$/i);if(r){let d=r[1].trim(),l=this.parseParamGroup(d);for(let p of l)e.push({...p,isConst:!0,direction:"in"});continue}let o=i.match(/^var\s+(.+)$/i);if(o){let d=o[1].trim(),l=this.parseParamGroup(d);for(let p of l)e.push({...p,isVar:!0,direction:"inout"});continue}let a=i.match(/^out\s+(.+)$/i);if(a){let d=a[1].trim(),l=this.parseParamGroup(d);for(let p of l)e.push({...p,isOut:!0,direction:"out"});continue}let c=this.parseParamGroup(i);e.push(...c)}return e}parseParamGroup(t){let e=[],s=t.lastIndexOf(":");if(s<0)return e;let n=t.substring(0,s).trim(),i=t.substring(s+1).trim();if(!i)return e;let r=n.split(",").map(o=>o.trim()).filter(o=>o.length>0);for(let o of r)e.push({name:o,type:i});return e}splitParams(t){let e=[],s=0,n="";for(let i of t)i==="("?(s++,n+=i):i===")"?(s--,n+=i):i===";"&&s===0?(e.push(n),n=""):n+=i;return n.trim()&&e.push(n),e}parseTrailingModifiers(t){if(!t)return[];let e=[],s=t.toLowerCase().trim();for(let n of tn)new RegExp(`\\b${n}\\b`,"i").test(s)&&e.push(n);return e}parseInheritance(t){if(!t||t.trim()==="")return{parentClass:void 0,interfaces:[]};let e=t.split(",").map(i=>i.trim()).filter(i=>i.length>0);if(e.length===0)return{parentClass:void 0,interfaces:[]};let s=e[0],n=e.slice(1);return{parentClass:s,interfaces:n}}isKeyword(t){return["class","interface","record","procedure","function","var","const","type","begin","end","if","then","else","while","do","for","to","repeat","until","case","of","with","try","except","finally","raise","program","unit","library","package"].includes(t.toLowerCase())}lineFromOffset(t,e){let s=0;for(let n=0;n<e&&n<t.length;n++)t[n]===`
`&&s++;return s}formatParameterList(t){return t.length===0?"":`(${t.map(s=>{let n="";return s.isConst?n="const ":s.isVar?n="var ":s.isOut&&(n="out "),`${n}${s.name}: ${s.type}`}).join("; ")})`}buildModifierString(t){let e=[];t.isVirtual&&e.push("virtual"),t.isOverride&&e.push("override"),t.isAbstract&&e.push("abstract"),t.isFinal&&e.push("final"),t.isStatic&&e.push("class");for(let s of t.modifiers)e.includes(s.name)||e.push(s.name);return e.length>0?" "+e.join(" "):""}generateMethodBody(t,e){return t.kind==="constructor"?`  inherited Create;
  // TODO: initialize fields
`:t.kind==="destructor"?`  // TODO: free resources
  inherited Destroy;
`:t.returnType&&t.returnType!==""&&t.returnType.toLowerCase()!=="void"?`  // TODO: implement
  Result := ${this.getZeroValue(t.returnType)};
`:`  // TODO: implement
`}getZeroValue(t){let e=t.toLowerCase().trim();switch(e){case"integer":case"int64":case"longint":case"word":case"byte":case"smallint":case"shortint":case"cardinal":case"dword":case"nativeint":case"nativeuint":return"0";case"boolean":case"bytebool":case"wordbool":case"longbool":return"False";case"string":case"ansistring":case"widestring":case"unicodestring":case"shortstring":case"rawbytestring":return"''";case"double":case"single":case"extended":case"real":case"currency":case"comp":return"0.0";case"variant":case"olevariant":return"Unassigned";case"pointer":return"nil";case"tobject":case"tcomponent":case"tcontrol":return"nil";default:return e.startsWith("t")?"nil":"Default("+t+")"}}visibilityKeyword(t){switch(t){case"private":return"private";case"protected":return"protected";case"public":return"public";case"published":return"published";default:return"public"}}findDeclarationInsertPosition(t,e,s){if(s==="field"){let a=t.members.filter(d=>d.kind==="field");if(a.length>0){let d=a.reduce((p,f)=>p.range.end.line>f.range.end.line?p:f),l=(e[d.range.end.line]||"").match(/^(\s*)/)?.[1]||"";return new I.Position(d.range.end.line+1,l.length)}for(let d=t.range.start.line;d<=t.range.end.line&&!(d>=e.length);d++)if(/^\s*(private|protected|public)\s*/i.test(e[d])){let l=e[d].match(/^(\s*)/)?.[1]||"";return new I.Position(d+1,l.length)}let c=(e[t.range.start.line]||"").match(/^(\s*)/)?.[1]||"";return new I.Position(t.range.start.line+1,c.length)}let n=t.range.end.line;for(let a=t.range.start.line;a<=t.range.end.line&&!(a>=e.length);a++){let c=e[a].trim().toLowerCase();if(/^\s*end\s*;/i.test(e[a])){n=a;break}}let o=((e[n]||"").match(/^(\s*)/)?.[1]||"").length;return new I.Position(n,o)}findImplementationInsertPosition(t){for(let e=0;e<t.length;e++){let s=t[e].trim().toLowerCase();if(/^(initialization|finalization)\b/.test(s))return new I.Position(e,0)}for(let e=t.length-1;e>=0;e--){let s=t[e].trim().toLowerCase();if(/^end\.\s*$/.test(s))return new I.Position(e,0)}return new I.Position(t.length,0)}findImplementationEndPosition(t){return t.range.end}findImplementationForMember(t,e,s){let n=this.escapeRegex(e),i=this.escapeRegex(s),r=[new RegExp(`^\\s*(?:procedure|function)\\s+${n}\\.${i}\\b`,"im"),new RegExp(`^\\s*constructor\\s+${n}\\.Create\\b`,"im"),new RegExp(`^\\s*destructor\\s+${n}\\.Destroy\\b`,"im")];for(let o=0;o<t.length;o++)for(let a of r)if(a.test(t[o])){let c=this.findImplementationEnd(t,o);return new I.Range(new I.Position(o,0),new I.Position(c,t[c]?.length??0))}}buildImplementationFromMember(t,e){let s=this.formatParameterList(e.parameters);if(e.kind==="constructor")return`
constructor ${this.qualifiedClassName(t)}.Create${s};
begin
  inherited Create;
  // TODO: initialize
end;
`;if(e.kind==="destructor")return`
destructor ${this.qualifiedClassName(t)}.Destroy;
begin
  // TODO: cleanup
  inherited Destroy;
end;
`;if(e.returnType&&e.returnType!==""){let n=this.getZeroValue(e.returnType);return`
function ${this.qualifiedClassName(t)}.${e.name}${s}: ${e.returnType};
begin
  Result := ${n};
end;
`}return`
procedure ${this.qualifiedClassName(t)}.${e.name}${s};
begin
  // TODO: implement
end;
`}escapeRegex(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}};var D=L(require("vscode"));var nn=0;function Y(){return`cpp_${Date.now()}_${++nn}`}function mt(u,t){return D.workspace.getConfiguration("mmx.cpp").get(u,t)}var De=class u extends G{languageId="cpp";fileExtensions=[".h",".hpp",".cpp",".cc",".cxx",".hxx"];displayName="C++";static RE_CLASS_DECL=/^\s*(class|struct)\s+(\w+)(?:\s*<([^>]*)>)?\s*(?::\s*((?:(?:public|protected|private)\s+\w+(?:\s*,\s*)?)+))?\s*\{?/;static RE_VISIBILITY=/^\s*(public|protected|private)\s*:/;static RE_TEMPLATE=/^\s*template\s*<([^>]*)>/;static RE_INCLUDE=/^\s*#\s*include\s+([<"][^>"]+[>"])/;static RE_PRAGMA_ONCE=/^\s*#pragma\s+once/;static RE_NAMESPACE_OPEN=/^\s*namespace\s+(\w+)\s*\{/;static RE_NAMESPACE_CLOSE=/^\s*\}\s*\/\/\s*namespace/;static RE_USING=/^\s*using\s+(?:namespace\s+)?(\S+)/;static RE_METHOD=/^\s*((?:(?:virtual|static|inline|explicit|friend|constexpr|mutable)\s+)*)([\w\s\*&:<>]+?)\s+(\w+)\s*\(([^)]*)\)\s*((?:\s*(?:const|override|final|= 0|=0|noexcept|&|&&))*)\s*[;{]/;static RE_CONSTRUCTOR=/^\s*(?:explicit\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{;]+)?\s*(?:=\s*delete|=\s*default)?\s*[;{]/;static RE_DESTRUCTOR=/^\s*(?:virtual\s+)?~(\w+)\s*\(\s*\)\s*(?:=\s*default|=\s*delete|noexcept|override)?\s*[;{]/;static RE_FIELD=/^\s*((?:(?:mutable|static|constexpr|volatile|inline)\s+)*)([\w\s\*&:<>,]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;static RE_ACCESS_SPECIFIER=/^\s*(public|protected|private)\s*:/;static HEADER_EXTS=new Set([".h",".hpp",".hxx",".hh"]);static SOURCE_EXTS=new Set([".cpp",".cc",".cxx"]);indent(){return" ".repeat(mt("indentSize",4))}brace(){return mt("braceStyle","newLine")==="sameLine"?" {":`
`+this.indent()+"{"}getDefaultVisibility(){switch(mt("defaultVisibility","private")){case"public":return"public";case"protected":return"protected";default:return"private"}}getVisibilityModifiers(){return["private","protected","public"]}getTypeDefaults(){return{defaultReturnType:"void",defaultFieldType:"int",defaultPropertyType:"std::string",defaultParamType:"int"}}isHeader(t){let e=t.substring(t.lastIndexOf(".")).toLowerCase();return u.HEADER_EXTS.has(e)}isSource(t){let e=t.substring(t.lastIndexOf(".")).toLowerCase();return u.SOURCE_EXTS.has(e)}findPairedFile(t){let e=t.fsPath,s=e.lastIndexOf(".");if(s<0)return;let n=e.substring(0,s),i=r=>{for(let o of r){let a=n+o;try{if(require("fs").existsSync(a))return D.Uri.file(a)}catch{}}};if(this.isHeader(e))return i([".cpp",".cc",".cxx"]);if(this.isSource(e))return i([".h",".hpp",".hxx",".hh"])}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[],o="";for(let c=0;c<s.length;c++){let d=s[c],l=d.match(u.RE_INCLUDE);if(l){i.push(l[1]);continue}let p=d.match(u.RE_NAMESPACE_OPEN);if(p){o=p[1];continue}}if(this.parseClasses(s,t.uri,n,o),this.isSource(t.uri.fsPath)){this.parseSourceFileMethods(s,t,n);let c=this.findPairedFile(t.uri);if(c){let d=this.parseHeaderForClasses(c);for(let l of d)n.find(p=>p.name===l.name)||n.push(l);this.parseSourceFileMethods(s,t,n)}}let a=this.extractStandaloneFunctions(s,n);return{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:a,imports:i}}rewriteStandaloneFunction(t,e){let s=t.indexOf("{"),n=t.lastIndexOf("}");if(s<0||n<=s)return;let i=t.substring(s+1,n),r=e.returnType&&e.returnType!=="void"?e.returnType:"void",o=e.parameters.map(a=>`${a.type||"auto"} ${a.name}`).join(", ");return`${r} ${e.name}(${o}) {${i}}
`}generateMissingStubs(t,e,s){}extractStandaloneFunctions(t,e){let s=[],n=e.filter(o=>!o.isSynthetic).map(o=>({start:o.range.start.line,end:o.range.end.line})),i=o=>n.some(a=>o>=a.start&&o<=a.end),r=new Set(["if","for","while","switch","return","throw","catch","do","else","class","struct","namespace","using","sizeof","static_cast","dynamic_cast","reinterpret_cast","const_cast"]);for(let o=0;o<t.length;o++){if(i(o))continue;let a=t[o],c=a.trim();if(!c||c.startsWith("#")||c.startsWith("//")||c.startsWith("/*")||c.startsWith("*")||/::\s*~?\w+\s*\(/.test(c))continue;let d=c.match(u.RE_METHOD);if(!d)continue;let l=(d[2]||"").trim(),p=d[3],f=d[4]||"",g=d[5]||"";if(!p||r.has(p)||!l&&!/^(int|void|char|bool|float|double|auto|std::)/.test(l)&&!l)continue;let v=/\{/.test(c)||!c.endsWith(";"),h=v?this.findMethodEndLine(t,o):o;s.push({id:Y(),kind:"method",name:p,returnType:l||void 0,visibility:"public",parameters:this.parseParameters(f),modifiers:this.extractModifiers(d[1]||"",g),isStatic:(d[1]||"").includes("static"),isVirtual:!1,isAbstract:!1,isOverride:g.includes("override"),range:new D.Range(o,a.indexOf(c),o,a.length),implementationRange:v&&h>o?new D.Range(o,0,h,t[h]?.length??0):void 0}),v&&(o=h)}return s}parseHeaderForClasses(t){try{let n=require("fs").readFileSync(t.fsPath,"utf-8").split(/\r?\n/),i=[],r="";for(let o=0;o<n.length;o++){let a=n[o].match(u.RE_NAMESPACE_OPEN);a&&(r=a[1])}return this.parseClasses(n,t,i,r),i}catch{return[]}}static RE_IMPL_METHOD=/^\s*(?:((?:(?:virtual|static|inline|explicit|friend|constexpr|mutable)\s+)*)([\w\s\*&:<>]+?)\s+)?(\w+)\s*::\s*~?(\w+)\s*\(([^)]*)\)\s*((?:\s*(?:const|override|final|= 0|=0|noexcept|&|&&))*)\s*[;{]/;static RE_IMPL_CTOR=/^\s*(?:explicit\s+)?(\w+)\s*::\s*(\w+)\s*\(([^)]*)\)\s*(?::\s*[^{;]+)?\s*[;{]/;static RE_IMPL_DTOR=/^\s*(?:virtual\s+)?(\w+)\s*::\s*~(\w+)\s*\(\s*\)\s*(?:=\s*default|=\s*delete|noexcept)?\s*[;{]/;static RE_IMPL_INIT=/^\s*(\w+)\s+(\w+)\s*::\s*(\w+)\s*(?:=\s*[^;]+)?\s*;/;parseSourceFileMethods(t,e,s){for(let n=0;n<t.length;n++){let i=t[n],r=i.trim();if(!r||r.startsWith("#")||r.startsWith("//"))continue;let o=r.match(u.RE_IMPL_DTOR);if(o&&o[1]===o[2]){let l=o[1],p=s.find(v=>v.name===l);p||(p=this.createSyntheticClass(l,e,s));let f=new D.Range(n,i.indexOf(r),n,i.length),g=this.findMethodEndLine(t,n);p.members.push({id:Y(),kind:"destructor",name:`~${o[2]}`,visibility:"public",parameters:[],modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:f,implementationRange:new D.Range(n,0,g,t[g]?.length??0)}),n=g;continue}let a=r.match(u.RE_IMPL_CTOR);if(a&&a[1]===a[2]){let l=a[1],p=s.find(h=>h.name===l);p||(p=this.createSyntheticClass(l,e,s));let f=this.parseParameters(a[3]),g=new D.Range(n,i.indexOf(r),n,i.length),v=this.findMethodEndLine(t,n);p.members.push({id:Y(),kind:"constructor",name:a[2],visibility:"public",parameters:f,modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:g,implementationRange:new D.Range(n,0,v,t[v]?.length??0)}),n=v;continue}let c=r.match(u.RE_IMPL_METHOD);if(c&&c[3]===c[3]&&c[3]!==c[4]){let l=c[3],p=c[4],f=s.find(m=>m.name===l);f||(f=this.createSyntheticClass(l,e,s));let g=c[2]?c[2].trim():"void",v=this.parseParameters(c[5]),h=c[6]?c[6].trim():"",y=new D.Range(n,i.indexOf(r),n,i.length),b=this.findMethodEndLine(t,n),x="method";h.includes("const")&&p.length>3&&(p.startsWith("get")||p.startsWith("is")||p.startsWith("has"))&&(x="property"),f.members.push({id:Y(),kind:x,name:p,returnType:g,visibility:"public",parameters:v,modifiers:this.extractModifiers(c[1]||"",h),isStatic:(c[1]||"").includes("static"),isVirtual:(c[1]||"").includes("virtual"),isAbstract:!1,isOverride:h.includes("override"),range:y,implementationRange:new D.Range(n,0,b,t[b]?.length??0)}),n=b;continue}let d=r.match(u.RE_IMPL_INIT);if(d){let l=d[1],p=d[2],f=d[3],g=s.find(h=>h.name===p);g||(g=this.createSyntheticClass(p,e,s));let v=new D.Range(n,i.indexOf(r),n,i.length);g.members.push({id:Y(),kind:"field",name:f,type:l,visibility:"private",parameters:[],modifiers:[],isStatic:!0,isVirtual:!1,isAbstract:!1,isOverride:!1,range:v});continue}}}createSyntheticClass(t,e,s){let n=e.lineCount,i={id:Y(),name:t,fullName:t,classType:"class",parentClass:void 0,interfaces:[],members:[],range:new D.Range(0,0,n>0?n-1:0,0),isInterface:!1,isRecord:!1,isSealed:!1,isSynthetic:!0,fileUri:e.uri};return s.push(i),i}findMethodEndLine(t,e){let s=0,n=!1;for(let i=e;i<t.length;i++){for(let r of t[i])r==="{"&&(s++,n=!0),r==="}"&&s--;if(n&&s<=0)return i}return e}parseClasses(t,e,s,n){let i=null;for(let r=0;r<t.length;r++){let o=t[r],a=o.match(u.RE_TEMPLATE);if(a){i=a[1].trim();continue}let c=o.match(u.RE_CLASS_DECL);if(!c){i=null;continue}let d=c[1],l=c[2],p=c[4],f=d==="struct",g,v=[];if(p){let $=p.split(",").map(O=>O.trim()).filter(Boolean);for(let O of $){let te=O.match(/^\s*(public|protected|private)\s+(\w+)/);te&&(te[1]==="public"&&!g?g=te[2]:v.push(te[2]))}}let h=r;for(let $=r;$<t.length;$++)if(t[$].includes("{")){h=$;break}let y=h,b=y,x=0,C=!1;for(let $=y;$<t.length;$++){for(let O of t[$])O==="{"&&(x++,C=!0),O==="}"&&x--;if(C&&x<=0){b=$;break}}let m=new D.Range(y,0,b,t[b]?.length??0),P=this.parseClassBody(t,y+1,b,l),k=n?`${n}::${l}`:l,M={id:Y(),name:l,fullName:k,classType:f?"struct":"class",parentClass:g,interfaces:v,members:P,range:m,isInterface:!1,isRecord:f,isSealed:!1,fileUri:e};s.push(M),r=b,i=null}}parseClassBody(t,e,s,n){let i=[],r="private";for(let o=e;o<s;o++){let a=t[o],c=a.trim();if(!c||c.startsWith("//")||c.startsWith("/*")||c.startsWith("*")||c.startsWith("#"))continue;let d=c.match(u.RE_ACCESS_SPECIFIER);if(d){switch(d[1]){case"public":r="public";break;case"protected":r="protected";break;case"private":r="private";break}continue}let l=c.match(u.RE_DESTRUCTOR);if(l&&l[1]===n){let v=new D.Range(o,a.indexOf(c),o,a.length);i.push({id:Y(),kind:"destructor",name:`~${l[1]}`,visibility:r,parameters:[],modifiers:c.includes("virtual")?["virtual"]:[],isStatic:!1,isVirtual:c.includes("virtual"),isAbstract:!1,isOverride:!1,range:v});continue}let p=c.match(u.RE_CONSTRUCTOR);if(p&&p[1]===n){let v=this.parseParameters(p[2]),h=new D.Range(o,a.indexOf(c),o,a.length);i.push({id:Y(),kind:"constructor",name:p[1],visibility:r,parameters:v,modifiers:c.includes("explicit")?["explicit"]:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:h});continue}let f=c.match(u.RE_METHOD);if(f&&f[3]!==n){let v=f[1].trim(),h=f[2].trim(),y=f[3],b=f[4],x=f[5].trim();if(h.includes("operator"))continue;let C=this.parseParameters(b),m=this.extractModifiers(v,x),P=new D.Range(o,a.indexOf(c),o,a.length),k="method";if(x.includes("= 0")||x.includes("=0")){i.push({id:Y(),kind:k,name:y,returnType:h,visibility:r,parameters:C,modifiers:m,isStatic:v.includes("static"),isVirtual:v.includes("virtual")||x.includes("= 0")||x.includes("=0"),isAbstract:x.includes("= 0")||x.includes("=0"),isOverride:x.includes("override"),range:P});continue}x.includes("const")&&!x.includes("constexpr")&&y.length>3&&(y.startsWith("get")||y.startsWith("is")||y.startsWith("has"))&&(k="property"),i.push({id:Y(),kind:k,name:y,returnType:h,visibility:r,parameters:C,modifiers:m,isStatic:v.includes("static"),isVirtual:v.includes("virtual"),isAbstract:x.includes("= 0")||x.includes("=0"),isOverride:x.includes("override"),range:P});continue}let g=c.match(u.RE_FIELD);if(g){let v=g[1].trim(),h=g[2].trim(),y=g[3].trim();if(h==="void"||y==="class"||y==="struct"||y==="namespace"||/^[{}();]$/.test(y))continue;let b=new D.Range(o,a.indexOf(c),o,a.length);i.push({id:Y(),kind:"field",name:y,type:h,visibility:r,parameters:[],modifiers:v?v.split(/\s+/).filter(Boolean):[],isStatic:v.includes("static"),isVirtual:!1,isAbstract:!1,isOverride:!1,range:b});continue}}return i}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)(i==="<"||i==="(")&&s++,(i===">"||i===")")&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim(),s=e.startsWith("const "),n=e.includes("&"),i=e.includes("*"),r,o=e,a=o.lastIndexOf("=");a>=0&&(r=o.substring(a+1).trim(),o=o.substring(0,a).trim());let c=o.split(/\s+/).filter(Boolean),d="",l="";return c.length>=2?(d=c[c.length-1].replace(/[&*]/g,""),l=c.slice(0,c.length-1).join(" ")):c.length===1&&(d=c[0].replace(/[&*]/g,""),l="auto"),{name:d,type:l,defaultValue:r,isConst:s}}extractModifiers(t,e){let s=[];for(let n of["virtual","static","inline","explicit","friend","constexpr","mutable"])t.includes(n)&&s.push(n);for(let n of["const","override","final","noexcept"])e.includes(n)&&s.push(n);return(e.includes("= 0")||e.includes("=0"))&&s.push("pure"),e.includes("&")&&!e.includes("&&")&&s.push("lvalue-ref"),e.includes("&&")&&s.push("rvalue-ref"),s}generateMethod(t,e,s){let n=this.indent(),i=this.brace(),r=e.parameters.map(b=>{let x="";return b.isConst&&(x+="const "),x+=b.type,b.direction==="out"?x+="*":b.direction==="inout"&&(x+="&"),x+=` ${b.name}`,b.defaultValue&&(x+=` = ${b.defaultValue}`),x}).join(", "),o=[],a=[];e.isStatic&&o.push("static"),e.isVirtual&&o.push("virtual");for(let b of e.modifiers)["inline","explicit","friend","constexpr"].includes(b.name)&&o.push(b.name),["const","override","final","noexcept"].includes(b.name)&&a.push(b.name),b.name==="pure"&&a.push("= 0");let c=o.length?o.join(" ")+" ":"",d=e.returnType??"void",l=a.length?" "+a.join(" "):"",p=e.kind==="constructor",f=e.kind==="destructor",g,v;if(p){let b=e.modifiers.some(x=>x.name==="explicit")?"explicit ":"";g=`${n}${b}${t}(${r});`,v=`${t}::${t}(${r})${i}
${n}${n}// TODO: implement
${n}}
`}else if(f){let b=e.isVirtual?"virtual ":"";g=`${n}${b}~${t}();`,v=`${t}::~${t}()${i}
${n}${n}// TODO: implement
${n}}
`}else{g=`${n}${c}${d} ${e.name}(${r})${l};`;let b=a.filter(C=>C!=="= 0").join(" "),x=b?" "+b:"";v=`${c.replace(/virtual\s*/g,"").replace(/static\s*/g,"")}${d} ${t}::${e.name}(${r})${x}${i}
${n}${n}// TODO: implement
${n}}
`}let h=this.getInsertPositionForHeader(s,e.visibility,"method");return{declaration:h.needsLabel?this.visibilityLabel(e.visibility)+`
`+g+`
`:g+`
`,implementation:"",declarationPosition:h.pos,implementationPosition:new D.Position(0,0),pairedFileImplementation:v}}generateField(t,e,s){let i=`${this.indent()}${e.type} ${e.name}`;e.defaultValue&&(i+=` = ${e.defaultValue}`),i+=`;
`;let r=this.getInsertPositionForHeader(s,e.visibility,"field");return{declaration:r.needsLabel?this.visibilityLabel(e.visibility)+`
`+i:i,implementation:"",declarationPosition:r.pos,implementationPosition:new D.Position(0,0)}}generateProperty(t,e,s){let n=this.indent(),i=this.brace(),r=`${n}${e.type} ${e.name}() const;
`;e.hasSetter&&(r+=`${n}void set${e.name[0].toUpperCase()+e.name.substring(1)}(${e.type} value);
`);let o=`${e.type} ${t}::${e.name}() const${i}
${n}${n}return m_${e.name[0].toLowerCase()+e.name.substring(1)};
${n}}
`;if(e.hasSetter){let d=`set${e.name[0].toUpperCase()+e.name.substring(1)}`;o+=`
void ${t}::${d}(${e.type} value)${i}
${n}${n}m_${e.name[0].toLowerCase()+e.name.substring(1)} = value;
${n}}
`}let a=this.getInsertPositionForHeader(s,e.visibility,"property");return{declaration:a.needsLabel?this.visibilityLabel(e.visibility)+`
`+r:r,implementation:"",declarationPosition:a.pos,implementationPosition:new D.Position(0,0),pairedFileImplementation:o}}getInsertPositionForHeader(t,e,s){let n=-1,i=!1;for(let r of t.members)r.visibility===e&&(i=!0,n=Math.max(n,r.range.end.line));return i&&n>=0?{pos:new D.Position(n+1,0),needsLabel:!1}:s==="field"?{pos:new D.Position(t.range.start.line+1,0),needsLabel:!0}:{pos:new D.Position(t.range.end.line,0),needsLabel:!0}}visibilityLabel(t){switch(t){case"private":return"private:";case"protected":return"protected:";case"public":return"public:";default:return"public:"}}getInsertPosition(t,e,s){let n=this.isHeader(t.uri.fsPath),i=this.getInsertPositionForHeader(e,this.getDefaultVisibility(),s),r=this.findPairedFile(t.uri),o=new D.Position(0,0);if(!n&&r)try{let a=D.workspace.textDocuments.find(c=>c.uri.fsPath===r.fsPath);a&&(o=this.findSourceInsertPosition(a,e))}catch{}return n?{declaration:i.pos,implementation:o,pairedFileUri:r,pairedFileImplementation:o}:{declaration:i.pos,implementation:this.findSourceInsertPosition(t,e),pairedFileUri:r}}findSourceInsertPosition(t,e){let n=t.getText().split(/\r?\n/),i=0,r=0;for(let o=0;o<n.length;o++){let a=n[o];if(a.match(/^\s*namespace\s+\w+\s*\{/)){i++;continue}if(a.match(/^\s*\w+\s*::\s*\w+/)){let d=0;for(let l=o;l<n.length;l++){for(let p of n[l])p==="{"&&d++,p==="}"&&d--;if(d<=0&&n[l].includes("}")){r=l;break}}}}if(i>0){for(let o=n.length-1;o>=0;o--)if(n[o].match(/^\s*\}/))return new D.Position(o,0)}return r>0?new D.Position(r+1,0):new D.Position(n.length,0)}synchronizeDeclarationImplementation(t,e,s){let n=[],i=this.isHeader(t.uri.fsPath),r=this.indent(),o=this.brace();if(i){let a=this.findPairedFile((t.uri.fsPath,t.uri));if(!a)return n;let c=D.workspace.textDocuments.find(p=>p.uri.fsPath===a.fsPath);if(!c)return n;let d=c.getText(),l=`${e.name}::${s.name}`;if(!d.includes(l)){let p=s.parameters.map(y=>{let b="";return y.isConst&&(b+="const "),b+=y.type+" "+y.name,y.defaultValue&&(b+=` = ${y.defaultValue}`),b}).join(", "),f=s.returnType??"void",g=s.modifiers.includes("const")?" const":"",v=`
${f} ${e.name}::${s.name}(${p})${g}${o}
${r}// TODO: implement
}
`,h=this.findSourceInsertPosition(c,e);n.push(new D.TextEdit(new D.Range(h,h),v))}}else if(!this.memberHasImplementation(t,s)){let c=s.returnType??"void",d=s.parameters.map(g=>{let v="";return g.isConst&&(v+="const "),v+=g.type+" "+g.name,g.defaultValue&&(v+=` = ${g.defaultValue}`),v}).join(", "),l=s.modifiers.includes("const")?" const":"",p=`
${c} ${e.name}::${s.name}(${d})${l}${o}
${r}// TODO: implement
}
`,f=this.findSourceInsertPosition(t,e);n.push(new D.TextEdit(new D.Range(f,f),p))}return n}memberHasImplementation(t,e){let n=t.getText().split(/\r?\n/);for(let i of n)if(i.includes("::")&&i.includes(e.name)&&i.includes("("))return!0;return!1}sortMembers(t,e){return super.sortMembers(t,e)}};var W=L(require("vscode"));var sn=0;function Fe(){return`rust_${Date.now()}_${++sn}`}var Le=class u extends G{languageId="rust";fileExtensions=[".rs"];displayName="Rust";static RE_STRUCT=/^\s*(pub\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*\{?/;static RE_ENUM=/^\s*(pub\s+)?enum\s+(\w+)(?:<[^>]*>)?\s*\{?/;static RE_TRAIT=/^\s*(pub\s+)?trait\s+(\w+)(?:<[^>]*>)?\s*(?::\s*(?:\w+\+?\s*)+)?\s*\{?/;static RE_IMPL=/^\s*impl(?:\s*<[^>]*>)?\s+(\w+)(?:<[^>]*>)?\s*\{?/;static RE_IMPL_FOR=/^\s*impl(?:\s*<[^>]*>)?\s+(\w+)(?:<[^>]*>)?\s+for\s+(\w+)(?:<[^>]*>)?\s*\{?/;static RE_METHOD=/^\s*(pub\s*(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+?))?\s*\{?/;static RE_FIELD=/^\s*(pub\s*(?:\([^)]*\))?\s+)?(\w+)\s*:\s*([^,}]+)/;static RE_USE=/^\s*(pub\s+)?use\s+([^;]+);/;getDefaultVisibility(){return"private"}getVisibilityModifiers(){return["private","public","protected"]}getAvailableModifiers(){return["pub","pub(crate)","async","static","const"]}getTypeDefaults(){return{defaultReturnType:"()",defaultFieldType:"i32",defaultPropertyType:"String",defaultParamType:"i32"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[];for(let a=0;a<s.length;a++){let d=s[a].match(u.RE_USE);if(d){i.push(d[2].trim());continue}}this.parseTypeBlocks(s,t.uri,n);let o=this.extractStandaloneFunctions(s,n);return{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:o,imports:i}}extractStandaloneFunctions(t,e){let s=[],n=e.map(o=>({start:o.range.start.line,end:o.range.end.line})),i=o=>n.some(a=>o>=a.start&&o<=a.end),r=/^\s*(?:(pub)\s*(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+?))?\s*\{?/;for(let o=0;o<t.length;o++){if(i(o))continue;let a=t[o].trim();if(!a||a.startsWith("//"))continue;let c=a.match(r);if(!c)continue;let d=c[2],l=c[3],p=c[4]?.trim(),f=!!c[1],g=this.findBraceEnd(t,o);s.push({id:Fe(),kind:"method",name:d,returnType:p,visibility:f?"public":"private",parameters:this.parseParameters(l||"",d),modifiers:[],isStatic:!0,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new W.Range(o,0,o,t[o].length),implementationRange:g>o?new W.Range(o,0,g,t[g]?.length??0):void 0})}return s}rewriteStandaloneFunction(t,e){let s=t.indexOf("{"),n=t.lastIndexOf("}");if(s<0||n<=s)return;let i=t.substring(s+1,n),r=e.visibility==="public"?"pub ":"",o=e.parameters.map(c=>`${c.name}: ${c.type||"_"}`).join(", "),a=e.returnType&&e.returnType!=="()"&&e.returnType!=="void"?` -> ${e.returnType}`:"";return`${r}fn ${e.name}(${o})${a} {${i}}
`}generateMissingStubs(t,e,s){}findBraceEnd(t,e){let s=0,n=!1;for(let i=e;i<t.length;i++){for(let r of t[i])r==="{"?(s++,n=!0):r==="}"&&s--;if(n&&s<=0)return i}return e}parseTypeBlocks(t,e,s){for(let n=0;n<t.length;n++){let r=t[n].trim(),o,a=!1,c=!1,d="",l,p=r.match(u.RE_STRUCT),f=r.match(u.RE_ENUM),g=r.match(u.RE_TRAIT),v=r.match(u.RE_IMPL),h=r.match(u.RE_IMPL_FOR);if(p)d=p[1]||"",o=p[2],c=!0,l="struct";else if(f)d=f[1]||"",o=f[2],c=!0,l="enum";else if(g)d=g[1]||"",o=g[2],a=!0,l="trait";else if(h)o=h[2],l="impl for";else if(v)o=v[1],l="impl";else continue;let y=n;for(let M=n;M<t.length;M++)if(t[M].includes("{")){y=M;break}let b=y,x=0,C=!1;for(let M=y;M<t.length;M++){for(let $ of t[M])$==="{"&&(x++,C=!0),$==="}"&&x--;if(C&&x<=0){b=M;break}}let m=new W.Range(y,0,b,t[b]?.length??0),P=this.parseBlockBody(t,y+1,b,o),k={id:Fe(),name:o,fullName:o,classType:l,parentClass:void 0,interfaces:[],members:P,range:m,isInterface:a,isRecord:c,isSealed:!1,fileUri:e};if(v||h){let M=s.find($=>$.name===o);if(M){M.members.push(...P),M.range=new W.Range(M.range.start,new W.Position(b,t[b]?.length??0)),n=b;continue}}s.push(k),n=b}}parseBlockBody(t,e,s,n){let i=[];for(let r=e;r<s;r++){let o=t[r],a=o.trim();if(!a||a.startsWith("//")||a.startsWith("/*")||a.startsWith("#"))continue;let c=a.match(u.RE_METHOD);if(c){let l=c[1]?c[1].trim():"",p=c[2],f=c[3],g=c[4]?c[4].trim():void 0,v=this.parseParameters(f,p),h=!f.includes("&self")&&!f.includes("&mut self")&&!f.includes("self"),y=l.startsWith("pub")?"public":"private",b=new W.Range(r,o.indexOf(a),r,o.length),x=r,C=0,m=!1,P=-1;for(let M=r;M<s;M++){for(let $ of t[M])$==="{"&&(C++,m=!0),$==="}"&&C--;if(m&&C<=0){P=M,r=M;break}}let k=P>x?new W.Range(x,0,P,t[P]?.length??0):void 0;i.push({id:Fe(),kind:"method",name:p,returnType:g,visibility:y,parameters:v,modifiers:[],isStatic:h,isVirtual:!1,isAbstract:!1,isOverride:!1,range:b,implementationRange:k});continue}let d=a.match(u.RE_FIELD);if(d){let l=d[1]?d[1].trim():"",p=d[2],f=d[3].trim();if(p==="fn"||p==="pub"||p==="struct"||p==="enum")continue;let g=l.startsWith("pub")?"public":"private",v=new W.Range(r,o.indexOf(a),r,o.length);i.push({id:Fe(),kind:"field",name:p,type:f,visibility:g,parameters:[],modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:v});continue}}return i}parseParameters(t,e){let s=[];if(!t.trim())return s;let n=t.split(",").map(i=>i.trim()).filter(Boolean);for(let i of n){if(i==="&self"||i==="&mut self"||i==="self")continue;let r=i,o=r.lastIndexOf(":");if(o>=0){let a=r.substring(0,o).trim(),c=r.substring(o+1).trim();s.push({name:a,type:c})}else s.push({name:r,type:"unknown"})}return s}generateMethod(t,e,s,n){let i="    ",r=e.parameters.map(p=>`${p.name}: ${p.type}`).join(", "),o=e.returnType?` -> ${e.returnType}`:"",a=e.visibility==="public"?"pub ":"",c=n!==void 0?`
${n}`:`
${i}${i}todo!()
${i}`,d;if(e.kind==="constructor")d=`${i}${a}fn new(${r}) -> Self {${c}}
`;else{let p=e.isStatic?"":"&self",f=p?r?`${p}, ${r}`:p:r;d=`${i}${a}fn ${e.name}(${f})${o} {${c}}
`}let l=this.getInsertPositionForClass(s,"method");return{declaration:d,implementation:"",declarationPosition:l,implementationPosition:l}}generateField(t,e,s){let n="    ",i=e.visibility==="public"?"pub ":"",o=`${n}${i}${e.name}: ${e.type}`+`,
`,a=this.getInsertPositionForClass(s,"field");return{declaration:o,implementation:"",declarationPosition:a,implementationPosition:a}}generateProperty(t,e,s){let n="    ",i="";if(e.hasGetter&&(i+=`${n}pub fn ${e.name.toLowerCase()}(&self) -> &${e.type} {
${n}${n}&self.${e.name.toLowerCase()}
${n}}
`),e.hasSetter){let o=`set_${e.name.toLowerCase()}`;i+=`${n}pub fn ${o}(&mut self, value: ${e.type}) {
${n}${n}self.${e.name.toLowerCase()} = value;
${n}}
`}let r=this.getInsertPositionForClass(s,"property");return{declaration:i,implementation:"",declarationPosition:r,implementationPosition:r}}getInsertPositionForClass(t,e){if(e==="field"){let s=t.members.filter(n=>n.kind==="field");if(s.length>0){let n=s.reduce((i,r)=>i.range.end.line>r.range.end.line?i:r);return new W.Position(n.range.end.line+1,0)}return new W.Position(t.range.start.line+1,0)}return new W.Position(t.range.end.line,0)}getInsertPosition(t,e,s){let n=this.getInsertPositionForClass(e,s);return{declaration:n,implementation:n}}extractMethod(t,e,s,n){let i=t.selection??t.range;if(!i)return[];let r=t.document,o=r.getText(i),a=e.replace(/([a-z0-9])([A-Z])/g,"$1_$2").toLowerCase(),c=s.map(h=>h.indexOf(":")>0?h:`${h}: ()`).join(", "),d=s.map(h=>{let y=h.indexOf(":");return y>0?h.substring(0,y).trim():h}).join(", "),l=n&&n!=="void"&&n!=="()"?` -> ${n}`:"",f=o.split(/\r?\n/).map(h=>h.length?`    ${h}`:h).join(`
`),g=`
fn ${a}(${c})${l} {
${f}
}
`,v=new W.Position(r.lineCount,0);return[new W.TextEdit(i,`${a}(${d})`),new W.TextEdit(new W.Range(v,v),g)]}};var se=L(require("vscode"));var rn=0;function _e(){return`java_${Date.now()}_${++rn}`}var Oe=class u extends G{languageId="java";fileExtensions=[".java"];displayName="Java";static RE_CLASS=/^\s*(public\s+|protected\s+|private\s+)?((?:abstract|final|static)\s+)*(class|interface|enum)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/;static RE_CONSTRUCTOR=/^\s*(public|protected|private)\s+((?:static|final|abstract|synchronized|native)\s+)*(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{/;static RE_METHOD=/^\s*(public|protected|private)\s+((?:static|final|abstract|synchronized|native)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\(([^)]*)\)/;static RE_FIELD=/^\s*(public|protected|private)\s+((?:static|final|volatile|transient)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;static RE_PACKAGE=/^\s*package\s+([^;]+);/;static RE_IMPORT=/^\s*import\s+([^;]+);/;getDefaultVisibility(){return"package"}getVisibilityModifiers(){return["public","protected","private","package"]}getAvailableModifiers(){return["static","final","abstract","synchronized","native"]}getTypeDefaults(){return{defaultReturnType:"void",defaultFieldType:"int",defaultPropertyType:"String",defaultParamType:"int"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[];for(let o=0;o<s.length;o++){let c=s[o].match(u.RE_IMPORT);if(c){i.push(c[1].trim());continue}}return this.parseClasses(s,t.uri,n),{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:r,imports:i}}parseClasses(t,e,s){for(let n=0;n<t.length;n++){let o=t[n].trim().match(u.RE_CLASS);if(!o)continue;let a=o[3],c=o[4],d=o[5],l=o[6],p=[];l&&p.push(...l.split(",").map($=>$.trim()).filter(Boolean));let f=a==="interface",g=a==="enum",v=o[2]||"",h=v.includes("final"),y=a==="class"?v.includes("abstract")?"abstract class":"class":a,b=n;for(let $=n;$<t.length;$++)if(t[$].includes("{")){b=$;break}let x=b,C=0,m=!1;for(let $=b;$<t.length;$++){for(let O of t[$])O==="{"&&(C++,m=!0),O==="}"&&C--;if(m&&C<=0){x=$;break}}let P=new se.Range(b,0,x,t[x]?.length??0),k=this.parseClassBody(t,b+1,x,c),M={id:_e(),name:c,fullName:c,classType:y,parentClass:d,interfaces:p,members:k,range:P,isInterface:f,isRecord:g,isSealed:h,fileUri:e};s.push(M),n=x}}parseClassBody(t,e,s,n){let i=[],r="package";for(let o=e;o<s;o++){let a=t[o],c=a.trim();if(!c||c.startsWith("//")||c.startsWith("/*")||c.startsWith("*")||c.startsWith("@"))continue;let d=c.match(u.RE_CONSTRUCTOR);if(d&&d[3]===n){let f=d[1],g=d[2]||"",v=d[3],h=d[4];r=this.mapVisibility(f);let y=this.parseParameters(h),b=g.trim().split(/\s+/).filter(Boolean),x=new se.Range(o,a.indexOf(c),o,a.length),C=this.findBraceEnd(t,o,s);i.push({id:_e(),kind:"constructor",name:v,visibility:r,parameters:y,modifiers:b,isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:x,implementationRange:C>o?new se.Range(o,0,C,t[C]?.length??0):void 0});continue}let l=c.match(u.RE_METHOD);if(l){let f=l[1],g=l[2]||"",v=l[3].trim(),h=l[4],y=l[5];r=this.mapVisibility(f);let b=this.parseParameters(y),x=g.trim().split(/\s+/).filter(Boolean),C=new se.Range(o,a.indexOf(c),o,a.length),m=this.findBraceEnd(t,o,s);i.push({id:_e(),kind:"method",name:h,returnType:v,visibility:r,parameters:b,modifiers:x,isStatic:g.includes("static"),isVirtual:!1,isAbstract:g.includes("abstract"),isOverride:!1,range:C,implementationRange:m>o?new se.Range(o,0,m,t[m]?.length??0):void 0});continue}let p=c.match(u.RE_FIELD);if(p){let f=p[1],g=p[2]||"",v=p[3].trim(),h=p[4].trim();r=this.mapVisibility(f);let y=g.trim().split(/\s+/).filter(Boolean),b=new se.Range(o,a.indexOf(c),o,a.length);i.push({id:_e(),kind:"field",name:h,type:v,visibility:r,parameters:[],modifiers:y,isStatic:g.includes("static"),isVirtual:!1,isAbstract:!1,isOverride:!1,range:b});continue}}return i}findBraceEnd(t,e,s){let n=0,i=!1;for(let r=e;r<s;r++){for(let o of t[r])o==="{"?(n++,i=!0):o==="}"&&n--;if(i&&n<=0)return r}return-1}mapVisibility(t){switch(t){case"public":return"public";case"protected":return"protected";case"private":return"private";default:return"package"}}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)i==="<"&&s++,i===">"&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim(),s=e.split(/\s+/).filter(Boolean);if(s.length>=2){let n=s[s.length-1],i=s.slice(0,s.length-1).join(" ");return{name:n,type:i}}return{name:e,type:"Object"}}generateMethod(t,e,s,n){let i="    ",r=e.parameters.map(g=>`${g.type} ${g.name}`).join(", "),o=this.visibilityString(e.visibility),a=e.modifiers.map(g=>g.name).join(" "),c=a?a+" ":"",d=e.isStatic?"static ":"",l=n!==void 0?`
${n}`:`
${i}${i}// TODO: implement
${i}`,p;if(e.kind==="constructor")p=`${i}${o}${c}${t}(${r}) {${l}}
`;else{let g=e.returnType??"void";p=`${i}${o}${c}${d}${g} ${e.name}(${r}) {${l}}
`}let f=this.getInsertPositionForClass(s,"method");return{declaration:p+`
`,implementation:"",declarationPosition:f,implementationPosition:f}}generateField(t,e,s){let n="    ",i=this.visibilityString(e.visibility),r=`${n}${i}${e.type} ${e.name}`;e.defaultValue&&(r+=` = ${e.defaultValue}`),r+=`;
`;let o=this.getInsertPositionForClass(s,"field");return{declaration:r,implementation:"",declarationPosition:o,implementationPosition:o}}generateProperty(t,e,s){let n="    ",i=this.visibilityString(e.visibility),r=e.name.charAt(0).toLowerCase()+e.name.substring(1),o="";e.hasGetter&&(o+=`${n}${i}${e.type} get${e.name.charAt(0).toUpperCase()+e.name.substring(1)}() {
${n}${n}return ${r};
${n}}
`),e.hasSetter&&(o+=`${n}${i}void set${e.name.charAt(0).toUpperCase()+e.name.substring(1)}(${e.type} ${r}) {
${n}${n}this.${r} = ${r};
${n}}
`);let a=this.getInsertPositionForClass(s,"property");return{declaration:o,implementation:"",declarationPosition:a,implementationPosition:a}}visibilityString(t){switch(t){case"public":return"public ";case"protected":return"protected ";case"private":return"private ";default:return""}}getInsertPositionForClass(t,e){if(e==="field"){let s=t.members.filter(n=>n.kind==="field");if(s.length>0){let n=s.reduce((i,r)=>i.range.end.line>r.range.end.line?i:r);return new se.Position(n.range.end.line+1,0)}return new se.Position(t.range.start.line+1,0)}return new se.Position(t.range.end.line,0)}getInsertPosition(t,e,s){let n=this.getInsertPositionForClass(e,s);return{declaration:n,implementation:n}}};var K=L(require("vscode"));var on=0;function Ae(){return`py_${Date.now()}_${++on}`}var Ne=class u extends G{languageId="python";fileExtensions=[".py"];displayName="Python";static RE_CLASS=/^\s*class\s+(\w+)(?:\(([^)]*)\))?\s*:/;static RE_METHOD=/^\s+(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^{]+?))?\s*:/;static RE_FIELD_INIT=/self\.(\w+)\s*=\s*(.+)/;static RE_FIELD_CLASS=/^\s+(\w+)\s*=\s*(.+)/;static RE_IMPORT=/^\s*(?:from\s+([\w.]+)\s+)?import\s+([^#\n]+)/;static RE_DECORATOR=/^\s*@(\w+)(?:\(([^)]*)\))?/;getDefaultVisibility(){return"public"}getVisibilityModifiers(){return["public","protected","private"]}getAvailableModifiers(){return["staticmethod","classmethod","property","abstract","async"]}getTypeDefaults(){return{defaultReturnType:"None",defaultFieldType:"Any",defaultPropertyType:"str",defaultParamType:"Any"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[];for(let a=0;a<s.length;a++){let d=s[a].match(u.RE_IMPORT);if(d){let l=d[1],p=d[2].trim();i.push(l?`${l}.${p}`:p);continue}}this.parseClasses(s,t.uri,n);let o=this.extractStandaloneFunctions(s,n);return{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:o,imports:i}}extractStandaloneFunctions(t,e){let s=[],n=e.map(o=>({start:o.range.start.line,end:o.range.end.line})),i=o=>n.some(a=>o>=a.start&&o<=a.end),r=/^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^\n]+?))?\s*:/;for(let o=0;o<t.length;o++){let a=t[o];if(i(o)||/^\s/.test(a))continue;let c=a.trim();if(!c||c.startsWith("#"))continue;let d=c.match(r);if(!d)continue;let l=d[1],p=d[2],f=d[3]?.trim(),g=this.findPythonBodyEnd(t,o);s.push({id:Ae(),kind:"method",name:l,returnType:f,visibility:"public",parameters:this.parseParameters(p||""),modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new K.Range(o,0,o,a.length),implementationRange:g>o?new K.Range(o,0,g,t[g]?.length??0):void 0})}return s}rewriteStandaloneFunction(t,e){let s=t.split(`
`);if(s.length===0)return;let n=0;for(;n<s.length&&s[n].trim()==="";)n++;if(n>=s.length)return;let i=e.parameters.map(d=>{let l=d.name;return d.type&&d.type!=="Any"&&(l+=`: ${d.type}`),d.defaultValue&&(l+=` = ${d.defaultValue}`),l}).join(", "),r=e.returnType&&e.returnType!=="None"?` -> ${e.returnType}`:"",a=`${/^[ \t]*/.exec(s[n])?.[0]??""}${/async/.test(s[n])?"async ":""}def ${e.name}(${i})${r}:`,c=s.slice(n+1).join(`
`);return`${a}
${c}`}findPythonBodyEnd(t,e){for(let s=e+1;s<t.length;s++){let n=t[s];if(n.trim()!==""&&/^[^\s]/.test(n))return s-1}return t.length-1}findIndentedBodyEnd(t,e,s){let n=t[e].match(/^(\s*)/)?.[1].length??0,i=e;for(let r=e+1;r<s;r++){let o=t[r];if(o.trim()==="")continue;if((o.match(/^(\s*)/)?.[1].length??0)>n)i=r;else break}return i}parseClasses(t,e,s){for(let n=0;n<t.length;n++){let i=t[n],r=i.match(u.RE_CLASS);if(!r)continue;let o=r[1],a=r[2],c=void 0,d=[];if(a){let h=a.split(",").map(y=>y.trim()).filter(Boolean);for(let y of h)d.length===0&&!c?(y.startsWith("ABC")||y.startsWith("Protocol")||/^[A-Z]/.test(y.charAt(0)))&&d.push(y):d.push(y)}let l=i.match(/^(\s*)/)?.[1].length??0,p=n+1;for(let h=n+1;h<t.length;h++){let y=t[h];if(y.trim()==="")continue;if((y.match(/^(\s*)/)?.[1].length??0)<=l&&y.trim().length>0){p=h;break}h===t.length-1&&(p=h+1)}let f=new K.Range(n,0,p-1,t[p-1]?.length??0),g=this.parseClassBody(t,n+1,p,o),v={id:Ae(),name:o,fullName:o,classType:"class",parentClass:c,interfaces:d,members:g,range:f,isInterface:!1,isRecord:!1,isSealed:!1,fileUri:e};s.push(v),n=p-1}}parseClassBody(t,e,s,n){let i=[],r=[];for(let o=e;o<s;o++){let a=t[o],c=a.trim();if(!c||c.startsWith("#")||c.startsWith('"""')||c.startsWith("'''"))continue;let d=c.match(u.RE_DECORATOR);if(d){r.push(d[1]);continue}let l=a.match(u.RE_METHOD);if(l){let p=l[1],f=l[2],g=l[3]?l[3].trim():void 0,v=[...r];r=[];let h=this.parseParameters(f),y=f.trim().split(",")[0]?.trim(),b=v.includes("staticmethod")||v.includes("classmethod"),x=v.includes("classmethod"),C=v.includes("property"),m=v.some(te=>te.endsWith(".setter")),P="method";p==="__init__"?P="constructor":p==="__del__"?P="destructor":C&&(P="property");let k=p,M="public";k.startsWith("__")&&!k.endsWith("__")?M="private":k.startsWith("_")&&(M="protected");let $=new K.Range(o,0,o,a.length),O=this.findIndentedBodyEnd(t,o,s);i.push({id:Ae(),kind:P,name:p,returnType:g,visibility:M,parameters:h,modifiers:v,isStatic:b,isVirtual:!1,isAbstract:!1,isOverride:!1,range:$,implementationRange:O>o?new K.Range(o,0,O,t[O]?.length??0):void 0});continue}if(r=[],c.includes("self.")){let p=c.match(u.RE_FIELD_INIT);if(p){let f=p[1],g=p[2].trim();if(f.startsWith("__")||f==="_"||f==="__")continue;let v="public";f.startsWith("__")?v="private":f.startsWith("_")&&(v="protected");let h=new K.Range(o,0,o,a.length);i.push({id:Ae(),kind:"field",name:f,type:this.inferTypeFromValue(g),visibility:v,parameters:[],modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:h});continue}}}return i}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)(i==="("||i==="[")&&s++,(i===")"||i==="]")&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim();if(e==="self"||e==="cls")return{name:e,type:e==="self"?"Self":"type"};if(e.startsWith("*")||e.startsWith("**"))return{name:e,type:"Any"};let s=e.lastIndexOf(":"),n=e.indexOf("=");if(s>0&&(n<0||s<n)){let i=e.substring(0,s).trim(),r=e.substring(s+1).trim(),o;return n>s&&(o=r.substring(r.indexOf("=")+1).trim(),r=r.substring(0,r.indexOf("=")).trim()),{name:i,type:r,defaultValue:o}}if(n>0){let i=e.substring(0,n).trim(),r=e.substring(n+1).trim();return{name:i,type:"Any",defaultValue:r}}return{name:e,type:"Any"}}inferTypeFromValue(t){return t==="None"?"None":/^\d+$/.test(t)?"int":/^\d+\.\d+$/.test(t)?"float":t.startsWith('"')||t.startsWith("'")?"str":t.startsWith("[")?"list":t.startsWith("{")?"dict":t==="True"||t==="False"?"bool":"Any"}generateMethod(t,e,s,n){let i="    ",r=e.parameters.map(l=>{let p=l.name;return l.type&&l.type!=="Any"&&(p+=`: ${l.type}`),l.defaultValue&&(p+=` = ${l.defaultValue}`),p}).join(", "),o=e.returnType&&e.returnType!=="None"?` -> ${e.returnType}`:"",a=n!==void 0?n:`${i}${i}pass`,c;e.kind==="constructor"?c=`${i}def __init__(self${r?", "+r:""})${o}:
${a}
`:e.isStatic?c=`${i}@staticmethod
${i}def ${e.name}(${r})${o}:
${a}
`:c=`${i}def ${e.name}(self${r?", "+r:""})${o}:
${a}
`;let d=this.getInsertPositionForClass(s,"method");return{declaration:c,implementation:"",declarationPosition:d,implementationPosition:d}}generateField(t,e,s){let i=`    self.${e.name}`;e.defaultValue?i+=` = ${e.defaultValue}`:e.type&&e.type!=="Any"?i+=`: ${e.type} = None`:i+=" = None",i+=`
`;let r=this.getInsertPositionForClass(s,"field");return{declaration:i,implementation:"",declarationPosition:r,implementationPosition:r}}generateProperty(t,e,s){let n="    ",i="";e.hasGetter&&(i+=`${n}@property
${n}def ${e.name}(self) -> ${e.type}:
${n}${n}return self._${e.name}
`),e.hasSetter&&(i+=`
${n}@${e.name}.setter
${n}def ${e.name}(self, value: ${e.type}) -> None:
${n}${n}self._${e.name} = value
`);let r=this.getInsertPositionForClass(s,"property");return{declaration:i,implementation:"",declarationPosition:r,implementationPosition:r}}getInsertPositionForClass(t,e){if(e==="field"){let s=t.members.filter(n=>n.kind==="field");if(s.length>0){let n=s.reduce((i,r)=>i.range.end.line>r.range.end.line?i:r);return new K.Position(n.range.end.line+1,0)}return new K.Position(t.range.start.line+1,0)}return new K.Position(t.range.end.line,0)}getInsertPosition(t,e,s){let n=this.getInsertPositionForClass(e,s);return{declaration:n,implementation:n}}extractMethod(t,e,s,n){let i=t.selection??t.range;if(!i)return[];let r=t.document,o=r.getText(i),a=s.map(v=>v.indexOf(":")>0?v:`${v}: Any`).join(", "),c=s.map(v=>{let h=v.indexOf(":");return h>0?v.substring(0,h).trim():v}).join(", "),d=n&&n!=="None"&&n!=="void"?` -> ${n}`:"",p=o.split(/\r?\n/).map(v=>v.trim().length?`    ${v.trim()}`:"").join(`
`),f=`
def ${e}(${a})${d}:
${p}
`,g=new K.Position(r.lineCount,0);return[new K.TextEdit(i,`${e}(${c})`),new K.TextEdit(new K.Range(g,g),f)]}};var Z=L(require("vscode"));var an=0;function we(){return`cs_${Date.now()}_${++an}`}var Ve=class u extends G{languageId="csharp";fileExtensions=[".cs"];displayName="C#";static RE_CLASS=/^\s*(public|private|protected|internal)?\s*((?:abstract|sealed|static|partial)\s+)*(class|interface|struct|record|enum)\s+(\w+)(?:<[^>]*>)?(?:\s*:\s*((?:\w+(?:<[^>]*>)?\s*,?\s*)+))?/;static RE_METHOD=/^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\(([^)]*)\)/;static RE_CONSTRUCTOR=/^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*(\w+)\s*\(([^)]*)\)/;static RE_PROPERTY=/^\s*(public|private|protected|internal)\s+((?:static|virtual|override|abstract|async|sealed|new)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*\{[^}]*(?:get|set)[^}]*\}/;static RE_FIELD=/^\s*(public|private|protected|internal)\s+((?:static|readonly|volatile|const)\s+)*([\w<>\[\]?,\s]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/;static RE_USING=/^\s*using\s+([^;]+);/;getDefaultVisibility(){return"private"}getVisibilityModifiers(){return["public","private","protected","internal"]}getAvailableModifiers(){return["static","virtual","override","abstract","async","sealed","readonly","const"]}getTypeDefaults(){return{defaultReturnType:"void",defaultFieldType:"int",defaultPropertyType:"string",defaultParamType:"int"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[];for(let o=0;o<s.length;o++){let c=s[o].match(u.RE_USING);if(c){i.push(c[1].trim());continue}}return this.parseClasses(s,t.uri,n),{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:r,imports:i}}parseClasses(t,e,s){for(let n=0;n<t.length;n++){let o=t[n].trim().match(u.RE_CLASS);if(!o)continue;let a=o[3],c=o[4],d=o[5],l=o[2]||"",p=void 0,f=[];if(d){let $=d.split(",").map(O=>O.trim()).filter(Boolean);if($.length>0)for(let O of $)f.push(O)}let g=a==="interface",v=a==="struct"||a==="record",h=l.includes("sealed"),y=a==="class"?l.includes("abstract")?"abstract class":"class":a,b=n;for(let $=n;$<t.length;$++)if(t[$].includes("{")){b=$;break}let x=b,C=0,m=!1;for(let $=b;$<t.length;$++){for(let O of t[$])O==="{"&&(C++,m=!0),O==="}"&&C--;if(m&&C<=0){x=$;break}}let P=new Z.Range(b,0,x,t[x]?.length??0),k=this.parseClassBody(t,b+1,x,c),M={id:we(),name:c,fullName:c,classType:y,parentClass:p,interfaces:f,members:k,range:P,isInterface:g,isRecord:v,isSealed:h,fileUri:e};s.push(M),n=x}}parseClassBody(t,e,s,n){let i=[];for(let r=e;r<s;r++){let o=t[r],a=o.trim();if(!a||a.startsWith("//")||a.startsWith("/*")||a.startsWith("*")||a.startsWith("["))continue;let c=a.match(u.RE_PROPERTY);if(c&&!a.includes("(")){let f=c[1],g=c[2]||"",v=c[3].trim(),h=c[4],y=this.mapVisibility(f),b=g.trim().split(/\s+/).filter(Boolean),x=g.includes("static"),C=new Z.Range(r,o.indexOf(a),r,o.length);i.push({id:we(),kind:"property",name:h,type:v,visibility:y,parameters:[],modifiers:b,isStatic:x,isVirtual:g.includes("virtual"),isAbstract:g.includes("abstract"),isOverride:g.includes("override"),range:C});continue}let d=a.match(u.RE_CONSTRUCTOR);if(d&&d[3]===n){let f=d[1],g=d[2]||"",v=d[3],h=d[4],y=this.mapVisibility(f),b=this.parseParameters(h),x=g.trim().split(/\s+/).filter(Boolean),C=new Z.Range(r,o.indexOf(a),r,o.length),m=this.findBraceEnd(t,r,s);i.push({id:we(),kind:"constructor",name:v,visibility:y,parameters:b,modifiers:x,isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:C,implementationRange:m>r?new Z.Range(r,0,m,t[m]?.length??0):void 0});continue}let l=a.match(u.RE_METHOD);if(l){let f=l[1],g=l[2]||"",v=l[3].trim(),h=l[4],y=l[5],b=this.mapVisibility(f),x=this.parseParameters(y),C=g.trim().split(/\s+/).filter(Boolean),m=new Z.Range(r,o.indexOf(a),r,o.length),P=this.findBraceEnd(t,r,s);i.push({id:we(),kind:"method",name:h,returnType:v,visibility:b,parameters:x,modifiers:C,isStatic:g.includes("static"),isVirtual:g.includes("virtual"),isAbstract:g.includes("abstract"),isOverride:g.includes("override"),range:m,implementationRange:P>r?new Z.Range(r,0,P,t[P]?.length??0):void 0});continue}let p=a.match(u.RE_FIELD);if(p){let f=p[1],g=p[2]||"",v=p[3].trim(),h=p[4].trim(),y=this.mapVisibility(f),b=g.trim().split(/\s+/).filter(Boolean),x=new Z.Range(r,o.indexOf(a),r,o.length);i.push({id:we(),kind:"field",name:h,type:v,visibility:y,parameters:[],modifiers:b,isStatic:g.includes("static"),isVirtual:!1,isAbstract:!1,isOverride:!1,range:x});continue}}return i}findBraceEnd(t,e,s){let n=0,i=!1;for(let r=e;r<s;r++){for(let o of t[r])o==="{"?(n++,i=!0):o==="}"&&n--;if(i&&n<=0)return r}return-1}mapVisibility(t){switch(t){case"public":return"public";case"protected":return"protected";case"private":return"private";case"internal":return"internal";default:return"private"}}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)(i==="<"||i==="(")&&s++,(i===">"||i===")")&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim(),s=e,n,i=s.lastIndexOf("=");i>=0&&(n=s.substring(i+1).trim(),s=s.substring(0,i).trim());let r=s.split(/\s+/).filter(Boolean),o=r.find(c=>c==="ref"||c==="out"||c==="params"),a=r.filter(c=>c!=="ref"&&c!=="out"&&c!=="params");if(a.length>=2){let c=a[a.length-1],d=a.slice(0,a.length-1).join(" ");return{name:c,type:d,defaultValue:n,direction:o==="out"?"out":o==="ref"?"inout":void 0}}return{name:e,type:"var",defaultValue:n}}generateMethod(t,e,s,n){let i="    ",r=e.parameters.map(f=>{let g="";return f.direction==="out"?g+="out ":f.direction==="inout"&&(g+="ref "),g+=`${f.type} ${f.name}`,f.defaultValue&&(g+=` = ${f.defaultValue}`),g}).join(", "),o=this.visibilityString(e.visibility),a=[];e.isStatic&&a.push("static"),e.isVirtual&&a.push("virtual"),e.isAbstract&&a.push("abstract"),e.isOverride&&a.push("override");for(let f of e.modifiers)a.includes(f.name)||a.push(f.name);let c=a.length?a.join(" ")+" ":"",d=n!==void 0?`
${n}`:`
${i}${i}throw new NotImplementedException();
${i}`,l;if(e.kind==="constructor")l=`${i}${o}${c}${t}(${r})
${i}{${d}}
`;else{let f=e.returnType??"void";l=`${i}${o}${c}${f} ${e.name}(${r})
${i}{${d}}
`}let p=this.getInsertPositionForClass(s,"method");return{declaration:l,implementation:"",declarationPosition:p,implementationPosition:p}}generateField(t,e,s){let n="    ",i=this.visibilityString(e.visibility),r=`${n}${i}${e.type} ${e.name}`;e.defaultValue&&(r+=` = ${e.defaultValue}`),r+=`;
`;let o=this.getInsertPositionForClass(s,"field");return{declaration:r,implementation:"",declarationPosition:o,implementationPosition:o}}generateProperty(t,e,s){let n="    ",i=this.visibilityString(e.visibility),r="get;",o=e.hasSetter?" set;":"",a=`${n}${i}${e.type} ${e.name} { ${r}${o} }
`,c=this.getInsertPositionForClass(s,"property");return{declaration:a,implementation:"",declarationPosition:c,implementationPosition:c}}visibilityString(t){switch(t){case"public":return"public ";case"protected":return"protected ";case"private":return"private ";case"internal":return"internal ";default:return"private "}}getInsertPositionForClass(t,e){if(e==="field"){let s=t.members.filter(n=>n.kind==="field");if(s.length>0){let n=s.reduce((i,r)=>i.range.end.line>r.range.end.line?i:r);return new Z.Position(n.range.end.line+1,0)}return new Z.Position(t.range.start.line+1,0)}return new Z.Position(t.range.end.line,0)}getInsertPosition(t,e,s){let n=this.getInsertPositionForClass(e,s);return{declaration:n,implementation:n}}};var X=L(require("vscode"));var cn=0;function Be(){return`go_${Date.now()}_${++cn}`}var Ue=class u extends G{languageId="go";fileExtensions=[".go"];displayName="Go";static RE_STRUCT=/^\s*type\s+(\w+)\s+struct\s*\{?/;static RE_INTERFACE=/^\s*type\s+(\w+)\s+interface\s*\{?/;static RE_METHOD=/^\s*func\s+\(\s*(\w+)\s+\*?(\w+)\s*\)\s+(\w+)\s*\(([^)]*)\)\s*(?:\(?\*?([\w.\[\]*]+)\)?)?\s*\{?/;static RE_FUNC=/^\s*func\s+(\w+)\s*\(([^)]*)\)\s*(?:\(?\*?([\w.\[\]*]+)\)?)?\s*\{?/;static RE_FIELD=/^\s*(\w+)\s+([\w.*\[\]]+)/;static RE_PACKAGE=/^\s*package\s+(\w+)/;static RE_IMPORT=/^\s*"([^"]+)"/;getDefaultVisibility(){return"private"}getVisibilityModifiers(){return["public","private"]}getAvailableModifiers(){return[]}getTypeDefaults(){return{defaultReturnType:"error",defaultFieldType:"string",defaultPropertyType:"string",defaultParamType:"int"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[],o=!1;for(let a=0;a<s.length;a++){let d=s[a].trim();if(d==="import ("){o=!0;continue}if(o&&d===")"){o=!1;continue}let l=d.match(u.RE_IMPORT);if(l){i.push(l[1]);continue}if(d.startsWith("import ")){let p=d.match(/^import\s+"([^"]+)"/);p&&i.push(p[1]);continue}}this.parseTypes(s,t.uri,n);for(let a=0;a<s.length;a++){let c=s[a],d=c.trim(),l=d.match(u.RE_METHOD);if(l){let f=l[1],g=l[2],v=l[3];for(let h of n)if(h.name===g){let y=!1;for(let b of h.members)if(b.name===v){y=!0;break}if(!y){let b=this.parseParameters(l[4]),x=l[5]?l[5].trim():void 0,m=v[0]===v[0].toUpperCase()?"public":"private",P=new X.Range(a,0,a,c.length),k=this.findBraceEnd(s,a,s.length);h.members.push({id:Be(),kind:"method",name:v,returnType:x,visibility:m,parameters:b,modifiers:[f],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:P,implementationRange:k>a?new X.Range(a,0,k,s[k]?.length??0):void 0})}}}let p=d.match(u.RE_FUNC);if(p&&!d.includes("(")||p&&!d.match(u.RE_METHOD)){let f=p[1],g=f[0]===f[0].toUpperCase(),v=new X.Range(a,0,a,c.length);r.push({id:Be(),kind:"method",name:f,returnType:p[3]?p[3].trim():void 0,visibility:g?"public":"private",parameters:this.parseParameters(p[2]),modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:v})}}return{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:r,imports:i}}parseTypes(t,e,s){for(let n=0;n<t.length;n++){let r=t[n].trim(),o,a=!1,c=!1,d,l=r.match(u.RE_STRUCT),p=r.match(u.RE_INTERFACE);if(l)o=l[1],c=!0,d="struct";else if(p)o=p[1],a=!0,d="interface";else continue;let f=n;for(let C=n;C<t.length;C++)if(t[C].includes("{")){f=C;break}let g=f,v=0,h=!1;for(let C=f;C<t.length;C++){for(let m of t[C])m==="{"&&(v++,h=!0),m==="}"&&v--;if(h&&v<=0){g=C;break}}let y=new X.Range(f,0,g,t[g]?.length??0),b=this.parseStructBody(t,f+1,g),x={id:Be(),name:o,fullName:o,classType:d,parentClass:void 0,interfaces:[],members:b,range:y,isInterface:a,isRecord:c,isSealed:!1,fileUri:e};s.push(x),n=g}}parseStructBody(t,e,s){let n=[];for(let i=e;i<s;i++){let r=t[i],o=r.trim();if(!o||o.startsWith("//")||o.startsWith("/*"))continue;let a=o.match(u.RE_FIELD);if(a){let c=a[1],d=a[2].trim();if(c==="func"||c==="type"||c==="struct"||c==="interface")continue;let p=c[0]===c[0].toUpperCase()?"public":"private",f=new X.Range(i,r.indexOf(o),i,r.length);n.push({id:Be(),kind:"field",name:c,type:d,visibility:p,parameters:[],modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:f});continue}}return n}rewriteStandaloneFunction(t,e){let s=t.indexOf("{"),n=t.lastIndexOf("}");if(s<0||n<=s)return;let i=t.substring(s+1,n),r=e.parameters.map(a=>`${a.name} ${a.type||"interface{}"}`).join(", "),o=e.returnType&&e.returnType!=="void"?` ${e.returnType}`:"";return`func ${e.name}(${r})${o} {${i}}
`}generateMissingStubs(t,e,s){}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)(i==="("||i==="[")&&s++,(i===")"||i==="]")&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim(),s=e.split(/\s+/).filter(Boolean);if(s.length>=2){let n=s[s.length-1],i=s.slice(0,s.length-1);return i.length===1?{name:i[0],type:n}:{name:i.join(", "),type:n}}return s.length===1?{name:"",type:s[0]}:{name:e,type:"interface{}"}}findBraceEnd(t,e,s){let n=0,i=!1;for(let r=e;r<s;r++){for(let o of t[r])o==="{"?(n++,i=!0):o==="}"&&n--;if(i&&n<=0)return r}return-1}getReceiverVar(t){return t.charAt(0).toLowerCase()}generateMethod(t,e,s,n){let i="	",r=this.getReceiverVar(t),o=e.parameters.map(l=>`${l.name} ${l.type}`).join(", "),a=e.returnType?` ${e.returnType}`:"",c;if(e.kind==="constructor"){let l=n!==void 0?`
${n}`:`
${i}// TODO: implement
${i}return &${t}{}
`;c=`func New${t}(${o}) *${t} {${l}}
`}else{let l=n!==void 0?`
${n}`:`
${i}// TODO: implement
`;c=`func (${r} *${t}) ${e.name}(${o})${a} {${l}}
`}let d=new X.Position(s.range.end.line+1,0);return{declaration:c,implementation:"",declarationPosition:d,implementationPosition:d}}generateField(t,e,s){let i=`	${e.name} ${e.type}
`,r=new X.Position(s.range.end.line,0);return{declaration:i,implementation:"",declarationPosition:r,implementationPosition:r}}generateProperty(t,e,s){let n="	",i=this.getReceiverVar(t),r="";if(e.hasGetter&&(r+=`func (${i} *${t}) ${e.name}() ${e.type} {
${n}return ${i}.${e.name[0].toLowerCase()+e.name.substring(1)}
}
`),e.hasSetter){let a=`Set${e.name.charAt(0).toUpperCase()+e.name.substring(1)}`;r+=`func (${i} *${t}) ${a}(value ${e.type}) {
${n}${i}.${e.name[0].toLowerCase()+e.name.substring(1)} = value
}
`}let o=new X.Position(s.range.end.line+1,0);return{declaration:r,implementation:"",declarationPosition:o,implementationPosition:o}}getInsertPosition(t,e,s){if(s==="field"){let i=e.members.filter(r=>r.kind==="field");if(i.length>0){let r=i.reduce((o,a)=>o.range.end.line>a.range.end.line?o:a);return{declaration:new X.Position(r.range.end.line+1,0),implementation:new X.Position(r.range.end.line+1,0)}}return{declaration:new X.Position(e.range.start.line+1,0),implementation:new X.Position(e.range.start.line+1,0)}}let n=new X.Position(e.range.end.line+1,0);return{declaration:n,implementation:n}}};var B=L(require("vscode"));var dn=0;function me(){return`ts_${Date.now()}_${++dn}`}var Ge=class u extends G{languageId="typescript";fileExtensions=[".ts",".tsx",".js",".jsx"];displayName="TypeScript/JavaScript";static RE_CLASS=/^\s*(export\s+)?(default\s+)?(abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{?/;static RE_METHOD=/^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+?))?\s*[{;]/;static RE_PROPERTY=/^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*(#?\w+)\s*(?::\s*([^;=]+?))?\s*[;=]/;static RE_CONSTRUCTOR=/^\s*(public|private|protected)?\s*constructor\s*\(([^)]*)\)/;static RE_GETTER=/^\s*(?:(public|private|protected)\s+)?((?:static|abstract|async|override|readonly)\s+)*get\s+(\w+)\s*\(\s*\)\s*(?::\s*([^{]+?))?\s*\{?/;static RE_IMPORT=/^\s*import\s+.*?from\s+['"]([^'"]+)['"]/;static RE_IMPORT2=/^\s*import\s+['"]([^'"]+)['"]/;isJavaScript(t){return t.languageId==="javascript"||t.languageId==="javascriptreact"}getDefaultVisibility(){return"public"}getVisibilityModifiers(){return["public","private","protected"]}getAvailableModifiers(){return["static","abstract","async","override","readonly"]}getTypeDefaults(){return{defaultReturnType:"void",defaultFieldType:"number",defaultPropertyType:"string",defaultParamType:"number"}}findPairedFile(t){}parseDocument(t){let s=t.getText().split(/\r?\n/),n=[],i=[],r=[];for(let a=0;a<s.length;a++){let c=s[a],d=c.match(u.RE_IMPORT)||c.match(u.RE_IMPORT2);if(d){i.push(d[1]);continue}}this.parseClasses(s,t.uri,n);let o=this.extractStandaloneFunctions(s,n);return{uri:t.uri,languageId:this.languageId,classes:n,standaloneProcedures:o,imports:i}}extractStandaloneFunctions(t,e){let s=[],n=e.map(c=>({start:c.range.start.line,end:c.range.end.line})),i=c=>n.some(d=>c>=d.start&&c<=d.end),r=/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\*?\s*(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^={]+?))?\s*\{?/,o=/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:async\s*)?function\s*\*?\s*\(([^)]*)\)/,a=/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*([^=>]+?))?\s*=>/;for(let c=0;c<t.length;c++){if(i(c))continue;let d=t[c].trim();if(!d||d.startsWith("//")||d.startsWith("/*")||d.startsWith("*"))continue;let l=d.match(r),p=l?null:d.match(o),f=!l&&!p?d.match(a):null,g=l||p||f;if(!g)continue;let v=g[1];if(!v)continue;let h="",y;l?(h=l[2],y=l[3]?.trim()):p?(h=p[3],y=p[2]?.trim()):f&&(h=f[3],y=(f[4]||f[2])?.trim());let b=this.findBodyEnd(t,c);s.push({id:me(),kind:"method",name:v,returnType:y,visibility:"public",parameters:this.parseParameters(h||""),modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:new B.Range(c,0,c,t[c].length),implementationRange:b>c?new B.Range(c,0,b,t[b]?.length??0):void 0})}return s}rewriteStandaloneFunction(t,e){let s=t.indexOf("{"),n=t.lastIndexOf("}");if(s<0||n<=s)return;let i=t.substring(s+1,n),r=t.substring(0,s),o=/:\s*[A-Za-z]/.test(r),a=e.parameters.map(l=>{let p=l.name;return o&&l.type&&l.type!=="any"&&(p+=`: ${l.type}`),l.defaultValue&&(p+=` = ${l.defaultValue}`),p}).join(", "),c=o&&e.returnType&&e.returnType!=="void"?`: ${e.returnType}`:"";return`${/async/.test(r)?"async ":""}function ${e.name}(${a})${c} {${i}}
`}findBodyEnd(t,e){let s=0,n=!1;for(let i=e;i<t.length;i++){for(let r of t[i])r==="{"?(s++,n=!0):r==="}"&&s--;if(n&&s<=0)return i}return e}parseClasses(t,e,s){for(let n=0;n<t.length;n++){let o=t[n].trim().match(u.RE_CLASS);if(!o)continue;let a=!!o[3],c=o[4],d=o[5],l=o[6],p=[];l&&p.push(...l.split(",").map(C=>C.trim()).filter(Boolean));let f=n;for(let C=n;C<t.length;C++)if(t[C].includes("{")){f=C;break}let g=f,v=0,h=!1;for(let C=f;C<t.length;C++){for(let m of t[C])m==="{"&&(v++,h=!0),m==="}"&&v--;if(h&&v<=0){g=C;break}}let y=new B.Range(f,0,g,t[g]?.length??0),b=this.parseClassBody(t,f+1,g,c),x={id:me(),name:c,fullName:c,classType:a?"abstract class":"class",parentClass:d,interfaces:p,members:b,range:y,isInterface:!1,isRecord:!1,isSealed:!1,fileUri:e};s.push(x),n=g}}parseClassBody(t,e,s,n){let i=[];for(let r=e;r<s;r++){let o=t[r],a=o.trim();if(!a||a.startsWith("//")||a.startsWith("/*")||a.startsWith("*"))continue;let c=a.match(u.RE_CONSTRUCTOR);if(c){let f=c[1]||"public",g=c[2],v=this.parseParameters(g),h=this.mapVisibility(f),y=new B.Range(r,o.indexOf(a),r,o.length),b=this.findBraceEnd(t,r,s);i.push({id:me(),kind:"constructor",name:"constructor",visibility:h,parameters:v,modifiers:[],isStatic:!1,isVirtual:!1,isAbstract:!1,isOverride:!1,range:y,implementationRange:b>r?new B.Range(r,0,b,t[b]?.length??0):void 0});continue}let d=a.match(u.RE_METHOD);if(d){let f=d[1]||"public",g=d[2]||"",v=d[3],h=d[4],y=d[5]?d[5].trim():void 0;if(v==="constructor"||v==="if"||v==="for"||v==="while"||v==="switch"||v==="catch"||v==="return"||v==="throw"||v==="new"||v==="class"||v==="function"||v==="get"||v==="set")continue;let b=this.mapVisibility(f),x=this.parseParameters(h),C=g.trim().split(/\s+/).filter(Boolean),m=new B.Range(r,o.indexOf(a),r,o.length),P=this.findBraceEnd(t,r,s);i.push({id:me(),kind:"method",name:v,returnType:y,visibility:b,parameters:x,modifiers:C,isStatic:g.includes("static"),isVirtual:!1,isAbstract:g.includes("abstract"),isOverride:g.includes("override"),range:m,implementationRange:P>r?new B.Range(r,0,P,t[P]?.length??0):void 0});continue}let l=a.match(u.RE_GETTER);if(l){let f=l[1]||"public",g=l[2]||"",v=l[3],h=l[4]?l[4].trim():void 0,y=this.mapVisibility(f),b=g.trim().split(/\s+/).filter(Boolean),x=g.includes("static"),C=new B.Range(r,o.indexOf(a),r,o.length);i.push({id:me(),kind:"property",name:v,type:h,visibility:y,parameters:[],modifiers:b,isStatic:x,isVirtual:!1,isAbstract:g.includes("abstract"),isOverride:!1,range:C});continue}let p=a.match(u.RE_PROPERTY);if(p){let f=p[1]||"public",g=p[2]||"",v=p[3],h=p[4]?p[4].trim():void 0;if(v==="constructor"||v==="function"||v==="class")continue;let y=this.mapVisibility(f),b=g.trim().split(/\s+/).filter(Boolean),x=g.includes("static"),C=g.includes("readonly"),m=new B.Range(r,o.indexOf(a),r,o.length);i.push({id:me(),kind:"property",name:v,type:h,visibility:y,parameters:[],modifiers:C?[...b,"readonly"]:b,isStatic:x,isVirtual:!1,isAbstract:g.includes("abstract"),isOverride:!1,range:m});continue}}return i}findBraceEnd(t,e,s){let n=0,i=!1;for(let r=e;r<s;r++){for(let o of t[r])o==="{"?(n++,i=!0):o==="}"&&n--;if(i&&n<=0)return r}return-1}mapVisibility(t){switch(t){case"public":return"public";case"private":return"private";case"protected":return"protected";default:return"public"}}parseParameters(t){let e=[];if(!t.trim())return e;let s=0,n="";for(let i of t)(i==="("||i==="<"||i==="{")&&s++,(i===")"||i===">"||i==="}")&&s--,i===","&&s===0?(e.push(this.parseSingleParam(n)),n=""):n+=i;return n.trim()&&e.push(this.parseSingleParam(n)),e}parseSingleParam(t){let e=t.trim(),s,n=e,i=n.lastIndexOf("=");i>=0&&!n.substring(i).includes("=>")&&(s=n.substring(i+1).trim(),n=n.substring(0,i).trim());let r=n.lastIndexOf(":");if(r>0){let a=n.substring(0,r).trim(),c=n.substring(r+1).trim();return{name:a,type:c,defaultValue:s}}let o=n.indexOf("?");return o>0?{name:n.substring(0,o).trim(),type:"any",defaultValue:s}:{name:e,type:"any",defaultValue:s}}generateMethod(t,e,s,n){let i="  ",r=this.isJsForClass(s),o=e.parameters.map(v=>{let h=v.name;return!r&&v.type&&v.type!=="any"&&(h+=`: ${v.type}`),v.defaultValue&&(h+=` = ${v.defaultValue}`),h}).join(", "),a=e.visibility==="private"?"private ":e.visibility==="protected"?"protected ":"",c=[];e.isStatic&&c.push("static"),e.isAbstract&&c.push("abstract"),e.isOverride&&c.push("override");for(let v of e.modifiers)!c.includes(v.name)&&v.name!=="readonly"&&c.push(v.name);let d=c.length?c.join(" ")+" ":"",l=!r&&e.returnType?`: ${e.returnType}`:"",p=n!==void 0?`
${n}`:`
${i}${i}// TODO: implement
${i}`,f;e.kind==="constructor"?f=`${i}${a}constructor(${o}) {${p}}
`:f=`${i}${a}${d}${e.name}(${o})${l} {${p}}
`;let g=this.getInsertPositionForClass(s,"method");return{declaration:f,implementation:"",declarationPosition:g,implementationPosition:g}}generateField(t,e,s){let n="  ",i=this.isJsForClass(s),r=e.visibility==="private"?"private ":e.visibility==="protected"?"protected ":"",o=`${n}${r}${e.name}`;!i&&e.type&&(o+=`: ${e.type}`),e.defaultValue&&(o+=` = ${e.defaultValue}`),o+=`;
`;let a=this.getInsertPositionForClass(s,"field");return{declaration:o,implementation:"",declarationPosition:a,implementationPosition:a}}generateProperty(t,e,s){let n="  ",i=this.isJsForClass(s),r=e.visibility==="private"?"private ":e.visibility==="protected"?"protected ":"",o=`${n}${r}${e.name}`;!i&&e.type&&(o+=`: ${e.type}`),o+=`;
`;let a=this.getInsertPositionForClass(s,"property");return{declaration:o,implementation:"",declarationPosition:a,implementationPosition:a}}isJsForClass(t){let e=t.fileUri.fsPath.substring(t.fileUri.fsPath.lastIndexOf(".")).toLowerCase();return e===".js"||e===".jsx"}getInsertPositionForClass(t,e){if(e==="field"){let s=t.members.filter(n=>n.kind==="field");if(s.length>0){let n=s.reduce((i,r)=>i.range.end.line>r.range.end.line?i:r);return new B.Position(n.range.end.line+1,0)}return new B.Position(t.range.start.line+1,0)}return new B.Position(t.range.end.line,0)}getInsertPosition(t,e,s){let n=this.getInsertPositionForClass(e,s);return{declaration:n,implementation:n}}extractMethod(t,e,s,n){let i=t.selection??t.range;if(!i)return[];let r=t.document,o=r.getText(i),a=r.languageId==="javascript"||r.languageId==="javascriptreact",c=s.map(h=>{let y=h.indexOf(":");return y>0?a?h.substring(0,y).trim():h:a?h:`${h}: any`}).join(", "),d=s.map(h=>{let y=h.indexOf(":");return y>0?h.substring(0,y).trim():h}).join(", "),l=!a&&n&&n!=="void"?`: ${n}`:"",f=o.split(/\r?\n/).map(h=>h.length?`  ${h}`:h).join(`
`),g=`
function ${e}(${c})${l} {
${f}
}
`,v=new B.Position(r.lineCount,0);return[new B.TextEdit(i,`${e}(${d})`),new B.TextEdit(new B.Range(v,v),g)]}};var We=class{providers=new Map;extensionToProvider=new Map;constructor(){this.register(new Re),this.register(new De),this.register(new Le),this.register(new Oe),this.register(new Ne),this.register(new Ve),this.register(new Ue),this.register(new Ge)}register(t){this.providers.set(t.languageId,t);for(let e of t.fileExtensions)this.extensionToProvider.set(e,t)}getByLanguageId(t){return this.providers.get(t)}getByFileExtension(t){let e=t.substring(t.lastIndexOf("."));return this.extensionToProvider.get(e)}getByDocument(t){let e=this.providers.get(t.languageId);return e||this.getByFileExtension(t.uri.fsPath)}getAllProviders(){return Array.from(this.providers.values())}getSupportedLanguageIds(){return Array.from(this.providers.keys())}getSupportedExtensions(){return Array.from(this.extensionToProvider.keys())}};var F=L(require("vscode"));var Pt=["published","public","protected","private"];function pt(u){let t=u.trim();if(!t)return{active:!1};try{return{active:!0,regex:new RegExp(t,"i")}}catch{return{active:!0,literal:t.toLowerCase()}}}function $t(u,t){return t.active?t.regex?t.regex.test(u):u.toLowerCase().includes(t.literal??""):!0}function je(u){return Object.values(N).indexOf(u)}function Mt(u,t){return[...u].sort((e,s)=>{if(t==="alpha")return e.name.localeCompare(s.name);if(t==="kind"){let a=je(e.kind),c=je(s.kind);return a!==c?a-c:e.name.localeCompare(s.name)}let n=Pt.indexOf(e.visibility),i=Pt.indexOf(s.visibility);if(n!==i)return n-i;let r=je(e.kind),o=je(s.kind);return r!==o?r-o:e.name.localeCompare(s.name)})}var ce=class extends F.TreeItem{constructor(e,s,n){let i="members"in e;super(e.name,i?F.TreeItemCollapsibleState.Collapsed:F.TreeItemCollapsibleState.None);this.itemData=e;this.parentClass=s;this.provider=n;if(this.isClass()){let r=e;this.iconPath=this.getClassIcon(r),this.contextValue=r.isInterface?"interface":r.isRecord?"record":"class",this.description=r.classType?`${r.classType}${r.parentClass?" \u2192 "+r.parentClass:""}`:r.parentClass?`(${r.parentClass})`:void 0,this.tooltip=this.buildClassTooltip(r),this.command={command:"mmx.navigateToMember",title:"Navigate",arguments:[r.range.start]},this.resourceUri=r.fileUri}else{let r=e;this.iconPath=this.getMemberIcon(r),this.contextValue=r.kind,this.description=this.buildMemberDescription(r),this.tooltip=this.buildMemberTooltip(r);let o=r.implementationRange?.start??r.range.start;this.command={command:"mmx.navigateToMember",title:"Navigate",arguments:[o]}}}isClass(){return"members"in this.itemData}getClassIcon(e){let s=e.classType;return s==="struct"||s==="record"?new F.ThemeIcon("symbol-struct",new F.ThemeColor("symbolIcon.structForeground")):s==="enum"?new F.ThemeIcon("symbol-enum",new F.ThemeColor("symbolIcon.enumForeground")):s==="impl"||s==="impl for"?new F.ThemeIcon("rocket",new F.ThemeColor("symbolIcon.functionForeground")):s==="trait"||e.isInterface?new F.ThemeIcon("symbol-interface",new F.ThemeColor("symbolIcon.interfaceForeground")):s==="abstract class"?new F.ThemeIcon("symbol-class",new F.ThemeColor("symbolIcon.abstractForeground")):new F.ThemeIcon("symbol-class",new F.ThemeColor("symbolIcon.classForeground"))}getMemberIcon(e){switch(e.kind){case"constructor":return new F.ThemeIcon("zap");case"destructor":return new F.ThemeIcon("trash");case"field":return new F.ThemeIcon("symbol-field");case"property":return new F.ThemeIcon("symbol-property");case"method":default:return e.isStatic?new F.ThemeIcon("symbol-method"):e.isAbstract?new F.ThemeIcon("symbol-method"):new F.ThemeIcon("symbol-method")}}buildMemberDescription(e){let s=[];return e.returnType?s.push(`: ${e.returnType}`):e.type&&s.push(`: ${e.type}`),e.parameters.length>0&&s.push(`(${e.parameters.length})`),e.implementationRange&&s.push("impl"),s.join(" ")}buildMemberTooltip(e){let s=[`${e.visibility} ${e.kind}: ${e.name}`];if(e.returnType&&s.push(`Return: ${e.returnType}`),e.type&&s.push(`Type: ${e.type}`),e.parameters.length>0){s.push("Parameters:");for(let n of e.parameters){let i=n.isVar?"var ":n.isOut?"out ":n.isConst?"const ":"";s.push(`  ${i}${n.name}: ${n.type}`)}}return e.modifiers.length>0&&s.push(`Modifiers: ${e.modifiers.join(", ")}`),s.join(`
`)}buildClassTooltip(e){let s=[];return s.push(`${e.isInterface?"interface":e.isRecord?"record":"class"} ${e.name}`),e.parentClass&&s.push(`  inherits: ${e.parentClass}`),e.interfaces.length>0&&s.push(`  implements: ${e.interfaces.join(", ")}`),s.push(`  ${e.members.length} members`),s.join(`
`)}};function ln(u){return typeof u=="object"&&u!==null&&"members"in u}var ze=class{_onDidChangeTreeData=new F.EventEmitter;onDidChangeTreeData=this._onDidChangeTreeData.event;providers=new Map;providersByExtension=new Map;currentDocument;parsedCache=new Map;parsedVersion=new Map;filterPattern="";compiledFilter=pt("");groupBy="visibility";matchesFilter(t){return $t(t,this.compiledFilter)}setFilter(t){this.filterPattern=t,this.compiledFilter=pt(t),this._onDidChangeTreeData.fire(null)}getFilter(){return this.filterPattern}cycleGroupBy(){return this.groupBy=this.groupBy==="visibility"?"kind":this.groupBy==="kind"?"alpha":"visibility",this._onDidChangeTreeData.fire(null),this.groupBy}listAllSymbols(){let t=this.currentDocument??F.window.activeTextEditor?.document;if(!t)return[];let e=this.getParsedDocument(t);if(!e)return[];let s=[];for(let n of e.classes){s.push({label:n.name,description:n.classType??"class",position:n.range.start,kind:"class"});for(let i of n.members){let r=i.implementationRange?.start??i.range.start;s.push({label:i.name,description:`${n.name} \u2022 ${i.kind}`,position:r,kind:i.kind})}}for(let n of e.standaloneProcedures){let i=n.implementationRange?.start??n.range.start;s.push({label:n.name,description:"function",position:i,kind:"function"})}return s}constructor(){F.window.onDidChangeActiveTextEditor(()=>this.onActiveEditorChanged()),F.workspace.onDidChangeTextDocument(t=>this.onDocumentChanged(t))}registerProvider(t){this.providers.set(t.languageId,t);for(let e of t.fileExtensions)this.providersByExtension.set(e,t)}providerForDocument(t){let e=this.providers.get(t.languageId);if(e)return e;let s=t.uri.fsPath.substring(t.uri.fsPath.lastIndexOf("."));return this.providersByExtension.get(s)}onActiveEditorChanged(){let t=F.window.activeTextEditor;t&&this.isSupportedDocument(t.document)&&(this.currentDocument=t.document,this.parsedCache.delete(t.document.uri.toString()),this.parsedVersion.delete(t.document.uri.toString()),this._onDidChangeTreeData.fire(null))}onDocumentChanged(t){t.document===this.currentDocument&&(this.parsedCache.delete(t.document.uri.toString()),this.parsedVersion.delete(t.document.uri.toString()),this._onDidChangeTreeData.fire(null))}isSupportedDocument(t){if(this.providers.has(t.languageId))return!0;let e=t.uri.fsPath.substring(t.uri.fsPath.lastIndexOf("."));return this.providersByExtension.has(e)}refresh(){this.parsedCache.clear(),this.parsedVersion.clear(),this._onDidChangeTreeData.fire(null)}getParsedDocument(t){let e=this.providerForDocument(t);if(!e)return;let s=t.uri.toString();if(this.parsedVersion.get(s)===t.version){let r=this.parsedCache.get(s);if(r)return r}let i=e.parseDocument(t);return this.parsedCache.set(s,i),this.parsedVersion.set(s,t.version),i}getTreeItem(t){return t}getChildren(t){let e=this.currentDocument??F.window.activeTextEditor?.document;if(!e||!this.isSupportedDocument(e))return[];let s=this.providerForDocument(e);if(!s)return[];let n=e.uri.toString(),i=this.parsedCache.get(n);if(i||(i=s.parseDocument(e),this.parsedCache.set(n,i)),!t){let r=i.classes.filter(a=>!this.filterPattern||this.matchesFilter(a.name)?!0:a.members.some(c=>this.matchesFilter(c.name))).map(a=>new ce(a,void 0,s)),o=i.standaloneProcedures.filter(a=>this.matchesFilter(a.name)).map(a=>new ce(a,void 0,s));return[...r,...o]}if(ln(t.itemData)){let r=t.itemData,o=r.members.filter(c=>this.matchesFilter(c.name));return this.sortMembersForDisplay(o).map(c=>new ce(c,r,s))}return[]}sortMembersForDisplay(t){return Mt(t,this.groupBy)}getParent(t){return null}resolveTreeItem(t,e){return t}getSelectedClass(){let t=this.currentDocument??F.window.activeTextEditor?.document;if(!t||!this.isSupportedDocument(t))return;let e=this.providerForDocument(t);if(!e)return;let s=e.parseDocument(t);return s.classes.length>0?s.classes[0]:void 0}getClassByName(t){let e=this.currentDocument??F.window.activeTextEditor?.document;if(!e||!this.isSupportedDocument(e))return;let s=this.providerForDocument(e);return s?s.parseDocument(e).classes.find(i=>i.name===t):void 0}getCurrentProvider(){let t=this.currentDocument??F.window.activeTextEditor?.document;if(t)return this.providerForDocument(t)}getProvider(t){return this.providers.get(t)}};var E=L(require("vscode"));var He=class{providers=new Map;registerProvider(t){this.providers.set(t.languageId,t)}getProvider(t){let e=this.providers.get(t.languageId);if(e)return e;for(let s of this.providers.values()){let n=E.Uri.parse(t.uri.path).path;if(s.fileExtensions.some(i=>n.endsWith(i)))return s}}async addMethod(t,e,s){let n=this.getProvider(t);if(!n)return E.window.showErrorMessage("No language provider for this file type."),!1;let i=E.window.createOutputChannel("MMX Debug");i.appendLine("=== addMethod ==="),i.appendLine("Class: "+e.name),i.appendLine("Method: "+s.name),i.appendLine("Visibility: "+s.visibility),i.appendLine("Params: "+s.parameters.length),i.appendLine("Provider: "+n.displayName);let r=n.getInsertPosition(t,e,"method");i.appendLine("InsertPos decl: line="+r.declaration.line+" char="+r.declaration.character),i.appendLine("InsertPos impl: line="+r.implementation.line+" char="+r.implementation.character);let o=n.generateMethod(e.name,s,e);return i.appendLine("Generated declaration: ["+o.declaration+"]"),i.appendLine("Generated implementation: ["+o.implementation+"]"),i.appendLine("Generated declPos: line="+o.declarationPosition.line+" char="+o.declarationPosition.character),i.appendLine("Generated implPos: line="+o.implementationPosition.line+" char="+o.implementationPosition.character),i.appendLine("Generated pairedFileUri: "+(o.pairedFileUri?o.pairedFileUri.toString():"none")),i.appendLine("Generated pairedFileImpl: ["+(o.pairedFileImplementation||"")+"]"),!o.declaration&&!o.implementation?(i.appendLine("ERROR: Both declaration and implementation are empty!"),i.show(),E.window.showErrorMessage("CE: generateMethod returned empty code"),!1):(i.show(),this.applyGeneratedCode(t,o,e,s.kind))}async addField(t,e,s){let n=this.getProvider(t);if(!n)return E.window.showErrorMessage("No language provider for this file type."),!1;let i=n.generateField(e.name,s,e);return this.applyGeneratedCode(t,i,e,"field")}async addProperty(t,e,s){let n=this.getProvider(t);if(!n)return E.window.showErrorMessage("No language provider for this file type."),!1;let i=n.generateProperty(e.name,s,e);return this.applyGeneratedCode(t,i,e,"property")}async applyGeneratedCode(t,e,s,n){let i=E.window.createOutputChannel("MMX Debug"),r=new E.WorkspaceEdit;if(i.appendLine("--- applyGeneratedCode ---"),i.appendLine("URI: "+t.uri.toString()),e.declaration?(i.appendLine("Inserting declaration at line="+e.declarationPosition.line+" char="+e.declarationPosition.character),r.insert(t.uri,e.declarationPosition,e.declaration)):i.appendLine("WARNING: empty declaration"),e.pairedFileImplementation){let c=this.getProvider(t)?.findPairedFile(t.uri);if(c){let d=await E.workspace.openTextDocument(c),l=new E.Position(d.lineCount,0);i.appendLine("Inserting paired impl in: "+c.fsPath+" at line="+l.line),r.insert(c,l,`
`+e.pairedFileImplementation)}else{let d=new E.Position(t.lineCount,0);i.appendLine("No paired file, inserting impl at end of current file, line="+d.line),r.insert(t.uri,d,`
`+e.pairedFileImplementation)}}else e.implementation?(i.appendLine("Inserting implementation at line="+e.implementationPosition.line+" char="+e.implementationPosition.character),r.insert(t.uri,e.implementationPosition,e.implementation)):i.appendLine("WARNING: no implementation to insert");i.appendLine("Applying workspace edit...");let o=await E.workspace.applyEdit(r);if(i.appendLine("Edit result: "+o),i.show(),o){let a=(e.pairedFileUri,e.implementationPosition),c=e.pairedFileUri??t.uri,d=await E.workspace.openTextDocument(c);(await E.window.showTextDocument(d,{selection:new E.Selection(a,a),preserveFocus:!1})).revealRange(new E.Range(a,a),E.TextEditorRevealType.InCenter)}return o}async deleteMember(t,e,s){console.log("[MMX] [CodeGenerator.deleteMember] member="+s.name+" class="+e.name),console.log("[MMX] [CodeGenerator.deleteMember] member.range: line "+s.range.start.line+"-"+s.range.end.line),console.log("[MMX] [CodeGenerator.deleteMember] implementationRange: "+(s.implementationRange?"line "+s.implementationRange.start.line+"-"+s.implementationRange.end.line:"none"));let n=new E.WorkspaceEdit,i=this.expandToFullMember(t,s.range);console.log("[MMX] [CodeGenerator.deleteMember] fullRange (expanded): line "+i.start.line+"-"+i.end.line);let r=t.getText(i);if(console.log("[MMX] [CodeGenerator.deleteMember] deleting text: ["+r.substring(0,200)+"]"),n.delete(t.uri,i),s.implementationRange)if(s.implementationRange.start.line<=i.end.line&&s.implementationRange.end.line>=i.start.line)console.log("[MMX] [CodeGenerator.deleteMember] implRange overlaps decl range \u2014 skipping (standalone)");else{let d=this.expandToFullMember(t,s.implementationRange);console.log("[MMX] [CodeGenerator.deleteMember] implRange (expanded): line "+d.start.line+"-"+d.end.line),n.delete(t.uri,d)}let o=this.getProvider(t);if(o){let c=o.findPairedFile(t.uri);if(console.log("[MMX] [CodeGenerator.deleteMember] pairedUri: "+(c?.fsPath||"none")),c&&s.implementationRange){let d=await E.workspace.openTextDocument(c),l=this.expandToFullMember(d,s.implementationRange);console.log("[MMX] [CodeGenerator.deleteMember] pairedRange: line "+l.start.line+"-"+l.end.line),n.delete(c,l)}}let a=await E.workspace.applyEdit(n);return console.log("[MMX] [CodeGenerator.deleteMember] applyEdit result: "+a),a}async navigateToMember(t,e,s="declaration"){let n=e.range,i=t.uri;if(s==="implementation"&&e.implementationRange){let c=this.getProvider(t)?.findPairedFile(t.uri);c&&(i=c),n=e.implementationRange}let r=await E.workspace.openTextDocument(i);(await E.window.showTextDocument(r,{selection:new E.Selection(n.start,n.end),preserveFocus:!1})).revealRange(n,E.TextEditorRevealType.InCenter)}async synchronizeDeclImpl(t,e,s){let n=this.getProvider(t);if(!n)return!1;let i=n.synchronizeDeclarationImplementation(t,e,s);if(i.length===0)return E.window.showInformationMessage("Member is already synchronized."),!0;let r=new E.WorkspaceEdit;for(let o of i)r.replace(t.uri,o.range,o.newText);return E.workspace.applyEdit(r)}async synchronizeAllMembers(t,e){let s=this.getProvider(t);if(!s)return 0;let n=0,i=new E.WorkspaceEdit;for(let r of e.members){let o=s.synchronizeDeclarationImplementation(t,e,r);for(let a of o)i.insert(t.uri,a.range.start,a.newText),n++}return n>0&&await E.workspace.applyEdit(i),n}async sortMembers(t,e,s="fieldsFirst"){let n=this.getProvider(t);if(!n)return!1;let i=xt[s];if(!i)return!1;let r=n.sortMembers(e.members,i);if(this.arraysEqual(r,e.members))return E.window.showInformationMessage("Members are already sorted."),!0;let o=new E.WorkspaceEdit,a=[],c=[];for(let d of e.members){a.push(d.range);let l=t.getText(d.range);c.push(l)}for(let d=0;d<a.length;d++){let l=r[d],p=e.members.indexOf(l);p!==d&&o.replace(t.uri,a[d],c[p])}return E.workspace.applyEdit(o)}async extractMethod(t,e,s,n,i){let r=this.getProvider(t);if(!r)return!1;let o=e.start,a={document:t,position:o,range:e,selection:new E.Selection(e.start,e.end)},c=r.extractMethod(a,s,n,i);if(c.length===0)return!1;let d=new E.WorkspaceEdit;for(let l of c)d.replace(t.uri,l.range,l.newText);return E.workspace.applyEdit(d)}expandToFullMember(t,e){let s=e.start.line,n=e.end.line;console.log("[MMX] [expandToFullMember] input: line "+s+"-"+n);let i=t.lineAt(s).text,r=i.indexOf("{",e.start.character);if(console.log("[MMX] [expandToFullMember] startLine text: ["+i+"]"),console.log("[MMX] [expandToFullMember] openBraceIdx on startLine: "+r),r>=0){let a=0,c=!1;for(let d=s;d<t.lineCount;d++){let l=t.lineAt(d).text,p=d===s?r:0;for(let f=p;f<l.length;f++){let g=l[f];g==="{"?(a++,c=!0):g==="}"&&a--}if(c&&a<=0){n=d,console.log("[MMX] [expandToFullMember] braces balanced at line "+d);break}}c&&a>0&&(n=t.lineCount-1,console.log("[MMX] [expandToFullMember] braces NOT balanced, using last line"))}else{let a=s+1<t.lineCount?t.lineAt(s+1).text:"";if(console.log("[MMX] [expandToFullMember] nextLine text: ["+a+"]"),a.trim().startsWith("{")){let c=0,d=!1;for(let l=s+1;l<t.lineCount;l++){let p=t.lineAt(l).text;for(let f=0;f<p.length;f++){let g=p[f];g==="{"?(c++,d=!0):g==="}"&&c--}if(d&&c<=0){n=l,console.log("[MMX] [expandToFullMember] braces balanced (nextLine path) at line "+l);break}}}else console.log("[MMX] [expandToFullMember] no brace found \u2014 using original endLine "+n)}let o=n+1<t.lineCount?new E.Position(n+1,0):t.lineAt(n).range.end;return console.log("[MMX] [expandToFullMember] result: line "+s+"-"+n+" -> range ends at line "+o.line),new E.Range(new E.Position(s,0),o)}arraysEqual(t,e){return t.length!==e.length?!1:t.every((s,n)=>s.id===e[n].id)}};var xe=L(require("vscode"));var pe=class u{constructor(t,e,s,n,i,r,o,a,c){this.initialData=c;this._panel=t,this.provider=n,this.classInfo=i,this.generatorService=r,this.document=s,this.resolveResult=a,this._panel.webview.html=this.getWebviewContent(o),this._panel.webview.onDidReceiveMessage(async d=>{switch(d.command){case"submit":await this.handleSubmit(d.data);break;case"preview":this.handlePreview(d.data);break;case"cancel":this.resolveResult?.(void 0),this._panel.dispose();break;case"addParameter":break}}),this._panel.onDidDispose(()=>{this.resolveResult?.(void 0),u.currentPanel=void 0,this._disposables.forEach(d=>d.dispose())})}static currentPanel;_panel;_disposables=[];provider;classInfo;generatorService;document;resolveResult;static async create(t,e,s,n,i,r="method",o){return u.currentPanel&&u.currentPanel._panel.dispose(),new Promise(a=>{let c=xe.window.createWebviewPanel("mmxMemberEditor",o?`Edit ${r} in ${n.name}`:`Add ${r} to ${n.name}`,xe.ViewColumn.Beside,{enableScripts:!0,retainContextWhenHidden:!1,localResourceRoots:[]}),d=new u(c,t,e,s,n,i,r,a,o);u.currentPanel=d})}async handleSubmit(t){if(!t.name||t.name.trim()===""){xe.window.showWarningMessage("Member name is required.");return}this.resolveResult?.(t),this._panel.dispose()}handlePreview(t){let e=this.provider.getTypeDefaults(),s="";try{if(t.kind==="method"||t.kind==="constructor"||t.kind==="destructor"){let n={kind:t.kind,name:t.name||"unnamed",returnType:t.returnType||void 0,visibility:t.visibility,parameters:t.parameters||[],modifiers:[],isStatic:t.isStatic,isVirtual:t.isVirtual,isAbstract:t.isAbstract,isOverride:t.isOverride,isFinal:!1},i=this.provider.generateMethod(this.classInfo.name,n,this.classInfo);s=i.declaration||i.implementation||"(no preview)"}else if(t.kind==="field"){let n={kind:"field",name:t.name||"unnamed",type:t.type||t.returnType||e.defaultFieldType,visibility:t.visibility},i=this.provider.generateField(this.classInfo.name,n,this.classInfo);s=i.declaration||i.implementation||"(no preview)"}else if(t.kind==="property"){let n={kind:"property",name:t.name||"unnamed",type:t.type||t.returnType||e.defaultPropertyType,visibility:t.visibility,hasGetter:t.hasGetter,hasSetter:t.hasSetter,getterName:t.getterName,setterName:t.setterName,isDefault:!1,isReadOnly:!1},i=this.provider.generateProperty(this.classInfo.name,n,this.classInfo);s=i.declaration||i.implementation||"(no preview)"}}catch(n){s="(preview error: "+(n instanceof Error?n.message:String(n))+")"}this._panel.webview.postMessage({command:"updatePreview",preview:s})}getWebviewContent(t){let e=this.provider.getVisibilityModifiers(),s=this.provider.getDefaultVisibility(),n=this.provider.languageId==="pascal",i=this.provider.getTypeDefaults(),r=t==="constructor"?"Constructor":t==="destructor"?"Destructor":t==="field"?"Field":t==="property"?"Property":"Method",o=t==="method"||t==="property"||t==="field",a=t==="method"||t==="constructor"||t==="destructor",c=t==="method"||t==="constructor"||t==="destructor",d=t==="property",l=this.classInfo.name,p=this.classInfo.parentClass||"",f=this.provider.displayName,g=mn(),v=e.map(P=>'<option value="'+P+'"'+(P===(this.initialData?this.initialData.visibility:s)?" selected":"")+">"+P+"</option>").join(""),h=t==="property"?i.defaultPropertyType:i.defaultReturnType,y=this.initialData?this.initialData.returnType||this.initialData.type||"":t==="property"?i.defaultPropertyType:n?"":i.defaultReturnType,b=t==="field"?"FFieldName":t==="constructor"?"Create":"MethodName",x=i.defaultParamType,C=i.defaultFieldType,m=`<!DOCTYPE html>
`;return m+=`<html lang="en">
<head>
`,m+=`<meta charset="UTF-8">
`,m+=`<meta name="viewport" content="width=device-width, initial-scale=1.0">
`,m+=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-`+g+"'; script-src 'unsafe-inline' 'nonce-"+g+`';">
`,m+="<title>"+(this.initialData?"Edit":"Add")+" "+r+`</title>
`,m+='<style nonce="'+g+`">
`,m+=`* { box-sizing: border-box; margin: 0; padding: 0; }
`,m+=`body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
`,m+=`h2 { margin-bottom: 12px; font-size: 16px; font-weight: 600; }
`,m+=`.form-group { margin-bottom: 12px; }
`,m+=`label { display: block; margin-bottom: 4px; font-weight: 500; }
`,m+=`input, select { width: 100%; padding: 6px 8px; border: 1px solid var(--vscode-input-border, #ccc); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }
`,m+=`input:focus, select:focus { outline: 1px solid var(--vscode-focusBorder, #007fd4); }
`,m+=`.row { display: flex; gap: 12px; }
`,m+=`.row .form-group { flex: 1; }
`,m+=`.checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
`,m+=`.checkbox-group label { display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; }
`,m+=`.checkbox-group input[type="checkbox"] { width: auto; }
`,m+=`.params-section { margin-bottom: 12px; }
`,m+=`.params-section h3 { font-size: 13px; margin-bottom: 8px; font-weight: 600; }
`,m+=`.param-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
`,m+=`.param-row input, .param-row select { flex: 1; padding: 4px 6px; }
`,m+=`.param-row button { flex: 0 0 24px; padding: 2px 6px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; }
`,m+=`.btn-add-param { margin-bottom: 8px; padding: 4px 12px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 3px; font-size: 12px; }
`,m+=`.preview-section { margin-top: 16px; }
`,m+=`.preview-section h3 { font-size: 13px; margin-bottom: 8px; font-weight: 600; }
`,m+=`.preview-box { background: var(--vscode-textCodeBlock-background, #1e1e1e); border: 1px solid var(--vscode-input-border, #ccc); border-radius: 3px; padding: 12px; font-family: var(--vscode-editor-font-family, Consolas, monospace); font-size: var(--vscode-editor-font-size, 13px); white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
`,m+=`.actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
`,m+=`.actions button { padding: 6px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 13px; font-weight: 500; }
`,m+=`.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
`,m+=`.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
`,m+=`.class-info { margin-bottom: 16px; padding: 8px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 3px; color: var(--vscode-descriptionForeground); }
`,m+=`#debug { color: red; font-size: 11px; white-space: pre-wrap; display: none; margin-top: 8px; padding: 8px; border: 1px solid red; }
`,m+=`</style>
`,m+=`</head>
<body>
`,m+="<h2>"+(this.initialData?"Edit":"Add")+" "+r+" in <code>"+l+`</code></h2>
`,m+='<div class="class-info">Class: '+l,p&&(m+=" extends "+p),m+=" | Language: "+f+`</div>
`,m+=`<div class="row">
`,m+='<div class="form-group"><label for="name">Name</label>',m+='<input type="text" id="name" placeholder="'+b+'"'+(this.initialData?' value="'+this.initialData.name+'"':"")+` autofocus></div>
`,o&&(m+='<div class="form-group"><label for="returnType">'+(t==="property"?"Property Type":"Return Type")+"</label>",m+='<input type="text" id="returnType" placeholder="'+h+'" value="'+y+`"></div>
`),m+=`</div>
`,m+='<div class="row"><div class="form-group"><label for="visibility">Visibility</label>',m+='<select id="visibility">'+v+`</select></div></div>
`,c&&(m+=`<div class="checkbox-group">
`,m+='<label><input type="checkbox" id="isStatic"'+(this.initialData?.isStatic?" checked":"")+"> "+(n?"Class":"Static")+`</label>
`,m+='<label><input type="checkbox" id="isVirtual"'+(this.initialData?.isVirtual?" checked":"")+`> Virtual</label>
`,m+='<label><input type="checkbox" id="isAbstract"'+(this.initialData?.isAbstract?" checked":"")+`> Abstract</label>
`,m+='<label><input type="checkbox" id="isOverride"'+(this.initialData?.isOverride?" checked":"")+`> Override</label>
`,m+=`</div>
`),d&&(m+=`<div class="checkbox-group">
`,m+=`<label><input type="checkbox" id="hasGetter" checked> Has Getter</label>
`,m+=`<label><input type="checkbox" id="hasSetter" checked> Has Setter</label>
`,m+=`</div>
`),a&&(m+=`<div class="params-section">
`,m+=`<h3>Parameters</h3>
`,m+=`<div id="paramsContainer"></div>
`,m+=`<button class="btn-add-param" id="btnAddParam">+ Add Parameter</button>
`,m+=`</div>
`),m+=`<div class="preview-section"><h3>Preview</h3><div class="preview-box" id="preview">Fill in the form to see a preview...</div></div>
`,m+=`<div class="actions">
`,m+=`<button class="btn-secondary" id="btnCancel">Cancel</button>
`,m+=`<button class="btn-secondary" id="btnPreview">Preview</button>
`,m+='<button class="btn-primary" id="btnCreate">'+(this.initialData?"Save":"Create")+`</button>
`,m+=`</div>
`,m+=`<div id="debug"></div>
`,m+='<script nonce="'+g+`">
`,m+=`(function() {
`,m+=`  try {
`,m+=`    var vscodeApi = acquireVsCodeApi();
`,m+=`    var paramCount = 0;
`,m+='    var memberKindVal = "'+t+`";
`,m+="    var isPascalVal = "+(n?"true":"false")+`;
`,m+=`    var previewTimer = null;
`,m+=`
`,m+=`    function dbg(msg) {
`,m+=`      var el = document.getElementById("debug");
`,m+=`      if (el) { el.style.display = "block"; el.textContent += msg + "\\n"; }
`,m+=`    }
`,m+=`
`,m+=`    function addParameter() {
`,m+=`      try {
`,m+=`        paramCount++;
`,m+=`        var container = document.getElementById("paramsContainer");
`,m+=`        if (!container) { dbg("ERROR: paramsContainer not found"); return; }
`,m+=`        var row = document.createElement("div");
`,m+=`        row.className = "param-row";
`,m+=`        row.setAttribute("data-pid", "p" + paramCount);
`,m+=`
`,m+=`        if (isPascalVal) {
`,m+=`          var dirSel = document.createElement("select");
`,m+=`          dirSel.className = "param-dir";
`,m+=`          dirSel.style.flex = "0.5";
`,m+=`          var dirs = ["", "const", "var", "out"];
`,m+=`          for (var d = 0; d < dirs.length; d++) {
`,m+=`            var opt = document.createElement("option");
`,m+=`            opt.value = dirs[d];
`,m+=`            opt.textContent = dirs[d] || "[in]";
`,m+=`            dirSel.appendChild(opt);
`,m+=`          }
`,m+=`          row.appendChild(dirSel);
`,m+=`        }
`,m+=`
`,m+=`        var nameInput = document.createElement("input");
`,m+=`        nameInput.className = "param-name";
`,m+=`        nameInput.type = "text";
`,m+=`        nameInput.placeholder = "param" + paramCount;
`,m+=`        row.appendChild(nameInput);
`,m+=`
`,m+=`        var typeInput = document.createElement("input");
`,m+=`        typeInput.className = "param-type";
`,m+=`        typeInput.type = "text";
`,m+='        typeInput.placeholder = isPascalVal ? "Integer" : "'+x+`";
`,m+=`        row.appendChild(typeInput);
`,m+=`
`,m+=`        var removeBtn = document.createElement("button");
`,m+=`        removeBtn.textContent = "x";
`,m+=`        removeBtn.setAttribute("data-pid", "p" + paramCount);
`,m+=`        removeBtn.addEventListener("click", function() { row.remove(); schedulePreview(); });
`,m+=`        row.appendChild(removeBtn);
`,m+=`
`,m+=`        nameInput.addEventListener("input", schedulePreview);
`,m+=`        typeInput.addEventListener("input", schedulePreview);
`,m+=`
`,m+=`        container.appendChild(row);
`,m+=`        schedulePreview();
`,m+=`      } catch(e) { dbg("addParameter ERROR: " + e.message); }
`,m+=`    }
`,m+=`
`,m+=`    function schedulePreview() {
`,m+=`      if (previewTimer) clearTimeout(previewTimer);
`,m+=`      previewTimer = setTimeout(updatePreview, 300);
`,m+=`    }
`,m+=`
`,m+=`    function getFormData() {
`,m+=`      var nameEl = document.getElementById("name");
`,m+=`      var retEl = document.getElementById("returnType");
`,m+=`      var visEl = document.getElementById("visibility");
`,m+=`      var staticEl = document.getElementById("isStatic");
`,m+=`      var virtualEl = document.getElementById("isVirtual");
`,m+=`      var abstractEl = document.getElementById("isAbstract");
`,m+=`      var overrideEl = document.getElementById("isOverride");
`,m+=`      var getterEl = document.getElementById("hasGetter");
`,m+=`      var setterEl = document.getElementById("hasSetter");
`,m+=`
`,m+=`      var data = {
`,m+=`        kind: memberKindVal,
`,m+=`        name: nameEl ? nameEl.value : "",
`,m+=`        returnType: retEl ? retEl.value : "",
`,m+=`        type: retEl ? retEl.value : "",
`,m+=`        visibility: visEl ? visEl.value : "private",
`,m+=`        parameters: [],
`,m+=`        isStatic: staticEl ? staticEl.checked : false,
`,m+=`        isVirtual: virtualEl ? virtualEl.checked : false,
`,m+=`        isAbstract: abstractEl ? abstractEl.checked : false,
`,m+=`        isOverride: overrideEl ? overrideEl.checked : false,
`,m+=`        hasGetter: getterEl ? getterEl.checked : false,
`,m+=`        hasSetter: setterEl ? setterEl.checked : false
`,m+=`      };
`,m+=`
`,m+=`      var rows = document.querySelectorAll(".param-row");
`,m+=`      for (var i = 0; i < rows.length; i++) {
`,m+=`        var r = rows[i];
`,m+=`        var nEl = r.querySelector(".param-name");
`,m+=`        var tEl = r.querySelector(".param-type");
`,m+=`        var dEl = r.querySelector(".param-dir");
`,m+=`        if (nEl && tEl && nEl.value) {
`,m+=`          data.parameters.push({
`,m+=`            name: nEl.value,
`,m+='            type: tEl.value || (isPascalVal ? "Integer" : "'+x+`"),
`,m+=`            isConst: dEl ? dEl.value === "const" : false,
`,m+=`            isVar: dEl ? dEl.value === "var" : false,
`,m+=`            isOut: dEl ? dEl.value === "out" : false
`,m+=`          });
`,m+=`        }
`,m+=`      }
`,m+=`      return data;
`,m+=`    }
`,m+=`
`,m+=`    function updatePreview() {
`,m+=`      try {
`,m+=`        vscodeApi.postMessage({ command: "preview", data: getFormData() });
`,m+=`      } catch(e) { dbg("updatePreview ERROR: " + e.message); }
`,m+=`    }
`,m+=`
`,m+=`    function submit() {
`,m+=`      try {
`,m+=`        dbg("submit clicked");
`,m+=`        vscodeApi.postMessage({ command: "submit", data: getFormData() });
`,m+=`      } catch(e) { dbg("submit ERROR: " + e.message); }
`,m+=`    }
`,m+=`
`,m+=`    function cancel() {
`,m+=`      vscodeApi.postMessage({ command: "cancel" });
`,m+=`    }
`,m+=`
`,m+=`    function setupListeners() {
`,m+=`      var el;
`,m+=`      el = document.getElementById("btnAddParam");
`,m+=`      if (el) { el.addEventListener("click", function() { dbg("addParam clicked"); addParameter(); }); }
`,m+=`
`,m+=`      el = document.getElementById("btnCancel");
`,m+=`      if (el) { el.addEventListener("click", cancel); }
`,m+=`
`,m+=`      el = document.getElementById("btnPreview");
`,m+=`      if (el) { el.addEventListener("click", updatePreview); }
`,m+=`
`,m+=`      el = document.getElementById("btnCreate");
`,m+=`      if (el) { el.addEventListener("click", function() { dbg("create clicked"); submit(); }); }
`,m+=`
`,m+=`      var allInputs = document.querySelectorAll("input, select");
`,m+=`      for (var i = 0; i < allInputs.length; i++) {
`,m+=`        allInputs[i].addEventListener("input", schedulePreview);
`,m+=`        allInputs[i].addEventListener("change", schedulePreview);
`,m+=`      }
`,m+=`
`,m+=`      window.addEventListener("message", function(event) {
`,m+=`        var msg = event.data;
`,m+=`        if (msg && msg.command === "updatePreview") {
`,m+=`          var prev = document.getElementById("preview");
`,m+=`          if (prev) { prev.textContent = msg.preview || "No preview available"; }
`,m+=`        }
`,m+=`      });
`,m+=`
`,m+=`      updatePreview();
`,m+=`      dbg("init OK");
`,m+=`    }
`,m+=`
`,m+="    var initParamsData = "+JSON.stringify(this.initialData?.parameters||[])+`;
`,m+=`    function initParams() {
`,m+=`      var pc = document.getElementById("paramsContainer");
`,m+=`      for (var ip = 0; ip < initParamsData.length; ip++) {
`,m+=`        addParameter();
`,m+=`        var rows = pc.querySelectorAll(".param-row");
`,m+=`        var lastRow = rows[rows.length - 1];
`,m+=`        if (lastRow) {
`,m+=`          var nEl = lastRow.querySelector(".param-name");
`,m+=`          var tEl = lastRow.querySelector(".param-type");
`,m+=`          var dEl = lastRow.querySelector(".param-dir");
`,m+=`          if (nEl) { nEl.value = initParamsData[ip].name || ""; }
`,m+=`          if (tEl) { tEl.value = initParamsData[ip].type || ""; }
`,m+=`          if (dEl) {
`,m+=`            if (initParamsData[ip].isVar) { dEl.value = "var"; }
`,m+=`            else if (initParamsData[ip].isOut) { dEl.value = "out"; }
`,m+=`            else if (initParamsData[ip].isConst) { dEl.value = "const"; }
`,m+=`          }
`,m+=`        }
`,m+=`      }
`,m+=`      if (initParamsData.length > 0) { schedulePreview(); }
`,m+=`    }
`,m+=`
`,m+=`    if (document.readyState === "loading") {
`,m+=`      document.addEventListener("DOMContentLoaded", function() { setupListeners(); initParams(); });
`,m+=`    } else {
`,m+=`      setupListeners();
`,m+=`      initParams();
`,m+=`    }
`,m+=`
`,m+=`  } catch(e) {
`,m+=`    document.body.innerHTML += "<div style=\\"color:red;padding:8px\\">FATAL: " + e.message + "</div>";
`,m+=`  }
`,m+=`})();
`,m+=`</script>
`,m+=`</body>
</html>`,m}};function mn(){let u="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<32;e++)u+=t.charAt(Math.floor(Math.random()*t.length));return u}var U=L(require("vscode"));var R=L(require("vscode"));var oe=L(require("vscode")),It="mmx-preview",Ce=new Map,Ke;function Et(u){Ke&&Ke.dispose();let t=new class{provideTextDocumentContent(e){let s=e.query?new URLSearchParams(e.query).get("id"):null;return s?Ce.get(s)??"":Ce.get(e.path)??""}};Ke=oe.workspace.registerTextDocumentContentProvider(It,t),u.subscriptions.push(Ke)}function pn(){return oe.workspace.getConfiguration("mmx").get("previewEdits",!0)}function Tt(u,t){let e=0,s=0;for(;s<t.line&&e<u.length;){let n=u.indexOf(`
`,e);if(n<0)return u.length;e=n+1,s++}return e+t.character}function un(u,t,e){let s=Tt(u,t.start),n=Tt(u,t.end);return u.slice(0,s)+e+u.slice(n)}function fn(u,t){let e=[...t].sort((n,i)=>n.range.start.line!==i.range.start.line?i.range.start.line-n.range.start.line:i.range.start.character-n.range.start.character),s=u;for(let n of e)s=un(s,n.range,n.newText);return s}async function St(u,t){if(!pn()||u.length===0)return!0;let e=[],s=[];try{for(let r of u){let o=fn(r.originalText,r.edits);if(o===r.originalText)continue;let a=`${Date.now()}_${Math.random().toString(36).slice(2)}`;Ce.set(a,o);let c=oe.Uri.parse(`${It}:${r.uri.fsPath}?id=${a}`);try{await oe.commands.executeCommand("vscode.diff",r.uri,c,`MMX Preview \u2014 ${t} (${r.label})`),e.push(r.label),s.push(a)}catch{Ce.delete(a)}}let n=e.length>0?e.join(", "):"the target file";return await oe.window.showWarningMessage(`Apply these changes to ${n}?`,{modal:!1},"Apply","Cancel")==="Apply"}finally{for(let n of s)Ce.delete(n)}}var qe;function ut(){return qe||(qe=R.window.createOutputChannel("Code Explorer")),qe}function T(u){ut().appendLine(u),console.log("[MMX] "+u)}function kt(u){qe=u}async function ee(u,t,e){T("[applyGeneratedCode] doc="+u.fileName),T("[applyGeneratedCode] declaration="+(e.declaration?"yes":"no")+" at line "+e.declarationPosition.line),T("[applyGeneratedCode] implementation="+(e.implementation?"yes":"no")+" at line "+e.implementationPosition.line),T("[applyGeneratedCode] pairedFileImplementation="+(e.pairedFileImplementation?"yes":"no"));let s=new R.WorkspaceEdit,n=new Map,i=(l,p,f)=>{let g=new R.Range(p,p),v=n.get(l)??[];v.push({uri:l,range:g,newText:f}),n.set(l,v)},r,o=new Map;if(o.set(u.uri.toString(),u.getText()),e.declaration&&(s.insert(u.uri,e.declarationPosition,e.declaration),i(u.uri,e.declarationPosition,e.declaration),T("[applyGeneratedCode] queued declaration insert at line "+e.declarationPosition.line)),e.pairedFileImplementation)if(r=t.findPairedFile(u.uri),r){let l=await R.workspace.openTextDocument(r);o.set(r.toString(),l.getText());let p=new R.Position(l.lineCount,0);s.insert(r,p,`
`+e.pairedFileImplementation),i(r,p,`
`+e.pairedFileImplementation),T("[applyGeneratedCode] queued paired impl in "+r.fsPath)}else{let l=new R.Position(u.lineCount,0);s.insert(u.uri,l,`
`+e.pairedFileImplementation),i(u.uri,l,`
`+e.pairedFileImplementation),T("[applyGeneratedCode] no paired file \u2014 queued impl at end of doc")}else e.implementation&&(s.insert(u.uri,e.implementationPosition,e.implementation),i(u.uri,e.implementationPosition,e.implementation),T("[applyGeneratedCode] queued implementation insert at line "+e.implementationPosition.line));let a=[];for(let[l,p]of n){let f=l.toString(),g=o.get(f);g===void 0&&(g=(await R.workspace.openTextDocument(l)).getText(),o.set(f,g)),a.push({label:R.workspace.asRelativePath(l),uri:l,originalText:g,edits:p})}if(!await St(a,"Apply generated code"))return T("[applyGeneratedCode] user cancelled in Safe Preview \u2014 no changes applied"),!1;let d=await R.workspace.applyEdit(s);return T("[applyGeneratedCode] applyEdit result: "+d),d}async function Xe(u,t,e,s,n,i,r){T("[editMember] opening editor for: "+n.name+" kind="+n.kind+" in class "+s.name),T("[editMember] member.range: line "+n.range.start.line+"-"+n.range.end.line);let o=await pe.create(u,t,e,s,i,n.kind,n);if(!o)return T("[editMember] MemberEditorPanel.create returned null \u2014 user cancelled or error"),!1;T("[editMember] editor result: name="+o.name+" kind="+o.kind);let a=n.range.start.line;T("[editMember] originalInsertLine="+a);let c=n.implementationRange?bn(t.getText(n.implementationRange)):void 0;if(c&&T("[editMember] captured existing implementation body ("+c.length+" chars) \u2014 will be preserved"),T("[editMember] deleting old member..."),s.classType==="standalone"&&n.implementationRange){let p=n.implementationRange,f=t.getText(p),g={kind:o.kind,name:o.name,returnType:o.returnType||void 0,visibility:o.visibility,parameters:o.parameters||[],modifiers:[],isStatic:!!o.isStatic,isVirtual:!!o.isVirtual,isAbstract:!!o.isAbstract,isOverride:!!o.isOverride,isFinal:!1},v=e.rewriteStandaloneFunction(f,g);if(v!==void 0){T("[editMember] standalone rewrite in place: "+g.name);let h=new R.WorkspaceEdit;h.replace(t.uri,p,v);let y=await R.workspace.applyEdit(h);return T("[editMember] standalone rewrite result: "+y),y&&(r.refresh(),R.window.showInformationMessage('CE: Updated "'+o.name+'"')),y}T("[editMember] provider has no standalone rewrite \u2014 falling back to legacy path")}await i.deleteMember(t,s,n);let d;if(s.classType==="standalone")T("[editMember] standalone procedure \u2014 using original ClassInfo"),d=s;else{let p=e.parseDocument(t);T("[editMember] reparsed: "+p.classes.length+" classes");let f=p.classes.find(g=>g.name===s.name);if(!f)return T("[editMember] FAIL: class "+s.name+" not found after reparse"),r.refresh(),!1;d=f,T("[editMember] found updated class: "+d.name+" with "+d.members.length+" members")}let l=!1;if(o.kind==="method"||o.kind==="constructor"||o.kind==="destructor"){let p={kind:o.kind,name:o.name,returnType:o.returnType||void 0,visibility:o.visibility,parameters:o.parameters||[],modifiers:[],isStatic:o.isStatic,isVirtual:o.isVirtual,isAbstract:o.isAbstract,isOverride:o.isOverride,isFinal:!1};T("[editMember] generating method: "+p.name+" returnType="+p.returnType+" params="+p.parameters.length);let f=e.generateMethod(d.name,p,d,c);f.declarationPosition=new R.Position(a,0),T("[editMember] declarationPosition set to line "+a),l=await ee(t,e,f)}else if(o.kind==="field"){let p={kind:"field",name:o.name,type:o.type||o.returnType||"int",visibility:o.visibility};T("[editMember] generating field: "+p.name+" type="+p.type);let f=e.generateField(d.name,p,d);f.declarationPosition=new R.Position(a,0),l=await ee(t,e,f)}else if(o.kind==="property"){let p={kind:"property",name:o.name,type:o.type||o.returnType||"string",visibility:o.visibility,hasGetter:o.hasGetter,hasSetter:o.hasSetter,getterName:o.getterName,setterName:o.setterName,isDefault:!1,isReadOnly:!1};T("[editMember] generating property: "+p.name+" type="+p.type);let f=e.generateProperty(d.name,p,d);f.declarationPosition=new R.Position(a,0),l=await ee(t,e,f)}return T("[editMember] final success: "+l),l&&(r.refresh(),R.window.showInformationMessage('CE: Updated "'+o.name+'" in '+d.name)),l}async function gn(u,t,e){let s=new Map,n=t.parseDocument(u);for(let l of e){let p=n.classes.find(f=>f.name===l);p&&s.set(l,p)}let i=e.filter(l=>!s.has(l));if(i.length===0)return Array.from(s,([l,p])=>({name:l,info:p}));let r=new Set(i),o=t.fileExtensions.map(l=>l.replace(/^\./,""));if(o.length===0)return Array.from(s,([l,p])=>({name:l,info:p}));let a="**/*{"+o.join(",")+"}",c=await R.workspace.findFiles(a,"**/node_modules/**"),d=u.uri.toString();for(let l of c){if(r.size===0)break;if(l.toString()===d)continue;let p=await R.workspace.openTextDocument(l),f=t.parseDocument(p);for(let g of f.classes)if(r.has(g.name)&&(s.set(g.name,g),r.delete(g.name),r.size===0))break}return Array.from(s,([l,p])=>({name:l,info:p}))}function vn(u){return{kind:u.kind==="constructor"?"constructor":"method",name:u.name,returnType:u.returnType||void 0,visibility:u.visibility,parameters:u.parameters,modifiers:[],isStatic:u.isStatic,isVirtual:!1,isAbstract:!1,isOverride:!1,isFinal:!1}}function hn(u){let t=u.parameters.map(s=>`${s.name}: ${s.type}`).join(", "),e=u.returnType?`: ${u.returnType}`:"";return`${u.name}(${t})${e}`}async function Rt(u,t,e,s){let n=[];for(let h of e.interfaces)n.includes(h)||n.push(h);if(e.parentClass&&!n.includes(e.parentClass)&&n.push(e.parentClass),T("[implementInterface] class="+e.name+" sources=["+n.join(", ")+"]"),n.length===0)return R.window.showInformationMessage('CE: "'+e.name+'" has no interface or parent class to implement.'),!1;let i=await gn(u,t,n),r=i.map(h=>h.name),o=n.filter(h=>!r.includes(h));if(o.length>0&&T("[implementInterface] not found in workspace: "+o.join(", ")),i.length===0)return R.window.showInformationMessage("CE: Could not find definitions for "+n.join(", ")+" in the workspace."),!1;let a=new Set(e.members.map(h=>h.name)),c=new Set,d=[];for(let h of i)for(let y of h.info.members)y.kind!=="method"&&y.kind!=="constructor"||a.has(y.name)||y.isStatic||c.has(y.name)||(c.add(y.name),d.push({label:hn(y),description:h.info.isInterface?"interface "+h.name:"parent "+h.name,detail:y.documentation,picked:!0,method:y}));if(d.length===0)return R.window.showInformationMessage('CE: "'+e.name+'" already implements all known methods.'),!1;let l=await R.window.showQuickPick(d,{canPickMany:!0,title:"CE: Implement Interface / Override Methods",placeHolder:"Select methods to generate stubs for in "+e.name});if(!l||l.length===0)return!1;let p=[];for(let h of l){let y=vn(h.method),b=t.generateMethod(e.name,y,e);b.declaration&&p.push(b.declaration.replace(/\n$/,""))}if(p.length===0)return R.window.showInformationMessage("CE: No stubs were generated for the selected methods."),!1;let f=t.getInsertPosition(u,e,"method").declaration,g={declaration:`
`+p.join(`
`)+`
`,implementation:"",declarationPosition:f,implementationPosition:f},v=await ee(u,t,g);return T("[implementInterface] success: "+v),v&&(s.refresh(),R.window.showInformationMessage("CE: Implemented "+l.length+" method(s) in "+e.name)),v}async function Qe(u,t,e,s,n){T("[deleteMember] asking confirmation for: "+e.name),await new Promise(o=>setTimeout(o,100));let i=await R.window.showWarningMessage(`Delete member "${e.name}"?`,{modal:!0},"Delete");if(T("[deleteMember] dialog returned: "+JSON.stringify(i)),i!=="Delete")return T("[deleteMember] user cancelled"),ut().show(),!1;T("[deleteMember] confirmed \u2014 calling codeGenerator.deleteMember"),T("[deleteMember] member.range: line "+e.range.start.line+"-"+e.range.end.line);let r=await s.deleteMember(u,t,e);return T("[deleteMember] codeGenerator.deleteMember returned: "+r),r&&(n.refresh(),R.window.showInformationMessage(`Deleted member: ${e.name}`)),r}async function Je(u,t,e,s,n){T("[renameMember] member="+e.name+" class="+t.name),T("[renameMember] member.range: line "+e.range.start.line+" char "+e.range.start.character),T("[renameMember] about to show InputBox..."),await new Promise(f=>setTimeout(f,100));let i=await R.window.showInputBox({title:"CE: Rename Member",prompt:`Rename "${e.name}" to:`,value:e.name,ignoreFocusOut:!0});if(T("[renameMember] InputBox returned: "+JSON.stringify(i)),!i||i===e.name)return T("[renameMember] cancelled or same name: "+i),ut().show(),!1;T("[renameMember] new name: "+i);let r=new R.WorkspaceEdit,o=e.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),a=new RegExp("\\b"+o+"\\b","g"),c=t.classType==="standalone",d=c?[e.range,...e.implementationRange?[e.implementationRange]:[]]:[t.range],l=0;for(let f of d){let g=f.start.line,v=f.end.line;for(let h=g;h<=v&&h<u.lineCount;h++){let y=u.lineAt(h).text,b=0,x;for(;(x=a.exec(y))!==null;){if(x.index<b){a.lastIndex=b;continue}let C=new R.Range(h,x.index,h,x.index+e.name.length);r.replace(u.uri,C,i),l++,b=x.index+e.name.length,a.lastIndex=b}a.lastIndex=0}}if(T("[renameMember] replaced "+l+" occurrences in "+(c?"standalone procedure":"class "+t.name)),l===0)return T("[renameMember] FAIL: no occurrences found"),R.window.showWarningMessage(`Could not locate "${e.name}" in the class body. Rename aborted.`),!1;if(s){let f=s.findPairedFile(u.uri);if(T("[renameMember] paired file: "+(f?.fsPath||"none")),f){let g=await R.workspace.openTextDocument(f),v=g.getText(),h=t.name+"::"+e.name,y=v.indexOf(h),b=0;for(;y>=0;){let x=g.positionAt(y+t.name.length+2),C=g.positionAt(y+h.length);r.replace(f,new R.Range(x,C),i),b++,y=v.indexOf(h,y+1)}T("[renameMember] replaced "+b+" occurrences in paired file")}}let p=await R.workspace.applyEdit(r);return T("[renameMember] applyEdit result: "+p),p&&(n.refresh(),R.window.showInformationMessage(`Renamed "${e.name}" to "${i}"`)),p}function bn(u){let t=u.match(/(?:function|procedure|constructor|destructor)\b[^\n]*/);if(t){let n=u.indexOf(`
`,t.index)+1,i=u.lastIndexOf("end;");if(i>n)return u.substring(n,i)}let e=u.indexOf("{");if(e>=0){let n=u.indexOf(`
`,e)+1,i=u.lastIndexOf("}");if(i>n)return u.substring(n,i)}let s=u.match(/^\s*def\s+\w+\s*\([^)]*\)\s*(?:->\s*[^\n]+)?:/m);if(s){let n=u.indexOf(`
`,s.index)+1;if(n>0&&n<u.length)return u.substring(n)}}var Pe=class{constructor(t,e,s,n,i){this._extensionUri=t;this._providerRegistry=e;this._codeExplorer=s;this._codeGenerator=n;this._extensionContext=i;i.subscriptions.push(U.window.onDidChangeTextEditorSelection(r=>{this.scheduleCursorUpdate(r.textEditor)}),U.window.onDidChangeActiveTextEditor(r=>{r&&this.scheduleCursorUpdate(r)}),U.workspace.onDidChangeTextDocument(()=>{let r=U.window.activeTextEditor;r&&this.scheduleCursorUpdate(r)}))}static viewType="mmxViewer";_view;_state={member:void 0,classInfo:void 0,provider:void 0};_stateKey="";_debounceTimer;resolveWebviewView(t,e,s){this._view=t,t.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri]},t.webview.html=this.getEmptyHtml(),t.webview.onDidReceiveMessage(async i=>{switch(i.command){case"edit":await this.handleEdit();break;case"delete":await this.handleDelete();break;case"rename":await this.handleRename();break}});let n=U.window.activeTextEditor;n&&this.onCursorChanged(n)}scheduleCursorUpdate(t){this._debounceTimer&&clearTimeout(this._debounceTimer),this._debounceTimer=setTimeout(()=>this.onCursorChanged(t),75)}onCursorChanged(t){let e=t.document,s=this._providerRegistry.getByDocument(e);if(!s){this.clearView();return}let n=t.selection.active,i=this._codeExplorer.getParsedDocument(e);if(!i){this.clearView();return}let r,o;for(let c of i.classes){for(let d of c.members)if(d.range.contains(n)||d.implementationRange?.contains(n)){r=d,o=c;break}if(r)break}if(!r){for(let c of i.standaloneProcedures)if(c.range.contains(n)||c.implementationRange?.contains(n)){r=c,o=void 0;break}}!r&&!o&&(o=i.classes.find(c=>c.range.contains(n)));let a=(r?r.id:"")+":"+(o?o.id:"");a===this._stateKey&&this._view||(this._stateKey=a,this._state.member=r,this._state.classInfo=o,this._state.provider=s,this.updateView())}updateView(){this._view&&(this._view.webview.html=this.getHtml())}clearView(){this._stateKey="",this._state={member:void 0,classInfo:void 0,provider:void 0},this._view&&(this._view.webview.html=this.getEmptyHtml())}ensureState(){if(this._state.member&&this._state.provider){let r=this._state.classInfo||this.synthClassForStandalone(this._state.member);return{member:this._state.member,classInfo:r,provider:this._state.provider}}let t=U.window.activeTextEditor;if(!t)return;let e=t.document,s=this._providerRegistry.getByDocument(e);if(!s)return;let n=t.selection.active,i=this._codeExplorer.getParsedDocument(e);if(i){for(let r of i.classes)for(let o of r.members)if(o.range.contains(n)||o.implementationRange?.contains(n))return this._state.member=o,this._state.classInfo=r,this._state.provider=s,{member:o,classInfo:r,provider:s};for(let r of i.standaloneProcedures)if(r.range.contains(n)||r.implementationRange?.contains(n)){let o=this.synthClassForStandalone(r);return this._state.member=r,this._state.classInfo=void 0,this._state.provider=s,{member:r,classInfo:o,provider:s}}}}synthClassForStandalone(t){let e=U.window.activeTextEditor;return{id:"standalone_"+t.id,name:"",fullName:"",classType:"standalone",parentClass:void 0,interfaces:[],members:[t],range:t.range,isInterface:!1,isRecord:!1,isSealed:!1,fileUri:e?e.document.uri:t.range}}async handleEdit(){let t=this.ensureState();if(!t)return;let{member:e,classInfo:s,provider:n}=t,i=U.window.activeTextEditor?.document;i&&await Xe(this._extensionContext,i,n,s,e,this._codeGenerator,this._codeExplorer)}async handleDelete(){let t=this.ensureState();if(!t)return;let{member:e,classInfo:s}=t,n=U.window.activeTextEditor?.document;if(!n)return;await Qe(n,s,e,this._codeGenerator,this._codeExplorer)&&this.clearView()}async handleRename(){let t=this.ensureState();if(!t)return;let{member:e,classInfo:s,provider:n}=t,i=U.window.activeTextEditor?.document;i&&await Je(i,s,e,n,this._codeExplorer)}async handleNavigate(){let{member:t}=this._state;if(!t)return;let e=U.window.activeTextEditor;e&&(e.selection=new U.Selection(t.range.start,t.range.start),e.revealRange(new U.Range(t.range.start,t.range.start),U.TextEditorRevealType.InCenter))}getEmptyHtml(){let t=Ft();return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${t}'; script-src 'unsafe-inline' 'nonce-${t}';">
<style nonce="${t}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.empty { color: var(--vscode-descriptionForeground); text-align: center; padding: 20px 8px; }
.empty .icon { font-size: 28px; margin-bottom: 8px; opacity: 0.5; }
.empty p { font-size: 12px; line-height: 1.5; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.shortcuts { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.shortcut-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; align-items: center; }
.sc-action { font-size: 12px; color: var(--vscode-foreground); }
kbd { display: inline-block; padding: 1px 5px; font-size: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); line-height: 1.4; color: var(--vscode-descriptionForeground); background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.35)); border-radius: 3px; }
</style>
</head>
<body>
<div class="empty">
<div class="icon">$(symbol-misc)</div>
<p>Place cursor on a class member in the editor to view its details</p>
</div>
</body>
</html>`}getHtml(){let t=Ft(),{member:e,classInfo:s}=this._state;if(!s&&!e)return this.getEmptyHtml();let n=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${t}'; script-src 'unsafe-inline' 'nonce-${t}';">
<style nonce="${t}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 12px; }
.section { margin-bottom: 12px; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin-bottom: 6px; letter-spacing: 0.5px; }
.class-header { display: flex; align-items: center; gap: 6px; padding: 8px; background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.1)); border-radius: 4px; margin-bottom: 12px; }
.class-header .name { font-weight: 600; font-size: 14px; }
.class-header .type { font-size: 11px; color: var(--vscode-descriptionForeground); }
.member-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.member-header .name { font-size: 15px; font-weight: 700; }
.member-header .kind-badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); text-transform: uppercase; letter-spacing: 0.5px; }
.prop-row { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 12px; align-items: baseline; }
.prop-item { display: inline-flex; align-items: baseline; gap: 4px; }
.prop-label { font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: 500; }
.prop-value { font-size: 13px; font-family: var(--vscode-editor-font-family, Consolas, monospace); }
.params-list { list-style: none; padding-left: 12px; }
.params-list li { font-family: var(--vscode-editor-font-family, Consolas, monospace); font-size: 12px; padding: 1px 0; }
.params-list li .dir { color: var(--vscode-symbolIcon-keywordForeground, #569cd6); }
.params-list li .pname { color: var(--vscode-symbolIcon-variableForeground, #9cdcfe); }
.params-list li .ptype { color: var(--vscode-symbolIcon-typeParameterForeground, #4ec9b0); }
.actions { display: flex; gap: 6px; flex-wrap: nowrap; margin-top: 12px; }
.btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; font-family: inherit; }
kbd { display: inline-block; padding: 1px 5px; margin-left: 4px; font-size: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); line-height: 1.4; color: var(--vscode-descriptionForeground); background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12)); border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.35)); border-radius: 3px; vertical-align: middle; }
.btn-edit { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.btn-delete { background: #d32f2f; color: #fff; }
.btn-rename { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn-nav { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn:hover { opacity: 0.9; }
.divider { height: 1px; background: var(--vscode-input-border, rgba(128,128,128,0.3)); margin: 10px 0; }
.empty-section { color: var(--vscode-descriptionForeground); font-style: italic; }
.shortcuts { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); }
.shortcut-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; align-items: center; }
.sc-action { font-size: 12px; color: var(--vscode-foreground); }
</style>
</head>
<body>`;if(s?n+=`<div class="class-header">
<div class="name">${de(s.name)}</div>
<div class="type">${s.isInterface?"interface":s.isRecord?"record":s.classType||"class"}${s.parentClass?" \u2192 "+de(s.parentClass):""}</div>
</div>`:n+=`<div class="class-header">
<div class="name">File-level</div>
<div class="type">standalone routine</div>
</div>`,e){let i=e.kind==="constructor"?"Constructor":e.kind==="destructor"?"Destructor":e.kind.charAt(0).toUpperCase()+e.kind.slice(1);if(n+=`<div class="member-header">
<span class="name">${de(e.name)}</span>
<span class="kind-badge">${i}</span>
</div>`,n+='<div class="divider"></div>',n+='<div class="prop-row">',n+=`<span class="prop-item"><span class="prop-label">Visibility</span><span class="prop-value">${e.visibility}</span></span>`,e.returnType&&(n+=`<span class="prop-item"><span class="prop-label">Return Type</span><span class="prop-value">${de(e.returnType)}</span></span>`),e.type&&(n+=`<span class="prop-item"><span class="prop-label">Type</span><span class="prop-value">${de(e.type)}</span></span>`),e.isStatic&&(n+='<span class="prop-item"><span class="prop-label">Static</span><span class="prop-value">yes</span></span>'),e.isVirtual&&(n+='<span class="prop-item"><span class="prop-label">Virtual</span><span class="prop-value">yes</span></span>'),e.isAbstract&&(n+='<span class="prop-item"><span class="prop-label">Abstract</span><span class="prop-value">yes</span></span>'),e.isOverride&&(n+='<span class="prop-item"><span class="prop-label">Override</span><span class="prop-value">yes</span></span>'),e.modifiers.length>0&&(n+=`<span class="prop-item"><span class="prop-label">Modifiers</span><span class="prop-value">${de(e.modifiers.join(", "))}</span></span>`),n+="</div>",e.parameters.length>0){n+='<div class="section"><div class="section-title">Parameters</div><ul class="params-list">';for(let r of e.parameters){let o=r.isVar?'<span class="dir">var </span>':r.isOut?'<span class="dir">out </span>':r.isConst?'<span class="dir">const </span>':"";n+=`<li>${o}<span class="pname">${de(r.name)}</span>: <span class="ptype">${de(r.type)}</span></li>`}n+="</ul></div>"}n+='<div class="divider"></div>',n+=`<div class="actions">
<button class="btn btn-edit" id="btnEdit">Edit</button>
<button class="btn btn-rename" id="btnRename">Rename</button>
<button class="btn btn-delete" id="btnDelete">Delete</button>
</div>`}else n+='<p class="empty-section">No member selected. Place cursor on a method, field, or property.</p>';return n+=`<script nonce="${t}">
(function() {
    var vscodeApi = acquireVsCodeApi();
    function bind(id, cmd) {
        var el = document.getElementById(id);
        if (el) { el.addEventListener('click', function() { vscodeApi.postMessage({ command: cmd }); }); }
    }
    bind('btnEdit', 'edit');
    bind('btnRename', 'rename');
    bind('btnDelete', 'delete');
})();
</script>`,n+="</body></html>",n}};function Ft(){let u="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<32;e++)u+=t.charAt(Math.floor(Math.random()*t.length));return u}function de(u){return u.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var Ye=L(require("vscode"));function yn(){let u="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<32;e++)u+=t.charAt(Math.floor(Math.random()*t.length));return u}var ie={method:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 4h3.5c1.5 0 2.5 1 2.5 2.5v3c0 1.5 1 2.5 2.5 2.5H15"/><circle cx="4" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg>',field:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="6" width="10" height="4" rx="1"/><line x1="6" y1="8" x2="10" y2="8"/></svg>',property:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 8l3-3 3 3-3 3z"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/></svg>',ctor:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 4l-2 4 2 4M11 4l2 4-2 4"/></svg>',edit:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 13l1-3 6-6 2 2-6 6-3 1z"/><path d="M9 5l2 2"/></svg>',rename:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 4h7M3 8h10M3 12h5"/><circle cx="12" cy="4" r="1.5"/></svg>',delete:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5h8M6 5V3h4v2M5 5l1 9h4l1-9"/></svg>',extract:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 5h4M3 11h4M5 3v8"/><path d="M9 8h4M11 6v4"/></svg>',sort:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="9" x2="10" y2="9"/><line x1="3" y1="13" x2="7" y2="13"/></svg>',sync:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 8a5 5 0 0 1 8.5-3.5L13 6"/><path d="M13 8a5 5 0 0 1-8.5 3.5L3 10"/><path d="M11 4v2h2M5 12v-2H3"/></svg>',template:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 4L2 8l4 4M10 4l4 4-4 4"/></svg>',refresh:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M13 8a5 5 0 1 1-2-4"/><path d="M13 3v3h-3"/></svg>'},wn=[{id:"method",label:"Method",svg:ie.method,cmd:"mmx.addMethod"},{id:"field",label:"Field",svg:ie.field,cmd:"mmx.addField"},{id:"property",label:"Property",svg:ie.property,cmd:"mmx.addProperty"},{id:"constructor",label:"Constructor",svg:ie.ctor,cmd:"mmx.addConstructor"}],xn=[{id:"edit",label:"Edit",svg:ie.edit,cmd:"mmx.editMember",needsMember:!0},{id:"rename",label:"Rename",svg:ie.rename,cmd:"mmx.renameMember",needsMember:!0},{id:"delete",label:"Delete",svg:ie.delete,cmd:"mmx.deleteMember",needsMember:!0},{id:"extract",label:"Extract",svg:ie.extract,cmd:"mmx.extractMethod",needsDocument:!0}],Cn=[{id:"sync",label:"Sync",svg:ie.sync,cmd:"mmx.synchronizeDeclImpl",needsDocument:!0},{id:"template",label:"Template",svg:ie.template,cmd:"mmx.insertTemplate",needsDocument:!0}],Pn=[{id:"refresh",label:"Refresh",svg:ie.refresh,cmd:"mmx.refreshExplorer"}],$e=class{constructor(t,e,s){this._extensionUri=t;this._providerRegistry=e;this._codeExplorer=s}static viewType="mmxDashboard";_view;_currentClass;_currentMember;_hasDocument=!1;_stateKey="";_debounceTimer;resolveWebviewView(t,e,s){this._view=t,t.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri]},t.webview.html=this.getHtml(),t.webview.onDidReceiveMessage(async i=>{i.command==="run"&&typeof i.cmd=="string"&&await Ye.commands.executeCommand(i.cmd)});let n=Ye.window.activeTextEditor;n&&this.onCursorChanged(n)}scheduleCursorUpdate(t){this._debounceTimer&&clearTimeout(this._debounceTimer),this._debounceTimer=setTimeout(()=>this.onCursorChanged(t),75)}onCursorChanged(t){let e=t.document,s=this._providerRegistry.getByDocument(e);if(this._hasDocument=!!s,this._currentClass=void 0,this._currentMember=void 0,s){let i=t.selection.active,r=this._codeExplorer.getParsedDocument(e);if(r){for(let o of r.classes)if(o.range.contains(i)){this._currentClass=o.name;for(let a of o.members)if(a.range.contains(i)||a.implementationRange?.contains(i)){this._currentMember=a.name;break}break}if(!this._currentMember){for(let o of r.standaloneProcedures)if(o.range.contains(i)||o.implementationRange?.contains(i)){this._currentMember=o.name;break}}}}let n=(this._currentClass||"")+":"+(this._currentMember||"")+":"+(this._hasDocument?"1":"0");n!==this._stateKey&&(this._stateKey=n,this.updateContext())}updateContext(){this._view&&this._view.webview.postMessage({command:"context",className:this._currentClass||null,memberName:this._currentMember||null,hasDocument:this._hasDocument})}buttonHtml(t,e){return`<button class="mmx-btn mmx-btn-${e}" data-cmd="${t.cmd}"${t.needsMember?' data-needs-member="1"':""}${t.needsDocument?' data-needs-doc="1"':""}>
<span class="mmx-icon">${t.svg}</span><span class="mmx-label">${t.label}</span></button>`}getHtml(){let t=yn(),e=(s,n,i)=>{let r=n.map(o=>this.buttonHtml(o,i)).join("");return`<div class="mmx-group"><div class="mmx-group-title">${s}</div><div class="mmx-grid">${r}</div></div>`};return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${t}'; script-src 'nonce-${t}';">
<style nonce="${t}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-sideBar-background); padding: 10px 8px; }

.mmx-ctx { padding: 8px 10px; border-radius: 5px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); margin-bottom: 12px; min-height: 36px; display: flex; flex-direction: column; justify-content: center; }
.mmx-ctx-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); margin-bottom: 2px; }
.mmx-ctx-class { font-weight: 600; font-size: 13px; }
.mmx-ctx-member { font-size: 11px; color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); margin-top: 1px; }
.mmx-ctx-hint { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; }

.mmx-group { margin-bottom: 12px; }
.mmx-group-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-descriptionForeground); margin: 0 2px 5px; }

.mmx-grid { display: flex; flex-direction: column; gap: 3px; }

.mmx-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit; text-align: left; transition: background 0.12s, border-color 0.12s; }
.mmx-btn-add { background: var(--vscode-button-secondaryBackground, rgba(127,127,127,0.12)); color: var(--vscode-button-secondaryForeground, var(--vscode-foreground)); border-color: var(--vscode-button-border, transparent); }
.mmx-btn-add:hover:not(:disabled) { background: var(--vscode-button-secondaryHoverBackground, rgba(127,127,127,0.2)); }
.mmx-btn-member { background: transparent; color: var(--vscode-foreground); }
.mmx-btn-member:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); }
.mmx-btn-doc { background: transparent; color: var(--vscode-descriptionForeground); }
.mmx-btn-doc:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); color: var(--vscode-foreground); }
.mmx-btn-explorer { background: transparent; color: var(--vscode-descriptionForeground); }
.mmx-btn-explorer:hover:not(:disabled) { background: var(--vscode-list-hoverBackground, rgba(127,127,127,0.1)); color: var(--vscode-foreground); }
.mmx-btn:disabled { opacity: 0.35; cursor: default; }

.mmx-icon { width: 16px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
.mmx-icon svg { width: 16px; height: 16px; }
.mmx-btn-add .mmx-icon { opacity: 1; }
.mmx-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
</head>
<body>
<div class="mmx-ctx" id="ctx"><span class="mmx-ctx-hint">Open a supported file to begin.</span></div>
${e("Add Member",wn,"add")}
${e("Member",xn,"member")}
${e("Document",Cn,"doc")}
${e("Explorer",Pn,"explorer")}
<script nonce="${t}">
(function() {
    var vscodeApi = acquireVsCodeApi();
    var hasMember = false, hasDoc = false;
    function applyState() {
        document.querySelectorAll('.mmx-btn').forEach(function(b) {
            var nm = b.getAttribute('data-needs-member') === '1';
            var nd = b.getAttribute('data-needs-doc') === '1';
            b.disabled = (nm && !hasMember) || (nd && !hasDoc);
        });
    }
    document.querySelectorAll('.mmx-btn').forEach(function(b) {
        b.addEventListener('click', function() {
            if (b.disabled) return;
            vscodeApi.postMessage({ command: 'run', cmd: b.getAttribute('data-cmd') });
        });
    });
    window.addEventListener('message', function(ev) {
        var msg = ev.data;
        if (msg.command !== 'context') return;
        hasDoc = !!msg.hasDocument;
        hasMember = !!msg.memberName;
        var ctx = document.getElementById('ctx');
        if (!hasDoc) {
            ctx.innerHTML = '<span class="mmx-ctx-hint">Open a supported file to begin.</span>';
        } else if (msg.className) {
            var h = '<div class="mmx-ctx-label">Context</div><div class="mmx-ctx-class">' + esc(msg.className) + '</div>';
            if (msg.memberName) h += '<div class="mmx-ctx-member">' + esc(msg.memberName) + '</div>';
            ctx.innerHTML = h;
        } else if (msg.memberName) {
            ctx.innerHTML = '<div class="mmx-ctx-label">Function</div><div class="mmx-ctx-class">' + esc(msg.memberName) + '</div>';
        } else {
            ctx.innerHTML = '<span class="mmx-ctx-hint">Place cursor inside a class or function.</span>';
        }
        applyState();
    });
    function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
    applyState();
})();
</script>
</body></html>`}};var Me=L(require("vscode"));function $n(){let u="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<32;e++)u+=t.charAt(Math.floor(Math.random()*t.length));return u}function Mn(u,t){let e=1;for(let s=t.range.start.line;s<=t.range.end.line&&s<u.lineCount;s++){let n=u.lineAt(s).text;/\b(if|else if|for|while|switch|case|catch)\b/.test(n)&&e++}return e}function Tn(u,t){let e=t.members.filter(a=>a.kind==="method"),s=t.members.filter(a=>a.kind==="field"),n=t.members.filter(a=>a.kind==="property"),i=t.range.end.line-t.range.start.line,r=0;for(let a of e)r+=Mn(u,a);let o="good";return i>200||r>20?o="poor":(i>100||r>10)&&(o="warning"),{name:t.name,classType:t.classType||(t.isInterface?"interface":t.isRecord?"record":"class"),memberCount:t.members.length,methodCount:e.length,fieldCount:s.length,propertyCount:n.length,loc:i,complexity:r,maintainability:o}}var Ze=class u{static currentPanel;_panel;static createOrShow(t,e){if(u.currentPanel){u.currentPanel._panel.reveal();return}let s=Me.window.createWebviewPanel("metricsDashboard","Code Metrics",Me.ViewColumn.Beside,{enableScripts:!1,localResourceRoots:[]});u.currentPanel=new u(s,t,e)}constructor(t,e,s){this._panel=t,this._panel.onDidDispose(()=>{u.currentPanel=void 0}),this.update(s)}update(t){let e=Me.window.activeTextEditor;if(!e){this._panel.webview.html=this.getHtml([],"No active editor");return}let s=t.getByDocument(e.document);if(!s){this._panel.webview.html=this.getHtml([],"No provider for this file type");return}let i=s.parseDocument(e.document).classes.map(r=>Tn(e.document,r));this._panel.webview.html=this.getHtml(i)}getHtml(t,e){let s=$n(),n=t.reduce((d,l)=>d+l.memberCount,0),i=t.reduce((d,l)=>d+l.methodCount,0),r=t.reduce((d,l)=>d+l.fieldCount,0),o=t.reduce((d,l)=>d+l.loc,0),a=t.reduce((d,l)=>d+l.complexity,0),c=t.map(d=>{let l=d.maintainability,p=d.maintainability==="good"?"Good":d.maintainability==="warning"?"Warning":"Complex";return`<tr>
                <td>${ft(d.name)}</td>
                <td>${ft(d.classType)}</td>
                <td class="num">${d.memberCount}</td>
                <td class="num">${d.methodCount}</td>
                <td class="num">${d.propertyCount}</td>
                <td class="num">${d.fieldCount}</td>
                <td class="num">${d.loc}</td>
                <td class="num">${d.complexity}</td>
                <td class="status ${l}">${p}</td>
            </tr>`}).join(`
`);return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${s}';">
<style nonce="${s}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px; }
h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.error { color: var(--vscode-errorForeground, #f44747); padding: 12px; background: var(--vscode-input-background); border-radius: 4px; }
.summary { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.summary-card { padding: 10px 16px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); border-radius: 6px; min-width: 100px; text-align: center; }
.summary-card .value { font-size: 22px; font-weight: 700; }
.summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
table { border-collapse: collapse; width: 100%; margin-top: 8px; }
th, td { padding: 8px 12px; border: 1px solid var(--vscode-input-border, rgba(127,127,127,0.2)); text-align: left; }
th { background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.08)); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.status { font-weight: 600; text-align: center; }
.good { color: #4ec9b0; }
.warning { color: #dcdcaa; }
.poor { color: #f44747; }
.empty { padding: 24px; text-align: center; color: var(--vscode-descriptionForeground); font-style: italic; }
</style>
</head>
<body>
<h2>Code Metrics</h2>
${e?`<div class="error">${ft(e)}</div>`:""}
${t.length>0?`
<div class="summary">
    <div class="summary-card"><div class="value">${t.length}</div><div class="label">Classes</div></div>
    <div class="summary-card"><div class="value">${n}</div><div class="label">Members</div></div>
    <div class="summary-card"><div class="value">${i}</div><div class="label">Methods</div></div>
    <div class="summary-card"><div class="value">${r}</div><div class="label">Fields</div></div>
    <div class="summary-card"><div class="value">${o}</div><div class="label">Total LOC</div></div>
    <div class="summary-card"><div class="value">${a}</div><div class="label">Complexity</div></div>
</div>
<table>
<thead>
<tr><th>Class</th><th>Type</th><th class="num">Members</th><th class="num">Methods</th><th class="num">Properties</th><th class="num">Fields</th><th class="num">LOC</th><th class="num">Complexity</th><th>Status</th></tr>
</thead>
<tbody>
${c}
</tbody>
</table>
`:e?"":'<div class="empty">No classes found in this file.</div>'}
</body>
</html>`}};function ft(u){return u.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]||t)}var ue=L(require("vscode")),vt=L(require("path")),Ot=L(require("fs"));function In(u){return Array.isArray(u)?u.join(`
`):u}function En(u){if(typeof u!="object"||u===null)return!1;let t=u;return typeof t.name=="string"&&t.name.length>0}function Lt(u){return typeof u=="string"?u:void 0}function Sn(u){if(!Array.isArray(u))return;let t=[];for(let e of u)typeof e=="object"&&e!==null&&typeof e.placeholder=="string"?t.push({placeholder:e.placeholder}):typeof e=="string"&&t.push({placeholder:e});return t.length>0?t:void 0}function et(u){let t;try{t=JSON.parse(u)}catch(n){return{ok:!1,error:"Invalid JSON: "+(n instanceof Error?n.message:String(n))}}if(typeof t!="object"||t===null||!Array.isArray(t.templates))return{ok:!1,error:'Invalid JSON: missing "templates" array'};let e=[],s=t.templates;for(let n of s){if(!En(n))continue;let i=n;if(i.body===void 0)continue;let r=i.languages;e.push({name:i.name,prefix:Lt(i.prefix),description:Lt(i.description),languages:Array.isArray(r)?r.filter(o=>typeof o=="string"):void 0,body:In(i.body),params:Sn(i.params)})}return{ok:!0,templates:e}}function gt(u,t){let e=new Map;for(let s of u)e.set(s.name,s);for(let s of t)e.set(s.name,s);return Array.from(e.values())}var _t=[{name:"Singleton",prefix:"singleton",description:"Thread-safe singleton pattern",languages:["typescript","javascript"],body:`class \${1:Singleton} {
  private static instance: \${1};
  private constructor() {}

  static getInstance(): \${1} {
    if (!\${1}.instance) {
      \${1}.instance = new \${1}();
    }
    return \${1}.instance;
  }
  $0
}`},{name:"Factory",prefix:"factory",description:"Factory method pattern",languages:["typescript","javascript"],body:`class \${1:Product}Factory {
  static create(type: string): \${1} {
    switch (type) {
      case "\${2:type1}":
        return new \${3:ConcreteProduct1}();
      default:
        throw new Error(\`Unknown type: \${type}\`);
    }
  }
  $0
}`},{name:"Builder",prefix:"builder",description:"Fluent builder pattern",languages:["typescript","javascript"],body:`class \${1:Model}Builder {
  private \${2:field}: \${3:Type} | undefined;

  set\${2/(.*)/\${1:/capitalize}/}(\${2}: \${3}): this {
    this.\${2} = \${2};
    return this;
  }

  build(): \${1} {
    const result = new \${1}();
    result.\${2} = this.\${2}!;
    return result;
  }
}
$0
class \${1} {
  \${2}!: \${3};
}`},{name:"Observer",prefix:"observer",description:"Observer pattern",languages:["typescript","javascript"],body:`interface \${1:Observer}<\${2:T}> {
  update(data: \${2:T}): void;
}

class \${3:Subject}<\${2:T}> {
  private listeners: \${1}<\${2}>[] = [];

  subscribe(listener: \${1}<\${2}>): void {
    this.listeners.push(listener);
  }

  unsubscribe(listener: \${1}<\${2}>): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  notify(data: \${2:T}): void {
    for (const listener of this.listeners) {
      listener.update(data);
    }
  }
  $0
}`},{name:"Try-Catch",prefix:"try",description:"Try-catch block",languages:["typescript","javascript"],body:`try {
  \${1:// TODO: implement}
} catch (\${2:error}) {
  console.error($2);
  throw $2;
} $0`},{name:"Property",prefix:"prop",description:"Property with getter and setter",languages:["typescript","javascript"],body:"private _${1:name}: ${2:Type} = ${3:defaultValue};\n\nget ${1}(): ${2} {\n  return this._${1};\n}\n\nset ${1}(value: ${2}) {\n  this._${1} = value;\n}\n$0"},{name:"REST Controller",prefix:"controller",description:"Express.js REST controller",languages:["typescript","javascript"],body:`import { Request, Response } from 'express';

export class \${1:Controller} {
  static async getAll(req: Request, res: Response) {
    try {
      res.json({ message: "OK" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
$0
}`},{name:"Singleton",prefix:"singleton",description:"Thread-safe singleton",languages:["java"],body:`public class \${1:Singleton} {
    private static volatile \${1} instance;

    private \${1}() {}

    public static \${1} getInstance() {
        if (instance == null) {
            synchronized (\${1}.class) {
                if (instance == null) {
                    instance = new \${1}();
                }
            }
        }
        return instance;
    }
    $0
}`},{name:"Factory",prefix:"factory",description:"Factory method pattern",languages:["java"],body:`public class \${1:Factory} {
    public static \${2:Product} create(String type) {
        switch (type) {
            case "\${3:type}": return new \${4:ConcreteProduct}();
            default: throw new IllegalArgumentException("Unknown type: " + type);
        }
    }
    $0
}`},{name:"Builder",prefix:"builder",description:"Fluent builder pattern",languages:["java"],body:"public class ${1:Model}Builder {\n    private ${2:type} ${3:field};\n\n    public ${1}Builder with${3/(.*)/${1:/capitalize}/}(${2} ${3}) {\n        this.${3} = ${3};\n        return this;\n    }\n\n    public ${1} build() {\n        ${1} result = new ${1}();\n        result.${3} = this.${3};\n        return result;\n    }\n}\n$0\nclass ${1} {\n    ${2} ${3};\n}"},{name:"Repository",prefix:"repo",description:"CRUD repository pattern",languages:["java"],body:`public interface \${1:Repository}<$2> {
    $2 getById(Long id);
    List<$2> getAll();
    $2 save($2 entity);
    void delete(Long id);
}

public class \${3:InMemory}\${1}<$2> implements \${1}<$2> {
    private final Map<Long, $2> store = new HashMap<>();
    private long nextId = 1;

    @Override
    public $2 getById(Long id) {
        return store.get(id);
    }

    @Override
    public List<$2> getAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public $2 save($2 entity) {
        store.put(nextId++, entity);
        return entity;
    }

    @Override
    public void delete(Long id) {
        store.remove(id);
    }
    $0
}`},{name:"Property",prefix:"prop",description:"Getter and setter",languages:["java"],body:"private ${1:String} ${2:name};\n\npublic ${1} get${2/(.*)/${1:/capitalize}/}() {\n    return this.${2};\n}\n\npublic void set${2/(.*)/${1:/capitalize}/}(${1} ${2}) {\n    this.${2} = ${2};\n}\n$0"},{name:"Try-Catch",prefix:"try",description:"Try-catch-finally block",languages:["java"],body:`try {
    \${1:// TODO: implement}
} catch (\${2:Exception} e) {
    e.printStackTrace();
    throw e;
} finally {
    \${3:// cleanup}
}
$0`},{name:"Test Method",prefix:"test",description:"JUnit test method",languages:["java"],body:`@Test
public void \${1:shouldDoSomething}() {
    // Given
    \${2:// arrange}

    // When
    \${3:// act}

    // Then
    \${4:// assert}
    $0
}`},{name:"Singleton",prefix:"singleton",description:"Thread-safe singleton",languages:["csharp"],body:`public class \${1:Singleton}
{
    private static \${1}? _instance;
    private static readonly object _lock = new();

    private \${1}() { }

    public static \${1} Instance
    {
        get
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    _instance ??= new \${1}();
                }
            }
            return _instance;
        }
    }
    $0
}`},{name:"Property",prefix:"prop",description:"Auto-property",languages:["csharp"],body:"public ${1:Type} ${2:Name} { get; set; }\n$0"},{name:"Constructor",prefix:"ctor",description:"Constructor with all fields",languages:["csharp"],body:"public ${1:ClassName}(${2:string} ${3:name})\n{\n    ${3:Name} = ${3:name};\n    $0\n}"},{name:"Try-Catch",prefix:"try",description:"Try-catch-finally",languages:["csharp"],body:`try {
    \${1:// TODO: implement}
} catch (\${2:Exception} ex) {
    throw;
} finally {
    \${3:// cleanup}
}
$0`},{name:"Interface",prefix:"iface",description:"Interface definition",languages:["csharp"],body:"public interface ${1:IName}\n{\n    ${2:Type} ${3:Method}(${4:parameters});\n    $0\n}"},{name:"Repository",prefix:"repo",description:"Generic repository pattern",languages:["csharp"],body:"public interface I${1:Repository}<${2:T}> where ${2:T} : class\n{\n    Task<${2:T}?> GetByIdAsync(int id);\n    Task<IEnumerable<${2:T}>> GetAllAsync();\n    Task<${2:T}> AddAsync(${2:T} entity);\n    Task UpdateAsync(${2:T} entity);\n    Task DeleteAsync(int id);\n}\n$0"},{name:"Struct",prefix:"struct",description:"Struct with impl",languages:["rust"],body:`pub struct \${1:Name} {
    \${2:field}: \${3:Type},
}

impl \${1} {
    pub fn new(\${2}: \${3}) -> Self {
        Self { \${2} }
    }
    $0
}`},{name:"Singleton",prefix:"singleton",description:"Lazy singleton via once_cell",languages:["rust"],body:`use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;

static \${1:INSTANCE}: Lazy<Arc<Mutex<\${2:Inner}>>> = Lazy::new(|| {
    Arc::new(Mutex::new(\${2:Inner}::new()))
});

struct \${2} {
    \${3:field}: \${4:Type},
}

impl \${2} {
    fn new() -> Self {
        Self { \${3}: \${4}::default() }
    }
}
$0`},{name:"Builder",prefix:"builder",description:"Builder pattern",languages:["rust"],body:`pub struct \${1:Model}Builder {
    \${2:field}: Option<\${3:Type}>,
}

impl \${1}Builder {
    pub fn new() -> Self {
        Self { \${2}: None }
    }

    pub fn \${2}(mut self, \${2}: \${3}) -> Self {
        self.\${2} = Some(\${2});
        self
    }

    pub fn build(self) -> \${1} {
        \${1} { \${2}: self.\${2}.unwrap_or_default() }
    }
}
$0`},{name:"Try-Catch",prefix:"try",description:"Result match (Rust error handling)",languages:["rust"],body:`match \${1:operation} {
    Ok(\${2:value}) => {
        $0
    }
    Err(\${3:e}) => {
        eprintln!("Error: {}", \${3});
        return Err(\${3});
    }
}`},{name:"Trait",prefix:"trait",description:"Trait definition with implementation",languages:["rust"],body:`pub trait \${1:TraitName} {
    fn \${2:method}(&self) -> \${3:Result<()>};
}

impl \${1} for \${4:Type} {
    fn \${2}(&self) -> \${3} {
        todo!()
    }
}
$0`},{name:"Singleton",prefix:"singleton",description:"Thread-safe Meyer's singleton",languages:["cpp"],body:`class \${1:Singleton} {
public:
    static \${1}& getInstance() {
        static \${1} instance;
        return instance;
    }

    \${1}(const \${1}&) = delete;
    \${1}& operator=(const \${1}&) = delete;
$0
private:
    \${1}() = default;
};`},{name:"Try-Catch",prefix:"try",description:"Try-catch block",languages:["cpp"],body:`try {
    \${1:// TODO: implement}
} catch (const \${2:std::exception}& e) {
    std::cerr << e.what() << std::endl;
    throw;
}
$0`},{name:"Constructor",prefix:"ctor",description:"Constructor with initializer list",languages:["cpp"],body:"${1:ClassName}(${2:Type} ${3:param}) : ${3}(${3}) {\n    $0\n}"},{name:"Observer",prefix:"observer",description:"Observer pattern",languages:["cpp"],body:`class \${1:Observer} {
public:
    virtual void update(const \${2:void}& data) = 0;
    virtual ~\${1}() = default;
};

class \${3:Subject} {
private:
    std::vector<\${1}*> observers;
public:
    void subscribe(\${1}* o) { observers.push_back(o); }
    void unsubscribe(\${1}* o) {
        observers.erase(std::remove(observers.begin(), observers.end(), o), observers.end());
    }
    void notify(const \${2}& data) {
        for (auto* o : observers) o->update(data);
    }
$0
};`},{name:"Factory",prefix:"factory",description:"Factory method",languages:["cpp"],body:`#include <memory>

class \${1:Product} {
public:
    virtual void \${2:doWork}() = 0;
    virtual ~\${1}() = default;
};

class \${3:Factory} {
public:
    static std::unique_ptr<\${1}> create(const std::string& type) {
        if (type == "\${4:type}") return std::make_unique<\${5:ConcreteProduct}>();
        return nullptr;
    }
};
$0`},{name:"Singleton",prefix:"singleton",description:"Singleton metaclass",languages:["python"],body:`class \${1:SingletonMeta}(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class \${2:MyClass}(metaclass=\${1}):
    def __init__(self, \${3:value}=None):
        self.value = \${3}
$0`},{name:"Try-Catch",prefix:"try",description:"Try-except block",languages:["python"],body:`try:
    \${1:# TODO: implement}
except \${2:Exception} as \${3:e}:
    print(f"Error: {\${3}}")
    raise
$0`},{name:"Property",prefix:"prop",description:"Property with @property decorator",languages:["python"],body:"@property\ndef ${1:name}(self) -> ${2:str}:\n    return self._${1}\n\n@${1}.setter\ndef ${1}(self, value: ${2}):\n    self._${1} = value\n$0"},{name:"Dataclass",prefix:"dataclass",description:"Dataclass definition",languages:["python"],body:`from dataclasses import dataclass

@dataclass
class \${1:Model}:
    \${2:field}: \${3:str}
    $0`},{name:"Test",prefix:"test",description:"pytest test function",languages:["python"],body:`def test_\${1:should_do_something}():
    # Arrange
    \${2:# setup}

    # Act
    \${3:# exercise}

    # Assert
    \${4:# verify}
    $0`},{name:"Abstract Base",prefix:"abc",description:"Abstract base class",languages:["python"],body:`from abc import ABC, abstractmethod

class \${1:Base}(ABC):

    @abstractmethod
    def \${2:method}(self) -> \${3:None}:
        pass
    $0`},{name:"Struct",prefix:"struct",description:"Struct with constructor",languages:["go"],body:"type ${1:Name} struct {\n    ${2:field} ${3:string}\n}\n\nfunc New${1}(${2} ${3}) *${1} {\n    return &${1}{${2}: ${2}}\n}\n$0"},{name:"Interface",prefix:"iface",description:"Interface definition",languages:["go"],body:"type ${1:Interface} interface {\n    ${2:Method}(${3:parameters}) ${4:Type}\n    $0\n}"},{name:"Try-Catch",prefix:"try",description:"Error handling",languages:["go"],body:`\${1:result}, err := \${2:operation}
if err != nil {
    return fmt.Errorf("\${3:failed}: %w", err)
}
$0`},{name:"Handler",prefix:"handler",description:"HTTP handler function",languages:["go"],body:`func \${1:Handler}(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        \${2:// handle GET}
    case http.MethodPost:
        \${3:// handle POST}
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}
$0`},{name:"Test",prefix:"test",description:"Table-driven test",languages:["go"],body:`func Test\${1:FunctionName}(t *testing.T) {
    tests := []struct {
        name     string
        input    \${2:Type}
        expected \${3:Type}
    }{
        {"\${4:case}", \${5:input}, \${6:expected}},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := \${1}(tt.input)
            if result != tt.expected {
                t.Errorf("got %v, want %v", result, tt.expected)
            }
        })
    }
    $0
}`},{name:"Singleton",prefix:"singleton",description:"Singleton pattern",languages:["pascal"],body:`type
  \${1:T\${2:Singleton}} = class
  private
    class var FInstance: \${1};
  public
    class function GetInstance: \${1};
    constructor Create;
    destructor Destroy; override;
    $0
  end;

constructor \${1}.Create;
begin
  inherited Create;
end;

destructor \${1}.Destroy;
begin
  inherited Destroy;
end;

class function \${1}.GetInstance: \${1};
begin
  if FInstance = nil then
    FInstance := \${1}.Create;
  Result := FInstance;
end;`},{name:"Try-Except",prefix:"try",description:"Try-except block",languages:["pascal"],body:`try
  \${1:// TODO: implement}
except
  on E: \${2:Exception} do
    ShowMessage(E.Message);
end;$0`},{name:"Interface",prefix:"iface",description:"Interface definition",languages:["pascal"],body:"type\n  ${1:IName} = interface\n    ['${2:{GUID}}']\n    function ${3:Method}(const ${4:param}: ${5:Type}): ${6:Result};\n    $0\n  end;"},{name:"Property",prefix:"prop",description:"Read/write property",languages:["pascal"],body:"private\n  F${1:Name}: ${2:Type};\npublic\n  property ${1}: ${2} read F${1} write F${1};\n$0"},{name:"Unit Test",prefix:"test",description:"DUnitX test method",languages:["pascal"],body:`[TestFixture]
  \${1:TMyTestClass} = class
  public
    [Setup]
    procedure Setup;
    [TearDown]
    procedure TearDown;
    [Test]
    procedure \${2:TestSomething};
  end;

procedure \${1}.Setup;
begin
end;

procedure \${1}.TearDown;
begin
end;

procedure \${1}.\${2};
begin
  \${3:// TODO: implement}
end;$0`}];var tt=class{templates=[];workspaceUri;globalUri;watchers=[];constructor(t){this.globalUri=ue.Uri.file(vt.join(t.globalStorageUri.fsPath,"templates.json"));let e=ue.workspace.workspaceFolders;e&&e.length>0&&(this.workspaceUri=ue.Uri.file(vt.join(e[0].uri.fsPath,".vscode","mmx-templates.json")))}async load(){let t=await this.loadFile(this.globalUri),e=await this.loadFile(this.workspaceUri);this.templates=gt(_t,gt(t,e)),console.log("[MMX] [TemplateService] loaded "+this.templates.length+" templates")}async loadFile(t){if(!t)return[];try{let e=await Ot.promises.readFile(t.fsPath,"utf8"),s=et(e);return s.ok?s.templates:(console.warn("[MMX] [TemplateService] "+t.fsPath+": "+s.error),[])}catch{return[]}}startWatching(){this.stopWatching();let t=ue.workspace.createFileSystemWatcher(".vscode/mmx-templates.json"),e=()=>{this.load().catch(()=>{})};this.watchers.push(t,t.onDidChange(e),t.onDidCreate(e),t.onDidDelete(e))}stopWatching(){for(let t of this.watchers)t.dispose();this.watchers=[]}getForLanguage(t){return this.templates.filter(e=>!e.languages||e.languages.length===0||e.languages.includes(t))}getAll(){return this.templates}dispose(){this.stopWatching()}};var Te=L(require("vscode")),Ie=L(require("path")),nt=L(require("fs"));var st=class{workspaceUri;globalUri;constructor(t){this.globalUri=Te.Uri.file(Ie.join(t.globalStorageUri.fsPath,"templates.json"));let e=Te.workspace.workspaceFolders;e&&e.length>0&&(this.workspaceUri=Te.Uri.file(Ie.join(e[0].uri.fsPath,".vscode","mmx-templates.json")))}get workspaceAvailable(){return!!this.workspaceUri}uriFor(t){return t==="workspace"?this.workspaceUri:this.globalUri}async readScope(t){return this.readScopeFile(this.uriFor(t))}async readScopeFile(t){if(!t)return[];try{let e=await nt.promises.readFile(t.fsPath,"utf8"),s=et(e);return s.ok?s.templates:[]}catch{return[]}}async readAll(){let t=(await this.readScope("global")).map(n=>({...n,scope:"global"})),e=(await this.readScope("workspace")).map(n=>({...n,scope:"workspace"})),s=new Map;for(let n of t)s.set(n.name,n);for(let n of e)s.set(n.name,n);return Array.from(s.values()).sort((n,i)=>n.name.localeCompare(i.name))}async writeScope(t,e){let s=this.uriFor(t);if(!s)throw new Error("No "+t+" storage available in this context.");await nt.promises.mkdir(Ie.dirname(s.fsPath),{recursive:!0});let n={templates:e};await nt.promises.writeFile(s.fsPath,JSON.stringify(n,null,2),"utf8")}async save(t,e,s){let n=await this.readScope(t);if(n.find(a=>a.name===s.name&&a.name!==e))throw new Error('A template named "'+s.name+'" already exists in '+t+" scope.");let r=e??s.name,o=n.findIndex(a=>a.name===r);o>=0?n[o]=s:n.push(s),await this.writeScope(t,n)}async remove(t,e){let s=await this.readScope(t);await this.writeScope(t,s.filter(n=>n.name!==e))}};var fe=L(require("vscode")),it=class{constructor(t,e){this.templateService=t;this.providerRegistry=e}provideCompletionItems(t,e,s,n){let i=this.providerRegistry.getByDocument(t)?.languageId??t.languageId,r=[];for(let o of this.templateService.getForLanguage(i)){let a=new fe.CompletionItem(o.name,fe.CompletionItemKind.Snippet);a.insertText=new fe.SnippetString(o.body),o.prefix&&(a.filterText=o.prefix,a.sortText=o.prefix),a.detail=o.description||"(MMX template)",r.push(a)}return r}};var ae=L(require("vscode")),rt=class u{static viewType="mmxTemplateManager";static currentPanel;_panel;_store;_disposables=[];_templates=[];_workspaceAvailable=!1;static async createOrShow(t,e){if(u.currentPanel){u.currentPanel._panel.reveal(ae.ViewColumn.Active),await u.currentPanel.refresh();return}let s=ae.window.createWebviewPanel(u.viewType,"Templates",ae.ViewColumn.Active,{enableScripts:!0,retainContextWhenHidden:!1,localResourceRoots:[t]});u.currentPanel=new u(s,e),await u.currentPanel.refresh()}constructor(t,e){this._panel=t,this._store=e,this._panel.webview.html=this.getHtml(),this._panel.webview.onDidReceiveMessage(async s=>{switch(s.command){case"save":{try{let n={name:s.template.name,prefix:s.template.prefix||void 0,description:s.template.description||void 0,languages:s.template.languages||void 0,body:s.template.body,params:s.template.params&&s.template.params.length>0?s.template.params:void 0};await this._store.save(s.scope,s.originalName,n),await this.refresh(),this.post({command:"saveResult",ok:!0}),this.post({command:"notify",message:'Template "'+n.name+'" saved ('+s.scope+")."})}catch(n){this.post({command:"saveResult",ok:!1,message:"Save failed: "+(n instanceof Error?n.message:String(n))})}break}case"delete":{if(await ae.window.showWarningMessage('Delete template "'+s.name+'" ('+s.scope+")?",{modal:!0},"Delete")!=="Delete")break;await this._store.remove(s.scope,s.name),await this.refresh(),this.post({command:"notify",message:'Template "'+s.name+'" deleted.'});break}case"insert":{let n=ae.window.activeTextEditor;if(!n){this.post({command:"notify",message:"Open a file to insert into."});break}await n.insertSnippet(new ae.SnippetString(s.body)),this.post({command:"notify",message:"Inserted at cursor."});break}}}),this._panel.onDidDispose(()=>{u.currentPanel=void 0,this._disposables.forEach(s=>s.dispose()),this._disposables=[]})}async refresh(){this._templates=await this._store.readAll(),this._workspaceAvailable=this._store.workspaceAvailable,this.post({command:"init",templates:this._templates.map(t=>({name:t.name,prefix:t.prefix||"",description:t.description||"",languages:(t.languages||[]).join(", "),body:t.body,scope:t.scope,params:t.params||[]})),workspaceAvailable:this._workspaceAvailable})}post(t){this._panel.webview.postMessage(t)}getHtml(){let t=kn();return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'nonce-${t}'; script-src 'unsafe-inline' 'nonce-${t}';">
<style nonce="${t}">
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 14px; }
h2 { font-size: 15px; margin-bottom: 10px; }
.toolbar { margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
input, select, textarea { width: 100%; padding: 5px 7px; border: 1px solid var(--vscode-input-border, #ccc); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 3px; font-family: inherit; font-size: inherit; }
textarea { font-family: var(--vscode-editor-font-family, Consolas, monospace); min-height: 120px; resize: vertical; }
label { display: block; margin: 8px 0 3px; font-weight: 500; font-size: 12px; }
.row { display: flex; gap: 10px; } .row > div { flex: 1; }
.btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500; }
.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.btn-danger { background: #d32f2f; color: #fff; }
.btn-small { padding: 2px 8px; font-size: 11px; }
.list { border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3)); border-radius: 3px; }
.list-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.2)); }
.list-item:last-child { border-bottom: none; }
.list-item .nm { font-weight: 600; }
.list-item .px { color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family, monospace); font-size: 11px; }
.list-item .sc { font-size: 10px; padding: 1px 5px; border-radius: 8px; background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.15)); color: var(--vscode-descriptionForeground); }
.list-item .sp { flex: 1; }
.list-item .actions { display: flex; gap: 4px; }
.empty { color: var(--vscode-descriptionForeground); font-style: italic; padding: 10px; text-align: center; }
#form { display: none; margin-top: 6px; }
.params-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.params-row input { flex: 1; }
.params-row button { flex: 0 0 auto; }
.params-tools { display: flex; gap: 6px; margin-bottom: 6px; }
.actions-bar { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
.preview { background: var(--vscode-textCodeBlock-background, #1e1e1e); border: 1px solid var(--vscode-input-border, #ccc); border-radius: 3px; padding: 10px; font-family: var(--vscode-editor-font-family, Consolas, monospace); white-space: pre-wrap; margin-top: 4px; max-height: 180px; overflow: auto; }
#notify { color: var(--vscode-descriptionForeground); font-size: 11px; min-height: 16px; margin-top: 10px; }
</style>
</head>
<body>
<h2>Templates</h2>
<div id="manager">
  <div class="toolbar">
    <button class="btn btn-primary" id="btnNew">+ New Template</button>
    <span style="flex:1"></span>
    <span id="count" style="color:var(--vscode-descriptionForeground);font-size:11px;"></span>
  </div>
  <div class="list" id="list"></div>
</div>

<div id="form">
  <h2 id="formTitle">New Template</h2>
  <div class="row">
    <div><label for="f_name">Name *</label><input id="f_name" placeholder="Reverse for loop"></div>
    <div><label for="f_prefix">Prefix</label><input id="f_prefix" placeholder="forr"></div>
  </div>
  <div class="row">
    <div><label for="f_description">Description</label><input id="f_description" placeholder="for i = len-1 downto 0"></div>
    <div><label for="f_scope">Scope</label><select id="f_scope"><option value="workspace">workspace</option><option value="global">global</option></select></div>
  </div>
  <label for="f_languages">Languages (comma-separated languageIds, empty = all)</label>
  <input id="f_languages" placeholder="pascal, typescript, cpp">

  <label>Parameters (snippet placeholders)</label>
  <div class="params-tools">
    <button type="button" class="btn btn-secondary btn-small" id="btnAddParam">+ Add Parameter</button>
    <button type="button" class="btn btn-secondary btn-small" id="btnInsertCursor">Insert final cursor ($0)</button>
  </div>
  <div id="paramsContainer"></div>

  <label for="f_body">Body (VS Code snippet syntax: \${1:label}, $0, ...)</label>
  <textarea id="f_body" placeholder="for (let \${1:i} = 0; \${1} < \${2:arr}.length; \${1}++) {&#10;	$0&#10;}"></textarea>

  <label>Preview</label>
  <div class="preview" id="preview"></div>

  <div class="actions-bar">
    <button class="btn btn-secondary" id="btnCancel">Cancel</button>
    <button class="btn btn-primary" id="btnSave">Save</button>
  </div>
</div>

<div id="notify"></div>

<script nonce="${t}">
(function() {
  var vscodeApi = acquireVsCodeApi();
  var state = { templates: [], workspaceAvailable: false, editing: null };
  var paramCounter = 0;

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function notify(msg){ var n=$('notify'); if(n){ n.textContent=msg; } }

  function renderList(){
    var list=$('list'); var count=$('count');
    if(!list) return;
    list.innerHTML='';
    if(count){ count.textContent=state.templates.length+' template(s)'; }
    if(state.templates.length===0){
      list.innerHTML='<div class="empty">No templates yet. Click "+ New Template".</div>';
      return;
    }
    state.templates.forEach(function(t){
      var item=document.createElement('div'); item.className='list-item';
      var sp=document.createElement('div'); sp.className='sp';
      var nm=document.createElement('span'); nm.className='nm'; nm.textContent=t.name; sp.appendChild(nm);
      if(t.prefix){ var px=document.createElement('span'); px.className='px'; px.textContent='('+t.prefix+')'; sp.appendChild(px); }
      if(t.languages){ var lg=document.createElement('span'); lg.className='px'; lg.textContent='['+t.languages+']'; sp.appendChild(lg); }
      if(t.description){ var ds=document.createElement('span'); ds.className='px'; ds.textContent='\u2014 '+t.description; sp.appendChild(ds); }
      item.appendChild(sp);
      var sc=document.createElement('span'); sc.className='sc'; sc.textContent=t.scope; item.appendChild(sc);
      var actions=document.createElement('div'); actions.className='actions';
      var ins=document.createElement('button'); ins.className='btn btn-secondary btn-small'; ins.textContent='Insert'; ins.title='Insert at cursor';
      ins.addEventListener('click', function(){ vscodeApi.postMessage({command:'insert', body:t.body}); });
      actions.appendChild(ins);
      var ed=document.createElement('button'); ed.className='btn btn-secondary btn-small'; ed.textContent='Edit';
      ed.addEventListener('click', function(){ showForm(t); });
      actions.appendChild(ed);
      var del=document.createElement('button'); del.className='btn btn-danger btn-small'; del.textContent='Delete';
      del.addEventListener('click', function(){ vscodeApi.postMessage({command:'delete', name:t.name, scope:t.scope}); });
      actions.appendChild(del);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function showManager(){ $('manager').style.display='block'; $('form').style.display='none'; state.editing=null; }
  function showForm(t){
    state.editing = t ? { originalName: t.name, scope: t.scope } : null;
    $('manager').style.display='none'; $('form').style.display='block';
    $('formTitle').textContent = t ? 'Edit Template' : 'New Template';
    $('f_name').value = t ? t.name : '';
    $('f_prefix').value = t ? (t.prefix||'') : '';
    $('f_description').value = t ? (t.description||'') : '';
    $('f_languages').value = t ? (t.languages||'') : '';
    $('f_body').value = t ? t.body : '';
    var scopeSel=$('f_scope');
    if(!state.workspaceAvailable){
      scopeSel.innerHTML='<option value="global">global</option>';
    } else {
      scopeSel.innerHTML='<option value="workspace">workspace</option><option value="global">global</option>';
    }
    scopeSel.value = t ? t.scope : (state.workspaceAvailable ? 'workspace' : 'global');
    rebuildParams(t ? (t.params||[]) : []);
    updatePreview();
    $('f_name').focus();
  }

  function rebuildParams(params){
    var c=$('paramsContainer'); c.innerHTML=''; paramCounter=0;
    params.forEach(function(p){ addParamRow(p.placeholder); });
  }

  function addParamRow(placeholder){
    paramCounter++;
    var row=document.createElement('div'); row.className='params-row';
    var idx=paramCounter;
    var inp=document.createElement('input'); inp.type='text'; inp.className='param-input';
    inp.placeholder='placeholder (e.g. i, arr.length)';
    inp.value=placeholder||'';
    inp.addEventListener('input', function(){ updatePreview(); });
    row.appendChild(inp);
    var insBtn=document.createElement('button'); insBtn.type='button'; insBtn.className='btn btn-secondary btn-small'; insBtn.textContent='\\u2193 insert';
    insBtn.title='Insert $'+idx+':placeholder into body';
    insBtn.addEventListener('click', function(){
      var label = inp.value.trim() || ('param' + idx);
      insertIntoBody('\${' + idx + ':' + label + '}');
    });
    row.appendChild(insBtn);
    var rm=document.createElement('button'); rm.type='button'; rm.className='btn btn-danger btn-small'; rm.textContent='x';
    rm.addEventListener('click', function(){ row.remove(); renumberParams(); updatePreview(); });
    row.appendChild(rm);
    $('paramsContainer').appendChild(row);
    inp.addEventListener('focus', function(){ /* keep idx */ });
  }

  function renumberParams(){
    var rows=document.querySelectorAll('#paramsContainer .params-row');
    paramCounter=0;
    rows.forEach(function(row){
      paramCounter++;
      var btn=row.querySelectorAll('button')[0];
      var inp=row.querySelector('.param-input');
      var idx=paramCounter;
      btn.onclick=null;
      btn.addEventListener('click', function(){
        var label = inp.value.trim() || ('param'+idx);
        insertIntoBody('\${'+idx+':'+label+'}');
      });
    });
  }

  function insertIntoBody(text){
    var ta=$('f_body');
    var start=ta.selectionStart, end=ta.selectionEnd;
    ta.value = ta.value.substring(0,start)+text+ta.value.substring(end);
    ta.selectionStart=ta.selectionEnd=start+text.length;
    ta.focus();
    updatePreview();
  }

  function gatherParams(){
    var rows=document.querySelectorAll('#paramsContainer .params-row');
    var out=[];
    rows.forEach(function(row){
      var v=row.querySelector('.param-input').value.trim();
      if(v) out.push({placeholder:v});
    });
    return out;
  }

  function updatePreview(){
    var p=$('preview'); if(p){ p.textContent = $('f_body').value || '(empty)'; }
  }

  function gatherForm(){
    return {
      originalName: state.editing ? state.editing.originalName : null,
      scope: $('f_scope').value,
      template: {
        name: $('f_name').value.trim(),
        prefix: $('f_prefix').value.trim(),
        description: $('f_description').value.trim(),
        languages: $('f_languages').value.split(',').map(function(s){return s.trim();}).filter(Boolean),
        body: $('f_body').value,
        params: gatherParams()
      }
    };
  }

  function save(){
    var data=gatherForm();
    if(!data.template.name){ notify('Name is required.'); return; }
    vscodeApi.postMessage({command:'save', originalName:data.originalName, scope:data.scope, template:data.template});
  }

  // wiring
  $('btnNew').addEventListener('click', function(){ showForm(null); });
  $('btnCancel').addEventListener('click', showManager);
  $('btnSave').addEventListener('click', save);
  $('btnAddParam').addEventListener('click', function(){ addParamRow(''); });
  $('btnInsertCursor').addEventListener('click', function(){ insertIntoBody('$0'); });
  $('f_body').addEventListener('input', updatePreview);

  window.addEventListener('message', function(event){
    var msg=event.data;
    if(msg.command==='init'){
      state.templates=msg.templates||[];
      state.workspaceAvailable=!!msg.workspaceAvailable;
      renderList();
      notify('');
    } else if(msg.command==='notify'){
      notify(msg.message||'');
    } else if(msg.command==='saveResult'){
      if(msg.ok){ showManager(); notify(''); }
      else { notify(msg.message||'Save failed.'); }
    }
  });
})();
</script>
</body>
</html>`}};function kn(){let u="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<32;e++)u+=t.charAt(Math.floor(Math.random()*t.length));return u}var ge=L(require("vscode")),ot=class{constructor(t){this.providerRegistry=t}provideCodeActions(t,e,s,n){let i=this.providerRegistry.getByDocument(t);if(!i)return[];let r=i.parseDocument(t),o=e instanceof ge.Selection?e.active:e.start,a=!1,c=!1;for(let f of r.classes)if(f.range.contains(o)){c=!0;for(let g of f.members)if(g.range.contains(o)||g.implementationRange?.contains(o)){a=!0;break}break}if(!a){for(let f of r.standaloneProcedures)if(f.range.contains(o)||f.implementationRange?.contains(o)){a=!0;break}}let d=[];a&&d.push({title:"CE: Edit Member",cmd:"mmx.editMember",group:"mmx-member"},{title:"CE: Rename Member",cmd:"mmx.renameMember",group:"mmx-member"},{title:"CE: Delete Member",cmd:"mmx.deleteMember",group:"mmx-member"}),c?d.push({title:"CE: Add Method",cmd:"mmx.addMethod",group:"mmx-add"},{title:"CE: Add Field",cmd:"mmx.addField",group:"mmx-add"},{title:"CE: Add Property",cmd:"mmx.addProperty",group:"mmx-add"},{title:"CE: Add Constructor",cmd:"mmx.addConstructor",group:"mmx-add"}):d.push({title:"CE: Add Method",cmd:"mmx.addMethod",group:"mmx-add"}),d.push({title:"CE: Insert Template",cmd:"mmx.insertTemplate",group:"mmx-general"},{title:"CE: Synchronize Decl/Impl",cmd:"mmx.synchronizeDeclImpl",group:"mmx-general"}),e.isEmpty||d.push({title:"CE: Extract Method",cmd:"mmx.extractMethod",group:"mmx-general"});let l=new Set(d.map(f=>f.group)),p=[];for(let f of l){let g=d.filter(v=>v.group===f);for(let v of g){let h=new ge.CodeAction(v.title,ge.CodeActionKind.Refactor);h.command={command:v.cmd,title:v.title},h.isPreferred=!1,p.push(h)}}return p}};var Q=L(require("vscode"));var at=class{constructor(t){this.registry=t}_onDidChangeCodeLenses=new Q.EventEmitter;onDidChangeCodeLenses=this._onDidChangeCodeLenses.event;refresh(){this._onDidChangeCodeLenses.fire()}provideCodeLenses(t){if(!Q.workspace.getConfiguration("mmx").get("enableCodeLens",!0))return[];let e=this.registry.getByDocument(t);if(!e)return[];let s=e.parseDocument(t),n=[];for(let i of s.classes){let r=i.members.filter(p=>p.kind==="method"||p.kind==="constructor").length,o=i.members.filter(p=>p.kind==="field").length,a=i.members.filter(p=>p.kind==="property").length,c=i.classType||(i.isInterface?"interface":i.isRecord?"record":"class"),d=[];r>0&&d.push(`${r} method${r>1?"s":""}`),o>0&&d.push(`${o} field${o>1?"s":""}`),a>0&&d.push(`${a} propert${a>1?"ies":"y"}`);let l=d.length>0?d.join(", "):"empty";n.push(new Q.CodeLens(new Q.Range(i.range.start.line,0,i.range.start.line,0),{command:"mmx.goToMember",title:`$(symbol-class) ${c} ${i.name} \u2014 ${l}`}));for(let p of i.members){let f=this.buildMemberLens(p,i);f&&n.push(f)}}return n}buildMemberLens(t,e){let s=t.range.start.line,n=new Q.Range(s,0,s,0);if(t.modifiers.includes("override")||t.isOverride)return new Q.CodeLens(n,{command:"mmx.navigateToMember",title:"$(arrow-up) overrides parent",arguments:[t.range.start]});if(t.isAbstract)return new Q.CodeLens(n,{command:"mmx.navigateToMember",title:"$(circle-outline) abstract \u2014 must be implemented",arguments:[t.range.start]});if(t.isStatic)return new Q.CodeLens(n,{command:"mmx.navigateToMember",title:"$(symbol-keyword) static",arguments:[t.range.start]});if(t.isVirtual)return new Q.CodeLens(n,{command:"mmx.navigateToMember",title:"$(zap) virtual \u2014 can be overridden",arguments:[t.range.start]});if(t.kind==="constructor")return new Q.CodeLens(n,{command:"mmx.navigateToMember",title:"$(zap) constructor",arguments:[t.range.start]})}};var j=L(require("vscode")),ct="application/vnd.code.tree.mmxCodeExplorer",dt=class{constructor(t){this.refreshFn=t}dropMimeTypes=[ct];dragMimeTypes=[ct];handleDrag(t,e){let s=t.filter(n=>n&&!("members"in n.itemData));s.length!==0&&e.set(ct,new j.DataTransferItem(s))}async handleDrop(t,e){let s=e.get(ct);if(!s)return;let n=s.value;if(!t||n.length===0)return;let i=t.itemData;if(!("kind"in i))return;let r=j.window.activeTextEditor;if(!r)return;let o=r.document,a=t.parentClass;if(a){for(let c of n){let d=c.itemData;"kind"in d&&c.parentClass?.name===a.name&&d.id!==i.id&&await this.moveMember(o,d,i)}this.refreshFn()}}async moveMember(t,e,s){let n=e.range.start.line,i=e.range.end.line;e.implementationRange&&e.implementationRange.end.line>i&&(i=e.implementationRange.end.line);let r=[];for(let d=n;d<=i;d++)r.push(t.lineAt(d).text);let o=r.join(`
`)+`
`,a=s.range.start.line,c=new j.WorkspaceEdit;a>i?(c.insert(t.uri,new j.Position(a+1,0),o),c.delete(t.uri,new j.Range(new j.Position(n,0),new j.Position(i+1,0)))):(c.delete(t.uri,new j.Range(new j.Position(n,0),new j.Position(i+1,0))),c.insert(t.uri,new j.Position(a,0),o)),await j.workspace.applyEdit(c)}};var V=L(require("vscode"));async function At(u){let t=V.window.activeTextEditor;if(!t){V.window.showWarningMessage("No active editor.");return}let e=u.getByDocument(t.document);if(!e){V.window.showWarningMessage("No provider for this file.");return}V.window.showInformationMessage("Scanning workspace for dead code...");let n=`**/*.{${e.fileExtensions.map(f=>f.substring(1)).join(",")}}`,i=await V.workspace.findFiles(n,"**/node_modules/**"),r=new Map,o=new Map,a=[];for(let f of i)try{let g=await V.workspace.openTextDocument(f),v=u.getByDocument(g);if(!v)continue;let h=v.parseDocument(g),y=g.getText();a.push(y);for(let b of h.classes){o.set(b.name,{file:f.fsPath,line:b.range.start.line});for(let x of b.members)(x.kind==="method"||x.kind==="constructor")&&r.set(`${b.name}::${x.name}`,{file:f.fsPath,line:x.range.start.line,className:b.name})}}catch{}let c=a.join(`
`),d=[];for(let[f,g]of r){let v=f.split("::")[1];c.split(v).length-1<=1&&d.push({kind:"method",name:v,file:g.file,line:g.line,className:g.className})}for(let[f,g]of o)c.split(f).length-1<=1&&d.push({kind:"class",name:f,file:g.file,line:g.line});if(d.length===0){V.window.showInformationMessage("No dead code detected");return}let l=d.map(f=>({label:`${f.kind==="method"?"$(symbol-method)":"$(symbol-class)"} ${f.name}`,description:f.file.split(/[/\\]/).pop(),item:f})),p=await V.window.showQuickPick(l,{placeHolder:`${d.length} potentially unused item(s) found`});if(p){let f=await V.workspace.openTextDocument(V.Uri.file(p.item.file)),g=await V.window.showTextDocument(f),v=new V.Position(p.item.line,0);g.selection=new V.Selection(v,v),g.revealRange(new V.Range(v,v),V.TextEditorRevealType.InCenter)}}var ve=L(require("vscode"));var Ee=class{constructor(t){this.registry=t}static providedCodeActionKinds=[ve.CodeActionKind.QuickFix];provideCodeActions(t,e){let s=this.registry.getByDocument(t);if(!s)return[];let n=[],i=s.parseDocument(t);for(let r of i.classes)for(let o of r.members){if(!o.range.contains(e))continue;let a=t.lineAt(o.range.start.line).text;if(o.kind==="method"&&a.includes("{")&&a.includes("}")){let c=new ve.WorkspaceEdit;c.replace(t.uri,o.range,a.replace("{}",`{
  // TODO: implement
}`)),n.push({title:"Generate method body",kind:ve.CodeActionKind.QuickFix,edit:c})}o.kind==="field"&&(r.members.some(d=>d.name.toLowerCase()===o.name.toLowerCase()&&d.kind==="property")||n.push({title:"Generate getter/setter",kind:ve.CodeActionKind.QuickFix,command:{command:"ce.generateGettersSetters",title:"Generate Getters/Setters",arguments:[]}}))}return n}};var H=L(require("vscode"));async function Nt(u,t,e,s){let n=u.filter(b=>"kind"in b.itemData&&b.parentClass);if(n.length===0){H.window.showWarningMessage("No member items selected for batch move.");return}let i=H.window.activeTextEditor;if(!i){H.window.showWarningMessage("No active editor.");return}let r=i.document,o=t.getByDocument(r);if(!o){H.window.showWarningMessage("No language provider for this file type.");return}let a=o.parseDocument(r),c=n[0].parentClass.name,d=a.classes.filter(b=>b.name!==c);if(d.length===0){H.window.showWarningMessage("No other classes to move to.");return}let l=d.map(b=>{let x=b.classType?` (${b.classType})`:b.isInterface?" (interface)":b.isRecord?" (record)":"";return{label:b.name+x,className:b.name}}),p=await H.window.showQuickPick(l.map(b=>b.label),{placeHolder:`Move ${n.length} member(s) to which class?`});if(!p)return;let f=l.find(b=>b.label===p);if(!f)return;let g=f.className,v=n.map(b=>b.itemData.name).join(", ");if(await H.window.showWarningMessage(`Move ${n.length} member(s) (${v}) from ${c} to ${g}?`,{modal:!0},"Move")!=="Move")return;let y=0;for(let b of n){let x=b.itemData,C=b.parentClass;if(!await e.deleteMember(r,C,x))continue;let k=o.parseDocument(r).classes.find($=>$.name===g);if(!k)continue;let M=!1;if(x.kind==="method"||x.kind==="constructor"||x.kind==="destructor"){let $={kind:x.kind,name:x.name,returnType:x.returnType||void 0,visibility:x.visibility,parameters:x.parameters,modifiers:[],isStatic:x.isStatic,isVirtual:x.isVirtual,isAbstract:x.isAbstract,isOverride:x.isOverride,isFinal:!1},O=o.generateMethod(k.name,$,k);M=await ee(r,o,O)}else if(x.kind==="field"){let $={kind:"field",name:x.name,type:x.type||o.getTypeDefaults().defaultFieldType,visibility:x.visibility},O=o.generateField(k.name,$,k);M=await ee(r,o,O)}else if(x.kind==="property"){let $={kind:"property",name:x.name,type:x.type||o.getTypeDefaults().defaultPropertyType,visibility:x.visibility,hasGetter:!0,hasSetter:!0,isDefault:!1,isReadOnly:!1},O=o.generateProperty(k.name,$,k);M=await ee(r,o,O)}M&&y++}s.refresh(),y>0?H.window.showInformationMessage(`Batch move: ${y} member(s) moved to ${g}.`):H.window.showErrorMessage("Batch move: failed to move any members.")}async function Vt(u,t,e,s){let n=u.filter(h=>"kind"in h.itemData?h.itemData.kind==="field":!1);if(n.length===0){H.window.showWarningMessage("No field items selected for batch getter/setter generation.");return}let i=H.window.activeTextEditor;if(!i){H.window.showWarningMessage("No active editor.");return}let r=i.document,o=t.getByDocument(r);if(!o){H.window.showWarningMessage("No language provider for this file type.");return}let a=[{label:"Getter and Setter",mode:"both"},{label:"Getter only",mode:"getter"},{label:"Setter only",mode:"setter"}],c=await H.window.showQuickPick(a,{title:"CE: Batch Generate Getters/Setters",placeHolder:"What should be generated?"});if(!c)return;let d=c.mode!=="setter",l=c.mode!=="getter",p=["java","csharp","typescript","javascript","javascriptreact"],f=h=>{if(p.includes(o.languageId)){let y=h.replace(/^_+/,"");return y?y.charAt(0).toUpperCase()+y.slice(1):h}return h},g=new Map;for(let h of n){let y=h.itemData,b=h.parentClass,x=g.get(b.name)??[];x.push({cls:b,field:y}),g.set(b.name,x)}let v=0;for(let[h,y]of g){let b=[],x;for(let k of y){x=k.cls;let M={kind:"property",name:f(k.field.name),type:k.field.type||o.getTypeDefaults().defaultPropertyType,visibility:"public",hasGetter:d,hasSetter:l,isDefault:!1,isReadOnly:!l},$=o.generateProperty(h,M,k.cls);$.declaration&&(b.push($.declaration.replace(/\n$/,"")),v++)}if(b.length===0||!x)continue;let C=o.getInsertPosition(r,x,"property").declaration,m={declaration:`
`+b.join(`
`)+`
`,implementation:"",declarationPosition:C,implementationPosition:C};if(!await ee(r,o,m))return}v>0?(s.refresh(),H.window.showInformationMessage("CE: Generated "+v+" accessor(s).")):H.window.showInformationMessage("CE: No accessors were generated.")}var le=L(require("vscode"));async function Bt(u){let t=le.window.activeTextEditor;if(!t){le.window.showWarningMessage("No active editor.");return}let e=u.getByDocument(t.document);if(!e){le.window.showWarningMessage("No provider for this file.");return}let s=e.parseDocument(t.document),n={exportedAt:new Date().toISOString(),fileName:t.document.fileName,language:e.displayName,classes:s.classes.map(o=>({name:o.name,classType:o.classType,parentClass:o.parentClass,interfaces:o.interfaces,isInterface:o.isInterface,isRecord:o.isRecord,members:o.members.map(a=>({name:a.name,kind:a.kind,returnType:a.returnType,type:a.type,visibility:a.visibility,parameters:a.parameters.map(c=>({name:c.name,type:c.type})),modifiers:a.modifiers,isStatic:a.isStatic,line:a.range.start.line})),startLine:o.range.start.line,endLine:o.range.end.line})),imports:s.imports,standaloneFunctions:s.standaloneProcedures.map(o=>({name:o.name,returnType:o.returnType,parameters:o.parameters.map(a=>({name:a.name,type:a.type})),line:o.range.start.line}))},i=JSON.stringify(n,null,2),r=await le.workspace.openTextDocument({content:i,language:"json"});await le.window.showTextDocument(r),le.window.showInformationMessage("Structure exported to new tab")}var q=L(require("vscode"));function Rn(u,t){let e=[];e.push(`# API Documentation \u2014 ${t}`),e.push(""),e.push(`Generated on ${new Date().toLocaleDateString()}`),e.push("");for(let s of u.classes){let n=s.classType||(s.isInterface?"Interface":s.isRecord?"Record":"Class");e.push(`## ${n} ${s.name}`),s.parentClass&&e.push(`> Extends: \`${s.parentClass}\``),s.interfaces.length&&e.push(`> Implements: ${s.interfaces.map(r=>`\`${r}\``).join(", ")}`),e.push("");let i={constructors:s.members.filter(r=>r.kind==="constructor"),fields:s.members.filter(r=>r.kind==="field"),properties:s.members.filter(r=>r.kind==="property"),methods:s.members.filter(r=>r.kind==="method"),destructors:s.members.filter(r=>r.kind==="destructor")};if(i.constructors.length){e.push("### Constructors");for(let r of i.constructors){let o=r.parameters.map(a=>`${a.name}: ${a.type}`).join(", ");e.push(`- **${r.visibility}** \`${s.name}(${o})\``)}e.push("")}if(i.fields.length){e.push("### Fields");for(let r of i.fields)e.push(`- **${r.visibility}** ${r.name}: \`${r.type||"unknown"}\``);e.push("")}if(i.properties.length){e.push("### Properties");for(let r of i.properties)e.push(`- **${r.visibility}** ${r.name}: \`${r.type||"unknown"}\``);e.push("")}if(i.methods.length){e.push("### Methods");for(let r of i.methods){let o=r.parameters.map(d=>`${d.name}: ${d.type}`).join(", "),a=r.returnType?`: ${r.returnType}`:"",c=r.isStatic?"static ":"";e.push(`- **${r.visibility}** ${c}\`${r.name}(${o})${a}\``)}e.push("")}if(i.destructors.length){e.push("### Destructors");for(let r of i.destructors)e.push(`- \`${r.name}\``);e.push("")}}return e.join(`
`)}async function Ut(u){let t=q.window.activeTextEditor;if(!t){q.window.showWarningMessage("No active editor.");return}let e=u.getByDocument(t.document);if(!e){q.window.showWarningMessage("No provider for this file.");return}let s=e.parseDocument(t.document),n=Rn(s,t.document.fileName),i=await q.window.showQuickPick(["Open in Editor","Copy to Clipboard","Save to File"],{placeHolder:"How to output documentation?"});if(i==="Open in Editor"){let r=await q.workspace.openTextDocument({content:n,language:"markdown"});await q.window.showTextDocument(r)}else if(i==="Copy to Clipboard")await q.env.clipboard.writeText(n),q.window.showInformationMessage("Documentation copied to clipboard");else if(i==="Save to File"){let r=await q.window.showSaveDialog({defaultUri:q.Uri.file("API.md"),filters:{Markdown:["md"]}});r&&(await q.workspace.fs.writeFile(r,Buffer.from(n)),q.window.showInformationMessage("Documentation saved"))}}var J=L(require("vscode"));function Dn(u,t){let e=[],s=t.parseDocument(u),n=u.fileName.split(/[/\\]/).pop()||u.fileName;for(let o of s.classes){o.members.length>15&&e.push({severity:"warning",category:"Size",message:`${o.name} has ${o.members.length} members (consider splitting)`,file:n,line:o.range.start.line,className:o.name});let a=o.members.filter(c=>{let d=u.lineAt(c.range.start.line).text;return d.includes("todo!()")||d.includes("TODO")||d.includes("NotImplemented")});for(let c of a)e.push({severity:"info",category:"Stub",message:`${c.name} has unimplemented body`,file:n,line:c.range.start.line,className:o.name,memberName:c.name});for(let c of o.members){let d=c.range.end.line-c.range.start.line+1;d>30&&e.push({severity:"warning",category:"Complexity",message:`${c.name} is ${d} lines long`,file:n,line:c.range.start.line,className:o.name,memberName:c.name}),c.visibility==="public"&&c.kind==="field"&&e.push({severity:"warning",category:"Encapsulation",message:`Public field ${c.name} should be private with accessors`,file:n,line:c.range.start.line,className:o.name,memberName:c.name})}}let i=u.getText(),r=i.match(/(?:TODO|FIXME|HACK|XXX)[^;{}]*/gi)||[];for(let o of r){let a=i.indexOf(o),c=u.positionAt(a).line;e.push({severity:"info",category:"TODO",message:o.substring(0,60),file:n,line:c})}return e}async function Gt(u){let t=J.window.activeTextEditor;if(!t){J.window.showWarningMessage("No active editor.");return}let e=u.getByDocument(t.document);if(!e){J.window.showWarningMessage("No provider for this file.");return}let s=Dn(t.document,e);if(s.length===0){J.window.showInformationMessage("No issues found!");return}let n=s.map(r=>({label:`${r.severity==="error"?"\u274C":r.severity==="warning"?"\u26A0\uFE0F":"\u2139\uFE0F"} ${r.category}: ${r.message}`,description:`Line ${r.line+1}`,finding:r})),i=await J.window.showQuickPick(n,{placeHolder:`${s.length} issue(s) found`});if(i){let r=new J.Position(i.finding.line,0);t.selection=new J.Selection(r,r),t.revealRange(new J.Range(r,r),J.TextEditorRevealType.InCenter)}}var _,A,re,he,jt,yt,Wt,lt,S;async function Fn(u){console.log("[MMX] activate() called"),console.log("[MMX] __dirname:",__dirname),console.log("[MMX] workspace:",w.workspace.workspaceFolders?.map(e=>e.uri.fsPath));let t=w.window.createOutputChannel("Code Explorer");t.appendLine("Code Explorer: activating..."),S=t,u.subscriptions.push(t),kt(t),Et(u);try{yt=u,console.log("[MMX] Creating ProviderRegistry..."),_=new We,console.log("[MMX] Creating CodeExplorerService..."),A=new ze,console.log("[MMX] Creating CodeGeneratorService..."),re=new He,console.log("[MMX] All services created"),console.log("[MMX] Creating TemplateService..."),he=new tt(u),await he.load(),he.startWatching(),u.subscriptions.push(he),jt=new st(u),t.appendLine("Providers: "+_.getAllProviders().map(f=>f.displayName).join(", ")),console.log("[MMX] Providers:",_.getAllProviders().map(f=>f.displayName).join(", "));for(let f of _.getAllProviders())A.registerProvider(f),re.registerProvider(f);let s=new it(he,_),n=[];for(let f of _.getSupportedExtensions())n.push({scheme:"file",pattern:"**/*"+f});u.subscriptions.push(w.languages.registerCompletionItemProvider(n,s));let i=new ot(_),r=[];for(let f of _.getSupportedExtensions())r.push({scheme:"file",pattern:"**/*"+f});u.subscriptions.push(w.languages.registerCodeActionsProvider(r,i,{providedCodeActionKinds:[w.CodeActionKind.Refactor]}));let o=new Ee(_),a=[];for(let f of _.getSupportedExtensions())a.push({scheme:"file",pattern:"**/*"+f});u.subscriptions.push(w.languages.registerCodeActionsProvider(a,o,{providedCodeActionKinds:Ee.providedCodeActionKinds})),w.commands.executeCommand("setContext","mmx:isActive",!0),console.log("[MMX] Creating tree views...");let c=new dt(()=>A.refresh()),d=w.window.createTreeView("mmxCodeExplorer",{treeDataProvider:A,showCollapseAll:!0,dragAndDropController:c});console.log("[MMX] Tree views created");let l=new at(_),p=w.languages.registerCodeLensProvider({scheme:"file"},l);u.subscriptions.push(p),u.subscriptions.push(d),console.log("[MMX] Creating MemberViewerPanel..."),Wt=new Pe(u.extensionUri,_,A,re,u),u.subscriptions.push(w.window.registerWebviewViewProvider(Pe.viewType,Wt)),console.log("[MMX] MemberViewerPanel created"),console.log("[MMX] Creating DashboardPanel..."),lt=new $e(u.extensionUri,_,A),u.subscriptions.push(w.window.registerWebviewViewProvider($e.viewType,lt)),u.subscriptions.push(w.window.onDidChangeTextEditorSelection(f=>lt.scheduleCursorUpdate(f.textEditor)),w.window.onDidChangeActiveTextEditor(f=>{f&&lt.scheduleCursorUpdate(f)})),console.log("[MMX] DashboardPanel created"),Ln(u),console.log("[MMX] Commands registered"),w.window.activeTextEditor&&A.refresh(),t.appendLine("Code Explorer: activated successfully"),console.log("[MMX] ACTIVATED SUCCESSFULLY"),w.window.showInformationMessage("Code Explorer activated \u2713")}catch(e){let s=e instanceof Error?e.message:String(e),n=e instanceof Error&&e.stack?e.stack:"";console.error("[MMX] FATAL:",s,n),t.appendLine("FATAL: "+s),t.appendLine(n),w.window.showErrorMessage("Code Explorer failed: "+s)}}function Ln(u){u.subscriptions.push(w.commands.registerCommand("mmx.testMinimal",async()=>{console.log("[MMX] testMinimal command fired");let t=w.window.activeTextEditor;if(!t){w.window.showErrorMessage("No active editor");return}let e=_.getByDocument(t.document);if(!e){w.window.showErrorMessage("No provider for language: "+t.document.languageId);return}let s=e.parseDocument(t.document),n=s.classes.length,i=s.classes.map(r=>r.name).join(", ");if(w.window.showInformationMessage("CE Test: Found "+n+" class(es): "+i),n>0){let r=s.classes[0],o=new w.Position(t.document.lineCount,0),a=new w.WorkspaceEdit;a.insert(t.document.uri,o,`
// CE Test: parsed class `+r.name+" with "+r.members.length+` members
`);let c=await w.workspace.applyEdit(a);w.window.showInformationMessage("Insert test result: "+c)}}),w.commands.registerCommand("mmx.refreshExplorer",()=>{A.refresh()}),w.commands.registerCommand("mmx.navigateToMember",async t=>{let e=w.window.activeTextEditor;e&&t&&(e.selection=new w.Selection(t,t),e.revealRange(new w.Range(t,t),w.TextEditorRevealType.InCenter))}),w.commands.registerCommand("mmx.addMethod",async t=>{console.log("[MMX] mmx.addMethod command fired"),await Se("method",t)}),w.commands.registerCommand("mmx.addField",async t=>{await Se("field",t)}),w.commands.registerCommand("mmx.addProperty",async t=>{await Se("property",t)}),w.commands.registerCommand("mmx.addConstructor",async t=>{await Se("constructor",t)}),w.commands.registerCommand("mmx.editMember",async t=>{S.appendLine("=== mmx.editMember FIRED ==="),S.appendLine("  item provided: "+!!t);let e=bt(t);if(!e){S.appendLine("  resolveFromItemOrCursor returned undefined \u2014 no member found"),S.show(),await w.window.showWarningMessage("Place cursor on a class member first.","Show Details")==="Show Details"&&S.show();return}S.appendLine("  resolved: member="+e.member.name+" kind="+e.member.kind+" cls="+e.cls.name),S.appendLine("  member.range: line="+e.member.range.start.line+" char="+e.member.range.start.character),S.show(),await Xe(yt,e.doc,e.provider,e.cls,e.member,re,A)}),w.commands.registerCommand("mmx.deleteMember",async t=>{S.appendLine("=== mmx.deleteMember FIRED ==="),S.appendLine("  item provided: "+!!t);let e=bt(t);if(!e){S.appendLine("  resolveFromItemOrCursor returned undefined \u2014 no member found"),S.show(),await w.window.showWarningMessage("Place cursor on a class member first.","Show Details")==="Show Details"&&S.show();return}S.appendLine("  resolved: member="+e.member.name+" kind="+e.member.kind+" cls="+e.cls.name),S.appendLine("  member.range: line="+e.member.range.start.line+"-"+e.member.range.end.line),S.show(),await Qe(e.doc,e.cls,e.member,re,A)}),w.commands.registerCommand("mmx.moveMember",async t=>{if(!t||!("kind"in t.itemData)){w.window.showWarningMessage("Select a member in the explorer to move.");return}let e=t.itemData,s=t.parentClass;if(!s){w.window.showWarningMessage("Move Member requires a class member from the explorer.");return}let n=w.window.activeTextEditor;if(!n){w.window.showWarningMessage("No active editor.");return}let i=n.document,r=_.getByDocument(i);if(!r){w.window.showWarningMessage("No language provider for this file type.");return}let a=r.parseDocument(i).classes.filter(b=>b.name!==s.name);if(a.length===0){w.window.showWarningMessage("No other classes to move to.");return}let c=a.map(b=>{let x=b.classType?` (${b.classType})`:b.isInterface?" (interface)":b.isRecord?" (record)":"";return{label:b.name+x,className:b.name}}),d=await w.window.showQuickPick(c.map(b=>b.label),{placeHolder:`Move "${e.name}" to which class?`});if(!d)return;let l=c.find(b=>b.label===d);if(!l)return;let p=l.className;if(await w.window.showWarningMessage(`Move "${e.name}" from ${s.name} to ${p}?`,{modal:!0},"Move")!=="Move")return;if(!await re.deleteMember(i,s,e)){w.window.showErrorMessage("CE: Failed to delete member from source class.");return}let h=r.parseDocument(i).classes.find(b=>b.name===p);if(!h){w.window.showErrorMessage("CE: Destination class not found after re-parse."),A.refresh();return}let y=!1;if(e.kind==="method"||e.kind==="constructor"||e.kind==="destructor"){let b={kind:e.kind,name:e.name,returnType:e.returnType||void 0,visibility:e.visibility,parameters:e.parameters,modifiers:[],isStatic:e.isStatic,isVirtual:e.isVirtual,isAbstract:e.isAbstract,isOverride:e.isOverride,isFinal:!1},x=r.generateMethod(h.name,b,h);y=await be(i,r,x)}else if(e.kind==="field"){let b={kind:"field",name:e.name,type:e.type||r.getTypeDefaults().defaultFieldType,visibility:e.visibility},x=r.generateField(h.name,b,h);y=await be(i,r,x)}else if(e.kind==="property"){let b={kind:"property",name:e.name,type:e.type||r.getTypeDefaults().defaultPropertyType,visibility:e.visibility,hasGetter:!0,hasSetter:!0,isDefault:!1,isReadOnly:!1},x=r.generateProperty(h.name,b,h);y=await be(i,r,x)}y?(A.refresh(),w.window.showInformationMessage(`Moved "${e.name}" from ${s.name} to ${h.name}`)):(A.refresh(),w.window.showErrorMessage("CE: Failed to insert member into destination class."))}),w.commands.registerCommand("mmx.renameMember",async t=>{S.appendLine("=== mmx.renameMember FIRED ==="),S.appendLine("  item provided: "+!!t);let e=bt(t);if(!e){S.appendLine("  resolveFromItemOrCursor returned undefined \u2014 no member found"),S.show(),await w.window.showWarningMessage("Place cursor on a class member first.","Show Details")==="Show Details"&&S.show();return}S.appendLine("  resolved: member="+e.member.name+" kind="+e.member.kind+" cls="+e.cls.name),S.appendLine("  member.range: line="+e.member.range.start.line+" char="+e.member.range.start.character),S.show(),await Je(e.doc,e.cls,e.member,e.provider,A)}),w.commands.registerCommand("mmx.synchronizeDeclImpl",async()=>{let t=w.window.activeTextEditor;if(!t)return;let e=_.getByDocument(t.document);if(!e){w.window.showWarningMessage("No language provider for this file type.");return}let s=e.parseDocument(t.document);if(s.classes.length===0){w.window.showInformationMessage("No classes found in the current document.");return}let n=0;for(let i of s.classes){let r=await re.synchronizeAllMembers(t.document,i);n+=r}n>0?(A.refresh(),w.window.showInformationMessage(`Synchronized ${n} member(s).`)):w.window.showInformationMessage("All members are already synchronized.")}),w.commands.registerCommand("mmx.extractMethod",async()=>{let t=w.window.activeTextEditor;if(!t||t.selection.isEmpty){w.window.showWarningMessage("Select code to extract into a method.");return}let e=_.getByDocument(t.document);if(!e){w.window.showWarningMessage("No language provider for this file type.");return}let s=await w.window.showInputBox({prompt:"Method name:",placeHolder:"extractedMethod"});if(!s)return;let n=await w.window.showInputBox({prompt:"Return type:",placeHolder:e.languageId==="pascal"?"":"void"});if(n===void 0)return;let i=await w.window.showInputBox({prompt:"Parameters (name:type, comma-separated, empty = none):",placeHolder:"x:int, name:string"});if(i===void 0)return;let r=i.trim()?i.split(",").map(a=>a.trim()).filter(Boolean):[];await re.extractMethod(t.document,t.selection,s,r,n||(e.languageId==="pascal"?"":"void"))||w.window.showWarningMessage("CE: Could not extract method for this language.")}),w.commands.registerCommand("mmx.openMemberEditor",async t=>{await Se("method",t)}),w.commands.registerCommand("mmx.showActions",async()=>{let t=[{label:"$(symbol-method) Add Method",description:"",cmd:"mmx.addMethod"},{label:"$(symbol-field) Add Field",description:"",cmd:"mmx.addField"},{label:"$(symbol-property) Add Property",description:"",cmd:"mmx.addProperty"},{label:"$(symbol-constructor) Add Constructor",description:"",cmd:"mmx.addConstructor"},{label:"$(edit) Edit Member",description:"",cmd:"mmx.editMember"},{label:"$(references) Rename Member",description:"",cmd:"mmx.renameMember"},{label:"$(trash) Delete Member",description:"",cmd:"mmx.deleteMember"},{label:"$(fold) Extract Method",description:"",cmd:"mmx.extractMethod"},{label:"$(code) Insert Template",description:"",cmd:"mmx.insertTemplate"},{label:"$(sync) Synchronize Decl/Impl",description:"",cmd:"mmx.synchronizeDeclImpl"},{label:"$(symbol-interface) Implement Interface",description:"",cmd:"mmx.implementInterface"},{label:"$(filter) Filter Members",description:"",cmd:"mmx.filterTree"},{label:"$(go-to-file) Go to Member",description:"",cmd:"mmx.goToMember"},{label:"$(group-by-ref-type) Toggle Grouping",description:"",cmd:"mmx.toggleGroupBy"},{label:"$(refresh) Refresh Explorer",description:"",cmd:"mmx.refreshExplorer"}],e=await w.window.showQuickPick(t,{placeHolder:"CE Actions \u2014 select an action"});e&&await w.commands.executeCommand(e.cmd)}),w.commands.registerCommand("mmx.insertTemplate",async()=>{let t=w.window.activeTextEditor;if(!t){w.window.showWarningMessage("No active editor.");return}let e=_.getByDocument(t.document)?.languageId??t.document.languageId,s=he.getForLanguage(e);if(s.length===0){w.window.showInformationMessage("No CE templates available for language: "+e);return}let n=s.map(r=>({label:r.name,description:r.prefix?`(${r.prefix})`:"",detail:r.description||"",template:r})),i=await w.window.showQuickPick(n,{placeHolder:"Select a template to insert"});i&&await t.insertSnippet(new w.SnippetString(i.template.body))}),w.commands.registerCommand("mmx.manageTemplates",async()=>{await rt.createOrShow(u.extensionUri,jt)}),w.commands.registerCommand("mmx.implementInterface",async t=>{S.appendLine("=== mmx.implementInterface FIRED ===");let e,s,n;if(t&&"members"in t.itemData&&(n=t.itemData,e=w.window.activeTextEditor?.document,s=e?_.getByDocument(e):void 0),!n||!e||!s){let i=w.window.activeTextEditor;if(!i){w.window.showWarningMessage("No active editor.");return}if(e=i.document,s=_.getByDocument(e),!s){w.window.showWarningMessage("No language provider for this file type.");return}let r=s.parseDocument(e),o=i.selection.active;n=s.findClassAtPosition(e,o)??r.classes.find(a=>a.range.contains(o))??r.classes[0]}if(!n){w.window.showInformationMessage("No class found to implement.");return}await Rt(e,s,n,A)}),w.commands.registerCommand("mmx.generateGettersSetters",async t=>{S.appendLine("=== mmx.generateGettersSetters FIRED ===");let e=w.window.activeTextEditor;if(!e){w.window.showWarningMessage("No active editor.");return}let s=e.document,n=_.getByDocument(s);if(!n){w.window.showWarningMessage("No language provider for this file type.");return}let i=[];if(t&&"kind"in t.itemData){let g=t.itemData;g.kind==="field"&&t.parentClass&&i.push({cls:t.parentClass,field:g})}if(i.length===0){let g=n.parseDocument(s);if(g.classes.length===0){w.window.showInformationMessage("No classes found in the current document.");return}let v=[];for(let y of g.classes)for(let b of y.members)b.kind==="field"&&v.push({label:b.name,description:b.type?": "+b.type:"",detail:y.name,picked:!0,target:{cls:y,field:b}});if(v.length===0){w.window.showInformationMessage("No fields found in the current document.");return}let h=await w.window.showQuickPick(v,{canPickMany:!0,title:"CE: Generate Getters/Setters",placeHolder:"Select fields to generate accessors for"});if(!h||h.length===0)return;i=h.map(y=>y.target)}let r=[{label:"Getter and Setter",mode:"both"},{label:"Getter only",mode:"getter"},{label:"Setter only",mode:"setter"}],o=await w.window.showQuickPick(r,{title:"CE: Generate Getters/Setters",placeHolder:"What should be generated?"});if(!o)return;let a=o.mode!=="setter",c=o.mode!=="getter",d=["java","csharp","typescript","javascript","javascriptreact"],l=g=>{if(d.includes(n.languageId)){let v=g.replace(/^_+/,"");return v?v.charAt(0).toUpperCase()+v.slice(1):g}return g},p=new Map;for(let g of i){let v=p.get(g.cls.name)??[];v.push(g),p.set(g.cls.name,v)}let f=0;for(let[g,v]of p){let h=[],y;for(let m of v){y=m.cls;let P={kind:"property",name:l(m.field.name),type:m.field.type||n.getTypeDefaults().defaultPropertyType,visibility:"public",hasGetter:a,hasSetter:c,isDefault:!1,isReadOnly:!c},k=n.generateProperty(g,P,m.cls);k.declaration&&(h.push(k.declaration.replace(/\n$/,"")),f++)}if(h.length===0||!y)continue;let b=n.getInsertPosition(s,y,"property").declaration,x={declaration:`
`+h.join(`
`)+`
`,implementation:"",declarationPosition:b,implementationPosition:b};if(!await ee(s,n,x)){S.appendLine("  [generateGettersSetters] applyGeneratedCode returned false \u2014 aborting");return}}f>0?(A.refresh(),w.window.showInformationMessage("CE: Generated "+f+" accessor(s).")):w.window.showInformationMessage("CE: No accessors were generated.")}),w.commands.registerCommand("mmx.filterTree",async()=>{let t=await w.window.showInputBox({title:"CE: Filter Members",prompt:"Filter the explorer by name (regex supported). Empty clears the filter.",value:A.getFilter(),placeHolder:"e.g. get|set"});t!==void 0&&A.setFilter(t)}),w.commands.registerCommand("mmx.clearFilter",()=>{A.setFilter("")}),w.commands.registerCommand("mmx.toggleGroupBy",()=>{let t=A.cycleGroupBy(),e=t==="visibility"?"Visibility":t==="kind"?"Member kind":"Alphabetical";w.window.showInformationMessage("CE: Grouping by "+e)}),w.commands.registerCommand("mmx.goToMember",async()=>{let t=A.listAllSymbols();if(t.length===0){w.window.showInformationMessage("No symbols found in the active document.");return}let e=t.map(i=>({label:i.label,description:i.description,memberKind:i.kind,position:i.position})),s=await w.window.showQuickPick(e,{placeHolder:"Go to member\u2026",matchOnDescription:!0});if(!s)return;let n=w.window.activeTextEditor;n&&(n.selection=new w.Selection(s.position,s.position),n.revealRange(new w.Range(s.position,s.position),w.TextEditorRevealType.InCenter))}),w.commands.registerCommand("ce.codeMetrics",()=>{Ze.createOrShow(u.extensionUri,_)}),w.commands.registerCommand("ce.detectDeadCode",async()=>{await At(_)}),w.commands.registerCommand("ce.batchMove",async()=>{let t=w.window.activeTextEditor;if(!t){w.window.showWarningMessage("No active editor.");return}let e=t.document,s=_.getByDocument(e);if(!s){w.window.showWarningMessage("No provider for this file type.");return}let n=s.parseDocument(e),i=[];for(let a of n.classes)for(let c of a.members)i.push({label:c.name,description:`${a.name} \u2022 ${c.kind}`,member:c,cls:a});if(i.length===0){w.window.showInformationMessage("No members found in the current file.");return}let r=await w.window.showQuickPick(i,{canPickMany:!0,title:"CE: Batch Move \u2014 Select members to move",placeHolder:"Select one or more members"});if(!r||r.length===0)return;let o=r.map(a=>new ce(a.member,a.cls,s));await Nt(o,_,re,A)}),w.commands.registerCommand("ce.batchGenerateGettersSetters",async()=>{let t=w.window.activeTextEditor;if(!t){w.window.showWarningMessage("No active editor.");return}let e=t.document,s=_.getByDocument(e);if(!s){w.window.showWarningMessage("No provider for this file type.");return}let n=s.parseDocument(e),i=[];for(let a of n.classes)for(let c of a.members)c.kind==="field"&&i.push({label:c.name,description:`${a.name} \u2022 ${c.type||"unknown"}`,member:c,cls:a});if(i.length===0){w.window.showInformationMessage("No fields found in the current file.");return}let r=await w.window.showQuickPick(i,{canPickMany:!0,title:"CE: Batch Generate Getters/Setters \u2014 Select fields",placeHolder:"Select one or more fields"});if(!r||r.length===0)return;let o=r.map(a=>new ce(a.member,a.cls,s));await Vt(o,_,re,A)}),w.commands.registerCommand("ce.exportStructure",async()=>{await Bt(_)}),w.commands.registerCommand("ce.generateDocumentation",async()=>{await Ut(_)}),w.commands.registerCommand("ce.codeReview",async()=>{await Gt(_)}))}async function Se(u,t){console.log("[MMX] addMember called, kind:",u);let e=w.window.activeTextEditor;if(!e){w.window.showWarningMessage("No active editor.");return}let s=e.document,n=_.getByDocument(s);if(!n){w.window.showWarningMessage("No provider for: "+s.languageId+" / "+s.fileName);return}let i=n.parseDocument(s),r=["rust","go","python","typescript","javascript","javascriptreact","pascal","cpp"].includes(n.languageId),o=i.classes.length>0;if(!o&&!r){w.window.showWarningMessage("No classes found in this file.");return}let a,c=!1;if(o){let p=i.classes.map(h=>{let y=h.classType?` (${h.classType})`:h.isInterface?" (interface)":h.isRecord?" (record)":"";return{label:h.name+y,name:h.name,id:h.id}}),f="(File-level function)",g=r?[f,...p.map(h=>h.label)]:p.map(h=>h.label),v=await w.window.showQuickPick(g,{placeHolder:"Select target"});if(!v)return;if(v===f)c=!0;else{let h=p.find(y=>y.label===v);a=i.classes.find(y=>y.id===h?.id)}}else c=!0;if(c){let p=await w.window.showInputBox({prompt:"Function name:",placeHolder:"my_function"});if(!p)return;let f=await w.window.showInputBox({prompt:"Return type:",placeHolder:n.languageId==="python"?"":"void"});if(f===void 0)return;let g=[],v=1;for(;;){let C=await w.window.showInputBox({prompt:"Param "+v+" (name:type, empty=done)",placeHolder:"param:string"});if(C===void 0)return;if(C.trim()==="")break;let m=C.indexOf(":");g.push(m>0?{name:C.substring(0,m).trim(),type:C.substring(m+1).trim()}:{name:C.trim(),type:n.languageId==="python"?"":"string"}),v++}let h=s.lineCount,y=new w.WorkspaceEdit,b="";if(n.languageId==="rust"){let C=g.map(P=>`${P.name}: ${P.type}`).join(", "),m=f?` -> ${f}`:"";b=`
pub fn ${p}(${C})${m} {
    todo!()
}
`}else if(n.languageId==="go"){let C=g.map(P=>`${P.name} ${P.type}`).join(", "),m=f||"";b=`
func ${p}(${C})${m?" "+m:""} {
	// TODO: implement
}
`}else if(n.languageId==="python"){let C=g.map(m=>m.name).join(", ");b=`
def ${p}(${C}):
    pass
`}else if(n.languageId==="pascal"){let C=g.map(z=>`${z.name}: ${z.type}`).join("; "),m=f?`function ${p}(${C}): ${f};`:`procedure ${p}(${C});`,P=f?`function ${p}(${C}): ${f};
begin
  Result := ${f==="Boolean"?"False":"0"};
end;
`:`procedure ${p}(${C});
begin
  // TODO: implement
end;
`,M=s.getText().split(/\r?\n/),$=-1;for(let z=0;z<M.length;z++)if(/^implementation\b/i.test(M[z].trim())){$=z;break}let O=-1;for(let z=0;z<M.length;z++)if(/^(initialization|finalization)\b/i.test(M[z].trim())){O=z;break}if(O<0){for(let z=M.length-1;z>=0;z--)if(/^end\.\s*$/i.test(M[z].trim())){O=z;break}}O<0&&(O=s.lineCount);let te=new w.WorkspaceEdit;$>=0?(te.insert(s.uri,new w.Position($,0),`
${m}

`),te.insert(s.uri,new w.Position(O,0),`
${P}`)):te.insert(s.uri,new w.Position(s.lineCount,0),`
${m}

${P}`),await w.workspace.applyEdit(te)&&(A.refresh(),w.window.showInformationMessage(`CE: Added function "${p}" \u2713`));return}else if(n.languageId==="cpp"){let C=g.map(P=>`${P.type} ${P.name}`).join(", ");b=`
${f&&f!=="void"?f:"void"} ${p}(${C}) {
    // TODO: implement
}
`}else{let C=g.map(P=>`${P.name}: ${P.type}`).join(", "),m=f?`: ${f}`:"";b=`
function ${p}(${C})${m} {
  // TODO: implement
}
`}y.insert(s.uri,new w.Position(h,0),b),await w.workspace.applyEdit(y)&&(A.refresh(),w.window.showInformationMessage(`CE: Added function "${p}" \u2713`));return}if(!a)return;let d=await pe.create(yt,s,n,a,re,u);if(!d){console.log("[MMX] MemberEditorPanel cancelled");return}console.log("[MMX] Form result:",JSON.stringify(d));let l=!1;if(d.kind==="method"||d.kind==="constructor"||d.kind==="destructor"){let p={kind:d.kind,name:d.name,returnType:d.returnType||void 0,visibility:d.visibility,parameters:d.parameters||[],modifiers:[],isStatic:d.isStatic,isVirtual:d.isVirtual,isAbstract:d.isAbstract,isOverride:d.isOverride,isFinal:!1},f=n.generateMethod(a.name,p,a);l=await be(s,n,f)}else if(d.kind==="field"){let p={kind:"field",name:d.name,type:d.type||d.returnType||"int",visibility:d.visibility},f=n.generateField(a.name,p,a);l=await be(s,n,f)}else if(d.kind==="property"){let p={kind:"property",name:d.name,type:d.type||d.returnType||"string",visibility:d.visibility,hasGetter:d.hasGetter,hasSetter:d.hasSetter,getterName:d.getterName,setterName:d.setterName,isDefault:!1,isReadOnly:!1},f=n.generateProperty(a.name,p,a);l=await be(s,n,f)}l?(A.refresh(),w.window.showInformationMessage('CE: Added "'+d.name+'" to '+a.name+" \u2713")):w.window.showErrorMessage('CE: Failed to add "'+d.name+'"')}async function be(u,t,e){return ee(u,t,e)}function ht(u,t){return{id:"standalone_"+u.id,name:"",fullName:"",classType:"standalone",parentClass:void 0,interfaces:[],members:[u],range:u.range,isInterface:!1,isRecord:!1,isSealed:!1,fileUri:t.uri}}function bt(u){if(u&&"kind"in u.itemData){let o=u.itemData,c=w.window.activeTextEditor?.document,d=c?_.getByDocument(c):void 0;if(c&&d){let l=u.parentClass??ht(o,c);return S.appendLine("  [resolve] from tree item: "+o.name+(u.parentClass?" (class "+l.name+")":" (standalone)")),{doc:c,provider:d,cls:l,member:o}}}let t=w.window.activeTextEditor;if(!t){S.appendLine("  [resolve] FAIL: no active editor");return}let e=t.document,s=_.getByDocument(e);if(!s){S.appendLine("  [resolve] active editor has no provider (languageId="+e.languageId+"), trying visible editors");for(let o of w.window.visibleTextEditors){let a=_.getByDocument(o.document);if(a){e=o.document,s=a,S.appendLine("  [resolve] found provider in visible editor: "+e.fileName);break}}}if(!s){S.appendLine("  [resolve] FAIL: no provider found in any visible editor");return}S.appendLine("  [resolve] document: "+e.fileName+" provider: "+s.displayName);let i=(t.document===e?t:w.window.visibleTextEditors.find(o=>o.document===e)||t).selection.active;S.appendLine("  [resolve] cursor: line="+i.line+" char="+i.character);let r=s.parseDocument(e);S.appendLine("  [resolve] parsed "+r.classes.length+" classes");for(let o of r.classes){if(!o.range.contains(i))continue;S.appendLine("  [resolve] cursor is inside class: "+o.name+" (lines "+o.range.start.line+"-"+o.range.end.line+")");for(let d of o.members){let l=d.range.contains(i),p=d.implementationRange?.contains(i);if(S.appendLine("  [resolve]   member: "+d.name+" kind="+d.kind+" decl=lines "+d.range.start.line+"-"+d.range.end.line+(d.implementationRange?" impl=lines "+d.implementationRange.start.line+"-"+d.implementationRange.end.line:"")+" hit="+(l||p)),l||p)return S.appendLine("  [resolve] FOUND member at cursor: "+d.name),{doc:e,provider:s,cls:o,member:d}}S.appendLine("  [resolve] no exact match \u2014 scanning backwards for nearest member above cursor");let a,c=-1;for(let d of o.members){let l=Math.max(d.range.end.line,d.implementationRange?.end.line??d.range.end.line);if(d.range.start.line<=i.line&&d.range.start.line>c){let p=d.range.end.line,f=d.implementationRange?.end.line??-1,g=Math.max(p,f);(d.range.start.line<=i.line&&i.line<=g+5||d.range.start.line<=i.line&&(!a||d.range.start.line>c))&&(a=d,c=d.range.start.line)}}if(a)return S.appendLine("  [resolve] NEAREST member above cursor: "+a.name+" (line "+a.range.start.line+")"),{doc:e,provider:s,cls:o,member:a};S.appendLine("  [resolve] FAIL: no member found for cursor position in class "+o.name);return}S.appendLine("  [resolve] cursor not inside any class \u2014 checking "+r.standaloneProcedures.length+" standalone procedures");for(let o of r.standaloneProcedures){let a=o.range.contains(i),c=o.implementationRange?.contains(i);if(a||c){S.appendLine("  [resolve] FOUND standalone procedure at cursor: "+o.name);let d=ht(o,e);return{doc:e,provider:s,cls:d,member:o}}}if(r.standaloneProcedures.length>0){let o,a=1/0;for(let c of r.standaloneProcedures){let d=[c.range,...c.implementationRange?[c.implementationRange]:[]];for(let l of d)if(i.line<l.start.line){let p=l.start.line-i.line;p<a&&(o=c,a=p)}else if(i.line>l.end.line){let p=i.line-l.end.line;p<a&&(o=c,a=p)}else{o=c,a=0;break}if(a===0)break}if(o&&a<=3){S.appendLine("  [resolve] NEAREST standalone procedure: "+o.name+" (distance="+a+")");let c=ht(o,e);return{doc:e,provider:s,cls:c,member:o}}}S.appendLine("  [resolve] FAIL: cursor not inside any class or standalone procedure")}function _n(){w.commands.executeCommand("setContext","mmx:isActive",!1)}0&&(module.exports={activate,deactivate});
