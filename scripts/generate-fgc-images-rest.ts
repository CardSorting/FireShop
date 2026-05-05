import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

/**
 * [LAYER: UTILITY]
 * Vertex AI REST API Image Generation (Bypassing SDK limitations)
 */

const project = 'dreambees-alchemist';
const location = 'us-central1';
const modelName = 'gemini-3.1-flash-image-preview';
const keyPath = '/Users/bozoegg/Desktop/DreamBeesArt/dreambees-alchemist-d9b93dca6bf4.json';

async function generateImageRest(prompt: string, fileName: string) {
  try {
    const auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    if (!token) throw new Error('Failed to get access token');

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelName}:generateContent`;

    console.log(`Generating image for: ${fileName} via REST...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          // Adjust if the model has specific config requirements for image generation
        }
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error(`! REST API Error for ${fileName}:`, JSON.stringify(data, null, 2));
      return;
    }

    console.log(`Response received for ${fileName}`);
    
    const candidate = data.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData || p.fileData);

    if (imagePart?.inlineData) {
      const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const filePath = path.join(process.cwd(), 'public', 'blog', fileName);
      fs.writeFileSync(filePath, buffer);
      console.log(`✓ Image saved to ${filePath}`);
    } else {
      console.warn(`! No image data found in REST response for ${fileName}`);
      // Log the whole response to debug
      // console.log(JSON.stringify(data, null, 2));
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
    await generateImageRest(img.prompt, img.fileName);
  }
}

run().catch(console.error);
