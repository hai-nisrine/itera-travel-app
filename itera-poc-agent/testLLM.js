import {callLLM} from "./llm.js";
const schema={type:"object",additionalProperties:false,properties:{city:{type:"string"},price_mad:{type:"number"},wheelchair_access:{type:"string",enum:["yes","no","unknown"]}},required:["city","price_mad","wheelchair_access"]};
for(const provider of ["gemini","openai"]){
 try {
 const r=await callLLM({provider,system:"Extract only stated facts. Unknown accessibility must remain unknown.",prompt:"Trip to Ifrane costs 500 MAD. Wheelchair access was not checked.",schema});
 if(r.data.city!=="Ifrane"||r.data.price_mad!==500||r.data.wheelchair_access!=="unknown")throw Error("Extraction mismatch");
 console.log(provider,r.model,r.ms+" ms",r.data,r.usage);
 }catch(err){console.error(provider+" failed: "+err.message);process.exitCode=1;}
}
