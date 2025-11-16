interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

interface OllamaRequest {
    model: string;
    prompt: string;
    stream: boolean;
    options?: {
        temperature?: number;
        top_p?: number;
        max_tokens?: number;
    };
}

class OllamaService {
    private baseUrl: string;
    private model: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2:3b';
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.warn('Ollama not available:', error);
            return false;
        }
    }

    async generateResponse(prompt: string, options?: {
        temperature?: number;
        max_tokens?: number;
    }): Promise<string> {
        try {
            const request: OllamaRequest = {
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: options?.temperature || 0.3, // Lower for more consistent responses
                    num_predict: options?.max_tokens || 300, // Shorter responses for speed
                    top_p: 0.9,
                    repeat_penalty: 1.1,
                    num_ctx: 2048, // Smaller context for speed
                }
            };

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data: OllamaResponse = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error calling Ollama:', error);
            throw error;
        }
    }

    async analyzeClubData(clubData: any): Promise<{
        ranking: number;
        insights: string[];
        recommendations: string[];
        trend: 'up' | 'down' | 'stable';
        score: number;
    }> {
        const prompt = `
You are an AI analyst for a university platform called Campify. Analyze the following club data and provide insights:

Club Data:
- Name: ${clubData.name}
- Description: ${clubData.description}
- Recent Events: ${clubData.eventCount}
- Average Attendance Rate: ${(clubData.avgAttendance * 100).toFixed(1)}%
- Feedback Mentions: ${clubData.mentions}
- Current Performance Score: ${clubData.performance_score}

Please analyze this data and respond in the following JSON format:
{
  "score": <calculated engagement score 0-100>,
  "trend": "<up/down/stable>",
  "insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>"
  ]
}

Consider factors like:
- Event frequency and attendance
- Member engagement
- Campus visibility
- Growth potential
- Areas for improvement

Provide actionable insights and specific recommendations.
`;

        try {
            const response = await this.generateResponse(prompt, {
                temperature: 0.2, // Even lower for analytics
                max_tokens: 250   // Shorter for faster responses
            });

            // Try to parse JSON response
            try {
                const analysis = JSON.parse(response);
                return {
                    ranking: 0, // Will be calculated after all clubs are analyzed
                    insights: analysis.insights || [],
                    recommendations: analysis.recommendations || [],
                    trend: analysis.trend || 'stable',
                    score: analysis.score || clubData.performance_score || 50
                };
            } catch (parseError) {
                // Fallback if JSON parsing fails
                return this.parseTextResponse(response, clubData);
            }
        } catch (error) {
            console.error('Error analyzing club data with Ollama:', error);
            // Fallback to rule-based analysis
            return this.fallbackAnalysis(clubData);
        }
    }

    async generateUserInsights(userData: {
        role: string;
        activities: any[];
        preferences?: any;
    }): Promise<{
        insights: string[];
        recommendations: string[];
        achievements: string[];
    }> {
        const prompt = `
You are an AI assistant for Campify, a university engagement platform. Analyze this user's activity and provide personalized insights:

User Profile:
- Role: ${userData.role}
- Recent Activities: ${JSON.stringify(userData.activities.slice(0, 10))}
- Total Activities: ${userData.activities.length}

Activity Summary:
${this.summarizeActivities(userData.activities)}

Please provide personalized insights in JSON format:
{
  "insights": [
    "<insight about user behavior>",
    "<insight about engagement patterns>"
  ],
  "recommendations": [
    "<personalized recommendation>",
    "<suggestion for improvement>"
  ],
  "achievements": [
    "<achievement or milestone>"
  ]
}

Focus on:
- User engagement patterns
- Personalized recommendations based on role
- Achievements and milestones
- Suggestions for better campus involvement
`;

        try {
            const response = await this.generateResponse(prompt, {
                temperature: 0.3,
                max_tokens: 200 // Shorter for user insights
            });

            try {
                const analysis = JSON.parse(response);
                return {
                    insights: analysis.insights || [],
                    recommendations: analysis.recommendations || [],
                    achievements: analysis.achievements || []
                };
            } catch (parseError) {
                return this.parseUserInsightsText(response);
            }
        } catch (error) {
            console.error('Error generating user insights:', error);
            return this.fallbackUserInsights(userData);
        }
    }

    async analyzeFeedbackSentiment(feedbackData: any[]): Promise<{
        overallSentiment: 'positive' | 'neutral' | 'negative';
        categories: Record<string, { sentiment: string; count: number }>;
        trends: string[];
        actionItems: string[];
    }> {
        const prompt = `
Analyze the following student feedback data for sentiment and trends:

Feedback Data:
${feedbackData.map(f => `
- Category: ${f.category}
- Title: ${f.title}
- Content: ${f.content.substring(0, 200)}...
- Upvotes: ${f.upvotes}
- Resolved: ${f.is_resolved}
`).join('\n')}

Provide analysis in JSON format:
{
  "overallSentiment": "<positive/neutral/negative>",
  "categories": {
    "facilities": {"sentiment": "<positive/neutral/negative>", "count": <number>},
    "academics": {"sentiment": "<positive/neutral/negative>", "count": <number>}
  },
  "trends": [
    "<trend observation 1>",
    "<trend observation 2>"
  ],
  "actionItems": [
    "<priority action item>",
    "<recommended improvement>"
  ]
}

Focus on identifying patterns, urgent issues, and improvement opportunities.
`;

        try {
            const response = await this.generateResponse(prompt, {
                temperature: 0.1, // Very low for sentiment analysis
                max_tokens: 300
            });

            try {
                return JSON.parse(response);
            } catch (parseError) {
                return this.fallbackSentimentAnalysis(feedbackData);
            }
        } catch (error) {
            console.error('Error analyzing feedback sentiment:', error);
            return this.fallbackSentimentAnalysis(feedbackData);
        }
    }

    private summarizeActivities(activities: any[]): string {
        const activityCounts = activities.reduce((acc, activity) => {
            acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(activityCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');
    }

    private parseTextResponse(response: string, clubData: any): any {
        // Simple text parsing fallback
        const insights = [];
        const recommendations = [];

        if (clubData.eventCount === 0) {
            insights.push("No recent events organized");
            recommendations.push("Plan regular events to boost engagement");
        }

        if (clubData.avgAttendance < 0.5) {
            insights.push("Low attendance rates observed");
            recommendations.push("Focus on member retention strategies");
        }

        return {
            ranking: 0,
            insights,
            recommendations,
            trend: 'stable' as const,
            score: clubData.performance_score || 50
        };
    }

    private parseUserInsightsText(response: string): any {
        return {
            insights: ["AI analysis completed"],
            recommendations: ["Continue engaging with campus activities"],
            achievements: ["Active platform user"]
        };
    }

    private fallbackAnalysis(clubData: any): any {
        const insights = [];
        const recommendations = [];

        // Rule-based fallback analysis
        if (clubData.eventCount > 3) {
            insights.push("High activity level with multiple events");
        } else if (clubData.eventCount === 0) {
            insights.push("No recent events - opportunity for growth");
            recommendations.push("Plan engaging events for members");
        }

        if (clubData.avgAttendance > 0.8) {
            insights.push("Excellent attendance rates");
        } else if (clubData.avgAttendance < 0.3) {
            insights.push("Low attendance needs attention");
            recommendations.push("Survey members for preferred event types");
        }

        const score = Math.min(
            (clubData.eventCount * 15) +
            (clubData.avgAttendance * 50) +
            (clubData.mentions * 10) +
            (clubData.performance_score * 0.25),
            100
        );

        return {
            ranking: 0,
            insights,
            recommendations,
            trend: 'stable' as const,
            score: Math.round(score)
        };
    }

    private fallbackUserInsights(userData: any): any {
        const insights = [];
        const recommendations = [];
        const achievements = [];

        const activityCount = userData.activities.length;

        if (activityCount > 10) {
            achievements.push("Highly Active User");
            insights.push("You're very engaged with campus activities");
        }

        if (userData.role === 'student') {
            recommendations.push("Explore joining new clubs based on your interests");
        } else if (userData.role === 'club') {
            recommendations.push("Consider collaborating with other clubs for events");
        }

        return { insights, recommendations, achievements };
    }

    private fallbackSentimentAnalysis(feedbackData: any[]): any {
        const categories: Record<string, { sentiment: string; count: number }> = {};

        feedbackData.forEach(feedback => {
            if (!categories[feedback.category]) {
                categories[feedback.category] = { sentiment: 'neutral', count: 0 };
            }
            categories[feedback.category].count++;
        });

        return {
            overallSentiment: 'neutral' as const,
            categories,
            trends: ["Mixed feedback across categories"],
            actionItems: ["Review high-priority feedback items"]
        };
    }
}

export const ollamaService = new OllamaService();