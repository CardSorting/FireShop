import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for FGC Lore & Legends (The Hotpot)
 */

const BLOG_SERIES = [
  {
    id: 'series-fgc-hotpot',
    title: 'The FGC Hotpot: Quarter-Circles and Comebacks',
    slug: 'the-fgc-hotpot-quarter-circles-comebacks',
    description: 'Celebrating the high-stakes history, legendary rivalries, and iconic highlights of the Fighting Game Community.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fevo_moment_37_feature.png?alt=media',
    categoryIds: ['fgc'],
    articleCount: 2,
    difficulty: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-fgc-1',
    categoryId: 'fgc',
    seriesId: 'series-fgc-hotpot',
    seriesPosition: 1,
    title: 'Evo Moment 37: The Parry That Defined Competitive Gaming',
    slug: 'evo-moment-37-daigo-parry-history',
    excerpt: 'Daigo vs. Justin Wong. Evo 2004. 15 parries. One legendary comeback. We relive the 10 seconds that changed the Fighting Game Community forever.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fevo_moment_37_feature.png?alt=media',
    featuredImageAlt: 'Ken parrying Chun-Li in Street Fighter III: 3rd Strike',
    tags: ['fgc', 'evo', 'daigo', 'street-fighter', 'history'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 1337,
    helpfulCount: 255,
    notHelpfulCount: 0,
    metaTitle: 'Evo Moment 37 History: The Daigo Parry Explained',
    metaDescription: 'Relive the most famous moment in esports history. Explore the technical skill behind the Daigo parry at Evo 2004 and its impact on the FGC.',
    content: `
# Evo Moment 37: The Parry That Defined Competitive Gaming

### Key Takeaways (The Frame Specs)
- **Match**: Daigo Umehara (Ken) vs. Justin Wong (Chun-Li).
- **Game**: Street Fighter III: 3rd Strike.
- **The Feat**: 15 consecutive parries against Chun-Li's Super Art, including a mid-air parry and a jump-kick punish.

## Introduction
"Rarely has a video game performance been described as a 'miracle,' but on a hot August day in 2004 at the California State Polytechnic University, the Fighting Game Community witnessed exactly that."

## The Stakes
Daigo Umehara was down to a pixel of health. One blocked hit—even a chip-damage block—would end the match. Justin Wong, playing Chun-Li, unleashed her "Houyoku-sen" Super Art, a flurry of 17 kicks. Most players would have conceded. Daigo did the impossible: he parried them all.

## Why it Matters
Moment 37 wasn't just a win; it was a demonstration of absolute technical mastery and mental fortitude. It proved that in the FGC, you are never truly out until the "K.O." appears on screen. It remains the most influential clip in competitive gaming history.

## FAQ
**Q: How hard is the parry?**
A: Incredibly. Parrying in 3rd Strike requires tapping "Forward" into the attack within a 10-frame window. Doing it 15 times in a row against a high-speed super is a feat of legendary timing.

**Q: Did Daigo win the tournament?**
A: Surprisingly, no. He won the set against Justin, but eventually lost in the finals to Kenji "KO" Obata.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-fgc-2',
    categoryId: 'fgc',
    seriesId: 'series-fgc-hotpot',
    seriesPosition: 2,
    title: 'The Iron Fist Dynasty: A History of the Mishima Bloodline',
    slug: 'tekken-mishima-family-lore-history',
    excerpt: 'From Heihachi to Jin, the Mishima family has dominated the King of Iron Fist Tournament. We track the bloodline that defines Tekken.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ftekken_mishima_feature.png?alt=media',
    featuredImageAlt: 'The Mishima family standing in front of a volcano',
    tags: ['tekken', 'fgc', 'lore', 'mishima'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 489,
    helpfulCount: 72,
    notHelpfulCount: 1,
    metaTitle: 'Tekken Mishima Family Lore: A Complete History',
    metaDescription: 'Dive deep into the chaotic history of the Mishima bloodline. From cliff-throws to the Devil Gene, explore the lore behind the Iron Fist Dynasty.',
    content: `
# The Iron Fist Dynasty: A History of the Mishima Bloodline

### Quick Stats (The Mishima Factor)
- **Key Figures**: Heihachi, Kazuya, Jin Kazama.
- **Main Theme**: Generational trauma, cliff-throwing, and the Devil Gene.
- **Legacy**: The central conflict of every Tekken title.

## A Family Tradition of Betrayal
The history of Tekken is the history of the Mishima Zaibatsu. It began with Heihachi Mishima throwing his son, Kazuya, off a cliff to test his strength. This single act of "parenting" sparked a cycle of revenge that has spanned eight tournaments and nearly 30 years.

## The Devil Gene
The introduction of the Devil Gene transformed the family feud from a corporate power struggle into a supernatural war. Jin Kazama, the grandson of Heihachi, now carries the burden of this bloodline, struggling to end the Mishima cycle forever.

## The Verdict
The Mishimas are the FGC's most iconic family. Their story is a reminder that in fighting games, lore is just as intense as the gameplay.

## FAQ
**Q: Is Heihachi actually dead?**
A: In the Tekken universe, "dead" is a relative term. He has survived volcanoes, explosions, and skyscraper falls.

**Q: Who is the strongest Mishima?**
A: While Heihachi is the pure martial artist, Kazuya and Jin's Devil forms usually give them the edge in raw power.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedFGC() {
  console.log('--- Starting FGC Lore & Legends Seeding ---');
  let createdSeries = 0;
  let createdPosts = 0;

  // Seed Series
  for (const series of BLOG_SERIES) {
    const seriesRef = adminDb.collection('blog_series').doc(series.id);
    await seriesRef.set({
      ...series,
      createdAt: Timestamp.fromDate(series.createdAt),
      updatedAt: Timestamp.fromDate(series.updatedAt),
    }, { merge: true });
    console.log(`✓ Series Seeded: ${series.title}`);
    createdSeries++;
  }

  // Seed Posts
  for (const post of BLOG_POSTS) {
    const postRef = adminDb.collection('knowledgebase_articles').doc(post.id);
    await postRef.set({
      ...post,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
    }, { merge: true });
    console.log(`✓ FGC Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} FGC Posts. ---`);
}

seedFGC().catch(console.error);
