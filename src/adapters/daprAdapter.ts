import { AbstractActor, ActorId, ActorProxyBuilder, DaprClient, DaprServer } from "@dapr/dapr";
import { getActorClass, getActorName, getRegisteredActorClasses } from "../decorators/actor";
import { getMessageHandlers, getOnMessageHandler } from "../decorators/onMessage";
import { StateResolver } from "../runtime/stateResolver";
import { BaseActor } from "../components/baseActor";
import { ActorCommandResponse, ActorProvider } from "../runtime/actorProvider";
import { DependenciesResolver } from "../runtime/dependencyResolver";
import {ActorMessage, ActorMessageMetadata} from "../model/actorMessage";
import {  getMessageByType } from "../decorators/message";
import { ActorTypes } from "./types";

function getKey(actorName: string): string {
  return `state-${actorName}`;
}

export interface Context {
  dependenciesResolver: DependenciesResolver;
  metadata: ActorMessageMetadata,
}

export class DaprActorProvider implements ActorProvider {
   private actorClasses = new Map<string, any>;
   private stateResolver: StateResolver;
   private server: DaprServer;
   private dependencyResolver: DependenciesResolver;

   constructor(dependencyResolver: DependenciesResolver) {
    this.stateResolver = dependencyResolver.resolve(ActorTypes.StateResolver);
    this.dependencyResolver = dependencyResolver;
    this.server = this.dependencyResolver.resolve(ActorTypes.ActorServer);
    this.actorClasses = new Map();
  }

  async registerAll(): Promise<void> {
    const actorTypes = getRegisteredActorClasses();
    console.log("Initializing server");
    await this.server.actor.init();
    console.log("Server initialized");

    for (const ActorClass of actorTypes) {
      console.log("Registering actor", ActorClass.name);
      const actorName = getActorName(ActorClass);
      if (!actorName) continue;
    
      const stateResolver = this.stateResolver;
      const dependencyResolver = this.dependencyResolver;

      const Wrapped = class extends AbstractActor {
        actorInstance?: BaseActor;
        key: string = "";
        [key: string]: any;

        async onActivate(): Promise<void> {
          try {
          //let state = await this.getStateManager().getState(this.key);
            const state = await stateResolver.getState(actorName, this.actorInstance?.actorId ?? "");
            this.actorInstance?.deserialize(state);
            await this.getStateManager().setState(this.key, this.actorInstance?.serialize());
            } catch (e) {
            console.log(e);
          }
            
        }

        private _init() {
          try {
            this.actorInstance = new (ActorClass as new () => any)();
            this.key = getKey(ActorClass.name);
            if (!this.actorInstance) {
              throw new Error("Actor instance is undefined");
            }
            this.actorInstance.actorId = this.getActorId().getId();
            this.key = getKey(ActorClass.name);
            const handlers = getMessageHandlers(ActorClass);
            for (const [, methodName] of handlers.entries()) {
              this[methodName] = async (payload: ActorMessage) => {
                try {
                const result = await (this.actorInstance as any)[methodName](payload.data,
                    { dependenciesResolver: dependencyResolver,
                    metadata: payload.metadata
                    });
                await this.getStateManager().setState("state", this.actorInstance?.serialize());
                return result;
                }catch (e) {
                  console.log(e);
                  throw e;
                }
              };
            }
          }catch (e) {
            console.log(e);
          }
        }

        constructor(daprClient: DaprClient, id: ActorId) {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            super(daprClient, id);
            this._init();
          }catch (e) {
            console.log(e);
            throw e;
          }

        }
      };

      Object.defineProperty(Wrapped, "name", { value: actorName });
      this.server.actor.registerActor(Wrapped);
      this.actorClasses.set(actorName, Wrapped);
      console.log("Actor registered", actorName);
    }
    await this.server.start();
    console.log("Server started");
    const resRegisteredActors = await this.server.actor.getRegisteredActors();
    console.log(`Registered Actors: ${JSON.stringify(resRegisteredActors)}`);
  }

  async dispatch(message: ActorMessage): Promise<ActorCommandResponse> {
    const client = this.dependencyResolver.resolve(ActorTypes.ActorClient);
    const messageMeta = getMessageByType(message.constructor);
    if (!messageMeta) throw new Error(`Message type ${message.constructor.name} not found`);

    const ActorClass = getActorClass(messageMeta.actor);
    if (!ActorClass) throw new Error(`Actor type ${messageMeta.actor} not found`);

    const onMessageMethod = getOnMessageHandler(ActorClass, messageMeta?.message);

    if (!onMessageMethod) {
      throw new Error(`Actor method for message ${messageMeta.message} not found`)
    }

    const actorProxy = this.actorClasses.get(messageMeta.actor)
    const builder = new ActorProxyBuilder(actorProxy, client);
    const proxy: any = builder.build(new ActorId(message.actorId));

    return await proxy[onMessageMethod](message);
  }
    
}