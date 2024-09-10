export interface RequestCommand {
    command: string,
    type?: string,
    seq?: number,
    arguments?: {};
}