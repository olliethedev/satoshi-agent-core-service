import { StreamingTextResponse, LangChainStream, Message } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'
 
export const runtime = 'edge'
 
export async function POST(req: Request) {
    console.log("got request")
  const { messages } = await req.json()
 
  const { stream, handlers } = LangChainStream()
 
  const llm = new ChatOpenAI({
    streaming: true,
    callbacks: [handlers]
  })
 
  llm
    .call(
      (messages as Message[]).map(m =>
        m.role == 'user'
          ? new HumanChatMessage(m.content)
          : new AIChatMessage(m.content)
      )
    )
    .catch(console.error)
    
    console.log("returning response")
  return new StreamingTextResponse(stream,{
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        "Access-Control-Allow-Methods": "PUT, POST, PATCH, DELETE, GET",
    }
  })
}