import { BaseActor } from "../../components/baseActor";
import { actor } from "../../decorators/actor";
import { actorMessageHandler } from "../../decorators/actorMessageHandler";
import { actorMessage } from "../../decorators/message";
import { messageHandler } from "../../decorators/messageHandler";
import { onMessage } from "../../decorators/onMessage";
import { ActorMessage } from "../../model/actorMessage";
import { ActorProvider } from "../../runtime/actorProvider";
import { ActorGenericMessageHandler } from "../../runtime/baseMessageHandler";

export interface AccountState {
    balance: number;
  }

  @actor("Account")
  export class Account extends BaseActor<AccountState> {
    private state: AccountState = { balance: 0 };
  
    @onMessage("credit")
    async credit(payload: { amount: number }) {
      this.state.balance += payload.amount;
      return { newBalance: this.state.balance };
    }

    @onMessage("debit")
    async debit(payload: { amount: number }) {
      if (this.state.balance < payload.amount) {
        throw new Error("Insufficient funds");
      }
      this.state.balance -= payload.amount;
      return { newBalance: this.state.balance };
    }
  
    serialize(): AccountState {
      return this.state;
    }

    deserialize(state: AccountState): void {
      this.state = state ?? this.state;
    }
  }


  
  @actorMessage({ actor: "Account", message: "credit" })
  export class CreditMessage implements ActorMessage<{ amount: number }> {
    constructor(
      public readonly actorId: string,
      public readonly data: { amount: number }
    ) {}
  }

  
  @actorMessage({ actor: "Account", message: "debit" })
  export class DebitMessage implements ActorMessage<{ amount: number }> {
    constructor(
      public readonly actorId: string,
      public readonly data: { amount: number }
    ) {}
  
    validate(): boolean {
      if (this.data.amount <= 0) {
        return false;
      }
      return true;
    }
  }

@actorMessageHandler({
  actor: "Account",
})
export class DebitHandler {
  constructor(private readonly actorProvider: ActorProvider) {}

  @messageHandler("debit")
  async handleDebit(message: DebitMessage) {
    return await this.actorProvider.dispatch(message);
  }
}

@actorMessageHandler({
  actor: "Account",
  message: 'credit'
})
export class CreditHandler {
  constructor(private readonly actorProvider: ActorProvider) {}

  async handle(message: DebitMessage) {
    return await this.actorProvider.dispatch(message);
  }
}

@actor("testActor")
export class NumberActor extends BaseActor<{number: number}> {
  private state: {number: number} = {number: 0};
  constructor() {
    super();
  }

  serialize(): {number: number} {
    return this.state;
  }

  deserialize(state: {number: number}): void {
    this.state = state ?? this.state;
  }

  @onMessage("increment")
  async increment(payload: {amount: number}) {
    this.state.number += payload.amount;
    return this.state;
  }

  @onMessage("decrement")
  async decrement(payload: {amount: number}) {
    this.state.number -= payload.amount;
    return this.state;
  }
}

@actorMessage({ actor: "testActor", message: "increment" })
export class IncrementMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}   

@actorMessage({ actor: "testActor", message: "decrement" })
export class DecrementMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}

@actor()
export class ArithmeticActor extends BaseActor<{number: number}> {
  private state: {number: number} = {number: 0};
  constructor() {
    super();
  }

  serialize(): {number: number} {
    return this.state;
  }

  deserialize(state: {number: number}): void {
    this.state = state ?? this.state;
  }

  @onMessage("add")
  async add(payload: {amount: number}) {
    this.state.number += payload.amount;
    return this.state;
  }

  @onMessage("subtract")
  async subtract(payload: {amount: number}) {
    this.state.number -= payload.amount;
    return this.state;
  }

  @onMessage()
  async multiply(payload: {amount: number}) {
    this.state.number *= payload.amount;
    return this.state;
  }

  @onMessage()
  async divide(payload: {amount: number}) {
    this.state.number /= payload.amount;
    return this.state;
  }
}

@actorMessage({ actor: "ArithmeticActor", message: "add" })
export class AddMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}

@actorMessage({ actor: "ArithmeticActor", message: "subtract" })
export class SubtractMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}

@actorMessage({ actor: "ArithmeticActor", message: "multiply" })
export class MultiplyMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}   

@actorMessage({ actor: "ArithmeticActor", message: "divide" })
export class DivideMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,

    public readonly data: { amount: number }
  ) {}
}

@actorMessageHandler({
  actor: "ArithmeticActor",
})
export class ArithmeticHandler {
  constructor(private readonly actorProvider: ActorProvider) {}

  @messageHandler("add")
  async handleAdd(message: AddMessage) {
    return await this.actorProvider.dispatch(message);
  }

  @messageHandler("subtract")
  async handleSubtract(message: SubtractMessage) {
    return await this.actorProvider.dispatch(message);
  }

  @messageHandler("multiply")
  async handleMultiply(message: MultiplyMessage) {
    return await this.actorProvider.dispatch(message);
  }
}

@actorMessageHandler({
  actor: "ArithmeticActor",
  message: "divide" 
})
export class DivideHandler extends ActorGenericMessageHandler<DivideMessage> {
  constructor(actorProvider: ActorProvider) {
    super(actorProvider);
  }
}
