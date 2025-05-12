"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Film, ImageOff, AlertCircle, Loader2, Video } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { GeneratedImageSet } from "@/types/image-generation";

interface VideoGeneratorProps {
  availableImageSets: GeneratedImageSet[];
  isGeneratingVideo: boolean;
  generatedVideoUrl: string | null;
  videoGenerationError: string | null;
  onStartVideoCreation: (selectedImageUrls: string[]) => Promise<void>;
}

const MAX_SELECTED_IMAGES = 20;

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  availableImageSets,
  isGeneratingVideo,
  generatedVideoUrl,
  videoGenerationError,
  onStartVideoCreation,
}) => {
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

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
    await onStartVideoCreation(selectedImageUrls);
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
            Select images from your generated collection to create a short video.
            The video will be 1 minute long, with each image displayed for an equal amount of time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div>
            <Label className="text-lg font-semibold">Select Images (up to {MAX_SELECTED_IMAGES})</Label>
            <p className="text-sm text-muted-foreground mb-4">
              You have selected {selectedImageUrls.length} / {MAX_SELECTED_IMAGES} images.
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
                      className="aspect-square object-cover w-full h-full"
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
            disabled={isGeneratingVideo || selectedImageUrls.length === 0 || selectedImageUrls.length > MAX_SELECTED_IMAGES}
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              "Confirm and Create Video"
            )}
                  </Button>
        </CardContent>
      </Card>

      {(isGeneratingVideo || generatedVideoUrl || videoGenerationError) && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video size={24}/> Generated Video
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isGeneratingVideo && (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <Loader2 size={48} className="mb-4 animate-spin" />
                        <p>Your video is being generated. This might take a moment...</p>
                    </div>
                )}
                {generatedVideoUrl && !isGeneratingVideo && (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <video controls src={generatedVideoUrl} className="w-full aspect-video bg-muted">
                    Your browser does not support the video tag.
                    </video>
                    <div className="p-4 bg-muted/30">
                      <a href={generatedVideoUrl} download target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">Download Video</Button>
                      </a>
                  </div>
                </div>
                )}
                {videoGenerationError && !isGeneratingVideo && (
                     <p className="text-center text-destructive">Video generation failed. Please see error above.</p>
                )}
                 {!isGeneratingVideo && !generatedVideoUrl && !videoGenerationError && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        <Film size={48} className="mb-4" />
                        <p>Your generated video will appear here once created.</p>
          </div>
        )}
            </CardContent>
         </Card>
      )}
    </div>
  );
};

export default VideoGenerator; 