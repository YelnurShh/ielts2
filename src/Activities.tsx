import { translate } from './i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { db, errorMessage } from './firebase';
import { useAuth, Loader } from './auth';
import { useRows, result, type Activity, type Attempt } from './learningData';

const kindLabels:Record<string,string>={quiz:'Викторина',matching:'Сәйкестендіру',order:'Ретін анықтау',gaps:'Бос орынды толтыру',sorting:'Топтастыру',editing:'Қатені түзету'};

export function ActivityPlayer({activity}:{activity:Activity}){
 const {user,profile}=useAuth();
 const [answers,setAnswers]=useState<string[]>(activity.questions.map(()=>''));
 const [order,setOrder]=useState(activity.questions.map((_,i)=>i));
 const [submitted,setSubmitted]=useState(false),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[message,setMessage]=useState(''),[loadError,setLoadError]=useState('');
 const [dragged,setDragged]=useState<string|null>(null),[selectedWord,setSelectedWord]=useState<string|null>(null),[draggedIndex,setDraggedIndex]=useState<number|null>(null);
 const teacher=profile?.role==='teacher';
 const disabled=submitted||busy||teacher;

 useEffect(()=>{let active=true;setLoaded(false);setLoadError('');setSubmitted(false);setAnswers(activity.questions.map(()=>''));setOrder(activity.questions.map((_,i)=>i));if(!user){setLoaded(true);return}getDoc(doc(db,'activityDrafts',user.uid+'_'+activity.id)).then(s=>{if(!active||!s.exists())return;const saved=s.data().answers as string[];setAnswers(saved);setSubmitted(s.data().submitted);if(activity.kind==='order'&&saved.every(Boolean))setOrder(activity.questions.map((_,i)=>i).sort((a,b)=>Number(saved[a])-Number(saved[b])))}).catch(e=>{if(active)setLoadError(errorMessage(e))}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[user?.uid,activity.id,activity.kind,activity.questions]);

 function answer(index:number,value:string){if(disabled)return;setAnswers(old=>old.map((item,i)=>i===index?value:item));setMessage('')}
 function move(from:number,to:number){if(disabled||from===to||to<0||to>=order.length)return;setOrder(old=>{const next=[...old];const [item]=next.splice(from,1);next.splice(to,0,item);setAnswers(activity.questions.map((_,questionIndex)=>String(next.indexOf(questionIndex)+1)));return next})}
 async function save(finish:boolean){if(!user||profile?.role!=='student')return;setBusy(true);setMessage('');try{const finalAnswers=activity.kind==='order'&&answers.some(a=>!a)?activity.questions.map((_,questionIndex)=>String(order.indexOf(questionIndex)+1)):answers;const data={ownerId:user.uid,activityId:activity.id,lessonId:activity.lessonId,answers:finalAnswers,submitted:finish,updatedAt:serverTimestamp()};if(finish)await addDoc(collection(db,'activityAttempts'),data);await setDoc(doc(db,'activityDrafts',user.uid+'_'+activity.id),data);setAnswers(finalAnswers);setSubmitted(finish);setMessage(finish?'Нәтиже базаға сақталды.':'Жауаптар базаға сақталды.')}catch(e){setMessage(errorMessage(e))}finally{setBusy(false)}}
 function restart(){setSubmitted(false);setAnswers(activity.questions.map(()=>''));setOrder(activity.questions.map((_,i)=>i));setMessage('')}

 const matchingOptions=useMemo(()=>[...new Set(activity.questions.flatMap(q=>q.options))],[activity.questions]);
 const sortingGroups=useMemo(()=>[...new Set(activity.questions.flatMap(q=>q.options))],[activity.questions]);
 const ready=activity.kind==='order'||answers.every(Boolean);

 if(!loaded)return <Loader/>;
 if(loadError)return <p className="notice error" role="alert">{loadError} Жауаптарды жүктеу үшін бетті қайта ашыңыз.</p>;

 return <div className={'learning-panel activity-player '+activity.kind}>
  <h3>{activity.title}</h3>
  {(activity.kind==='quiz'||activity.kind==='editing')&&activity.questions.map((q,i)=><fieldset className="activity-question" key={i} disabled={disabled}><legend>{i+1}. {q.q}</legend><div className="activity-options">{q.options.map((option,n)=><button type="button" key={option} className={'activity-option '+(answers[i]===option?'selected ':'')+(submitted&&option===q.answer?'correct ':submitted&&answers[i]===option?'incorrect':'')} onClick={()=>answer(i,option)}><span>{String.fromCharCode(65+n)}</span>{option}</button>)}</div>{submitted&&<Feedback correct={answers[i]===q.answer} answer={q.answer} why={q.why}/>}</fieldset>)}

  {activity.kind==='matching'&&<><p>Сипаттаманы ұстап, сәйкес критерийдің жанына апар. Телефонда сипаттаманы басып, кейін критерийді таңда.</p><div className="word-bank">{matchingOptions.map(option=><button type="button" draggable={!disabled} disabled={disabled||answers.includes(option)} className={selectedWord===option?'selected':''} key={option} onDragStart={()=>setDragged(option)} onClick={()=>setSelectedWord(option)}>{option}</button>)}</div><div className="matching-board">{activity.questions.map((q,i)=><div role="button" tabIndex={disabled?-1:0} aria-disabled={disabled} className={'match-target '+(answers[i]?'filled':'')} key={q.q} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragged)answer(i,dragged);setDragged(null)}} onClick={()=>{if(selectedWord){answer(i,selectedWord);setSelectedWord(null)}}} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&selectedWord){e.preventDefault();answer(i,selectedWord);setSelectedWord(null)}}}><strong>{q.q}</strong><span>{answers[i]||'Осында орналастыр'}</span>{answers[i]&&!submitted&&<button type="button" onClick={e=>{e.stopPropagation();answer(i,'')}}>Өшіру</button>}{submitted&&<Feedback correct={answers[i]===q.answer} answer={q.answer} why={q.why}/>}</div>)}</div></>}

  {activity.kind==='gaps'&&activity.questions.map((q,i)=>{const parts=q.q.split('___');return <section className="gap-question" key={i}><p><span>{i+1}. {parts[0]}</span><strong className={answers[i]?'filled':''}>{answers[i]||'________'}</strong><span>{parts.slice(1).join('___')}</span></p><div className="word-bank">{q.options.map(option=><button type="button" disabled={disabled} className={answers[i]===option?'selected':''} key={option} onClick={()=>answer(i,option)}>{option}</button>)}</div>{submitted&&<Feedback correct={answers[i]===q.answer} answer={q.answer} why={q.why}/>}</section>})}

  {activity.kind==='sorting'&&<><p>Идея карточкасын тиісті бағанға сүйреп апар. Телефонда карточканы, содан кейін бағанды бас.</p><div className="sorting-bank">{activity.questions.map((q,i)=><button type="button" draggable={!disabled} disabled={disabled||!!answers[i]} className={draggedIndex===i?'selected':''} key={i} onDragStart={()=>setDraggedIndex(i)} onClick={()=>setDraggedIndex(i)}>{q.q}</button>)}</div><div className="sorting-board">{sortingGroups.map(group=><section key={group} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(draggedIndex!==null)answer(draggedIndex,group);setDraggedIndex(null)}} onClick={()=>{if(draggedIndex!==null){answer(draggedIndex,group);setDraggedIndex(null)}}}><h4>{group}</h4>{activity.questions.map((q,i)=>answers[i]===group?<button type="button" key={i} disabled={disabled} onClick={e=>{e.stopPropagation();answer(i,'')}}>{q.q}{submitted&&q.answer!==group?<small>Дұрысы: {q.answer}</small>:null}</button>:null)}</section>)}</div>{submitted&&activity.questions.map((q,i)=><Feedback key={i} correct={answers[i]===q.answer} answer={`${q.q} → ${q.answer}`} why={q.why}/>)}</>}

  {activity.kind==='order'&&<><p>Сөйлемдерді ұстап сүйре немесе көрсеткілер арқылы дұрыс ретке қой.</p><ol className="drag-order">{order.map((questionIndex,position)=><li draggable={!disabled} key={questionIndex} onDragStart={()=>setDraggedIndex(position)} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(draggedIndex!==null)move(draggedIndex,position);setDraggedIndex(null)}}><GripVertical aria-hidden="true"/><span>{position+1}</span><p>{activity.questions[questionIndex].q}</p><div><button type="button" aria-label="Жоғары жылжыту" disabled={disabled||position===0} onClick={()=>move(position,position-1)}><ArrowUp/></button><button type="button" aria-label="Төмен жылжыту" disabled={disabled||position===order.length-1} onClick={()=>move(position,position+1)}><ArrowDown/></button></div></li>)}</ol>{submitted&&activity.questions.map((q,i)=><Feedback key={i} correct={answers[i]===q.answer} answer={`${q.answer}-орын: ${q.q}`} why={q.why}/>)}</>}

  {submitted&&<p className="activity-score"><strong>Нәтиже: {result({answers} as Attempt,activity)} / {activity.questions.length}</strong></p>}
  {profile?.role==='student'&&<div className="learning-actions">{submitted?<button className="button secondary" onClick={restart}>Қайта орындау</button>:<><button className="button secondary" disabled={busy} onClick={()=>save(false)}>Жауаптарды сақтау</button><button className="button" disabled={busy||!ready} onClick={()=>save(true)}>Тексеру және сақтау</button></>}</div>}
  {!user&&<Link to="/login">Орындау және сақтау үшін кіріңіз</Link>}
  {message&&<p role="status">{message}</p>}
 </div>
}

function Feedback({correct,answer,why}:{correct:boolean;answer:string;why:string}){return <div className={'activity-feedback '+(correct?'correct':'incorrect')}><strong>{correct?'Дұрыс!':'Дұрыс жауап: '+answer}</strong><p>{why}</p></div>}

export default function Activities({quiz=false}:{quiz?:boolean}){const {id}=useParams();const {profile}=useAuth();const {items,loading,error}=useRows<Activity>('activities');const [filter,setFilter]=useState('');if(loading)return <Loader/>;if(error)return <p className="container notice error">{error}</p>;const selected=items.find(a=>a.id===(quiz?'quiz':id));const general=items.filter(a=>!a.lessonId);return <section className="container article page"><h1>Интерактивті тапсырмалар</h1><p className="muted-text">Сабақтардан бөлек Writing Task 2 дағдыларын ойын форматында бекіт: викторина, сәйкестендіру, бос орын толтыру, сөйлем реттеу, топтастыру және қате түзету.</p>{profile?.role==='teacher'&&<Link className="button secondary" to="/tasks/new">+ Тапсырма қосу</Link>}{selected?<><Link className="back-link" to="/tasks">← Барлық тапсырмалар</Link><ActivityPlayer key={selected.id} activity={selected}/>{selected.lessonId&&<Link to={'/lessons/'+selected.lessonId}>Сабаққа оралу</Link>}</>:<><label className="field">Іздеу<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Тапсырма атауы"/></label>{!general.length&&<p>Тапсырмалар әлі базаға қосылмаған.</p>}<div className="lesson-grid">{general.filter(a=>(a.title+' '+translate(a.title)).toLocaleLowerCase().includes(filter.toLocaleLowerCase())).map(a=><Link className="lesson-card" key={a.id} to={'/tasks/'+a.id}><span className="tag">{kindLabels[a.kind]||a.kind}</span><h2>{a.title}</h2><p>{a.questions.length} сұрақ · жауаптар аккаунтта сақталады</p></Link>)}</div></>}</section>}
