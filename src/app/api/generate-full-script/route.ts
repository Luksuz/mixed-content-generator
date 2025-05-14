"use server";

import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ScriptSection } from "@/types";
import { removeMarkdown } from "../../../lib/utils";

export async function POST(request: Request) {
  try {
    const { title, theme, sections } = await request.json();
    console.log("Received request with title:", title);
    console.log("Received request with theme:", theme);
    console.log("Received request with sections:", sections);
    
    if (!title || !theme || !sections || sections.length === 0) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Process all sections concurrently
    const sectionPromises = sections.map(async (section: ScriptSection, index: number) => {
      // Create a prompt for each section
      const sectionPrompt = `
You are a professional writer creating a section of a script based on the following outline:

TITLE: ${title}
THEME: ${theme}
SECTION ${index + 1} TITLE: ${section.title}
WRITING INSTRUCTIONS: ${section.writingInstructions}

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
      let sectionContent = "";
      
      if (typeof response.content === 'string') {
        sectionContent = response.content;
      } else if (Array.isArray(response.content)) {
        sectionContent = response.content
          .map(item => {
            if (typeof item === 'string') return item;
            if ('text' in item) return item.text;
            return '';
          })
          .join('\n');
      }

      // Return the section with its index to maintain order
      return {
        index,
        title: section.title,
        content: sectionContent
      };
    });

    // Wait for all sections to complete
    const completedSections = await Promise.all(sectionPromises);
    
    // Sort sections by index to maintain order
    completedSections.sort((a, b) => a.index - b.index);
    
    // Combine all sections into the full script with markdown headings
    const fullScriptWithMarkdown = completedSections
      .map(section => `## ${section.title}\n\n${section.content}\n\n`)
      .join('');

    const scriptCleaned = removeMarkdown(fullScriptWithMarkdown);

    return NextResponse.json({ 
      scriptWithMarkdown: fullScriptWithMarkdown, 
      scriptCleaned: scriptCleaned 
    });
  } catch (error) {
    console.error("Error generating full script:", error);
    return NextResponse.json(
      { error: "Failed to generate full script" },
      { status: 500 }
    );
  }
} 