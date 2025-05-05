export interface DependenciesResolver {
    resolve<T = any>(symbol: string |symbol | NewableFunction): T;
    register(symbol: string |symbol | NewableFunction, instance: any): void;
}