"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type TtsProvider = "openai" | "minimax" | "fish-audio" | "elevenlabs";

type MinimaxModel = "speech-02-hd" | "speech-02-turbo" | "speech-01-hd" | "speech-01-turbo";

interface VoiceOption {
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
  setIsGeneratingAudio: React.Dispatch<React.SetStateAction<boolean>>;
  setAudioGenerationError: React.Dispatch<React.SetStateAction<string | null>>;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({
  initialText,
  generatedAudioUrl,
  isGeneratingAudio,
  audioGenerationError,
  onAudioGenerated,
  setIsGeneratingAudio,
  setAudioGenerationError,
}) => {
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<TtsProvider>("openai");
  const [voice, setVoice] = useState("alloy");
  const [minimaxModel, setMinimaxModel] = useState<MinimaxModel>("speech-02-hd");
  const [fishAudioVoiceId, setFishAudioVoiceId] = useState("54e3a85ac9594ffa83264b8a494b901b");
  const [fishAudioModel, setFishAudioModel] = useState("speech-1.6");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("UgBBYS2sOqTuMpoF3BR0");
  const [elevenLabsModelId, setElevenLabsModelId] = useState("eleven_multilingual_v2");
  const [elevenLabsVoicesList, setElevenLabsVoicesList] = useState<VoiceOption[]>([]);
  const [isLoadingElevenLabsVoices, setIsLoadingElevenLabsVoices] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // useEffect to update text state when initialText prop changes
  useEffect(() => {
    if (initialText !== undefined) {
      setText(initialText);
    }
  }, [initialText]);

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
    { id: "e58b0d7efca34eb38d5c4985e378abcb", name: "Trump", provider: "fish-audio" },
    { id: "ef9c79b62ef34530bf452c0e50e3c260", name: "Horror", provider: "fish-audio" },
    { id: "59e9dc1cb20c452584788a2690c80970", name: "ALLE", provider: "fish-audio" },
    { id: "cc1d2d26fddf487496c74a7f40c7c871", name: "MrBeast", provider: "fish-audio" },
  ];

  // ElevenLabs voice options (fallback)
  const defaultElevenLabsVoices: VoiceOption[] = [
    { id: "UgBBYS2sOqTuMpoF3BR0", name: "Mark - Natural Conversations", provider: "elevenlabs" },
    { id: "mhgBlD8CmCSdwLDOIJpA", name: "Pulse – Social Media News", provider: "elevenlabs" },
    { id: "1t1EeRixsJrKbiF1zwM6", name: "Jerry B. - Hyper-Real & Conversational", provider: "elevenlabs" },
    { id: "KTPVrSVAEUSJRClDzBw7", name: "Cowboy Bob // VF", provider: "elevenlabs" },
    { id: "OAAjJsQDvpg3sVjiLgyl", name: "Denisa - HQ soft voice", provider: "elevenlabs" },
    { id: "9PVP7ENhDskL0KYHAKtD", name: "Jerry Beharry - Southern/Cowboy", provider: "elevenlabs" },
    { id: "8zVLKDloqujrRa4Uwnk7", name: "Wright - authoritative and deep", provider: "elevenlabs" },
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", provider: "elevenlabs" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", provider: "elevenlabs" },
    { id: "2EiwWnXFnvU5JabPnv8n", name: "Clyde", provider: "elevenlabs" },
  ];

  // UseEffect to reset voice list if provider changes away from elevenlabs
  useEffect(() => {
    if (provider !== 'elevenlabs') {
      setElevenLabsVoicesList([]);
    }
  }, [provider]);

  // Voice options by provider
  const voiceOptions: Record<TtsProvider, VoiceOption[]> = {
    openai: [
      { id: "alloy", name: "Alloy", provider: "openai" },
      { id: "echo", name: "Echo", provider: "openai" },
      { id: "fable", name: "Fable", provider: "openai" },
      { id: "onyx", name: "Onyx", provider: "openai" },
      { id: "nova", name: "Nova", provider: "openai" },
      { id: "shimmer", name: "Shimmer", provider: "openai" },
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
    "fish-audio": fishAudioVoices,
    "elevenlabs": elevenLabsVoicesList.length > 0 ? elevenLabsVoicesList : defaultElevenLabsVoices,
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
  
  // Update audio source when URL changes (from prop)
  useEffect(() => {
    if (generatedAudioUrl && audioRef.current) {
      audioRef.current.src = generatedAudioUrl;
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else if (!generatedAudioUrl && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [generatedAudioUrl]);

  // Fetch ElevenLabs voices when provider is selected
  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      if (provider === "elevenlabs" && elevenLabsVoicesList.length === 0) {
        setIsLoadingElevenLabsVoices(true);
        try {
          const response = await fetch("/api/list-elevenlabs-voices");
          if (!response.ok) {
            throw new Error("Failed to fetch ElevenLabs voices");
          }
          const data = await response.json();
          const fetchedVoices = data.voices.map((v: any) => ({ ...v, provider: "elevenlabs" })) as VoiceOption[];
          setElevenLabsVoicesList(fetchedVoices);
          if (fetchedVoices.length > 0) {
            const currentIsValid = fetchedVoices.some(v => v.id === elevenLabsVoiceId);
            if (!currentIsValid) {
              setElevenLabsVoiceId(fetchedVoices[0].id);
              setVoice(fetchedVoices[0].name); 
            }
          }
        } catch (error: any) {
          console.error("Error fetching ElevenLabs voices:", error);
          setAudioGenerationError(`Failed to load ElevenLabs voices: ${error.message}. Using defaults.`);
          setElevenLabsVoicesList(defaultElevenLabsVoices);
          if (defaultElevenLabsVoices.length > 0) {
            setElevenLabsVoiceId(defaultElevenLabsVoices[0].id);
            setVoice(defaultElevenLabsVoices[0].name);
          }
        } finally {
          setIsLoadingElevenLabsVoices(false);
        }
      }
    };

    fetchElevenLabsVoices();
  }, [provider, elevenLabsVoiceId, setAudioGenerationError]);

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioGenerationError(null);
    onAudioGenerated(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setSelectedVoiceName("");

    if (!text || text.trim() === "") {
        setAudioGenerationError("Please enter some text to generate audio.");
        setIsGeneratingAudio(false);
        return;
    }

    try {
      let selectedVoiceOption: VoiceOption | undefined;
      let requestBody: any = { 
        text, 
        provider, 
      };

      switch (provider) {
        case "openai":
          selectedVoiceOption = voiceOptions.openai.find(v => v.id === voice);
          requestBody.voice = voice;
          break;
        case "minimax":
          selectedVoiceOption = voiceOptions.minimax.find(v => v.id === voice);
          requestBody.voice = voice;
          requestBody.model = minimaxModel;
          break;
        case "fish-audio":
          selectedVoiceOption = fishAudioVoices.find(v => v.id === fishAudioVoiceId);
          requestBody.fishAudioVoiceId = fishAudioVoiceId;
          requestBody.fishAudioModel = fishAudioModel; 
          break;
        case "elevenlabs":
          const currentElevenLabsList = elevenLabsVoicesList.length > 0 ? elevenLabsVoicesList : defaultElevenLabsVoices;
          selectedVoiceOption = currentElevenLabsList.find(v => v.id === elevenLabsVoiceId);
          requestBody.elevenLabsVoiceId = elevenLabsVoiceId;
          requestBody.elevenLabsModelId = elevenLabsModelId;
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      if (selectedVoiceOption) {
        setSelectedVoiceName(selectedVoiceOption.name);
        if (!requestBody.voice && provider !== 'openai' && provider !== 'minimax') { 
             requestBody.voice = selectedVoiceOption.name;
        }
      } else {
          console.warn(`Could not find selected voice option for provider ${provider}`);
          if(provider === 'openai' || provider === 'minimax') requestBody.voice = voice;
          else if(provider === 'fish-audio') requestBody.fishAudioVoiceId = fishAudioVoiceId;
          else if(provider === 'elevenlabs') requestBody.elevenLabsVoiceId = elevenLabsVoiceId;
      }
      
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate audio. Unknown server error.'}));
        throw new Error(errorData.message || 'Failed to generate audio. Status: ' + response.status);
      }

      const result = await response.json();

      if (result.audioUrl) {
        onAudioGenerated(result.audioUrl);
      } else {
        throw new Error('Audio generation succeeded but no URL was returned.');
      }
    } catch (error: any) {
      console.error("Audio generation failed:", error);
      setAudioGenerationError(error.message || "An unknown error occurred");
      onAudioGenerated(null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !generatedAudioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      audioRef.current.play().catch(e => {
        console.error("Error playing audio:", e);
        setAudioGenerationError("Could not play audio.");
      });
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  const handleProviderChange = (newProvider: TtsProvider) => {
    setProvider(newProvider);
    switch (newProvider) {
      case 'openai':
        setVoice('alloy');
        break;
      case 'minimax':
        setVoice('Wise_Woman');
        setMinimaxModel('speech-02-hd');
        break;
      case 'fish-audio':
        setFishAudioVoiceId(fishAudioVoices[0]?.id || "");
        setFishAudioModel(fishAudioModels[0]?.id || "");
        break;
      case 'elevenlabs':
        if (elevenLabsVoicesList.length > 0) {
          setElevenLabsVoiceId(elevenLabsVoicesList[0].id);
        } else if (defaultElevenLabsVoices.length > 0) {
           setElevenLabsVoiceId(defaultElevenLabsVoices[0].id);
        }
        setElevenLabsModelId("eleven_multilingual_v2");
        break;
    }
    onAudioGenerated(null);
    setAudioGenerationError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setSelectedVoiceName("");
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownload = () => {
    if (!generatedAudioUrl) return;
    const link = document.createElement('a');
    link.href = generatedAudioUrl;
    const filename = generatedAudioUrl.split('/').pop() || 'generated_audio.mp3';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onAudioGenerated(null);
    setAudioGenerationError(null);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoiceIdOrName = e.target.value;
    setVoice(newVoiceIdOrName);
  };

  const handleMinimaxModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMinimaxModel(e.target.value as MinimaxModel);
  };

  const handleFishAudioVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFishAudioVoiceId(e.target.value);
  };

  const handleFishAudioModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFishAudioModel(e.target.value);
  };
  
  const handleElevenLabsVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setElevenLabsVoiceId(e.target.value);
  };
  
  const handleElevenLabsModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElevenLabsModelId(e.target.value);
  };

  const renderSelectOptions = (options: { id: string, name: string }[]) => {
    return options.map(option => (
      <option key={option.id} value={option.id}>{option.name}</option>
    ));
  };

  const renderElevenLabsVoiceOptions = () => {
    const listToUse = elevenLabsVoicesList.length > 0 ? elevenLabsVoicesList : defaultElevenLabsVoices;
    if (isLoadingElevenLabsVoices) {
      return <option value="">Loading voices...</option>;
    }
    if (listToUse.length === 0) {
      return <option value="">No voices available</option>;
    }
    return renderSelectOptions(listToUse);
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Volume2 className="mr-2" /> Audio Generator
      </h2>
      
      <div className="space-y-4">
        <div className="flex space-x-2 mb-4 border border-muted rounded-md p-1 bg-background">
          {(['openai', 'minimax', 'fish-audio', 'elevenlabs'] as TtsProvider[]).map(p => (
            <Button 
              key={p} 
              variant={provider === p ? "secondary" : "ghost"}
              onClick={() => handleProviderChange(p)}
              className="flex-1 capitalize text-xs sm:text-sm h-8 sm:h-9"
            >
              {p.replace('-audio', '')}
            </Button>
          ))}
        </div>

        <div>
          <Label htmlFor="text-input">Text to Convert</Label>
          <Textarea
            id="text-input"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter the text you want to convert to speech..."
            className="mt-1 min-h-[100px]"
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {provider === 'openai' && (
            <div>
              <Label htmlFor="openai-voice">Voice</Label>
              <select
                id="openai-voice"
                value={voice}
                onChange={handleVoiceChange}
                className="w-full p-2 border rounded mt-1 bg-background text-foreground"
              >
                {renderSelectOptions(voiceOptions.openai)}
              </select>
            </div>
          )}

          {provider === 'minimax' && (
            <>
              <div>
                <Label htmlFor="minimax-voice">Voice</Label>
                <select
                  id="minimax-voice"
                  value={voice}
                  onChange={handleVoiceChange}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {renderSelectOptions(voiceOptions.minimax)}
                </select>
              </div>
              <div>
                <Label htmlFor="minimax-model">Model</Label>
                <select
                  id="minimax-model"
                  value={minimaxModel}
                  onChange={handleMinimaxModelChange}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {renderSelectOptions(minimaxModels)}
                </select>
              </div>
            </>
          )}
          
          {provider === 'fish-audio' && (
            <>
              <div>
                <Label htmlFor="fish-audio-voice">Voice</Label>
                <select
                  id="fish-audio-voice"
                  value={fishAudioVoiceId}
                  onChange={handleFishAudioVoiceChange}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {renderSelectOptions(voiceOptions["fish-audio"])}
                </select>
              </div>
              <div>
                <Label htmlFor="fish-audio-model">Model</Label>
                 <select
                  id="fish-audio-model"
                  value={fishAudioModel}
                  onChange={handleFishAudioModelChange}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {renderSelectOptions(fishAudioModels)}
                </select>
              </div>
            </>
          )}

          {provider === 'elevenlabs' && (
             <>
              <div>
                <Label htmlFor="elevenlabs-voice">Voice</Label>
                <select
                  id="elevenlabs-voice"
                  value={elevenLabsVoiceId}
                  onChange={handleElevenLabsVoiceChange}
                  disabled={isLoadingElevenLabsVoices}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground disabled:opacity-50"
                >
                  {renderElevenLabsVoiceOptions()}
                </select>
              </div>
               <div>
                 <Label htmlFor="elevenlabs-model">Model ID (Optional)</Label>
                 <Input 
                    id="elevenlabs-model"
                    type="text"
                    value={elevenLabsModelId}
                    onChange={handleElevenLabsModelChange}
                    placeholder="e.g., eleven_multilingual_v2"
                    className="mt-1"
                 />
               </div>
             </>
          )}
        </div>

        <Button 
          onClick={handleGenerateAudio} 
          disabled={isGeneratingAudio || !text.trim()}
          className="w-full"
        >
          {isGeneratingAudio ? "Generating..." : "Generate Audio"}
        </Button>

        {audioGenerationError && (
          <p className="text-red-500 text-sm">Error: {audioGenerationError}</p>
        )}

        {generatedAudioUrl && !isGeneratingAudio && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Generated Audio ({selectedVoiceName || 'Selected Voice'})</span>
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-8">
                <Download size={16} className="mr-1"/>
                Download
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={togglePlayback} className="h-9 w-9">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <div className="flex-grow bg-background h-2 rounded-full overflow-hidden relative">
                <div 
                  className="bg-primary h-full absolute left-0 top-0"
                  style={{ width: `${(currentTime / (audioDuration || 1)) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs w-16 text-right text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(audioDuration || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioGenerator; 