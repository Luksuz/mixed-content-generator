"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Download, RefreshCw, Plus, Check, X } from "lucide-react";
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
import { simulateThumbnailGeneration, mockGeneratedImageSets } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// Updated props for the controlled component
interface ImageGeneratorProps {
  scriptPrompts?: string[]; 
  scriptSections?: ScriptSection[];
  fullScript?: string; // Add full script prop
  numberOfImagesPerPrompt?: number; 
  
  isLoadingImages: boolean;
  imageSets: GeneratedImageSet[];
  generationError: string | null;
  generatingInfo: string | null;
  onStartGenerationRequest: (provider: ImageProvider, numImagesPerPrompt: number, manualSinglePrompt?: string) => Promise<void>;
  onRegenerateImages?: (provider: ImageProvider, prompts: string[]) => Promise<void>;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
  onImageSetsGenerated: (imageSets: GeneratedImageSet[]) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  scriptPrompts,
  scriptSections = [],
  fullScript = "", // Add full script prop
  numberOfImagesPerPrompt = 1, // Default if not specified by parent
  isLoadingImages,
  imageSets,
  generationError,
  generatingInfo,
  onStartGenerationRequest,
  onRegenerateImages,
  onThumbnailGenerated,
  onImageSetsGenerated
}) => {
  const [manualPrompt, setManualPrompt] = useState(""); // Was 'prompt'
  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>("flux"); // Was 'style'
  
  // New state for tracking selected images for regeneration
  const [selectedImages, setSelectedImages] = useState<{ setIndex: number; imageIndex: number; prompt: string }[]>([]);
  
  // New state for image options - remove selectedSections
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [newCustomPrompt, setNewCustomPrompt] = useState("");
  const [numImagesPerPrompt, setNumImagesPerPrompt] = useState(numberOfImagesPerPrompt);
  
  // Thumbnail Generation State
  const [thumbnailPrompt, setThumbnailPrompt] = useState("");
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  
  // Update the default number of images when the prop changes
  useEffect(() => {
    setNumImagesPerPrompt(numberOfImagesPerPrompt);
  }, [numberOfImagesPerPrompt]);
  
  // Get selected prompts
  const getSelectedPrompts = () => {
    return [...customPrompts];
  }

  const handleGenerateClick = async () => {
    // Get all selected prompts (only custom prompts now)
    const selectedPrompts = getSelectedPrompts();
    const promptsToUse = selectedPrompts.length > 0 ? selectedPrompts.join('|||||') : manualPrompt.trim();

    if (!promptsToUse) {
      console.error("No prompt provided for image generation.");
      // Optionally set an error state to inform the user
      return;
    }

    // Always call the parent's generation function
    onStartGenerationRequest(selectedProvider, numImagesPerPrompt, promptsToUse);
  };
  
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

  // Thumbnail Generation Handler - Always use mock data
  const handleGenerateThumbnail = async () => {
    if (!thumbnailPrompt.trim()) {
      setThumbnailError("Please enter a prompt for the thumbnail.");
      return;
    }
    setIsGeneratingThumbnail(true);
    setThumbnailUrl(null);
    setThumbnailError(null);

    try {
      // Always use mock data
      const mockThumbnailUrl = await simulateThumbnailGeneration(thumbnailPrompt);
      setThumbnailUrl(mockThumbnailUrl);
      
      // Notify parent component about the new thumbnail
      if (onThumbnailGenerated && mockThumbnailUrl) {
        onThumbnailGenerated(mockThumbnailUrl);
      }
    } catch (error: any) {
      console.error("Thumbnail generation failed:", error);
      setThumbnailError(error.message || "An unknown error occurred while generating the thumbnail.");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };
  
  // Determine if we have prompts available
  const promptsAvailable = customPrompts.length > 0 || manualPrompt.trim() !== '';
  
  // Count of prompts to be used
  const selectedPromptCount = customPrompts.length;
  const displayPromptCount = selectedPromptCount > 0 ? selectedPromptCount : (manualPrompt.trim() !== '' ? 1 : 0);

  const handleImageSetsGenerated = (imageSets: GeneratedImageSet[]) => {
    onImageSetsGenerated(imageSets);
  };

  // Determine overall loading state
  const currentlyGenerating = isLoadingImages;

  return (
    <Tabs defaultValue="image-generation" className="space-y-8">
      <TabsList className="grid w-full grid-cols-2 backdrop-blur-sm bg-opacity-20 bg-red-900 border border-red-700/20 shadow-glow-red rounded-xl p-1">
        <TabsTrigger 
          value="image-generation" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600/70 data-[state=active]:to-red-700/70 data-[state=active]:text-white data-[state=active]:shadow-glow-red transition-all duration-300 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-red-400" />
            <span className="glow-text-red">Image Synthesis</span>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="thumbnail-generation"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700/70 data-[state=active]:to-red-800/70 data-[state=active]:text-white data-[state=active]:shadow-glow-red transition-all duration-300 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-400" />
            <span className="glow-text-red">Thumbnail Studio</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="image-generation" className="animate-fadeIn">
        <div className="w-full space-y-6 p-6 futuristic-card shadow-glow-red relative overflow-hidden">
          {/* Background blob effects */}
          <div className="blob w-[300px] h-[300px] top-0 right-0 opacity-5 absolute"></div>
          <div className="blob-red w-[200px] h-[200px] bottom-0 left-0 opacity-5 absolute"></div>
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-red-400" />
              AI Image Generator
            </h2>
            <p className="text-muted-foreground">
              {fullScript 
                ? `View your generated script below and create custom prompts for image generation.`
                : "Create custom prompts for image generation, or generate a script first."}
            </p>
          </div>

          {/* Script Content Display */}
          {fullScript && fullScript.trim() ? (
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <Label className="glow-text">Generated Script Content</Label>
                <div className="text-sm text-muted-foreground">
                  {fullScript.split(/\s+/).length} words • Scroll to view full content
                </div>
              </div>
              
              <div className="border rounded-md backdrop-blur-sm bg-black/20 border-red-700/30 futuristic-card">
                <div className="p-4 border-b border-red-700/20">
                  <h3 className="font-medium text-red-300 mb-2">Script Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Use this content as reference for creating custom image prompts below
                  </p>
                </div>
                <ScrollArea className="h-52 p-4 futuristic-scrollbar">
                  <div className="prose prose-sm max-w-none dark:prose-invert text-white">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {fullScript}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <Label className="glow-text">Script Content</Label>
                <div className="text-sm text-muted-foreground">
                  No script generated yet
                </div>
              </div>
              
              <div className="border rounded-md backdrop-blur-sm bg-black/20 border-red-700/30 futuristic-card">
                <div className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No Script Available</p>
                    <p className="text-sm mt-2">Generate a script first to see content here, or create custom prompts below.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Custom Prompts */}
          <div className="space-y-4 relative z-10">
            <Label className="glow-text-red">Custom Prompts</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom image prompt..."
                value={newCustomPrompt}
                onChange={(e) => setNewCustomPrompt(e.target.value)}
                disabled={currentlyGenerating}
                className="flex-grow futuristic-input"
              />
              <Button 
                variant="outline"
                onClick={addCustomPrompt}
                disabled={currentlyGenerating || !newCustomPrompt.trim()}
                className="futuristic-input hover:bg-red-600/20 hover:shadow-glow-red"
              >
                <Plus className="h-4 w-4 text-red-400" />
              </Button>
            </div>
            
            {customPrompts.length > 0 && (
              <div className="space-y-2">
                {customPrompts.map((prompt, index) => (
                  <div key={index} className={`flex items-center gap-2 border rounded-md p-2 backdrop-blur-sm bg-opacity-20 bg-red-900/10 border-red-700/30 animate-zoomIn`} style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex-grow text-sm">{prompt}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-red-700/20 hover:text-red-500 transition-colors" 
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

          {/* Manual Prompt - show only if no custom prompts */}
          {customPrompts.length === 0 && (
            <div className="space-y-2 relative z-10">
              <Label htmlFor="manual-prompt" className="glow-text">Image Description</Label>
              <Input
                id="manual-prompt"
                placeholder="Describe a single image you want to generate..."
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                disabled={currentlyGenerating}
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
                disabled={currentlyGenerating}
              >
                <option value="flux">Flux</option>
                <option value="minimax">Minimax</option>
                <option value="openai">OpenAI (DALL-E 3)</option>
                <option value="gemini">Gemini</option>
                <option value="ideogram">Ideogram</option>
                <option value="sd">Stable Diffusion</option>
              </select>
            </div>

            {/* Number of Images Per Prompt */}
            <div className="space-y-2">
              <Label htmlFor="images-per-prompt" className="glow-text-red">Images per Prompt: {numImagesPerPrompt}</Label>
              <Slider
                id="images-per-prompt"
                min={1}
                max={1000}
                step={1}
                value={[numImagesPerPrompt]}
                onValueChange={(value: number[]) => setNumImagesPerPrompt(value[0])}
                disabled={currentlyGenerating}
                aria-label="Number of images per prompt"
                className="[&>[role=slider]]:bg-red-600 [&>[role=slider]]:shadow-glow-red"
              />
            </div>

            {/* Minimax Aspect Ratio */}
            {selectedProvider === 'minimax' && (
              <div className="space-y-2">
                <Label htmlFor="minimax-aspect-ratio" className="glow-text-red">Aspect Ratio (Minimax)</Label>
                <select 
                  id="minimax-aspect-ratio"
                  disabled={currentlyGenerating}
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
                className="w-full flex items-center justify-center gap-2 shimmer bg-gradient-to-r from-red-600/80 to-red-800/80 border-0 shadow-glow-red relative overflow-hidden" 
                onClick={handleGenerateClick}
                disabled={currentlyGenerating || !promptsAvailable}
              >
                {currentlyGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>{generatingInfo || "Generating..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Images</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Summary Badge */}
          {customPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 relative z-10">
              <Badge variant="secondary" className="bg-red-700/20 border-red-800/30 shadow-glow-red">
                {customPrompts.length} custom prompt{customPrompts.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="bg-red-800/20 border-red-900/30 shadow-glow-red">
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
          <div className="p-4 futuristic-card backdrop-blur-md bg-opacity-20 bg-red-900/10 border-red-700/30 shadow-glow-red flex flex-col sm:flex-row justify-between items-center gap-4 animate-slideUp">
            <div>
              <Badge variant="secondary" className="px-2 py-1 text-sm bg-red-700/20 border-red-800/30 shadow-glow-red">
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
                disabled={currentlyGenerating}
                className="futuristic-input hover:bg-red-700/20 hover:shadow-glow-red"
              >
                <X className="h-4 w-4 mr-2 text-red-400" />
                Clear Selection
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleRegenerateClick}
                disabled={currentlyGenerating || selectedImages.length === 0}
                className="shimmer bg-gradient-to-r from-red-700/80 to-red-900/80 border-0 shadow-glow-red flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {generationError && !currentlyGenerating && (
          <div className="animate-slideUp p-4 bg-red-900/20 border border-red-700/30 text-red-200 rounded-md">
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
          {(currentlyGenerating && imageSets.length === 0) || (!currentlyGenerating && imageSets.length === 0 && promptsAvailable && !generationError) ? (
            <div className="h-[300px] flex flex-col items-center justify-center futuristic-card text-center p-8 animate-pulse">
              {currentlyGenerating ? (
                <>
                  <div className="w-16 h-16 relative mb-4">
                    <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-red-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-red-600 animate-spin" style={{ animationDuration: '3s' }}></div>
                  </div>
                  <p className="glow-text-red">{generatingInfo || "Generating your images..."}</p>
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
            <div key={setIndex} className="p-4 futuristic-card shadow-glow-red animate-slideUp" style={{animationDelay: `${setIndex * 150}ms`}}>
              <h3 className="text-lg font-semibold mb-1 glow-text-red">Prompt:</h3>
              <p className="text-sm text-muted-foreground mb-3 italic truncate">&quot;{set.originalPrompt}&quot;</p>
              {(set.imageUrls.length === 0 && set.imageData.length === 0) && !currentlyGenerating && (
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
                      className={`relative group rounded-lg overflow-hidden shadow-lg aspect-video animate-zoomIn ${isSelected 
                          ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background shadow-glow-red' 
                          : 'border border-red-700/30'
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
                            className="bg-red-900/40 hover:bg-red-800/60 border-red-700/30"
                          >
                            <Download size={16} className="mr-2 text-red-400" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                            className={isSelected ? 
                              "bg-red-600/60 hover:bg-red-700/70 border-red-500/30" : 
                              "bg-red-900/30 hover:bg-red-800/40 border-red-700/30"}
                          >
                            {isSelected ? <Check size={16} className="mr-2 text-red-200" /> : <RefreshCw size={16} className="mr-2 text-red-400" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-600/70 border-0 shadow-glow-red">
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
                      className={`relative group rounded-lg overflow-hidden shadow-lg aspect-video animate-zoomIn ${isSelected 
                          ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background shadow-glow-red' 
                          : 'border border-red-700/30'
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
                            className="bg-red-900/40 hover:bg-red-800/60 border-red-700/30"
                          >
                            <Download size={16} className="mr-2 text-red-400" />
                            Download
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleImageSelection(setIndex, imageIndex + set.imageUrls.length, set.originalPrompt)}
                            disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected)}
                            className={isSelected ? 
                              "bg-red-600/60 hover:bg-red-700/70 border-red-500/30" : 
                              "bg-red-900/30 hover:bg-red-800/40 border-red-700/30"}
                          >
                            {isSelected ? <Check size={16} className="mr-2 text-red-200" /> : <RefreshCw size={16} className="mr-2 text-red-400" />}
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-600/70 border-0 shadow-glow-red">
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
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/20 via-red-600/10 to-red-700/20 opacity-30" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-3s"}} />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600 rounded-full filter blur-3xl opacity-10 animate-blob" />
            {/* Add a few more blobs for enhanced effect */}
            <div className="absolute top-60 left-20 w-40 h-40 bg-red-400 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-5s"}} />
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-red-700 rounded-full filter blur-3xl opacity-10 animate-blob" style={{animationDelay: "-7s"}} />
          </div>
          
          <div className="relative z-10"> {/* Content wrapper */}
            <div className="space-y-2 mb-6">
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-red-500 to-red-600 flex items-center gap-2"
              >
                <Sparkles className="h-6 w-6 text-red-400" />
                Neural Thumbnail Generator
              </motion.h2>
              <p className="text-slate-300">
                Generate attention-grabbing thumbnails with advanced AI. Create the perfect visual entry point.
              </p>
            </div>

            <div className="backdrop-blur-md bg-black/20 border border-white/10 rounded-lg p-5 space-y-4 shadow-lg shadow-red-500/10">
              <Label htmlFor="thumbnail-prompt" className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-400">
                Visual Synthesis Prompt
              </Label>
              
              <div className="relative">
                <Input
                  id="thumbnail-prompt"
                  placeholder="e.g., A futuristic cityscape with flying cars and neon lights"
                  value={thumbnailPrompt}
                  onChange={(e) => setThumbnailPrompt(e.target.value)}
                  disabled={isGeneratingThumbnail}
                  className="bg-black/30 border-white/10 text-slate-100 py-6 pl-4 pr-12 focus-visible:ring-red-500 placeholder:text-gray-500"
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
                  className="w-full rounded-md py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 relative overflow-hidden border-0 transition-all duration-300" 
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
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ImageGenerator; 