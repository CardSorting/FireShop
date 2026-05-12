import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { assertRateLimit, hasValidBearerToken, jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';

async function requireBlogGeneratorAccess(req: Request): Promise<void> {
  if (hasValidBearerToken(req, process.env.CRON_SECRET)) return;
  await requireAdminSession(req);
}

export async function POST(req: Request) {
  try {
    await requireBlogGeneratorAccess(req);
    await assertRateLimit(req, 'admin_blog_generate', 3, 60_000);
    const body = await readJsonObject(req);
    const topic = requireString(body.topic, 'topic');
    const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : undefined;
    const seriesId = typeof body.seriesId === 'string' ? body.seriesId.trim() : undefined;
    const authorId = typeof body.authorId === 'string' ? body.authorId.trim() : undefined;

    const services = getInitialServices();
    let text = '';

    const prompt = `You are a world-class SEO Content Strategist and professional blog editor specializing in high-authority tech and gaming reviews (like Tom's Hardware, The Verge, and IGN). 
    Generate a high-quality, SEO-optimized blog post about "${topic}".
    
    CRITICAL CONTEXT: The primary audience is Trading Card Game (TCG) collectors (Pokémon, Yu-Gi-Oh!, MTG). 
    Every post MUST link the subject back to TCG collection, investment, or preservation.
    
    DECKLIST REQUIREMENTS:
    If the topic involves a decklist, you MUST provide a FULL, tournament-legal list. 
    - Pokémon/MTG: Exactly 60 cards.
    - Yu-Gi-Oh!: 40-60 card Main Deck + 15 card Extra Deck.
    - NEVER summarize decklists. List every card name and quantity (e.g., "3x Pikachu VMAX").
    - Use a clear Markdown table or structured list for the decklist.
    
    ADVANCED STRATEGY REQUIREMENTS:
    1. MATCHUP ANALYSIS: Provide a detailed breakdown of how the deck performs against 3 current top-tier meta threats.
    2. COMBO SEQUENCES: Include at least 2 step-by-step combo lines (e.g., "Step 1: Summon X, Step 2: Activate Y").
    3. SIDEBOARDING IN/OUT: Provide a specific "In/Out" table for at least 2 major matchups (which cards to remove, which to add).
    4. PROBABILITY STATS: Include a "Consistency Metric" section discussing the statistical chance of opening with key starters (e.g., "85% chance to see a Level 1 Tuner in the opening hand").
    5. COLLECTOR'S CORNER: Add a section on the investment value of the high-rarity cards in the list (PSA 10 targets, print run rarity).
    
    SEO & STYLE REQUIREMENTS (MANDATORY):
    1. LENGTH: The content must be EXHAUSTIVE and a minimum of 2500+ words of Markdown.
    2. PILLAR CONTENT STRUCTURE: Use the following required H2 sections:
       - "Historical Context & Meta Evolution" (The deck's journey over time).
       - "Full Card-by-Card Technical Breakdown" (Analyze EVERY card in the decklist individually).
       - "Advanced Play Patterns & Micro-Decisions" (Decision trees for complex board states).
       - "The Economic Landscape" (Price trends, print variants, and investment liquidity).
    3. FEATURED SNIPPET: Start with a "Key Takeaways" box.
    4. E-E-A-T: Use "Forensic Enthusiast" tone.
    5. INTERNAL LINKING: Naturally suggest links to related products (e.g., "Check out our museum-grade deck boxes to protect this list").
    6. FAQ SECTION: 5 detailed questions.
    
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

    const preferredModel = 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash';
    const imageModelName = 'gemini-2.5-flash-image';
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
    const featuredImageUrl = featureImageResult || '/assets/generated/generic_tcg_strategy_1778177431609.png'; // High-quality fallback

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
      content: data.content, // We will sanitize this below
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

    // Production Hardening: Sanitize AI-generated content before saving to DB
    // This prevents XSS if the AI model generates malicious scripts or if 
    // a prompt injection attack forces it to do so.
    const { sanitizeHtml } = await import('@utils/sanitizer');
    if (article.content) article.content = sanitizeHtml(article.content);
    if (article.excerpt) article.excerpt = sanitizeHtml(article.excerpt);
    if (article.title) article.title = sanitizeHtml(article.title);

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
    return jsonError(error, 'Content generation failed');
  }
}
