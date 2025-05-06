"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type TtsProvider = "openai" | "minimax";

type MinimaxModel = "speech-02-hd" | "speech-02-turbo" | "speech-01-hd" | "speech-01-turbo";

interface VoiceOption {
  id: string;
  name: string;
  provider: TtsProvider;
}

interface AudioResponse {
  success: boolean;
  audioUrl: string;
  duration: number;
  provider: TtsProvider;
  voice: string;
}

const AudioGenerator = () => {
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<TtsProvider>("openai");
  const [voice, setVoice] = useState("alloy");
  const [minimaxModel, setMinimaxModel] = useState<MinimaxModel>("speech-02-hd");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // MiniMax model options
  const minimaxModels: { id: MinimaxModel; name: string }[] = [
    { id: "speech-02-hd", name: "Speech 02 HD" },
    { id: "speech-02-turbo", name: "Speech 02 Turbo" },
    { id: "speech-01-hd", name: "Speech 01 HD" },
    { id: "speech-01-turbo", name: "Speech 01 Turbo" }
  ];

  // Voice options by provider
  const voiceOptions: Record<TtsProvider, VoiceOption[]> = {
    openai: [
      { id: "alloy", name: "Alloy", provider: "openai" },
      { id: "echo", name: "Echo", provider: "openai" },
      { id: "fable", name: "Fable", provider: "openai" },
      { id: "onyx", name: "Onyx", provider: "openai" },
      { id: "nova", name: "Nova", provider: "openai" },
      { id: "shimmer", name: "Shimmer", provider: "openai" },
      { id: "ash", name: "Ash", provider: "openai" },
      { id: "ballad", name: "Ballad", provider: "openai" },
      { id: "coral", name: "Coral", provider: "openai" },
      { id: "sage", name: "Sage", provider: "openai" },
    ],
    minimax: [
      { id: "Wise_Woman", name: "Wise Woman", provider: "minimax" },
      { id: "Friendly_Person", name: "Friendly Person", provider: "minimax" },
      { id: "Inspirational_girl", name: "Inspirational Girl", provider: "minimax" },
      { id: "Deep_Voice_Man", name: "Deep Voice Man", provider: "minimax" },
      { id: "Calm_Woman", name: "Calm Woman", provider: "minimax" },
      { id: "Casual_Guy", name: "Casual Guy", provider: "minimax" },
      { id: "Lively_Girl", name: "Lively Girl", provider: "minimax" },
      { id: "Patient_Man", name: "Patient Man", provider: "minimax" },
      { id: "Young_Knight", name: "Young Knight", provider: "minimax" },
      { id: "Determined_Man", name: "Determined Man", provider: "minimax" },
      { id: "Lovely_Girl", name: "Lovely Girl", provider: "minimax" },
      { id: "Decent_Boy", name: "Decent Boy", provider: "minimax" },
      { id: "Imposing_Manner", name: "Imposing Manner", provider: "minimax" },
      { id: "Elegant_Man", name: "Elegant Man", provider: "minimax" },
      { id: "Abbess", name: "Abbess", provider: "minimax" },
      { id: "Sweet_Girl_2", name: "Sweet Girl 2", provider: "minimax" },
      { id: "Exuberant_Girl", name: "Exuberant Girl", provider: "minimax" },
      { id: "Grinch", name: "Grinch", provider: "minimax" },
    ],
  };

  // Initialize or clean up audio element
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Event listeners
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      });
      
      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
        }
      });
    }
    
    // Clean up on component unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  
  // Update audio source when URL changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const handleGenerateAudio = async () => {
    try {
      setIsLoading(true);
      setAudioUrl("");
      setIsPlaying(false);
      setCurrentTime(0);
      
      const selectedVoiceOption = voiceOptions[provider].find(v => v.id === voice);
      if (selectedVoiceOption) {
        setSelectedVoiceName(selectedVoiceOption.name);
      }
      
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text, 
          provider, 
          voice,
          model: provider === "minimax" ? minimaxModel : undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }
      
      const data: AudioResponse = await response.json();
      setAudioUrl(data.audioUrl);
      setAudioDuration(data.duration);
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      audioRef.current.play();
      // Update progress bar
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle provider change
  const handleProviderChange = (newProvider: TtsProvider) => {
    setProvider(newProvider);
    // Select first voice from the new provider
    setVoice(voiceOptions[newProvider][0].id);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = audioDuration > 0 
    ? (currentTime / audioDuration) * 100 
    : 0;

  // Handle download
  const handleDownload = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${provider}-${voice}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Audio Generator</h2>
          <p className="text-muted-foreground">
            Create spoken audio from text using AI voices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="text-to-speak">Text to Speak</Label>
            <Textarea
              id="text-to-speak"
              placeholder="Enter the text you want to convert to speech..."
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} characters ({Math.max(0, 5000 - text.length)} remaining)
            </p>
          </div>

          {/* TTS Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">TTS Provider</Label>
            <div className="flex p-1 gap-1 rounded-md bg-muted">
              <Button 
                variant={provider === "openai" ? "default" : "ghost"} 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleProviderChange("openai")}
              >
                OpenAI
              </Button>
              <Button 
                variant={provider === "minimax" ? "default" : "ghost"} 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleProviderChange("minimax")}
              >
                MiniMax
              </Button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="voice">Voice</Label>
            <select
              id="voice"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              {voiceOptions[provider].map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {provider === "minimax" && (
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="model">MiniMax Model</Label>
              <div className="flex p-1 gap-1 rounded-md bg-muted">
                {minimaxModels.map((model) => (
                  <Button 
                    key={model.id}
                    variant={minimaxModel === model.id ? "default" : "ghost"} 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => setMinimaxModel(model.id)}
                  >
                    {model.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end">
            <Button 
              className="w-full" 
              onClick={handleGenerateAudio}
              disabled={isLoading || !text.trim()}
            >
              {isLoading ? "Generating..." : "Generate Audio"}
            </Button>
          </div>
        </div>
      </div>

      {/* Generated Audio */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Generated Audio</h2>
          <p className="text-muted-foreground">
            Listen to and download your AI-generated audio.
          </p>
        </div>
        
        {!audioUrl ? (
          <div className="h-[200px] flex flex-col items-center justify-center border rounded-lg bg-muted/50">
            <Volume2 size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {isLoading 
                ? "Generating your audio..." 
                : "Your generated audio will appear here"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {/* Audio player */}
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <Volume2 size={48} className="text-primary" />
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <Button 
                  onClick={togglePlayback} 
                  size="sm" 
                  variant="outline" 
                  className="w-20"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={16} className="mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="w-full bg-muted rounded-full h-1.5 my-2">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-100" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>
            
            <div className="border-t p-4">
              <h3 className="text-sm font-medium mb-1">
                Generated with {provider.toUpperCase()} - {selectedVoiceName || voice}
                {provider === "minimax" && ` (${minimaxModel})`}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {text}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioGenerator; 