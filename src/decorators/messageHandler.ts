import "reflect-metadata";

const MESSAGE_HANDLER_METHOD = "actor:message-handler";
const ACTOR_MESSAGE_HANDLERS = "actor:message-handlers";

export function messageHandler(messageType: string): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(MESSAGE_HANDLER_METHOD, messageType, target, propertyKey);
    
   
    const handlers = Reflect.getMetadata(ACTOR_MESSAGE_HANDLERS, target.constructor) || new Map<string, string>();
    handlers.set(messageType, propertyKey.toString());
    Reflect.defineMetadata(ACTOR_MESSAGE_HANDLERS, handlers, target.constructor);
  };
}

export function getMessageHandlerMethodByType(target: any, messageType: string): string | undefined {
  const handlers = Reflect.getMetadata(ACTOR_MESSAGE_HANDLERS, target.constructor) || new Map<string, string>();
  return handlers.get(messageType);
}