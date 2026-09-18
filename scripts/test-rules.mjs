import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, terminate } from 'firebase/firestore';
const projectId='demo-ielts-mastery';
const teacherId='GltgUK9bkuZTmVfTi3RhzddrU7X2';
const apps=[];const clients=[];
function client(uid){const app=initializeApp({projectId,apiKey:'demo-key'},uid);apps.push(app);const db=getFirestore(app);clients.push(db);connectFirestoreEmulator(db,'127.0.0.1',8088,{mockUserToken:{sub:uid,email:uid+'@example.test'}});return db}
const a=client('student-a'),b=client('student-b'),t=client(teacherId),t2=client('teacher-two');
let passed=0;
async function ok(label,action){await action();passed++;console.log('PASS '+label)}
async function denied(label,action){await assert.rejects(action,err=>err.code==='permission-denied');passed++;console.log('PASS denied: '+label)}
try {
 for(const [db,uid,role] of [[a,'student-a','student'],[b,'student-b','student'],[t,teacherId,'teacher']])await ok('Create '+role+' profile',()=>setDoc(doc(db,'users',uid),{name:uid,email:uid+'@example.test',role,teacherId,createdAt:serverTimestamp()}));
 const invite='Teacher2026++';
 await denied('Legacy invitation settings cannot be changed',()=>setDoc(doc(t,'settings','teacherAccess'),{code:invite,updatedAt:serverTimestamp()}));
 await denied('Student cannot read invitation code',()=>getDoc(doc(a,'settings','teacherAccess')));
 await denied('Student cannot change invitation code',()=>setDoc(doc(a,'settings','teacherAccess'),{code:invite,updatedAt:serverTimestamp()}));
 await denied('Wrong invitation code rejected',()=>setDoc(doc(t2,'teacherMemberships','teacher-two'),{inviteCode:'wrong'}));
 await denied('Teacher role without code rejected',()=>setDoc(doc(t2,'users','teacher-two'),{name:'Teacher Two',email:'teacher-two@example.test',role:'teacher',teacherId,createdAt:serverTimestamp()}));
 await ok('New teacher redeems invitation',()=>setDoc(doc(t2,'teacherMemberships','teacher-two'),{inviteCode:invite}));
 await ok('New teacher creates profile',()=>setDoc(doc(t2,'users','teacher-two'),{name:'Teacher Two',email:'teacher-two@example.test',role:'teacher',teacherId,createdAt:serverTimestamp()}));
 await denied('Membership proof is not readable',()=>getDoc(doc(t2,'teacherMemberships','teacher-two')));
 await denied('Student changes role',()=>updateDoc(doc(a,'users','student-a'),{role:'teacher'}));
 const essay={ownerId:'student-a',studentName:'student-a',teacherId,promptId:'education-1',title:'Practice',prompt:'Discuss technology.',text:'Learning improves with deliberate practice. '.repeat(60),wordCount:300,status:'draft',feedback:'',scores:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp(),submittedAt:null};
 await ok('Save draft',()=>setDoc(doc(a,'essays','essay-a'),essay));
 await ok('Owner can reload draft',async()=>assert.equal((await getDoc(doc(a,'essays','essay-a'))).data().status,'draft'));
 await denied('Other student reads draft',()=>getDoc(doc(b,'essays','essay-a')));
 await denied('Teacher reads unsubmitted draft',()=>getDoc(doc(t,'essays','essay-a')));
 await denied('Student self-grades draft',()=>updateDoc(doc(a,'essays','essay-a'),{scores:[9,9,9,9]}));
 await denied('Student redirects to another teacher',()=>updateDoc(doc(a,'essays','essay-a'),{teacherId:'someone-else',updatedAt:serverTimestamp()}));
 await ok('Submit automatically to sole teacher',()=>updateDoc(doc(a,'essays','essay-a'),{status:'submitted',submittedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await ok('All teachers see shared submission queue',async()=>assert.equal((await getDocs(query(collection(t2,'essays'),where('status','in',['submitted','reviewed'])))).size,1));
 await ok('Teacher can list submitted works',async()=>assert.equal((await getDocs(query(collection(t,'essays'),where('teacherId','==',teacherId),where('status','in',['submitted','reviewed'])))).size,1));
 await denied('Other student reads submitted work',()=>getDoc(doc(b,'essays','essay-a')));
 await denied('Owner edits submitted text',()=>updateDoc(doc(a,'essays','essay-a'),{text:'changed',updatedAt:serverTimestamp()}));
 await denied('Teacher alters student essay',()=>updateDoc(doc(t,'essays','essay-a'),{text:'changed',updatedAt:serverTimestamp()}));
 await denied('Teacher submits invalid score',()=>updateDoc(doc(t,'essays','essay-a'),{scores:[10,7,7,7],feedback:'Good work',status:'reviewed',updatedAt:serverTimestamp(),reviewedAt:serverTimestamp()}));
 await ok('Teacher grades without approval or codes',()=>updateDoc(doc(t,'essays','essay-a'),{scores:[7,6.5,7,6.5],feedback:'Develop your second example.',status:'reviewed',updatedAt:serverTimestamp(),reviewedAt:serverTimestamp()}));
 await ok('Second teacher can send feedback',()=>updateDoc(doc(t2,'essays','essay-a'),{scores:[7,6.5,7,6.5],feedback:'Develop your second example.',status:'reviewed',updatedAt:serverTimestamp(),reviewedAt:serverTimestamp()}));
 await ok('Student feedback has no reviewer identity',async()=>{const data=(await getDoc(doc(a,'essays','essay-a'))).data();assert.equal(data.reviewerName,undefined);assert.equal(data.reviewerId,undefined)});
 await ok('Owner reads feedback',async()=>assert.equal((await getDoc(doc(a,'essays','essay-a'))).data().feedback,'Develop your second example.'));
 await denied('Student changes feedback',()=>updateDoc(doc(a,'essays','essay-a'),{feedback:'fake',updatedAt:serverTimestamp()}));
 const material={title:'Teacher lesson',category:'Writing',description:'A clear lesson',time:8,exercise:'Write a paragraph.',sections:[{title:'Introduction',text:'Explain your position.',example:''}],createdBy:teacherId,createdAt:serverTimestamp()};
 await ok('Teacher adds lesson',()=>setDoc(doc(t,'lessons','custom-lesson'),material));
 await ok('Teacher adds maximum 6 sections',()=>setDoc(doc(t,'lessons','long-lesson'),{...material,sections:Array.from({length:6},()=>({title:'A section',text:'Detailed lesson content.',example:''}))}));
 await ok('Student reads teacher lesson',async()=>assert.equal((await getDoc(doc(a,'lessons','custom-lesson'))).data().title,'Teacher lesson'));
 await denied('Student adds lesson',()=>setDoc(doc(a,'lessons','forged'),{...material,createdBy:'student-a'}));
 await denied('Invalid lesson section rejected',()=>setDoc(doc(t,'lessons','invalid'),{...material,sections:[{title:'',text:'',example:''}]}));
 const question={title:'Teacher prompt',category:'Education',type:'Opinion essay',prompt:'Do schools need more practical lessons?',createdBy:teacherId,createdAt:serverTimestamp()};
 await ok('Teacher adds practice question',()=>setDoc(doc(t,'prompts','custom-prompt'),question));
 await ok('Student reads practice question',async()=>assert.equal((await getDoc(doc(b,'prompts','custom-prompt'))).data().prompt,question.prompt));
 await denied('Student adds practice question',()=>setDoc(doc(b,'prompts','forged'),{...question,createdBy:'student-b'}));
 await denied('Teacher cannot submit student essay',()=>setDoc(doc(t,'essays','teacher-essay'),{...essay,ownerId:teacherId,studentName:teacherId}));
 console.log(`\n${passed} rule checks passed.`);
}finally {await Promise.all(clients.map(terminate));await Promise.all(apps.map(deleteApp))}
