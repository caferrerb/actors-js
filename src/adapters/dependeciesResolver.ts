import { Container } from "inversify";
import { DependenciesResolver } from "../runtime/dependencyResolver";

export class InverisifyDependenciesResolver implements DependenciesResolver {
    constructor(private readonly container: Container) {}

    resolve<T>(symbol: symbol | NewableFunction): T {
        return this.container.get<T>(symbol);
    }

    register(symbol: string |symbol | NewableFunction, instance: any): void {
        this.container.bind(symbol).toConstantValue(instance);
    }
}