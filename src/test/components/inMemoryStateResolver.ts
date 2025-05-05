import { StateResolver } from "../../runtime/stateResolver";

export class InMemoryStateResolver implements StateResolver {
    private states: Map<string, any> = new Map();

    async getState(actorId: string): Promise<any> {
        console.log("getState", actorId);
        return this.states.get(actorId);
    }

    async setState(actorId: string, state: any): Promise<void> {
        console.log("setState", actorId, state);
        this.states.set(actorId, state);
    }
}