"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause, Loader2, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder types (as the original files are missing)
type AudioProvider = "elevenlabs" | "minimax" | "openai" | "fish-audio" | "google-tts"; // Added "google-tts"

interface VoiceInfo {
  value: string;
  label: string;
  provider: TtsProvider;
}

// Placeholder voice data (examples, replace with actual data if needed)
// Removed googleTTSVoices array
const elevenLabsVoices: VoiceInfo[] = [
  { value: "Rachel", label: "ElevenLabs Rachel", provider: "elevenlabs" },
  { value: "Adam", label: "ElevenLabs Adam", provider: "elevenlabs" },
];
const minimaxTTSVoices: VoiceInfo[] = [
  // Prioritized Female
  { value: "English_radiant_girl", label: "Radiant Girl", provider: "minimax" },
  { value: "English_captivating_female1", label: "Captivating Female", provider: "minimax" },
  { value: "English_Steady_Female_1", label: "Steady Women", provider: "minimax" },
  // Prioritized Male
  { value: "English_CaptivatingStoryteller", label: "Captivating Storyteller", provider: "minimax" },
  { value: "English_Deep-VoicedGentleman", label: "Man With Deep Voice", provider: "minimax" },
  { value: "English_magnetic_voiced_man", label: "Magnetic-voiced Male", provider: "minimax" },
  { value: "English_ReservedYoungMan", label: "Reserved Young Man", provider: "minimax" },
  // Remaining voices
  { value: "English_expressive_narrator", label: "Expressive Narrator", provider: "minimax" },
  { value: "English_compelling_lady1", label: "Compelling Lady", provider: "minimax" },
  { value: "English_CalmWoman", label: "Calm Woman", provider: "minimax" },
  { value: "English_Graceful_Lady", label: "Graceful Lady", provider: "minimax" },
  { value: "English_MaturePartner", label: "Mature Partner", provider: "minimax" },
  { value: "English_MatureBoss", label: "Bossy Lady", provider: "minimax" },
  { value: "English_Wiselady", label: "Wise Lady", provider: "minimax" },
  { value: "English_patient_man_v1", label: "Patient Man", provider: "minimax" },
  { value: "English_Female_Narrator", label: "Female Narrator", provider: "minimax" }, // Assuming a value for this new label
  { value: "English_Trustworth_Man", label: "Trustworthy Man", provider: "minimax" },
  { value: "English_Gentle-voiced_man", label: "Gentle-voiced Man", provider: "minimax" },
  { value: "English_Upbeat_Woman", label: "Upbeat Woman", provider: "minimax" },
  { value: "English_Friendly_Female_3", label: "Friendly Women", provider: "minimax" },
];


interface GenerateAudioRequestBody {
  text: string;
  provider: AudioProvider;
  voice?: string;
  userId?: string;
  // Add other fields based on actual API (e.g., model for minimax)
  model?: string; 
  fishAudioVoiceId?: string;
  fishAudioModel?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
  languageCode?: string; // Made optional, Add language code for ElevenLabs
  googleTtsVoiceName?: string;
  googleTtsLanguageCode?: string;
}

interface GenerateAudioResponse {
  audioUrl?: string;
  error?: string;
  details?: string;
  subtitlesUrl?: string;
}


type TtsProvider = "openai" | "minimax" | "fish-audio" | "elevenlabs" | "google-tts"; // This was already present

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
  // Uncomment subtitle handling from props
  onSubtitlesGenerated: (url: string | null) => void;
  setIsGeneratingAudio: (isGenerating: boolean) => void;
  setAudioGenerationError: (error: string | null) => void;
  selectedUserId?: string;
}

// Add language options interface
interface LanguageOption {
  code: string;
  name: string;
}

// Add the language options list
const elevenlabsLanguageOptions: LanguageOption[] = [
  { code: "en", name: "English (USA, UK, Australia, Canada)" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French (France, Canada)" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese (Brazil, Portugal)" },
  { code: "it", name: "Italian" },
  { code: "es", name: "Spanish (Spain, Mexico)" },
  { code: "id", name: "Indonesian" },
  { code: "nl", name: "Dutch" },
  { code: "tr", name: "Turkish" },
  { code: "fil", name: "Filipino" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "bg", name: "Bulgarian" },
  { code: "ro", name: "Romanian" },
  { code: "ar", name: "Arabic (Saudi Arabia, UAE)" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "fi", name: "Finnish" },
  { code: "hr", name: "Croatian" },
  { code: "ms", name: "Malay" },
  { code: "sk", name: "Slovak" },
  { code: "da", name: "Danish" },
  { code: "ta", name: "Tamil" },
  { code: "uk", name: "Ukrainian" },
  { code: "ru", name: "Russian" },
  // Additional languages for eleven_flash_v2_5 model
  { code: "hu", name: "Hungarian" },
  { code: "no", name: "Norwegian" },
  { code: "vi", name: "Vietnamese" }
];

// Add ElevenLabs model options
const elevenLabsModelOptions = [
  { id: "eleven_multilingual_v2", name: "Multilingual V2 (29 languages, high quality)" },
  { id: "eleven_flash_v2_5", name: "Flash V2.5 (32 languages, low latency)" }
];

// Add Google TTS Voice type from backend
interface GoogleTtsVoice {
  name: string;
  languageCodes: string[];
  ssmlGender: 'SSML_VOICE_GENDER_UNSPECIFIED' | 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({
  initialText,
  generatedAudioUrl,
  isGeneratingAudio,
  audioGenerationError,
  onAudioGenerated,
  // Uncomment subtitle props in component definition
  onSubtitlesGenerated,
  setIsGeneratingAudio,
  setAudioGenerationError,
  selectedUserId,
}) => {
  const [textToConvert, setTextToConvert] = useState<string>(initialText || "");
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>("minimax");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  // Uncomment subtitle state but keep it hidden from the UI
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
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("en");
  const [elevenLabsModelId, setElevenLabsModelId] = useState<string>("eleven_multilingual_v2");
  const [elevenLabsVoicesList, setElevenLabsVoicesList] = useState<VoiceOption[]>([]);
  const [isLoadingElevenLabsVoices, setIsLoadingElevenLabsVoices] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  // Add state for Google TTS voices and loading state
  const [googleTtsVoicesList, setGoogleTtsVoicesList] = useState<GoogleTtsVoice[]>([]);
  const [isLoadingGoogleTtsVoices, setIsLoadingGoogleTtsVoices] = useState(false);
  const [selectedGoogleTtsLanguage, setSelectedGoogleTtsLanguage] = useState<string>("en-US");
  const [selectedGoogleTtsVoiceName, setSelectedGoogleTtsVoiceName] = useState<string>("");

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
    
    // Uncomment subtitle reset
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
      if (selectedProvider === 'minimax') {
        requestBody.model = minimaxModel; // Example, ensure minimaxModel state is set
      } else if (selectedProvider === 'fish-audio') {
        requestBody.fishAudioVoiceId = fishAudioVoiceId;
        requestBody.fishAudioModel = fishAudioModel;
      } else if (selectedProvider === 'elevenlabs') {
        requestBody.elevenLabsVoiceId = elevenLabsVoiceId;
        requestBody.elevenLabsModelId = elevenLabsModelId;
        // Only add languageCode if using Flash model
        if (elevenLabsModelId === "eleven_flash_v2_5") {
          requestBody.languageCode = selectedLanguageCode;
        }
      } else if (selectedProvider === 'google-tts') {
        if (!selectedGoogleTtsVoiceName) {
          setAudioGenerationError("Please select a Google TTS voice.");
          setIsGeneratingAudio(false);
          return;
        }
        requestBody.googleTtsVoiceName = selectedGoogleTtsVoiceName;
        // The selectedGoogleTtsLanguage is the language code for Google TTS
        requestBody.googleTtsLanguageCode = selectedGoogleTtsLanguage; 
        // requestBody.googleTtsSsmlGender = selectedVoice.split('-')[2]; // Example if gender is in voice name format
        // Remove the generic `voice` and `languageCode` for Google TTS as it uses specific ones
        delete requestBody.voice;
        delete requestBody.languageCode; 
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
        
        // Process the subtitles URL if it exists in the response
        if (data.subtitlesUrl) {
          console.log("Received subtitles URL from audio generation:", data.subtitlesUrl);
          setGeneratedSubtitlesUrlLocal(data.subtitlesUrl);
          onSubtitlesGenerated(data.subtitlesUrl);
        }
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

  // Uncomment the subtitle generation function, but we'll make it hidden
  // This function should still exist for handling manual subtitle generation if needed
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
            ? elevenLabsVoicesList.map((v: VoiceOption): VoiceInfo => ({ value: v.id, label: v.name, provider: v.provider })) 
            : defaultElevenLabsVoices.map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name, provider: v.provider}));
      case "minimax":
        return minimaxTTSVoices;
      case "openai":
         return voiceOptions.openai.map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name, provider: v.provider}));
      case "fish-audio":
          return voiceOptions["fish-audio"].map((v: VoiceOption): VoiceInfo => ({value: v.id, label: v.name, provider: v.provider}));
      case "google-tts": // Return empty for now, will be handled by dedicated UI
        return [];
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
  { id: "058e3e7df4c94303a7ce22576fc81ec8", name: "Lisa: English Woman (US) - Advertisement", provider: "fish-audio" },
  { id: "ecc977e5dca94390926fab1e0c2ba292", name: "Katie: English Woman (US) - Training", provider: "fish-audio" },
  { id: "125d6460953a443d8c65909adf87ca3f", name: "Neil: English Man (US) - Audiobook", provider: "fish-audio" },
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
    "google-tts": [], // Added to satisfy the type, dropdown will be hidden
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

  // Fetch Google TTS Voices when provider changes to google-tts
  useEffect(() => {
    const fetchGoogleTtsVoices = async () => {
      if (selectedProvider === "google-tts") {
        setIsLoadingGoogleTtsVoices(true);
        setAudioGenerationError(null);
        try {
          const response = await fetch("/api/list-google-voices");
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "Failed to fetch Google TTS voices");
          }
          const data = await response.json();
          const fetchedVoices: GoogleTtsVoice[] = data.voices || [];
          setGoogleTtsVoicesList(fetchedVoices);
          // Automatically select the first available voice for the default/selected language
          const firstVoiceInLanguage = fetchedVoices.find(v => v.languageCodes.includes(selectedGoogleTtsLanguage));
          if (firstVoiceInLanguage) {
            setSelectedGoogleTtsVoiceName(firstVoiceInLanguage.name);
          } else if (fetchedVoices.length > 0) {
            setSelectedGoogleTtsVoiceName(fetchedVoices[0].name);
            setSelectedGoogleTtsLanguage(fetchedVoices[0].languageCodes[0] || "en-US");
          }
        } catch (error: any) {
          console.error("Error fetching Google TTS voices:", error);
          setAudioGenerationError(`Failed to load Google TTS voices: ${error.message}.`);
          setGoogleTtsVoicesList([]);
        } finally {
          setIsLoadingGoogleTtsVoices(false);
        }
      }
    };
    fetchGoogleTtsVoices();
  }, [selectedProvider, selectedGoogleTtsLanguage]); // Re-fetch if provider or language changes

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
            // Update to include subtitle generation state
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
              // Update to include subtitle generation state
              disabled={isGeneratingAudio || isGeneratingSubtitles}
              className="w-full p-2 border rounded mt-1 bg-background text-foreground"
            >
              {/*<option value="elevenlabs">ElevenLabs</option>*/}
              <option value="minimax">Minimax TTS</option>
              <option value="openai">OpenAI</option>
              <option value="fish-audio">Fish Audio</option>
              <option value="google-tts">Google Cloud TTS</option>
              {/* Add other providers as needed */}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-selection-select">Voice</Label>
            <select
              id="voice-selection-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              // Update to include subtitle generation state
              disabled={isGeneratingAudio || isGeneratingSubtitles || getVoiceOptions().length === 0 || selectedProvider === 'google-tts'}
              className={`w-full p-2 border rounded mt-1 bg-background text-foreground ${selectedProvider === 'google-tts' ? 'hidden' : ''}`}
            >
              {getVoiceOptions().map((voice: VoiceInfo) => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
          </div>
          
          {/* Add these new UI elements */}
          {selectedProvider === "elevenlabs" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-model-select">ElevenLabs Model</Label>
                <select
                  id="elevenlabs-model-select"
                  value={elevenLabsModelId}
                  onChange={(e) => setElevenLabsModelId(e.target.value)}
                  disabled={isGeneratingAudio || isGeneratingSubtitles}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {elevenLabsModelOptions.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
              
              {elevenLabsModelId === "eleven_flash_v2_5" && (
                <div className="space-y-2">
                  <Label htmlFor="language-selection-select">Language</Label>
                  <select
                    id="language-selection-select"
                    value={selectedLanguageCode}
                    onChange={(e) => setSelectedLanguageCode(e.target.value)}
                    disabled={isGeneratingAudio || isGeneratingSubtitles}
                    className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                  >
                    {elevenlabsLanguageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Google TTS Specific UI */}
          {selectedProvider === 'google-tts' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="google-language-select">Google TTS Language</Label>
                <select
                  id="google-language-select"
                  value={selectedGoogleTtsLanguage}
                  onChange={(e) => {
                    setSelectedGoogleTtsLanguage(e.target.value);
                    // Reset voice selection when language changes
                    const firstVoiceInNewLanguage = googleTtsVoicesList.find(v => v.languageCodes.includes(e.target.value));
                    if (firstVoiceInNewLanguage) {
                      setSelectedGoogleTtsVoiceName(firstVoiceInNewLanguage.name);
                    } else {
                        setSelectedGoogleTtsVoiceName(""); // Or select the first overall if no match
                    }
                  }}
                  disabled={isGeneratingAudio || isGeneratingSubtitles || isLoadingGoogleTtsVoices}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {isLoadingGoogleTtsVoices ? (
                    <option>Loading languages...</option>
                  ) : (
                    Array.from(new Set(googleTtsVoicesList.flatMap(v => v.languageCodes))).sort().map(langCode => (
                      <option key={langCode} value={langCode}>{langCode}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-voice-select">Google TTS Voice</Label>
                <select
                  id="google-voice-select"
                  value={selectedGoogleTtsVoiceName}
                  onChange={(e) => setSelectedGoogleTtsVoiceName(e.target.value)}
                  disabled={isGeneratingAudio || isGeneratingSubtitles || isLoadingGoogleTtsVoices || googleTtsVoicesList.filter(v => v.languageCodes.includes(selectedGoogleTtsLanguage)).length === 0}
                  className="w-full p-2 border rounded mt-1 bg-background text-foreground"
                >
                  {isLoadingGoogleTtsVoices ? (
                    <option>Loading voices...</option>
                  ) : (
                    (() => {
                      const filteredVoices = googleTtsVoicesList.filter(v => v.languageCodes.includes(selectedGoogleTtsLanguage));
                      const groupedVoices: { [key: string]: GoogleTtsVoice[] } = {
                        MALE: [],
                        FEMALE: [],
                        NEUTRAL: [],
                        SSML_VOICE_GENDER_UNSPECIFIED: []
                      };
                      filteredVoices.forEach(voice => {
                        groupedVoices[voice.ssmlGender]?.push(voice);
                      });

                      return Object.entries(groupedVoices).flatMap(([gender, voices]) => {
                        if (voices.length === 0) return [];
                        return [
                          <optgroup key={gender} label={`${gender.charAt(0)}${gender.slice(1).toLowerCase().replace("ssml_voice_gender_","")} Voices`}>
                            {voices.map(voice => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.languageCodes.join(', ')})
                              </option>
                            ))}
                          </optgroup>
                        ];
                      });
                    })()
                  )}
                </select>
              </div>
            </>
          )}
        </div>

        <Button 
          onClick={handleGenerateAudio} 
          // Update to include subtitle generation state
          disabled={isGeneratingAudio || isGeneratingSubtitles || !textToConvert.trim()}
          className="w-full"
        >
          {(isGeneratingAudio || isGeneratingSubtitles) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGeneratingAudio ? "Generating Audio..." : isGeneratingSubtitles ? "Processing..." : "Generate Audio"}
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

      {generatedAudioUrl && (
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

          {/* Subtitles UI remains commented out - we don't want to show this in the UI */}
          {/*
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
          */}
        </CardFooter>
      )}
    </Card>
  );
};

export default AudioGenerator; 