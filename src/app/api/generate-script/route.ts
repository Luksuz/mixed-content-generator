import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { scriptSectionsSchema } from "../../../../zodSchemas/scriptSection";
import { removeMarkdown } from "../../../lib/utils";

export async function POST(request: Request) {
  try {
    const { 
      title, 
      wordCount, 
      theme, 
      additionalPrompt, 
      inspirationalTranscript, 
      forbiddenWords 
    } = await request.json();
    
    if (!title || !wordCount || !theme) {
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

    // Create a parser based on our Zod schema
    const parser = StructuredOutputParser.fromZodSchema(scriptSectionsSchema);

    // Calculate the number of sections based on word count
    const numSections = Math.max(1, Math.floor(wordCount / 800));

    // Build additions to the prompt based on optional parameters
    let additionalInstructions = "";
    
    // Add transcript as inspiration if provided
    if (inspirationalTranscript && inspirationalTranscript.trim()) {
      additionalInstructions += `
    INSPIRATIONAL TRANSCRIPT:
    Use the following transcript as inspiration for the tone, style, and structure of your script:
    ${inspirationalTranscript.trim()}
    `;
    }
    
    // Add forbidden words if provided
    if (forbiddenWords && forbiddenWords.trim()) {
      const wordsList = forbiddenWords.split(',').map((word: string) => word.trim()).filter(Boolean);
      if (wordsList.length > 0) {
        additionalInstructions += `
    FORBIDDEN WORDS:
    The following words should be completely avoided in your script outline: ${wordsList.join(', ')}.
    `;
      }
    }
    
    // Add any additional custom instructions
    if (additionalPrompt && additionalPrompt.trim()) {
      additionalInstructions += `
    ADDITIONAL INSTRUCTIONS:
    ${additionalPrompt.trim()}
    `;
    }

    // Create the prompt for the model
    const prompt = `
    You are a professional script outline generator. Create a detailed script outline for a story with the following details:

    Title: ${title}
    Theme: ${theme}
    Word Count: Approximately ${wordCount} words (this is the target for the story itself, CTAs will add to it)
    ${additionalInstructions}

    Based on the word count, I want you to generate ${numSections} main story sections for this script.
    
    Each section must have:
    1.  A 'title' that captures the essence of that section.
    2.  Detailed 'writingInstructions' (150-250 words for main content sections) that explain what should happen in that section, including plot developments, character interactions, and thematic elements. These instructions are for the narrator.
    3.  An 'image_generation_prompt' (a concise phrase or sentence, around 10-25 words) that describes the key visual elements of the scene for an AI image generator. This prompt should be purely descriptive of the visuals, suitable for direct use in image generation, and must avoid any taboo, sensitive, or controversial topics.

    IMPORTANT INSTRUCTIONS FOR NARRATOR CALLS TO ACTION (CTAs):
    You MUST incorporate the following CTAs directly into the 'writingInstructions' of the appropriate sections. These CTAs are spoken by the narrator. Ensure these CTAs are integrated naturally within the narrative flow where specified.

    1.  **CTA 1 (After Intro):** In the 'writingInstructions' for the section that immediately follows the initial introduction (the intro itself should be about 20-40 seconds of narration, so place this CTA in the next natural pause or transition within the first few minutes), include a paraphrased version of: "Before we jump back in, tell us where you're tuning in from, and if this story touches you, make sure you're subscribed—because tomorrow, I've saved something extra special for you!" Try to vary the phrasing of this CTA if you were to generate multiple scripts.
    2.  **CTA 2 (Mid-Script ~10 minutes / ~1500 words):** For scripts long enough to have a 10-minute mark (around 1500 words of story content), embed this CTA into the 'writingInstructions' of a suitable mid-point section: "Preparing and narrating this story took us a lot of time, so if you are enjoying it, subscribe to our channel, it means a lot to us! Now back to the story."
    3.  **CTA 3 (Later-Script ~40 minutes):** For very long scripts that would reach a 40-minute mark, embed this CTA into the 'writingInstructions' of an appropriate later section: "Enjoying the video so far? Don't forget to subscribe!"
    4.  **CTA 4 (End of Script):** After the main story narrative is completely finished, the 'writingInstructions' for the very final section (or a new, short concluding section you create) MUST include: "Up next, you've got two more standout stories right on your screen. If this one hit the mark, you won't want to pass these up. Just click and check them out! And don't forget to subscribe and turn on the notification bell, so you don't miss any upload from us!"

    Adherence to CTA placement and inclusion in 'writingInstructions' is critical.
    Make all sections flow logically. Ensure all generated content, including CTAs and image prompts, is safe, respectful, and avoids controversial subjects.

    ${parser.getFormatInstructions()}
    `;

    // Generate the outline
    const response = await model.invoke(prompt);
    
    // Parse the response - ensure we get a string
    let contentString = "";
    
    if (typeof response.content === 'string') {
      contentString = response.content;
    } else if (Array.isArray(response.content)) {
      // Extract text from array of complex message contents
      contentString = response.content
        .map(item => {
          if (typeof item === 'string') return item;
          // Handle text content if it's a text content object
          if (typeof item === 'object' && item !== null && 'text' in item && typeof item.text === 'string') return item.text;
          return '';
        })
        .join('\n');
    }
        
    const parsedResponse = await parser.parse(contentString);

    return NextResponse.json({ sections: parsedResponse });
  } catch (error) {
    console.error("Error generating script outline:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the script outline" },
      { status: 500 }
    );
  }
} 