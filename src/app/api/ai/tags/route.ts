import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, maxTags = 5 } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const prompt = `Analyze the following content and suggest ${maxTags} relevant tags. Tags should be:
- Single words or short phrases (2-3 words max)
- Lowercase
- Relevant to the content
- Cover main topics, themes, and concepts
- Separated by commas

Content: "${content}"

Tags:`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert tagger who can identify key topics and themes in content and suggest relevant, concise tags.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    })

    const tagsText = completion.choices[0]?.message?.content || ''
    const tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)

    return NextResponse.json({ 
      tags,
      contentLength: content.length
    })
  } catch (error) {
    console.error('Error generating tags:', error)
    return NextResponse.json({ error: 'Failed to generate tags' }, { status: 500 })
  }
}