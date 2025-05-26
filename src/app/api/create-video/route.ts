import { NextRequest, NextResponse } from 'next/server';
import { CreateVideoRequestBody, CreateVideoResponse } from '@/types/video-generation';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getAudioDuration } from '@/utils/supabase-utils';

// Shotstack API settings from environment variables
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || 'ovtvkcufDaBDRJnsTLHkMB3eLG6ytwlRoUAPAHPq';
const SHOTSTACK_ENDPOINT = process.env.SHOTSTACK_ENDPOINT || 'https://api.shotstack.io/edit/v1';

// Constant for dust overlay URL
const DUST_OVERLAY_URL = 'https://byktarizdjtreqwudqmv.supabase.co/storage/v1/object/public/video-generator//overlay.webm';

/**
 * Checks if a URL is accessible by making a HEAD request
 * @param url URL to check
 * @returns boolean indicating if the URL is accessible
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Failed to access URL: ${url}`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateVideoRequestBody = await request.json();
    const { imageUrls, audioUrl, subtitlesUrl, userId, thumbnailUrl, quality = 'low' } = body;
    
    console.log("📥 Received video creation request:");
    console.log(`- Images: ${imageUrls?.length || 0}`);
    console.log(`- Audio: ${audioUrl ? 'YES' : 'NO'}`);
    console.log(`- Subtitles: ${subtitlesUrl ? 'YES' : 'NO'}`);
    console.log(`- User ID: ${userId || 'Not provided'}`);
    console.log(`- Thumbnail: ${thumbnailUrl ? 'YES' : 'NO'}`);
    console.log(`- Quality: ${quality}`);

    console.log(`📋 Subtitle configuration:
      - Subtitles URL provided: ${subtitlesUrl ? 'YES' : 'NO'}
      - Subtitles URL: ${subtitlesUrl || 'None'}
    `);

    // Validate inputs
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json<CreateVideoResponse>({ error: 'Image URLs are required.' }, { status: 400 });
    }
    if (!audioUrl) {
      return NextResponse.json<CreateVideoResponse>({ error: 'Audio URL is required.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json<CreateVideoResponse>({ error: 'User ID is required.' }, { status: 400 });
    }

    // Generate a unique ID for this video
    const videoId = uuidv4();
    console.log(`Starting video creation with ID: ${videoId} for user: ${userId}`);

    // Initialize Supabase client
    const supabase = createClient();
    
    // Create a record in the database to track this job
    const { error: dbError } = await supabase
      .from('video_records')
      .insert({
        id: videoId,
        user_id: userId,
        status: 'pending',
        image_urls: imageUrls,
        audio_url: audioUrl,
        subtitles_url: subtitlesUrl,
        // Use provided thumbnail URL if available, otherwise fall back to first image
        thumbnail_url: thumbnailUrl || imageUrls[0],
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error creating video record in database:', dbError);
      return NextResponse.json<CreateVideoResponse>(
        { error: 'Failed to create video record.', details: dbError.message },
        { status: 500 }
      );
    }

    // Get audio duration to set video length
    console.log('Getting audio duration for timeline...');
    const audioDuration = await getAudioDuration(audioUrl);
    
    // Calculate timeline durations
    // If we can't get audio duration, default to 5 minutes
    const totalDuration = audioDuration || 300; 
    // First minute is for alternating images, or shorter if audio is shorter
    const firstPartDuration = Math.min(60, totalDuration * 0.6); 
    // Image display time depends on how many images we have
    const imageDuration = Math.floor(firstPartDuration / imageUrls.length);
    
    // Second part is the rest of the audio (or at least 10 seconds for zoom effect)
    const secondPartDuration = Math.max(totalDuration - firstPartDuration, 10);
    
    console.log(`Timeline configuration:
      - Total duration: ${totalDuration.toFixed(1)} seconds
      - First part (alternating images): ${firstPartDuration.toFixed(1)} seconds
      - Each image display time: ${imageDuration.toFixed(1)} seconds
      - Second part (zoom effect): ${secondPartDuration.toFixed(1)} seconds`);
    
    // Create multiple clips for zoom in/out effect since Shotstack doesn't have a direct "zoomInOut" effect
    // We'll create alternating zoom in and zoom out clips with faster cycles
    const zoomClips = [];
    const zoomDuration = 15; // Each zoom cycle lasts 10 seconds
    const numZoomCycles = Math.ceil(secondPartDuration / (zoomDuration * 2));
    
    for (let i = 0; i < numZoomCycles; i++) {
      // Add zoom in clip
      zoomClips.push({
        asset: {
          type: "image",
          src: imageUrls[imageUrls.length - 1]
        },
        start: firstPartDuration + (i * zoomDuration * 2),
        length: zoomDuration,
        effect: "zoomIn",
        fit: "cover"
      });
      
      // Add zoom out clip if there's still time left
      if (firstPartDuration + (i * zoomDuration * 2) + zoomDuration < totalDuration) {
        zoomClips.push({
          asset: {
            type: "image",
            src: imageUrls[imageUrls.length - 1]
          },
          start: firstPartDuration + (i * zoomDuration * 2) + zoomDuration,
          length: Math.min(zoomDuration, totalDuration - (firstPartDuration + (i * zoomDuration * 2) + zoomDuration)),
          effect: "zoomOut",
          fit: "cover"
        });
      }
    }

    // Check if the dust overlay is accessible
    const isOverlayAvailable = await isUrlAccessible(DUST_OVERLAY_URL);
    console.log(`Dust overlay availability check: ${isOverlayAvailable ? 'Available' : 'Not available'}`);

    // Initialize tracks array
    let tracks = [];

    // Track for subtitles (captions) - Add this first if it exists
    if (subtitlesUrl) {
      console.log(`Adding subtitles to video: ${subtitlesUrl}`);
      const captionTrack = {
        clips: [
          {
            asset: {
              type: "caption",
              src: subtitlesUrl,
              font: {
                size: 70,
              },
              background: {
                padding: 15,
              },
            },
            start: 0,
            length: totalDuration,
            position: "bottom",
            
          }
        ]
      };
      tracks.push(captionTrack);
    }

    // Track for images
    const imageTrack = {
      clips: [
        ...imageUrls.map((url, index) => ({
          asset: {
            type: "image",
            src: url
          },
          start: index * imageDuration,
          length: imageDuration,
          effect: "zoomIn", // Always use zoomIn for first minute
          fit: "cover"
        })),
        ...zoomClips // Last image zoom in/out
      ]
    };
    tracks.push(imageTrack);

    // Track for main audio (if audioUrl is present)
    if (audioUrl) {
        const audioTrack = {
            clips: [{
                asset: {
                    type: "audio",
                    src: audioUrl,
                    volume: 1 // Ensure audio is audible
                },
                start: 0,
                length: totalDuration // Audio plays for the whole duration
            }]
        };
        tracks.push(audioTrack);
    }

    // Prepend dust overlay track if available (becomes the first track)
    if (isOverlayAvailable) {
      const overlayTrack = {
        clips: [
          {
            asset: {
              type: "video",
              src: DUST_OVERLAY_URL,
              volume: 0
            },
            start: 0,
            length: totalDuration,
            fit: "cover",
            opacity: 0.5
          }
        ]
      };
      tracks.unshift(overlayTrack);
    }
    
    // Log the track structure for debugging
    console.log('📊 Final track structure:');
    tracks.forEach((track, index) => {
      const assetType = track.clips[0]?.asset?.type || 'unknown';
      console.log(`  Track ${index}: ${assetType}`);
    });

    const timeline: any = {
      tracks: tracks
    };

    const outputConfig: any = {
      format: "mp4",
      size: {
        width: 1280,
        height: 720
      }
    };

    // Only add quality parameter if it's 'low'
    if (quality === 'low') {
      outputConfig.quality = "low";
    }

    const shotstackPayload = {
      timeline: timeline,
      output: outputConfig,
      callback: process.env.SHOTSTACK_CALLBACK_URL
    };

    console.log(JSON.stringify(shotstackPayload, null, 2));

    console.log("📤 Sending Shotstack API request with payload summary:");
    console.log(`- Total tracks: ${tracks.length}`);
    console.log(`- Images: ${imageUrls.length}`);
    console.log(`- Audio: ${audioUrl ? 'YES' : 'NO'}`);
    console.log(`- Subtitles: ${subtitlesUrl ? 'Manual file' : 'Automatic'}`);
    
    const shotstackResponse = await fetch(`${SHOTSTACK_ENDPOINT}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SHOTSTACK_API_KEY
      },
      body: JSON.stringify(shotstackPayload),
    });

    if (!shotstackResponse.ok) {
      const errorData = await shotstackResponse.json();
      console.error('Shotstack API error:', errorData);
      
      // Update database record with error
      await supabase
        .from('video_records')
        .update({
          status: 'failed',
          error_message: `Shotstack API error: ${JSON.stringify(errorData)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);
      
      return NextResponse.json<CreateVideoResponse>(
        { error: 'Failed to create video with Shotstack API', details: JSON.stringify(errorData) },
        { status: shotstackResponse.status }
      );
    }

    const responseData = await shotstackResponse.json();
    const shotstackId = responseData.response.id;
    console.log("Response from Shotstack API:", responseData);
    console.log("Shotstack ID:", shotstackId);

    // Update database with Shotstack render ID
    if (shotstackId) {
      console.log("Updating database with Shotstack ID:", shotstackId);
      await supabase
        .from('video_records')
        .update({
          shotstack_id: shotstackId,
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);
    }

    // Return success response with video ID
    return NextResponse.json<CreateVideoResponse>({
      message: 'Video creation job started successfully',
      video_id: videoId
    }, { status: 202 });

  } catch (error: any) {
    console.error('Error in /api/create-video route:', error);
    return NextResponse.json<CreateVideoResponse>(
      { error: 'Failed to process video creation request', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
