import { EventEmitter } from "events";
import { DebugProtocol } from '@vscode/debugprotocol';
import { Buffer } from "buffer";
import { Socket } from "net";
import { RequestCommand } from "../types";
import { DebuggerCommand } from "./DebuggerCommand";

const IDENTIFIER = '\r\n\r\n';

export class SocketConnector {
    private msgId: number;

    private socket: Socket;

    private rawData: Buffer;

    private contentLength = -1;

    private disposed = false;

    private events: EventEmitter;

    public shareState: any;

    private command: DebuggerCommand;


    constructor() {
        this.events = new EventEmitter();
        this.rawData = Buffer.alloc(0);
        this.msgId = 0;
        this.command = new DebuggerCommand();
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
    }

    private bindHandler(fnc_name: string) {
        return (data) => {
            this[fnc_name](data);
        }
    }
    
    public async init() {
        return new Promise((resolve, rej) => {
            // Create Socket Logic
            this.socket = new Socket();
            this.socket.connect(5678, "localhost", () => {
                console.log('Connect to Python Debugpy server successfully');
                this.initRequest(this.command.initialize());
                this.initRequest(this.command.attach());
                this.initRequest(this.command.configurationDone());
                resolve(true);
            });
            this.socket.setTimeout(5000);
            this.socket.addListener('data', this.dataCallbackHandler);
        });
    }

    public dispose(): void {
        if (this.socket) {
            this.socket.removeListener('data', this.dataCallbackHandler);
            this.socket.destroy();
        }
    }

    public on(event: string | symbol, listener: any): this {
        this.events.on(event, listener);
        return this;
    }

    public once(event: string | symbol, listener: any): this {
        this.events.once(event, listener);
        return this;
    }

    public initRequest(msg: RequestCommand) {
        msg.seq = ++this.msgId;
        msg.type = 'request';
        this.request(msg);
    }

    private request(msg: RequestCommand) {
        const sMsg = JSON.stringify(msg);
        const data = `Content-Length: ${sMsg.length}\r\n\r\n${sMsg}`;
        console.log(`Sending data...`);
        console.log(msg);
        console.log();
        this.socket.write(data);
    }

    public doRequest(msg: RequestCommand) {
        msg.seq = ++this.msgId;
        msg.type = 'request';
        if (this.shareState.start) {
            this.request(msg);
        } else {
            this.shareState.commands.push(msg);
        }
    }


    private dispatch(body: string): void {
        const message = JSON.parse(body) as DebugProtocol.ProtocolMessage;

        switch (message.type) {
            case 'event': {
                const event = message as DebugProtocol.Event;
                if (typeof event.event === 'string') {
                    this.events.emit(`${message.type}_${event.event}`, event);
                }
                break;
            }
            case 'request': {
                const request = message as DebugProtocol.Request;
                if (typeof request.command === 'string') {
                    this.events.emit(`${message.type}_${request.command}`, request);
                }
                break;
            }
            case 'response': {
                const response = message as DebugProtocol.Response;
                if (typeof response.command === 'string') {
                    this.events.emit(`${message.type}_${response.command}`, response);
                }
                break;
            }
            default: {
                this.events.emit(`${message.type}`, message);
            }
        }

        this.events.emit('data', message);
    }

    private dataCallbackHandler = (data: string | Buffer) => {
        this.handleData(data as Buffer);
    };

    private handleData(data: Buffer): void {
        if (this.disposed) {
            return;
        }
        this.rawData = Buffer.concat([this.rawData, data as Buffer]);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.contentLength >= 0) {
                if (this.rawData.length >= this.contentLength) {
                    const message = this.rawData.toString('utf8', 0, this.contentLength);
                    this.rawData = this.rawData.subarray(this.contentLength);
                    this.contentLength = -1;
                    if (message.length > 0) {
                        this.dispatch(message);
                    }
                    // there may be more complete messages to process.
                    // eslint-disable-next-line no-continue
                    continue;
                }
            } else {
                const idx = this.rawData.indexOf(IDENTIFIER);
                if (idx !== -1) {
                    const header = this.rawData.toString('utf8', 0, idx);
                    const lines = header.split('\r\n');
                    for (const line of lines) {
                        const pair = line.split(/: +/);
                        if (pair[0] === 'Content-Length') {
                            this.contentLength = +pair[1];
                        }
                    }
                    this.rawData = this.rawData.subarray(idx + IDENTIFIER.length);
                    // eslint-disable-next-line no-continue
                    continue;
                }
            }
            break;
        }
    };
} 