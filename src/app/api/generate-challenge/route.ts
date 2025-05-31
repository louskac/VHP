// src/app/api/generate-challenge/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a challenge generator for a human verification system. Generate a simple, safe photo challenge that someone can complete immediately with their phone camera. 

Requirements:
- Must be something they can do right now (no going outside, no specific objects)
- Safe and appropriate for all users
- Can be completed in under 30 seconds
- Try to be fun and exciting within these constrains
- Examples: "Show your hands", "Give us a tour of your workspace", "Show something you drink", "Capture your current view", "Take a deep breath and relax", "Do a pushup", "Combine two completely different foods and eat the creation.", Learn a sentence in a language you don't know.", "Play the floor is lava.", "Try balancing an ice cube on your nose."

Really try to be fun why keeping the challenge completable. All of the challenges will be done in a 30 second video so no selfies!"

Respond ONLY with a JSON object in this exact format:
{
  "title": "Short challenge title (max 50 chars)",
  "description": "Detailed but concise description (100-150 chars)",
  "reward": "Pick a reward for the challenge. It should go from (1-10) - be creative, sometimes come up with a hard one for more reward. 1 would be a simple challenge like smile and wave into the camera, 10 should be for a really hard one like do 10 pushups."
}`
          },
          {
            role: 'user',
            content: 'Generate a random human verification challenge'
          }
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const challengeText = data.choices[0].message.content.trim();
    
    try {
      const challenge = JSON.parse(challengeText);
      
      // Validate the response has required fields
      if (!challenge.title || !challenge.description || !challenge.reward) {
        throw new Error('Invalid challenge format from AI');
      }

      // Add random photo and color
      const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
      const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
      
      return NextResponse.json({
        success: true,
        challenge: {
          title: challenge.title,
          description: challenge.description,
          challengerName: "Nocena GPT",
          challengerProfile: `/images/${randomPhotoNumber}.jpg`,
          reward: challenge.reward,
          color: colors[Math.floor(Math.random() * colors.length)]
        }
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', challengeText);
      
      // Fallback to hardcoded challenge if AI response is invalid
      const fallbackChallenges = [
        {
          title: "Show us your best dance move",
          description: "Best out a quick dance move on camera. Lets loose and have fun!",
          reward: 8
        },
        {
          title: "Strike a silly pose",
          description: "Quickly strike the silliest pose you can and hold it for a few seconds.",
          reward: 4
        }
      ];

      const randomFallback = fallbackChallenges[Math.floor(Math.random() * fallbackChallenges.length)];
      const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
      const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];

      return NextResponse.json({
        success: true,
        challenge: {
          ...randomFallback,
          challengerName: "Nocena GPT",
          challengerProfile: `/images/${randomPhotoNumber}.jpg`,
          color: colors[Math.floor(Math.random() * colors.length)]
        }
      });
    }

  } catch (error) {
    console.error('Challenge generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate challenge' 
      }, 
      { status: 500 }
    );
  }
}