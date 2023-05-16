declare module 'net-snmp' {
    export enum ErrorStatus {
        NoError = 0,
        TooBig = 1,
        NoSuchName = 2,
        BadValue = 3,
        ReadOnly = 4,
        GenErr = 5,
        NoAccess = 6,
        WrongType = 7,
        WrongLength = 8,
        WrongEncoding = 9,
        WrongValue = 10,
        NoCreation = 11,
        InconsistentValue = 12,
        ResourceUnavailable = 13,
        CommitFailed = 14,
        UndoFailed = 15,
        AuthorizationError = 16,
        NotWritable = 17,
        InconsistentName = 18,
    }

    export enum ObjectType {
        Boolean = 2,
        Integer = 2,
        BitString = 3,
        OctetString = 4,
        Null = 5,
        OID = 6,
        Sequence = 16,
        IpAddress = 64,
        Counter = 65,
        Gauge = 66,
        TimeTicks = 67,
        Opaque = 68,
        Counter64 = 70,
        NoSuchObject = 128,
        NoSuchInstance = 129,
        EndOfMibView = 130,
    }

    export interface Varbind {
        oid: string;
        type: ObjectType;
        value: any;
    }

    export interface Session {
        get: (oids: string[], callback: (error: Error | null, varbinds: Varbind[]) => void) => void;
        close: () => void;
    }

    export interface Options {
        port?: number;
        retries?: number;
        timeout?: number;
        transport?: string;
        trapPort?: number;
        version?: string;
        idBitsSize?: number;
        context?: string;
    }

    export function createSession(target: string, community: string, options?: Options): Session;
    export function isVarbindError(varbind: Varbind): boolean;
}
