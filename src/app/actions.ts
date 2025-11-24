'use server';

import { calculateTalentScore as calculateTalentScoreFlow, CalculateTalentScoreInput, CalculateTalentScoreOutput } from '@/ai/flows/talent-scoring';
import { getProfileRecommendations as getProfileRecommendationsFlow, ProfileOptimizerInput, ProfileOptimizerOutput } from '@/ai/flows/profile-optimizer';
import { selectTopStories as selectTopStoriesFlow, StorySelectorInput, StorySelectorOutput } from '@/ai/flows/story-selector';


export async function calculateTalentScore(input: CalculateTalentScoreInput): Promise<CalculateTalentScoreOutput> {
  return await calculateTalentScoreFlow(input);
}

export async function getProfileRecommendations(input: ProfileOptimizerInput): Promise<ProfileOptimizerOutput> {
    return await getProfileRecommendationsFlow(input);
}

export async function selectTopStories(input: StorySelectorInput): Promise<StorySelectorOutput> {
    return await selectTopStoriesFlow(input);
}