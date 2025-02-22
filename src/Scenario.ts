import { ScenarioStates } from "./types";

export class Scenario {
    role: string;
    tone: string;

    constructor(role: string, tone: string) {
        this.role = role;
        this.tone = tone;
    }

    getSystemPrompt(state: ScenarioStates, userName?: string): object {
        throw new Error('Method not implemented.');
    }
}
