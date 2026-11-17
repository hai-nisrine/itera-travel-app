export async function callLLM(messages){
 const endpoint=process.env.LLM_BASE_URL,model=process.env.LLM_MODEL,key=process.env.LLM_API_KEY;
 if(!endpoint||!model)throw Error('LLM not configured: set LLM_BASE_URL and LLM_MODEL');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(endpoint.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',...(key?{'Authorization':'Bearer '+key}:{})},body:JSON.stringify({model,messages,temperature:0,response_format:{type:'json_object'}})});
  if(!response.ok)throw Error('LLM HTTP '+response.status);
  const data=await response.json();const content=data.choices?.[0]?.message?.content;
  if(typeof content!=='string')throw Error('LLM response missing content');
  return JSON.parse(content);
 }finally{clearTimeout(timeout);}
}
