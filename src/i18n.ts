import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import source from './locales/source.json';
import translations from './locales/translations.json';
export type Locale='kk'|'ru'|'en';
const storageKey='writing-mastery-language';
let current:Locale='kk';
try{const saved=localStorage.getItem(storageKey);if(saved==='ru'||saved==='en')current=saved;}catch{}
const dictionaries:Record<string,[string,string]>=Object.fromEntries(Object.entries(translations).map(([i,v])=>[source[Number(i)],v as [string,string]]));
const fragments=Object.keys(dictionaries).sort((a,b)=>b.length-a.length);
const fragmentPattern=new RegExp('(?<![\\p{L}])(?:'+fragments.filter(v=>v.length>=3).map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}])','gu');
const extras:Record<string,Record<Locale,string>>={
 'Interface language':{kk:'Интерфейс тілі',ru:'Язык интерфейса',en:'Interface language'},
 'Paste your essay here…':{kk:'Эссе мәтінін осында қойыңыз…',ru:'Вставьте текст эссе…',en:'Paste your essay here…'},
 'Write the essay question here…':{kk:'Эссе сұрағын осында жазыңыз…',ru:'Введите вопрос для эссе…',en:'Write the essay question here…'},
 'Start your essay here…':{kk:'Эссеңізді осында бастаңыз…',ru:'Начните эссе здесь…',en:'Start your essay here…'},
};
export function localeTag(){return {kk:'kk-KZ',ru:'ru-RU',en:'en-GB'}[current]}
export function translate(text:string,locale:Locale=current):string{
  if(extras[text.trim()])return text.replace(text.trim(),extras[text.trim()][locale]);
  if(locale==='kk')return text;
  const key=text.trim(),pair=dictionaries[key];
  if(pair)return text.replace(key,pair[locale==='ru'?0:1]);
  // Dynamic labels combine fixed text with names, counters, and dates.
  return text.replace(fragmentPattern,match=>dictionaries[match][locale==='ru'?0:1]);
}
export function display<T>(value:T):T{
  if(typeof value==='string')return translate(value) as T;
  if(Array.isArray(value))return value.map(display) as T;
  return value;
}
const Context=createContext({locale:current,setLocale:(_locale:Locale)=>{}});
export function LanguageProvider({children}:{children:ReactNode}){
  const [locale,setState]=useState<Locale>(current);
  function setLocale(next:Locale){current=next;setState(next);try{localStorage.setItem(storageKey,next)}catch{}}
  useEffect(()=>{document.documentElement.lang=locale},[locale]);
  return createElement(Context.Provider,{value:{locale,setLocale}},children);
}
export const useLocale=()=>useContext(Context);
