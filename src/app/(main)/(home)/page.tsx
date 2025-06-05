"use client";

import { useState, useEffect } from "react";
import ScriptGenerator from "./components/script-generator";
import AudioGenerator from "./components/audio-generator";
import ImageGenerator from "./components/image-generator";
import VideoGenerator from "./components/video-generator";
import GoogleDriveComponent from "./components/google-drive-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Volume2, Image, Film, Database, Cloud } from "lucide-react";

export interface ScriptSection {
  title: string;
  writingInstructions: string;
  image_generation_prompt: string;
}

import { 
  ImageProvider, 
  GeneratedImageSet, 
  GenerateImageRequestBody, 
  GenerateImageResponse 
} from "@/types/image-generation";
import { CreateVideoRequestBody, CreateVideoResponse } from "@/types/video-generation";
import VideoStatus, { VideoJob } from './components/video-status';
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/navbar";

// New interface for extracted scenes
export interface ExtractedScene {
  chunkIndex: number;
  originalText: string;
  imagePrompt: string;
  summary: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
}

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");
  
  const { user } = useAuth();
  
  const actualUserId = user?.id || "";

  // Script Generator State
  const [sharedScriptSections, setSharedScriptSections] = useState<ScriptSection[]>([]);
  const [sharedFullScriptMarkdown, setSharedFullScriptMarkdown] = useState<string>("");
  const [sharedFullScriptCleaned, setSharedFullScriptCleaned] = useState<string>("");

  // Audio Generator State - Lifted
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null);
  const [generatedSubtitlesUrl, setGeneratedSubtitlesUrl] = useState<string | null>(null);

  // Audio Batch Processing State - Lifted to persist across tab switches
  const [audioBatchProcessingState, setAudioBatchProcessingState] = useState({
    chunks: [] as string[],
    chunkResults: [] as Array<{
      chunkIndex: number;
      chunkUrl?: string;
      error?: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
    }>,
    currentBatch: 0,
    totalBatches: 0,
    processingProgress: 0,
    isProcessingBatches: false,
    isConcatenating: false,
    isGeneratingSubtitles: false,
  });

  // Image Generator State - Lifted
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [generatedImageSetsList, setGeneratedImageSetsList] = useState<GeneratedImageSet[]>([]);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [currentImageGeneratingInfo, setCurrentImageGeneratingInfo] = useState<string | null>(null);
  
  // Thumbnail State - New
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);

  // Video Generator State - New
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);
  const [videoSubmissionSuccess, setVideoSubmissionSuccess] = useState<boolean>(false);

  // State for video job statuses
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);

  // Scene Extraction State - New
  const [isExtractingScenes, setIsExtractingScenes] = useState<boolean>(false);
  const [extractedScenes, setExtractedScenes] = useState<ExtractedScene[]>([]);
  const [sceneExtractionError, setSceneExtractionError] = useState<string | null>(null);
  const [numberOfScenesToExtract, setNumberOfScenesToExtract] = useState<number>(5); // Default to 5 scenes

  // Fetch existing jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!actualUserId) return; // Don't fetch if no user selected

      setIsLoadingJobs(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('video_records')
        .select('*')
        .eq('user_id', actualUserId) // Filter by actual user ID
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching video jobs:", error);
        setVideoGenerationError(`Failed to load jobs for user: ${error.message}`);
        setVideoJobs([]);
        setIsGeneratingVideo(false); // No jobs means no generation in progress
      } else if (data) {
        const fetchedJobs: VideoJob[] = data.map(job => ({
            ...job,
            createdAt: new Date(job.created_at),
            updatedAt: job.updated_at ? new Date(job.updated_at) : undefined,
            videoUrl: job.final_video_url
        }));
        setVideoJobs(fetchedJobs);
        console.log(`Fetched ${fetchedJobs.length} video jobs for user ${actualUserId}`);
        setVideoGenerationError(null); // Clear previous errors
        
        // Check if any jobs are still in progress
        const hasJobsInProgress = fetchedJobs.some(job => 
          job.status === 'pending' || job.status === 'processing'
        );
        
        // Update isGeneratingVideo based on job statuses
        setIsGeneratingVideo(hasJobsInProgress);
        
        // If a job completed successfully, update the generated video URL
        const completedJob = fetchedJobs.find(job => 
          job.status === 'completed' && job.videoUrl
        );
        if (completedJob && completedJob.videoUrl) {
          setGeneratedVideoUrl(completedJob.videoUrl);
        }
      }
      setIsLoadingJobs(false);
    };

    fetchJobs();
    
    // If on video tab, set up polling for job updates
    const pollingInterval = activeTab === "video" ? 
      setInterval(() => {
        console.log(`⏱️ Polling: Running scheduled video jobs update (every 30s)`);
        fetchJobs();
      }, 30000) : null; // Poll every 30 seconds
    
    if (pollingInterval) {
      console.log(`🔄 Polling: Started polling for video jobs (${activeTab === "video" ? "active" : "inactive"} tab)`);
    } else {
      console.log(`⏹️ Polling: No polling activated (current tab: ${activeTab})`);
    }
    
    return () => {
      if (pollingInterval) {
        console.log(`⏹️ Polling: Stopping video jobs polling interval`);
        clearInterval(pollingInterval);
      }
    };
  }, [actualUserId, activeTab]); // Use actualUserId in dependencies

  const handleScriptSectionsUpdate = (sections: ScriptSection[]) => {
    setSharedScriptSections(sections);
  };

  const handleFullScriptUpdate = (data: { scriptWithMarkdown: string, scriptCleaned: string }) => {
    setSharedFullScriptMarkdown(data.scriptWithMarkdown);
    setSharedFullScriptCleaned(data.scriptCleaned);
  };

  // Handler to update the lifted audio state
  const handleAudioGenerated = (url: string | null) => {
    setGeneratedAudioUrl(url);
    if (url === null) {
      // If audio is cleared, also clear subtitles since they're based on the audio
      setGeneratedSubtitlesUrl(null);
    }
  };

  // Handler to update the lifted subtitles state
  const handleSubtitlesGenerated = (url: string | null) => {
    setGeneratedSubtitlesUrl(url);
  };

  // Moved image generation logic to GeneratorsPage
  const handleStartImageGeneration = async (provider: ImageProvider, numberOfImagesPerPrompt: number, manualSinglePrompt?: string) => {
    // Determine which prompts to use
    let promptsForGeneration: string[] = [];
    
    if (manualSinglePrompt) {
      // Check if we have a combined prompt with our separator
      if (manualSinglePrompt.includes('|||||')) {
        promptsForGeneration = manualSinglePrompt.split('|||||');
      } else {
        promptsForGeneration = [manualSinglePrompt];
      }
    } else if (imagePrompts && imagePrompts.length > 0) {
      promptsForGeneration = imagePrompts;
    }

    if (promptsForGeneration.length === 0) {
      setImageGenerationError('No prompts available to generate images. Please use the script generator or enter a description.');
      return;
    }

    setIsGeneratingImages(true);
    setImageGenerationError(null);
    setGeneratedImageSetsList([]); 
    
    // Frontend batch processing
    const BATCH_SIZE = 5; // Process 3 prompts at a time
    const totalBatches = Math.ceil(promptsForGeneration.length / BATCH_SIZE);
    let completedBatches = 0;
    let allImageSets: GeneratedImageSet[] = [];
    
    try {
      // Process prompts in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, promptsForGeneration.length);
        const batchPrompts = promptsForGeneration.slice(batchStart, batchEnd);
        
        // Update progress info
        setCurrentImageGeneratingInfo(`Processing batch ${batchIndex + 1}/${totalBatches} (${batchPrompts.length} prompts)`);
        
        console.log(`Processing batch ${batchIndex + 1}/${totalBatches}: prompts ${batchStart + 1}-${batchEnd}`);
        
        // Process current batch
        const batchImageSets = await Promise.allSettled(
          batchPrompts.map(async (prompt, promptIndex) => {
            const globalPromptIndex = batchStart + promptIndex;
            
            try {
              // Update progress for individual prompt within batch
              setCurrentImageGeneratingInfo(`Processing batch ${batchIndex + 1}/${totalBatches}`);
              
              // Call the single image generation API
              const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider,
                  prompt,
                  numberOfImages: numberOfImagesPerPrompt,
                  userId: actualUserId || 'unknown_user'
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
              }

              const data = await response.json();
              
              // Create image set from response
              const imageSet: GeneratedImageSet = {
                originalPrompt: prompt,
                imageUrls: data.imageUrls || [],
                imageData: data.imageData || []
              };
              
              console.log(`✅ Completed prompt ${globalPromptIndex + 1}/${promptsForGeneration.length}: ${imageSet.imageUrls.length} images generated`);
              return imageSet;
              
            } catch (error: any) {
              console.error(`❌ Failed prompt ${globalPromptIndex + 1}/${promptsForGeneration.length}:`, error);
              return {
                originalPrompt: prompt,
                imageUrls: [],
                imageData: [],
                error: error.message || 'Unknown error'
              } as GeneratedImageSet;
            }
          })
        );
        
        // Process batch results
        const batchResults = batchImageSets.map(result => 
          result.status === 'fulfilled' ? result.value : {
            originalPrompt: 'Failed prompt',
            imageUrls: [],
            imageData: [],
            error: result.reason?.message || 'Unknown error'
          }
        );
        
        // Add batch results to accumulator
        allImageSets.push(...batchResults);
        
        // Update the UI with accumulated results
        setGeneratedImageSetsList([...allImageSets]);
        
        completedBatches++;
        const totalImages = allImageSets.reduce((sum, set) => sum + (set.imageUrls?.length || 0), 0);
        
        // Update progress
        setCurrentImageGeneratingInfo(`Completed batch ${completedBatches}/${totalBatches} - ${totalImages} images generated`);
        
        console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} completed. Total images so far: ${totalImages}`);
        
        // Add delay between batches (except for the last batch)
        if (batchIndex < totalBatches - 1) {
          setCurrentImageGeneratingInfo(`Completed batch ${completedBatches}/${totalBatches} - waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
        }
      }
      
      const totalImages = allImageSets.reduce((sum, set) => sum + (set.imageUrls?.length || 0), 0);
      const totalPrompts = promptsForGeneration.length;
      
      console.log(`🎉 Image generation completed: ${totalImages} images generated across ${totalPrompts} prompts`);
      setCurrentImageGeneratingInfo(`✅ Generation complete - ${totalImages} images from ${totalPrompts} prompts`);
      
      // Clear the info message after a short delay
      setTimeout(() => {
        setCurrentImageGeneratingInfo(null);
      }, 3000);
      
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during image generation';
      console.error('Image generation error:', err);
      setImageGenerationError(errorMsg);
      setCurrentImageGeneratingInfo(null);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Add a function to handle regenerating selected images
  const handleRegenerateImages = async (provider: ImageProvider, prompts: string[]) => {
    if (prompts.length === 0) {
      setImageGenerationError("No prompts provided for regeneration");
      return;
    }
    
    if (prompts.length > 5) {
      setImageGenerationError("Maximum 5 images can be regenerated at once");
      return;
    }
    
    setIsGeneratingImages(true);
    setImageGenerationError(null);
    setCurrentImageGeneratingInfo(`Regenerating ${prompts.length} selected image${prompts.length > 1 ? 's' : ''}...`);
    
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          prompts,
          minimaxAspectRatio: "16:9",
          userId: actualUserId || 'unknown_user'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to regenerate images');
      }
      
      const data = await response.json();
      
      if (data.regeneratedImages && Array.isArray(data.regeneratedImages)) {
        // Process the regenerated images
        const newImages = data.regeneratedImages.map((item: { imageUrl: string; originalPrompt: string }) => ({
          originalPrompt: item.originalPrompt,
          imageUrls: [item.imageUrl],
          imageData: []
        }));
        
        // Add new images to the existing list
        setGeneratedImageSetsList(prev => [...newImages, ...prev]);
        
        console.log(`✅ Successfully regenerated ${data.totalSuccessful} images`);
        
        if (data.totalFailed > 0) {
          console.warn(`⚠️ Failed to regenerate ${data.totalFailed} images`);
          if (data.errors) {
            console.error('Regeneration errors:', data.errors);
          }
        }
      } else {
        setImageGenerationError('Received invalid response from image regeneration service');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during image regeneration';
      console.error('Image regeneration error:', err);
      setImageGenerationError(errorMsg);
    } finally {
      setIsGeneratingImages(false);
      setCurrentImageGeneratingInfo(null);
    }
  };

  // Handler for thumbnail generation
  const handleThumbnailGenerated = (thumbnailUrl: string) => {
    console.log("Thumbnail generated and ready for video:", thumbnailUrl);
    setGeneratedThumbnailUrl(thumbnailUrl);
    
    // Optionally switch to video tab when a thumbnail is ready
    if (activeTab === "image") {
      setActiveTab("video");
    }
  };

  const handleStartVideoCreation = async (
    selectedImageUrls: string[], 
    quality: 'low' | 'high' = 'low',
    enableOverlay: boolean = true,
    enableZoom: boolean = true,
    enableSubtitles: boolean = true
  ) => {
    if (!actualUserId) { // Check if a user is selected
      setVideoGenerationError("Please select a user before creating a video.");
      return;
    }
    if (!selectedImageUrls || selectedImageUrls.length === 0) {
      setVideoGenerationError("No images selected for video creation.");
      return;
    }
    if (selectedImageUrls.length > 200) {
      setVideoGenerationError("Cannot create video with more than 200 images.");
      return;
    }
    if (!generatedAudioUrl) {
      setVideoGenerationError("Audio has not been generated or is missing.");
      return;
    }

    setIsSubmittingVideo(true);
    setVideoGenerationError(null);
    setVideoSubmissionSuccess(false);
    
    try {
      const requestBody: CreateVideoRequestBody = {
        imageUrls: selectedImageUrls,
        audioUrl: generatedAudioUrl,
        subtitlesUrl: generatedSubtitlesUrl || undefined,
        userId: actualUserId,
        thumbnailUrl: generatedThumbnailUrl || undefined, // Include custom thumbnail if available
        quality: quality, // Include quality setting
        enableOverlay: enableOverlay, // Include overlay setting
        enableZoom: enableZoom, // Include zoom setting
        enableSubtitles: enableSubtitles, // Include subtitles setting
      };
      
      console.log(`Creating video with ${selectedImageUrls.length} images, audio, ${generatedSubtitlesUrl ? 'subtitles' : 'no subtitles'}, ${generatedThumbnailUrl ? 'custom thumbnail' : 'default thumbnail'}, ${quality} quality, overlay: ${enableOverlay}, zoom: ${enableZoom}, subtitles: ${enableSubtitles}.`);
      
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), 
      });

      const data: CreateVideoResponse = await response.json();

      if (!response.ok || data.error) {
        setVideoGenerationError(data.details || data.error || "Failed to start video creation job.");
        setIsSubmittingVideo(false);
        setVideoSubmissionSuccess(false);
      } else if (data.video_id) {
        // Fetch jobs immediately to show pending job
        const supabase = createClient();
        const { data: newJobData } = await supabase
          .from('video_records')
          .select('*')
          .eq('id', data.video_id)
          .single();
          
        if (newJobData) {
          const newJob: VideoJob = {
            ...newJobData,
            id: newJobData.id,
            status: newJobData.status,
            createdAt: new Date(newJobData.created_at),
            updatedAt: newJobData.updated_at ? new Date(newJobData.updated_at) : undefined,
            videoUrl: newJobData.final_video_url,
            errorMessage: newJobData.error_message,
            user_id: newJobData.user_id,
          };
          
          // Add new job to the beginning of the list
          setVideoJobs(prevJobs => [newJob, ...prevJobs]);
        }
        
        setVideoGenerationError(null);
        setVideoSubmissionSuccess(true);
        setIsSubmittingVideo(false); // Only reset submission state
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setVideoSubmissionSuccess(false);
        }, 5000);
      } else {
        setVideoGenerationError("Video creation started but failed to get job ID.");
        setIsSubmittingVideo(false);
        setVideoSubmissionSuccess(false);
      }
    } catch (err: any) { 
      setVideoGenerationError(err.message || "An unexpected error occurred during video creation initiation.");
      setIsSubmittingVideo(false);
      setVideoSubmissionSuccess(false);
    }
  };

  // We don't need handleUserChange anymore
  // Just remove it or update it to be a no-op if it's referenced elsewhere
  const handleUserChange = (userId: string) => {
    // No longer needed - do nothing
  };

  // New function to extract scenes from the script
  const handleExtractScenes = async (numScenes: number) => {
    if (!sharedFullScriptCleaned || sharedFullScriptCleaned.trim() === '') {
      setSceneExtractionError('No script available. Please generate a script first.');
      return;
    }

    setIsExtractingScenes(true);
    setSceneExtractionError(null);
    setExtractedScenes([]);

    try {
      const response = await fetch('/api/extract-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: sharedFullScriptCleaned,
          numberOfScenes: numScenes,
          userId: actualUserId || 'unknown_user'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract scenes');
      }

      const data = await response.json();
      
      if (data.scenes && Array.isArray(data.scenes)) {
        setExtractedScenes(data.scenes);
        console.log(`Successfully extracted ${data.scenes.length} scenes`);
        
        // If we're on the script tab, automatically switch to image tab after extraction
        if (activeTab === "script") {
          setActiveTab("image");
        }
      } else {
        setSceneExtractionError('Received invalid response from scene extraction service');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during scene extraction';
      console.error('Scene extraction error:', err);
      setSceneExtractionError(errorMsg);
    } finally {
      setIsExtractingScenes(false);
    }
  };

  // Ensure we no longer have a duplicate declaration of imagePrompts
  // Remove the old declaration and use the scene-based one instead
  const imagePrompts = extractedScenes && extractedScenes.length > 0
    ? extractedScenes.map(scene => scene.imagePrompt)
    : sharedScriptSections.map(section => section.image_generation_prompt);
  
  const defaultNumberOfImagesPerSectionPrompt = 1;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="container py-6 max-w-7xl flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Content Generator</h1>
          <p className="text-muted-foreground">
            Create amazing content using AI. Generate scripts, audio, images, and videos with ease.
          </p>
        </div>
        
        <Tabs defaultValue="script" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="script" className="flex items-center gap-2">
              <FileText size={18} />
              <span className="hidden sm:inline">Script</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 size={18} />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image size={18} />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Film size={18} />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="gdrive" className="flex items-center gap-2">
              <Database size={18} />
              <span className="hidden sm:inline">Google Drive</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="script" className="mt-0">
            <ScriptGenerator 
              onScriptSectionsChange={handleScriptSectionsUpdate} 
              onFullScriptChange={handleFullScriptUpdate}
              currentScriptSections={sharedScriptSections}
              currentFullScript={sharedFullScriptMarkdown}
            />
          </TabsContent>
          
          <TabsContent value="audio" className="mt-0">
            <AudioGenerator 
              initialText={sharedFullScriptCleaned}
              generatedAudioUrl={generatedAudioUrl}
              isGeneratingAudio={isGeneratingAudio}
              audioGenerationError={audioGenerationError}
              onAudioGenerated={handleAudioGenerated}
              onSubtitlesGenerated={handleSubtitlesGenerated}
              setIsGeneratingAudio={setIsGeneratingAudio}
              setAudioGenerationError={setAudioGenerationError}
              selectedUserId={actualUserId}
              batchProcessingState={audioBatchProcessingState}
              setBatchProcessingState={setAudioBatchProcessingState}
            />
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <ImageGenerator 
              scriptPrompts={imagePrompts}
              scriptSections={sharedScriptSections}
              extractedScenes={extractedScenes}
              isExtractingScenes={isExtractingScenes}
              sceneExtractionError={sceneExtractionError}
              onExtractScenes={handleExtractScenes}
              numberOfScenesToExtract={numberOfScenesToExtract}
              setNumberOfScenesToExtract={setNumberOfScenesToExtract}
              numberOfImagesPerPrompt={defaultNumberOfImagesPerSectionPrompt}
              isLoadingImages={isGeneratingImages}
              imageSets={generatedImageSetsList}
              generationError={imageGenerationError}
              generatingInfo={currentImageGeneratingInfo}
              onStartGenerationRequest={handleStartImageGeneration}
              onRegenerateImages={handleRegenerateImages}
              onThumbnailGenerated={handleThumbnailGenerated}
            />
          </TabsContent>
          
          <TabsContent value="video" className="mt-0">
            <VideoGenerator 
              availableImageSets={generatedImageSetsList}
              isSubmittingVideo={isSubmittingVideo}
              videoSubmissionSuccess={videoSubmissionSuccess}
              videoGenerationError={videoGenerationError}
              onStartVideoCreation={handleStartVideoCreation}
              thumbnailUrl={generatedThumbnailUrl}
            />
          </TabsContent>
          <TabsContent value="gdrive" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Cloud size={24} className="text-blue-500" />
                  <CardTitle>Google Drive</CardTitle>
                </div>
                <CardDescription>Select files or folders from your Google Drive.</CardDescription> 
              </CardHeader>
              <CardContent>
                <GoogleDriveComponent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <VideoStatus jobs={videoJobs} isLoading={isLoadingJobs} />
      </div>
    </div>
  );
};

export default GeneratorsPage;