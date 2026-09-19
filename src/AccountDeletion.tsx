import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { collection, doc, getDocs, query, where, writeBatch, type DocumentReference } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { useAuth } from './auth';
import { db, errorMessage } from './firebase';
import { useLocale, translate } from './i18n';

const ownedCollections=['essays','activityAttempts','activityDrafts','lessonProgress','reviewHistory','analyses'];

async function deleteOwnedData(uid:string){
  const snapshots=await Promise.all(ownedCollections.map(name=>getDocs(query(collection(db,name),where('ownerId','==',uid)))));
  const refs:DocumentReference[]=snapshots.flatMap(snapshot=>snapshot.docs.map(item=>item.ref));
  refs.push(doc(db,'teacherMemberships',uid),doc(db,'users',uid));
  for(let start=0;start<refs.length;start+=450){
    const batch=writeBatch(db);
    refs.slice(start,start+450).forEach(ref=>batch.delete(ref));
    await batch.commit();
  }
}

export default function AccountDeletion(){
  const {user}=useAuth();
  const {locale}=useLocale();
  const confirmationWord={kk:'ӨШІРУ',ru:'УДАЛИТЬ',en:'DELETE'}[locale];
  const navigate=useNavigate();
  const [open,setOpen]=useState(false),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const google=user?.providerData.some(provider=>provider.providerId==='google.com');

  async function remove(e:FormEvent){
    e.preventDefault();
    if(!user||confirmation!==confirmationWord)return;
    setBusy(true);setMessage('');
    try{
      if(google)await reauthenticateWithPopup(user,new GoogleAuthProvider());
      else {
        if(!user.email)throw new Error('Email табылмады.');
        await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));
      }
      await deleteOwnedData(user.uid);
      await deleteUser(user);
      navigate('/',{replace:true});
    }catch(error){setMessage(errorMessage(error))}
    finally{setBusy(false)}
  }

  return <section className="danger-zone">
    <div><h2>Аккаунтты өшіру</h2><p>Аккаунтпен бірге барлық эссе, прогресс, тапсырма жауаптары және сақталған жеке деректер біржола өшеді.</p></div>
    {!open?<button className="danger-button" onClick={()=>setOpen(true)}><Trash2 size={17}/> Аккаунтты өшіру</button>:<form onSubmit={remove}>
      <strong>Бұл әрекетті қайтару мүмкін емес.</strong>
      {!google&&<label className="field">Ағымдағы құпиясөз<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}
      <label className="field">{translate('Растау үшін ӨШІРУ деп жазыңыз').replace('ӨШІРУ',confirmationWord)}<input required value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off"/></label>
      {google&&<p className="muted-text">Келесі қадамда Google аккаунтыңызды қайта растайсыз.</p>}
      {message&&<p className="notice error" role="alert">{message}</p>}
      <div className="learning-actions"><button type="button" className="button secondary" disabled={busy} onClick={()=>{setOpen(false);setPassword('');setConfirmation('');setMessage('')}}>Бас тарту</button><button className="danger-button" disabled={busy||confirmation!==confirmationWord}>{busy?'Өшірілуде…':'Барлығын біржола өшіру'}</button></div>
    </form>}
  </section>
}
