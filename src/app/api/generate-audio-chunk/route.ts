"use server";

import { NextResponse } from "next/server";
import { OpenAI } from 'openai';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ElevenLabsClient } from "elevenlabs";
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';
import { synthesizeGoogleTts } from "@/utils/google-tts-utils";

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || "4239d52824be4f088a406121777bb1ba";
const FISH_AUDIO_MODEL_DEFAULT = process.env.FISH_AUDIO_MODEL || "speech-1.6";

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = elevenLabsApiKey ? new ElevenLabsClient({ apiKey: elevenLabsApiKey }) : null;

const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || "1905235425920819721";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJMRcODTyBDVVJJT1NPIiwiVXNlck5hbWUiOiJMRcODTyBDVVJJT1NPIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5MDUyMzU0MjU5MjkyMDgzMjkiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxOTA1MjM1NDI1OTIwODE5NzIxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiMTB0b3Bkb211bmRvQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA0LTI5IDA1OjE5OjE3IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.Xxqk6EK5mA1PbIFHwJIftjLL9fXzIUoZapTbaRy-6LYtL1DuYJht-cVUZHHbWw3jiGFA5HJqhWC6K1CiT5PbTr76P381gme5HKJBhzU_g578sB43AoK4gm7mSWf-mmNcOKeBQF_WhVzmFcWb7YCRbED3Zx0c2p3lunshZOflz_9d-3iEC0199ia6v2ted8jA1NtKc21E7xfJxnwAYEjL-bGIz4b3D_i-MStZsJBxcvtFQ0l77KB1KIUMemBnrOhsEIsE088LOFNfazU0v9-DZTvwjplH8uSojo2P2IHlsdpUYnV0aVUj8ckIBHAStFRkH2Cf9hobMpU1n8QvStDlPA";

async function ensureDir(dirPath: string) {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function generateSingleAudioChunk(
  textChunk: string,
  provider: string,
  providerArgs: any,
  userId: string
): Promise<string> {
  console.log(`🔊 Generating chunk for provider: ${provider}, length: ${textChunk.length}`);
  
  const { voice, model, fishAudioVoiceId, fishAudioModel, elevenLabsVoiceId, elevenLabsModelId, languageCode, googleTtsVoiceName } = providerArgs;
  
  const tempDir = path.join(process.cwd(), 'temp-audio-processing');
  await ensureDir(tempDir);
  
  const tempFileName = `${provider}-${voice ? voice.replace(/\s+/g, '_') : googleTtsVoiceName ? googleTtsVoiceName.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown_voice'}-chunk-${Date.now()}-${uuidv4()}.mp3`;
  const tempFilePath = path.join(tempDir, tempFileName);
  
  let audioBuffer: Buffer;

  try {
    switch (provider) {
      case "openai":
        const openaiSelectedVoice = voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "ash" | "ballad" | "coral" | "sage";
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: openaiSelectedVoice,
          input: textChunk,
        });
        audioBuffer = Buffer.from(await mp3.arrayBuffer());
        break;

      case "minimax":
        const minimaxTTSModel = model || "speech-02-hd";
        const minimaxResponse = await fetch(`https://api.minimaxi.chat/v1/t2a_v2?GroupId=${MINIMAX_GROUP_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MINIMAX_API_KEY}` },
          body: JSON.stringify({
            model: minimaxTTSModel, text: textChunk, stream: false, subtitle_enable: false,
            voice_setting: { voice_id: voice, speed: 1, vol: 1, pitch: 0 },
            audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 }
          })
        });
        if (!minimaxResponse.ok) {
          let errorBody = '';
          try { errorBody = await minimaxResponse.text(); } catch (e) { /* ignore */ }
          throw new Error(`MiniMax API error: ${minimaxResponse.status} ${minimaxResponse.statusText}. Body: ${errorBody}`);
        }
        const minimaxData = await minimaxResponse.json();
        if (!minimaxData.data?.audio) throw new Error(`No audio data from MiniMax. Response: ${JSON.stringify(minimaxData)}`);
        const hexString = minimaxData.data.audio;
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        audioBuffer = Buffer.from(bytes);
        break;

      case "fish-audio":
        if (!fishAudioVoiceId) throw new Error(`Missing fishAudioVoiceId for Fish Audio`);
        const fishModelToUse = fishAudioModel || FISH_AUDIO_MODEL_DEFAULT;
        const fishResponse = await fetch("https://api.fish.audio/v1/tts", {
          method: "POST",
          headers: { "Authorization": `Bearer ${FISH_AUDIO_API_KEY}`, "Content-Type": "application/json", "Model": fishModelToUse },
          body: JSON.stringify({
            text: textChunk, chunk_length: 200, format: "mp3", mp3_bitrate: 128,
            reference_id: fishAudioVoiceId, normalize: true, latency: "normal",
          })
        });
        if (!fishResponse.ok || !fishResponse.body) {
          let errorBody = '';
          try { errorBody = await fishResponse.text(); } catch (e) { /* ignore */ }
          throw new Error(`Fish Audio API error: ${fishResponse.status} ${fishResponse.statusText}. Body: ${errorBody}`);
        }
        const fishReader = fishResponse.body.getReader();
        const fishChunks: Buffer[] = [];
        while (true) {
          const { done, value } = await fishReader.read();
          if (done) break;
          fishChunks.push(Buffer.from(value)); 
        }
        audioBuffer = Buffer.concat(fishChunks as any);
        break;

      case "elevenlabs":
        if (!elevenlabs) throw new Error("ElevenLabs client not initialized");
        if (!elevenLabsVoiceId) throw new Error(`Missing elevenLabsVoiceId`);
        const elModelId = elevenLabsModelId || "eleven_multilingual_v2";
        
        const elConversionParams: any = {
          text: textChunk,
          model_id: elModelId,
          output_format: "mp3_44100_128"
        };
        
        if (elModelId === "eleven_flash_v2_5" && languageCode) {
          elConversionParams.language_code = languageCode;
        }
        
        const elAudioStream = await elevenlabs.textToSpeech.convert(elevenLabsVoiceId, elConversionParams);
        const elStreamChunks: Uint8Array[] = [];
        for await (const streamChunk of elAudioStream) { elStreamChunks.push(streamChunk as Uint8Array); }
        const elConcatenatedUint8Array = new Uint8Array(elStreamChunks.reduce((acc, streamChunk) => acc + streamChunk.length, 0));
        let offset = 0;
        for (const streamChunk of elStreamChunks) { elConcatenatedUint8Array.set(streamChunk, offset); offset += streamChunk.length; }
        audioBuffer = Buffer.from(elConcatenatedUint8Array);
        break;
        
      case "google-tts":
        if (!googleTtsVoiceName) throw new Error(`Missing googleTtsVoiceName for Google TTS`);
        if (!languageCode) throw new Error(`Missing languageCode for Google TTS`);
        audioBuffer = await synthesizeGoogleTts(textChunk, googleTtsVoiceName, languageCode);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    await fsp.writeFile(tempFilePath, audioBuffer as any);
    
    // Upload to Supabase
    const supabaseDestinationPath = `user_${userId}/audio-chunks/${uuidv4()}.mp3`;
    const uploadedUrl = await uploadFileToSupabase(tempFilePath, supabaseDestinationPath, 'audio/mpeg');
    
    if (!uploadedUrl) {
      throw new Error("Failed to upload audio chunk to Supabase Storage");
    }
    
    console.log(`✅ Chunk uploaded to Supabase: ${uploadedUrl}`);
    return uploadedUrl;

  } catch (error: any) {
    console.error(`❌ Error generating audio chunk:`, error);
    try { 
      if (fs.existsSync(tempFilePath)) await fsp.rm(tempFilePath); 
    } catch (e) { 
      console.warn(`🧹 Failed to cleanup temp file ${tempFilePath}:`, e); 
    }
    throw error; 
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { 
      textChunk, 
      provider, 
      voice, 
      model, 
      fishAudioVoiceId, 
      fishAudioModel, 
      elevenLabsVoiceId, 
      elevenLabsModelId, 
      languageCode, 
      userId = "unknown_user", 
      googleTtsVoiceName, 
      googleTtsLanguageCode,
      chunkIndex 
    } = requestBody;

    console.log(`📥 Received chunk generation request: chunk ${chunkIndex}, provider=${provider}, length=${textChunk?.length || 0}`);

    if (!textChunk || !provider || (provider !== "google-tts" && !voice) || (provider === "google-tts" && !googleTtsVoiceName)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const providerArgs = {
      voice,
      model,
      fishAudioVoiceId,
      fishAudioModel,
      elevenLabsVoiceId,
      elevenLabsModelId,
      languageCode: provider === "google-tts" ? (googleTtsLanguageCode || languageCode) : languageCode,
      googleTtsVoiceName
    };

    const chunkUrl = await generateSingleAudioChunk(textChunk, provider, providerArgs, userId);

    return NextResponse.json({
      success: true,
      chunkUrl,
      chunkIndex,
      provider,
      voice: provider === "google-tts" ? googleTtsVoiceName : voice
    });

  } catch (error: any) {
    console.error("❌ Error generating audio chunk:", error.message);
    return NextResponse.json(
      { error: `Failed to generate audio chunk: ${error.message}` },
      { status: 500 }
    );
  }
} 