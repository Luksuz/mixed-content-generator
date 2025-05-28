"use server";

import { NextResponse } from "next/server";
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";
import path from 'path';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateSubtitlesFromAudio(audioUrl: string): Promise<string> {
  console.log(`🔤 Generating subtitles for audio: ${audioUrl}`);
  
  try {
    // Download the audio file
    console.log("📥 Downloading audio file...", audioUrl);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Save to temporary file for OpenAI API
    const tempDir = path.join(process.cwd(), 'temp-audio-processing');
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    const tempAudioPath = path.join(tempDir, `temp-audio-${uuidv4()}.mp3`);
    await fs.promises.writeFile(tempAudioPath, new Uint8Array(audioBuffer));
    
    console.log("🎵 Transcribing audio with OpenAI Whisper...");
    
    // Use OpenAI Whisper to transcribe the audio directly to SRT format
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempAudioPath),
      model: "whisper-1",
      response_format: "srt"
    });
    
    // Clean up temporary file
    try {
      await fs.promises.unlink(tempAudioPath);
      console.log("🧹 Cleaned up temporary audio file");
    } catch (cleanupError) {
      console.warn("⚠️ Could not clean up temporary audio file:", cleanupError);
    }
    
    console.log("✅ Transcription complete!");
    return transcription;
    
  } catch (error: any) {
    console.error("❌ Error in OpenAI transcription:", error);
    throw new Error(`OpenAI transcription failed: ${error.message}`);
  }
}

async function saveSubtitlesToSupabase(srtContent: string, userId: string): Promise<string> {
  console.log(`💾 Saving subtitles to Supabase...`);
  
  try {
    // Convert SRT content to buffer
    const srtBuffer = Buffer.from(srtContent, 'utf-8');
    
    // Create a unique filename in Supabase
    const supabaseDestinationPath = `user_${userId}/subtitles/${uuidv4()}.srt`;
    
    // Upload to Supabase
    const uploadedUrl = await uploadFileToSupabase(
      srtBuffer,
      supabaseDestinationPath,
      'text/plain'
    );
    
    if (!uploadedUrl) {
      throw new Error("Failed to upload subtitles file to Supabase Storage");
    }
    
    console.log(`✅ Subtitles saved to Supabase: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (error) {
    console.error(`❌ Error saving subtitles to Supabase:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { audioUrl, userId = "unknown_user" } = requestBody;

    console.log(`📥 Received subtitle generation request for audio: ${audioUrl}, userId: ${userId}`);

    if (!audioUrl || !userId) {
      return NextResponse.json({ error: "Missing required fields: audioUrl, userId" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Generate subtitles using OpenAI Whisper
    const srtContent = await generateSubtitlesFromAudio(audioUrl);
    
    // Save the subtitles to Supabase
    const subtitlesUrl = await saveSubtitlesToSupabase(srtContent, userId);
    
    console.log(`✅ Subtitle generation complete: ${subtitlesUrl}`);

    return NextResponse.json({
      success: true,
      subtitlesUrl,
      audioUrl
    });

  } catch (error: any) {
    console.error("❌ Error generating subtitles:", error.message);
    return NextResponse.json(
      { error: `Failed to generate subtitles: ${error.message}` },
      { status: 500 }
    );
  }
} 