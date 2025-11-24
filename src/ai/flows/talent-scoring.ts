/**
 * @fileOverview A talent scoring AI agent.
 *
 * - calculateTalentScore - A function that handles the talent scoring process.
 * - CalculateTalentScoreInput - The input type for the calculateTalentScore function.
 * - CalculateTalentScoreOutput - The return type for the calculateTalentScore function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentProfileForScoringSchema = z.object({
  id: z.string(),
  talentScore: z.number().optional(),
  skills: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  certificates: z.array(z.any()).optional(),
  gpa: z.number().optional(),
  courseYear: z.number().optional(),
});


const CalculateTalentScoreInputSchema = z.object({
  targetStudentId: z.string().describe("The ID of the student whose score needs to be calculated."),
  allStudents: z.array(StudentProfileForScoringSchema).describe("An array of all student profiles to be used for context and comparison."),
});

export type CalculateTalentScoreInput = z.infer<typeof CalculateTalentScoreInputSchema>;

const CalculateTalentScoreOutputSchema = z.object({
  talentScore: z
    .number()
    .describe(
      'A composite score representing the overall talent of the student, between 0 and 100.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of the factors that influenced the talent score, with specific examples from the profile data and comparison to other students.'
    ),
});

export type CalculateTalentScoreOutput = z.infer<typeof CalculateTalentScoreOutputSchema>;

export async function calculateTalentScore(
  input: CalculateTalentScoreInput
): Promise<CalculateTalentScoreOutput> {
  return calculateTalentScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateTalentScorePrompt',
  input: {schema: CalculateTalentScoreInputSchema},
  output: {schema: CalculateTalentScoreOutputSchema},
  prompt: `You are an expert talent evaluator for Naxçıvan Dövlət Universiteti. Your task is to assess a specific student's profile (the target student) and assign a talent score based on the information provided, comparing them to the entire pool of students.

Instructions:
1.  Identify the target student using 'targetStudentId' from the 'allStudents' array.
2.  Analyze the target student's profile data, including skills, projects, achievements, certificates, GPA, and course year.
3.  **Crucially, compare the target student's profile against the profiles of all other students in the 'allStudents' array.**
4.  Assign a talent score between 0 and 100 to the target student. This score should be relative. For example, if the target student has won a 'Regional' award, but many other students have 'International' awards, their score should reflect this context.
5.  Provide a clear and concise explanation for the score. Justify your assessment by citing specific examples from the target student's profile and explaining how they stack up against the broader student population.

Consider these factors in your relative assessment:
*   **Skills:** Are the target student's skills common or rare? How do they compare in number and level ('İrəli', 'Orta') to the average student?
*   **Projects:** Is the complexity and quality of their projects above or below average?
*   **Achievements:** What is the significance of their achievements compared to others? (International > Republic > Regional > University).
*   **Certificates:** How do their certificates compare in level and prestige?
*   **GPA/Course Year:** A high GPA for a 4th-year student might be weighted more than for a 1st-year student.

Student Pool Data:
{{{json allStudents}}}

Calculate the talent score for the student with ID '{{targetStudentId}}' based on this data.`,
});

const calculateTalentScoreFlow = ai.defineFlow(
  {
    name: 'calculateTalentScoreFlow',
    inputSchema: CalculateTalentScoreInputSchema,
    outputSchema: CalculateTalentScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
