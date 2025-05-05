export interface ActorMessage<Data = unknown> {
  actorId: string;
  data: Data;
  metadata?: ActorMessageMetadata;
  validate?(): Promise<boolean> | boolean;
}

export interface ActorMessageMetadata {
  messageId?: string;
  timestamp?: string;
  actorType?: string;
  correlationId?: string;
}