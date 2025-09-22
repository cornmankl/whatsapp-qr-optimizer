import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, knowledgeBase = [] } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Build context from knowledge base
    let knowledgeContext = ''
    if (knowledgeBase.length > 0) {
      knowledgeContext = '\n\nRelevant knowledge from your second brain:\n'
      knowledgeBase.forEach((item, index) => {
        knowledgeContext += `${index + 1}. ${item.title}: ${item.content}\n`
      })
    }

    const systemPrompt = `You are an AI assistant integrated with a Second Brain system. Your goal is to help the user manage their knowledge, tasks, and learning effectively.

Capabilities:
- Answer questions based on the user's knowledge base
- Help organize and categorize information
- Suggest connections between ideas
- Assist with task management and prioritization
- Provide learning recommendations
- Generate summaries and insights

Always be helpful, concise, and practical. Use the provided knowledge base context when relevant to answer questions.${knowledgeContext}

Current date: ${new Date().toISOString().split('T')[0]}`

    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    const completion = await zai.chat.completions.create({
      messages: apiMessages,
      max_tokens: 800,
      temperature: 0.7
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I cannot generate a response at the moment.'

    return NextResponse.json({ 
      response: response.trim(),
      usage: completion.usage
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
  }
}