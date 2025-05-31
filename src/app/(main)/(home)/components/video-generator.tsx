"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Film, ImageOff, AlertCircle, Loader2, Video, ArrowDown, CheckCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { GeneratedImageSet } from "@/types/image-generation";

interface VideoGeneratorProps {
  availableImageSets: GeneratedImageSet[];
  isSubmittingVideo: boolean;
  videoSubmissionSuccess: boolean;
  videoGenerationError: string | null;
  onStartVideoCreation: (selectedImageUrls: string[], quality: 'low' | 'high', enableOverlay?: boolean, enableZoom?: boolean, enableSubtitles?: boolean) => Promise<void>;
  thumbnailUrl?: string | null;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  availableImageSets,
  isSubmittingVideo,
  videoSubmissionSuccess,
  videoGenerationError,
  onStartVideoCreation,
  thumbnailUrl,
}) => {
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [videoQuality, setVideoQuality] = useState<'low' | 'high'>('low');
  const [enableOverlay, setEnableOverlay] = useState<boolean>(true);
  const [enableZoom, setEnableZoom] = useState<boolean>(true);
  const [enableSubtitles, setEnableSubtitles] = useState<boolean>(true);

  const allImageUrls = useMemo(() => {
    return availableImageSets.flatMap(set => set.imageUrls || []);
  }, [availableImageSets]);

  const handleImageSelection = (imageUrl: string) => {
    setLocalError(null);
    setSelectedImageUrls(prevSelected => {
      if (prevSelected.includes(imageUrl)) {
        return prevSelected.filter(url => url !== imageUrl);
      } else {
        return [...prevSelected, imageUrl];
      }
    });
  };

  const handleConfirmAndCreateVideo = async () => {
    if (selectedImageUrls.length === 0) {
      setLocalError("Please select at least one image to create a video.");
      return;
    }
    setLocalError(null);
    
    try {
      await onStartVideoCreation(selectedImageUrls, videoQuality, enableOverlay, enableZoom, enableSubtitles);
    } catch (error) {
      // Parent component handles error state
    }
  };

  useEffect(() => {
    setSelectedImageUrls(prevSelected => prevSelected.filter(url => allImageUrls.includes(url)));
  }, [allImageUrls]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film size={24} /> Video Generator from Images
          </CardTitle>
          <CardDescription>
            Select images from your generated collection to create a video. The first minute will show your images
            in sequence, and the rest will feature the last image with zoom effects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {thumbnailUrl && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-semibold">Custom Video Thumbnail</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  This custom thumbnail will be used for your video.
                </p>
              </div>
              <div className="border rounded-md p-2 flex justify-center">
                <div className="relative w-1/2 aspect-video">
                  <img 
                    src={thumbnailUrl} 
                    alt="Custom Video Thumbnail"
                    className="object-cover w-full h-full rounded-md"
                  />
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    Thumbnail Ready
                  </div>
                </div>
              </div>
            </div>
          )}

          {localError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Selection Error</AlertTitle>
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          {videoGenerationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Video Generation Error</AlertTitle>
              <AlertDescription>{videoGenerationError}</AlertDescription>
            </Alert>
          )}

          {videoSubmissionSuccess && (
            <Alert variant="default" className="bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Video Submitted Successfully!</AlertTitle>
              <AlertDescription className="flex flex-col space-y-1">
                <p>Your video creation request has been submitted and is being processed.</p>
                <p className="flex items-center text-sm">
                  <ArrowDown className="h-3 w-3 mr-1" /> Check the <span className="font-semibold mx-1">Video Status</span> section below for updates.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Video Quality</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose the quality for your video. High quality takes longer to process but provides better resolution.
              </p>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value="low"
                    checked={videoQuality === 'low'}
                    onChange={(e) => setVideoQuality(e.target.value as 'low' | 'high')}
                    className="text-primary"
                  />
                  <span className="text-sm">Low Quality (Faster)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value="high"
                    checked={videoQuality === 'high'}
                    onChange={(e) => setVideoQuality(e.target.value as 'low' | 'high')}
                    className="text-primary"
                  />
                  <span className="text-sm">High Quality (Slower)</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold">Video Effects</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Configure visual effects for your video.
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableOverlay}
                    onChange={(e) => setEnableOverlay(e.target.checked)}
                    className="text-primary"
                  />
                  <span className="text-sm">Enable Dust Overlay</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableZoom}
                    onChange={(e) => setEnableZoom(e.target.checked)}
                    className="text-primary"
                  />
                  <span className="text-sm">Enable Zoom Effects</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-lg font-semibold">Subtitles</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose whether to include subtitles in your video.
              </p>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subtitles"
                    value="enabled"
                    checked={enableSubtitles === true}
                    onChange={() => setEnableSubtitles(true)}
                    className="text-primary"
                  />
                  <span className="text-sm">With Subtitles</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subtitles"
                    value="disabled"
                    checked={enableSubtitles === false}
                    onChange={() => setEnableSubtitles(false)}
                    className="text-primary"
                  />
                  <span className="text-sm">No Subtitles</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Select Images</Label>
            <p className="text-sm text-muted-foreground mb-4">
              You have selected {selectedImageUrls.length} {selectedImageUrls.length === 1 ? 'image' : 'images'}.
              {allImageUrls.length > 0 && (
                <span className="ml-2">
                  {selectedImageUrls.length < allImageUrls.length && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedImageUrls([...allImageUrls])}
                      className="mr-2"
                    >
                      Select All
                    </Button>
                  )}
                  {selectedImageUrls.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedImageUrls([])}
                    >
                      Unselect All
                    </Button>
                  )}
                </span>
              )}
            </p>
            {allImageUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <ImageOff size={48} className="mb-4" />
                <p className="text-center">No images available to select.</p>
                <p className="text-center text-sm">Please generate some images in the Image tab first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto p-2 border rounded-md">
                {allImageUrls.map((imageUrl, index) => (
                  <div
                    key={index}
                    onClick={() => handleImageSelection(imageUrl)}
                    className={`relative border-2 rounded-md overflow-hidden cursor-pointer transition-all duration-150 ease-in-out
                                ${selectedImageUrls.includes(imageUrl) ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-muted-foreground/50'}`}
                  >
                    <img
                      src={imageUrl}
                      alt={`Generated image ${index + 1}`}
                      className="aspect-video object-cover w-full h-full"
                    />
                    {selectedImageUrls.includes(imageUrl) && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleConfirmAndCreateVideo}
            disabled={isSubmittingVideo || selectedImageUrls.length === 0}
          >
            {isSubmittingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Video Request...
              </>
            ) : videoSubmissionSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Video Submitted Successfully!
              </>
            ) : (
              "Confirm and Create Video"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGenerator; 