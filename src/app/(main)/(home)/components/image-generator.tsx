"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Download, RefreshCw, Plus, Check, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ImageProvider, GeneratedImageSet } from '@/types/image-generation';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScriptSection } from "@/types";
import { Slider } from "@/components/ui/slider";

// Updated props for the controlled component
interface ImageGeneratorProps {
  scriptPrompts?: string[]; 
  scriptSections?: ScriptSection[];
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
  scriptSections = [],
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
  
  // New state for image options
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [newCustomPrompt, setNewCustomPrompt] = useState("");
  const [numImagesPerPrompt, setNumImagesPerPrompt] = useState(numberOfImagesPerPrompt);
  
  // Update the default number of images when the prop changes
  useEffect(() => {
    setNumImagesPerPrompt(numberOfImagesPerPrompt);
  }, [numberOfImagesPerPrompt]);
  
  // Get selected prompts
  const getSelectedPrompts = () => {
    const sectionPrompts = selectedSections
      .map(index => scriptSections[index]?.image_generation_prompt)
      .filter(Boolean) as string[];
    
    return [...sectionPrompts, ...customPrompts];
  }

  const handleGenerateClick = () => {
    // Get all selected prompts (from sections and custom)
    const selectedPrompts = getSelectedPrompts();
    
    // If we have selected prompts, use those
    if (selectedPrompts.length > 0) {
      onStartGenerationRequest(selectedProvider, numImagesPerPrompt, selectedPrompts.join('|||||'));
    } 
    // Otherwise, use the manual prompt if available
    else if (manualPrompt.trim() !== "") {
      onStartGenerationRequest(selectedProvider, numImagesPerPrompt, manualPrompt.trim());
    } 
    // No prompts available
    else {
      console.error("No prompt provided for image generation.");
    }
  };
  
  const toggleSectionSelection = (index: number) => {
    setSelectedSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }
  
  const addCustomPrompt = () => {
    if (!newCustomPrompt.trim()) return;
    setCustomPrompts(prev => [...prev, newCustomPrompt.trim()]);
    setNewCustomPrompt("");
  }
  
  const removeCustomPrompt = (index: number) => {
    setCustomPrompts(prev => prev.filter((_, i) => i !== index));
  }
  
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

  // Determine if we have prompts available
  const promptsAvailable = selectedSections.length > 0 || customPrompts.length > 0 || manualPrompt.trim() !== '';
  
  // Count of prompts to be used
  const selectedPromptCount = selectedSections.length + customPrompts.length;
  const displayPromptCount = selectedPromptCount > 0 ? selectedPromptCount : (manualPrompt.trim() !== '' ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">AI Image Generator</h2>
          <p className="text-muted-foreground">
            {scriptSections && scriptSections.length > 0 
              ? `Select script sections to use their image prompts, or create custom prompts.`
              : "Describe the image you want to see, or generate a script first."}
          </p>
        </div>

        {/* Script Section Selection */}
        {scriptSections && scriptSections.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Script Sections</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedSections([])}
                  disabled={selectedSections.length === 0}
                >
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedSections(Array.from({length: scriptSections.length}, (_, i) => i))}
                  disabled={selectedSections.length === scriptSections.length}
                >
                  Select All
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-52 border rounded-md p-4">
              <div className="space-y-2">
                {scriptSections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox 
                      id={`section-${index}`} 
                      checked={selectedSections.includes(index)}
                      onCheckedChange={() => toggleSectionSelection(index)}
                    />
                    <Label 
                      htmlFor={`section-${index}`} 
                      className="flex-grow cursor-pointer text-sm"
                    >
                      <div className="font-medium">{section.title}</div>
                      <div className="text-muted-foreground truncate">{section.image_generation_prompt}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
        
        {/* Custom Prompts */}
        <div className="space-y-4">
          <Label>Custom Prompts</Label>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom image prompt..."
              value={newCustomPrompt}
              onChange={(e) => setNewCustomPrompt(e.target.value)}
              disabled={isLoadingImages}
              className="flex-grow"
            />
            <Button 
              variant="outline"
              onClick={addCustomPrompt}
              disabled={isLoadingImages || !newCustomPrompt.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {customPrompts.length > 0 && (
            <div className="space-y-2">
              {customPrompts.map((prompt, index) => (
                <div key={index} className="flex items-center gap-2 border rounded-md p-2">
                  <div className="flex-grow text-sm">{prompt}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={() => removeCustomPrompt(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="text-xs text-muted-foreground">
                {customPrompts.length} custom prompt{customPrompts.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Manual Prompt - show only if no sections or custom prompts */}
        {selectedSections.length === 0 && customPrompts.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor="manual-prompt">Image Description</Label>
            <Input
              id="manual-prompt"
              placeholder="Describe a single image you want to generate..."
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
              disabled={isLoadingImages}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Provider Selection */}
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

          {/* Number of Images Per Prompt */}
          <div className="space-y-2">
            <Label htmlFor="images-per-prompt">Images per Prompt: {numImagesPerPrompt}</Label>
            <Slider
              id="images-per-prompt"
              min={1}
              max={5}
              step={1}
              value={[numImagesPerPrompt]}
              onValueChange={(value: number[]) => setNumImagesPerPrompt(value[0])}
              disabled={isLoadingImages}
              aria-label="Number of images per prompt"
            />
          </div>

          {/* Minimax Aspect Ratio */}
          {selectedProvider === 'minimax' && (
            <div className="space-y-2">
              <Label htmlFor="minimax-aspect-ratio">Aspect Ratio (Minimax)</Label>
              <select 
                id="minimax-aspect-ratio"
                disabled={isLoadingImages}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue="16:9"
              >
                <option value="16:9">16:9 (Landscape)</option>
              </select>
            </div>
          )}
          
          {/* Generate Button */}
          <div className={`md:col-span-${selectedProvider === 'minimax' ? '1' : '2'}`}>
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
              ) : `Generate ${numImagesPerPrompt > 1 ? numImagesPerPrompt : ''} Image${numImagesPerPrompt > 1 ? 's' : ''} (${displayPromptCount} prompt${displayPromptCount > 1 ? 's' : ''})`}
            </Button>
          </div>
        </div>
        
        {/* Summary Badge */}
        {(selectedSections.length > 0 || customPrompts.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedSections.length > 0 && (
              <Badge variant="secondary">
                {selectedSections.length} script section{selectedSections.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {customPrompts.length > 0 && (
              <Badge variant="secondary">
                {customPrompts.length} custom prompt{customPrompts.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="secondary">
              {numImagesPerPrompt} image{numImagesPerPrompt !== 1 ? 's' : ''} per prompt
            </Badge>
            <div className="text-xs text-muted-foreground ml-2">
              {displayPromptCount * numImagesPerPrompt} total images will be generated
            </div>
          </div>
        )}
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
                            {isSelected ? <Check size={16} className="mr-2" /> : <RefreshCw size={16} className="mr-2" />}
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
                            {isSelected ? <Check size={16} className="mr-2" /> : <RefreshCw size={16} className="mr-2" />}
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