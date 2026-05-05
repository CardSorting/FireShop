import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

/**
 * [LAYER: UTILITY]
 * Gemini API SDK Image Generation (Targeting gemini-3.1-flash-image-preview)
 */

const apiKey = process.env.GEMINI_API_KEY;
const modelName = 'gemini-3.1-flash-image-preview';

async function generateImageGemini(prompt: string, fileName: string) {
  if (!apiKey) {
    console.error('! No GEMINI_API_KEY found in .env');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`Generating image for: ${fileName} via Gemini SDK...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log(`Response received for ${fileName}`);
    
    // Check if the response contains image data
    // Note: Standard Gemini SDK generateContent usually returns text.
    // If this is a specific image model, it might return a specific part type.
    
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData || p.fileData);

    if (imagePart?.inlineData) {
      const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filePath = path.join(process.cwd(), 'public', 'blog', fileName);
      fs.writeFileSync(filePath, buffer);
      console.log(`✓ Image saved to ${filePath}`);
    } else {
      console.warn(`! No image data found in Gemini SDK response for ${fileName}`);
      console.log('Text response:', response.text());
    }
  } catch (err: any) {
    console.error(`Error generating image ${fileName}:`, err.message);
  }
}

async function run() {
  const images = [
    {
      prompt: "Epic digital art of the legendary 'Evo Moment 37' in Street Fighter III: 3rd Strike. Features Chun-Li unleashing a super move and Ken (Daigo) parrying every single strike in a blur of motion. Stylized arcade graphics vibe, vibrant sparks and impact effects, dramatic fighting game aesthetic.",
      fileName: 'evo_moment_37_feature.png'
    },
    {
      prompt: "A dark, intense digital painting of the Mishima family from Tekken: Heihachi, Kazuya, and Jin Kazama. They are standing in front of a erupting volcano (the iconic cliff). Cinematic lighting, muscular character designs, red and orange fire glow, high-end fighting game art style.",
      fileName: 'tekken_mishima_feature.png'
    }
  ];

  for (const img of images) {
    await generateImageGemini(img.prompt, img.fileName);
  }
}

run().catch(console.error);
