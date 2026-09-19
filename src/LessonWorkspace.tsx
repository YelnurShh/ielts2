import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, errorMessage } from './firebase';
import { useAuth } from './auth';
import { ActivityPlayer } from './Activities';
import { useRows, result, type Activity, type Attempt, type LearningEssay } from './learningData';
import type { LessonContent } from './content';
export default function LessonWorkspace({lesson}:{lesson:LessonContent}){const {user,profile}=useAuth();const [notes,setNotes]=useState(''),[learned,setLearned]=useState(false),[completed,setCompleted]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[loadError,setLoadError]=useState('');const activities=useRows<Activity>('activities',undefined,['lessonId',lesson.id]);const attempts=useRows<Attempt>('activityAttempts',user?.uid||null);const essays=useRows<LearningEssay>('essays',profile?.role==='student'?user?.uid:null);
 useEffect(()=>{let active=true;setLoaded(false);setLoadError('');if(!user)return;getDoc(doc(db,'lessonProgress',user.uid+'_'+lesson.id)).then(s=>{if(active&&s.exists()){setNotes(s.data().notes);setLearned(s.data().learned);setCompleted(s.data().completed)}}).catch(e=>{if(active)setLoadError(errorMessage(e))}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[user?.uid,lesson.id]);
 const passed=attempts.items.find(a=>a.lessonId===lesson.id&&a.submitted&&activities.items.some(t=>t.id===a.activityId&&result(a,t)===t.questions.length));
 const reviewed=essays.items.filter(e=>e.lessonId===lesson.id&&e.status==='reviewed').sort((a,b)=>(b.updatedAt?.toMillis()||0)-(a.updatedAt?.toMillis()||0))[0];
 async function save(finish:boolean){if(!user)return;setBusy(true);setMessage('');try{await setDoc(doc(db,'lessonProgress',user.uid+'_'+lesson.id),{ownerId:user.uid,lessonId:lesson.id,notes,learned,completed:finish||completed,essayId:reviewed?.id||'',attemptId:passed?.id||'',updatedAt:serverTimestamp()});if(finish)setCompleted(true);setMessage('Сабақ деректері базаға сақталды.')}catch(e){setMessage(errorMessage(e))}finally{setBusy(false)}}
 if(!user)return <p className="notice"><Link to="/login">Кіріңіз</Link>: жазбалар, тапсырмалар және прогресс аккаунтыңызда сақталады.</p>;
 if(loadError)return <p className="notice error" role="alert">{loadError}</p>;
 if(profile?.role==='teacher')return <>{activities.items.map(a=><ActivityPlayer key={a.id} activity={a}/>)}</>;
 const requirements=[
  {done:learned,label:'Теория оқылды'},
  {done:!!passed,label:'Интерактивті жаттығу толық дұрыс орындалды'},
  {done:!!reviewed,label:'Сабаққа байланыстырылған эссе мұғаліммен тексерілді'},
 ];
 const canComplete=loaded&&!busy&&requirements.every(item=>item.done);
 return <section className="learning-panel"><h2>Сабақты орындау</h2><p>Оқу → жаттығу → жоспар → эссе → кері байланыс → қайта жазу.</p>{[activities.error,attempts.error,essays.error].filter(Boolean).map((e,i)=><p role="alert" key={i}>{e}</p>)}<label className="check-line"><input type="checkbox" checked={learned} disabled={!loaded||busy} onChange={e=>setLearned(e.target.checked)}/> Теорияны оқып, мысалды түсіндім</label><label className="field">Сабақ бойынша қысқаша жазба <span className="field-help">Міндетті емес: сабақтан түсінген ойыңды немесе есте сақтағың келетін ережені жаз.</span><textarea rows={5} maxLength={6000} value={notes} disabled={!loaded||busy} onChange={e=>setNotes(e.target.value)}/></label><button className="button secondary" disabled={!loaded||busy} onClick={()=>save(false)}>Жазбаны сақтау</button>{activities.items.map(a=><ActivityPlayer key={a.id} activity={a}/>)}{!activities.loading&&!activities.items.length&&<p>Бұл сабаққа интерактивті жаттығу әлі қосылмаған.</p>}{lesson.practiceId&&<Link className="button" to={'/practice/'+lesson.practiceId+'?lesson='+lesson.id}>Жоспар мен эссеге өту</Link>}<div className="completion-requirements" id="completion-requirements"><h3>Сабақты аяқтау шарттары</h3>{requirements.map(item=><p className={item.done?'done':'pending'} key={item.label}><span aria-hidden="true">{item.done?'✓':'○'}</span>{item.label}</p>)}</div>{completed?<strong>✓ Сабақ аяқталды</strong>:<button className="button" aria-describedby="completion-requirements" disabled={!canComplete} onClick={()=>save(true)}>Сабақты аяқтау</button>}{message&&<p role="status">{message}</p>}</section>
}
