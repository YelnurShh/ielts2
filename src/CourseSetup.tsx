import { useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from './auth';
import { db, errorMessage } from './firebase';
import { lessons, prompts } from './data';
import { activitySeeds } from './activitySeeds';
export default function CourseSetup(){const {user,profile}=useAuth();const [busy,setBusy]=useState(false),[message,setMessage]=useState('');if(!user||profile?.role!=='teacher')return null;
 async function install(){setBusy(true);setMessage('');try{const seeds=[...prompts.map(p=>({kind:'prompts',data:p})),...lessons.map(l=>({kind:'lessons',data:{...l,sections:l.sections.map(s=>({...s,example:'example' in s?s.example:''}))}})),...activitySeeds.map(a=>({kind:'activities',data:a}))];const missing=[];for(const seed of seeds){if(!(await getDoc(doc(db,seed.kind,seed.data.id))).exists())missing.push(seed)}for(const seed of missing){const {id,...data}=seed.data;await setDoc(doc(db,seed.kind,id),{...data,createdBy:user!.uid,createdAt:serverTimestamp()})}setMessage(`${missing.length} материал базаға қосылды. Бұрынғы материалдар өзгертілмеді.`)}catch(e){setMessage(errorMessage(e))}finally{setBusy(false)}}
 return <section className="learning-panel"><h2>Курсты базаға орнату</h2><p>34 сабақ, жазу тапсырмалары және интерактивті жаттығулар Firebase-ке бір рет көшіріледі. Сайт оқу материалдарын базадан жүктейді.</p><button className="button secondary" disabled={busy} onClick={install}>{busy?'Базаға көшірілуде…':'Жетіспейтін материалдарды қосу'}</button>{message&&<p role="status">{message}</p>}</section>}
