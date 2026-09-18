const string = { type: 'string' };
const list = items => ({ type: 'array', items });
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const criterion = object({ score: { type:'number', enum:Array.from({length:19},(_,i)=>i/2) }, explanation:string, strengths:list(string), improvements:list(string) });
export const analysisSchema = object({
  summary:string,
  criteria:object({TR:criterion,CC:criterion,LR:criterion,GRA:criterion}),
  structure:object({introduction:string,body:string,conclusion:string,cohesion:string}),
  corrections:list(object({original:string,corrected:string,explanation:string,category:{type:'string',enum:['grammar','vocabulary','cohesion','task']}})),
  vocabulary:list(object({original:string,improved:string,explanation:string})),
  targets:list(object({title:string,action:string,example:string})),
  revisedParagraph:object({original:string,improved:string,explanation:string}),
  warnings:list(string),
});
function matches(value, schema) {
  if (schema.type === 'string') return typeof value === 'string' && value.length <= 5000 && (!schema.enum || schema.enum.includes(value));
  if (schema.type === 'number') return typeof value === 'number' && Number.isFinite(value) && schema.enum.includes(value);
  if (schema.type === 'array') return Array.isArray(value) && value.length <= 12 && value.every(item => matches(item, schema.items));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).length === schema.required.length && schema.required.every(key => Object.hasOwn(value,key) && matches(value[key],schema.properties[key]));
}
export function validateAnalysis(value, essay) {
  if (!matches(value,analysisSchema) || value.targets.length !== 3 || !value.summary.trim()) return false;
  if (!Object.values(value.criteria).every(c=>c.explanation.trim() && c.strengths.length && c.improvements.length)) return false;
  // Do not present invented excerpts as quotes from the student's essay.
  const normalize = s => s.replace(/\s+/g,' ').trim();
  const original = normalize(essay);
  const excerpts = [...value.corrections, ...value.vocabulary, value.revisedParagraph];
  return excerpts.every(item => !item.original || original.includes(normalize(item.original)));
}
