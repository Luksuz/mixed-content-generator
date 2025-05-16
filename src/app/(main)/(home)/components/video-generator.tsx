"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Film, ImageOff, AlertCircle, Loader2, Video, ArrowDown, CheckCircle } from "lucide-react";
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
    await onStartVideoCreation(selectedImageUrls);
    setShowSuccessMessage(true);
  };

  useEffect(() => {
    setSelectedImageUrls(prevSelected => prevSelected.filter(url => allImageUrls.includes(url)));
  }, [allImageUrls]);

  // Hide success message after 10 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

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

          {showSuccessMessage && !isGeneratingVideo && !videoGenerationError && (
            <Alert variant="default" className="bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Video Creation Started</AlertTitle>
              <AlertDescription className="flex flex-col space-y-1">
                <p>Your video is being created. This may take a few minutes.</p>
                <p className="flex items-center text-sm">
                  <ArrowDown className="h-3 w-3 mr-1" /> Check the <span className="font-semibold mx-1">Video Status</span> section below for updates.
                </p>
              </AlertDescription>
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
                Creating Video...
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