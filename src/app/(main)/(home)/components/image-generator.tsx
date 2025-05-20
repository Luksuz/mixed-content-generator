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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { simulateThumbnailGeneration } from "@/lib/mock-data";

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
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
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
  onRegenerateImages,
  onThumbnailGenerated
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
  
  // Thumbnail Generation State
  const [thumbnailPrompt, setThumbnailPrompt] = useState("");
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  
  // Check if we're in mock data mode
  const isMockMode = process.env.NEXT_PUBLIC_NODE_ENV === 'development';
  
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

  // Thumbnail Generation Handler - Updated to use mock data in development
  const handleGenerateThumbnail = async () => {
    if (!thumbnailPrompt.trim()) {
      setThumbnailError("Please enter a prompt for the thumbnail.");
      return;
    }
    setIsGeneratingThumbnail(true);
    setThumbnailUrl(null);
    setThumbnailError(null);

    try {
      // Use mock data in development mode
      if (isMockMode) {
        const mockThumbnailUrl = await simulateThumbnailGeneration(thumbnailPrompt);
        setThumbnailUrl(mockThumbnailUrl);
        
        // Notify parent component about the new thumbnail
        if (onThumbnailGenerated && mockThumbnailUrl) {
          onThumbnailGenerated(mockThumbnailUrl);
        }
      } else {
        // Regular API call for production
        const response = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: thumbnailPrompt }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to generate thumbnail');
        }

        setThumbnailUrl(data.thumbnailUrl);
        
        // Notify parent component about the new thumbnail
        if (onThumbnailGenerated && data.thumbnailUrl) {
          onThumbnailGenerated(data.thumbnailUrl);
        }
      }
    } catch (error: any) {
      console.error("Thumbnail generation failed:", error);
      setThumbnailError(error.message || "An unknown error occurred while generating the thumbnail.");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };
  
  // Determine if we have prompts available
  const promptsAvailable = selectedSections.length > 0 || customPrompts.length > 0 || manualPrompt.trim() !== '';
  
  // Count of prompts to be used
  const selectedPromptCount = selectedSections.length + customPrompts.length;
  const displayPromptCount = selectedPromptCount > 0 ? selectedPromptCount : (manualPrompt.trim() !== '' ? 1 : 0);

  return (
    <Tabs defaultValue="image-generation" className="space-y-8">
      <TabsList className="grid w-full grid-cols-2 backdrop-blur-sm bg-opacity-20 bg-blue-900 border border-blue-500/20 shadow-glow-blue rounded-xl p-1">
        <TabsTrigger 
          value="image-generation" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/70 data-[state=active]:to-cyan-600/70 data-[state=active]:text-white data-[state=active]:shadow-glow-blue transition-all duration-300 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-400" />
            <span className="glow-text">Image Synthesis</span>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="thumbnail-generation"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/70 data-[state=active]:to-pink-600/70 data-[state=active]:text-white data-[state=active]:shadow-glow-purple transition-all duration-300 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="glow-text-purple">Thumbnail Studio</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="image-generation" className="animate-fadeIn">
        <div className="w-full space-y-6 p-6 futuristic-card shadow-glow-blue relative overflow-hidden">
          {/* Background blob effects */}
          <div className="blob w-[300px] h-[300px] top-0 right-0 opacity-5 absolute"></div>
          <div className="blob-cyan w-[200px] h-[200px] bottom-0 left-0 opacity-5 absolute"></div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-400" />
              AI Image Generator
            </h2>
            <p className="text-muted-foreground">
              {scriptSections && scriptSections.length > 0 
                ? `Select script sections to use their image prompts, or create custom prompts.`
                : "Describe the image you want to see, or generate a script first."}
            </p>
          </div>

          {/* Script Section Selection */}
          {scriptSections && scriptSections.length > 0 ? (
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <Label className="glow-text">Script Sections</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedSections([])}
                    disabled={selectedSections.length === 0}
                    className="futuristic-input hover:bg-blue-600/20 hover:shadow-glow-blue"
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedSections(Array.from({length: scriptSections.length}, (_, i) => i))}
                    disabled={selectedSections.length === scriptSections.length}
                    className="futuristic-input hover:bg-blue-600/20 hover:shadow-glow-blue"
                  >
                    Select All
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-52 border rounded-md p-4 backdrop-blur-sm bg-black/20 border-blue-500/30 futuristic-scrollbar">
                <div className="space-y-2">
                  {scriptSections.map((section, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 hover:bg-blue-600/10 rounded-md transition-colors duration-200">
                      <Checkbox 
                        id={`section-${index}`} 
                        checked={selectedSections.includes(index)}
                        onCheckedChange={() => toggleSectionSelection(index)}
                        className="border-blue-500/50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
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
          <div className="space-y-4 relative z-10">
            <Label className="glow-text-cyan">Custom Prompts</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom image prompt..."
                value={newCustomPrompt}
                onChange={(e) => setNewCustomPrompt(e.target.value)}
                disabled={isLoadingImages}
                className="flex-grow futuristic-input"
              />
              <Button 
                variant="outline"
                onClick={addCustomPrompt}
                disabled={isLoadingImages || !newCustomPrompt.trim()}
                className="futuristic-input hover:bg-cyan-600/20 hover:shadow-glow-cyan"
              >
                <Plus className="h-4 w-4 text-cyan-400" />
              </Button>
            </div>
            
            {customPrompts.length > 0 && (
              <div className="space-y-2">
                {customPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center gap-2 border rounded-md p-2 backdrop-blur-sm bg-opacity-20 bg-cyan-900/10 border-cyan-500/30 animate-zoomIn" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex-grow text-sm">{prompt}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-red-600/20 hover:text-red-400 transition-colors" 
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
            <div className="space-y-2 relative z-10">
              <Label htmlFor="manual-prompt" className="glow-text">Image Description</Label>
              <Input
                id="manual-prompt"
                placeholder="Describe a single image you want to generate..."
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                disabled={isLoadingImages}
                className="futuristic-input"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider-select" className="glow-text">Provider</Label>
              <select
                id="provider-select"
                className="futuristic-input w-full rounded-md px-3 py-2"
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
              <Label htmlFor="images-per-prompt" className="glow-text-cyan">Images per Prompt: {numImagesPerPrompt}</Label>
              <Slider
                id="images-per-prompt"
                min={1}
                max={5}
                step={1}
                value={[numImagesPerPrompt]}
                onValueChange={(value: number[]) => setNumImagesPerPrompt(value[0])}
                disabled={isLoadingImages}
                aria-label="Number of images per prompt"
                className="[&>[role=slider]]:bg-cyan-600 [&>[role=slider]]:shadow-glow-cyan"
              />
            </div>

            {/* Minimax Aspect Ratio */}
            {selectedProvider === 'minimax' && (
              <div className="space-y-2">
                <Label htmlFor="minimax-aspect-ratio" className="glow-text-purple">Aspect Ratio (Minimax)</Label>
                <select 
                  id="minimax-aspect-ratio"
                  disabled={isLoadingImages}
                  className="futuristic-input w-full rounded-md px-3 py-2"
                  defaultValue="16:9"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                </select>
              </div>
            )}
            
            {/* Generate Button */}
            <div className={`md:col-span-${selectedProvider === 'minimax' ? '1' : '2'}`}>
              <Button 
                className="w-full flex items-center justify-center gap-2 shimmer bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-0 shadow-glow-blue relative overflow-hidden" 
                onClick={handleGenerateClick}
                disabled={isLoadingImages || !promptsAvailable}
              >
                {isLoadingImages ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>{generatingInfo || "Generating..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{`Generate ${numImagesPerPrompt > 1 ? numImagesPerPrompt : ''} Image${numImagesPerPrompt > 1 ? 's' : ''} (${displayPromptCount} prompt${displayPromptCount > 1 ? 's' : ''})`}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Summary Badge */}
          {(selectedSections.length > 0 || customPrompts.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-2 relative z-10">
              {selectedSections.length > 0 && (
                <Badge variant="secondary" className="bg-blue-600/20 border-blue-500/30 shadow-glow-blue">
                  {selectedSections.length} script section{selectedSections.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {customPrompts.length > 0 && (
                <Badge variant="secondary" className="bg-cyan-600/20 border-cyan-500/30 shadow-glow-cyan">
                  {customPrompts.length} custom prompt{customPrompts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-purple-600/20 border-purple-500/30 shadow-glow-purple">
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
          <div className="p-4 futuristic-card backdrop-blur-md bg-opacity-20 bg-purple-900/10 border-purple-500/30 shadow-glow-purple flex flex-col sm:flex-row justify-between items-center gap-4 animate-slideUp">
            <div>
              <Badge variant="secondary" className="px-2 py-1 text-sm bg-purple-600/20 border-purple-500/30 shadow-glow-purple">
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
                className="futuristic-input hover:bg-purple-600/20 hover:shadow-glow-purple"
              >
                <X className="h-4 w-4 mr-2 text-purple-400" />
                Clear Selection
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleRegenerateClick}
                disabled={isLoadingImages || selectedImages.length === 0}
                className="shimmer bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-0 shadow-glow-purple flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {generationError && (
          <div className="animate-slideUp p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="font-semibold text-red-300">Generation Error:</p>
            </div>
            <pre className="whitespace-pre-wrap text-sm">{generationError}</pre>
          </div>
        )}

        {/* Generated Images */}
        <div className="space-y-6">
           {/* Loading state or initial placeholder */}
          {(isLoadingImages && imageSets.length === 0) || (!isLoadingImages && imageSets.length === 0 && promptsAvailable && !generationError) ? (
            <div className="h-[300px] flex flex-col items-center justify-center futuristic-card text-center p-8 animate-pulse">
              {isLoadingImages ? (
                <>
                  <div className="w-16 h-16 relative mb-4">
                    <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-purple-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                  </div>
                  <p className="glow-text-cyan">{generatingInfo || "Generating your images..."}</p>
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
            <div key={setIndex} className="p-4 futuristic-card shadow-glow-blue animate-slideUp" style={{animationDelay: `${setIndex * 150}ms`}}>
              <h3 className="text-lg font-semibold mb-1 glow-text">Prompt:</h3>
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
                    <div 
                      key={`url-${imageIndex}`} 
                      className={`relative group rounded-lg overflow-hidden shadow-lg aspect-video animate-zoomIn ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background shadow-glow-purple' 
                          : 'border border-blue-500/30'
                      }`}
                      style={{animationDelay: `${(setIndex * 100) + (imageIndex * 50)}ms`}}
                    >
                      <img 
                        src={url} 
                        alt={`Generated for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 flex items-end justify-center p-3 transition-all duration-300">
                        <div className="flex gap-2 w-full justify-center">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => downloadImage(url, `generated_image_${setIndex}_${imageIndex}.png`)}
                            className="bg-blue-900/40 hover:bg-blue-800/60 border-blue-500/30"
                          >
                            <Download size={16} className="mr-2 text-blue-400" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                            className={isSelected ? 
                              "bg-purple-600/60 hover:bg-purple-700/70 border-purple-500/30" : 
                              "bg-purple-900/30 hover:bg-purple-800/40 border-purple-500/30"}
                          >
                            {isSelected ? <Check size={16} className="mr-2 text-purple-200" /> : <RefreshCw size={16} className="mr-2 text-purple-400" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-purple-600/70 border-0 shadow-glow-purple">
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Similar styling updates for base64 images section */}
                {set.imageData.map((b64, imageIndex) => {
                  // Check if this image is selected for regeneration
                  const isSelected = selectedImages.some(
                    item => item.setIndex === setIndex && item.imageIndex === imageIndex + set.imageUrls.length
                  );
                  
                  return (
                    <div 
                      key={`b64-${imageIndex}`} 
                      className={`relative group rounded-lg overflow-hidden shadow-lg aspect-video animate-zoomIn ${
                        isSelected 
                          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background shadow-glow-purple' 
                          : 'border border-blue-500/30'
                      }`}
                      style={{animationDelay: `${(setIndex * 100) + ((imageIndex + set.imageUrls.length) * 50)}ms`}}
                    >
                      <img 
                        src={`data:image/png;base64,${b64}`}
                        alt={`Generated (base64) for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 flex items-end justify-center p-3 transition-all duration-300">
                        <div className="flex gap-2 w-full justify-center">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => downloadImage(`data:image/png;base64,${b64}`, `generated_image_b64_${setIndex}_${imageIndex}.png`)}
                            className="bg-blue-900/40 hover:bg-blue-800/60 border-blue-500/30"
                          >
                            <Download size={16} className="mr-2 text-blue-400" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex + set.imageUrls.length, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                            className={isSelected ? 
                              "bg-purple-600/60 hover:bg-purple-700/70 border-purple-500/30" : 
                              "bg-purple-900/30 hover:bg-purple-800/40 border-purple-500/30"}
                          >
                            {isSelected ? <Check size={16} className="mr-2 text-purple-200" /> : <RefreshCw size={16} className="mr-2 text-purple-400" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-purple-600/70 border-0 shadow-glow-purple">
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="thumbnail-generation" className="animate-fadeIn">
        <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border-0 shadow-xl text-white relative overflow-hidden">
          {/* Ambient background elements - enhanced */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/10 to-pink-500/20 opacity-30" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-fuchsia-500 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-3s"}} />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-blob" />
            {/* Add a few more blobs for enhanced effect */}
            <div className="absolute top-60 left-20 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-5s"}} />
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-pink-500 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-7s"}} />
          </div>
          
          <div className="relative z-10"> {/* Content wrapper */}
            <div className="space-y-2 mb-6">
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 flex items-center gap-2"
              >
                <Sparkles className="h-6 w-6 text-fuchsia-400" />
                Neural Thumbnail Generator
              </motion.h2>
              <p className="text-slate-300">
                Generate attention-grabbing thumbnails with advanced AI. Create the perfect visual entry point.
              </p>
            </div>

            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-lg p-5 space-y-4 shadow-lg shadow-purple-500/10">
              <Label htmlFor="thumbnail-prompt" className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                Visual Synthesis Prompt
              </Label>
              
              <div className="relative">
                <Input
                  id="thumbnail-prompt"
                  placeholder="e.g., A futuristic cityscape with flying cars and neon lights"
                  value={thumbnailPrompt}
                  onChange={(e) => setThumbnailPrompt(e.target.value)}
                  disabled={isGeneratingThumbnail}
                  className="bg-black/30 border-white/10 text-slate-100 py-6 pl-4 pr-12 focus-visible:ring-fuchsia-500 placeholder:text-gray-500"
                />
                {thumbnailPrompt && (
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setThumbnailPrompt("")}
                    disabled={isGeneratingThumbnail}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  className="w-full rounded-md py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 relative overflow-hidden border-0 transition-all duration-300" 
                  onClick={handleGenerateThumbnail}
                  disabled={isGeneratingThumbnail || !thumbnailPrompt.trim()}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  <div className="flex items-center justify-center gap-2">
                    {isGeneratingThumbnail ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-lg font-medium">Generating Thumbnail...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg font-medium">Generate Neural Thumbnail</span>
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>
            </div>

            {/* Error alert - minor enhancement */}
            {thumbnailError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-5"
              >
                <Alert variant="destructive" className="bg-red-900/40 border border-red-700 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Generation Error</AlertTitle>
                  <AlertDescription>{thumbnailError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Rest of existing code ... */}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ImageGenerator; 