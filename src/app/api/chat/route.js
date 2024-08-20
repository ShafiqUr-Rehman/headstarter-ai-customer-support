import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = 'You are a helpful assistant.';

export async function POST(req) {
  const openai = new OpenAI();
  const { messages } = await req.json(); // Ensure messages are destructured correctly

  if (!Array.isArray(messages)) {
    return new NextResponse('Invalid request format', { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: 'gpt-3.5-turbo', // Use the correct model
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('API call error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
