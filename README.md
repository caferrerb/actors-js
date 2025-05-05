# Actors-JS

A TypeScript library for implementing the Actor Model pattern with decorators and message handling.

## Features

- Actor-based message handling
- Decorator-based configuration
- State management
- Type-safe message passing
- Flexible message handlers

## Installation

```bash
npm install actors-js
```

## Basic Usage

### Creating an Actor

```typescript
import { BaseActor } from 'actors-js';
import { actor } from 'actors-js/decorators/actor';
import { onMessage } from 'actors-js/decorators/onMessage';

@actor("Account")
export class Account extends BaseActor<AccountState> {
  private state: AccountState = { balance: 0 };

  @onMessage("credit")
  async credit(payload: { amount: number }) {
    this.state.balance += payload.amount;
    return { newBalance: this.state.balance };
  }

  serialize(): AccountState {
    return this.state;
  }

  deserialize(state: AccountState): void {
    this.state = state ?? this.state;
  }
}
```

### Creating Messages

```typescript
import { actorMessage } from 'actors-js/decorators/message';
import { ActorMessage } from 'actors-js/model/actorMessage';

@actorMessage({ actor: "Account", message: "credit" })
export class CreditMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}
```

### Creating Message Handlers

```typescript
import { actorMessageHandler } from 'actors-js/decorators/actorMessageHandler';
import { messageHandler } from 'actors-js/decorators/messageHandler';

@actorMessageHandler({
  actor: "Account",
  message: 'credit'
})
export class CreditHandler {
  constructor(private readonly actorProvider: ActorProvider) {}

  @messageHandler("credit")
  async handle(message: CreditMessage) {
    return await this.actorProvider.dispatch(message);
  }
}
```

## Complete Example

Here's a complete example showing how to set up and use the actor system with Dapr:

```typescript
import { Container } from "inversify";
import { 
  ActorTypes, 
  buildDaprActorRuntime, 
  DaprActorProvider, 
  registerMessages, 
  registerHandlers, 
  registerActors 
} from 'actors-js';

// Define your actors, messages, and handlers
@actor("Account")
class Account extends BaseActor<AccountState> {
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

  serialize(): AccountState { return this.state; }
  deserialize(state: AccountState): void { this.state = state ?? this.state; }
}

// Define messages
@actorMessage({ actor: "Account", message: "credit" })
class CreditMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}

@actorMessage({ actor: "Account", message: "debit" })
class DebitMessage implements ActorMessage<{ amount: number }> {
  constructor(
    public readonly actorId: string,
    public readonly data: { amount: number }
  ) {}
}

// Define handlers
@actorMessageHandler({ actor: "Account" })
class AccountHandler {
  constructor(private readonly actorProvider: ActorProvider) {}

  @messageHandler("credit")
  async handleCredit(message: CreditMessage) {
    return await this.actorProvider.dispatch(message);
  }

  @messageHandler("debit")
  async handleDebit(message: DebitMessage) {
    return await this.actorProvider.dispatch(message);
  }
}

// Set up the runtime
async function main() {
  const container = new Container();
  
  // Configure Dapr runtime
  const messageDispatcher = await buildDaprActorRuntime(container, {
    daprServerOptions: {
      serverHost: "127.0.0.1",
      serverPort: "50001",
    },
    daprClientOptions: {
      daprHost: "127.0.0.1",
      daprPort: "50000",
    },
    serverWaitTime: 5 * 1000,
    stateStoreOptions: {
      stateStoreBuilder() {
        return new InMemoryStateResolver();
      },
    }
  });

  // Register components
  registerMessages(CreditMessage, DebitMessage);
  registerHandlers(AccountHandler);
  registerActors(Account);

  // Get the actor provider
  const daprAdapter = container.get<DaprActorProvider>(ActorTypes.ActorProvider);
  
  // Register handlers in the container
  container.bind(AccountHandler).toConstantValue(new AccountHandler(daprAdapter));

  // Use the system
  const creditResult = await messageDispatcher.dispatch(
    new CreditMessage("1", { amount: 100 })
  );
  const debitResult = await messageDispatcher.dispatch(
    new DebitMessage("1", { amount: 50 })
  );

  console.log("Credit result:", creditResult);
  console.log("Debit result:", debitResult);
}

main().catch(console.error);
```

## API Reference

### Decorators

- `@actor(name: string)`: Marks a class as an actor
- `@onMessage(type: string)`: Marks a method as a message handler
- `@actorMessage(meta: { actor: string, message: string })`: Defines a message type
- `@actorMessageHandler(meta: { actor: string, message?: string })`: Defines a message handler
- `@messageHandler(type: string)`: Marks a method as a message handler in a handler class

### Base Classes

- `BaseActor<T>`: Base class for actors with state management
- `ActorGenericMessageHandler<T>`: Generic base class for message handlers

### Interfaces

- `ActorMessage<T>`: Interface for message types
- `ActorCommandHandlerMetadata`: Interface for handler metadata

## License

MIT