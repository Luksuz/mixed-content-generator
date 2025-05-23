"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Film, ImageOff, AlertCircle, Loader2, Video, ArrowDown, CheckCircle, Plus, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { GeneratedImageSet } from "@/types/image-generation";
import { motion } from "framer-motion";

interface VideoGeneratorProps {
  availableImageSets: GeneratedImageSet[];
  isGeneratingVideo: boolean;
  generatedVideoUrl: string | null;
  videoGenerationError: string | null;
  onStartVideoCreation: (selectedImageUrls: string[]) => Promise<void>;
  onVideoGenerated?: (videoUrl: string | null) => void;
  thumbnailUrl?: string | null;
}

const MAX_SELECTED_IMAGES = 50;

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  availableImageSets,
  isGeneratingVideo,
  generatedVideoUrl,
  videoGenerationError,
  onStartVideoCreation,
  onVideoGenerated,
  thumbnailUrl,
}) => {
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const allImageUrls = useMemo(() => {
    return availableImageSets.flatMap(set => set.imageUrls || []);
  }, [availableImageSets]);

  const handleImageSelection = (imageUrl: string) => {
    setLocalError(null);
    setSelectedImageUrls(prevSelected => {
      if (prevSelected.includes(imageUrl)) {
        return prevSelected.filter(url => url !== imageUrl);
      } else {
        if (prevSelected.length < MAX_SELECTED_IMAGES) {
          return [...prevSelected, imageUrl];
        } else {
          setLocalError(`You can select a maximum of ${MAX_SELECTED_IMAGES} images.`);
          return prevSelected;
        }
      }
    });
  };

  const handleConfirmAndCreateVideo = async () => {
    if (selectedImageUrls.length === 0) {
      setLocalError("Please select at least one image to create a video.");
      return;
    }
    setLocalError(null);
    setShowSuccessMessage(false);

    // Always call the parent's video creation function
    await onStartVideoCreation(selectedImageUrls);
    setShowSuccessMessage(true);
  };

  useEffect(() => {
    setSelectedImageUrls(prevSelected => prevSelected.filter(url => allImageUrls.includes(url)));
  }, [allImageUrls]);

  // Debug: Track when video URL changes
  useEffect(() => {
    console.log('🎬 VideoGenerator: generatedVideoUrl changed:', generatedVideoUrl);
  }, [generatedVideoUrl]);

  // Hide success message after 10 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  return (
    <div className="space-y-8">
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl text-white relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-700/20 via-red-800/10 to-red-900/20 opacity-30" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-700 rounded-full filter blur-3xl opacity-10" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-800 rounded-full filter blur-3xl opacity-10" />
        </div>
        
        <div className="relative z-10"> {/* Content wrapper */}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-600">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <Film size={28} className="text-red-400" />
              </motion.div>
              <span>Neurovision™ Studio</span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              Craft cinematic masterpieces with AI-powered video synthesis. Select your imagery for our advanced rendering pipeline.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            {thumbnailUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400">
                      Custom Thumbnail Ready
                    </span>
                  </Label>
                  <p className="text-sm text-slate-300 ml-7">
                    Enhanced video preview image prepared for optimal engagement.
                  </p>
                </div>
                <div className="border border-white/10 rounded-md p-3 flex justify-center bg-black/20">
                  <div className="relative w-1/2 aspect-video">
                    <img 
                      src={thumbnailUrl} 
                      alt="Custom Video Thumbnail"
                      className="object-cover w-full h-full rounded-md shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    />
                    <div className="absolute inset-0 border border-red-500/50 rounded-md"></div>
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                      ✓ OPTIMIZED
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {isGeneratingVideo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 backdrop-blur-md bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-4"
              >
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-400">
                      Video Generation in Progress
                    </span>
                  </Label>
                  <p className="text-sm text-slate-300 ml-7">
                    Neural rendering pipeline processing your visual assets...
                  </p>
                </div>
                <div className="border border-blue-700/30 rounded-md p-4 bg-black/20 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-blue-600 animate-spin" style={{ animationDuration: '3s' }}></div>
                    </div>
                    <p className="text-blue-200 text-sm">
                      Estimated completion: ~20 seconds
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {generatedVideoUrl !== null && generatedVideoUrl !== "" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 backdrop-blur-md bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-lg p-4 shadow-glow-green"
              >
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-200 to-emerald-400">
                      Video Generation Complete
                    </span>
                  </Label>
                  <p className="text-sm text-slate-300 ml-7">
                    Your neural video synthesis has been successfully rendered.
                  </p>
                </div>
                <div className="border border-green-700/30 rounded-md p-3 bg-black/20">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    className="w-full rounded-md shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    poster={thumbnailUrl || "/image_gen/generated_image_0_1.png"}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="mt-3 p-2 bg-black/40 rounded text-xs text-green-200 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">Video URL:</span>
                      <span className="break-all">{generatedVideoUrl}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedVideoUrl;
                      link.download = 'generated-video.mp4';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-green-900/30 hover:bg-green-800/40 border-green-700/30 text-green-200"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedVideoUrl)}
                    className="bg-green-900/30 hover:bg-green-800/40 border-green-700/30 text-green-200"
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generatedVideoUrl, '_blank')}
                    className="bg-green-900/30 hover:bg-green-800/40 border-green-700/30 text-green-200"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </motion.div>
            )}

            {localError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="bg-red-900/40 border border-red-700 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Selection Error</AlertTitle>
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {videoGenerationError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="bg-red-900/40 border border-red-700 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Video Generation Error</AlertTitle>
                  <AlertDescription>{videoGenerationError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {showSuccessMessage && !isGeneratingVideo && !videoGenerationError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <Alert variant="default" className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 text-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertTitle>Synthesis Initiated</AlertTitle>
                  <AlertDescription className="flex flex-col space-y-1">
                    <p>Your visual composite is being rendered through our neural pipeline.</p>
                    <p className="flex items-center text-sm">
                      <ArrowDown className="h-3 w-3 mr-1" /> Monitor <span className="font-semibold mx-1">Runtime Status</span> below for processing telemetry.
                    </p>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-400">
                  Visual Assets {selectedImageUrls.length > 0 && `(${selectedImageUrls.length}/${MAX_SELECTED_IMAGES})`}
                </Label>
                <div className="text-xs bg-white/10 rounded-full px-3 py-1 font-medium text-red-200">
                  {selectedImageUrls.length} / {MAX_SELECTED_IMAGES} selected
                </div>
              </div>
              
              {allImageUrls.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center p-8 border border-dashed border-white/20 rounded-lg text-slate-400"
                >
                  <ImageOff size={48} className="mb-4 opacity-50" />
                  <p className="text-center font-medium text-slate-300">No visual assets detected in memory.</p>
                  <p className="text-center text-sm mt-1">Initialize image generation in the preceding module.</p>
                </motion.div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10 rounded-md"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-700 scrollbar-track-slate-800 p-2 rounded-md bg-black/30">
                    {allImageUrls.map((imageUrl, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        onClick={() => handleImageSelection(imageUrl)}
                        className={`group relative border rounded-md overflow-hidden cursor-pointer transition-all duration-200 
                                  ${selectedImageUrls.includes(imageUrl) 
                                    ? 'border-red-500 ring-1 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                                    : 'border-white/10 hover:border-red-500/50'}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="aspect-video object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                        />
                        {selectedImageUrls.includes(imageUrl) ? (
                          <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-20 shadow-[0_0_5px_rgba(239,68,68,0.7)]">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 bg-black/40 text-white/70 rounded-full p-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          Asset #{index + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                className="w-full rounded-md py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] relative overflow-hidden border-0 transition-all duration-300"
                onClick={handleConfirmAndCreateVideo}
                disabled={isGeneratingVideo || selectedImageUrls.length === 0 || selectedImageUrls.length > MAX_SELECTED_IMAGES}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                <div className="flex items-center justify-center gap-2">
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="mr-1 h-5 w-5 animate-spin" />
                      <span className="text-lg font-medium">Synthesizing Video...</span>
                    </>
                  ) : (
                    <>
                      <Film className="mr-1 h-5 w-5" />
                      <span className="text-lg font-medium">Initialize Video Synthesis</span>
                    </>
                  )}
                </div>
              </Button>
            </motion.div>

            <div className="pt-2 text-center text-xs text-slate-400">
              Neurovision™ AI Processing v2.4 • Hybrid Rendering Pipeline
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default VideoGenerator; 