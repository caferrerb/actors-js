export abstract class BaseActor<T = any> {
    public actorId!: string;
  
    public getState!: <T>(key: string) => Promise<T | undefined>;
    public setState!: <T>(key: string, value: T) => Promise<void>;
  
    public abstract deserialize(snapshot: T): void;
  
    public abstract serialize(): T;
  }