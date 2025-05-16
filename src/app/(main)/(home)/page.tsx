"use client";

import { useState, useEffect } from "react";
import ScriptGenerator from "./components/script-generator";
import AudioGenerator from "./components/audio-generator";
import ImageGenerator from "./components/image-generator";
import VideoGenerator from "./components/video-generator";
import GoogleDriveComponent from "./components/google-drive-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Volume2, Image, Film, Database, Cloud } from "lucide-react";
import { ScriptSection } from "@/types";
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
import { predefinedUsers } from "@/types/users";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");
  
  // User Selection State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { user, mappedUser } = useAuth();
  
  // Real user ID from authentication (if available)
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

  // Image Generator State - Lifted
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [generatedImageSetsList, setGeneratedImageSetsList] = useState<GeneratedImageSet[]>([]);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [currentImageGeneratingInfo, setCurrentImageGeneratingInfo] = useState<string | null>(null);

  // Video Generator State - New
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);

  // State for video job statuses
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);

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

  // Use image_generation_prompt from script sections
  const imagePrompts = sharedScriptSections.map(section => section.image_generation_prompt);
  const defaultNumberOfImagesPerSectionPrompt = 1;

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
    setCurrentImageGeneratingInfo(`Generating ${numberOfImagesPerPrompt} image${numberOfImagesPerPrompt > 1 ? 's' : ''} for ${promptsForGeneration.length} prompt${promptsForGeneration.length > 1 ? 's' : ''}...`);
    
    try {
      // Use the new batch processing endpoint with rate limiting
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          prompts: promptsForGeneration,
          minimaxAspectRatio: "16:9",
          userId: actualUserId || 'unknown_user',
          numberOfImagesPerPrompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const data = await response.json();
      
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        // Convert the flat array of image URLs to a GeneratedImageSet format
        const newImageSet: GeneratedImageSet = {
          originalPrompt: promptsForGeneration.join(' | '),
          imageUrls: data.imageUrls,
          imageData: []
        };
        
        setGeneratedImageSetsList([newImageSet]);
        console.log(`Successfully generated ${data.imageUrls.length} images`);
        
        // Log any failed prompts
        if (data.failedPrompts && data.failedPrompts.length > 0) {
          console.warn(`${data.failedPrompts.length} prompts failed to generate:`, 
            data.failedPrompts.map((f: {index: number; prompt: string; error?: string}) => 
              `Index ${f.index}: ${f.prompt.substring(0, 30)}... - ${f.error}`).join('\n'));
        }
      } else {
        setImageGenerationError('Received invalid response from image generation service');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred during image generation';
      console.error('Image generation error:', err);
      setImageGenerationError(errorMsg);
    } finally {
      setIsGeneratingImages(false);
      setCurrentImageGeneratingInfo(null);
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

  const handleStartVideoCreation = async (selectedImageUrls: string[]) => {
    if (!actualUserId) { // Check if a user is selected
      setVideoGenerationError("Please select a user before creating a video.");
      return;
    }
    if (!selectedImageUrls || selectedImageUrls.length === 0) {
      setVideoGenerationError("No images selected for video creation.");
      return;
    }
    if (selectedImageUrls.length > 20) {
      setVideoGenerationError("Cannot create video with more than 20 images.");
      return;
    }
    if (!generatedAudioUrl) {
      setVideoGenerationError("Audio has not been generated or is missing.");
      setIsGeneratingVideo(false);
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    setVideoGenerationError(null);
    
    try {
      const requestBody: CreateVideoRequestBody = {
        imageUrls: selectedImageUrls,
        audioUrl: generatedAudioUrl,
        subtitlesUrl: generatedSubtitlesUrl || undefined,
        userId: actualUserId,
      };
      
      console.log(`Creating video with ${selectedImageUrls.length} images, audio, and ${generatedSubtitlesUrl ? 'subtitles' : 'no subtitles'}.`);
      
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), 
      });

      const data: CreateVideoResponse = await response.json();

      if (!response.ok || data.error) {
        setVideoGenerationError(data.details || data.error || "Failed to start video creation job.");
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
        
        setVideoGenerationError(null); // Clear previous errors
      } else {
        setVideoGenerationError("Video creation started but failed to get job ID.");
      }
    } catch (err: any) { 
      setVideoGenerationError(err.message || "An unexpected error occurred during video creation initiation.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // We don't need the handleUserChange function anymore since we're using the actual user ID
  // Just keep it as a stub for now to avoid breaking changes
  const handleUserChange = (userId: string) => {
    console.log("User selection is deprecated - using authenticated user ID instead");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        selectedUserId={selectedUserId} 
        onUserChange={handleUserChange} 
      />

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
            />
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <ImageGenerator 
              scriptPrompts={imagePrompts}
              scriptSections={sharedScriptSections}
              numberOfImagesPerPrompt={defaultNumberOfImagesPerSectionPrompt}
              isLoadingImages={isGeneratingImages}
              imageSets={generatedImageSetsList}
              generationError={imageGenerationError}
              generatingInfo={currentImageGeneratingInfo}
              onStartGenerationRequest={handleStartImageGeneration}
              onRegenerateImages={handleRegenerateImages}
            />
          </TabsContent>
          
          <TabsContent value="video" className="mt-0">
            <VideoGenerator 
              availableImageSets={generatedImageSetsList}
              isGeneratingVideo={isGeneratingVideo}
              generatedVideoUrl={generatedVideoUrl}
              videoGenerationError={videoGenerationError}
              onStartVideoCreation={handleStartVideoCreation}
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