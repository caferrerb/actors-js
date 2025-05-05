import { ActorMessage } from "../model/actorMessage";
import { ActorProvider } from "./actorProvider";


export abstract class ActorGenericMessageHandler<TMessage extends ActorMessage<any>> {
  constructor(
    protected readonly actorProvider: ActorProvider) {
  }

  async handle(message: TMessage): Promise<any> {
    if (typeof message.validate === "function") {
      message.validate();
    }
    return await this.actorProvider.dispatch(message);
  }
}