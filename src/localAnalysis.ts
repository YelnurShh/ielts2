export function analyzeLocally(question:string,essay:string){
 const words=essay.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
 const sentences=essay.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.filter(s=>s.trim())||[];
 const paragraphs=essay.trim().split(/\n\s*\n/).filter(Boolean);
 const normalized=words.map(w=>w.toLowerCase());
 const stop=new Set('the a an is are was were be been being to of and or in on at for with as by it its this that these those i we they he she you my our their his her have has had do does did will would can could should may might not from which who what when where how than then also'.split(' '));
 const frequency=new Map<string,number>();
 normalized.filter(w=>w.length>3&&!stop.has(w)).forEach(w=>frequency.set(w,(frequency.get(w)||0)+1));
 const repeated=[...frequency].filter(([,n])=>n>=4).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const links=['however','therefore','furthermore','moreover','for example','for instance','in addition','although','on the other hand','in conclusion','to conclude','as a result'];
 const foundLinks=links.filter(w=>new RegExp('\\b'+w+'\\b','i').test(essay));
 const longSentences=sentences.map(s=>s.trim()).filter(s=>(s.match(/[A-Za-z]+/g)||[]).length>35);
 const topicWords=[...new Set((question.toLowerCase().match(/[a-z]{4,}/g)||[]).filter(w=>!stop.has(w)&&!['discuss','opinion','agree','disagree','extent','views','give','your','some','people','think','believe'].includes(w)))];
 const matched=topicWords.filter(w=>normalized.includes(w));
 const flags:{text:string;detail:string}[]=[];
 if(words.length<250)flags.push({text:'Мәтін 250 сөзден қысқа',detail:'Task 2 үшін кемінде 250 сөз жаз. Идеяларыңды түсіндіру және мысалдар арқылы дамыт.'});
 if(paragraphs.length<3)flags.push({text:'Абзацтарға бөлуді тексер',detail:'Кіріспе, негізгі бөлім және қорытындыны бос жолмен бөл. Абзац санының өзі сапаны анықтамайды.'});
 if(longSentences.length)flags.push({text:`35 сөзден ұзын ${longSentences.length} сөйлем бар`,detail:'Сөйлемдердің мағынасы түсінікті екенін тексер. Қажет болса, екі сөйлемге бөл.'});
 if(!/[.!?]$/.test(essay.trim()))flags.push({text:'Соңғы тыныс белгісін тексер',detail:'Мәтіннің соңында сөйлемді аяқтайтын тыныс белгісі жоқ.'});
 if(/\bi\b/.test(essay))flags.push({text:'«i» есімдігі кіші әріппен жазылған',detail:'Ағылшын тіліндегі жеке I есімдігін бас әріппен жаз.'});
 const duplicated=[...essay.matchAll(/\b([a-z]+)\s+\1\b/gi)].map(m=>m[0]);
 if(duplicated.length)flags.push({text:'Қатар қайталанған сөздер',detail:duplicated.slice(0,5).join('; ')+'. Әдейі қолданылғанын тексер.'});
 if(/\b(don't|doesn't|can't|won't|isn't|aren't|I'm|it's)\b/i.test(essay))flags.push({text:'Қысқарған формалар бар',detail:'Академиялық стильде do not, cannot, it is сияқты толық формаларды қолдануды қарастыр.'});
 return {wordCount:words.length,sentences:sentences.length,paragraphs:paragraphs.length,average:sentences.length?Math.round(words.length/sentences.length):0,repeated,foundLinks,longSentences,flags,topicWords,matched};
}
