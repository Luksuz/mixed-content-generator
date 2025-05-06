"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScriptSectionCard from "../_components/script-section-card";
import { ScriptSection } from "@/types";
import { Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ScriptGenerator = () => {
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [theme, setTheme] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptSections, setScriptSections] = useState<ScriptSection[]>([]);
  const [fullScript, setFullScript] = useState("");

  const handleGenerateOutline = async () => {
    try {
      setIsLoading(true);
      setFullScript("");
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, wordCount, theme }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate script outline");
      }
      
      const data = await response.json();
      setScriptSections(data.sections);
    } catch (error) {
      console.error("Error generating script outline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFullScript = async () => {
    if (scriptSections.length === 0) return;
    
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
          sections: scriptSections 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate full script");
      }
      
      const data = await response.json();
      setFullScript(data.script);
    } catch (error) {
      console.error("Error generating full script:", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleUpdateSection = (index: number, updatedSection: ScriptSection) => {
    const newSections = [...scriptSections];
    newSections[index] = updatedSection;
    setScriptSections(newSections);
  };

  const handleDownloadDocx = async () => {
    if (!fullScript) return;
    
    try {
      const response = await fetch("/api/download-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title, 
          content: fullScript 
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

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="w-full space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Script Generator</h2>
          <p className="text-muted-foreground">
            Create a script using AI. Fill in the details below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your script"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wordCount">Word Count</Label>
            <Input
              id="wordCount"
              type="number"
              min={1000}
              step={1000}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              This will generate {Math.max(1, Math.floor(wordCount / 1000))} script sections
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Story Theme</Label>
            <Input
              id="theme"
              placeholder="E.g., Mystery, Romance, Sci-Fi"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1" 
            onClick={handleGenerateOutline}
            disabled={isLoading || isGeneratingScript || !title || !theme}
          >
            {isLoading ? "Generating..." : "Generate Outline"}
          </Button>
          
          <Button 
            className="flex-1" 
            variant="secondary"
            onClick={handleGenerateFullScript}
            disabled={isGeneratingScript || isLoading || scriptSections.length === 0}
          >
            {isGeneratingScript ? "Generating..." : "Generate Full Script"}
          </Button>
          
          {fullScript && (
            <Button 
              variant="outline"
              onClick={handleDownloadDocx}
              className="flex-1 gap-2"
            >
              <Download size={16} />
              Download DOCX
            </Button>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Outlines Section */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Script Outline</h2>
            <p className="text-muted-foreground">
              Edit the generated sections to refine your script outline.
            </p>
          </div>

          {scriptSections.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                {isLoading 
                  ? "Generating your script sections..." 
                  : "Generate an outline to see sections here"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scriptSections.map((section, index) => (
                <ScriptSectionCard
                  key={index}
                  section={section}
                  index={index}
                  onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Full Script Section */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Full Script</h2>
            <p className="text-muted-foreground">
              The complete script based on your outline.
            </p>
          </div>
          
          {!fullScript ? (
            <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                {isGeneratingScript 
                  ? "Generating your full script..." 
                  : "Generate a full script to see it here"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-card shadow-sm overflow-y-auto max-h-[600px]">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h1 className="text-xl font-bold mb-4">{title}</h1>
                <ReactMarkdown>{fullScript}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator; 