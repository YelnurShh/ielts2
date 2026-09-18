import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, errorMessage } from './firebase';
import { TEACHER_UID } from './config';
import lottie from 'lottie-web';
import { useRef } from 'react';
export type Profile = { name: string; email: string; role: 'student' | 'teacher'; teacherId: string };
const Context = createContext<{user:User|null; profile:Profile|null; loading:boolean; error:string; approved:boolean}>({user:null,profile:null,loading:true,error:'',approved:false});
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null),[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[approved,setApproved]=useState(false);
  useEffect(()=>{let unsubscribeProfile=()=>{};let unsubscribeApproval=()=>{};const unsubscribeAuth=onAuthStateChanged(auth,u=>{unsubscribeProfile();unsubscribeApproval();setUser(u);setProfile(null);setError('');setApproved(false);if(!u){setLoading(false);return;}setLoading(true);unsubscribeProfile=onSnapshot(doc(db,'users',u.uid),snapshot=>{setProfile(snapshot.exists()?{...snapshot.data(),role:u.uid===TEACHER_UID?'teacher':snapshot.data().role==='teacher'?'teacher':'student'} as Profile:null);setApproved(u.uid===TEACHER_UID||snapshot.data()?.role==='teacher');setLoading(false)},err=>{setError(errorMessage(err));setLoading(false)});setApproved(u.uid===TEACHER_UID);});return()=>{unsubscribeAuth();unsubscribeProfile();unsubscribeApproval()};},[]);
  return <Context.Provider value={{user,profile,loading,error,approved}}>{children}</Context.Provider>
}
export const useAuth=()=>useContext(Context);
export async function logout(){await signOut(auth)}
export function Loader({label='Жүктелуде…'}:{label?:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const animation=lottie.loadAnimation({container:ref.current,renderer:'svg',loop:true,autoplay:!reduced,path:'/assets/loading.json'});return()=>animation.destroy()},[]);return <div className="loader" role="status"><div ref={ref} className="lottie"/><span>{label}</span></div>}
