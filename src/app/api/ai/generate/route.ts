import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, type = 'content', context = '' } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    let systemPrompt = ''
    let userPrompt = ''

    switch (type) {
      case 'content':
        systemPrompt = 'You are an expert content creator who can generate high-quality, informative content on any topic.'
        userPrompt = `Generate comprehensive content about: ${prompt}\n\nContext: ${context}\n\nContent:`
        break
      case 'ideas':
        systemPrompt = 'You are a creative ideation expert who can generate innovative and practical ideas.'
        userPrompt = `Generate creative ideas related to: ${prompt}\n\nContext: ${context}\n\nIdeas (numbered list):`
        break
      case 'questions':
        systemPrompt = 'You are an expert question generator who can create thought-provoking and relevant questions.'
        userPrompt = `Generate insightful questions about: ${prompt}\n\nContext: ${context}\n\nQuestions:`
        break
      case 'tasks':
        systemPrompt = 'You are a project management expert who can break down complex topics into actionable tasks.'
        userPrompt = `Break down "${prompt}" into actionable tasks:\n\nContext: ${context}\n\nTasks (numbered list):`
        break
      default:
        systemPrompt = 'You are a helpful assistant.'
        userPrompt = prompt
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const generatedContent = completion.choices[0]?.message?.content || 'Unable to generate content'

    return NextResponse.json({ 
      content: generatedContent.trim(),
      type,
      prompt
    })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}