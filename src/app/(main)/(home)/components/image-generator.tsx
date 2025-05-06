"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Download } from "lucide-react";
import { useState } from "react";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleGenerateImages = () => {
    // Mock image generation
    setIsLoading(true);
    setTimeout(() => {
      // Mock image URLs (using placeholder images)
      const mockImages = [
        "https://placehold.co/600x400/3b82f6/ffffff?text=AI+Generated+Image+1",
        "https://placehold.co/600x400/818cf8/ffffff?text=AI+Generated+Image+2",
        "https://placehold.co/600x400/6366f1/ffffff?text=AI+Generated+Image+3",
        "https://placehold.co/600x400/4f46e5/ffffff?text=AI+Generated+Image+4",
      ];
      setImages(mockImages);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Image Generator</h2>
          <p className="text-muted-foreground">
            Create images using AI. Describe what you want to see.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="prompt">Image Description</Label>
            <Input
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <select
              id="style"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="realistic">Realistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="abstract">Abstract</option>
              <option value="sketch">Sketch</option>
              <option value="painting">Painting</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              className="w-full" 
              onClick={handleGenerateImages}
              disabled={isLoading || !prompt}
            >
              {isLoading ? "Generating..." : "Generate Images"}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Images */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Generated Images</h2>
          <p className="text-muted-foreground">
            Click on any image to download or edit.
          </p>
        </div>
        
        {images.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center border rounded-lg bg-muted/50">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin mb-4">
                  <Image size={48} className="text-primary opacity-50" />
                </div>
                <p className="text-muted-foreground">Generating your images...</p>
              </div>
            ) : (
              <div className="text-center">
                <Image size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Your generated images will appear here
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group border rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button size="sm" variant="secondary">
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator; 