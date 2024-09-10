import { DebuggerCommand } from "./DebuggerCommand";
import { SocketConnector } from "./SocketConnector";

let i = 0;
export class DebuggerHandler {
    private socket: SocketConnector;
    private shareState: any;
    private command: DebuggerCommand;
    private variables: any;

    constructor(socket: SocketConnector) {
        this.socket = socket;
        this.command = new DebuggerCommand();
        this.variables = {
            scopes: [],
            idx_scope: 0,
            frames: {},
            locals: [],
            globals: [],
            switch: false,
        }
        this.shareState = {
            registerInit: false,
            registerResponse: false,
            resume: false,
            seq: 0,
            count: 0,
            threadId: null,
            start: false,
            commands: [],
        };
        // this.setupHandlers();
    }

    public threadStart() {
        return new Promise((resolve, _) => {
            const onEventThread = (data) => {
                if (data.event == "thread" && data.body.reason == "started") {
                    this.shareState.threadId = data.body.threadId;
                    resolve(true);
                }
            }
            this.socket.removeListeners('event_thread');
            this.socket.on('event_thread', onEventThread);
        });
    }

    public getCurrentStateData() {
        return new Promise((resolve, _) => {
            // Flow code: Stop -> StackTrace -> Scope -> Variable
            const onStopped = (data) => {
                if (data.body.reason === "breakpoint" || data.body.reason === "step") {
                    const threadId = this.shareState.threadId;
                    this.socket.doRequest(this.command.stackTrace(threadId));
                }
            };

            const onStackTraceResponse = (data) => {
                this.variables.frames = data.body.stackFrames;
                const frameId = data.body.stackFrames[0].id;
                this.socket.doRequest(this.command.scopes(frameId));
            };

            const onScopesResponse = (data) => {
                this.variables.scopes = data.body.scopes;
                const scope = data.body.scopes[0].variablesReference;
                this.socket.doRequest(this.command.variable(scope));
            };

            const onVariablesResponse = (data) => {
                if (!this.variables.switch) {
                    this.variables.locals = data.body.variables;
                    const scope = this.variables.scopes[1].variablesReference;
                    this.socket.doRequest(this.command.variable(scope));
                    this.variables.scopes = [];
                    this.variables.switch = true;
                } else {
                    this.variables.globals = data.body.variables;
                    this.variables.switch = false;
                    resolve(this.formatedData());
                }
            };

            // Remove existing listeners
            this.socket.removeListeners('event_stopped');
            this.socket.removeListeners('response_stackTrace');
            this.socket.removeListeners('response_scopes');
            this.socket.removeListeners('response_variables');

            // Attach new listeners
            this.socket.on('event_stopped', onStopped);
            this.socket.on('response_stackTrace', onStackTraceResponse);
            this.socket.on('response_scopes', onScopesResponse);
            this.socket.on('response_variables', onVariablesResponse);
        });
    }

    public stepIn() {
        const threadId = this.shareState.threadId;
        if (threadId || threadId == 0) {
            this.socket.doRequest(this.command.stepIn(threadId, "line"));
            return new Promise((res, _) => {
                this.socket.removeListeners('response_stepIn');
                this.socket.on('response_stepIn', () => {
                    res(true);
                });
            })
        }
    }

    public stepOut() {
        const threadId = this.shareState.threadId;
        if (threadId || threadId == 0) {
            this.socket.doRequest(this.command.stepOut(threadId, "line"));
            return new Promise((res, _) => {
                this.socket.removeListeners('response_stepOut');
                this.socket.on('response_stepOut', () => {
                    res(true);
                });
            })
        }
    }

    public terminate() {
        this.socket.doRequest(this.command.terminate());
            return new Promise((res, _) => {
                this.socket.removeListeners('response_terminate');
                this.socket.on('response_terminate', () => {
                    res(true);
                });
            })
    }


    private formatedData() {
        return {
            locals: this.variables.locals,
            globals: this.variables.globals,
            frames: this.variables.frames
        }
    }

    private setupHandlers() {
        this.socket.on('data', this.bindHandler("onDataHandler"));
    }

    private bindHandler(fnc_name: string) {
        return (data) => {
            this[fnc_name](data);
        }
    }

    private onDataHandler(data: any) {
        console.log(JSON.stringify(data, null, 2));
    }
}