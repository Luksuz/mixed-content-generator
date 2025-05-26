"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause, Loader2, AlertCircle, CheckCircle, MessageSquare, AudioWaveform, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  mockAudioUrl,
  mockSubtitlesUrl,
  simulateAudioGenerationLoading,
} from "@/lib/mock-data";

type AudioProvider = "elevenlabs" | "minimax-tts" | "openai" | "fish-audio";
type TtsProvider = "openai" | "minimax" | "fish-audio" | "elevenlabs";
type MinimaxModel = "speech-02-hd" | "speech-02-turbo" | "speech-01-hd" | "speech-01-turbo";

interface VoiceInfo {
  value: string;
  label: string;
}

interface VoiceOption {
  id: string;
  name: string;
  provider: TtsProvider;
}

// Voice options for each provider (using VoiceInfo format for UI)
const elevenLabsVoices: VoiceInfo[] = [
  { value: "Rachel", label: "ElevenLabs Rachel (Female)" },
  { value: "Bella", label: "ElevenLabs Bella (Female)" },
  { value: "Elli", label: "ElevenLabs Elli (Female)" },
  { value: "Adam", label: "ElevenLabs Adam (Male)" },
];

const minimaxTTSVoices: VoiceInfo[] = [
  { value: "Wise_Woman", label: "Minimax Wise Woman (Female)" },
  { value: "Female_Narrator", label: "Minimax Female Narrator (Female)" },
  { value: "Friendly_Person", label: "Minimax Friendly Person (Male)" },
];

const openAIVoices: VoiceInfo[] = [
  { value: "nova", label: "OpenAI Nova (Female)" },
  { value: "shimmer", label: "OpenAI Shimmer (Female)" },
  { value: "alloy", label: "OpenAI Alloy (Neutral)" },
  { value: "echo", label: "OpenAI Echo (Male)" },
  { value: "fable", label: "OpenAI Fable (Male)" },
  { value: "onyx", label: "OpenAI Onyx (Male)" },
];

const fishAudioVoices: VoiceInfo[] = [
  { value: "female_narrator_1", label: "Fish Audio Female Narrator 1 (Female)" },
  { value: "female_narrator_2", label: "Fish Audio Female Narrator 2 (Female)" },
  { value: "male_narrator_1", label: "Fish Audio Male Narrator 1 (Male)" },
];

// Default ElevenLabs voices for API fallback (using VoiceOption format)
const defaultElevenLabsVoices: VoiceOption[] = [
  { id: "UgBBYS2sOqTuMpoF3BR0", name: "Mark - Natural Conversations", provider: "elevenlabs" },
  { id: "Rachel", name: "Rachel (Female)", provider: "elevenlabs" },
  { id: "Bella", name: "Bella (Female)", provider: "elevenlabs" },
  { id: "Elli", name: "Elli (Female)", provider: "elevenlabs" },
];

// Fish Audio voice options for API
const fishAudioVoiceOptions: VoiceOption[] = [
  { id: "54e3a85ac9594ffa83264b8a494b901b", name: "Spongebob", provider: "fish-audio" },
  { id: "802e3bc2b27e49c2995d23ef70e6ac89", name: "Energetic Male", provider: "fish-audio" },
];

interface GenerateAudioRequestBody {
  text: string;
  provider: AudioProvider;
  voice: string;
  userId?: string;
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
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>("minimax-tts");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  // State for subtitle generation
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(false);
  const [subtitleGenerationError, setSubtitleGenerationError] = useState<string | null>(null);
  const [generatedSubtitlesUrlLocal, setGeneratedSubtitlesUrlLocal] = useState<string | null>(null);

  // Legacy states for API compatibility
  const [provider, setProviderLegacy] = useState<TtsProvider>("openai");
  const [voiceLegacy, setVoiceLegacy] = useState("alloy");
  const [minimaxModel, setMinimaxModel] = useState<MinimaxModel>("speech-02-hd");
  const [fishAudioVoiceId, setFishAudioVoiceId] = useState("54e3a85ac9594ffa83264b8a494b901b");
  const [fishAudioModel, setFishAudioModel] = useState("speech-1.6");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("UgBBYS2sOqTuMpoF3BR0");
  const [elevenLabsModelId, setElevenLabsModelId] = useState("eleven_multilingual_v2");
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get voice options based on selected provider
  const getVoiceOptions = useCallback((): VoiceInfo[] => {
    switch (selectedProvider) {
      case "elevenlabs":
        return elevenLabsVoices;
      case "minimax-tts":
        return minimaxTTSVoices;
      case "openai":
         return openAIVoices;
      case "fish-audio":
          return fishAudioVoices;
      default:
        const _exhaustiveCheck: never = selectedProvider;
        console.warn("Unhandled provider in getVoiceOptions: ", selectedProvider)
        return [];
    }
  }, [selectedProvider]);

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
      audioInstanceRef.current.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(0);
    }
  }, [generatedAudioUrl]);
  
  // Effect for initializing and cleaning up the audio element
  useEffect(() => {
    if (!audioInstanceRef.current) {
      audioInstanceRef.current = new Audio();
    }
    const audioInstance = audioInstanceRef.current;

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
    const handleTimeUpdate = () => {
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
      audioInstance.src = "";
    };
  }, []);

  useEffect(() => {
    const voices = getVoiceOptions();
    setSelectedVoice(voices[0]?.value || "");
  }, [getVoiceOptions]);

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
      await simulateAudioGenerationLoading(); // Simulate API call delay

      onAudioGenerated(mockAudioUrl);
      // Optionally set mock subtitles if you have them and want to display them
      // onSubtitlesGenerated(mockSubtitlesUrl);
      // setGeneratedSubtitlesUrlLocal(mockSubtitlesUrl); // if using local state for subtitles

    } catch (error: any) {
      setAudioGenerationError(error.message || "An unexpected error occurred.");
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
          className="h-full bg-gradient-to-r from-red-500 to-red-700"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  return (
    <Card className="w-full futuristic-card animate-fadeIn shadow-glow-red relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob w-[200px] h-[200px] -top-20 -right-20 opacity-10"></div>
      
      <CardHeader className="relative z-10 pt-4 pb-2">
        <CardTitle className="gradient-text flex items-center gap-2">
          <AudioWaveform className="h-5 w-5 text-red-400" />
          Generate Audio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10 pt-4 pb-6">
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
            
            <option value="minimax-tts">Minimax TTS</option>
              <option value="elevenlabs">ElevenLabs</option>
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
          className="w-full relative overflow-hidden shimmer bg-gradient-to-r from-red-600/80 via-red-700/80 to-red-800/80 border-0 shadow-glow-red"
        >
          {(isGeneratingAudio || isGeneratingSubtitles) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isGeneratingAudio ? "Generating Audio..." : isGeneratingSubtitles ? "Generating Subtitles..." : "Generate Audio & Subtitles"}
        </Button>

        {/* Audio Generation Loading Animation */}
        {isGeneratingAudio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 backdrop-blur-md bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-700/30 rounded-lg p-4"
          >
            <div>
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Loader2 className="h-5 w-5 text-red-400 animate-spin" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-200 to-pink-400">
                  Audio Generation in Progress
                </span>
              </Label>
              <p className="text-sm text-slate-300 ml-7">
                Neural voice synthesis processing your text content...
              </p>
            </div>
            <div className="border border-red-700/30 rounded-md p-4 bg-black/20 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-pink-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-red-600 animate-spin" style={{ animationDuration: '3s' }}></div>
                </div>
                <p className="text-red-200 text-sm">
                  Estimated completion: ~15 seconds
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
            <div className="w-full bg-gradient-to-r from-red-900/20 to-red-800/20 p-4 rounded-lg border border-red-500/30 animate-zoomIn">
                <Label className="flex items-center mb-2">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> 
                  <span className="glow-text-red">Audio Generated Successfully</span>
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
                      className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400"
                    >
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button 
                      onClick={handleDownloadAudio} 
                      size="sm"
                      className="bg-red-700/20 hover:bg-red-700/30 border border-red-600/30 text-red-300"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio
                    </Button>
                </div>
            </div>
          )}

          {isGeneratingSubtitles && (
            <div className="flex items-center text-muted-foreground w-full bg-red-900/10 p-3 rounded-lg border border-red-500/20 animate-pulse">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Generating subtitles, please wait...</p>
            </div>
          )}

          {generatedSubtitlesUrlLocal && (
            <div className="w-full bg-gradient-to-r from-red-900/20 to-red-800/20 p-4 rounded-lg border border-red-500/30 animate-zoomIn">
                <Label className="flex items-center mb-2">
                  <MessageSquare className="mr-2 h-5 w-5 text-red-500" /> 
                  <span className="glow-text-red">Subtitles Generated</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                    Subtitles URL: <a href={generatedSubtitlesUrlLocal} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline transition-colors">{generatedSubtitlesUrlLocal}</a>
                </p>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default AudioGenerator; 