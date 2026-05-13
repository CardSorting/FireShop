import { NextResponse } from 'next/server';
import { jsonError, requireConfiguredBearerToken } from '@infrastructure/server/apiGuards';
import { logger } from '@utils/logger';

/**
 * [LAYER: API]
 * Cron Trigger for Blog Automation
 * 
 * This endpoint is designed to be hit by Google Cloud Scheduler on a schedule.
 * It selects a random trending niche and triggers the AI content generation.
 */

const NICHES = [
  { id: 'yugioh', name: 'Yu-Gi-Oh! TCG', topics: ['How to Predict the Next Yu-Gi-Oh! Banlist', 'Is Infinite Forbidden Worth It? Set Review', 'Top 10 Rarest Yu-Gi-Oh! Cards to Invest in 2026'] },
  { id: 'pokemon', name: 'Pokémon TCG', topics: ['PSA vs BGS: Which is Better for Pokémon Card Grading?', 'Top 5 Rare Pokémon Cards with the Highest ROI', 'How to Spot a Fake Pokémon Card: Expert Guide'] },
  { id: 'mtg', name: 'Magic: The Gathering', topics: ['Modern Horizons 3 Meta Breakdown', 'Is MTG Arena Better than Paper? A Comparative Review', 'Best Commander Decks for Beginners under $100'] },
  { id: 'anime', name: 'Anime Trends', topics: ['Why Solo Leveling is Changing the Shonen Genre', 'Best Anime Studios of 2026: A Deep Dive', 'Top 10 Must-Watch Anime for TCG Fans'] },
  { id: 'geek', name: 'Hardware Reviews', topics: ['Best Epson vs Canon Scanners for Card Archiving', 'Top 5 Mechanical Keyboards for a Clean Desk Setup', 'Review: BenQ vs Dell for Professional Digital Art'] },
  { id: 'tech', name: 'Tech Lifestyle', topics: ['How to Build a UV-Protected Card Display Room', 'Best iPad Pro Accessories for TCG Collectors', 'Review: Pelican vs Apache Cases for Graded Card Travel'] }
];

export async function GET(req: Request) {
  try {
    requireConfiguredBearerToken(req, 'CRON_SECRET');
    const secret = process.env.CRON_SECRET!;

    // 2. Select Niche and Topic
    const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
    const topic = niche.topics[Math.floor(Math.random() * niche.topics.length)];

    logger.info('Triggering blog automation cron', { niche: niche.name, topic });

    // 3. Trigger Generation via Internal Logic
    // We call the same logic as the /api/admin/blog/generate endpoint
    // To avoid circular network calls, we should ideally extract the logic, 
    // but for now, we'll hit the endpoint internally or call the services directly.
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // We use a POST request to the generate endpoint
    const response = await fetch(`${baseUrl}/api/admin/blog/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
        Origin: new URL(baseUrl).origin,
      },
      body: JSON.stringify({
        topic: topic,
        categoryId: niche.id
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      execution: {
        niche: niche.name,
        topic: topic,
        article: result.article || null,
        error: result.error || null
      }
    });

  } catch (error: any) {
    logger.error('Cron blog automation failed', { error: error.message, stack: error.stack });
    return jsonError(error, 'Cron blog automation failed');
  }
}
