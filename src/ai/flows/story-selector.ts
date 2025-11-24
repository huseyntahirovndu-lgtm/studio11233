/**
 * @fileOverview An AI agent for selecting top student success stories.
 *
 * - selectTopStories - A function that selects the most compelling success stories.
 * - StorySelectorInput - The input type for the selectTopStories function.
 * - StorySelectorOutput - The return type for the selectTopStories function.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  faculty: z.string(),
  successStory: z.string(),
});

const StorySelectorInputSchema = z.object({
  stories: z.array(StudentProfileSchema).describe('A list of all student profiles that have a success story.'),
});

export type StorySelectorInput = z.infer<typeof StorySelectorInputSchema>;

const SelectedStorySchema = z.object({
  studentId: z.string().describe("The ID of the student whose story was selected."),
  name: z.string().describe("The full name of the student."),
  faculty: z.string().describe("The faculty of the student."),
  story: z.string().describe("The selected success story."),
});

const StorySelectorOutputSchema = z.object({
  selectedStories: z.array(SelectedStorySchema).describe('An array of the most inspiring and well-written success stories.'),
});

export type StorySelectorOutput = z.infer<typeof StorySelectorOutputSchema>;

export async function selectTopStories(
  input: StorySelectorInput
): Promise<StorySelectorOutput> {
  return storySelectorFlow(input);
}

const strictOutputSchema = z.object({
  selectedStories: z.array(SelectedStorySchema).length(2).describe('An array of exactly two of the most inspiring and well-written success stories.'),
});

const prompt = ai.definePrompt({
  name: 'storySelectorPrompt',
  input: { schema: StorySelectorInputSchema },
  output: { schema: strictOutputSchema },
  prompt: `You are a public relations expert for Naxçıvan Dövlət Universiteti. Your task is to analyze a list of student success stories and select the top 2 to feature on the university's homepage.

Instructions:
1.  Review all the provided stories.
2.  Select exactly TWO stories that are the most compelling, inspiring, and well-written.
3.  Prioritize stories that demonstrate concrete outcomes (e.g., getting a job, winning a competition, launching a project) and show the positive impact of the university or the "İstedad Mərkəzi" platform.
4.  Ensure the selected stories are diverse in terms of faculty or achievement type, if possible.
5.  Format the output according to the specified schema, including the student's ID, name, faculty, and their story.

List of available success stories:
{{{json stories}}}

Select the best two stories from this list.`,
});

const storySelectorFlow = ai.defineFlow(
  {
    name: 'storySelectorFlow',
    inputSchema: StorySelectorInputSchema,
    outputSchema: StorySelectorOutputSchema,
  },
  async (input) => {
    // If there are 2 or fewer stories, just return them without calling the AI.
    if (input.stories.length <= 2) {
      return {
        selectedStories: input.stories.map(s => ({
          studentId: s.id,
          name: `${s.firstName} ${s.lastName}`,
          faculty: s.faculty,
          story: s.successStory,
        })),
      };
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
