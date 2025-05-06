import { z } from "zod";

export const scriptSectionSchema = z.object({
  title: z.string().describe("The title of the script section"),
  writingInstructions: z.string().describe("Detailed instructions for writing this section of the script"),
});

export const scriptSectionsSchema = z.array(scriptSectionSchema)
  .describe("An array of script sections that make up the complete script outline");

export type ScriptSection = z.infer<typeof scriptSectionSchema>;
export type ScriptSections = z.infer<typeof scriptSectionsSchema>; 