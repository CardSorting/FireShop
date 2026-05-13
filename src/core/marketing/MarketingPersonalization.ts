/**
 * [LAYER: CORE]
 * Marketing Personalization Engine
 * Uses Hermes/Concierge logic to generate high-fidelity, personalized marketing content.
 */
import { MarketingCampaign } from '@domain/models';
import { logger } from '@utils/logger';
import { createHermesChatCompletion } from '@infrastructure/services/HermesService';
import { MarketingIntelligence } from './MarketingIntelligence';

export class MarketingPersonalization {
  constructor(private intelligence: MarketingIntelligence) {}

  /**
   * Generates uniquely catered content via Hermes.
   */
  async generateAIPersonalization(campaign: MarketingCampaign, userId: string): Promise<{ subject: string; body: string }> {
    const investigation = await this.intelligence.deepInvestigate(userId);
    const activeStep = campaign.steps?.[0];
    
    const prompt = `
      You are Sarah, the DreamBees Concierge. Write a uniquely catered lifecycle marketing message that feels like a helpful human follow-up, not a generic blast.
      
      CAMPAIGN TYPE: ${campaign.type}
      CAMPAIGN GOAL: ${campaign.description}
      LIFECYCLE STAGE: ${campaign.lifecycleStage || 'unspecified'}
      OFFER STRATEGY: ${activeStep?.offerStrategy || campaign.offerStrategy || 'help_first'}
      STEP OBJECTIVE: ${activeStep?.objective || 'conversion'}
      
      ### CUSTOMER NARRATIVE:
      ${investigation.narrative}
      
      ### FORENSIC INTELLIGENCE:
      - Evidence Confidence: ${investigation.confidenceBand} (${investigation.evidenceScore}/100)
      - Lifecycle Segment: ${investigation.lifecycleSegment}
      - Path to Purchase: ${investigation.pathToPurchase}
      - Cohort Standing: ${investigation.cohortStanding}
      - Lifecycle Suggestion: ${investigation.lifecycleType}
      - Predicted CLV: $${(investigation.clv / 100).toFixed(2)}
      - Psychographic Profile: ${investigation.psychographic}
      - Top Collection Affinity: ${investigation.topCollection}
      - Current Cart Signal: ${investigation.currentCartSignal}
      - Recent Needs: ${investigation.recentNeeds?.join('; ') || 'None captured'}
      - Suppression Reasons: ${investigation.suppressionReasons?.join('; ') || 'None'}
      - Recommended Offer: ${investigation.recommendedOffer}
      - Next Best Campaign: ${investigation.nextBestCampaign?.type} (${investigation.nextBestCampaign?.rationale})
      
      TEMPLATE SUBJECT: ${campaign.subjectTemplate}
      TEMPLATE BODY: ${campaign.bodyTemplate}
      
      INSTRUCTIONS:
      1. Persona: "Sarah". Warm, neighborly, but sophisticated.
      2. Use exact remembered context only when the evidence supports it. Do not invent products, discounts, stock, or shipping promises.
      3. If suppression reasons exist, make the message service-first and avoid pushing a purchase.
      4. For abandoned carts, focus on the saved cart and one clear CTA. For browse abandonment, use a lighter recommendation tone.
      5. For win-back or comeback campaigns, recognize the lapse and anchor the offer to their known collection affinity.
      6. Use one primary CTA and one concierge-assist reply path.
      7. Keep it "Studio Direct": concise, confident, no hype, no false scarcity.
      
      Return JSON:
      {
        "subject": "Personalized subject line",
        "body": "Personalized HTML body content"
      }
    `;

    try {
      const result = await createHermesChatCompletion([], prompt, 'Generate Personalized Marketing Content');
      const cleaned = result.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('Failed to generate AI personalization', error);
      return { subject: campaign.subjectTemplate || '', body: campaign.bodyTemplate || '' };
    }
  }

  /**
   * Selects an A/B test variant based on weights.
   */
  selectVariant(variants: any[]): any {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    for (const variant of variants) {
      if (random < variant.weight) return variant;
      random -= variant.weight;
    }
    return variants[0];
  }
}
