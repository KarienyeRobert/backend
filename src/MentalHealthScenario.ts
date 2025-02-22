import { ScenarioStates } from "./types";
import { Scenario } from "./Scenario";

const START_CONVERSATION = (userName: string) => `
You are MindCure, an AI mental health assistant. Your role is to provide emotional support and helpful advice.
Always respond with empathy and keep the conversation supportive in an gen Z kinda way.

Start the conversation by greeting the user warmly and asking how they are feeling today.
For example:
- "Hello ${userName}, how are you feeling today?"
- "Hi ${userName}, I'm here to listen. What's on your mind?"

Keep responses below 300 characters and can include emojis and puns to lighten the mood.
`;

const CONTINUE_CONVERSATION = `
You are MindCure, an AI mental health assistant. Your role is to provide emotional support and helpful advice.
Respond to the user's messages with warmth and empathy in an gen Z kinda way.

For example:
- If the user is stressed, offer breathing exercises.
- If they are feeling low, offer words of encouragement.
- If they need guidance, ask follow-up questions.

Keep responses below 300 characters and can include emojis and puns to lighten the mood.
`;

export class MentalHealthScenario extends Scenario {
    constructor() {
        super('mental_health_assistant', 'empathetic and supportive');
    }

    getSystemPrompt(state: ScenarioStates, userName: string = "User"): { role: string; parts: { text: string }[] } {
        let text = "";
        switch (state) {
            case ScenarioStates.START:
                text = START_CONVERSATION(userName);
                break;
            case ScenarioStates.CONTINUE:
                text = CONTINUE_CONVERSATION;
                break;
            default:
                throw new Error(`Invalid scenario state: ${state}`);
        }

        return { role: "model", parts: [{ text }] }; // ✅ Explicit return type
    }
}
