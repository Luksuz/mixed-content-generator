"use server";

import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ScriptSection } from "@/types";

export async function POST(request: Request) {
  try {
    const { title, theme, sections } = await request.json();
    
    if (!title || !theme || !sections || sections.length === 0) {
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

    // Process all sections concurrently
    const sectionPromises = sections.map(async (section: ScriptSection, index: number) => {
      // Create a prompt for each section
      const sectionPrompt = `
You are a professional writer creating a section of a script based on the following outline:

TITLE: ${title}
THEME: ${theme}
SECTION ${index + 1} TITLE: ${section.title}
WRITING INSTRUCTIONS: ${section.writingInstructions}

Create an engaging section of the script based on these instructions. 
Format your response using proper Markdown:
- Use **bold** for emphasis
- Use *italics* for character thoughts or important phrases
- Use > blockquotes for memorable dialogue
- Use proper paragraph breaks for readability
- Use ### for sub-headings if needed

Focus on quality writing, compelling dialogue, and vivid descriptions.
Write approximately 500-800 words for this section.
DO NOT include any commentary, just the story content.
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
    const fullScript = completedSections
      .map(section => `## ${section.title}\n\n${section.content}\n\n`)
      .join('');

    return NextResponse.json({ script: fullScript });
  } catch (error) {
    console.error("Error generating full script:", error);
    return NextResponse.json(
      { error: "Failed to generate full script" },
      { status: 500 }
    );
  }
} 