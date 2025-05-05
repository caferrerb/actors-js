export interface StateResolver {
    getState(actorType: string, actorId: string): Promise<Record<string, any>>;
}