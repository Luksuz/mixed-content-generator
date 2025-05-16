"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { ImageProvider, GeneratedImageSet } from '@/types/image-generation';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Updated props for the controlled component
interface ImageGeneratorProps {
  scriptPrompts?: string[]; 
  numberOfImagesPerPrompt?: number; 
  
  isLoadingImages: boolean;
  imageSets: GeneratedImageSet[];
  generationError: string | null;
  generatingInfo: string | null;
  onStartGenerationRequest: (provider: ImageProvider, numImagesPerPrompt: number, manualSinglePrompt?: string) => Promise<void>;
  onRegenerateImages?: (provider: ImageProvider, prompts: string[]) => Promise<void>;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  scriptPrompts,
  numberOfImagesPerPrompt = 1, // Default if not specified by parent
  isLoadingImages,
  imageSets,
  generationError,
  generatingInfo,
  onStartGenerationRequest,
  onRegenerateImages
}) => {
  const [manualPrompt, setManualPrompt] = useState(""); // Was 'prompt'
  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>("openai"); // Was 'style'
  
  // New state for tracking selected images for regeneration
  const [selectedImages, setSelectedImages] = useState<{ setIndex: number; imageIndex: number; prompt: string }[]>([]);

  const handleGenerateClick = () => {
    // Determine if we use script prompts or the manual one
    const useScriptPrompts = scriptPrompts && scriptPrompts.length > 0;
    
    if (useScriptPrompts) {
      onStartGenerationRequest(selectedProvider, numberOfImagesPerPrompt); // Parent uses its own scriptPrompts
    } else if (manualPrompt.trim() !== "") {
      onStartGenerationRequest(selectedProvider, numberOfImagesPerPrompt, manualPrompt.trim());
    } else {
      // Optionally, set a local error if no prompt is available
      console.error("No prompt provided for image generation.");
    }
  };
  
  const downloadImage = (url: string, filename: string) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch(err => {
        console.error("Failed to download image:", err);
        // Potentially set a local error state for download issues
      });
  };

  // New function to handle image selection for regeneration
  const toggleImageSelection = (setIndex: number, imageIndex: number, prompt: string) => {
    setSelectedImages(prev => {
      // Check if this image is already selected
      const existingIndex = prev.findIndex(
        item => item.setIndex === setIndex && item.imageIndex === imageIndex
      );
      
      if (existingIndex >= 0) {
        // Image is already selected, so remove it
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Image is not selected, check if we're at the limit
        if (prev.length >= 5) {
          alert("Maximum 5 images can be selected for regeneration at once");
          return prev;
        }
        // Add to selection
        return [...prev, { setIndex, imageIndex, prompt }];
      }
    });
  };

  // New function to handle image regeneration
  const handleRegenerateClick = async () => {
    if (!onRegenerateImages || selectedImages.length === 0) return;
    
    // Extract prompts from selected images
    const prompts = selectedImages.map(item => item.prompt);
    
    // Call the parent's regenerate function
    await onRegenerateImages(selectedProvider, prompts);
    
    // Clear selection after regeneration
    setSelectedImages([]);
  };

  const promptsAvailable = (scriptPrompts && scriptPrompts.length > 0) || manualPrompt.trim() !== '';
  const displayPromptCount = scriptPrompts && scriptPrompts.length > 0 ? scriptPrompts.length : (manualPrompt.trim() !== '' ? 1 : 0);


  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">AI Image Generator</h2>
          <p className="text-muted-foreground">
            {scriptPrompts && scriptPrompts.length > 0 
              ? `Using ${scriptPrompts.length} prompts from script. Or, describe a single image below.`
              : "Describe the image you want to see, or generate a script first."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          {/* Show manual prompt input if no script prompts or always show as an option */}
          {/* For now, only show if scriptPrompts are not primary */}
          {!(scriptPrompts && scriptPrompts.length > 0) && (
          <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual-prompt">Image Description</Label>
            <Input
                id="manual-prompt"
              placeholder="Describe the image you want to generate..."
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                disabled={isLoadingImages}
            />
          </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="provider-select">Provider</Label>
            <select
              id="provider-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
              disabled={isLoadingImages}
            >
              <option value="openai">OpenAI (DALL-E 3)</option>
              <option value="minimax">Minimax</option>
            </select>
          </div>

          {/* Minimax Aspect Ratio - example, can be expanded */}
          {selectedProvider === 'minimax' && (
            <div className="space-y-2">
                <Label htmlFor="minimax-aspect-ratio">Aspect Ratio (Minimax)</Label>
                <select 
                  id="minimax-aspect-ratio"
                  // value={minimaxAspectRatioState} // Needs state if configurable
                  // onChange={(e) => setMinimaxAspectRatioState(e.target.value as any)}
                  disabled={isLoadingImages}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="16:9"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                </select>
            </div>
           )}

          <div className={`md:col-span-2 ${!(scriptPrompts && scriptPrompts.length > 0) ? 'md:col-span-1' : 'md:col-span-2'} flex items-end`}>
            <Button 
              className="w-full flex items-center justify-center gap-2" 
              onClick={handleGenerateClick}
              disabled={isLoadingImages || !promptsAvailable}
            >
              {isLoadingImages ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{generatingInfo || "Generating..."}</span>
                </>
              ) : `Generate Image${displayPromptCount > 1 ? 's' : ''} (${displayPromptCount} prompt${displayPromptCount > 1 ? 's' : ''})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Regeneration Controls - new section that only appears when images are selected */}
      {selectedImages.length > 0 && (
        <div className="p-4 border rounded-lg bg-card shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <Badge variant="secondary" className="px-2 py-1 text-sm">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              Select up to 5 images to regenerate with the same prompts
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedImages([])}
              disabled={isLoadingImages}
            >
              Clear Selection
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleRegenerateClick}
              disabled={isLoadingImages || selectedImages.length === 0}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {generationError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-700">
          <p className="font-semibold">Error:</p>
          <pre className="whitespace-pre-wrap text-sm">{generationError}</pre>
        </div>
      )}

      {/* Generated Images */}
      <div className="space-y-6">
         {/* Loading state or initial placeholder */}
        {(isLoadingImages && imageSets.length === 0) || (!isLoadingImages && imageSets.length === 0 && promptsAvailable && !generationError) ? (
          <div className="h-[300px] flex flex-col items-center justify-center border rounded-lg bg-muted/50 text-center p-4">
            {isLoadingImages ? (
              <>
                <ImageIcon size={48} className="text-primary opacity-75 animate-spin mb-4" />
                <p className="text-muted-foreground">{generatingInfo || "Generating your images..."}</p>
              </>
            ) : (
              <>
                <ImageIcon size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {promptsAvailable ? "Click \"Generate Images\" to start." : "Your generated images will appear here."}
                </p>
              </>
            )}
          </div>
        ) : null}
        
        {/* Display actual generated images */}
        {imageSets.map((set, setIndex) => (
          <div key={setIndex} className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Prompt:</h3>
            <p className="text-sm text-muted-foreground mb-3 italic truncate">"{set.originalPrompt}"</p>
            {(set.imageUrls.length === 0 && set.imageData.length === 0) && !isLoadingImages && (
                <p className="text-sm text-red-500">No images were generated for this prompt. Check errors or server logs.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {set.imageUrls.map((url, imageIndex) => {
                // Check if this image is selected for regeneration
                const isSelected = selectedImages.some(
                  item => item.setIndex === setIndex && item.imageIndex === imageIndex
                );
                
                return (
                  <div key={`url-${imageIndex}`} className={`relative group border rounded-lg overflow-hidden shadow aspect-video ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <img 
                      src={url} 
                      alt={`Generated for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <div className="flex flex-col gap-2 items-center">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => downloadImage(url, `generated_image_${setIndex}_${imageIndex}.png`)}>
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                          >
                            <RefreshCw size={16} className="mr-2" />
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                        
                        {isSelected && (
                          <Badge variant="outline" className="bg-primary/20">
                            Selected for regeneration
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {set.imageData.map((b64, imageIndex) => {
                // Check if this image is selected for regeneration
                const isSelected = selectedImages.some(
                  item => item.setIndex === setIndex && item.imageIndex === imageIndex + set.imageUrls.length
                );
                
                return (
                  <div key={`b64-${imageIndex}`} className={`relative group border rounded-lg overflow-hidden shadow aspect-video ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                    <img 
                      src={`data:image/png;base64,${b64}`}
                      alt={`Generated (base64) for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <div className="flex flex-col gap-2 items-center">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => downloadImage(`data:image/png;base64,${b64}`, `generated_image_b64_${setIndex}_${imageIndex}.png`)}>
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex + set.imageUrls.length, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                          >
                            <RefreshCw size={16} className="mr-2" />
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                        
                        {isSelected && (
                          <Badge variant="outline" className="bg-primary/20">
                            Selected for regeneration
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGenerator; 