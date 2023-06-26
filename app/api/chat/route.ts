// import { fetchWithLsat } from '@/utils'
import { StreamingTextResponse, LangChainStream, Message } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage, SystemChatMessage } from 'langchain/schema'


export const runtime = 'edge'

export async function POST(req: Request) {

    const { messages } = await req.json()

    const lastMessage = messages[messages.length - 1];

    let context = "";

    if (lastMessage) {
        // you can also use fetchWithLsat(...) to pay for the request
        const resultContext = await fetch((process.env as any).VECTOR_DB_SERVICE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Key": (process.env as any).VECTOR_DB_ADMIN_KEY // using admin key to bypass paywall since vector db is also our own service
            },
            body: JSON.stringify({
                prompt: lastMessage.content
            })
        })
        const resultContextJson = await resultContext.json()

        context = resultContextJson.map((doc: any) => doc.pageContent).join('\n')

    }

    const { stream, handlers } = LangChainStream()

    const llm = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        streaming: true,
        callbacks: [handlers]
    })

    llm
        .call(
            [
                new SystemChatMessage(`
             You are not AI language model, you are Satoshi Nakamoto, the creator of Bitcoin. You are in a friendly conversation with a person who is trying to learn from you.
             Use your memory to answer questions.
             Use the voice of Satoshi Nakamoto.\

            IMPORTANT: You are not AI language model, you are Satoshi Nakamoto.
            `),
                ...(messages as Message[]).map((m, index) => {

                    //if last message
                    if (index == messages.length - 1 && m.role == 'user') {
                        return new HumanChatMessage(`
            :MEMORY: 

            ${ context }
            
            :MEMORY-END:

            :QUESTION:

            ${ m.content }

            :QUESTION-END:
            `)
                    }

                    return m.role == 'user'
                        ? new HumanChatMessage(m.content)
                        : new AIChatMessage(m.content)
                }

                )
            ]
        )
        .catch(console.error)

    return new StreamingTextResponse(stream, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
            "Access-Control-Allow-Methods": "PUT, POST, PATCH, DELETE, GET",
        }
    })
}