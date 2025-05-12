export interface CreateVideoRequestBody {
    imageUrls: string[];
    audioUrl?: string;
    userId?: string;
  }
  
  export interface CreateVideoResponse {
    message?: string;
    video_id?: string;
    videoUrl?: string;
    error?: string;
    details?: string; // For more detailed errors
  }
  