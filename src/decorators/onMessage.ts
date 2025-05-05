export function onMessage(type?: string): MethodDecorator {
  return (target, propertyKey) => {
    const name = type ?? propertyKey.toString();
    Reflect.defineMetadata(
      `actor:onMessage:${target.constructor.name}:${name}`,
      propertyKey,
      target.constructor
    );
  };
}

export function getMessageHandlers(target: any): Map<string, string> {
  const handlers = new Map<string, string>();
  
  const metadataKeys = Reflect.getMetadataKeys(target);
  
  const messageKeys = metadataKeys.filter(key => 
    typeof key === 'string' && 
    key.startsWith(`actor:onMessage:${target.name}:`)
  );
  
  messageKeys.forEach(key => {
    const type = key.split(':')[3];
    const methodName = Reflect.getMetadata(key, target);
    if (methodName) {
      handlers.set(type, methodName.toString());
    }
  });
  
  return handlers;
}

export function getOnMessageHandler(target: any, type: string): string {
  return Reflect.getMetadata(
    `actor:onMessage:${target.name}:${type}`,
    target
  )?.toString();
}