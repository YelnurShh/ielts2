import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, ScanText, ShieldCheck, Sparkles, Target, WandSparkles } from 'lucide-react';
import { useAuth, Loader } from './auth';

type Criterion = { score:number; explanation:string; strengths:string[]; improvements:string[] };
type Report = {
  analysis:{ summary:string; criteria:Record<'TR'|'CC'|'LR'|'GRA',Criterion>;
    structure:{introduction:string;body:string;conclusion:string;cohesion:string};
    corrections:{original:string;corrected:string;explanation:string;category:string}[];
    vocabulary:{original:string;improved:string;explanation:string}[];
    targets:{title:string;action:string;example:string}[];
    revisedParagraph:{original:string;improved:string;explanation:string};warnings:string[];
  }; overallBand:number;wordCount:number;analyzedAt:string;
};
const CRITERIA = [
  {key:'TR',title:'Task Response',text:'Сұраққа жауап пен идеяның дамуы'},
  {key:'CC',title:'Coherence & Cohesion',text:'Құрылым және ойдың байланысы'},
  {key:'LR',title:'Lexical Resource',text:'Сөздік қор мен сөз қолданысы'},
  {key:'GRA',title:'Grammar & Accuracy',text:'Грамматика және сөйлемдер'},
] as const;
export default function AiAnalysis(){
 const {user,loading:authLoading}=useAuth();
 const [question,setQuestion]=useState(''),[essay,setEssay]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [result,setResult]=useState<{report:Report;essay:string;question:string}|null>(null);
 const abort=useRef<AbortController|null>(null),resultRef=useRef<HTMLElement|null>(null),identity=useRef(user?.uid);
 const words=essay.trim()?essay.trim().split(/\s+/).length:0;
 useEffect(()=>{if(identity.current!==user?.uid){abort.current?.abort();setBusy(false);setResult(null);setEssay('');setQuestion('');setError('');identity.current=user?.uid}},[user?.uid]);
 useEffect(()=>()=>abort.current?.abort(),[]);
 useEffect(()=>{if(result)resultRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})},[result]);
 async function analyze(e:FormEvent){
  e.preventDefault();if(!user||busy)return;setError('');
  if(question.trim().length<10){setError('Тапсырманың толық сұрағын енгізіңіз (кемінде 10 таңба).');return}
  if(words<50||words>1500){setError('Талдау үшін 50–1500 сөз енгізіңіз. IELTS эссесі үшін кемінде 250 сөз ұсынылады.');return}
  const controller=new AbortController();abort.current=controller;const timeout=setTimeout(()=>controller.abort('timeout'),65000);setBusy(true);
  const input={question:question.trim(),essay:essay.trim()};
  try{
    const token=await user.getIdToken();
    if(controller.signal.aborted)return;
    const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(input),signal:controller.signal});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(data?.error||'ЖИ қызметімен байланысу мүмкін болмады. Қайта көріңіз.');
    if(!data?.analysis?.criteria||typeof data.overallBand!=='number')throw new Error('Жауап толық емес. Қайта талдап көріңіз.');
    if(!controller.signal.aborted)setResult({report:data,...input});
  }catch(err){if(!controller.signal.aborted)setError(err instanceof Error?err.message:'Талдау орындалмады.');else if(controller.signal.reason==='timeout')setError('Күту уақыты аяқталды. Мәтініңіз осында, қайта көріңіз.');}
  finally{clearTimeout(timeout);if(abort.current===controller){setBusy(false);abort.current=null}}
 }
 const changed=result&&(result.essay!==essay.trim()||result.question!==question.trim());
 return <section className="container page ai-page">
  <div className="ai-heading"><div><div className="eyebrow"><Sparkles size={15}/> ЖАЗУЫҢА ЖАҢА КӨЗҚАРАС</div><h1>Эссеңді бірге жақсартайық.</h1><p>Нақты талдау. Түсінікті түзетулер. Келесі қадамға бағыт.</p></div><span className="ai-powered"><span/> Groq AI</span></div>
  <div className="ai-workspace"><form onSubmit={analyze} className="ai-input-card"><div className="ai-card-heading"><span className="tile-icon"><PenIcon/></span><div><h2>Сенің эссең</h2><p>Тапсырма сұрағын және ағылшынша жауабыңды енгіз.</p></div></div>
    <fieldset disabled={busy} className="content-fields">
      <label className="field">IELTS Task 2 сұрағы<textarea lang="en" required minLength={10} maxLength={3000} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Some people believe that… To what extent do you agree or disagree?"/></label>
      <label className="field">Эссе мәтіні<textarea className="ai-essay-input" lang="en" required maxLength={15000} rows={13} value={essay} onChange={e=>setEssay(e.target.value)} placeholder="Paste or write your essay here…"/></label>
    </fieldset>
    <div className="ai-word-row"><span className={words>=250?'success-text':''}><strong>{words}</strong> сөз</span><span>IELTS мақсаты: 250+ сөз · талдау: 50–1500 сөз</span></div>
    {words>0&&words<250&&<p className="ai-length-note">250 сөзден аз мәтінді талдауға болады, бірақ толық эссе туралы бағалау шектеулі болады.</p>}
    {error&&<div role="alert" className="notice error">{error}</div>}
    {busy?<div className="ai-loading"><Loader label="Эссең талданып жатыр…"/><p>Критерийлер, дәлелдер және тіл қолданысы тексерілуде.</p><button type="button" className="text-button" onClick={()=>abort.current?.abort()}>Талдауды тоқтату</button></div>:<div className="ai-submit">{user?<button className="button" type="submit" disabled={authLoading}><Sparkles size={18}/> Толық талдау алу <ArrowRight size={17}/></button>:<><Link className="button" to="/login">Талдау үшін кіру <ArrowRight size={17}/></Link><span>Кірер алдында мәтініңді көшіріп ал.</span></>}</div>}
    <p className="ai-data-note"><ShieldCheck size={15}/> «Толық талдау алу» батырмасын басқанда, сұрақ пен эссе Groq AI қызметіне жіберіледі. Нәтиже осы бетте көрсетіледі, автоматты сақталмайды.</p>
  </form><aside className="ai-side"><div className="ai-explainer"><span className="ai-symbol"><ScanText size={29}/></span><h2>Төрт критерий.<br/>Бір толық талдау.</h2><p>Тек баға емес — нені және қалай жақсартуға болатынын біл.</p><div className="ai-criteria-list">{CRITERIA.map(c=><div key={c.key}><span>{c.key}</span><div><strong>{c.title}</strong><p>{c.text}</p></div></div>)}</div></div><div className="ai-help-card"><Target size={21}/><h3>Талдаудан кейін</h3><p>Үш негізгі ұсынысты қолдан. Мәтініңді түзетіп, қайта талда — өзгерісті өзің байқа.</p></div><p className="ai-disclaimer">ЖИ қателесуі мүмкін. Бұл — оқу мақсатындағы болжамды баға, ресми IELTS нәтижесі емес. Мұғалімнің кері байланысымен бірге қолдан.</p></aside></div>
  {result&&!busy&&<section className="ai-results" ref={resultRef} aria-label="Эссе талдауы"><div className="ai-results-title"><div className="eyebrow"><Check size={16}/> ТАЛДАУ ДАЙЫН</div><h2>Жақсартуға болатын тұстар анық.</h2></div>{changed&&<div className="notice" role="status">Мәтін өзгерді. Төмендегі нәтиже алдыңғы нұсқаға тиесілі. Жаңа нұсқаны талдау үшін батырманы қайта бас.</div>}
    <div className="ai-summary"><div className="ai-overall"><strong>{result.report.overallBand.toFixed(1)}</strong><span>/ 9.0</span><small>Болжамды оқу бағасы</small></div><div><span className="eyebrow">ЖАЛПЫ ҚОРЫТЫНДЫ · {result.report.wordCount} СӨЗ</span><p>{result.report.analysis.summary}</p></div></div>
    {result.report.analysis.warnings.length>0&&<div className="notice"><strong>Бағалау шектеулері</strong><ul>{result.report.analysis.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></div>}
    <div className="ai-score-grid">{CRITERIA.map(c=>{const item=result.report.analysis.criteria[c.key];return <article className="ai-criterion-card" key={c.key}><div className="card-top"><span className="ai-criterion-code">{c.key}</span><strong>{item.score.toFixed(1)}<small> / 9</small></strong></div><h3>{c.title}</h3><p>{item.explanation}</p><h4>Күшті жақтары</h4><ul>{item.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul><h4>Жақсарту жолдары</h4><ul>{item.improvements.map((s,i)=><li key={i}>{s}</li>)}</ul></article>})}</div>
    <div className="ai-section-title"><FileText size={21}/><h2>Эссе құрылымы</h2></div><div className="ai-structure">{([['introduction','Кіріспе'],['body','Негізгі бөлім'],['conclusion','Қорытынды'],['cohesion','Ой байланысы']] as const).map(([key,label])=><article key={key}><h3>{label}</h3><p>{result.report.analysis.structure[key]}</p></article>)}</div>
    <div className="ai-section-title"><WandSparkles size={21}/><h2>Қателер және түзетулер</h2></div>{result.report.analysis.corrections.length?result.report.analysis.corrections.map((c,i)=><article className="ai-correction" key={i}><div className="ai-before-after"><div><span>Бастапқы сөйлем</span><p lang="en">{c.original}</p></div><div><span>Түзетілген нұсқа</span><p lang="en">{c.corrected}</p></div></div><p>{c.explanation}</p></article>):<p className="muted-text">ЖИ бұл талдауда нақты түзетулер ұсынбады. Бұл мәтін толығымен қатесіз дегенді білдірмейді.</p>}
    {result.report.analysis.vocabulary.length>0&&<><div className="ai-section-title"><BookIcon/><h2>Сөздік қорды жақсарту</h2></div><div className="ai-vocabulary">{result.report.analysis.vocabulary.map((v,i)=><article key={i}><div><span lang="en">{v.original}</span><ArrowRight size={16}/><strong lang="en">{v.improved}</strong></div><p>{v.explanation}</p></article>)}</div></>}
    {result.report.analysis.revisedParagraph.original&&<><div className="ai-section-title"><ScanText size={21}/><h2>Бір абзацты бірге жақсартайық</h2></div><article className="ai-correction"><div className="ai-before-after"><div><span>Сенің нұсқаң</span><p lang="en">{result.report.analysis.revisedParagraph.original}</p></div><div><span>Жақсартылған үлгі</span><p lang="en">{result.report.analysis.revisedParagraph.improved}</p></div></div><p>{result.report.analysis.revisedParagraph.explanation}</p></article></>}
    <div className="ai-section-title"><Target size={21}/><h2>Келесі үш қадам</h2></div><div className="ai-targets">{result.report.analysis.targets.map((t,i)=><article key={i}><span>0{i+1}</span><h3>{t.title}</h3><p>{t.action}</p><blockquote lang="en">{t.example}</blockquote></article>)}</div>
    <p className="ai-disclaimer">ЖИ талдауы мұғалімнің бағасын өзгертпейді. Нәтижені оқу үшін қолдан, ұсыныстарды өз ойыңмен тексер.</p>
  </section>}
 </section>
}
function PenIcon(){return <FileText size={22}/>}
function BookIcon(){return <ScanText size={21}/>}
