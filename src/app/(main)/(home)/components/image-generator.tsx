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
import { Textarea } from "@/components/ui/textarea";

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
  const [numImagesPerPrompt, setNumImagesPerPrompt] = useState(1); // Fixed at 1
  
  // Enhanced image style options (from example)
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>("realistic");
  const [customStyleInput, setCustomStyleInput] = useState<string>("");
  const [imageTonePreference, setImageTonePreference] = useState<string>("balanced");
  const [selectedResolution, setSelectedResolution] = useState<string>("1536x1024");
  
  // Thumbnail Generation State
  const [thumbnailPrompt, setThumbnailPrompt] = useState("");
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailStyle, setThumbnailStyle] = useState<string>("realistic");
  const [customThumbnailStyle, setCustomThumbnailStyle] = useState<string>("");
  const [thumbnailTone, setThumbnailTone] = useState<string>("balanced");
  
  // Image Regeneration state
  const [regenerating, setRegenerating] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<{ setIndex: number; imageIndex: number } | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  
  // Update the default number of images when the prop changes
  useEffect(() => {
    setNumImagesPerPrompt(1); // Always set to 1
  }, [numberOfImagesPerPrompt]);
  
  // Get selected prompts
  const getSelectedPrompts = () => {
    const sectionPrompts = selectedSections
      .map(index => scriptSections[index]?.image_generation_prompt)
      .filter(Boolean) as string[];
    
    return [...sectionPrompts, ...customPrompts];
  }

  const handleGenerateClick = () => {
    // Apply enhanced styling to image generation
    const selectedPrompts = getSelectedPrompts();
    
    // Add tone preference to enhance the style
    let styleEnhancement = "";
    if (imageTonePreference === "light") {
      styleEnhancement = ", bright lighting, well-lit scene, vibrant, daytime";
    } else if (imageTonePreference === "dark") {
      styleEnhancement = ", dramatic lighting, dark atmosphere, shadows, low-key lighting";
    } else {
      styleEnhancement = ", balanced lighting, natural light";
    }
    
    // Set the provider based on style selection
    let enhancedProvider = selectedProvider;
    
    // If we have selected prompts, use those
    if (selectedPrompts.length > 0) {
      onStartGenerationRequest(enhancedProvider, 1, selectedPrompts.join('|||||'));
    } 
    // Otherwise, use the manual prompt if available
    else if (manualPrompt.trim() !== "") {
      // Add style enhancements to the manual prompt
      const enhancedPrompt = customStyleInput 
        ? `${manualPrompt.trim()} (Style: ${customStyleInput}${styleEnhancement})`
        : `${manualPrompt.trim()} (Style: ${selectedImageStyle}${styleEnhancement})`;
        
      onStartGenerationRequest(enhancedProvider, 1, enhancedPrompt);
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

  // Function to regenerate all selected images
  const regenerateSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    setRegenerating(true);
    
    try {
      // Extract prompts from selected images
      const prompts = selectedImages.map(item => {
        // Add style enhancements to the prompt
        let styleEnhancement = "";
        if (imageTonePreference === "light") {
          styleEnhancement = ", bright lighting, well-lit scene, vibrant, daytime";
        } else if (imageTonePreference === "dark") {
          styleEnhancement = ", dramatic lighting, dark atmosphere, shadows, low-key lighting";
        }
        
        return customStyleInput 
          ? `${item.prompt} (Style: ${customStyleInput}${styleEnhancement})`
          : `${item.prompt} (Style: ${selectedImageStyle}${styleEnhancement})`;
      });
      
      // Call the parent's regenerate function
      await onRegenerateImages?.(selectedProvider, prompts);
      
      // Clear selection after regeneration
      setSelectedImages([]);
    } catch (err) {
      console.error("Error regenerating images:", err);
    } finally {
      setRegenerating(false);
    }
  };
  
  // Function to regenerate all images
  const regenerateAllImages = async () => {
    // Create an array of all unique prompts from image sets
    const allPrompts = imageSets
      .map(set => set.originalPrompt)
      .filter((prompt, index, self) => self.indexOf(prompt) === index);
      
    if (allPrompts.length === 0) return;
    
    setRegenerating(true);
    
    try {
      // Add style enhancements to each prompt
      const enhancedPrompts = allPrompts.map(prompt => {
        let styleEnhancement = "";
        if (imageTonePreference === "light") {
          styleEnhancement = ", bright lighting, well-lit scene, vibrant, daytime";
        } else if (imageTonePreference === "dark") {
          styleEnhancement = ", dramatic lighting, dark atmosphere, shadows, low-key lighting";
        }
        
        return customStyleInput 
          ? `${prompt} (Style: ${customStyleInput}${styleEnhancement})`
          : `${prompt} (Style: ${selectedImageStyle}${styleEnhancement})`;
      });
      
      // Call the parent's regenerate function
      await onRegenerateImages?.(selectedProvider, enhancedPrompts);
    } catch (err) {
      console.error("Error regenerating all images:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // Thumbnail generation handler
  const handleGenerateThumbnail = async () => {
    if (!thumbnailPrompt.trim()) return;
    
    setIsGeneratingThumbnail(true);
    setThumbnailError(null);
    
    try {
      // Add style enhancements to the prompt
      let styleEnhancement = "";
      if (thumbnailTone === "light") {
        styleEnhancement = ", bright lighting, well-lit scene, vibrant, daytime";
      } else if (thumbnailTone === "dark") {
        styleEnhancement = ", dramatic lighting, dark atmosphere, shadows, low-key lighting";
      }
      
      const enhancedPrompt = customThumbnailStyle 
        ? `${thumbnailPrompt.trim()} (Style: ${customThumbnailStyle}${styleEnhancement})`
        : `${thumbnailPrompt.trim()} (Style: ${thumbnailStyle}${styleEnhancement})`;
      
      // Call the Leonardo.ai API through our API route
      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate thumbnail');
      }
      
      const data = await response.json();
      
      if (!data.thumbnailUrl) {
        throw new Error('No thumbnail URL received from the server');
      }
      
      // Use the thumbnail URL returned from the API
      setThumbnailUrl(data.thumbnailUrl);
      
      // Notify parent component if needed
      if (onThumbnailGenerated) {
        onThumbnailGenerated(data.thumbnailUrl);
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      setThumbnailError(error instanceof Error ? error.message : 'Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Start editing an image prompt
  const startEditingImage = (setIndex: number, imageIndex: number, prompt: string) => {
    setEditingImageIndex({ setIndex, imageIndex });
    setEditedPrompt(prompt);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingImageIndex(null);
    setEditedPrompt("");
  };
  
  // Finish editing and regenerate with new prompt
  const finishEditingAndRegenerate = async () => {
    if (!editingImageIndex || !editedPrompt.trim()) return;
    
    setRegenerating(true);
    
    try {
      // Add style enhancements to the prompt
      let styleEnhancement = "";
      if (imageTonePreference === "light") {
        styleEnhancement = ", bright lighting, well-lit scene, vibrant, daytime";
      } else if (imageTonePreference === "dark") {
        styleEnhancement = ", dramatic lighting, dark atmosphere, shadows, low-key lighting";
      }
      
      const enhancedPrompt = customStyleInput 
        ? `${editedPrompt.trim()} (Style: ${customStyleInput}${styleEnhancement})`
        : `${editedPrompt.trim()} (Style: ${selectedImageStyle}${styleEnhancement})`;
        
      // Call the parent's regenerate function with the edited prompt
      await onRegenerateImages?.(selectedProvider, [enhancedPrompt]);
      
      // Reset editing state
      setEditingImageIndex(null);
      setEditedPrompt("");
    } catch (err) {
      console.error("Error regenerating image with edited prompt:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // Determine if we have prompts available
  const promptsAvailable = selectedSections.length > 0 || customPrompts.length > 0 || manualPrompt.trim() !== '';
  
  // Count of prompts to be used
  const selectedPromptCount = selectedSections.length + customPrompts.length;
  const displayPromptCount = selectedPromptCount > 0 ? selectedPromptCount : (manualPrompt.trim() !== '' ? 1 : 0);

  return (
    <Tabs defaultValue="image-generation" className="space-y-8">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="image-generation">Image Generation</TabsTrigger>
        <TabsTrigger value="thumbnail-generation">Thumbnail Generation</TabsTrigger>
      </TabsList>

      <TabsContent value="image-generation">
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
                disabled={isLoadingImages || regenerating}
                className="flex-grow"
              />
              <Button 
                variant="outline"
                onClick={addCustomPrompt}
                disabled={isLoadingImages || regenerating || !newCustomPrompt.trim()}
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
              <Textarea
                id="manual-prompt"
                placeholder="Describe an image in detail, e.g. 'A futuristic cityscape with flying cars, neon lights, and tall skyscrapers, cinematic lighting'"
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                disabled={isLoadingImages || regenerating}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">Provide a detailed description for best results. Be specific about elements, style, lighting, and composition.</p>
            </div>
          )}

          {/* NEW: Image Style Selection */}
          <div className="space-y-2 border-t pt-4">
            <Label>Image Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ["realistic", "Realistic", "Photorealistic style"],
                ["artistic", "Artistic", "Creative, painterly style"],
                ["cinematic", "Cinematic", "Movie-like composition"],
                ["animation", "Animation", "3D/cartoon style"],
                ["graphic", "Graphic", "Bold, graphic design style"],
                ["fantasy", "Fantasy", "Fantasy art style"]
              ].map(([value, name, desc]) => (
                <div 
                  key={value} 
                  onClick={() => setSelectedImageStyle(value)}
                  className={`border rounded-md p-3 cursor-pointer text-center transition-colors ${
                    selectedImageStyle === value && !customStyleInput
                      ? "bg-blue-50 border-blue-300" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NEW: Custom Style Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-style-input">Custom Style (Optional)</Label>
            <Input
              id="custom-style-input"
              placeholder="E.g., oil painting, watercolor, cyberpunk neon, vaporwave"
              value={customStyleInput}
              onChange={(e) => setCustomStyleInput(e.target.value)}
              disabled={isLoadingImages || regenerating}
            />
            <p className="text-xs text-muted-foreground">Enter a custom style to override the selection above</p>
          </div>

          {/* NEW: Lighting Tone */}
          <div className="space-y-2">
            <Label>Lighting Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["light", "Light", "Bright, well-lit scenes"],
                ["balanced", "Balanced", "Natural lighting (default)"],
                ["dark", "Dark", "Dramatic, darker scenes"]
              ].map(([value, name, desc]) => (
                <div 
                  key={value} 
                  onClick={() => setImageTonePreference(value)}
                  className={`border rounded-md p-3 cursor-pointer text-center transition-colors ${
                    imageTonePreference === value
                      ? "bg-blue-50 border-blue-300" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm">{name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider-select">Provider</Label>
              <select
                id="provider-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
                disabled={isLoadingImages || regenerating}
              >
                <option value="openai">OPENAI</option>
                <option value="minimax">MINIMAX</option>
              </select>
            </div>

            {/* Minimax Aspect Ratio */}
            {selectedProvider === 'minimax' && (
              <div className="space-y-2">
                <Label htmlFor="minimax-aspect-ratio">Aspect Ratio (Minimax)</Label>
                <select 
                  id="minimax-aspect-ratio"
                  disabled={isLoadingImages || regenerating}
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
                disabled={isLoadingImages || regenerating || !promptsAvailable}
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
                1 image per prompt
              </Badge>
              <div className="text-xs text-muted-foreground ml-2">
                {displayPromptCount} total images will be generated
              </div>
            </div>
          )}
        </div>

        {/* Regeneration Controls - enhanced with more options */}
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
                disabled={isLoadingImages || regenerating}
              >
                Clear Selection
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={regenerateSelectedImages}
                disabled={isLoadingImages || regenerating || selectedImages.length === 0}
                className="flex items-center gap-2"
              >
                {regenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* NEW: Regenerate All Images button */}
        {imageSets.length > 0 && selectedImages.length === 0 && (
          <div className="p-4 border rounded-lg bg-card shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-medium">Regenerate all images with new settings</p>
              <p className="text-sm text-muted-foreground mt-1">
                Apply current style and lighting settings to regenerate all images
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={regenerateAllImages}
              disabled={isLoadingImages || regenerating || imageSets.length === 0}
              className="flex items-center gap-2"
            >
              {regenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Regenerating all images...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate All Images
                </>
              )}
            </Button>
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
                  <div className="relative w-24 h-24">
                    <div className="absolute animate-ping w-full h-full rounded-full bg-primary/30"></div>
                    <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/50">
                      <ImageIcon size={40} className="text-white" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-6">{generatingInfo || "Creating your images..."}</p>
                  <p className="text-xs text-muted-foreground mt-2">This typically takes 15-30 seconds</p>
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
          
          {/* Edit Prompt Dialog */}
          {editingImageIndex !== null && (
            <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm">
              <h3 className="text-lg font-medium mb-3">Edit Image Prompt</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Edit the prompt to regenerate this image with different details
              </p>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                placeholder="Describe what you want to see in the image"
                className="min-h-[100px] mb-4"
                disabled={regenerating}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={cancelEditing}
                  disabled={regenerating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={finishEditingAndRegenerate}
                  disabled={regenerating || !editedPrompt.trim()}
                >
                  {regenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Regenerating...
                    </>
                  ) : (
                    "Regenerate Image"
                  )}
                </Button>
              </div>
            </div>
          )}
          
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
                    <div key={`url-${imageIndex}`} className={`relative group border rounded-lg overflow-hidden shadow-lg aspect-video ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <img 
                        src={url} 
                        alt={`Generated for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <div className="flex flex-col gap-3 items-center">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => downloadImage(url, `generated_image_${setIndex}_${imageIndex}.png`)}>
                              <Download size={16} className="mr-2" />
                              Download
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => toggleImageSelection(setIndex, imageIndex, set.originalPrompt)}
                              disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected) || regenerating || isLoadingImages}
                            >
                              {isSelected ? <Check size={16} className="mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingImage(setIndex, imageIndex, set.originalPrompt)}
                            disabled={regenerating || isLoadingImages}
                            className="w-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit Prompt
                          </Button>
                          
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
                    <div key={`b64-${imageIndex}`} className={`relative group border rounded-lg overflow-hidden shadow-lg aspect-video ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <img 
                        src={`data:image/png;base64,${b64}`}
                        alt={`Generated (base64) for: ${set.originalPrompt.substring(0,30)}... - Image ${imageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <div className="flex flex-col gap-3 items-center">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => downloadImage(`data:image/png;base64,${b64}`, `generated_image_b64_${setIndex}_${imageIndex}.png`)}>
                              <Download size={16} className="mr-2" />
                              Download
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => toggleImageSelection(setIndex, imageIndex + set.imageUrls.length, set.originalPrompt)}
                              disabled={!onRegenerateImages || (selectedImages.length >= 5 && !isSelected) || regenerating || isLoadingImages}
                            >
                              {isSelected ? <Check size={16} className="mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingImage(setIndex, imageIndex + set.imageUrls.length, set.originalPrompt)}
                            disabled={regenerating || isLoadingImages}
                            className="w-full"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit Prompt
                          </Button>
                          
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
      </TabsContent>

      <TabsContent value="thumbnail-generation">
        <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">AI Thumbnail Generator</h2>
            <p className="text-muted-foreground">
              Create high-quality video thumbnails using Leonardo.ai
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail-prompt">Thumbnail Description</Label>
              <Textarea
                id="thumbnail-prompt"
                placeholder="Describe your thumbnail in detail, e.g., 'A futuristic cityscape with flying cars and neon lights, cinematic composition, high quality'"
                value={thumbnailPrompt}
                onChange={(e) => setThumbnailPrompt(e.target.value)}
                disabled={isGeneratingThumbnail}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">Provide a detailed description for best results. Be specific about elements, style, lighting, and composition.</p>
            </div>

            {/* Style Options */}
            <div className="space-y-2">
              <Label>Thumbnail Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ["realistic", "Realistic", "Photorealistic style"],
                  ["artistic", "Artistic", "Creative, painterly style"],
                  ["cinematic", "Cinematic", "Movie-like composition"],
                  ["animation", "Animation", "3D/cartoon style"],
                  ["graphic", "Graphic", "Bold, graphic design style"],
                  ["fantasy", "Fantasy", "Fantasy art style"]
                ].map(([value, name, desc]) => (
                  <div 
                    key={value} 
                    onClick={() => setThumbnailStyle(value)}
                    className={`border rounded-md p-3 cursor-pointer text-center transition-colors ${
                      thumbnailStyle === value && !customThumbnailStyle
                        ? "bg-blue-50 border-blue-300" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Style Input */}
            <div className="space-y-2">
              <Label htmlFor="custom-thumbnail-style">Custom Style (Optional)</Label>
              <Input
                id="custom-thumbnail-style"
                placeholder="E.g., oil painting, watercolor, cyberpunk neon, vaporwave"
                value={customThumbnailStyle}
                onChange={(e) => setCustomThumbnailStyle(e.target.value)}
                disabled={isGeneratingThumbnail}
              />
              <p className="text-xs text-muted-foreground">Enter a custom style to override the selection above</p>
            </div>

            {/* Lighting Tone */}
            <div className="space-y-2">
              <Label>Lighting Tone</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["light", "Light", "Bright, well-lit scenes"],
                  ["balanced", "Balanced", "Natural lighting (default)"],
                  ["dark", "Dark", "Dramatic, darker scenes"]
                ].map(([value, name, desc]) => (
                  <div 
                    key={value} 
                    onClick={() => setThumbnailTone(value)}
                    className={`border rounded-md p-3 cursor-pointer text-center transition-colors ${
                      thumbnailTone === value
                        ? "bg-blue-50 border-blue-300" 
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              className="w-full flex items-center justify-center gap-2" 
              onClick={handleGenerateThumbnail}
              disabled={isGeneratingThumbnail || !thumbnailPrompt.trim()}
            >
              {isGeneratingThumbnail ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Generating Thumbnail...</span>
                </>
              ) : "Generate Thumbnail"}
            </Button>

            {thumbnailError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-700">
                <p className="font-semibold">Error:</p>
                <pre className="whitespace-pre-wrap text-sm">{thumbnailError}</pre>
              </div>
            )}

            {thumbnailUrl && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Generated Thumbnail:</h3>
                <div className="relative group border rounded-lg overflow-hidden shadow-lg aspect-video">
                  <img 
                    src={thumbnailUrl} 
                    alt="Generated Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <div className="flex flex-col gap-4 items-center">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => downloadImage(thumbnailUrl, `thumbnail_${thumbnailPrompt.substring(0,20).replace(/\s+/g, '_')}.png`)}>
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        
                        {onThumbnailGenerated && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => onThumbnailGenerated(thumbnailUrl)}
                          >
                            Use as Video Thumbnail
                          </Button>
                        )}
                      </div>
                      
                      <Badge variant="outline" className="bg-primary/20">
                        Ready to use as video thumbnail
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 mr-2 text-green-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Thumbnail successfully generated!</p>
                      <p className="mt-1">Click "Use as Video Thumbnail" to include this thumbnail with your video, or download it to use later.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(isGeneratingThumbnail && !thumbnailUrl && !thumbnailError) && (
              <div className="h-[300px] flex flex-col items-center justify-center border rounded-lg bg-muted/50 text-center p-4 mt-6">
                <div className="relative w-24 h-24">
                  <div className="absolute animate-ping w-full h-full rounded-full bg-primary/30"></div>
                  <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/50">
                    <ImageIcon size={40} className="text-white" />
                  </div>
                </div>
                <p className="text-muted-foreground mt-6">Creating your thumbnail with Leonardo.ai...</p>
                <p className="text-xs text-muted-foreground mt-2">This typically takes 15-30 seconds</p>
              </div>
            )}

            {(!isGeneratingThumbnail && !thumbnailUrl && !thumbnailError) && (
               <div className="h-[300px] flex flex-col items-center justify-center border rounded-lg bg-muted/50 text-center p-4 mt-6">
                  <ImageIcon size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Enter a prompt and click "Generate Thumbnail".
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    A custom thumbnail will help your video stand out and get more views.
                  </p>
                </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ImageGenerator; 