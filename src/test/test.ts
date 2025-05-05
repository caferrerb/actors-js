import { Container } from "inversify";
import {ActorTypes, buildDaprActorRuntime, DaprActorProvider, registerMessages, registerHandlers, registerActors} from '../index'
import { Account, AddMessage, ArithmeticHandler, CreditHandler, CreditMessage, DebitHandler, DebitMessage, DecrementMessage, DivideHandler, DivideMessage, IncrementMessage, MultiplyMessage, SubtractMessage } from "./mocks/mocks";
import { InMemoryStateResolver } from "./components/inMemoryStateResolver";

const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const serverHost = "127.0.0.1"; // App Host of this Example Server
const serverPort = "50001"; // App Port of this Example Server

async function  main() {
    const container = new Container();
    const messageDispatcher = await buildDaprActorRuntime(container, {
        daprServerOptions: {
            serverHost,
            serverPort,
        },
        daprClientOptions: {
            daprHost,
            daprPort,
        },
        serverWaitTime: 5 * 1000,
        stateStoreOptions: {
            stateStoreBuilder() {
                return new InMemoryStateResolver();
            },
        }
    });
    registerMessages(CreditMessage, DebitMessage, IncrementMessage, DecrementMessage, AddMessage, SubtractMessage, MultiplyMessage, DivideMessage);
    registerHandlers(DebitHandler, CreditHandler, ArithmeticHandler, DivideHandler);
    registerActors(Account);
    const daprAdapter = container.get<DaprActorProvider>(ActorTypes.ActorProvider);
    container.bind(DebitHandler).toConstantValue(new DebitHandler(daprAdapter));
    container.bind(CreditHandler).toConstantValue(new CreditHandler(daprAdapter));
    container.bind(ArithmeticHandler).toConstantValue(new ArithmeticHandler(daprAdapter));
    container.bind(DivideHandler).toConstantValue(new DivideHandler(daprAdapter));
    const account1 = await messageDispatcher.dispatch(new CreditMessage("1", { amount: 100 }));
    const account2 = await messageDispatcher.dispatch(new DebitMessage("1", { amount: 50 }));
    console.log(account1, account2);
    const a = await messageDispatcher.dispatch(new IncrementMessage('1', {amount: 1}));
    const b = await messageDispatcher.dispatch(new DecrementMessage('1', {amount: 1}));
    console.log(a, b);
    const c = await messageDispatcher.dispatch(new AddMessage('1', {amount: 100}));
    const d = await messageDispatcher.dispatch(new SubtractMessage('1', {amount: 50}));
    const e = await messageDispatcher.dispatch(new MultiplyMessage('1', {amount: 4}));
    const f = await messageDispatcher.dispatch(new DivideMessage('1', {amount: 2}));
    console.log(c, d, e, f);
}
main().catch((error) => {
    console.error(error);
});