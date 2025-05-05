import {  ActorProvider } from "./actorProvider";
import { ActorMessage } from "../model/actorMessage";
import { DependenciesResolver } from "./dependencyResolver";
import {getHandlerByActor } from "../decorators/actorMessageHandler";
import { getMessageHandlerMethodByType } from "../decorators/messageHandler";
import { getMessageByType } from "../decorators/message";

export class ActorMessagingDispatcher {
    constructor(
      private readonly resolver: DependenciesResolver,
      private readonly actorProvider: ActorProvider
    ) {}
  
    async dispatch<TMessage extends ActorMessage>(message: TMessage): Promise<any> {
      const meta = getMessageByType(message.constructor);
      
      if (!meta) {
        throw new Error(`No @actorCommandHandler metadata found for message: ${JSON.stringify(message)}`);
      }
  
      const HandlerClass = getHandlerByActor(meta.actor, meta.message);
      if (!HandlerClass) {
        return await this.actorProvider.dispatch(message);
      }
  
      const handlerInstance = this.resolver.resolve(HandlerClass);
      const methodName = getMessageHandlerMethodByType(handlerInstance, meta.message);
  
      if (typeof message.validate === "function") {
        message.validate();
      }

      const method = methodName ?? 'handle'

      if (method && typeof handlerInstance[method] === "function") {
        return await handlerInstance[method](message);
      }
    }
  }