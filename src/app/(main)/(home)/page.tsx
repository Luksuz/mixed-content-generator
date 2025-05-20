"use client";

import { useState, useEffect } from "react";
import ScriptGenerator from "./components/script-generator";
import AudioGenerator from "./components/audio-generator";
import ImageGenerator from "./components/image-generator";
import VideoGenerator from "./components/video-generator";
import GoogleDriveComponent from "./components/google-drive-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Volume2, Image, Film, Database, Cloud, Sparkles } from "lucide-react";
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
// Import mock data
import {
  mockScriptSections,
  mockFullScriptMarkdown,
  mockFullScriptCleaned,
  mockAudioUrl,
  mockSubtitlesUrl,
  mockGeneratedImageSets,
  mockVideoJobs,
  mockThumbnailUrl,
  simulateLoading
} from "@/lib/mock-data";

// Determine if we should use mock data
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_NODE_ENV === 'development'

// Mock user ID to use instead of the actual user ID
const MOCK_USER_ID = "mock-user-123";

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");
  
  // User Selection State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { user, mappedUser } = useAuth();
  
  // Use mock user ID instead of actual user ID
  const actualUserId = USE_MOCK_DATA ? MOCK_USER_ID : (user?.id || "");

  // Script Generator State
  const [sharedScriptSections, setSharedScriptSections] = useState<ScriptSection[]>(USE_MOCK_DATA ? mockScriptSections : []);
  const [sharedFullScriptMarkdown, setSharedFullScriptMarkdown] = useState<string>(USE_MOCK_DATA ? mockFullScriptMarkdown : "");
  const [sharedFullScriptCleaned, setSharedFullScriptCleaned] = useState<string>(USE_MOCK_DATA ? mockFullScriptCleaned : "");

  // Audio Generator State - Lifted
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(USE_MOCK_DATA ? mockAudioUrl : null);
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null);
  const [generatedSubtitlesUrl, setGeneratedSubtitlesUrl] = useState<string | null>(USE_MOCK_DATA ? mockSubtitlesUrl : null);

  // Image Generator State - Lifted
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [generatedImageSetsList, setGeneratedImageSetsList] = useState<GeneratedImageSet[]>(USE_MOCK_DATA ? mockGeneratedImageSets : []);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [currentImageGeneratingInfo, setCurrentImageGeneratingInfo] = useState<string | null>(null);
  
  // Thumbnail State - New
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(USE_MOCK_DATA ? mockThumbnailUrl : null);

  // Video Generator State - New
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);

  // State for video job statuses
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>(USE_MOCK_DATA ? mockVideoJobs : []);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(!USE_MOCK_DATA);

  // Fetch existing jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!actualUserId || USE_MOCK_DATA) {
        if (USE_MOCK_DATA) {
          // If using mock data, simulate a loading delay
          setIsLoadingJobs(true);
          await simulateLoading(1000);
          setIsLoadingJobs(false);
        }
        return;
      }

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
    const pollingInterval = activeTab === "video" && !USE_MOCK_DATA ? 
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
    // If using mock data, simulate loading and return mock image sets
    if (USE_MOCK_DATA) {
      setIsGeneratingImages(true);
      setImageGenerationError(null);
      setCurrentImageGeneratingInfo("Generating images from your prompts...");
      
      // Simulate API call delay
      await simulateLoading(2000);
      
      setIsGeneratingImages(false);
      setCurrentImageGeneratingInfo(null);
      return;
    }
    
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
    // If using mock data, simulate loading and return
    if (USE_MOCK_DATA) {
      setIsGeneratingImages(true);
      setImageGenerationError(null);
      setCurrentImageGeneratingInfo(`Regenerating ${prompts.length} selected image${prompts.length > 1 ? 's' : ''}...`);
      
      // Simulate API call delay
      await simulateLoading(2500);
      
      setIsGeneratingImages(false);
      setCurrentImageGeneratingInfo(null);
      return;
    }
    
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

  const handleStartVideoCreation = async (selectedImageUrls: string[]) => {
    // If using mock data, simulate video creation process
    if (USE_MOCK_DATA) {
      if (selectedImageUrls.length === 0) {
        setVideoGenerationError("No images selected for video creation.");
        return;
      }
      
      setIsGeneratingVideo(true);
      setGeneratedVideoUrl(null);
      setVideoGenerationError(null);
      
      // Simulate API call delay
      await simulateLoading(3000);
      
      // Add a new "pending" job to the list
      const newJob: VideoJob = {
        id: `video-${Date.now()}`,
        status: "pending",
        createdAt: new Date(),
        user_id: MOCK_USER_ID // Use the mock user ID consistently
      };
      
      setVideoJobs(prev => [newJob, ...prev]);
      setIsGeneratingVideo(false);
      
      return;
    }
    
    if (!actualUserId) { 
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
        thumbnailUrl: generatedThumbnailUrl || undefined, // Include custom thumbnail if available
      };
      
      console.log(`Creating video with ${selectedImageUrls.length} images, audio, ${generatedSubtitlesUrl ? 'subtitles' : 'no subtitles'}, and ${generatedThumbnailUrl ? 'custom thumbnail' : 'default thumbnail'}.`);
      
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

  // Provide an option to toggle mock data (for development purposes)
  const toggleMockData = () => {
    // This function would only be useful in a real implementation
    // You could implement a state toggle here if needed
    console.log("Mock data toggle is not implemented");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="blob w-[600px] h-[600px] top-0 right-0 -z-10 opacity-5 fixed"></div>
      <div className="blob-cyan w-[500px] h-[500px] bottom-0 left-0 -z-10 opacity-5 fixed"></div>
      
      {/* Navbar at the top */}
      <Navbar 
        selectedUserId={selectedUserId} 
        onUserChange={handleUserChange} 
      />

      {/* Main content with sidebar and content area */}
      <div className="flex flex-1 relative">
        {/* Left Side Navigation */}
        <div className="w-20 md:w-64 h-[calc(100vh-64px)] sticky top-16 pt-4 pb-8 pl-2 pr-2 md:pr-4 flex flex-col space-y-4 z-20">
          <div className="h-full flex flex-col space-y-4 futuristic-scrollbar overflow-y-auto backdrop-blur-sm bg-opacity-10 bg-blue-900 border border-blue-500/20 rounded-2xl p-3 shadow-glow-blue">
            <button 
              onClick={() => setActiveTab("script")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-3 rounded-xl transition-all duration-300 ${activeTab === "script" ? "bg-blue-600/20 text-blue-300 shadow-glow-blue" : "hover:bg-blue-900/30"}`}
            >
              <FileText size={24} className={activeTab === "script" ? "text-blue-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "script" ? "glow-text" : "text-muted-foreground"}`}>Script</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("audio")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-3 rounded-xl transition-all duration-300 ${activeTab === "audio" ? "bg-cyan-600/20 text-cyan-300 shadow-glow-cyan" : "hover:bg-blue-900/30"}`}
            >
              <Volume2 size={24} className={activeTab === "audio" ? "text-cyan-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "audio" ? "glow-text-cyan" : "text-muted-foreground"}`}>Audio</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("image")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-3 rounded-xl transition-all duration-300 ${activeTab === "image" ? "bg-purple-600/20 text-purple-300 shadow-glow-purple" : "hover:bg-blue-900/30"}`}
            >
              <Image size={24} className={activeTab === "image" ? "text-purple-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "image" ? "glow-text-purple" : "text-muted-foreground"}`}>Image</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("video")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-3 rounded-xl transition-all duration-300 ${activeTab === "video" ? "bg-indigo-600/20 text-indigo-300 shadow-glow-blue" : "hover:bg-blue-900/30"}`}
            >
              <Film size={24} className={activeTab === "video" ? "text-indigo-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "video" ? "text-indigo-300 text-glow" : "text-muted-foreground"}`}>Video</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("gdrive")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-3 rounded-xl transition-all duration-300 ${activeTab === "gdrive" ? "bg-teal-600/20 text-teal-300 shadow-glow-cyan" : "hover:bg-blue-900/30"}`}
            >
              <Database size={24} className={activeTab === "gdrive" ? "text-teal-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "gdrive" ? "text-teal-300 text-glow" : "text-muted-foreground"}`}>Drive</span>
            </button>
            
            {/* Only show in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-auto pt-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">Development</div>
                <div className="flex items-center justify-center gap-2 px-2">
                  <span className="text-xs text-muted-foreground">Mock data:</span>
                  <div className={`w-8 h-4 rounded-full ${USE_MOCK_DATA ? 'bg-green-500' : 'bg-gray-700'} relative`}>
                    <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all ${USE_MOCK_DATA ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-6 px-4 md:px-6 relative z-10 animate-fadeIn">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 gradient-text flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                AI Content Generator
              </h1>
              <p className="text-muted-foreground">
                Create amazing content using AI. Generate scripts, audio, images, and videos with ease.
              </p>
            </div>
            
            <div className="w-full">
              {activeTab === "script" && (
                <div className="animate-fadeIn">
                  <ScriptGenerator 
                    onScriptSectionsChange={handleScriptSectionsUpdate} 
                    onFullScriptChange={handleFullScriptUpdate}
                    currentScriptSections={sharedScriptSections}
                    currentFullScript={sharedFullScriptMarkdown}
                  />
                </div>
              )}
              
              {activeTab === "audio" && (
                <div className="animate-fadeIn">
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
                </div>
              )}
              
              {activeTab === "image" && (
                <div className="animate-fadeIn">
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
                    onThumbnailGenerated={handleThumbnailGenerated}
                  />
                </div>
              )}
              
              {activeTab === "video" && (
                <div className="animate-fadeIn">
                  <VideoGenerator 
                    availableImageSets={generatedImageSetsList}
                    isGeneratingVideo={isGeneratingVideo}
                    generatedVideoUrl={generatedVideoUrl}
                    videoGenerationError={videoGenerationError}
                    onStartVideoCreation={handleStartVideoCreation}
                    thumbnailUrl={generatedThumbnailUrl}
                  />
                </div>
              )}
              
              {activeTab === "gdrive" && (
                <div className="animate-fadeIn">
                  <Card className="futuristic-card shadow-glow-cyan">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Cloud size={24} className="text-cyan-400" />
                        <CardTitle className="gradient-text">Google Drive</CardTitle>
                      </div>
                      <CardDescription>Select files or folders from your Google Drive.</CardDescription> 
                    </CardHeader>
                    <CardContent>
                      <GoogleDriveComponent />
                    </CardContent>
                  </Card>
                </div>
              )}

              <VideoStatus jobs={videoJobs} isLoading={isLoadingJobs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorsPage; 