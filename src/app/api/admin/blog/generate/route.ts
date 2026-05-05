import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { topic, categoryId, seriesId, authorId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const services = getInitialServices();
    let text = '';

    const prompt = `You are a world-class SEO Content Strategist and professional blog editor specializing in high-authority tech and gaming reviews (like Tom's Hardware, The Verge, and IGN). 
    Generate a high-quality, SEO-optimized blog post about "${topic}".
    
    CRITICAL CONTEXT: The primary audience is Trading Card Game (TCG) collectors (Pokémon, Yu-Gi-Oh!, MTG). 
    Every post MUST link the subject back to TCG collection, investment, or preservation.
    
    SEO & STYLE REQUIREMENTS (MANDATORY):
    1. FEATURED SNIPPET: Start with a "Key Takeaways" or "Quick Specs" box (Markdown table or list) to capture Position Zero.
    2. E-E-A-T: Write from a "first-person enthusiast" perspective (e.g., "In our testing," "Our community found"). Refer to industry-standard grading terms.
    3. SEMANTIC RICHNESS: Naturally weave in related keywords and entities (e.g., PSA, BGS, centration, surface, market volatility).
    4. STRUCTURE: Use H1 for title, H2/H3 for headers. Use bolding for emphasis.
    5. FAQ SECTION: Include a 3-question "Frequently Asked Questions" section at the end of the post.
    6. LENGTH: The content must be deep, insightful, and approximately 1200+ words of Markdown.
    
    Return the response strictly as a JSON object with the following structure:
    {
      "title": "A compelling, SEO-rich authoritative title",
      "slug": "url-friendly-slug-with-primary-keywords",
      "excerpt": "A short 2-3 sentence summary designed to win the Meta Description",
      "content": "Deep, structured Markdown content following all SEO requirements above",
      "tags": ["tag1", "tag2"],
      "metaTitle": "SEO title (max 60 chars)",
      "metaDescription": "SEO description (max 160 chars)"
    }
    
    Make the content thorough and insightful. Ensure the JSON is valid.`;

    // Try AI generation with fallback logic
    const tryGenerate = async (modelName: string, isVertex: boolean) => {
      try {
        if (!isVertex) {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          return result.response.text();
        } else {
          const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'shopmore-1e34b';
          const location = 'us-central1';
          const vertexAI = new VertexAI({ project, location });
          const generativeModel = vertexAI.getGenerativeModel({ model: modelName });
          const resp = await generativeModel.generateContent(prompt);
          const contentResponse = await resp.response;
          return contentResponse.candidates?.[0].content.parts[0].text || '';
        }
      } catch (err: any) {
        console.warn(`[AI] Model ${modelName} failed: ${err.message}. Trying fallback...`);
        return null;
      }
    };

    const preferredModel = 'gemini-3.1-pro-preview';
    const fallbackModel = 'gemini-1.5-flash';
    const imageModelName = 'gemini-3.1-flash-image-preview';
    const isVertex = !process.env.GEMINI_API_KEY;

    // 1. Generate Article Content
    text = await tryGenerate(preferredModel, isVertex) || '';
    if (!text) {
      console.log(`[AI] Falling back to ${fallbackModel} for content`);
      text = await tryGenerate(fallbackModel, isVertex) || '';
    }

    if (!text) {
      throw new Error('Failed to generate content: Empty response from AI model');
    }

    // 2. Generate Feature Image (using the new image-preview model)
    console.log(`[AI] Generating feature image using ${imageModelName}...`);
    const imagePrompt = `Generate a high-quality, professional feature image for a blog post titled: "${topic}". The style should be high-end tech photography or epic digital art, optimized for TCG collectors. Return ONLY the image URL or a base64 string.`;
    const featureImageResult = await tryGenerate(imageModelName, isVertex);
    const featuredImageUrl = featureImageResult || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'; // High-quality fallback

    if (!text) {
      throw new Error('Failed to generate content: Empty response from AI model');
    }

    // Clean the response text (remove Markdown code blocks if present)
    const jsonString = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString);

    const articleId = crypto.randomUUID();
    const article = {
      id: articleId,
      categoryId: categoryId || 'general',
      title: data.title,
      slug: data.slug + '-' + Math.floor(Math.random() * 1000), // Ensure uniqueness
      excerpt: data.excerpt,
      content: data.content,
      tags: data.tags,
      type: 'blog',
      status: 'draft',
      authorId: authorId || null,
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featuredImageUrl: featuredImageUrl,
      seriesId: seriesId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save using the repository
    await services.knowledgebaseRepository.saveArticle(article as any);

    return NextResponse.json({ 
      success: true, 
      articleId,
      article: {
        title: article.title,
        slug: article.slug,
        status: article.status
      }
    });
  } catch (error: any) {
    console.error('Content Generation Error:', error);
    return NextResponse.json({ 
      error: error.message,
      suggestion: error.code === 403 ? 'Ensure Vertex AI API is enabled and your account has "Vertex AI User" role, or provide GEMINI_API_KEY in .env' : undefined
    }, { status: 500 });
  }
}
