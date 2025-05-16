"use server";

import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ScriptSection } from "@/types";
import { removeMarkdown } from "../../../lib/utils";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { title, theme, sections, additionalPrompt, forbiddenWords } = requestData;
    
    console.log("Received request for script generation:");
    console.log("- Title:", title);
    console.log("- Theme:", theme);
    console.log("- Sections:", Array.isArray(sections) ? `${sections.length} sections` : "None");
    console.log("- Additional Prompt:", additionalPrompt ? "Provided" : "None");
    console.log("- Forbidden Words:", forbiddenWords ? "Provided" : "None");
    
    if (!title || !theme || !sections || !Array.isArray(sections) || sections.length === 0) {
      console.log("Missing or invalid required fields");
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Initialize the model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });
    console.log("Model initialized");

    // Build additional instructions based on optional parameters
    let additionalInstructions = "";
    
    if (additionalPrompt && additionalPrompt.trim()) {
      additionalInstructions += `
ADDITIONAL INSTRUCTIONS:
${additionalPrompt.trim()}
`;
    }
    
    // Add forbidden words if provided
    if (forbiddenWords && forbiddenWords.trim()) {
      const wordsList = forbiddenWords.split(',').map((word: string) => word.trim()).filter(Boolean);
      if (wordsList.length > 0) {
        additionalInstructions += `
FORBIDDEN WORDS:
The following words should be completely avoided in your script: ${wordsList.join(', ')}.
`;
      }
    }

    // Create an async function to process a single section
    const processSection = async (section: ScriptSection, index: number) => {
      try {
        console.log(`Started processing section ${index + 1}: ${section.title}`);
        
        // Create a prompt for this section
      const sectionPrompt = `
You are a professional writer creating a section of a script based on the following outline:

TITLE: ${title}
THEME: ${theme}
SECTION ${index + 1} TITLE: ${section.title}
WRITING INSTRUCTIONS: ${section.writingInstructions}
${additionalInstructions}

Based on the WRITING INSTRUCTIONS, generate ONLY the text that is to be spoken aloud by a narrator for this section of the script.
Your response must exclusively contain the narrative and dialogue that will be voiced.
Do NOT include:
- Scene headings (e.g., "INT. CAFE - DAY")
- Character names before dialogue (unless the narrator is quoting someone like "John said: 'Hello'")
- Parentheticals or action descriptions (e.g., "(smiles)", "[He walks to the window]")
- Any visual descriptions or camera directions.
- Any form of commentary or notes about the script itself.

The WRITING INSTRUCTIONS already contain guidance on plot, character interactions, thematic elements, and specific Call to Actions (CTAs) that the narrator must say. Your task is to transform these instructions into a polished, narratable script.

Format the spoken text using Markdown where appropriate for emphasis or stylistic representation of speech (e.g., **bold** for emphasis, *italics* for thoughts if narrated).
Maintain a word count of approximately 500-800 words for this section, consisting purely of speakable text.
`;

      // Generate content for this section
      const response = await model.invoke(sectionPrompt);
        
        // Carefully extract content ensuring it's valid text
      let sectionContent = "";
      
      if (typeof response.content === 'string') {
        sectionContent = response.content;
      } else if (Array.isArray(response.content)) {
        sectionContent = response.content
          .map(item => {
            if (typeof item === 'string') return item;
              if (item && typeof item === 'object' && 'text' in item) return item.text;
            return '';
          })
          .join('\n');
      }

        // Validate we actually got content
        if (!sectionContent || sectionContent.trim() === '') {
          console.warn(`Warning: Empty content returned for section ${index + 1}`);
          sectionContent = `[Content for "${section.title}" could not be generated.]`;
        }

        console.log(`✓ Section ${index + 1} processed successfully: ${sectionContent.length} characters`);
        
        // Return the processed section
        return {
          index,
          title: section.title,
          content: sectionContent,
          success: true
        };
        
      } catch (sectionError) {
        console.error(`Error processing section ${index + 1}:`, sectionError);
        
        // Return a placeholder for the failed section
      return {
        index,
        title: section.title,
          content: `[An error occurred while generating content for "${section.title}". Please try again.]`,
          success: false
      };
      }
    };

    // Process all sections concurrently
    console.log(`Starting parallel processing of ${sections.length} sections...`);
    const sectionPromises = sections.map((section, index) => processSection(section, index));
    const results = await Promise.allSettled(sectionPromises);
    
    // Extract results, preserving order and handling any rejected promises
    const processedSections = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Promise rejected for section ${index + 1}:`, result.reason);
        return {
          index,
          title: sections[index].title,
          content: `[Failed to generate content for this section. Please try again.]`,
          success: false
        };
      }
    });
    
    // Sort sections by index to ensure correct order
    processedSections.sort((a, b) => a.index - b.index);
    
    // Log success/failure stats
    const successCount = processedSections.filter(s => s.success).length;
    console.log(`Processing complete: ${successCount}/${sections.length} sections successful`);
    
    // Combine all sections into the full script with markdown headings
    const fullScriptWithMarkdown = processedSections
      .map(section => `## ${section.title}\n\n${section.content}\n\n`)
      .join('');

    const scriptCleaned = removeMarkdown(fullScriptWithMarkdown);
    
    // Calculate word count
    const wordCount = scriptCleaned.split(/\s+/).filter(Boolean).length;
    console.log(`Full script generated successfully with ${wordCount} words`);

    return NextResponse.json({ 
      scriptWithMarkdown: fullScriptWithMarkdown, 
      scriptCleaned: scriptCleaned,
      wordCount
    });
  } catch (error) {
    console.error("Error generating full script:", error);
    return NextResponse.json(
      { error: "Failed to generate full script", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 