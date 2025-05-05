import "reflect-metadata";
const ACTOR_REGISTRY_KEY = "actor:registry";

export function actor(name?: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata("actor:name", name || target.name, target)
    const existing = Reflect.getMetadata(ACTOR_REGISTRY_KEY, Reflect) || [];
    Reflect.defineMetadata(ACTOR_REGISTRY_KEY, [...existing, target], Reflect);
  };
}

export function getActorName(target: NewableFunction): string | undefined {
    return Reflect.getMetadata("actor:name", target);
}

export function getActorClass(name: string): NewableFunction | undefined {
    return Reflect.getMetadata(ACTOR_REGISTRY_KEY, Reflect).find((actor: NewableFunction) => getActorName(actor) === name);
}

export function getRegisteredActorClasses(): NewableFunction[] {
    return Reflect.getMetadata(ACTOR_REGISTRY_KEY, Reflect) || [];
}