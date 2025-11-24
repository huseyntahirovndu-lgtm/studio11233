/**
 * @fileOverview An AI agent for providing profile optimization recommendations.
 *
 * - getProfileRecommendations - A function that generates recommendations to improve a student's profile.
 * - ProfileOptimizerInput - The input type for the getProfileRecommendations function.
 * - ProfileOptimizerOutput - The return type for the getProfileRecommendations function.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProfileOptimizerInputSchema = z.object({
  profileData: z
    .string()
    .describe('The complete profile data of the student as a JSON string, including projects, skills, achievements, etc.'),
});

export type ProfileOptimizerInput = z.infer<typeof ProfileOptimizerInputSchema>;

const ProfileOptimizerOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe(
      'An array of 3 actionable and specific recommendations to improve the profile.'
    ),
});

export type ProfileOptimizerOutput = z.infer<typeof ProfileOptimizerOutputSchema>;

export async function getProfileRecommendations(
  input: ProfileOptimizerInput
): Promise<ProfileOptimizerOutput> {
  return profileOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profileOptimizerPrompt',
  input: { schema: ProfileOptimizerInputSchema },
  output: { schema: ProfileOptimizerOutputSchema },
  prompt: `You are an expert career coach and talent platform optimizer for Naxçıvan Dövlət Universiteti. Your task is to analyze a student's profile and provide 3 concrete, actionable recommendations for improvement.

Instructions:

1.  Analyze the provided student profile data. Pay close attention to missing information, the quality of descriptions for projects and achievements, the variety and relevance of skills, and the completeness of social/portfolio links.
2.  Generate exactly 3 distinct recommendations.
3.  Each recommendation should be a clear, concise, and actionable sentence.
4.  Focus on suggestions that will increase the student's "Talent Score" and make them more attractive to organizations.

Examples of good recommendations:
* "“Mobil Tətbiq Prototipi” layihəsinin təsvirini daha detallı yazaraq istifadə etdiyiniz texnologiyaları və qarşılaşdığınız çətinlikləri qeyd edin."
* "Data analizi bacarıqlarınızı nümayiş etdirmək üçün Kaggle platformasında iştirak edib nəticəni nailiyyətlərinizə əlavə edin."
* "Profilinizdə GitHub linki əksikdir. Kod nümunələrinizi göstərmək üçün GitHub profilinizi yaradıb linkini əlavə edin."

Student Profile Data:
{{{profileData}}}

Generate 3 recommendations based on this data.`,
});

const profileOptimizerFlow = ai.defineFlow(
  {
    name: 'profileOptimizerFlow',
    inputSchema: ProfileOptimizerInputSchema,
    outputSchema: ProfileOptimizerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
