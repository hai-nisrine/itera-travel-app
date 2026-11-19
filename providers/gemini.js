export async function callGemini({system,messages,schema,model}) {
 const apiKey=process.env.GEMINI_API_KEY;
 if(!apiKey) throw Error("Missing GEMINI_API_KEY");
 const {GoogleGenAI}=await import("@google/genai");
 const client=new GoogleGenAI({apiKey,httpOptions:{timeout:30000}});
 const res=await client.models.generateContent({model,contents:messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.text}]})),config:{systemInstruction:system,responseMimeType:"application/json",responseJsonSchema:schema,temperature:0,maxOutputTokens:4096}});
 return {text:res.text,usage:{input:res.usageMetadata?.promptTokenCount??0,output:(res.usageMetadata?.candidatesTokenCount??0)+(res.usageMetadata?.thoughtsTokenCount??0)}};
}
