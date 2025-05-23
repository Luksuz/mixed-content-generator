"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ScriptSectionCard from "../_components/script-section-card";
import { ScriptSection } from "@/types";
import { Download, Upload, RefreshCw, Sparkles, FileText, DownloadCloud } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptWordCount, setScriptWordCount] = useState(0);
  const [uploadedScript, setUploadedScript] = useState("");
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  
  // Store form values in localStorage to persist between renders
  useEffect(() => {
    // Load saved values from localStorage on initial component mount
    const savedTitle = localStorage.getItem('scriptGenerator.title');
    const savedWordCount = localStorage.getItem('scriptGenerator.wordCount');
    const savedTheme = localStorage.getItem('scriptGenerator.theme');
    const savedAdditionalPrompt = localStorage.getItem('scriptGenerator.additionalPrompt');
    const savedForbiddenWords = localStorage.getItem('scriptGenerator.forbiddenWords');
    
    if (savedTitle) setTitle(savedTitle);
    if (savedWordCount) setWordCount(parseInt(savedWordCount));
    if (savedTheme) setTheme(savedTheme);
    if (savedAdditionalPrompt) setAdditionalPrompt(savedAdditionalPrompt);
    if (savedForbiddenWords) setForbiddenWords(savedForbiddenWords);
  }, []);
  
  // Save form values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('scriptGenerator.title', title);
    localStorage.setItem('scriptGenerator.wordCount', wordCount.toString());
    localStorage.setItem('scriptGenerator.theme', theme);
    localStorage.setItem('scriptGenerator.additionalPrompt', additionalPrompt);
    localStorage.setItem('scriptGenerator.forbiddenWords', forbiddenWords);
  }, [title, wordCount, theme, additionalPrompt, forbiddenWords]);

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

  // When full script changes, update word count
  if (currentFullScript && scriptWordCount === 0) {
    updateScriptWordCount(currentFullScript);
  }

  const handleGenerateOutline = async () => {
    try {
      setIsLoading(true);
      if (onFullScriptChange) onFullScriptChange({ scriptWithMarkdown: "", scriptCleaned: "" });
      
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title, 
          wordCount, 
          theme, 
          additionalPrompt, 
          inspirationalTranscript, 
          forbiddenWords 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate script outline");
      }
      
      const data = await response.json();
      if (onScriptSectionsChange) {
        onScriptSectionsChange(data.sections);
      }
    } catch (error) {
      console.error("Error generating script outline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFullScript = async () => {
    if (currentScriptSections.length === 0) return;
    
    try {
      setIsGeneratingScript(true);
      const response = await fetch("/api/generate-full-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title, 
          theme, 
          sections: currentScriptSections,
          additionalPrompt,
          forbiddenWords
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate full script");
      }
      
      const data = await response.json();
      if (onFullScriptChange) {
        onFullScriptChange(data);
      }
      
      // Set the word count if it's included in the response
      if (data.wordCount) {
        setScriptWordCount(data.wordCount);
      } else {
        // Otherwise, calculate it from the script
        updateScriptWordCount(data.scriptWithMarkdown);
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
            <p className="text-muted-foreground">
              Create a script using AI. Fill in the details below.
            </p>
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
              className="flex-1 relative overflow-hidden shimmer bg-gradient-to-r from-red-600/80 to-red-700/80 border-0 shadow-glow-red" 
              onClick={handleGenerateOutline}
              disabled={isLoading || isGeneratingScript || !title}
            >
              {isLoading ? "Generating..." : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Outline
                </>
              )}
            </Button>
            
            <Button 
              className="flex-1 relative overflow-hidden shimmer bg-gradient-to-r from-red-700/80 to-red-800/80 border-0 shadow-glow-red" 
              variant="secondary"
              onClick={handleGenerateFullScript}
              disabled={isGeneratingScript || isLoading || currentScriptSections.length === 0}
            >
              {isGeneratingScript ? "Generating..." : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Full Script
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
      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Outlines Section */}
        <div className="w-full lg:w-1/2 space-y-6 animate-slideUp">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-400" />
              Script Outline
            </h2>
            <p className="text-muted-foreground">
              Edit the generated sections to refine your script outline.
            </p>
          </div>

          {currentScriptSections.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border rounded-lg futuristic-card">
              <p className="text-muted-foreground glow-text">
                {isLoading 
                  ? "Generating your script sections..." 
                  : "Generate an outline to see sections here"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 futuristic-scrollbar overflow-y-auto max-h-[600px] pr-2">
              {currentScriptSections.map((section, index) => (
                <ScriptSectionCard
                  key={index}
                  section={section}
                  index={index}
                  onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
                  onSelectForRegeneration={() => handleRegenerateSegment(index)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Full Script Section */}
        <div className="w-full lg:w-1/2 space-y-6 animate-slideUp">
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
                Word Count: {scriptWordCount}
              </div>
            )}
          </div>
          
          {!currentFullScript ? (
            <div className="h-[300px] flex items-center justify-center border rounded-lg futuristic-card">
              <p className="text-muted-foreground glow-text-red">
                {isGeneratingScript 
                  ? "Generating your full script..." 
                  : "Generate a full script to see it here"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 futuristic-card shadow-glow-red futuristic-scrollbar overflow-y-auto max-h-[600px]">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <h1 className="text-xl font-bold mb-4 gradient-text">{title}</h1>
                  <ReactMarkdown>{currentFullScript}</ReactMarkdown>
                </div>
              </div>
              
              {scriptSegments.length > 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium glow-text-red">Script Segments</h3>
                  <p className="text-sm text-muted-foreground">
                    The script is divided into segments of approximately 500 words each for easier editing.
                  </p>
                  
                  <div className="space-y-4 futuristic-scrollbar overflow-y-auto max-h-[400px] pr-2">
                    {scriptSegments.map((segment, index) => (
                      <div key={index} className="border rounded-lg p-4 futuristic-card animate-zoomIn" style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium glow-text-red">Segment {index + 1}</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDirectRegeneration(index, segment)}
                            disabled={isGeneratingScript}
                            className="futuristic-input hover:bg-red-600/20 hover:shadow-glow-red"
                          >
                            <RefreshCw size={14} className="mr-2 text-red-400" />
                            Regenerate
                          </Button>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{segment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator; 