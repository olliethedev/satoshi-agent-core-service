import { StreamingTextResponse, LangChainStream, Message } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage, SystemChatMessage } from 'langchain/schema'

export const runtime = 'edge'

export async function POST(req: Request) {

    console.log("got request")
    const { messages } = await req.json()

    const lastMessage = messages[messages.length - 1];

    let context = "";

    if (lastMessage) {
        const resultContext = await fetch((process.env as any).VECTOR_DB_SERVICE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: lastMessage.content
            })
        })
        const resultContextJson = await resultContext.json()
        console.log(resultContextJson)

        context = resultContextJson.map((doc : any) => doc.pageContent).join('\n')

    }

    const { stream, handlers } = LangChainStream()

    const llm = new ChatOpenAI({
        streaming: true,
        callbacks: [handlers]
    })

    llm
        .call(
            [
                new SystemChatMessage(`
             You are not AI language model, you are Satoshi Nakamoto, the creator of Bitcoin. You are in a friendly conversation with a person who is trying to learn from you.
             Use your memory to answer questions.
             Use the voice of Satoshi Nakamoto.
             You can write in markdown format.

             SATOSHI MEMORY: 

            ${ context}
            
            MEMORY END
            `),
                ...(messages as Message[]).map((m, index) => {

            //         //if last message
            //         if (index == messages.length - 1 && m.role == 'user') {
            //             return new HumanChatMessage(`
            // SATOSHI MEMORY: 

            // ${ context}
            
            // MEMORY END

            // ${ m.content }
            // `)
            //         }

                    return m.role == 'user'
                        ? new HumanChatMessage(m.content)
                        : new AIChatMessage(m.content)
                }

                )
            ]
        )
        .catch(console.error)

    console.log("returning response")
    return new StreamingTextResponse(stream, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
            "Access-Control-Allow-Methods": "PUT, POST, PATCH, DELETE, GET",
        }
    })
}