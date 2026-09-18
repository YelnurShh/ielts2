import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, errorMessage } from './firebase';
import { useAuth } from './auth';
import { TEACHER_UID } from './config';
export async function claimTeacher(uid:string,code:string){
 if(uid===TEACHER_UID)return;
 if(!code.trim())throw new Error('Мұғалімге арналған арнайы кодты енгізіңіз.');
 try{await setDoc(doc(db,'teacherMemberships',uid),{inviteCode:code.trim()})}
 catch(e){if((e as {code?:string}).code==='permission-denied')throw new Error('Код дұрыс емес немесе тіркелу әлі қосылмаған.');throw e}
}
export function TeacherInvite(){
 const {user}=useAuth();
 if(user?.uid!==TEACHER_UID)return null;
 return <section className="teacher-panel"><div><h3>Мұғалім аккаунтын ашу</h3><p>Жаңа аккаунт ашқанда «Мұғаліммін» рөлін таңдап, арнайы кодты енгізіңіз. Барлық мұғалім аккаунтына оқушылардың жұмыстары ортақ көрсетіледі.</p></div></section>
}
export default function TeacherAccess(){const {user,profile}=useAuth();const [code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const navigate=useNavigate();async function submit(e:FormEvent){e.preventDefault();if(!user)return;setBusy(true);setError('');try{await claimTeacher(user.uid,code);await updateDoc(doc(db,'users',user.uid),{role:'teacher'});navigate('/dashboard',{replace:true})}catch(e){setError(e instanceof Error?e.message:errorMessage(e))}finally{setBusy(false)}}return <section className="container article page"><div className="page-heading"><h1>Мұғалім аккаунты</h1><p>Арнайы кодты енгізіп, мұғалім мүмкіндіктерін қосыңыз.</p></div>{profile?.role==='teacher'?<Link className="button" to="/dashboard">Мұғалім кабинетіне өту</Link>:<form onSubmit={submit}><label className="field">Арнайы код<input type="password" autoComplete="off" required maxLength={128} value={code} onChange={e=>setCode(e.target.value)}/></label>{error&&<div className="notice error" role="alert">{error}</div>}<button className="button" disabled={busy}>{busy?'Тексерілуде…':'Мұғалім ретінде қосылу'}</button></form>}</section>}
