"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Download, Play, Pause } from "lucide-react";
import { useState } from "react";

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [progress, setProgress] = useState(0);

  const handleGenerateVideo = () => {
    // Mock video generation with progress updates
    setIsLoading(true);
    setProgress(0);
    setVideoUrl("");
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          // Mock video URL
          setVideoUrl("https://example.com/mock-video.mp4");
          return 100;
        }
        return prev + 10;
      });
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Video Generator</h2>
          <p className="text-muted-foreground">
            Create videos using AI. Describe what you want to see.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="video-prompt">Video Description</Label>
            <Input
              id="video-prompt"
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={60}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleGenerateVideo}
          disabled={isLoading || !prompt}
        >
          {isLoading ? "Generating..." : "Generate Video"}
        </Button>

        {isLoading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Generating video...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Processing frames</span>
              <span>Rendering</span>
              <span>Finalizing</span>
            </div>
          </div>
        )}
      </div>

      {/* Generated Video */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Generated Video</h2>
          <p className="text-muted-foreground">
            Preview and download your AI-generated video.
          </p>
        </div>
        
        {!videoUrl ? (
          <div className="h-[400px] flex flex-col items-center justify-center border rounded-lg bg-muted/50">
            <Film size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {isLoading 
                ? "Processing your video..." 
                : "Your generated video will appear here"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Mock video player */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <div className="text-white text-center">
                <Film size={64} className="mx-auto mb-4 opacity-50" />
                <p>Mock Video Player</p>
                <p className="text-sm text-gray-400">
                  (In a real app, a video would play here)
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="text-white">
                    <Play size={16} className="mr-2" />
                    Play
                  </Button>
                  <div className="w-full mx-4">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full w-1/3"></div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white">
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Video info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">
                {prompt}
              </h3>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{duration} seconds</span>
                <span>Generated just now</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator; 