"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Download, Play, Pause, Loader2, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  onSubtitlesGenerated: (url: string | null) => void;
  setIsGeneratingAudio: (isGenerating: boolean) => void;
  setAudioGenerationError: (error: string | null) => void;
  selectedUserId?: string;
  batchProcessingState: {
    chunks: string[];
    chunkResults: ChunkResult[];
    currentBatch: number;
    totalBatches: number;
    processingProgress: number;
    isProcessingBatches: boolean;
    isConcatenating: boolean;
    isGeneratingSubtitles: boolean;
  };
  setBatchProcessingState: (state: {
    chunks: string[];
    chunkResults: ChunkResult[];
    currentBatch: number;
    totalBatches: number;
    processingProgress: number;
    isProcessingBatches: boolean;
    isConcatenating: boolean;
    isGeneratingSubtitles: boolean;
  }) => void;
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

// Constants for chunking
const AUDIO_CHUNK_MAX_LENGTH = 2800;
const ELEVENLABS_AUDIO_CHUNK_MAX_LENGTH = 1000;

// Batch processing constants
const DEFAULT_BATCH_SIZE = 4;
const ELEVENLABS_BATCH_SIZE = 4;
const FISH_AUDIO_BATCH_SIZE = 3;
const DEFAULT_BATCH_DELAY = 60 * 1100; // 66 seconds
const ELEVENLABS_BATCH_DELAY = 60 * 1100; // 1 minute
const FISH_AUDIO_BATCH_DELAY = 60 * 1000; // 60 seconds

interface ChunkResult {
  chunkIndex: number;
  chunkUrl?: string;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
  batchProcessingState,
  setBatchProcessingState,
}) => {
  const [textToConvert, setTextToConvert] = useState<string>(initialText || "");
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>("minimax");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  // Batch processing state
  const [chunks, setChunks] = useState<string[]>(batchProcessingState.chunks);
  const [chunkResults, setChunkResults] = useState<ChunkResult[]>(batchProcessingState.chunkResults);
  const [currentBatch, setCurrentBatch] = useState<number>(batchProcessingState.currentBatch);
  const [totalBatches, setTotalBatches] = useState<number>(batchProcessingState.totalBatches);
  const [processingProgress, setProcessingProgress] = useState<number>(batchProcessingState.processingProgress);
  const [isProcessingBatches, setIsProcessingBatches] = useState<boolean>(batchProcessingState.isProcessingBatches);
  const [isConcatenating, setIsConcatenating] = useState<boolean>(batchProcessingState.isConcatenating);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(batchProcessingState.isGeneratingSubtitles);

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

  // Sync local state with lifted state on mount and when lifted state changes
  useEffect(() => {
    setChunks(batchProcessingState.chunks);
    setChunkResults(batchProcessingState.chunkResults);
    setCurrentBatch(batchProcessingState.currentBatch);
    setTotalBatches(batchProcessingState.totalBatches);
    setProcessingProgress(batchProcessingState.processingProgress);
    setIsProcessingBatches(batchProcessingState.isProcessingBatches);
    setIsConcatenating(batchProcessingState.isConcatenating);
    setIsGeneratingSubtitles(batchProcessingState.isGeneratingSubtitles);
  }, [batchProcessingState]);

  // Update lifted state whenever local state changes
  useEffect(() => {
    setBatchProcessingState({
      chunks,
      chunkResults,
      currentBatch,
      totalBatches,
      processingProgress,
      isProcessingBatches,
      isConcatenating,
      isGeneratingSubtitles,
    });
  }, [chunks, chunkResults, currentBatch, totalBatches, processingProgress, isProcessingBatches, isConcatenating, isGeneratingSubtitles, setBatchProcessingState]);

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

  // Chunking function
  const chunkText = (text: string, maxLength: number = AUDIO_CHUNK_MAX_LENGTH): string[] => {
    if (!text || text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentPosition = 0;

    while (currentPosition < text.length) {
      let chunkEnd = currentPosition + maxLength;
      if (chunkEnd >= text.length) {
        chunks.push(text.substring(currentPosition));
        break;
      }

      let splitPosition = -1;
      const sentenceEndChars = /[.?!]\s+|[\n\r]+/g;
      let match;
      let lastMatchPosition = -1;
      
      const searchSubstr = text.substring(currentPosition, chunkEnd);
      while((match = sentenceEndChars.exec(searchSubstr)) !== null) {
          lastMatchPosition = currentPosition + match.index + match[0].length;
      }

      if (lastMatchPosition > currentPosition && lastMatchPosition <= chunkEnd) {
          splitPosition = lastMatchPosition;
      } else {
          let spacePosition = text.lastIndexOf(' ', chunkEnd);
          if (spacePosition > currentPosition) {
              splitPosition = spacePosition + 1;
          } else {
              splitPosition = chunkEnd;
          }
      }
      chunks.push(text.substring(currentPosition, splitPosition).trim());
      currentPosition = splitPosition;
    }
    return chunks.filter(chunk => chunk.length > 0);
  };

  // Generate a single audio chunk
  const generateSingleChunk = async (
    textChunk: string,
    chunkIndex: number,
    provider: string,
    providerArgs: any
  ): Promise<string> => {
    const requestBody = {
      textChunk,
      chunkIndex,
      provider,
      userId: selectedUserId || 'unknown_user',
      ...providerArgs
    };

    const response = await fetch("/api/generate-audio-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

    const data = await response.json();

      if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to generate audio chunk");
    }

    return data.chunkUrl;
  };

  // Process chunks in batches
  const processBatches = async (
    textChunks: string[],
    provider: string,
    providerArgs: any
  ): Promise<ChunkResult[]> => {
    const batchSize = provider === "elevenlabs" ? ELEVENLABS_BATCH_SIZE : 
                     provider === "fish-audio" ? FISH_AUDIO_BATCH_SIZE : 
                     DEFAULT_BATCH_SIZE;
    
    const batchDelay = provider === "elevenlabs" ? ELEVENLABS_BATCH_DELAY : 
                       provider === "fish-audio" ? FISH_AUDIO_BATCH_DELAY : 
                       DEFAULT_BATCH_DELAY;

    const results: ChunkResult[] = textChunks.map((_, index) => ({
      chunkIndex: index,
      status: 'pending' as const
    }));

    setChunkResults(results);
    setTotalBatches(Math.ceil(textChunks.length / batchSize));
    setCurrentBatch(0);

    for (let batchStart = 0; batchStart < textChunks.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, textChunks.length);
      const currentBatchNumber = Math.floor(batchStart / batchSize) + 1;
      
      setCurrentBatch(currentBatchNumber);
      console.log(`🔄 Processing batch ${currentBatchNumber}/${Math.ceil(textChunks.length / batchSize)}`);

      // Mark chunks in current batch as processing
      setChunkResults(prev => prev.map((result, index) => 
        index >= batchStart && index < batchEnd 
          ? { ...result, status: 'processing' as const }
          : result
      ));

      // Process current batch
      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(
          generateSingleChunk(textChunks[i], i, provider, providerArgs)
            .then(chunkUrl => {
              // Update both state and results array
              results[i] = { ...results[i], chunkUrl, status: 'completed' as const };
              setChunkResults(prev => prev.map((result, index) => 
                index === i 
                  ? { ...result, chunkUrl, status: 'completed' as const }
                  : result
              ));
              return { chunkIndex: i, chunkUrl, status: 'completed' as const };
            })
            .catch(error => {
              console.error(`❌ Chunk ${i} failed:`, error);
              // Update both state and results array
              results[i] = { ...results[i], error: error.message, status: 'failed' as const };
              setChunkResults(prev => prev.map((result, index) => 
                index === i 
                  ? { ...result, error: error.message, status: 'failed' as const }
                  : result
              ));
              return { chunkIndex: i, error: error.message, status: 'failed' as const };
            })
        );
      }

      await Promise.allSettled(batchPromises);

      // Update progress based on the actual results array
      const completedChunks = results.filter(r => r.status === 'completed').length;
      setProcessingProgress((completedChunks / textChunks.length) * 100);

      // Wait between batches (except for the last batch)
      if (batchEnd < textChunks.length) {
        console.log(`⏱️ Waiting ${batchDelay / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    return results;
  };

  // Concatenate audio chunks
  const concatenateChunks = async (chunkUrls: string[]): Promise<string> => {
    setIsConcatenating(true);
    
    try {
      const response = await fetch("/api/concatenate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunkUrls,
          provider: selectedProvider,
          voice: selectedProvider === "google-tts" ? selectedGoogleTtsVoiceName : selectedVoice,
          userId: selectedUserId || 'unknown_user'
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to concatenate audio chunks");
      }

      return data.audioUrl;
    } finally {
      setIsConcatenating(false);
    }
  };

  // Generate subtitles from final audio
  const generateSubtitlesFromFinalAudio = async (audioUrl: string): Promise<string | null> => {
    setIsGeneratingSubtitles(true);

    try {
      const response = await fetch("/api/generate-subtitles-from-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl,
          userId: selectedUserId || 'unknown_user'
        }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Failed to generate subtitles");
        }

      return data.subtitlesUrl;
    } catch (error: any) {
      console.error("⚠️ Subtitle generation failed:", error);
      return null; // Don't fail the whole process if subtitles fail
    } finally {
        setIsGeneratingSubtitles(false);
    }
  };

  // Main audio generation handler
  const handleGenerateAudio = async () => {
    if (!textToConvert.trim()) {
      setAudioGenerationError("Please enter some text to convert.");
      return;
    }

    setIsGeneratingAudio(true);
    setIsProcessingBatches(true);
    setAudioGenerationError(null);
    onAudioGenerated(null);
    onSubtitlesGenerated(null);
    setProcessingProgress(0);

    try {
      // Determine chunk size based on provider
      const currentChunkMaxLength = selectedProvider === "elevenlabs" ? 
        ELEVENLABS_AUDIO_CHUNK_MAX_LENGTH : AUDIO_CHUNK_MAX_LENGTH;
      
      const textChunks = chunkText(textToConvert, currentChunkMaxLength);
      setChunks(textChunks);
      
      console.log(`📝 Text split into ${textChunks.length} chunks (max length: ${currentChunkMaxLength})`);

      if (textChunks.length === 0) {
        throw new Error("No text content to process after chunking.");
      }

      // Prepare provider-specific arguments
      const providerArgs: any = {
        voice: selectedVoice,
        model: minimaxModel,
        fishAudioVoiceId,
        fishAudioModel,
        elevenLabsVoiceId,
        elevenLabsModelId,
        languageCode: selectedLanguageCode,
      };

      if (selectedProvider === "google-tts") {
        providerArgs.googleTtsVoiceName = selectedGoogleTtsVoiceName;
        providerArgs.googleTtsLanguageCode = selectedGoogleTtsLanguage;
      }

      // Process all chunks in batches
      const results = await processBatches(textChunks, selectedProvider, providerArgs);
      setIsProcessingBatches(false);

      // Filter successful chunks
      const successfulResults = results.filter(r => r.status === 'completed' && r.chunkUrl);
      const failedCount = results.length - successfulResults.length;

      if (successfulResults.length === 0) {
        throw new Error("All audio chunks failed to generate.");
      }

      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount}/${results.length} chunks failed. Proceeding with ${successfulResults.length} successful chunks.`);
      }

      // Extract chunk URLs in correct order
      const chunkUrls = successfulResults
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map(r => r.chunkUrl!);

      console.log(`🔗 Concatenating ${chunkUrls.length} audio chunks...`);

      // Concatenate chunks
      const finalAudioUrl = await concatenateChunks(chunkUrls);
      onAudioGenerated(finalAudioUrl);

      // Generate subtitles from final audio
      console.log("🔤 Starting subtitle generation...");
      const subtitlesUrl = await generateSubtitlesFromFinalAudio(finalAudioUrl);
      if (subtitlesUrl) {
        onSubtitlesGenerated(subtitlesUrl);
        console.log("✅ Subtitles generated successfully");
      }

      console.log("✅ Audio generation completed successfully!");

    } catch (error: any) {
      console.error("❌ Error in audio generation:", error);
      setAudioGenerationError(error.message || "An unexpected error occurred.");
      onAudioGenerated(null);
      onSubtitlesGenerated(null);
    } finally {
      setIsGeneratingAudio(false);
      setIsProcessingBatches(false);
      setIsConcatenating(false);
      setIsGeneratingSubtitles(false);
    }
  };

  const getProcessingStatusText = () => {
    if (isProcessingBatches) {
      return `Processing batch ${currentBatch}/${totalBatches} (${Math.round(processingProgress)}%)`;
    }
    if (isConcatenating) {
      return "Concatenating audio chunks...";
    }
    if (isGeneratingSubtitles) {
      return "Generating subtitles...";
    }
    return "Generate Audio";
  };

  const isAnyProcessing = isGeneratingAudio || isProcessingBatches || isConcatenating || isGeneratingSubtitles;

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

  const voiceOptions: Record<TtsProvider, VoiceOption[]> = {
    openai: [
      { id: "alloy", name: "Alloy", provider: "openai" },
      { id: "echo", name: "Echo", provider: "openai" },
      { id: "fable", name: "Fable", provider: "openai" },
      { id: "onyx", name: "Onyx", provider: "openai" },
      { id: "nova", name: "Nova", provider: "openai" },
      { id: "shimmer", name: "Shimmer", provider: "openai" }
    ],
    minimax: [
      { id: "English_radiant_girl", name: "Radiant Girl", provider: "minimax" },
      { id: "English_captivating_female1", name: "Captivating Female", provider: "minimax" },
      { id: "English_Steady_Female_1", name: "Steady Women", provider: "minimax" }
    ],
    "fish-audio": fishAudioVoices,
    "elevenlabs": elevenLabsVoicesList.length > 0 ? elevenLabsVoicesList : defaultElevenLabsVoices,
    "google-tts": [],
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

  const handlePlayPause = () => {
    if (audioInstanceRef.current && audioInstanceRef.current.src && audioInstanceRef.current.readyState >= 2) {
      if (isPlaying) {
        audioInstanceRef.current.pause();
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      } else {
        audioInstanceRef.current.play().catch(e => console.error("Error playing audio:", e));
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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
            disabled={isAnyProcessing}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="audio-provider-select">Audio Provider</Label>
            <select
              id="audio-provider-select"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AudioProvider)}
              disabled={isAnyProcessing}
              className="w-full p-2 border rounded mt-1 bg-background text-foreground"
            >
              <option value="minimax">Minimax TTS</option>
              <option value="openai">OpenAI</option>
              <option value="fish-audio">Fish Audio</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="google-tts">Google Cloud TTS</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-selection-select">Voice</Label>
            <select
              id="voice-selection-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isAnyProcessing || getVoiceOptions().length === 0 || selectedProvider === 'google-tts'}
              className={`w-full p-2 border rounded mt-1 bg-background text-foreground ${selectedProvider === 'google-tts' ? 'hidden' : ''}`}
            >
              {getVoiceOptions().map((voice: VoiceInfo) => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
          </div>
          
          {selectedProvider === "elevenlabs" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-model-select">ElevenLabs Model</Label>
                <select
                  id="elevenlabs-model-select"
                  value={elevenLabsModelId}
                  onChange={(e) => setElevenLabsModelId(e.target.value)}
                  disabled={isAnyProcessing}
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
                    disabled={isAnyProcessing}
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

          {selectedProvider === 'google-tts' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="google-language-select">Google TTS Language</Label>
                <select
                  id="google-language-select"
                  value={selectedGoogleTtsLanguage}
                  onChange={(e) => {
                    setSelectedGoogleTtsLanguage(e.target.value);
                    const firstVoiceInNewLanguage = googleTtsVoicesList.find(v => v.languageCodes.includes(e.target.value));
                    if (firstVoiceInNewLanguage) {
                      setSelectedGoogleTtsVoiceName(firstVoiceInNewLanguage.name);
                    } else {
                        setSelectedGoogleTtsVoiceName("");
                    }
                  }}
                  disabled={isAnyProcessing || isLoadingGoogleTtsVoices}
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
                  disabled={isAnyProcessing || isLoadingGoogleTtsVoices || googleTtsVoicesList.filter(v => v.languageCodes.includes(selectedGoogleTtsLanguage)).length === 0}
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

        {/* Progress indicator */}
        {isAnyProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{getProcessingStatusText()}</span>
              {isProcessingBatches && (
                <span>{Math.round(processingProgress)}%</span>
              )}
            </div>
            {isProcessingBatches && (
              <Progress value={processingProgress} className="w-full" />
            )}
            {(isConcatenating || isGeneratingSubtitles) && (
              <Progress value={100} className="w-full animate-pulse" />
            )}
          </div>
        )}

        {/* Chunk status display */}
        {chunks.length > 0 && chunkResults.length > 0 && (
          <div className="space-y-2">
            <Label>Chunk Processing Status ({chunks.length} chunks)</Label>
            <div className="grid grid-cols-10 gap-1">
              {chunkResults.map((result, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-bold ${
                    result.status === 'completed' ? 'bg-green-500' :
                    result.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    result.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`}
                  title={`Chunk ${index + 1}: ${result.status}${result.error ? ` - ${result.error}` : ''}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleGenerateAudio} 
          disabled={isAnyProcessing || !textToConvert.trim()}
          className="w-full"
        >
          {isAnyProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {getProcessingStatusText()}
        </Button>

        {audioGenerationError && (
          <div className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Audio Error: {audioGenerationError}</p>
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
        </CardFooter>
      )}
    </Card>
  );
};

export default AudioGenerator; 