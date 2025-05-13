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

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");
  
  // User Selection State
  const [selectedUserId, setSelectedUserId] = useState<string>(
    predefinedUsers.length > 0 ? predefinedUsers[0].id : '' // Default to first user
  );

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    console.log("GeneratorsPage - Selected User ID:", userId);
    // Potentially refetch user-specific data here if needed
  };

  // Script Generator State
  const [sharedScriptSections, setSharedScriptSections] = useState<ScriptSection[]>([]);
  const [sharedFullScript, setSharedFullScript] = useState<string>("");

  // Audio Generator State - Lifted
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null);

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
      if (!selectedUserId) return; // Don't fetch if no user selected

      setIsLoadingJobs(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('video_records')
        .select('*')
        .eq('user_id', selectedUserId) // Filter by selected user
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
        console.log(fetchedJobs);
        setVideoGenerationError(null); // Clear previous errors
      }
      setIsLoadingJobs(false);
    };

    fetchJobs();
  }, [selectedUserId]); // Re-run when selectedUserId changes

  const handleScriptSectionsUpdate = (sections: ScriptSection[]) => {
    setSharedScriptSections(sections);
  };

  const handleFullScriptUpdate = (script: string) => {
    setSharedFullScript(script);
  };

  // Handler to update the lifted audio state
  const handleAudioGenerated = (url: string | null) => {
    setGeneratedAudioUrl(url);
  };

  // Use image_generation_prompt from script sections
  const imagePrompts = sharedScriptSections.map(section => section.image_generation_prompt);
  const defaultNumberOfImagesPerSectionPrompt = 1;

  // Moved image generation logic to GeneratorsPage
  const handleStartImageGeneration = async (provider: ImageProvider, numberOfImagesPerPrompt: number, manualSinglePrompt?: string) => {
    // Determine which prompts to use
    const promptsForGeneration = (imagePrompts && imagePrompts.length > 0)
      ? imagePrompts
      : (manualSinglePrompt ? [manualSinglePrompt] : []);

    if (promptsForGeneration.length === 0) {
      setImageGenerationError('No prompts available to generate images. Please use the script generator or enter a description.');
      return;
    }

    setIsGeneratingImages(true);
    setImageGenerationError(null);
    setGeneratedImageSetsList([]); 
    const resultsForAllPrompts: GeneratedImageSet[] = [];

    for (let i = 0; i < promptsForGeneration.length; i++) {
      const currentPrompt = promptsForGeneration[i];
      if (!currentPrompt || currentPrompt.trim() === '') {
        console.warn(`Skipping empty prompt at index ${i} in GeneratorsPage`);
        resultsForAllPrompts.push({ originalPrompt: currentPrompt || "Empty Prompt", imageUrls: [], imageData: [] });
        continue;
      }
      setCurrentImageGeneratingInfo(`Generating for prompt ${i + 1} of ${promptsForGeneration.length}: "${currentPrompt.substring(0, 30)}..."`);
      
      try {
        const requestBody: GenerateImageRequestBody = {
          provider: provider,
          prompt: currentPrompt,
          numberOfImages: numberOfImagesPerPrompt,
          outputFormat: 'url',
        };

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = (await response.json()) as GenerateImageResponse;

        if (!response.ok || data.error) {
          const errorMsg = data.error || `Failed for: ${currentPrompt.substring(0, 30)}...`;
          setImageGenerationError(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
          resultsForAllPrompts.push({ originalPrompt: currentPrompt, imageUrls: [], imageData: [] });
        } else {
          resultsForAllPrompts.push({
            originalPrompt: currentPrompt,
            imageUrls: data.imageUrls || [],
            imageData: data.imageData || [],
          });
        }
      } catch (err: any) {
        const errorMsg = err.message || `Network error for: ${currentPrompt.substring(0, 30)}...`;
        setImageGenerationError(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
        resultsForAllPrompts.push({ originalPrompt: currentPrompt, imageUrls: [], imageData: [] });
      }
    }
    setGeneratedImageSetsList(resultsForAllPrompts);
    setIsGeneratingImages(false);
    setCurrentImageGeneratingInfo(null);
  };

  const handleStartVideoCreation = async (selectedImageUrls: string[]) => {
    if (!selectedUserId) { // Check if a user is selected
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
        audioUrl: generatedAudioUrl ?? undefined, 
        userId: selectedUserId, // Use the state variable
      };
      
      const response = await fetch('/api/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), 
      });

      const data: CreateVideoResponse = await response.json();

      if (!response.ok || data.error) {
        setVideoGenerationError(data.details || data.error || "Failed to start video creation job. Please check server logs.");
      } else if (data.video_id) {
        // Fetch jobs effect will update the list
        setGeneratedVideoUrl(null);
        setVideoGenerationError(null);
        // Optionally add the pending job immediately for faster UI update
        const newJob: VideoJob = {
            id: data.video_id,
            status: 'pending',
            createdAt: new Date(),
            videoUrl: null,
            errorMessage: null,
            user_id: selectedUserId, // Ensure user_id is included if needed by VideoJob type
        };
        setVideoJobs(prevJobs => [newJob, ...prevJobs]);
      } else {
          setVideoGenerationError("Video creation started but failed to get job ID.");
      }
    } catch (err: any) { 
      setVideoGenerationError(err.message || "An unexpected error occurred during video creation initiation.");
    } finally {
      setIsGeneratingVideo(false);
    }
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
              currentFullScript={sharedFullScript}
            />
          </TabsContent>
          
          <TabsContent value="audio" className="mt-0">
            <AudioGenerator 
              initialText={sharedFullScript} 
              generatedAudioUrl={generatedAudioUrl}
              isGeneratingAudio={isGeneratingAudio}
              audioGenerationError={audioGenerationError}
              onAudioGenerated={handleAudioGenerated}
              setIsGeneratingAudio={setIsGeneratingAudio}
              setAudioGenerationError={setAudioGenerationError}
            />
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <ImageGenerator 
              scriptPrompts={imagePrompts}
              numberOfImagesPerPrompt={defaultNumberOfImagesPerSectionPrompt}
              isLoadingImages={isGeneratingImages}
              imageSets={generatedImageSetsList}
              generationError={imageGenerationError}
              generatingInfo={currentImageGeneratingInfo}
              onStartGenerationRequest={handleStartImageGeneration}
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