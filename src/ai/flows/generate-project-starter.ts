'use server';

/**
 * @fileOverview Flow for generating a project starter with a basic project structure and starter code.
 *
 * - generateProjectStarter - A function that generates a project starter based on a high-level description.
 * - GenerateProjectStarterInput - The input type for the generateProjectStarter function.
 * - GenerateProjectStarterOutput - The return type for the generateProjectStarter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProjectStarterInputSchema = z.object({
  description: z.string().describe('A high-level description of the application to generate.'),
});
export type GenerateProjectStarterInput = z.infer<typeof GenerateProjectStarterInputSchema>;

const GenerateProjectStarterOutputSchema = z.object({
  files: z.record(z.string(), z.string()).describe('A record of file paths to file contents for the generated project.'),
  summary: z.string().describe('A summary of the generated project'),
});
export type GenerateProjectStarterOutput = z.infer<typeof GenerateProjectStarterOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateProjectStarterPrompt',
  inputSchema: GenerateProjectStarterInputSchema,
  outputSchema: GenerateProjectStarterOutputSchema,
}, `You are an expert software architect that can generate the basic structure and boilerplate code for a project given a high-level description.

Given the following description:
{{description}}

Generate a project structure with starter code in each file. Return the project as a JSON object where keys are file paths and values are the file content. Be as complete as possible with all files and code to get the project up and running without additional modifications.
Assume the project is a NextJS project, so include the app directory.
Assume the project uses TailwindCSS for styling.
Do not use comments in the generated code.
Example output:
{
  "files": {
    "app/page.tsx": "export default function Home() { return <div>Hello World</div>; }",
    "app/components/MyComponent.tsx": "export default function MyComponent() { return <div>Component</div>; }",
    "tailwind.config.js": "module.exports = { content: ['./app/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] };"
  },
  "summary": "A basic Next.js project with TailwindCSS"
}
`);

const generateProjectStarterFlow = ai.defineFlow(
  {
    name: 'generateProjectStarterFlow',
    inputSchema: GenerateProjectStarterInputSchema,
    outputSchema: GenerateProjectStarterOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateProjectStarter(input: GenerateProjectStarterInput): Promise<GenerateProjectStarterOutput> {
  return generateProjectStarterFlow(input);
}
