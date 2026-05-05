import { adminStorage } from '../src/infrastructure/firebase/admin.ts';
import fs from 'fs';
import path from 'path';

/**
 * Script to upload generated artifacts to Firebase Storage
 */

const ARTIFACT_DIR = '/Users/bozoegg/.gemini/antigravity/brain/b50fc1aa-4a7f-4d39-b037-fb580b949268';

const UPLOAD_MAP = [
  // Poke Anime
  { local: 'anime_pikachu_deck_feature_1778020326304.png', remote: 'blog/anime_pikachu_deck_feature.png' },
  { local: 'anime_blastoise_deck_feature_1778020339371.png', remote: 'blog/anime_blastoise_deck_feature.png' },
  
  // Archeology
  { local: 'vintage_card_hunting_feature_1778020166049.png', remote: 'blog/vintage_card_hunting_feature.png' },
  { local: 'fake_card_authentication_feature_1778020178316.png', remote: 'blog/fake_card_authentication_feature.png' },
  
  // Market
  { local: 'tcg_market_analytics_feature_1778019780254.png', remote: 'blog/tcg_market_analytics_feature.png' },
  { local: 'grading_pop_report_feature_1778019794663.png', remote: 'blog/grading_pop_report_feature.png' },
  
  // Tech
  { local: 'tcg_scanner_feature_1778019580923.png', remote: 'blog/tcg_scanner_feature.png' },
  { local: 'uv_display_feature_1778019594439.png', remote: 'blog/uv_display_feature.png' },
  
  // Aesthetics
  { local: 'custom_keyboard_battle_station_feature_1778019935329.png', remote: 'blog/custom_keyboard_battle_station_feature.png' },
  { local: 'rgb_lighting_setup_feature_1778019952258.png', remote: 'blog/rgb_lighting_setup_feature.png' },
  
  // Tabletop & Misc
  { local: 'warhammer_40k_feature_1777994876481.png', remote: 'blog/warhammer_40k_feature.png' },
  { local: 'dark_magician_deck_feature_1777994677233.png', remote: 'blog/dark_magician_deck_feature.png' },
  { local: 'gloomhaven_feature_1777994861107.png', remote: 'blog/gloomhaven_feature.png' },
  { local: 'red_eyes_deck_feature_1777994605199.png', remote: 'blog/red_eyes_deck_feature.png' },
  { local: 'blue_eyes_deck_feature_1777994586600.png', remote: 'blog/blue_eyes_deck_feature.png' },
  { local: 'fourth_blue_eyes_meme_feature_1777994357106.png', remote: 'blog/fourth_blue_eyes_meme_feature.png' },
  { local: 'pot_of_greed_meme_feature_1777994268527.png', remote: 'blog/pot_of_greed_meme_feature.png' },
  { local: 'reading_card_meme_feature_1777994286428.png', remote: 'blog/reading_card_meme_feature.png' },
  { local: 'psa_vs_bgs_feature_1777993930295.png', remote: 'blog/psa_vs_bgs_feature.png' },
  { local: 'custom_keyboard_feature_1777993967532.png', remote: 'blog/custom_keyboard_feature.png' },
  { local: 'infinite_forbidden_feature_1777993949847.png', remote: 'blog/infinite_forbidden_feature.png' },
  { local: 'kdm_feature_1777994949531.png', remote: 'blog/kdm_feature.png' },
  { local: 'melee_competitive_feature_1777995095907.png', remote: 'blog/melee_competitive_feature.png' },
  { local: 'sonic_melee_rumor_feature_1777995117091.png', remote: 'blog/sonic_melee_rumor_feature.png' },
  { local: 'smash_evolution_feature_1777995196753.png', remote: 'blog/smash_evolution_feature.png' },
  { local: 'tekken_mishima_feature_1778022265127.png', remote: 'blog/tekken_mishima_feature.png' },
  { local: 'evo_moment_37_feature_1778022277934.png', remote: 'blog/evo_moment_37_feature.png' }
];

async function uploadImages() {
  console.log('--- Starting Artifact Upload to Firebase Storage ---');
  const bucket = adminStorage.bucket();

  for (const item of UPLOAD_MAP) {
    const localPath = path.join(ARTIFACT_DIR, item.local);
    
    if (!fs.existsSync(localPath)) {
      console.warn(`! Local file not found: ${localPath}`);
      continue;
    }

    console.log(`Uploading ${item.local} to ${item.remote}...`);
    
    await bucket.upload(localPath, {
      destination: item.remote,
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      }
    });
    
    console.log(`✓ Uploaded: ${item.remote}`);
  }

  console.log('--- Upload Complete! ---');
}

uploadImages().catch(console.error);
