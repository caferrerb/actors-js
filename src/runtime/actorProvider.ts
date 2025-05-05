import { ActorMessage } from "../model/actorMessage";

export interface ActorCommandResponse {
    [key: string]: any;
}

export interface ActorProvider {
    registerAll(instance?: any): Promise<void>;
    dispatch(message: ActorMessage): Promise<ActorCommandResponse>
}