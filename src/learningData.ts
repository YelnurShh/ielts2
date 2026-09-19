import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { db, errorMessage } from './firebase';
export type Question={q:string;options:string[];answer:string;why:string};
export type Activity={id:string;lessonId:string;title:string;kind:string;questions:Question[]};
export type Attempt={id:string;ownerId:string;activityId:string;lessonId:string;answers:string[];submitted:boolean;updatedAt:Timestamp|null};
export type Progress={id:string;ownerId:string;lessonId:string;notes:string;learned:boolean;completed:boolean;essayId:string;updatedAt:Timestamp|null};
export type Plan={analysis:string;ideas:string;introduction:string;body1:string;body2:string;conclusion:string};
export const emptyPlan:Plan={analysis:'',ideas:'',introduction:'',body1:'',body2:'',conclusion:''};
export const planLabels:Record<keyof Plan,string>={analysis:'Сұрақты талдау: тақырып, шектеулер, міндеттер',ideas:'Идеялар: себеп / салдар / шешім / қатысы жоқ ойлар',introduction:'Кіріспе: қайта тұжырымдау және ұстаным',body1:'1-абзац: ой → түсіндіру → мысал',body2:'2-абзац: ой → түсіндіру → мысал',conclusion:'Қорытынды: негізгі жауап'};
export type LearningEssay={id:string;ownerId:string;studentName:string;teacherId:string;promptId:string;title:string;prompt:string;text:string;wordCount:number;status:'draft'|'submitted'|'reviewed';feedback:string;scores:number[];createdAt:Timestamp|null;updatedAt:Timestamp|null;submittedAt:Timestamp|null;lessonId?:string;parentId?:string;rootId?:string;version?:number;plan?:Plan;questionMarks?:Record<string,string>;checks?:boolean[];goals?:string[];focus?:string[];mode?:'practice'|'diagnostic'|'mock';startedAt?:Timestamp|null;deadlineAt?:Timestamp|null;reviewedAt?:Timestamp|null};
export function useRows<T extends {id:string}>(name:string, owner?:string|null, extra?:[string,string]){
 const [items,setItems]=useState<T[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const field=extra?.[0],value=extra?.[1];
 useEffect(()=>{setItems([]);setError('');if(owner===null){setLoading(false);return}setLoading(true);const clauses=[];if(owner)clauses.push(where('ownerId','==',owner));if(field&&value)clauses.push(where(field,'==',value));return onSnapshot(query(collection(db,name),...clauses),s=>{setItems(s.docs.map(d=>({...d.data(),id:d.id} as T)));setLoading(false)},e=>{setError(errorMessage(e));setLoading(false)})},[name,owner,field,value]);
 return {items,loading,error};
}
export function result(attempt:Attempt, activity:Activity){return activity.questions.reduce((sum,q,i)=>sum+Number(attempt.answers[i]===q.answer),0)}
export function mean(scores:number[]){return scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null}
export function ordered<T extends {createdAt?:Timestamp|null}>(rows:T[]){return [...rows].sort((a,b)=>(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0))}
export const focusNames=['Task Response','Coherence & Cohesion','Lexical Resource','Grammar & Accuracy'];
