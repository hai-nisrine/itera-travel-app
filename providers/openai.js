export async function callOpenAI({system,messages,schema,model}) {
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey) throw Error("Missing OPENAI_API_KEY");
 const {default:OpenAI}=await import("openai");
 const client=new OpenAI({apiKey,timeout:30000,maxRetries:0});
 const res=await client.responses.create({model,instructions:system,input:messages.map(m=>({role:m.role,content:m.text})),text:{format:{type:"json_schema",name:"response",schema,strict:true}},max_output_tokens:4096,store:false});
 if(res.status!=="completed") throw Error("OpenAI response incomplete");
 return {text:res.output_text,usage:{input:res.usage?.input_tokens??0,output:res.usage?.output_tokens??0}};
}
