import { DebugProtocol } from '@vscode/debugprotocol';

export class DebuggerCommand {
    // This class is used for sending commands to Debugpy server

    initialize() {
        const command: DebugProtocol.InitializeRequest = {
            seq: 0,
            command: "initialize",
            type: "request",
            arguments: {
                adapterID: 'pydevd',
                clientID: '123',
                clientName:'client.py',                                                  
                linesStartAt1: true,                                                  
                columnsStartAt1: true,                                                
                pathFormat: 'path',
                supportsVariableType: true,
                supportsVariablePaging: true,
                supportsRunInTerminalRequest: false,
            }
        };
        return command;
    }

    attach() {
        const command: DebugProtocol.AttachRequest = {
            seq: 0,
            type: "request",
            command: "attach",
            arguments: {
                __restart: false
            }
        }
        return command;
    }

    launch() {
        const command: DebugProtocol.LaunchRequest = {
            seq: 0,
            type: "request",
            command: "launch",
            arguments: {
                noDebug: false
            }
        };
        return command;
    }

    configurationDone() {
        const command: DebugProtocol.ConfigurationDoneRequest = {
            seq: 0,
            type: "request",
            command: 'configurationDone',
            arguments: {}
        }
        return command;
    }

    next() {
        const command: DebugProtocol.NextRequest = {
            seq: 0,
            type: "request",
            command: "next",
            arguments: {
                threadId: 1,
                singleThread: true,
                granularity: "line"
            }
        }
        return command;
    }

    setBreakPoints(path: string, breakpoints: DebugProtocol.SourceBreakpoint[]) {
        const command = {
            command: 'setBreakpoints',
            arguments: {
                source: {
                    path,
                },
                breakpoints
            }
        };
        return command;
    }

    stackTrace(threadId: number) {
        const command: DebugProtocol.StackTraceRequest = {
            seq: 0,
            type: "request",
            command: 'stackTrace',
            arguments: {
                threadId: threadId
            }
        }
        return command;
    }

    scopes(frameId: number) {
        const command: DebugProtocol.ScopesRequest = {
            seq: 0,
            type: "request",
            command: 'scopes',
            arguments: {
                frameId: frameId
            }
        }
        return command;
    }

    variable(variablesReference: number) {
        const commnad: DebugProtocol.VariablesRequest = {
            seq: 0,
            type: 'request',
            command: 'variables',
            arguments: {
                variablesReference
            }            
        }
        return commnad;
    }

    stepIn(threadId: number, granularity: 'statement' | 'line' | 'instruction') {
        const commnad: DebugProtocol.StepInRequest = {
            seq: 0,
            type: 'request',
            command: 'stepIn',
            arguments: {
                threadId: threadId,
                singleThread: true,
                granularity: granularity
            }            
        }
        return commnad;
    }

    stepOut(threadId: number, granularity: 'statement' | 'line' | 'instruction') {
        const commnad: DebugProtocol.StepInRequest = {
            seq: 0,
            type: 'request',
            command: 'stepOut',
            arguments: {
                threadId: threadId,
                singleThread: true,
                granularity: granularity
            }            
        }
        return commnad;
    }

    terminate() {
        const commnad: DebugProtocol.TerminateRequest = {
            seq: 0,
            type: 'request',
            command: 'terminate',
            arguments: {
                restart: false
            }            
        }
        return commnad;
    }
}