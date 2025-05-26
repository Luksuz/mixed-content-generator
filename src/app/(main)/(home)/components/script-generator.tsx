"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ScriptSectionCard from "../_components/script-section-card";
import { ScriptSection } from "@/types";
import { Download, Upload, RefreshCw, Sparkles, FileText, DownloadCloud, Edit, Trash2, Plus, PanelLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  mockScriptSections,
  mockFullScriptMarkdown,
  mockFullScriptCleaned,
  simulateScriptGenerationLoading,
} from "@/lib/mock-data";

interface OutlineSection {
  id: string;
  title: string;
  description: string;
  isEditing?: boolean;
}

// Add new prop for callback
interface ScriptGeneratorProps {
  onScriptSectionsChange?: (sections: ScriptSection[]) => void;
  onFullScriptChange?: (data: { scriptWithMarkdown: string, scriptCleaned: string }) => void;
  currentScriptSections?: ScriptSection[]; // New prop for controlled sections
  currentFullScript?: string; // New prop for controlled full script
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ 
  onScriptSectionsChange, 
  onFullScriptChange, 
  currentScriptSections = [], // Default to empty array
  currentFullScript = ""      // Default to empty string
}) => {
  // Store form values in state
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [theme, setTheme] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [inspirationalTranscript, setInspirationalTranscript] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [scriptWordCount, setScriptWordCount] = useState(0);
  const [uploadedScript, setUploadedScript] = useState("");
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  
  // New state for outline functionality
  const [outlineSections, setOutlineSections] = useState<OutlineSection[]>([]);
  const [hasGeneratedOutline, setHasGeneratedOutline] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // New state variables for advanced options
  const [videoFormat, setVideoFormat] = useState("Explainer");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [targetEmotion, setTargetEmotion] = useState("");
  const [hookStyle, setHookStyle] = useState("Emotional");
  const [retentionStructure, setRetentionStructure] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [pointOfView, setPointOfView] = useState("1st Person");
  
  // Store form values in localStorage to persist between renders
  useEffect(() => {
    // Load saved values from localStorage on initial component mount
    const savedTitle = localStorage.getItem('scriptGenerator.title');
    const savedWordCount = localStorage.getItem('scriptGenerator.wordCount');
    const savedTheme = localStorage.getItem('scriptGenerator.theme');
    const savedAdditionalPrompt = localStorage.getItem('scriptGenerator.additionalPrompt');
    const savedForbiddenWords = localStorage.getItem('scriptGenerator.forbiddenWords');
    const savedVideoFormat = localStorage.getItem('scriptGenerator.videoFormat');
    const savedToneOfVoice = localStorage.getItem('scriptGenerator.toneOfVoice');
    const savedTargetEmotion = localStorage.getItem('scriptGenerator.targetEmotion');
    const savedHookStyle = localStorage.getItem('scriptGenerator.hookStyle');
    const savedRetentionStructure = localStorage.getItem('scriptGenerator.retentionStructure');
    const savedCallToAction = localStorage.getItem('scriptGenerator.callToAction');
    const savedPointOfView = localStorage.getItem('scriptGenerator.pointOfView');
    
    // Load outline state from localStorage
    const savedOutlineSections = localStorage.getItem('scriptGenerator.outlineSections');
    const savedHasGeneratedOutline = localStorage.getItem('scriptGenerator.hasGeneratedOutline');
    
    if (savedTitle) setTitle(savedTitle);
    if (savedWordCount) setWordCount(parseInt(savedWordCount));
    if (savedTheme) setTheme(savedTheme);
    if (savedAdditionalPrompt) setAdditionalPrompt(savedAdditionalPrompt);
    if (savedForbiddenWords) setForbiddenWords(savedForbiddenWords);
    if (savedVideoFormat) setVideoFormat(savedVideoFormat);
    if (savedToneOfVoice) setToneOfVoice(savedToneOfVoice);
    if (savedTargetEmotion) setTargetEmotion(savedTargetEmotion);
    if (savedHookStyle) setHookStyle(savedHookStyle);
    if (savedRetentionStructure) setRetentionStructure(savedRetentionStructure);
    if (savedCallToAction) setCallToAction(savedCallToAction);
    if (savedPointOfView) setPointOfView(savedPointOfView);
    
    // Restore outline state - but only if we don't already have outline sections
    if (savedOutlineSections && outlineSections.length === 0) {
      try {
        const parsedSections = JSON.parse(savedOutlineSections);
        if (parsedSections && parsedSections.length > 0) {
          setOutlineSections(parsedSections);
        }
      } catch (error) {
        console.error('Error parsing saved outline sections:', error);
      }
    }
    
    // Restore hasGeneratedOutline state - if we have a script or saved outline sections, we should show the outline
    if (savedHasGeneratedOutline === 'true' || currentFullScript || (savedOutlineSections && JSON.parse(savedOutlineSections || '[]').length > 0)) {
      setHasGeneratedOutline(true);
    }
  }, []); // Only run on mount

  // Separate effect to handle when currentFullScript changes (when script is generated)
  useEffect(() => {
    // If we have a current full script but no outline sections, restore them from localStorage
    if (currentFullScript && outlineSections.length === 0) {
      const savedOutlineSections = localStorage.getItem('scriptGenerator.outlineSections');
      if (savedOutlineSections) {
        try {
          const parsedSections = JSON.parse(savedOutlineSections);
          if (parsedSections && parsedSections.length > 0) {
            setOutlineSections(parsedSections);
            setHasGeneratedOutline(true);
          }
        } catch (error) {
          console.error('Error parsing saved outline sections:', error);
        }
      }
    }
  }, [currentFullScript, outlineSections.length]);

  // Save form values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('scriptGenerator.title', title);
    localStorage.setItem('scriptGenerator.wordCount', wordCount.toString());
    localStorage.setItem('scriptGenerator.theme', theme);
    localStorage.setItem('scriptGenerator.additionalPrompt', additionalPrompt);
    localStorage.setItem('scriptGenerator.forbiddenWords', forbiddenWords);
    localStorage.setItem('scriptGenerator.videoFormat', videoFormat);
    localStorage.setItem('scriptGenerator.toneOfVoice', toneOfVoice);
    localStorage.setItem('scriptGenerator.targetEmotion', targetEmotion);
    localStorage.setItem('scriptGenerator.hookStyle', hookStyle);
    localStorage.setItem('scriptGenerator.retentionStructure', retentionStructure);
    localStorage.setItem('scriptGenerator.callToAction', callToAction);
    localStorage.setItem('scriptGenerator.pointOfView', pointOfView);
  }, [title, wordCount, theme, additionalPrompt, forbiddenWords, videoFormat, toneOfVoice, targetEmotion, hookStyle, retentionStructure, callToAction, pointOfView]);

  // Save outline state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('scriptGenerator.outlineSections', JSON.stringify(outlineSections));
  }, [outlineSections]);

  useEffect(() => {
    localStorage.setItem('scriptGenerator.hasGeneratedOutline', hasGeneratedOutline.toString());
  }, [hasGeneratedOutline]);

  // Calculate word count when full script changes
  const updateScriptWordCount = (script: string) => {
    if (!script) {
      setScriptWordCount(0);
      return;
    }
    // Clean the markdown to count only actual words
    const cleanText = script.replace(/[#*_~`]/g, '');
    const words = cleanText.trim().split(/\s+/);
    setScriptWordCount(words.length);
  };

  // Update word count when currentFullScript prop changes
  useEffect(() => {
    if (currentFullScript) {
      updateScriptWordCount(currentFullScript);
    } else {
      setScriptWordCount(0);
    }
  }, [currentFullScript]);

  // Mock outline data
  const mockOutlineData: OutlineSection[] = [
    { id: '1', title: 'Massive Population Decline', description: 'Detail the extent of population loss due to the Black Death, supported by historical statistics and accounts.' },
    { id: '2', title: 'Economic Collapse', description: 'Explain the economic repercussions of the Black Death, including the breakdown of trade and loss of workforce.' },
    { id: '3', title: 'Labor Shortages and Wage Increases', description: 'Describe how the scarcity of workers led to higher wages and shifts in labor dynamics.' },
    { id: '4', title: 'Decline of the Feudal System', description: 'Analyze the weakening of feudal structures as a result of significant mortality among the peasantry.' },
    { id: '5', title: 'Impact on the Church and Religious Practices', description: 'Examine how the Black Death affected religious institutions, including loss of clergy and shifts in faith practices.' },
    { id: '6', title: 'Social Upheaval and Class Mobility', description: 'Explore changes in social hierarchies and increased social mobility following the plague.' },
    { id: '7', title: 'Agricultural Disruption', description: 'Detail how farming practices and agricultural production were affected by widespread mortality and labor shortages.' },
    { id: '8', title: 'Urban Decline and Rural Resurgence', description: 'Contrast the decline of urban centers with the revitalization of rural areas in the aftermath of the plague.' },
    { id: '9', title: 'Advancements and Regression in Medical Knowledge', description: 'Discuss the impact of the Black Death on medical practices, including both advancements and setbacks.' },
    { id: '10', title: 'Artistic and Cultural Shifts', description: 'Analyze how the Black Death influenced art, literature, and cultural expressions of the time.' },
    { id: '11', title: 'Trade Routes and Economic Realignments', description: 'Examine changes in trade routes and economic power structures resulting from the plague.' },
    { id: '12', title: 'Psychological Impact on Survivors', description: 'Explore the mental health and societal psyche changes induced by the widespread loss and fear.' },
    { id: '13', title: 'Public Health Measures and Policies', description: 'Detail the public health responses and policies enacted during and after the Black Death.' },
    { id: '14', title: 'Political Turmoil and Power Shifts', description: 'Analyze the political instability and shifts in power structures caused by the plague\'s devastation.' },
    { id: '15', title: 'Changes in Warfare and Military Practices', description: 'Discuss how the Black Death influenced military strategies and the nature of warfare.' },
    { id: '16', title: 'Long-term Demographic Effects', description: 'Assess the lasting demographic changes initiated by the Black Death, including population recovery and genetic impacts.' },
  ];

  const handleGenerateOutline = async () => {
    try {
      setIsGeneratingOutline(true);
      await simulateScriptGenerationLoading(); // Simulate API call delay

      setOutlineSections(mockOutlineData);
      setHasGeneratedOutline(true);
    } catch (error) {
      console.error("Error generating outline:", error);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleRegenerateOutline = async () => {
    try {
      setIsGeneratingOutline(true);
      await simulateScriptGenerationLoading(); // Simulate API call delay

      // Shuffle the mock data to simulate regeneration
      const shuffled = [...mockOutlineData].sort(() => Math.random() - 0.5);
      setOutlineSections(shuffled);
    } catch (error) {
      console.error("Error regenerating outline:", error);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleEditSection = (section: OutlineSection) => {
    setEditingSection(section.id);
    setEditTitle(section.title);
    setEditDescription(section.description);
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;
    
    setOutlineSections(prev => prev.map(section => 
      section.id === editingSection 
        ? { ...section, title: editTitle, description: editDescription }
        : section
    ));
    
    setEditingSection(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleDeleteSection = (sectionId: string) => {
    setOutlineSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const handleAddSection = () => {
    const newSection: OutlineSection = {
      id: Date.now().toString(),
      title: "New Section",
      description: "Add your section description here."
    };
    setOutlineSections(prev => [...prev, newSection]);
    handleEditSection(newSection);
  };

  const handleGenerateFullScript = async () => {
    try {
      setIsGeneratingScript(true);
      await simulateScriptGenerationLoading(); // Simulate API call delay

      const mockData = {
        scriptWithMarkdown: mockFullScriptMarkdown,
        scriptCleaned: mockFullScriptCleaned,
      };

      // Also set mock sections for compatibility with other components
      if (onScriptSectionsChange) {
        onScriptSectionsChange(mockScriptSections);
      }

      if (onFullScriptChange) {
        onFullScriptChange(mockData);
      }
      
      // Set the word count if it's included in the response
      if (mockData.scriptWithMarkdown) {
        updateScriptWordCount(mockData.scriptWithMarkdown);
      }
    } catch (error) {
      console.error("Error generating full script:", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleUpdateSection = (index: number, updatedSection: ScriptSection) => {
    const newSections = [...currentScriptSections];
    newSections[index] = updatedSection;
    if (onScriptSectionsChange) {
      onScriptSectionsChange(newSections);
    }
  };

  const handleDownloadDocx = async () => {
    if (!currentFullScript) return;
    
    try {
      const response = await fetch("/api/download-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title, 
          content: currentFullScript
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate DOCX");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading DOCX:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedScript(event.target.result as string);
        // You can parse and use the uploaded script content here
        // For example, setting it as the current full script
        if (onFullScriptChange) {
          onFullScriptChange({ 
            scriptWithMarkdown: event.target.result as string, 
            scriptCleaned: event.target.result as string 
          });
        }
        updateScriptWordCount(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleRegenerateSegment = async (sectionIndex?: number) => {
    // Use provided index or fall back to selectedSegmentIndex
    const index = sectionIndex !== undefined ? sectionIndex : selectedSegmentIndex;
    
    if (index === null) return;
    
    try {
      // Since index is not null at this point, we can safely use it as an array index
      const currentSection = currentScriptSections[index as number];
      
      // Verify title and theme are available for context in API route
      if (!title || !theme) {
        console.error(`❌ Cannot regenerate section - missing title or theme`);
        alert("Please enter a title and theme before regenerating sections.");
        return;
      }
      
      console.log(`🔄 Starting regeneration for section ${index + 1}: "${currentSection.title}"`);
      console.log(`📄 Using title: "${title}" and theme: "${theme}"`);
      
      // Show prompt dialog
      const promptText = window.prompt(
        `Enter instructions for regenerating section "${currentSection.title}":`,
        `Improve section ${index + 1} to make it more detailed and engaging.`
      );
      
      // If user cancels, return early
      if (promptText === null) {
        console.log(`⏱️ Regeneration cancelled by user for section ${index + 1}`);
        return;
      }
      
      // Use the prompt from dialog
      const regenerationPrompt = promptText.trim();
      console.log(`📝 User provided prompt for section ${index + 1}: "${regenerationPrompt}"`);
      
      console.log(`🔄 Sending regeneration request to API for section ${index + 1}`);
      const response = await fetch("/api/regenerate-segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionIndex: index,
          currentSection,
          additionalPrompt: regenerationPrompt,
          forbiddenWords,
          title, // Add title to the request for context
          theme  // Add theme to the request for context
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to regenerate segment. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Regeneration successful for section ${index + 1}. New title: "${data.updatedSection.title}"`);
      
      const newSections = [...currentScriptSections];
      newSections[index as number] = data.updatedSection;
      
      if (onScriptSectionsChange) {
        onScriptSectionsChange(newSections);
      }
      
      // Clear the regenerate prompt and selected segment
      setRegeneratePrompt("");
      setSelectedSegmentIndex(null);
    } catch (error) {
      console.error(`❌ Error regenerating segment ${index !== null ? index + 1 : 'unknown'}:`, error);
    }
  };

  // Function to split text into 500-word segments for display
  const splitIntoSegments = (text: string, wordsPerSegment = 500): string[] => {
    if (!text) return [];
    
    const words = text.split(/\s+/);
    const segments: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      segments.push(words.slice(i, i + wordsPerSegment).join(' '));
    }
    
    return segments;
  };
  
  const scriptSegments = splitIntoSegments(currentFullScript);

  // Update the handleRegenerateScriptSegment function to better handle regeneration prompts
  const handleRegenerateScriptSegment = async (segmentIndex: number, segmentContent: string, prompt?: string) => {
    try {
      console.log(`🔄 Starting regeneration for script segment ${segmentIndex + 1}`);
      // Verify title and theme are available
      if (!title || !theme) {
        console.error(`❌ Cannot regenerate script segment - missing title or theme`);
        alert("Please enter a title and theme before regenerating script segments.");
        return;
      }

      console.log(`📄 Using title: "${title}" and theme: "${theme}"`);
      setIsGeneratingScript(true);
      
      // Use the provided prompt or fall back to the current regeneratePrompt state
      const regenerationPrompt = prompt || regeneratePrompt;
      console.log(`📝 Using prompt for script segment ${segmentIndex + 1}: "${regenerationPrompt}"`);
      
      console.log(`🔄 Sending regeneration request to API for script segment ${segmentIndex + 1}`);
      const response = await fetch("/api/regenerate-script-segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          segmentIndex, 
          segmentContent,
          title,
          theme,
          additionalPrompt: regenerationPrompt,
          forbiddenWords
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to regenerate script segment. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully regenerated script segment ${segmentIndex + 1}. Word count: ${data.wordCount || 'unknown'}`);
      
      // Replace this segment in the full script
      if (currentFullScript && data.regeneratedContent) {
        // Split the script into segments
        const segments = splitIntoSegments(currentFullScript);
        
        // Replace the specified segment
        segments[segmentIndex] = data.regeneratedContent;
        
        // Rejoin the segments
        const updatedScript = segments.join(' ');
        
        // Update the full script
        if (onFullScriptChange) {
          onFullScriptChange({ 
            scriptWithMarkdown: updatedScript, 
            scriptCleaned: updatedScript 
          });
        }
        
        // Update word count
        updateScriptWordCount(updatedScript);
        console.log(`📊 Updated full script after segment regeneration. Total length: ${updatedScript.split(/\s+/).length} words`);
      }
      
      // Clear the regenerate prompt and selected segment
      setRegeneratePrompt("");
      setSelectedSegmentIndex(null);
    } catch (error) {
      console.error(`❌ Error regenerating script segment ${segmentIndex + 1}:`, error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Add a new direct regeneration function that includes a prompt dialog
  const handleDirectRegeneration = async (segmentIndex: number, segmentContent: string) => {
    console.log(`🔄 Initiating direct regeneration for segment ${segmentIndex + 1}`);
    
    // Verify title is available
    if (!title) {
      console.error(`❌ Cannot regenerate script segment - missing title`);
      alert("Please enter a title before regenerating script segments.");
      return;
    }
    
    // Show prompt dialog
    const prompt = window.prompt("Enter instructions for rewriting this segment:", `Rewrite segment ${segmentIndex + 1} to make it more engaging and impactful.`);
    
    // If user cancels, return early
    if (prompt === null) {
      console.log(`⏱️ Direct regeneration cancelled by user for segment ${segmentIndex + 1}`);
      return;
    }
    
    console.log(`📝 User provided prompt for direct regeneration of segment ${segmentIndex + 1}: "${prompt}"`);
    
    // Regenerate with the prompt
    await handleRegenerateScriptSegment(segmentIndex, segmentContent, prompt);
  };

  return (
    <div className="space-y-8 relative animate-fadeIn">
      {/* Animated background blobs */}
      <div className="blob w-[300px] h-[300px] top-0 right-0 opacity-10"></div>
      
      <Tabs defaultValue="form" className="relative z-10">
        <TabsList className="mb-4 backdrop-blur-sm bg-opacity-20 bg-red-900 border border-red-700/20 shadow-glow-red">
          <TabsTrigger value="form" className="data-[state=active]:bg-red-700/20 data-[state=active]:text-red-300 data-[state=active]:shadow-glow-red">
            <span className="glow-text-red">Basic Settings</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-red-800/20 data-[state=active]:text-red-400 data-[state=active]:shadow-glow-red">
            <span className="glow-text-red">Advanced Options</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="w-full space-y-6 px-6 pt-2 pb-6 rounded-lg animate-slideUp futuristic-card shadow-glow-red">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-400" />
              Script Generator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex justify-between">
                <span className="glow-text">Title</span>
                {!title && <span className="text-red-500 text-xs">Required for regeneration</span>}
              </Label>
              <Input
                id="title"
                placeholder="Enter a title for your script"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`futuristic-input ${!title ? "border-red-300 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wordCount" className="glow-text">Word Count</Label>
              <Input
                id="wordCount"
                type="number"
                min={1000}
                max={100000}
                step={1000}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="futuristic-input"
              />
              <p className="text-xs text-muted-foreground">
                This will generate {Math.max(1, Math.floor(wordCount / 800))} script sections
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme" className="flex justify-between">
                <span className="glow-text">Story Theme</span>
              </Label>
              <Input
                id="theme"
                placeholder="E.g., Mystery, Romance, Sci-Fi"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="futuristic-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalPrompt" className="glow-text">Additional Instructions (Optional)</Label>
            <Textarea
              id="additionalPrompt"
              placeholder="Add any specific instructions for the AI to follow when generating your script"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              className="min-h-[80px] futuristic-input"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 relative overflow-hidden shimmer bg-gradient-to-r from-blue-600/80 to-blue-700/80 border-0 shadow-glow-blue" 
              onClick={handleGenerateOutline}
              disabled={isGeneratingOutline || !title}
            >
              {isGeneratingOutline ? "Generating..." : (
                <>
                  <PanelLeft className="mr-2 h-4 w-4" />
                  Generate Outline
                </>
              )}
            </Button>
            
            <Button 
              className="flex-1 relative overflow-hidden shimmer bg-gradient-to-r from-red-600/80 to-red-700/80 border-0 shadow-glow-red" 
              onClick={handleGenerateFullScript}
              disabled={isGeneratingScript || !title || !hasGeneratedOutline}
            >
              {isGeneratingScript ? "Generating..." : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>
            
            {currentFullScript && (
              <Button 
                variant="outline"
                onClick={handleDownloadDocx}
                className="flex-1 gap-2 futuristic-input hover:bg-red-600/20 hover:shadow-glow-red"
              >
                <DownloadCloud size={16} className="text-red-400" />
                Download DOCX
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="w-full space-y-6 px-6 pt-2 pb-6 rounded-lg animate-slideUp futuristic-card shadow-glow-red">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-400" />
              Advanced Options
            </h2>
            <p className="text-muted-foreground">
              Fine-tune your script generation with these advanced settings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="videoFormat" className="glow-text-red">Video Format</Label>
                <select
                  id="videoFormat"
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value)}
                  className="futuristic-input w-full"
                >
                  <option value="Explainer">Explainer</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Documentary">Documentary</option>
                  <option value="Drama">Drama</option>
                  <option value="Romance">Romance</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hookStyle" className="glow-text-red">Hook Style</Label>
                <select
                  id="hookStyle"
                  value={hookStyle}
                  onChange={(e) => setHookStyle(e.target.value)}
                  className="futuristic-input w-full"
                >
                  <option value="Emotional">Emotional</option>
                  <option value="Shocking">Shocking</option>
                  <option value="Mysterious">Mysterious</option>
                  <option value="Question-based">Question-based</option>
                  <option value="Psychological">Psychological</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toneOfVoice" className="glow-text-red">Tone of Voice</Label>
                <Input
                  id="toneOfVoice"
                  placeholder="e.g., Enthusiastic, Calm, Humorous"
                  value={toneOfVoice}
                  onChange={(e) => setToneOfVoice(e.target.value)}
                  className="futuristic-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetEmotion" className="glow-text-red">Target Emotion</Label>
                <Input
                  id="targetEmotion"
                  placeholder="e.g., Joy, Surprise, Curiosity"
                  value={targetEmotion}
                  onChange={(e) => setTargetEmotion(e.target.value)}
                  className="futuristic-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retentionStructure" className="glow-text-red">Retention Structure</Label>
              <Textarea
                id="retentionStructure"
                placeholder="Describe how to maintain audience engagement (e.g., cliffhangers, storytelling arcs)"
                value={retentionStructure}
                onChange={(e) => setRetentionStructure(e.target.value)}
                className="min-h-[80px] futuristic-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="callToAction" className="glow-text-red">Call to Action (CTA)</Label>
              <Input
                id="callToAction"
                placeholder="e.g., Subscribe, Visit our website, Share this video"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="futuristic-input"
              />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="pointOfView" className="glow-text-red">Point of View</Label>
                <select
                  id="pointOfView"
                  value={pointOfView}
                  onChange={(e) => setPointOfView(e.target.value)}
                  className="futuristic-input w-full"
                >
                  <option value="1st Person">1st Person</option>
                  <option value="3rd Person">3rd Person</option>
                </select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="inspirationalTranscript" className="glow-text-red">Inspirational Video Transcript</Label>
              <Textarea
                id="inspirationalTranscript"
                placeholder="Paste a transcript from a video that you'd like to use as inspiration"
                value={inspirationalTranscript}
                onChange={(e) => setInspirationalTranscript(e.target.value)}
                className="min-h-[150px] futuristic-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forbiddenWords" className="glow-text-red">Forbidden Words (comma-separated)</Label>
              <Input
                id="forbiddenWords"
                placeholder="Words to avoid in the generated script, separated by commas"
                value={forbiddenWords}
                onChange={(e) => setForbiddenWords(e.target.value)}
                className="futuristic-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadScript" className="glow-text-red">Upload Existing Script</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="uploadScript"
                  type="file"
                  accept=".txt,.md,.docx"
                  onChange={handleFileUpload}
                  className="flex-1 futuristic-input"
                />
                <Button variant="outline" className="gap-2 futuristic-input hover:bg-red-600/20 hover:shadow-glow-red">
                  <Upload size={16} className="text-red-400" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Content Sections */}
      <div className="space-y-6 relative z-10">
        {/* Show loading animation during outline generation, regardless of hasGeneratedOutline */}
        {isGeneratingOutline && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Outline Loading */}
            <div className="space-y-4 animate-slideUp">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <PanelLeft className="h-5 w-5 text-blue-400" />
                    Script Outline
                  </h2>
                  <p className="text-muted-foreground">
                    Generating your content structure...
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 backdrop-blur-md bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-4"
              >
                <div>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-400">
                      Outline Generation in Progress
                    </span>
                  </Label>
                  <p className="text-sm text-slate-300 ml-7">
                    Neural rendering pipeline processing your content structure...
                  </p>
                </div>
                <div className="border border-blue-700/30 rounded-md p-4 bg-black/20 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-blue-600 animate-spin" style={{ animationDuration: '3s' }}></div>
                    </div>
                    <p className="text-blue-200 text-sm">
                      Estimated completion: ~20 seconds
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Placeholder during outline generation */}
            <div className="space-y-4 animate-slideUp">
              <div className="space-y-2 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-400" />
                    Full Script
                  </h2>
                  <p className="text-muted-foreground">
                    Generate an outline first, then create your script.
                  </p>
                </div>
              </div>
              
              <div className="h-[600px] flex items-center justify-center border rounded-lg futuristic-card">
                <p className="text-muted-foreground glow-text-red text-center">
                  Generate an outline first, then create your script
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show outline sections when generated and not currently generating */}
        {hasGeneratedOutline && !isGeneratingOutline && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Outline Sections */}
            <div className="space-y-4 animate-slideUp">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <PanelLeft className="h-5 w-5 text-blue-400" />
                    Script Outline
                  </h2>
                  <p className="text-muted-foreground">
                    Edit sections or regenerate the entire outline.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleAddSection}
                    size="sm"
                    className="futuristic-input hover:bg-blue-600/20 hover:shadow-glow-blue"
                  >
                    <Plus size={16} className="mr-2 text-blue-400" />
                    Add Section
                  </Button>
                  <Button 
                    onClick={handleRegenerateOutline}
                    disabled={isGeneratingOutline}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 border-0 shadow-glow-blue"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    REGENERATE
                  </Button>
                </div>
              </div>

              <div className="space-y-3 futuristic-scrollbar overflow-y-auto max-h-[600px] pr-2">
                {outlineSections.map((section, index) => (
                  <div 
                    key={section.id} 
                    className="border rounded-lg p-4 futuristic-card animate-zoomIn hover:shadow-glow-blue transition-all"
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    {editingSection === section.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="font-medium futuristic-input"
                          placeholder="Section title"
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="text-sm futuristic-input"
                          rows={3}
                          placeholder="Section description"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCancelEdit}
                            className="futuristic-input"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-green-600/80 hover:bg-green-700/80"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium glow-text-blue text-lg">{section.title}</h3>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSection(section)}
                              className="p-1 h-8 w-8 hover:bg-blue-600/20"
                            >
                              <Edit size={14} className="text-blue-400" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 h-8 w-8 hover:bg-red-600/20"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Full Script */}
            <div className="space-y-4 animate-slideUp">
              <div className="space-y-2 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-400" />
                    Full Script
                  </h2>
                  <p className="text-muted-foreground">
                    The complete script based on your outline.
                  </p>
                </div>
                {currentFullScript && (
                  <div className="text-sm font-medium glow-text-red bg-red-900/20 px-3 py-1 rounded-full border border-red-700/30">
                    Word Count: {wordCount}
                  </div>
                )}
              </div>
              
              {isGeneratingScript ? (
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
                        Script Generation in Progress
                      </span>
                    </Label>
                    <p className="text-sm text-slate-300 ml-7">
                      Advanced language models crafting your narrative content...
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
                        Estimated completion: ~30 seconds
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : !currentFullScript ? (
                <div className="h-[600px] flex items-center justify-center border rounded-lg futuristic-card">
                  <p className="text-muted-foreground glow-text-red text-center">
                    {hasGeneratedOutline 
                      ? "Click 'Generate Script' to create your full script"
                      : "Generate an outline first, then create your script"}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 futuristic-card shadow-glow-red futuristic-scrollbar overflow-y-auto max-h-[600px]">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <h1 className="text-xl font-bold mb-4 gradient-text">{title}</h1>
                    <ReactMarkdown>{currentFullScript}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show form prompts if no outline generated yet and not currently generating */}
        {!hasGeneratedOutline && !isGeneratingOutline && (
          <div className="h-[300px] flex items-center justify-center border rounded-lg futuristic-card">
            <div className="text-center space-y-4">
              <PanelLeft className="h-12 w-12 text-blue-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium glow-text-blue">Start with an Outline</h3>
                <p className="text-muted-foreground mt-2">
                  Generate an outline first to organize your script into structured sections.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator; 