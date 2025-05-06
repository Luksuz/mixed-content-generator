"use server";

import { NextResponse } from "next/server";
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    console.log("📥 Received audio generation request");
    
    const { text, provider, voice, model } = await request.json();
    console.log(`🔍 Request details: provider=${provider}, voice=${voice}, model=${model}, text length=${text?.length || 0}`);
    
    if (!text || !provider || !voice) {
      console.error("❌ Missing required fields", { text: !!text, provider, voice });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let audioUrl = "";
    let audioDuration = 0;

    // Calculate approximate duration (rough estimate)
    audioDuration = Math.ceil(text.length / 20);
    console.log(`⏱️ Estimated duration: ${audioDuration} seconds`);

    if (provider === "openai") {
      console.log(`🔊 Using OpenAI TTS provider`);
      try {
        // Use OpenAI's TTS API
        const selectedVoice = voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | "ash" | "ballad" | "coral" | "sage";
        
        // Use tts-1 model for OpenAI
        const openaiModel = "tts-1";
        console.log(`🤖 Using model: ${openaiModel} with voice: ${selectedVoice}`);
        
        console.log("🌐 Calling OpenAI TTS API...");
        
        // Make request to OpenAI
        const mp3 = await openai.audio.speech.create({
          model: openaiModel,
          voice: selectedVoice,
          input: text
        });
        
        console.log("✅ OpenAI TTS API call successful");

        // Create directory if it doesn't exist
        const audioDir = path.join(process.cwd(), 'public', 'generated-audio');
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Save file with unique name
        const fileName = `${provider}-${voice}-${Date.now()}.mp3`;
        const filePath = path.join(audioDir, fileName);
        
        // Convert to buffer and save
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer as unknown as string);
        
        console.log(`💾 Audio file saved to: ${filePath}`);
        
        // Return URL to the saved file
        audioUrl = `/generated-audio/${fileName}`;
        console.log(`🎵 Audio URL: ${audioUrl}`);

      } catch (openaiError) {
        console.error("❌ OpenAI API error:", openaiError);
        
        // Fallback to mock audio if the API call fails
        audioUrl = `/mock-audio/${provider}-tts.mp3`;
        console.log(`⚠️ Using fallback audio: ${audioUrl}`);
      }
    } else if (provider === "minimax") {
      console.log(`🔊 Using MiniMax TTS provider`);
      try {
        // MiniMax TTS API implementation based on their API structure
        const minimaxGroupId = process.env.MINIMAX_GROUP_ID || "1905235425920819721";
        console.log(`🔑 Using MiniMax GroupID: ${minimaxGroupId?.substring(0, 5)}...`);
        
        // Use the model passed from the frontend or default to speech-02-hd
        const minimaxModel = model || "speech-02-hd";
        console.log(`🔊 Using MiniMax model: ${minimaxModel}`);
        
        console.log(`🌐 Calling MiniMax TTS API...`);
        const response = await fetch(`https://api.minimaxi.chat/v1/t2a_v2?GroupId=${minimaxGroupId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJMRcODTyBDVVJJT1NPIiwiVXNlck5hbWUiOiJMRcODTyBDVVJJT1NPIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5MDUyMzU0MjU5MjkyMDgzMjkiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxOTA1MjM1NDI1OTIwODE5NzIxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiMTB0b3Bkb211bmRvQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA0LTI5IDA1OjE5OjE3IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.Xxqk6EK5mA1PbIFHwJIftjLL9fXzIUoZapTbaRy-6LYtL1DuYJht-cVUZHHbWw3jiGFA5HJqhWC6K1CiT5PbTr76P381gme5HKJBhzU_g578sB43AoK4gm7mSWf-mmNcOKeBQF_WhVzmFcWb7YCRbED3Zx0c2p3lunshZOflz_9d-3iEC0199ia6v2ted8jA1NtKc21E7xfJxnwAYEjL-bGIz4b3D_i-MStZsJBxcvtFQ0l77KB1KIUMemBnrOhsEIsE088LOFNfazU0v9-DZTvwjplH8uSojo2P2IHlsdpUYnV0aVUj8ckIBHAStFRkH2Cf9hobMpU1n8QvStDlPA`
          },
          body: JSON.stringify({
            model: minimaxModel,
            text: text,
            stream: false,
            subtitle_enable: false,
            voice_setting: {
              voice_id: voice,
              speed: 1,
              vol: 1,
              pitch: 0
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: "mp3",
              channel: 1
            }
          })
        });

        if (!response.ok) {
          console.error(`❌ MiniMax API response not OK: ${response.status} ${response.statusText}`);
          throw new Error(`MiniMax API error: ${response.statusText}`);
        }

        console.log(`📊 MiniMax API response received with status: ${response.status}`);
        const data = await response.json();
        console.log(`🔍 MiniMax response structure:`, Object.keys(data));
        
        if (data.data?.audio) {
          console.log(`🎵 Audio data received from MiniMax, hex length: ${data.data.audio.length}`);
          console.log(`📊 MiniMax audio info:`, data.extra_info);
          
          try {
            // Convert hex to buffer - using Uint8Array to avoid type issues
            const hexString = data.data.audio;
            const bytes = new Uint8Array(hexString.length / 2);
            
            for (let i = 0; i < hexString.length; i += 2) {
              bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
            }
            
            // Create directory if it doesn't exist
            const audioDir = path.join(process.cwd(), 'public', 'generated-audio');
            if (!fs.existsSync(audioDir)) {
              fs.mkdirSync(audioDir, { recursive: true });
            }
            
            // Save file with unique name
            const fileName = `minimax-${Date.now()}.mp3`;
            const filePath = path.join(audioDir, fileName);
            
            // Write file using fs/promises for better type compatibility
            await writeFile(filePath, bytes);
            console.log(`💾 Audio file saved to: ${filePath}`);
            
            // Return URL to the saved file
            audioUrl = `/generated-audio/${fileName}`;
            console.log(`🎵 Audio URL: ${audioUrl}`);
          } catch (fileError) {
            console.error("❌ Error saving audio file:", fileError);
            audioUrl = `/mock-audio/${provider}-tts.mp3`;
            console.log(`⚠️ Using fallback audio due to file save error: ${audioUrl}`);
          }
          
          // Update duration if available
          if (data.extra_info?.audio_length) {
            audioDuration = Math.ceil(data.extra_info.audio_length / 1000); // Convert ms to seconds
            console.log(`⏱️ Updated duration from API: ${audioDuration} seconds`);
          }
        } else {
          console.error(`❌ No audio data in MiniMax response:`, data);
          throw new Error('No audio data returned from MiniMax API');
        }
      } catch (minimaxError) {
        console.error("❌ MiniMax API error:", minimaxError);
        
        // Fallback to mock audio if the API call fails
        audioUrl = `/mock-audio/${provider}-tts.mp3`;
        console.log(`⚠️ Using fallback audio: ${audioUrl}`);
      }
    } else {
      // For other providers, fall back to mock audio
      console.log(`⚠️ Unknown provider '${provider}', using mock audio`);
      audioUrl = `/mock-audio/${provider}-tts.mp3`;
    }

    console.log(`📤 Sending response: audioUrl=${audioUrl}, duration=${audioDuration}`);
    return NextResponse.json({
      success: true,
      audioUrl,
      duration: audioDuration,
      provider,
      voice,
    });
  } catch (error) {
    console.error("❌ Error generating audio:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
} 