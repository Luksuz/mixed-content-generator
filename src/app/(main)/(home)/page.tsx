"use client";

import { useState, useEffect } from "react";
import ScriptGenerator from "./components/script-generator";
import AudioGenerator from "./components/audio-generator";
import ImageGenerator from "./components/image-generator";
import VideoGenerator from "./components/video-generator";
import GoogleDriveComponent from "./components/google-drive-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Volume2, Image, Film, Database, Cloud, Sparkles, Lightbulb, Music2, Youtube, BrainCircuit, Recycle, FolderArchive } from "lucide-react";
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
  mockVideoUrl,
  simulateLoading
} from "@/lib/mock-data";

// Import new tab components
import IdeationTab from "./components/IdeationTab";
import MusicTab from "./components/MusicTab";
import YoutubeUploadTab from "./components/YoutubeUploadTab";
import ReinforcedLearningTab from "./components/ReinforcedLearningTab";
import ContentRepackagerTab from "./components/ContentRepackagerTab";
import VisualAssetVaultTab from "./components/VisualAssetVaultTab";

// Determine if we should use mock data
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

console.log('🔍 Mock Mode Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
  USE_MOCK_DATA: USE_MOCK_DATA
});

// Mock user ID to use instead of the actual user ID
const MOCK_USER_ID = "mock-user-123";

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");
  
  // User Selection State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { user, mappedUser } = useAuth();
  
  // Use mock user ID instead of actual ID
  const actualUserId = USE_MOCK_DATA ? MOCK_USER_ID : (user?.id || "");

  // Script Generator State - Don't set mock data immediately
  const [sharedScriptSections, setSharedScriptSections] = useState<ScriptSection[]>([]);
  const [sharedFullScriptMarkdown, setSharedFullScriptMarkdown] = useState<string>("");
  const [sharedFullScriptCleaned, setSharedFullScriptCleaned] = useState<string>("");

  // Audio Generator State - Don't set mock data immediately
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null);
  const [generatedSubtitlesUrl, setGeneratedSubtitlesUrl] = useState<string | null>(null);

  // Image Generator State - Don't set mock data immediately
  const [isGeneratingImages, setIsGeneratingImages] = useState<boolean>(false);
  const [generatedImageSetsList, setGeneratedImageSetsList] = useState<GeneratedImageSet[]>([]);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [currentImageGeneratingInfo, setCurrentImageGeneratingInfo] = useState<string | null>(null);
  // Thumbnail State - Don't set mock data immediately
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);

  // Video Generator State - New
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);

  // State for video job statuses - Don't set mock data immediately
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(!USE_MOCK_DATA);

  // Fetch existing jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!actualUserId) {
        return;
      }

      if (USE_MOCK_DATA) {
        // If using mock data, simulate a loading delay but don't set any jobs initially
        setIsLoadingJobs(true);
        await simulateLoading(1000);
        setIsLoadingJobs(false);
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
      await simulateLoading(20000); // 20 seconds as requested
      
      // Set the mock image data after simulation
      setGeneratedImageSetsList(mockGeneratedImageSets);
      console.log(`Successfully generated ${mockGeneratedImageSets.length} mock image sets`);
      
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
      
      // Add some additional mock images to the existing list
      const additionalMockImages = mockGeneratedImageSets.slice(0, Math.min(prompts.length, 3)); // Add a few more images
      setGeneratedImageSetsList(prev => [...additionalMockImages, ...prev]);
      console.log(`Successfully regenerated ${additionalMockImages.length} mock images`);
      
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
      
      // Simulate initial API call delay
      await simulateLoading(3000);
      
      // Add a new "pending" job to the list
      const newJobId = `video-${Date.now()}`;
      const newJob: VideoJob = {
        id: newJobId,
        status: "pending",
        createdAt: new Date(),
        user_id: MOCK_USER_ID // Use the mock user ID consistently
      };
      
      setVideoJobs(prev => [newJob, ...prev]);
      setIsGeneratingVideo(false);
      
      // After 10 seconds, update to processing
      setTimeout(() => {
        setVideoJobs(prev => prev.map(job => 
          job.id === newJobId 
            ? { ...job, status: "processing" as const, updatedAt: new Date() }
            : job
        ));
      }, 10000);
      
      // After 60 seconds total, update to completed with video URL
      setTimeout(() => {
        setVideoJobs(prev => prev.map(job => 
          job.id === newJobId 
            ? { 
                ...job, 
                status: "completed" as const, 
                videoUrl: mockVideoUrl,
                thumbnail_url: "/image_gen/generated_image_0_1.png",
                subtitles_url: mockSubtitlesUrl,
                updatedAt: new Date()
              }
            : job
        ));
        
        // Also set the generated video URL for the VideoGenerator component
        setGeneratedVideoUrl(mockVideoUrl);
        console.log(`Mock video completed: ${mockVideoUrl}`);
      }, 60000);
      
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
          <div className="h-full flex flex-col space-y-2 futuristic-scrollbar overflow-y-auto backdrop-blur-sm bg-opacity-20 bg-red-900 border border-red-700/30 rounded-2xl p-3 shadow-glow-red">
            <button 
              onClick={() => setActiveTab("ideation")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "ideation" ? "bg-red-700/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Lightbulb size={20} className={activeTab === "ideation" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "ideation" ? "glow-text-red" : "text-muted-foreground"}`}>Ideation</span>
            </button>
            <button 
              onClick={() => setActiveTab("script")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "script" ? "bg-red-700/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <FileText size={20} className={activeTab === "script" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "script" ? "glow-text-red" : "text-muted-foreground"}`}>Script</span>
            </button>
            <button 
              onClick={() => setActiveTab("audio")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "audio" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Volume2 size={20} className={activeTab === "audio" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "audio" ? "glow-text-red" : "text-muted-foreground"}`}>Audio</span>
            </button>
            <button 
              onClick={() => setActiveTab("image")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "image" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Image size={20} className={activeTab === "image" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "image" ? "glow-text-red" : "text-muted-foreground"}`}>Image</span>
            </button>
             <button 
              onClick={() => setActiveTab("music")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "music" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Music2 size={20} className={activeTab === "music" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "music" ? "glow-text-red" : "text-muted-foreground"}`}>Music</span>
            </button>
            <button 
              onClick={() => setActiveTab("video")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "video" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Film size={20} className={activeTab === "video" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "video" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>Videos</span>
            </button>
            <button 
              onClick={() => setActiveTab("youtube_upload")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "youtube_upload" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Youtube size={20} className={activeTab === "youtube_upload" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "youtube_upload" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>YouTube Upload</span>
            </button>
            <button 
              onClick={() => setActiveTab("reinforced_learning")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "reinforced_learning" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <BrainCircuit size={20} className={activeTab === "reinforced_learning" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "reinforced_learning" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>Reinforced Learning</span>
            </button>
            <button 
              onClick={() => setActiveTab("content_repackager")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "content_repackager" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Recycle size={20} className={activeTab === "content_repackager" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "content_repackager" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>Content Repackager</span>
            </button>
            <button 
              onClick={() => setActiveTab("visual_asset_vault")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "visual_asset_vault" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <FolderArchive size={20} className={activeTab === "visual_asset_vault" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "visual_asset_vault" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>Visual Asset Vault</span>
            </button>
            <button 
              onClick={() => setActiveTab("gdrive")}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === "gdrive" ? "bg-red-600/30 text-red-300 shadow-glow-red" : "hover:bg-red-900/40"}`}
            >
              <Database size={20} className={activeTab === "gdrive" ? "text-red-400" : "text-muted-foreground"} />
              <span className={`text-xs md:text-sm font-medium ${activeTab === "gdrive" ? "text-red-300 glow-text-red" : "text-muted-foreground"}`}>Text-to-video [beta]</span>
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
                <Sparkles className="h-6 w-6 text-red-400" />
                Welcome to AI YouTube video content generator
              </h1>
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
                    onImageSetsGenerated={setGeneratedImageSetsList}
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
                  <Card className="futuristic-card shadow-glow-red">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <Cloud size={24} className="text-red-400" />
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

              {activeTab === "ideation" && (
                <div className="animate-fadeIn">
                  <IdeationTab />
                </div>
              )}
              {activeTab === "music" && (
                <div className="animate-fadeIn">
                  <MusicTab />
                </div>
              )}
              {activeTab === "youtube_upload" && (
                <div className="animate-fadeIn">
                  <YoutubeUploadTab />
                </div>
              )}
              {activeTab === "reinforced_learning" && (
                <div className="animate-fadeIn">
                  <ReinforcedLearningTab />
                </div>
              )}
              {activeTab === "content_repackager" && (
                <div className="animate-fadeIn">
                  <ContentRepackagerTab />
                </div>
              )}
              {activeTab === "visual_asset_vault" && (
                <div className="animate-fadeIn">
                  <VisualAssetVaultTab />
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