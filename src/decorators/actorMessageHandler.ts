import "reflect-metadata";

const ALL_ACTOR_HANDLERS = "actor:all-handlers";
const ACTOR_MESSAGE_METADATA = "actor:message-metadata";

export interface ActorCommandHandlerMetadata {
  actor: string;
  message?: string;
}

export function actorMessageHandler(meta: ActorCommandHandlerMetadata): ClassDecorator {
  return (target) => {
    const messageName = meta.message;

    Reflect.defineMetadata(ACTOR_MESSAGE_METADATA, meta, target);

    if (messageName) {
      if (Reflect.getMetadata(`actor:handler:${messageName}`, Reflect)) {
        throw new Error(`Handler for message ${messageName} already registered.`);
      }
      Reflect.defineMetadata(`actor:handler:${messageName}`, target, Reflect);
      Reflect.defineMetadata(`actor:handler:meta:${messageName}`, meta, Reflect);
    }

    const existing = Reflect.getMetadata(ALL_ACTOR_HANDLERS, Reflect) || [];
    Reflect.defineMetadata(ALL_ACTOR_HANDLERS, [...existing, target], Reflect);
  };
}

export function getHandlerForMessageName(name: string): NewableFunction | undefined {
  return Reflect.getMetadata(`actor:handler:${name}`, Reflect);
}

export function getHandlerMetaByMessageName(name: string): ActorCommandHandlerMetadata | undefined {
  return Reflect.getMetadata(`actor:handler:meta:${name}`, Reflect);
}

export function getHandlerByActor(actorName: string, messageName?: string): NewableFunction | undefined {
  const allHandlers = getAllActorHandlers();
  
  if (messageName) {
    const specificHandler = allHandlers.find(handler => {
      const meta = Reflect.getMetadata(ACTOR_MESSAGE_METADATA, handler) as ActorCommandHandlerMetadata;
      return meta.actor === actorName && meta.message === messageName;
    });
    if (specificHandler) return specificHandler;
  }
  
  return allHandlers.find(handler => {
    const meta = Reflect.getMetadata(ACTOR_MESSAGE_METADATA, handler) as ActorCommandHandlerMetadata;
    return meta.actor === actorName && !meta.message;
  });
}

export function getAllActorHandlers(): NewableFunction[] {
  return Reflect.getMetadata(ALL_ACTOR_HANDLERS, Reflect) || [];
}