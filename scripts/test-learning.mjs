import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, getDocs, collection, query, where, serverTimestamp, Timestamp, writeBatch, terminate } from 'firebase/firestore';
const apps=[],dbs=[];const uid='learning-student',tid='GltgUK9bkuZTmVfTi3RhzddrU7X2';
function client(id){const app=initializeApp({projectId:'demo-ielts-mastery',apiKey:'demo'},id);apps.push(app);const db=getFirestore(app);dbs.push(db);connectFirestoreEmulator(db,'127.0.0.1',8088,{mockUserToken:{sub:id,email:id+'@example.test'}});return db}
const student=client(uid),teacher=client(tid),other=client('learning-other');let count=0;
async function pass(label,fn){await fn();count++;console.log('PASS '+label)}
async function deny(label,fn){await assert.rejects(fn,e=>e.code==='permission-denied');count++;console.log('PASS denied '+label)}
const course=JSON.parse(fs.readFileSync('src/course.ts','utf8').replace('export const courseLessons = ','').trim().replace(/;$/,''));const activities=JSON.parse(fs.readFileSync('src/activitySeeds.ts','utf8').split('= ').slice(1).join('= ').trim().replace(/;$/,''));const data=fs.readFileSync('src/data.ts','utf8');const prompts=vm.runInNewContext(data.slice(data.indexOf('export const prompts'),data.indexOf('export const lessons')).replace('export const','const')+'prompts');
try{
 await pass('Create real student record',()=>setDoc(doc(student,'users',uid),{name:'Student',email:uid+'@example.test',role:'student',teacherId:tid,createdAt:serverTimestamp()}));
 await pass('Seed all database curriculum materials',async()=>{for(const [kind,records] of [['prompts',prompts],['lessons',course],['activities',activities]])for(const record of records){const {id,...d}=record;if(kind==='lessons')d.sections=d.sections.map(s=>({...s,example:s.example||''}));await setDoc(doc(teacher,kind,id),{...d,createdBy:tid,createdAt:serverTimestamp()})}});
 await pass('All 34 course lessons query from database',async()=>assert.equal((await getDocs(collection(student,'lessons'))).docs.filter(s=>s.id.startsWith('course-')).length,34));
 await pass('Teacher can query student profiles',async()=>assert.ok((await getDocs(query(collection(teacher,'users'),where('role','==','student')))).docs.some(s=>s.id===uid)));
 await deny('Students cannot query peers',()=>getDocs(query(collection(student,'users'),where('role','==','student'))));
 const activity=activities.find(a=>a.lessonId==='course-02');const attempt={ownerId:uid,activityId:activity.id,lessonId:'course-02',answers:activity.questions.map(q=>q.answer),submitted:true,updatedAt:serverTimestamp()};
 await pass('Persist and reload activity draft',async()=>{await setDoc(doc(student,'activityDrafts',uid+'_'+activity.id),{...attempt,submitted:false});assert.deepEqual((await getDoc(doc(student,'activityDrafts',uid+'_'+activity.id))).data().answers,attempt.answers)});
 await pass('Persist immutable completed attempt',()=>setDoc(doc(student,'activityAttempts','learning-attempt'),attempt));
 await deny('Cannot forge another student attempt',()=>setDoc(doc(other,'activityAttempts','forged-attempt'),attempt));
 await deny('Cannot rewrite attempt history',()=>updateDoc(doc(student,'activityAttempts','learning-attempt'),{answers:['wrong','wrong']}));
 await deny('Cannot submit invalid answer option',()=>setDoc(doc(student,'activityAttempts','invalid-attempt'),{...attempt,answers:['invented','invented']}));
 const plan=Object.fromEntries(['analysis','ideas','introduction','body1','body2','conclusion'].map(k=>[k,'My '+k]));const ts=Timestamp.now();const essay={ownerId:uid,studentName:'Student',teacherId:tid,promptId:'course-foundation',title:'Diagnostic',prompt:prompts[0].prompt,text:'',wordCount:0,status:'draft',feedback:'',scores:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp(),submittedAt:null,lessonId:'course-02',parentId:'',rootId:'learning-essay',version:1,mode:'diagnostic',startedAt:ts,deadlineAt:null,focus:[],plan,checks:[false,false,false,false],goals:['Develop examples','Check articles','Improve links']};
 await pass('Save empty essay with plan',()=>setDoc(doc(student,'essays','learning-essay'),essay));
 await deny('Cannot submit without checklist',()=>updateDoc(doc(student,'essays','learning-essay'),{text:'word '.repeat(250),wordCount:250,status:'submitted',submittedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await pass('Submit linked lesson essay',()=>updateDoc(doc(student,'essays','learning-essay'),{text:'word '.repeat(250),wordCount:250,checks:[true,true,true,true],status:'submitted',submittedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await deny('Other student cannot read essay',()=>getDoc(doc(other,'essays','learning-essay')));
 const review={scores:[6,6.5,6,6],feedback:'Develop the second example.',goals:['Explain the cause','Add an example','Check verb agreement'],focus:['Task Response'],status:'reviewed',reviewedAt:serverTimestamp(),updatedAt:serverTimestamp()};
 await pass('Atomic teacher feedback and anonymous history',async()=>{const batch=writeBatch(teacher);batch.update(doc(teacher,'essays','learning-essay'),review);batch.set(doc(teacher,'reviewHistory','learning-review'),{ownerId:uid,essayId:'learning-essay',scores:review.scores,feedback:review.feedback,goals:review.goals,focus:review.focus,createdAt:serverTimestamp()});await batch.commit();const saved=(await getDoc(doc(student,'reviewHistory','learning-review'))).data();assert.ok(!('teacherName' in saved));assert.ok(!('reviewerId' in saved))});
 const progress={ownerId:uid,lessonId:'course-02',notes:'',learned:true,completed:false,essayId:'learning-essay',attemptId:'learning-attempt',updatedAt:serverTimestamp()};
 await pass('Save progress with optional empty lesson notes',()=>setDoc(doc(student,'lessonProgress',uid+'_course-02'),progress));
 await pass('Query own lesson progress',async()=>assert.equal((await getDocs(query(collection(student,'lessonProgress'),where('ownerId','==',uid)))).size,1));
 await pass('Lesson completes after teacher reviews linked essay',()=>setDoc(doc(student,'lessonProgress',uid+'_course-02'),{...progress,completed:true}));
 const revised={...essay,text:'improved '.repeat(260),wordCount:260,checks:[true,true,true,true],parentId:'learning-essay',rootId:'learning-essay',version:2,status:'submitted',submittedAt:serverTimestamp(),updatedAt:serverTimestamp(),createdAt:serverTimestamp()};
 await pass('Create linked revision preserving first version',()=>setDoc(doc(student,'essays','learning-revision'),revised));
 await deny('Cannot forge revision ancestry',()=>setDoc(doc(student,'essays','bad-revision'),{...revised,version:9}));
 await pass('Review revision',()=>updateDoc(doc(teacher,'essays','learning-revision'),review));
 await pass('Complete lesson from actual passed exercise and reviewed rewrite',()=>setDoc(doc(student,'lessonProgress',uid+'_course-02'),{...progress,essayId:'learning-revision',completed:true}));
 await deny('Other student cannot read progress',()=>getDoc(doc(other,'lessonProgress',uid+'_course-02')));
 await pass('Teacher reads class progress',()=>getDocs(collection(teacher,'lessonProgress')));
 await deny('Cannot fabricate completion essay',()=>setDoc(doc(student,'lessonProgress',uid+'_course-02'),{...progress,completed:true,essayId:'does-not-exist'}));
 await pass('Store actual analysis input',()=>setDoc(doc(student,'analyses','learning-analysis'),{ownerId:uid,question:'Question',text:'My essay',createdAt:serverTimestamp()}));
 await deny('Other student cannot read analysis',()=>getDoc(doc(other,'analyses','learning-analysis')));
 const start=Timestamp.now();const mock={...essay,lessonId:'course-34',promptId:'course-final',rootId:'learning-mock',mode:'mock',startedAt:start,deadlineAt:Timestamp.fromMillis(start.toMillis()+2400000)};
 await pass('Create timed final attempt',()=>setDoc(doc(student,'essays','learning-mock'),mock));
 await deny('Cannot reset final deadline',()=>updateDoc(doc(student,'essays','learning-mock'),{deadlineAt:Timestamp.fromMillis(start.toMillis()+4800000),updatedAt:serverTimestamp()}));
 await deny('Cannot bypass final mode',()=>setDoc(doc(student,'essays','mock-bypass'),{...mock,rootId:'mock-bypass',mode:'practice'}));
 await deny('Cannot read another student attempts',()=>getDocs(query(collection(other,'activityAttempts'),where('ownerId','==',uid))));
 console.log(`${count} learning workflow checks passed.`);
}finally{await Promise.all(dbs.map(terminate));await Promise.all(apps.map(deleteApp))}
