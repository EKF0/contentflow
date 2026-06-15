import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export async function generateTitles(topic: string): Promise<StreamingTitleResult> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a content marketing expert. Generate engaging, SEO-friendly content titles.',
      },
      {
        role: 'user',
        content: `Generate 5 compelling content titles for a piece about: "${topic}". Return ONLY a JSON array of strings, no markdown. Example: ["Title 1", "Title 2", ...]`,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return { stream };
}

export async function generateOutline(title: string): Promise<StreamingOutlineResult> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a content strategist. Create detailed article outlines with clear section headings.',
      },
      {
        role: 'user',
        content: `Create a detailed content outline for: "${title}". Include an introduction section, 3-5 main sections (h2), and 2-3 subsections (h3) under each main section. Return as a JSON array of objects: [{"level": "h2"|"h3", "text": "..."}]. Return ONLY the JSON, no markdown.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return { stream };
}

export async function generateTags(
  title: string,
  content: string,
): Promise<StreamingTagsResult> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a content tagging expert. Suggest relevant, specific tags for content.',
      },
      {
        role: 'user',
        content: `Suggest 5-10 relevant tags for this content:\n\nTitle: "${title}"\nContent preview: "${content.slice(0, 500)}"\n\nReturn ONLY a JSON array of strings, no markdown. Example: ["tag1", "tag2", ...]`,
      },
    ],
    temperature: 0.5,
    max_tokens: 300,
  });

  return { stream };
}

export async function generateSocialSnippets(
  content: string,
): Promise<StreamingSocialResult> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a social media marketing expert. Create platform-specific social media snippets that drive engagement.',
      },
      {
        role: 'user',
        content: `Create social media snippets for this content:\n\n"${content.slice(0, 1000)}"\n\nReturn a JSON object with three keys:\n- "twitter": A tweet (max 280 chars) with 1-2 relevant hashtags\n- "linkedin": A professional LinkedIn post (2-3 sentences, professional tone)\n- "instagram": An Instagram caption (engaging, emoji-rich, with 5-10 hashtags)\n\nReturn ONLY the JSON, no markdown.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 800,
  });

  return { stream };
}

export interface StreamingTitleResult {
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}

export interface StreamingOutlineResult {
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}

export interface StreamingTagsResult {
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}

export interface StreamingSocialResult {
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}

export async function collectStreamToString(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
): Promise<string> {
  let result = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      result += delta;
    }
  }
  return result;
}
