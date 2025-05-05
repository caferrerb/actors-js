import "reflect-metadata";

const ACTOR_MESSAGE_META = "actor:message:info";
const ALL_ACTOR_MESSAGES = "actor:all-messages";
export interface ActorMessageMetadataDefinition {
  actor: string;
  message: string;
}

export function actorMessage(meta: ActorMessageMetadataDefinition): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(ACTOR_MESSAGE_META, meta, target);
    const classByName = { [target.name]: meta };
    const classesByName = Reflect.getMetadata(ALL_ACTOR_MESSAGES, Reflect) || {};
    if (classesByName[target.name]) {
      throw new Error(`Message type ${target.name} already registered.`);
    }
    Reflect.defineMetadata(ALL_ACTOR_MESSAGES, { ...classesByName, ...classByName }, Reflect);
  };
}
export function getMessageByType(type: NewableFunction): ActorMessageMetadataDefinition | undefined {
    const classesByName =   Reflect.getMetadata(ALL_ACTOR_MESSAGES, Reflect) || {};
    return classesByName[type.name];
}

export function getAllActorMessages(): any[] {
    const classesByName =   Reflect.getMetadata(ALL_ACTOR_MESSAGES, Reflect) || {};
    return Object.keys(classesByName);
}