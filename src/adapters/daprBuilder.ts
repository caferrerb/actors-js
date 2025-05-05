import { Container } from "inversify";
import { InverisifyDependenciesResolver } from "./dependeciesResolver";
import { DaprActorProvider } from "./daprAdapter";
import { DaprClient, DaprServer } from "@dapr/dapr";
import { ActorTypes } from "./types";
import { ActorMessagingDispatcher } from "../runtime/messageDispatcher";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface DaprOptions {
    daprServerOptions?: {
        serverHost: string;
        serverPort: string;
    }
    daprClientOptions?: {
        daprHost: string;
        daprPort: string;
    }
    serverWaitTime?: number;
    stateStoreOptions: {
        stateStoreDependency?:symbol | string,
        stateStoreBuilder?: (container?: Container) => any,
    }
    builderOptions?: {
        serverBuilder?: (container?: Container) => DaprServer,
        clientBuilder?: (container?: Container) => DaprClient,
    }
}


export async function buildDaprActorRuntime(container: Container, options: DaprOptions): Promise<ActorMessagingDispatcher> {
    if (!options.stateStoreOptions.stateStoreBuilder && !options.stateStoreOptions.stateStoreDependency) {
        throw new Error('must define the dependency of state store');
    }
    const stateStore = options.stateStoreOptions.stateStoreBuilder ? options.stateStoreOptions.stateStoreBuilder(container) : container.get(options.stateStoreOptions.stateStoreDependency ?? "");
    
    if (!stateStore) {
        throw new Error('must define the dependency of state store');
    }
    container.bind(ActorTypes.StateResolver).toConstantValue(stateStore);
    
    const daprServer = await createDaprServer(options);
    container.bind(ActorTypes.ActorServer).toConstantValue(daprServer);

    const resolver = new InverisifyDependenciesResolver(container);
    const daprProvider = new DaprActorProvider(resolver);

    await sleep(options.serverWaitTime ?? 5 * 1000);

    await daprProvider.registerAll();

    const daprClient = await createDaprClient(options);
    container.bind(ActorTypes.ActorClient).toConstantValue(daprClient);
    container.bind(ActorTypes.ActorProvider).toConstantValue(daprProvider);

    const messageDispatcher = new ActorMessagingDispatcher(resolver, daprProvider);
    container.bind(ActorTypes.ActorDispatcher).toConstantValue(messageDispatcher);
    return messageDispatcher;
}

async function createDaprServer(options: DaprOptions, container?: Container): Promise<DaprServer> {
    if (!options.daprServerOptions && !options.builderOptions?.serverBuilder) {
        throw new Error('must define the dapr options or the server builder');
    }
    const server = options.builderOptions?.serverBuilder ? options.builderOptions.serverBuilder(container) : new DaprServer({
        serverHost: options.daprServerOptions?.serverHost,
        serverPort: options.daprServerOptions?.serverPort,
        clientOptions: {
          daprHost: options.daprClientOptions?.daprHost,
          daprPort: options.daprClientOptions?.daprPort,
        },
      });
      console.log("Dapr server initialized");
      return server;
}

async function createDaprClient(options: DaprOptions, container?: Container): Promise<DaprClient> {
    if (!options.daprClientOptions && !options.builderOptions?.clientBuilder) {
        throw new Error('must define the dapr options or the client builder');
    }
    const client = options.builderOptions?.clientBuilder 
    ? options.builderOptions.clientBuilder(container) 
    : new DaprClient({ daprHost: options.daprClientOptions?.daprHost, daprPort: options.daprClientOptions?.daprPort });
    console.log("Dapr client initialized");
    return client;
}