import { DebuggerCommand } from "./DebuggerCommand";
import { DebuggerHandler } from "./DebuggerHandler";
import { SocketConnector } from "./SocketConnector";

export class Client {
    private socket: SocketConnector;
    private handler: DebuggerHandler;
    private command: DebuggerCommand;

    constructor() {
        this.socket = new SocketConnector();
        this.handler = new DebuggerHandler(this.socket, this.socket.shareState);
        this.command = new DebuggerCommand();
    }

    public async init() {
        await this.socket.init();
    }

    setBreakPoints(path: string, breakpoints: any[]) {
        this.socket.doRequest(this.command.setBreakPoints(path, breakpoints));
    }

    next() {
        this.socket.doRequest(this.command.next());
    }
}