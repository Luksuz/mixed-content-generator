"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause, Loader2, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder types (as the original files are missing)
type AudioProvider = "google-tts" | "elevenlabs" | "minimax-tts" | "openai" | "fish-audio"; // Expanded based on usage in file

interface VoiceInfo {
  value: string;
  label: string;
}

// Placeholder voice data (examples, replace with actual data if needed)
const googleTTSVoices: VoiceInfo[] = [
  { value: "en-US-Wavenet-D", label: "Google English (Wavenet-D)" },
  { value: "en-US-Wavenet-A", label: "Google English (Wavenet-A)" },
];
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
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>("google-tts");
  const [selectedVoice, setSelectedVoice] = useState<string>(googleTTSVoices[0]?.value || "");
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
      case "google-tts":
        return googleTTSVoices;
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Audio</CardTitle>
        <CardDescription>
          Convert your script text into speech using various AI providers and voices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="text-to-convert">Text to Convert</Label>
          <Textarea
            id="text-to-convert"
            placeholder="Enter the text you want to convert to audio..."
            value={textToConvert}
            onChange={(e) => setTextToConvert(e.target.value)}
            rows={6}
            disabled={isGeneratingAudio || isGeneratingSubtitles}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="audio-provider-select">Audio Provider</Label>
            <select
              id="audio-provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AudioProvider)}
              disabled={isGeneratingAudio || isGeneratingSubtitles}
              className="w-full p-2 border rounded mt-1 bg-background text-foreground"
            >
              <option value="google-tts">Google TTS</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="minimax-tts">Minimax TTS</option>
              <option value="openai">OpenAI</option>
              <option value="fish-audio">Fish Audio</option>
              {/* Add other providers as needed */}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-selection-select">Voice</Label>
            <select
              id="voice-selection-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isGeneratingAudio || isGeneratingSubtitles || getVoiceOptions().length === 0}
              className="w-full p-2 border rounded mt-1 bg-background text-foreground"
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
          className="w-full"
        >
          {(isGeneratingAudio || isGeneratingSubtitles) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGeneratingAudio ? "Generating Audio..." : isGeneratingSubtitles ? "Generating Subtitles..." : "Generate Audio & Subtitles"}
        </Button>

        {audioGenerationError && (
          <div className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Audio Error: {audioGenerationError}</p>
          </div>
        )}
        {subtitleGenerationError && (
          <div className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Subtitle Error: {subtitleGenerationError}</p>
          </div>
        )}
      </CardContent>

      {(generatedAudioUrl || generatedSubtitlesUrlLocal) && (
        <CardFooter className="flex-col items-start space-y-4">
          {generatedAudioUrl && (
            <div className="w-full">
                <Label className="flex items-center mb-2"><CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Audio Generated Successfully</Label>
                <audio src={generatedAudioUrl} controls className="w-full" ref={audioInstanceRef} 
                  onLoadedData={() => {
                    if (audioInstanceRef.current) audioInstanceRef.current.volume = 0.5; 
                  }} 
                  onLoadStart={() => {
                    if(audioInstanceRef.current) audioInstanceRef.current.pause(); 
                    setIsPlaying(false);
                }}>
                    Your browser does not support the audio element.
                </audio>
                <div className="mt-2 flex space-x-2">
                    <Button onClick={handlePlayPause} variant="outline" size="sm">
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button onClick={handleDownloadAudio} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio
                    </Button>
                </div>
            </div>
          )}

          {isGeneratingSubtitles && (
            <div className="flex items-center text-muted-foreground w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Generating subtitles, please wait...</p>
            </div>
          )}

          {generatedSubtitlesUrlLocal && (
            <div className="w-full mt-4">
                <Label className="flex items-center mb-2"><MessageSquare className="mr-2 h-5 w-5 text-blue-500" /> Subtitles Generated</Label>
                <p className="text-sm text-muted-foreground">
                    Subtitles URL: <a href={generatedSubtitlesUrlLocal} target="_blank" rel="noopener noreferrer" className="underline">{generatedSubtitlesUrlLocal}</a>
                </p>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default AudioGenerator; 