import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { Buffer } from 'buffer'; // Ensure Buffer is imported

// Ensure these environment variables are set in your .env.local or environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend operations
const supabaseBucket = process.env.SUPABASE_BUCKET_NAME || 'generated_media'; // Default bucket name, adjust as needed

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Required for service_role key. See https://supabase.com/docs/reference/javascript/initializing#generating-types
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log("Supabase Admin client initialized.");
} else {
  console.error("❌ Supabase URL or Service Role Key environment variables are missing. Supabase functionalities will be unavailable.");
}

/**
 * Uploads a file (from path or buffer) to Supabase Storage.
 *
 * @param fileSource Path to the local file (string) or a Buffer containing the file data.
 * @param destinationPath The desired path within the Supabase bucket (e.g., 'user_123/audio/myaudio.mp3').
 * @param contentType The MIME type of the file (e.g., 'audio/mpeg', 'image/png').
 * @returns The public URL of the uploaded file, or null on failure.
 */
export async function uploadFileToSupabase(
  fileSource: string | Buffer,
  destinationPath: string,
  contentType: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error("Supabase Admin client is not initialized. Cannot upload file.");
    return null;
  }

  try {
    let fileBody: Buffer;
    let isLocalFileCleanup = false;

    if (typeof fileSource === 'string') {
      console.log(`Reading file from path for Supabase upload: ${fileSource}`);
      fileBody = await fs.readFile(fileSource);
      isLocalFileCleanup = true; // Mark for potential cleanup
    } else if (Buffer.isBuffer(fileSource)) {
      fileBody = fileSource;
      console.log(`Uploading buffer directly to Supabase. Destination: ${destinationPath}`);
    } else {
      throw new Error("Invalid fileSource type. Must be a file path (string) or a Buffer.");
    }

    console.log(`Uploading to Supabase bucket '${supabaseBucket}' at path: ${destinationPath}`);

    const { data, error } = await supabaseAdmin.storage
      .from(supabaseBucket)
      .upload(destinationPath, fileBody, {
        contentType: contentType,
        upsert: true, // Overwrite if file exists (optional)
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      throw error;
    }

    // Construct the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(supabaseBucket)
      .getPublicUrl(destinationPath);

    const publicURL = urlData?.publicUrl;

    if (!publicURL) {
      console.error("Could not retrieve public URL after Supabase upload.");
      return null;
    }

    console.log(`✅ Successfully uploaded to Supabase. Public URL: ${publicURL}`);

    // Cleanup local file *after* successful upload if source was a path
    if (isLocalFileCleanup && typeof fileSource === 'string') {
        try {
            await fs.rm(fileSource);
            console.log(`🧹 Cleaned up local file: ${fileSource}`);
        } catch (cleanupError) {
            console.warn(`⚠️ Failed to clean up local file ${fileSource} after upload:`, cleanupError);
        }
    }

    return publicURL;

  } catch (err: any) {
    console.error(`Error during Supabase upload process for destination ${destinationPath}:`, err.message || err);
    // Attempt to clean up local file even if upload failed, if source was a path
    if (typeof fileSource === 'string') {
        try {
            await fs.access(fileSource); // Check if file exists before trying to remove
            await fs.rm(fileSource);
            console.log(`🧹 Cleaned up local file ${fileSource} after failed upload attempt.`);
        } catch (cleanupError: any) { 
            // Ignore if file doesn't exist (already cleaned or never created)
            if (cleanupError.code !== 'ENOENT') { 
              console.warn(`⚠️ Failed to clean up local file ${fileSource} after failed upload:`, cleanupError); 
            }
        }
    }
    return null;
  }
} 