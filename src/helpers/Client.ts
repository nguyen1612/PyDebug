import { DebuggerCommand } from "./DebuggerCommand";
import { DebuggerHandler } from "./DebuggerHandler";
import { SocketConnector } from "./SocketConnector";

export class Client {
    private socket: SocketConnector;
    private handler: DebuggerHandler;
    private command: DebuggerCommand;

    constructor() {
        this.socket = new SocketConnector();
        this.handler = new DebuggerHandler(this.socket);
        this.command = new DebuggerCommand();
    }

    public async init() {
        await this.socket.init();
        this.socket.doRequest(this.command.initialize());
        this.socket.doRequest(this.command.attach());
        this.socket.doRequest(this.command.configurationDone());
        return await this.handler.threadStart();
    }

    async setBreakPoints(path: string, breakpoints: any[]) {
        this.socket.doRequest(this.command.setBreakPoints(path, breakpoints));
        return await this.handler.getCurrentStateData();
    }

    async next() {
        this.socket.doRequest(this.command.next());
        return await this.handler.getCurrentStateData();
    }

    async stepIn() {
        await this.handler.stepIn();
        return await this.handler.getCurrentStateData();
    }

    async stepOut() {
        await this.handler.stepOut();
        return await this.handler.getCurrentStateData();
    }

    async destroy() {
        await this.handler.terminate();
        this.socket.destroy();
    }
}