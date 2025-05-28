"use server";

import { NextResponse } from "next/server";
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { uploadFileToSupabase } from "@/utils/supabase-utils";
import { v4 as uuidv4 } from 'uuid';

async function ensureDir(dirPath: string) {
  try {
    await fsp.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function downloadFileFromUrl(url: string, destinationPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fsp.writeFile(destinationPath, new Uint8Array(buffer));
}

async function joinAudioChunks(
  chunkUrls: string[],
  finalOutputFileName: string,
  baseOutputDir: string,
  tempDir: string
): Promise<string> {
  if (!chunkUrls || chunkUrls.length === 0) {
    throw new Error("No audio chunk URLs provided for joining.");
  }

  console.log(`🎬 Joining ${chunkUrls.length} audio chunks into ${finalOutputFileName}...`);
  await ensureDir(baseOutputDir);
  await ensureDir(tempDir);

  // Download all chunks first
  const downloadedChunkPaths: string[] = [];
  for (let i = 0; i < chunkUrls.length; i++) {
    const chunkUrl = chunkUrls[i];
    const chunkFileName = `chunk-${i}-${Date.now()}.mp3`;
    const chunkPath = path.join(tempDir, chunkFileName);
    
    console.log(`📥 Downloading chunk ${i + 1}/${chunkUrls.length} from ${chunkUrl}`);
    await downloadFileFromUrl(chunkUrl, chunkPath);
    downloadedChunkPaths.push(chunkPath);
  }

  if (downloadedChunkPaths.length === 1) {
    // If there's only one chunk, still apply compression to reduce file size
    const finalPath = path.join(baseOutputDir, finalOutputFileName);
    console.log(`📦 Single chunk detected, applying compression: ${downloadedChunkPaths[0]} to ${finalPath}`);
    
    return new Promise((resolve, reject) => {
      // Apply same aggressive compression to single chunk
      const ffmpegArgs = [
        '-i', downloadedChunkPaths[0],
        // Audio codec and compression settings
        '-c:a', 'libmp3lame',        // Use LAME MP3 encoder for better compression
        '-b:a', '24k',               // Very low bitrate (24 kbps for maximum compression)
        '-ar', '22050',              // Lower sample rate (22.05 kHz instead of 44.1 kHz)
        '-ac', '1',                  // Mono audio (single channel)
        '-q:a', '9',                 // Lowest quality setting for maximum compression
        '-compression_level', '9',    // Maximum compression level
        '-joint_stereo', '1',        // Joint stereo encoding (though we're using mono)
        '-reservoir', '0',           // Disable bit reservoir for consistent bitrate
        '-abr', '1',                 // Use average bitrate mode
        // Additional optimization flags
        '-map_metadata', '-1',       // Remove all metadata to save space
        '-fflags', '+bitexact',      // Ensure reproducible output
        '-avoid_negative_ts', 'make_zero', // Avoid negative timestamps
        '-y',                        // Overwrite output file
        finalPath
      ];

      console.log(`🚀 Running ffmpeg compression on single chunk: ffmpeg ${ffmpegArgs.join(' ')}`);
      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      let ffmpegOutput = '';
      ffmpegProcess.stdout.on('data', (data) => { ffmpegOutput += data.toString(); });
      ffmpegProcess.stderr.on('data', (data) => { ffmpegOutput += data.toString(); });

      ffmpegProcess.on('close', async (code) => {
        // Cleanup the original chunk file
        try {
          await fsp.rm(downloadedChunkPaths[0]);
          console.log(`🧹 Cleaned up original chunk file: ${downloadedChunkPaths[0]}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Could not clean up original chunk file:`, cleanupError);
        }

        if (code === 0) {
          console.log(`✅ Single chunk compression completed: ${finalPath}`);
          resolve(finalPath);
        } else {
          console.error(`❌ ffmpeg failed with code ${code} for single chunk compression.`);
          reject(new Error(`ffmpeg failed to compress single chunk. Code: ${code}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        console.error('❌ Failed to start ffmpeg process for single chunk:', err);
        reject(err);
      });
    });
  }

  const finalOutputPath = path.join(baseOutputDir, finalOutputFileName);
  const listFileName = `ffmpeg-list-${uuidv4()}.txt`;
  const listFilePath = path.join(tempDir, listFileName);

  // Create the file list for ffmpeg's concat demuxer
  const fileListContent = downloadedChunkPaths
    .map(filePath => `file '${path.resolve(filePath).replace(/\\/g, '/')}'`)
    .join('\n');

  try {
    await fsp.writeFile(listFilePath, fileListContent);
    console.log(`📄 Created ffmpeg file list: ${listFilePath}`);
  } catch (writeError) {
    console.error(`❌ Error writing ffmpeg list file: ${writeError}`);
    throw writeError;
  }

  return new Promise((resolve, reject) => {
    // Aggressive compression settings for maximum file size reduction
    // Target: 2 hours (7200 seconds) under 25MB = ~29 kbps
    const ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', listFilePath,
      // Audio codec and compression settings
      '-c:a', 'libmp3lame',        // Use LAME MP3 encoder for better compression
      '-b:a', '24k',               // Very low bitrate (24 kbps for maximum compression)
      '-ar', '22050',              // Lower sample rate (22.05 kHz instead of 44.1 kHz)
      '-ac', '1',                  // Mono audio (single channel)
      '-q:a', '9',                 // Lowest quality setting for maximum compression
      '-compression_level', '9',    // Maximum compression level
      '-joint_stereo', '1',        // Joint stereo encoding (though we're using mono)
      '-reservoir', '0',           // Disable bit reservoir for consistent bitrate
      '-abr', '1',                 // Use average bitrate mode
      // Additional optimization flags
      '-map_metadata', '-1',       // Remove all metadata to save space
      '-fflags', '+bitexact',      // Ensure reproducible output
      '-avoid_negative_ts', 'make_zero', // Avoid negative timestamps
      '-y',                        // Overwrite output file
      finalOutputPath
    ];

    console.log(`🚀 Running ffmpeg with aggressive compression: ffmpeg ${ffmpegArgs.join(' ')}`);
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    let ffmpegOutput = '';
    ffmpegProcess.stdout.on('data', (data) => { ffmpegOutput += data.toString(); });
    ffmpegProcess.stderr.on('data', (data) => { ffmpegOutput += data.toString(); });

    ffmpegProcess.on('close', async (code) => {
      console.log(`ffmpeg process exited with code ${code}`);
      
      // Cleanup the list file and downloaded chunks
      try {
        await fsp.rm(listFilePath);
        console.log(`🧹 Cleaned up ffmpeg list file: ${listFilePath}`);
        
        for (const chunkPath of downloadedChunkPaths) {
          await fsp.rm(chunkPath);
        }
        console.log(`🧹 Cleaned up ${downloadedChunkPaths.length} downloaded chunk files`);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not clean up temp files:`, cleanupError);
      }

      if (code === 0) {
        console.log(`✅ Audio chunks successfully joined into ${finalOutputPath}`);
        resolve(finalOutputPath);
      } else {
        console.error(`❌ ffmpeg failed with code ${code}.`);
        const MAX_LOG_LINES = 20;
        const outputLines = ffmpegOutput.split('\n');
        const relevantOutput = outputLines.slice(-MAX_LOG_LINES).join('\n');
        console.log(`ffmpeg output (last ${MAX_LOG_LINES} lines):\n${relevantOutput}`);
        
        try { 
          if (fs.existsSync(finalOutputPath)) {
            await fsp.rm(finalOutputPath); 
            console.log(`🧹 Cleaned up potentially incomplete output file: ${finalOutputPath}`);
          } 
        } catch (e) { 
          console.warn(`⚠️ Could not clean up potentially incomplete output file:`, e);
        }
        reject(new Error(`ffmpeg failed to join audio chunks. Code: ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('❌ Failed to start ffmpeg process:', err);
      fsp.rm(listFilePath).catch(() => {});
      fsp.rm(finalOutputPath).catch(() => {});
      reject(err);
    });
  });
}

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobeArgs = [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath
    ];

    const ffprobeProcess = spawn('ffprobe', ffprobeArgs);
    let output = '';

    ffprobeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobeProcess.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 0 : duration);
      } else {
        console.warn(`⚠️ ffprobe failed with code ${code}, using estimated duration`);
        resolve(0); // Fallback to 0 if ffprobe fails
      }
    });

    ffprobeProcess.on('error', (err) => {
      console.warn(`⚠️ ffprobe error: ${err.message}, using estimated duration`);
      resolve(0); // Fallback to 0 if ffprobe fails
    });
  });
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { chunkUrls, provider, voice, userId = "unknown_user" } = requestBody;

    console.log(`📥 Received concatenation request: ${chunkUrls?.length || 0} chunks, provider=${provider}, userId=${userId}`);

    if (!chunkUrls || !Array.isArray(chunkUrls) || chunkUrls.length === 0) {
      return NextResponse.json({ error: "Missing or empty chunkUrls array" }, { status: 400 });
    }

    if (!provider || !userId) {
      return NextResponse.json({ error: "Missing required fields: provider, userId" }, { status: 400 });
    }

    const tempDir = path.join(process.cwd(), 'temp-audio-processing', `concat-${uuidv4()}`);
    const outputDir = tempDir; // Use same temp dir for output
    
    const finalFileName = `${provider}-${voice ? voice.replace(/\s+/g, '_') : 'unknown_voice'}-${uuidv4()}-final.mp3`;
    
    // Join the audio chunks
    const finalLocalPath = await joinAudioChunks(chunkUrls, finalFileName, outputDir, tempDir);
    
    // Get audio duration
    const duration = await getAudioDuration(finalLocalPath);
    console.log(`🕐 Audio duration: ${duration} seconds`);
    
    // Get file size for logging
    const stats = await fsp.stat(finalLocalPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`📊 Compressed audio file size: ${fileSizeMB.toFixed(2)} MB`);
    
    // Upload final audio to Supabase
    const supabaseDestinationPath = `user_${userId}/audio/${uuidv4()}.mp3`;
    const finalAudioUrl = await uploadFileToSupabase(finalLocalPath, supabaseDestinationPath, 'audio/mpeg');
    
    if (!finalAudioUrl) {
      throw new Error("Failed to upload the final audio file to Supabase Storage");
    }

    // Cleanup temp directory
    try {
      await fsp.rm(tempDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
    } catch (cleanupError) {
      console.warn(`⚠️ Failed to cleanup temp directory ${tempDir}:`, cleanupError);
    }

    console.log(`✅ Audio concatenation completed successfully: ${finalAudioUrl} (${fileSizeMB.toFixed(2)} MB, ${duration} seconds)`);
    
    return NextResponse.json({
      success: true,
      audioUrl: finalAudioUrl,
      duration,
      fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
      provider,
      voice,
      chunksProcessed: chunkUrls.length
    });

  } catch (error: any) {
    console.error("❌ Error concatenating audio chunks:", error.message);
    return NextResponse.json(
      { error: `Failed to concatenate audio chunks: ${error.message}` },
      { status: 500 }
    );
  }
}