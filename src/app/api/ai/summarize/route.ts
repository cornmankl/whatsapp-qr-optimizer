import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, maxLength = 200 } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const prompt = `Please summarize the following content in ${maxLength} characters or less. Focus on the key points and main ideas:

Content: "${content}"

Summary:`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert summarizer who can extract key information from any text and create concise, meaningful summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary'

    return NextResponse.json({ 
      summary: summary.trim(),
      originalLength: content.length,
      summaryLength: summary.length
    })
  } catch (error) {
    console.error('Error summarizing content:', error)
    return NextResponse.json({ error: 'Failed to summarize content' }, { status: 500 })
  }
}