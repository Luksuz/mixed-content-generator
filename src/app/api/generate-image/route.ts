import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateImageRequestBody, GenerateImageResponse } from '@/types/image-generation';
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateImageRequestBody;
    const { provider, prompt, numberOfImages = 1, outputFormat = "url", minimaxAspectRatio = "16:9", userId = "unknown_user" } = body;

    console.log(`🖼️ Received image generation request: provider=${provider}, userId=${userId}, prompt=${prompt.substring(0,50)}...`);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!MINIMAX_API_KEY && provider === "minimax") {
        return NextResponse.json({ error: 'Minimax API key is not configured.' }, { status: 500 });
    }
    if (!process.env.OPENAI_API_KEY && provider === "openai") {
        return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    let supabaseImageUrls: string[] = [];

    if (provider === 'openai') {
      console.log(`Generating ${numberOfImages} image(s) with OpenAI DALL-E 3...`);
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, // DALL-E 3 currently only supports n=1
        response_format: 'b64_json', // Always get base64 to upload to Supabase
        size: "1024x1024", 
      });

      if (response.data) {
          for (const image of response.data) {
            if (image.b64_json) {
              const imageBuffer = Buffer.from(image.b64_json, 'base64');
              const destinationPath = `user_${userId}/images/${uuidv4()}.png`;
              const supabaseUrl = await uploadFileToSupabase(imageBuffer, destinationPath, 'image/png');
              if (supabaseUrl) {
                supabaseImageUrls.push(supabaseUrl);
              } else {
                console.warn("Failed to upload an OpenAI generated image to Supabase.");
                // Decide how to handle partial failures - continue or throw?
              }
            }
          }
          // If numberOfImages > 1 was requested for OpenAI, log a warning as DALL-E 3 only returns 1
          if (numberOfImages > 1) {
              console.warn("OpenAI DALL-E 3 was requested for > 1 image, but only 1 can be generated per API call.");
          }
      } else {
        console.warn('OpenAI response did not contain data.');
      }
    } else if (provider === 'minimax') {
      console.log(`Generating ${numberOfImages} image(s) with MiniMax...`);
      const minimaxApiUrl = "https://api.minimaxi.chat/v1/image_generation";

      // Helper function to generate and upload one image with Minimax
      const generateAndUploadSingleMinimaxImage = async (currentPrompt: string, aspectRatio: string): Promise<string | null> => {
        const payload = {
          model: "image-01",
          prompt: currentPrompt,
          aspect_ratio: aspectRatio,
          response_format: "base64", // Always get base64
          n: 1, 
          prompt_optimizer: true,
        };
        const headers = {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json',
        };

        try {
          const minimaxResponse = await fetch(minimaxApiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
          });

          if (!minimaxResponse.ok) {
            const errorData = await minimaxResponse.json().catch(() => ({}));
            console.error('Minimax API error:', minimaxResponse.status, errorData);
            throw new Error(`Minimax API request failed with status ${minimaxResponse.status}`);
          }

          const data = await minimaxResponse.json();

          if (data.data && data.data.image_base64 && Array.isArray(data.data.image_base64) && data.data.image_base64.length > 0) {
            const base64String = data.data.image_base64[0];
            if (base64String) {
              const imageBuffer = Buffer.from(base64String, 'base64');
              const destinationPath = `user_${userId}/images/${uuidv4()}.png`;
              const supabaseUrl = await uploadFileToSupabase(imageBuffer, destinationPath, 'image/png');
               if (!supabaseUrl) {
                    console.warn("Failed to upload a MiniMax generated image to Supabase.");
                    return null;
                }
                return supabaseUrl;
            }
          }
          if (data.base && data.base.status_code !== 0) {
             console.error('Minimax API returned an error status in response base:', data.base);
             throw new Error(`Minimax API error: ${data.base.status_msg || 'Unknown error'}`);
          } 
          console.warn('Minimax response did not contain expected image_base64 array in data field or had other issues:', data);
          return null;

        } catch (error) {
          console.error('Error during single Minimax image generation/upload:', error);
          throw error; // Re-throw for Promise.allSettled
        }
      };

      const imageGenerationPromises = [];
      for (let i = 0; i < numberOfImages; i++) {
        imageGenerationPromises.push(generateAndUploadSingleMinimaxImage(prompt, minimaxAspectRatio));
      }

      const settledResults = await Promise.allSettled(imageGenerationPromises);

      settledResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            supabaseImageUrls.push(result.value);
        } else if (result.status === 'rejected') {
          console.error("A Minimax image generation/upload task failed:", result.reason);
        }
      });

    } else {
      return NextResponse.json({ error: 'Invalid provider specified' }, { status: 400 });
    }

    // Always return URLs now
    const responsePayload: GenerateImageResponse = { imageUrls: supabaseImageUrls };

    if (supabaseImageUrls.length === 0) {
        console.error("No images were successfully generated and uploaded.");
        return NextResponse.json({ error: 'No images were generated or uploaded successfully. Check provider API keys, prompt, and Supabase configuration.' }, { status: 500 });
    }

    console.log(`✅ Image generation complete. Returning ${supabaseImageUrls.length} Supabase URL(s).`);
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}

// Basic type checking for environment variables at module load
if (process.env.NODE_ENV !== 'test') { // Avoid console logs during tests
    if (!process.env.OPENAI_API_KEY) {
        console.warn("Warning: OPENAI_API_KEY environment variable is not set. OpenAI image generation will fail.");
    }
    if (!MINIMAX_API_KEY) {
        console.warn("Warning: MINIMAX_API_KEY environment variable is not set. Minimax image generation will fail.");
    }
} 