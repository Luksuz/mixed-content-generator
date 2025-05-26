"use server";

import { NextResponse } from "next/server";
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || 'ovtvkcufDaBDRJnsTLHkMB3eLG6ytwlRoUAPAHPq';

async function generateSubtitlesFromAudio(audioUrl: string): Promise<string> {
  console.log(`🔤 Generating subtitles for audio: ${audioUrl}`);
  
  // Step 1: Submit the request to generate transcription
  const ingestResponse = await fetch("https://api.shotstack.io/ingest/v1/sources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SHOTSTACK_API_KEY
    },
    body: JSON.stringify({
      url: audioUrl,
      outputs: {
        transcription: {
          format: "srt"
        }
      }
    })
  });

  if (!ingestResponse.ok) {
    const errorData = await ingestResponse.json();
    console.error("❌ Error submitting transcription request:", errorData);
    throw new Error(`Failed to submit transcription request: ${ingestResponse.status} ${ingestResponse.statusText}`);
  }

  const ingestData = await ingestResponse.json();
  console.log("📝 Transcription job submitted:", ingestData);
  
  if (!ingestData.data || !ingestData.data.id) {
    throw new Error("No job ID received from transcription request");
  }
  
  const jobId = ingestData.data.id;
  console.log(`🆔 Transcription job ID: ${jobId}`);
  
  // Step 2: Poll for completion
  let isComplete = false;
  let subtitlesUrl = null;
  let attempts = 0;
  const maxAttempts = 300; // Maximum 300 attempts (25 minutes at 5-second intervals)
  
  console.log("⏳ Waiting for transcription to complete...");
  
  while (!isComplete && attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
    
    const statusResponse = await fetch(`https://api.shotstack.io/ingest/v1/sources/${jobId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-api-key": SHOTSTACK_API_KEY
      }
    });
    
    if (!statusResponse.ok) {
      console.error(`❌ Error checking status (attempt ${attempts}):`, await statusResponse.text());
      continue;
    }
    
    const statusData = await statusResponse.json();
    console.log(`🔍 Status check ${attempts}:`, statusData.data.attributes.status);
    
    if (statusData.data.attributes.status === "ready" && 
        statusData.data.attributes.outputs.transcription.status === "ready") {
      isComplete = true;
      subtitlesUrl = statusData.data.attributes.outputs.transcription.url;
      console.log("✅ Transcription complete!");
      console.log(`🔗 Subtitles URL: ${subtitlesUrl}`);
    } else if (statusData.data.attributes.status === "failed" || 
               statusData.data.attributes.outputs.transcription.status === "failed") {
      throw new Error("Transcription job failed");
    }
  }
  
  if (!isComplete) {
    throw new Error(`Transcription not completed after ${maxAttempts} attempts`);
  }
  
  return subtitlesUrl;
}

async function downloadAndSaveSubtitles(subtitlesUrl: string, userId: string): Promise<string> {
  console.log(`📥 Downloading subtitles from: ${subtitlesUrl}`);
  
  try {
    // Download the subtitles file
    const response = await fetch(subtitlesUrl);
    if (!response.ok) {
      throw new Error(`Failed to download subtitles: ${response.status} ${response.statusText}`);
    }
    
    // Get the content as text
    const srtContent = await response.text();
    const srtBuffer = Buffer.from(srtContent);
    
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

    // Generate subtitles using Shotstack ingest API
    const shotstackSubtitlesUrl = await generateSubtitlesFromAudio(audioUrl);
    
    // Download and save the subtitles to Supabase
    const subtitlesUrl = await downloadAndSaveSubtitles(shotstackSubtitlesUrl, userId);
    
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