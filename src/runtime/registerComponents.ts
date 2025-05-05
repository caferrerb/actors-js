import { getRegisteredActorClasses } from "../decorators/actor";
import { getAllActorHandlers } from "../decorators/actorMessageHandler";
import { getAllActorMessages } from "../decorators/message";

export function registerHandlers(...handlerClasses: any[]): void {
  const allHandlers = getAllActorHandlers();  
  for (const HandlerClass of handlerClasses) {
    const decorator = allHandlers.find(handler => handler.name === HandlerClass.name);
    if (!decorator) {
      throw new Error(`Handler ${HandlerClass.name} must be decorated with @actorMessageHandler`);
    }
  }
  console.log(`[INIT] ${handlerClasses.length} handlers registered`);
}

export function registerActors(...actorClasses: any[]): void {
  const allActors = getRegisteredActorClasses();
  for (const ActorClass of actorClasses) {
    const decorator = allActors.find(actor => actor.name === ActorClass.name);
    if (!decorator) {
      throw new Error(`Actor ${ActorClass.name} must be decorated with @actor`);
    }
  }
  console.log(`[INIT] ${actorClasses.length} actors registered`);
}

export function registerMessages(...messageClasses: any[]): void {
  const allMessages = getAllActorMessages();
  for (const MessageClass of messageClasses) {
    const decorator = allMessages.find(message => message === MessageClass.name);
    if (!decorator) {
      throw new Error(`Message ${MessageClass.name} must be decorated with @actorMessage`);
    }
  }
  console.log(`[INIT] ${messageClasses.length} messages registered`);
}
