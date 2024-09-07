import { SocketConnector } from "./SocketConnector";
import { DebuggerCommand } from "./DebuggerCommand";

// Stop -> StackTrace -> Scope -> Variable

export class DebuggerHandler {
    private socket: SocketConnector;
    private shareState: any;
    private command: DebuggerCommand;
    private variables: any;

    constructor(socket: SocketConnector, shareState: any) {
        this.socket = socket;
        this.shareState = shareState;
        this.command = new DebuggerCommand();
        this.variables = {
            scopes: [],
            idx_scope: 0,
            locals: [],
            globals: [],
            switch: false,
        }
        this.setupHandlers();
    }

    private setupHandlers() {
        this.socket.on('data', this.bindHandler("onDataHandler"));
        this.socket.on('event_thread', this.bindHandler("onThread"));
        this.socket.on('event_stopped', this.bindHandler("onStopped"));

        this.socket.on('response_stackTrace', this.bindHandler("onStackTrace"));
        this.socket.on('response_scopes', this.bindHandler("onScopes"));
        this.socket.on('response_variables', this.bindHandler("onVariables"));
    }

    private startProcess() {
        if (this.shareState.commands.length == 0) {
            return;
        }
        this.socket.doRequest(this.shareState.commands.shift());
    }

    private bindHandler(fnc_name: string) {
        return (data) => {
            this[fnc_name](data);
        }
    }

    private onDataHandler(data: any) {
        console.log(JSON.stringify(data, null, 2));
    }

    private onVariables(data) {
        if (!this.variables.switch) {
            this.variables.locals = data.body.variables;
            const scope = this.variables.scopes[1].variablesReference
            this.socket.doRequest(this.command.variable(scope));
            this.variables.scopes = [];
            this.variables.switch = true;
        } else {
            this.variables.globals = data.body.variables;
            this.variables.switch = false;
        }
    }

    private onScopes(data) {
        this.variables.scopes = data.body.scopes;
        const scope = data.body.scopes[0].variablesReference
        this.socket.doRequest(this.command.variable(scope));
    }

    private onStackTrace(data) {
        const frameId = data.body.stackFrames[0].id;
        this.socket.doRequest(this.command.scopes(frameId));
    }


    private onStopped(data) {
        if (data.body.reason == "breakpoint" || data.body.reason == "step") {
            const threadId = this.shareState.threadId;
            this.socket.doRequest(this.command.stackTrace(threadId));
        }
    }

    private onThread(data) {
        if (data.event == "thread" && data.body.reason == "started") {
            this.shareState.threadId = data.body.threadId;
            this.shareState.start = true;
            this.startProcess();
        }   
    }
}