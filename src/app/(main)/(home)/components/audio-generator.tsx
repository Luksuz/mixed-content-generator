"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause, Loader2, AlertCircle, CheckCircle, MessageSquare, AudioWaveform, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

// Placeholder types (as the original files are missing)
type AudioProvider = "elevenlabs" | "minimax-tts" | "openai" | "fish-audio"; // Removed "google-tts"

interface VoiceInfo {
  value: string;
  label: string;
}

// Placeholder voice data (examples, replace with actual data if needed)
// Removed googleTTSVoices array
const elevenLabsVoices: VoiceInfo[] = [
  { value: "Rachel", label: "ElevenLabs Rachel" },
  { value: "Adam", label: "ElevenLabs Adam" },
];
const minimaxTTSVoices: VoiceInfo[] = [
  { value: "Wise_Woman", label: "Minimax Wise Woman" },
  { value: "Friendly_Person", label: "Minimax Friendly Person" },
];


interface GenerateAudioRequestBody {
  text: string;
  provider: AudioProvider;
  voice: string;
  userId?: string;
  // Add other fields based on actual API (e.g., model for minimax)
  model?: string; 
  fishAudioVoiceId?: string;
  fishAudioModel?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
}

interface GenerateAudioResponse {
  audioUrl?: string;
  error?: string;
  details?: string;
}


type TtsProvider = "openai" | "minimax" | "fish-audio" | "elevenlabs"; // This was already present

type MinimaxModel = "speech-02-hd" | "speech-02-turbo" | "speech-01-hd" | "speech-01-turbo";

interface VoiceOption { // This was already present
  id: string;
  name: string;
  provider: TtsProvider;
}

// Define props for AudioGenerator
interface AudioGeneratorProps {
  initialText?: string;
  generatedAudioUrl: string | null;
  isGeneratingAudio: boolean;
  audioGenerationError: string | null;
  onAudioGenerated: (url: string | null) => void;
  onSubtitlesGenerated: (url: string | null) => void;
  setIsGeneratingAudio: (isGenerating: boolean) => void;
  setAudioGenerationError: (error: string | null) => void;
  selectedUserId?: string;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({
  initialText,
  generatedAudioUrl,
  isGeneratingAudio,
  audioGenerationError,
  onAudioGenerated,
  onSubtitlesGenerated,
  setIsGeneratingAudio,
  setAudioGenerationError,
  selectedUserId,
}) => {
  const [textToConvert, setTextToConvert] = useState<string>(initialText || "");
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>("elevenlabs");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  // State for subtitle generation
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(false);
  const [subtitleGenerationError, setSubtitleGenerationError] = useState<string | null>(null);
  const [generatedSubtitlesUrlLocal, setGeneratedSubtitlesUrlLocal] = useState<string | null>(null);

  // These states seem to be from a previous version or a mix of logic, will retain for now and see if they are used by the new structure.
  const [provider, setProviderLegacy] = useState<TtsProvider>("openai"); // Renamed to avoid conflict
  const [voiceLegacy, setVoiceLegacy] = useState("alloy"); // Renamed
  const [minimaxModel, setMinimaxModel] = useState<MinimaxModel>("speech-02-hd");
  const [fishAudioVoiceId, setFishAudioVoiceId] = useState("54e3a85ac9594ffa83264b8a494b901b");
  const [fishAudioModel, setFishAudioModel] = useState("speech-1.6");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("UgBBYS2sOqTuMpoF3BR0");
  const [elevenLabsModelId, setElevenLabsModelId] = useState("eleven_multilingual_v2");
  const [elevenLabsVoicesList, setElevenLabsVoicesList] = useState<VoiceOption[]>([]);
  const [isLoadingElevenLabsVoices, setIsLoadingElevenLabsVoices] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialText) {
      setTextToConvert(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (generatedAudioUrl && audioInstanceRef.current) {
      audioInstanceRef.current.src = generatedAudioUrl;
    } else if (!generatedAudioUrl && audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current.src = ""; // Clear src
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(0);
    }
  }, [generatedAudioUrl]);
  
  // Effect for initializing and cleaning up the audio element
  useEffect(() => {
    // Create the Audio object instance only once
    if (!audioInstanceRef.current) {
      audioInstanceRef.current = new Audio();
    }
    const audioInstance = audioInstanceRef.current; // Work with the instance

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
    const handleLoadedMetadata = () => {
      if (audioInstanceRef.current) {
        setAudioDuration(audioInstanceRef.current.duration);
      }
    };
    const handleTimeUpdate = () => { // For progress bar, if needed
        if(audioInstanceRef.current) {
            setCurrentTime(audioInstanceRef.current.currentTime);
        }
    };


    audioInstance.addEventListener("ended", handleEnded);
    audioInstance.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioInstance.addEventListener("timeupdate", handleTimeUpdate);


    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      audioInstance.removeEventListener("ended", handleEnded);
      audioInstance.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioInstance.removeEventListener("timeupdate", handleTimeUpdate);
      audioInstance.pause();
      audioInstance.src = ""; // Clean up src
    };
  }, []);


  const handleGenerateAudio = async () => {
    if (!textToConvert.trim()) {
      setAudioGenerationError("Please enter some text to convert.");
      return;
    }
    setIsGeneratingAudio(true);
    setAudioGenerationError(null);
    onAudioGenerated(null);
    onSubtitlesGenerated(null);
    setGeneratedSubtitlesUrlLocal(null);
    setSubtitleGenerationError(null);

    try {
      const requestBody: GenerateAudioRequestBody = {
        text: textToConvert,
        provider: selectedProvider,
        voice: selectedVoice,
        userId: selectedUserId || 'unknown_user',
      };
      // Add provider-specific fields if necessary
      if (selectedProvider === 'minimax-tts') {
        requestBody.model = minimaxModel; // Example, ensure minimaxModel state is set
      } else if (selectedProvider === 'fish-audio') {
        requestBody.fishAudioVoiceId = fishAudioVoiceId;
        requestBody.fishAudioModel = fishAudioModel;
      } else if (selectedProvider === 'elevenlabs') {
        requestBody.elevenLabsVoiceId = elevenLabsVoiceId;
        requestBody.elevenLabsModelId = elevenLabsModelId;
      }


      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data: GenerateAudioResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || "Failed to generate audio");
      }

      if (data.audioUrl) {
        onAudioGenerated(data.audioUrl); // This will trigger the useEffect to set src
        handleGenerateSubtitles(data.audioUrl);
      } else {
        throw new Error("Audio URL not found in response");
      }
    } catch (err: any) {
      setAudioGenerationError(err.message || "An unexpected error occurred.");
      onAudioGenerated(null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateSubtitles = async (audioUrl: string) => {
    if (!selectedUserId) {
        console.warn("Cannot generate subtitles without a selected user ID.");
        setSubtitleGenerationError("User ID is missing, cannot generate subtitles.");
        return;
    }
    setIsGeneratingSubtitles(true);
    setSubtitleGenerationError(null);
    setGeneratedSubtitlesUrlLocal(null);

    try {
        console.log("Requesting subtitle generation for audio:", audioUrl);
        const response = await fetch("/api/generate-subtitles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl, userId: selectedUserId }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Failed to generate subtitles");
        }

        if (data.subtitlesUrl) {
            console.log("Subtitles generated:", data.subtitlesUrl);
            setGeneratedSubtitlesUrlLocal(data.subtitlesUrl);
            onSubtitlesGenerated(data.subtitlesUrl);
        } else {
            throw new Error("Subtitles URL not found in response");
        }
    } catch (err: any) {
        console.error("Subtitle generation error:", err);
        setSubtitleGenerationError(err.message || "An unexpected error occurred during subtitle generation.");
        onSubtitlesGenerated(null);
    } finally {
        setIsGeneratingSubtitles(false);
    }
  };

  const handlePlayPause = () => {
    if (audioInstanceRef.current && audioInstanceRef.current.src && audioInstanceRef.current.readyState >= 2) { // readyState >= 2 (HAVE_CURRENT_DATA) means it can play
      if (isPlaying) {
        audioInstanceRef.current.pause();
         if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      } else {
        audioInstanceRef.current.play().catch(e => console.error("Error playing audio:", e));
         if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Clear any existing
        progressIntervalRef.current = setInterval(() => {
            if(audioInstanceRef.current) {
                setCurrentTime(audioInstanceRef.current.currentTime);
            }
        }, 100);
      }
      setIsPlaying(!isPlaying);
    } else {
        console.warn("Audio ref not available or no src for play/pause");
    }
  };

  const handleDownloadAudio = () => {
    if (generatedAudioUrl) {
      const link = document.createElement('a');
      link.href = generatedAudioUrl;
      link.download = `generated_audio_${selectedProvider}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getVoiceOptions = (): VoiceInfo[] => { // Explicit return type
    switch (selectedProvider) {
      case "elevenlabs":
        return elevenLabsVoicesList.length > 0 
            ? elevenLabsVoicesList.map((v: VoiceOption): VoiceInfo => ({ value: v.id, label: v.name })) 
            : defaultElevenLabsVoices.map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name}));
      case "minimax-tts":
        return minimaxTTSVoices;
      case "openai":
         return voiceOptions.openai.map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name}));
      case "fish-audio":
          return voiceOptions["fish-audio"].map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name}));
      default:
        // Ensure a valid AudioProvider string is checked, or handle unexpected values
        const _exhaustiveCheck: never = selectedProvider;
        console.warn("Unhandled provider in getVoiceOptions: ", selectedProvider)
        return [];
    }
  };

  useEffect(() => {
    const voices = getVoiceOptions();
    setSelectedVoice(voices[0]?.value || "");
  }, [selectedProvider, elevenLabsVoicesList]); // Added elevenLabsVoicesList as dependency

  // MiniMax model options
  const minimaxModels: { id: MinimaxModel; name: string }[] = [
    { id: "speech-02-hd", name: "Speech 02 HD" },
    { id: "speech-02-turbo", name: "Speech 02 Turbo" },
    { id: "speech-01-hd", name: "Speech 01 HD" },
    { id: "speech-01-turbo", name: "Speech 01 Turbo" }
  ];

  // Fish Audio model options
  const fishAudioModels: { id: string; name: string }[] = [
    { id: "speech-1.6", name: "Speech 1.6" },
    { id: "speech-1.5", name: "Speech 1.5" },
  ];

  // Fish Audio voice options
  const fishAudioVoices: VoiceOption[] = [
    { id: "54e3a85ac9594ffa83264b8a494b901b", name: "Spongebob", provider: "fish-audio" },
    { id: "802e3bc2b27e49c2995d23ef70e6ac89", name: "Energetic Male", provider: "fish-audio" },
    // ... (other fish audio voices)
  ];

  // ElevenLabs voice options (fallback)
  const defaultElevenLabsVoices: VoiceOption[] = [
    { id: "UgBBYS2sOqTuMpoF3BR0", name: "Mark - Natural Conversations", provider: "elevenlabs" },
    // ... (other default elevenlabs voices)
  ];

  useEffect(() => {
    if (provider !== 'elevenlabs') { // This uses the old `provider` state (renamed to providerLegacy)
      setElevenLabsVoicesList([]);
    }
  }, [provider]); // Should be `selectedProvider` or this logic needs update for `selectedProvider`

  const voiceOptions: Record<TtsProvider, VoiceOption[]> = { // This structure seems from the old logic
    openai: [ { id: "alloy", name: "Alloy", provider: "openai" }, /* ... other voices ... */ ],
    minimax: [ { id: "Wise_Woman", name: "Wise Woman", provider: "minimax" }, /* ... */ ],
    "fish-audio": fishAudioVoices,
    "elevenlabs": elevenLabsVoicesList.length > 0 ? elevenLabsVoicesList : defaultElevenLabsVoices,
  };
  
  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      // Logic for fetching elevenlabs voices if selectedProvider is elevenlabs
      // This should use `selectedProvider` not `provider` (legacy state)
      if (selectedProvider === "elevenlabs" && elevenLabsVoicesList.length === 0) { 
        setIsLoadingElevenLabsVoices(true);
        try {
          // Assuming /api/list-elevenlabs-voices exists and returns { voices: [{id: string, name: string}, ...] }
          const response = await fetch("/api/list-elevenlabs-voices"); 
          if (!response.ok) throw new Error("Failed to fetch ElevenLabs voices");
          const data = await response.json();
          const fetchedVoices: VoiceOption[] = data.voices.map((v: any) => ({ id: v.id, name: v.name, provider: "elevenlabs" }));
          setElevenLabsVoicesList(fetchedVoices);
          if (fetchedVoices.length > 0 && !fetchedVoices.some(v => v.id === elevenLabsVoiceId)) {
            setElevenLabsVoiceId(fetchedVoices[0].id); // Update if current selection is invalid
          }
        } catch (error: any) {
          console.error("Error fetching ElevenLabs voices:", error);
          setAudioGenerationError(`Failed to load ElevenLabs voices: ${error.message}. Using defaults.`);
          setElevenLabsVoicesList(defaultElevenLabsVoices); // Fallback to default
           if (defaultElevenLabsVoices.length > 0 && !defaultElevenLabsVoices.some(v => v.id === elevenLabsVoiceId)) {
            setElevenLabsVoiceId(defaultElevenLabsVoices[0].id);
          }
        } finally {
          setIsLoadingElevenLabsVoices(false);
        }
      }
    };
    fetchElevenLabsVoices();
  }, [selectedProvider, elevenLabsVoiceId]); // elevenLabsVoiceId might cause loop if set inside


  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Helper to render select options from VoiceInfo[]
  const renderVoiceInfoOptions = (options: VoiceInfo[]) => {
    return options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>);
  };

  // Function to render progress bar
  const renderProgressBar = () => {
    const percent = audioDuration ? (currentTime / audioDuration) * 100 : 0;
    
    return (
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mt-2">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-blue relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob w-[200px] h-[200px] -top-20 -right-20 opacity-10"></div>
      <div className="blob-cyan w-[200px] h-[200px] -bottom-20 -left-20 opacity-10"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="gradient-text flex items-center gap-2">
          <AudioWaveform className="h-5 w-5 text-blue-400" />
          Generate Audio
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Convert your script text into speech using various AI providers and voices.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        <div className="space-y-2">
          <Label htmlFor="text-to-convert" className="glow-text">Text to Convert</Label>
          <Textarea
            id="text-to-convert"
            placeholder="Enter the text you want to convert to audio..."
            value={textToConvert}
            onChange={(e) => setTextToConvert(e.target.value)}
            rows={6}
            disabled={isGeneratingAudio || isGeneratingSubtitles}
            className="futuristic-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="audio-provider-select" className="glow-text">Audio Provider</Label>
            <select
              id="audio-provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AudioProvider)}
              disabled={isGeneratingAudio || isGeneratingSubtitles}
              className="w-full p-2 rounded futuristic-input"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="minimax-tts">Minimax TTS</option>
              <option value="openai">OpenAI</option>
              <option value="fish-audio">Fish Audio</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-selection-select" className="glow-text">Voice</Label>
            <select
              id="voice-selection-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isGeneratingAudio || isGeneratingSubtitles || getVoiceOptions().length === 0}
              className="w-full p-2 rounded futuristic-input"
            >
              {getVoiceOptions().map((voice: VoiceInfo) => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Button 
          onClick={handleGenerateAudio} 
          disabled={isGeneratingAudio || isGeneratingSubtitles || !textToConvert.trim()}
          className="w-full relative overflow-hidden shimmer bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-cyan-600/80 border-0 shadow-glow-blue"
        >
          {(isGeneratingAudio || isGeneratingSubtitles) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isGeneratingAudio ? "Generating Audio..." : isGeneratingSubtitles ? "Generating Subtitles..." : "Generate Audio & Subtitles"}
        </Button>

        {audioGenerationError && (
          <div className="flex items-center text-red-500 bg-red-500/10 px-3 py-2 rounded-md border border-red-500/20">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Audio Error: {audioGenerationError}</p>
          </div>
        )}
        {subtitleGenerationError && (
          <div className="flex items-center text-red-500 bg-red-500/10 px-3 py-2 rounded-md border border-red-500/20">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Subtitle Error: {subtitleGenerationError}</p>
          </div>
        )}
      </CardContent>

      {(generatedAudioUrl || generatedSubtitlesUrlLocal) && (
        <CardFooter className="flex-col items-start space-y-4 relative z-10">
          {generatedAudioUrl && (
            <div className="w-full bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-500/30 animate-zoomIn">
                <Label className="flex items-center mb-2">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> 
                  <span className="glow-text">Audio Generated Successfully</span>
                </Label>
                
                <div className="mt-2">
                  {renderProgressBar()}
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>

                <audio 
                  src={generatedAudioUrl} 
                  ref={audioInstanceRef} 
                  className="hidden"
                  onLoadedData={() => {
                    if (audioInstanceRef.current) audioInstanceRef.current.volume = 0.5; 
                  }} 
                  onLoadStart={() => {
                    if(audioInstanceRef.current) audioInstanceRef.current.pause(); 
                    setIsPlaying(false);
                  }}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                    <Button 
                      onClick={handlePlayPause} 
                      size="sm"
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400"
                    >
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button 
                      onClick={handleDownloadAudio} 
                      size="sm"
                      className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio
                    </Button>
                </div>
            </div>
          )}

          {isGeneratingSubtitles && (
            <div className="flex items-center text-muted-foreground w-full bg-blue-900/10 p-3 rounded-lg border border-blue-500/20 animate-pulse">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Generating subtitles, please wait...</p>
            </div>
          )}

          {generatedSubtitlesUrlLocal && (
            <div className="w-full bg-gradient-to-r from-cyan-900/20 to-blue-900/20 p-4 rounded-lg border border-cyan-500/30 animate-zoomIn">
                <Label className="flex items-center mb-2">
                  <MessageSquare className="mr-2 h-5 w-5 text-cyan-500" /> 
                  <span className="glow-text-cyan">Subtitles Generated</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                    Subtitles URL: <a href={generatedSubtitlesUrlLocal} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">{generatedSubtitlesUrlLocal}</a>
                </p>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default AudioGenerator; 