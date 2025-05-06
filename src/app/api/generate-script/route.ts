import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { scriptSectionsSchema } from "../../../../zodSchemas/scriptSection";

export async function POST(request: Request) {
  try {
    const { title, wordCount, theme } = await request.json();
    
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
    const numSections = Math.max(1, Math.floor(wordCount / 1000));

    // Create the prompt for the model
    const prompt = `
    You are a professional script outline generator. Create a detailed script outline for a story with the following details:

    Title: ${title}
    Theme: ${theme}
    Word Count: ${wordCount} words

    Based on the word count, I want you to generate ${numSections} sections for this script.
    
    Each section should have:
    1. A compelling title that captures the essence of that section
    2. Detailed writing instructions (approximately 100-200 words) that explain what should happen in that section, including plot developments, character interactions, and thematic elements.
    
    Make the sections flow logically from one to another to create a cohesive narrative.
    
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
          if ('text' in item) return item.text;
          return '';
        })
        .join('\n');
    }
        
    const parsedResponse = await parser.parse(contentString);

    return NextResponse.json({ sections: parsedResponse });
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
} 