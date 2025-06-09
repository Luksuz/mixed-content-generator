import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateImageRequestBody, GenerateImageResponse } from '@/types/image-generation';
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// MiniMax API key from environment
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

// Batch processing constants (same as other image generation routes)
const BATCH_SIZE = 5; // Process 5 images at a time
const BATCH_INTERVAL_MS = 5000; // 5 seconds between batches

// Interface for regeneration request
interface RegenerateImageRequestBody {
    provider: 'openai' | 'minimax';
    prompts: string[];
    minimaxAspectRatio?: "16:9" | "1:1" | "9:16";
    userId?: string;
}

// Helper function for retrying an async operation
async function retryAsync<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000,
    attempt: number = 1
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (attempt > retries) {
            console.error(`Failed after ${retries} retries. Last error:`, error);
            throw error;
        }
        console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        return retryAsync(fn, retries, delayMs, attempt + 1);
    }
}

// Helper function to process images in batches with rate limiting
async function processBatches<T>(
    items: (() => Promise<T>)[],
    batchSize: number = BATCH_SIZE,
    intervalMs: number = BATCH_INTERVAL_MS
): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = [];
    
    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, items.length);
        console.log(`Processing regeneration batch ${i/batchSize + 1}: items ${i+1} to ${batchEnd} of ${items.length}`);
        
        // Create a batch of promises
        const batch = items.slice(i, batchEnd).map(fn => fn());
        
        // Wait for the current batch to complete
        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);
        
        // If not the last batch, wait before processing the next batch
        if (batchEnd < items.length) {
            console.log(`Rate limiting: waiting ${intervalMs/1000} seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }
    
    return results;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as RegenerateImageRequestBody;
        const {
            provider,
            prompts,
            minimaxAspectRatio = "16:9",
            userId = "unknown_user"
        } = body;

        console.log(`🔄 Received image regeneration request: provider=${provider}, userId=${userId}, prompts=${prompts.length}`);

        if (!prompts || prompts.length === 0) {
            return NextResponse.json({ error: 'No prompts provided for regeneration' }, { status: 400 });
        }

        // API key checks
        if (provider === "minimax" && !MINIMAX_API_KEY) {
            return NextResponse.json({ error: 'Minimax API key is not configured.' }, { status: 500 });
        }
        if (provider === "openai" && !process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
        }

        // Create generation functions for batch processing
        const generateImageFunctions: (() => Promise<{ imageUrl: string | null; originalPrompt: string; error?: string }>)[] = [];

        prompts.forEach((prompt, promptIndex) => {
            generateImageFunctions.push(async () => {
                try {
                    console.log(`Processing regeneration ${promptIndex + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`);
                    let imageUrl: string | null = null;

                    // OpenAI generation
                    if (provider === 'openai') {
                        const response = await openai.images.generate({
                            model: "gpt-image-1",
                            prompt: prompt,
                            n: 1,
                            size: "1536x1024",
                        });

                        if (response.data?.[0]?.b64_json) {
                            const imageBuffer = Buffer.from(response.data[0].b64_json, 'base64');
                            const destinationPath = `user_${userId}/images/${uuidv4()}.png`;
                            imageUrl = await uploadFileToSupabase(imageBuffer, destinationPath, 'image/png');
                        }
                    }
                    // MiniMax generation
                    else if (provider === 'minimax') {
                        const minimaxApiUrl = "https://api.minimaxi.chat/v1/image_generation";
                        const payload = {
                            model: "image-01",
                            prompt: prompt,
                            aspect_ratio: minimaxAspectRatio,
                            response_format: "base64",
                            width: 1536,
                            height: 1024,
                            n: 1,
                            prompt_optimizer: true,
                        };
                        const headers = {
                            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                            'Content-Type': 'application/json',
                        };

                        const minimaxResponse = await fetch(minimaxApiUrl, { 
                            method: 'POST', 
                            headers: headers, 
                            body: JSON.stringify(payload) 
                        });
                        
                        if (!minimaxResponse.ok) {
                            const errorData = await minimaxResponse.json().catch(() => ({}));
                            console.error('Minimax API error:', minimaxResponse.status, errorData);
                            throw new Error(`Minimax API request failed with status ${minimaxResponse.status}`);
                        }
                        
                        const data = await minimaxResponse.json();
                        
                        if (data.data?.image_base64?.[0]) {
                            const base64String = data.data.image_base64[0];
                            const imageBuffer = Buffer.from(base64String, 'base64');
                            const destinationPath = `user_${userId}/images/${uuidv4()}.png`;
                            imageUrl = await uploadFileToSupabase(imageBuffer, destinationPath, 'image/png');
                        } else if (data.base && data.base.status_code !== 0) {
                            throw new Error(`Minimax API error: ${data.base.status_msg || 'Unknown error'}`);
                        } else {
                            console.error('Unexpected Minimax response format:', JSON.stringify(data, null, 2));
                            throw new Error('Unexpected Minimax response format - no image data found');
                        }
                    }

                    if (imageUrl) {
                        console.log(`✅ Successfully regenerated image ${promptIndex + 1}/${prompts.length}`);
                        return { imageUrl, originalPrompt: prompt };
                    } else {
                        throw new Error('Failed to generate or upload image');
                    }
                } catch (error: any) {
                    console.error(`❌ Error regenerating image for prompt ${promptIndex + 1}:`, error);
                    return { 
                        imageUrl: null, 
                        originalPrompt: prompt, 
                        error: error.message || 'Unknown error during regeneration' 
                    };
                }
            });
        });

        console.log(`Starting batch processing for ${generateImageFunctions.length} image regenerations...`);
        
        // Wrap each function with retryAsync and process in batches
        const retryWrappedFunctions = generateImageFunctions.map(fn => () => retryAsync(fn));
        const settledResults = await processBatches(retryWrappedFunctions);

        // Process results
        const results: { imageUrl: string; originalPrompt: string; }[] = [];
        const errors: { prompt: string; error: string; }[] = [];

        settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.imageUrl) {
                results.push({
                    imageUrl: result.value.imageUrl,
                    originalPrompt: result.value.originalPrompt
                });
            } else {
                const errorMsg = result.status === 'rejected' 
                    ? result.reason?.message || 'Unknown error during batch processing'
                    : result.value.error || 'Failed to generate image';
                
                errors.push({ 
                    prompt: result.status === 'fulfilled' ? result.value.originalPrompt : prompts[index], 
                    error: errorMsg 
                });
            }
        });

        console.log(`🎉 Regeneration batch processing complete: ${results.length} successful, ${errors.length} failed`);

        return NextResponse.json({
            success: true,
            regeneratedImages: results,
            totalSuccessful: results.length,
            totalFailed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('General error in regenerate-image route:', error);
        return NextResponse.json({ 
            error: 'Failed to process image regeneration request', 
            details: error.message 
        }, { status: 500 });
    }
} 