"use client";

import { useState } from "react";
import ScriptGenerator from "./components/script-generator";
import AudioGenerator from "./components/audio-generator";
import ImageGenerator from "./components/image-generator";
import VideoGenerator from "./components/video-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Volume2, Image, Film } from "lucide-react";

const GeneratorsPage = () => {
  const [activeTab, setActiveTab] = useState("script");

  return (
    <div className="container py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Content Generator</h1>
        <p className="text-muted-foreground">
          Create amazing content using AI. Generate scripts, audio, images, and videos with ease.
        </p>
      </div>
      
      <Tabs defaultValue="script" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="script" className="flex items-center gap-2">
            <FileText size={18} />
            <span className="hidden sm:inline">Script</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 size={18} />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image size={18} />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Film size={18} />
            <span className="hidden sm:inline">Video</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="script" className="mt-0">
          <ScriptGenerator />
        </TabsContent>
        
        <TabsContent value="audio" className="mt-0">
          <AudioGenerator />
        </TabsContent>
        
        <TabsContent value="image" className="mt-0">
          <ImageGenerator />
        </TabsContent>
        
        <TabsContent value="video" className="mt-0">
          <VideoGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneratorsPage;
