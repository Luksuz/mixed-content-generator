import { NextRequest, NextResponse } from 'next/server';
import { CreateVideoRequestBody, CreateVideoResponse } from '@/types/video-generation';

// Ensure this URL is configured in your environment variables
const VIDEO_GENERATION_API_URL = process.env.VIDEO_GENERATION_API_URL || 'http://localhost:8000/create-video';

export async function POST(request: NextRequest) {
  try {
    const body: CreateVideoRequestBody = await request.json();
    const { imageUrls, audioUrl, userId } = body; // Assuming audioUrl and userId are passed in the request

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json<CreateVideoResponse>({ error: 'Image URLs are required.' }, { status: 400 });
    }
    if (!audioUrl) {
      return NextResponse.json<CreateVideoResponse>({ error: 'Audio URL is required.' }, { status: 400 });
    }
    if (!userId) {
        // TODO: Implement proper user ID retrieval, e.g., from session
        console.warn("User ID not provided in request. Sending a placeholder.");
        // return NextResponse.json<CreateVideoResponse>({ error: 'User ID is required.' }, { status: 400 });
    }

    const payloadToFastAPI = {
      user_id: userId || "placeholder_user_id", // Replace with actual user ID retrieval
      image_urls: imageUrls,
      audio_url: audioUrl,
    };

    console.log("Forwarding video creation request to FastAPI service:", payloadToFastAPI);
    console.log("FastAPI service URL:", VIDEO_GENERATION_API_URL);

    const fastApiResponse = await fetch(VIDEO_GENERATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadToFastAPI),
    });

    const responseData: CreateVideoResponse = await fastApiResponse.json();

    if (!fastApiResponse.ok) {
      console.error('FastAPI service returned an error:', fastApiResponse.status, responseData);
      return NextResponse.json<CreateVideoResponse>(
        { error: responseData.error || 'Failed to process video via external service.', details: (responseData as any).details },
        { status: fastApiResponse.status }
      );
    }

    console.log("Response from FastAPI service:", responseData);
    // The FastAPI service now returns a 202 with a message and video_id
    // The actual video URL will be updated in the DB by the FastAPI service.
    // The client might need a way to poll for status or receive updates (e.g., via WebSockets or Supabase Realtime)
    return NextResponse.json<CreateVideoResponse>(responseData, { status: fastApiResponse.status });

  } catch (error: any) {
    console.error('Error in /api/create-video route:', error);
    return NextResponse.json<CreateVideoResponse>(
      { error: 'Failed to forward video creation request.', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
