interface Loggable {
    log(message: string): void;
    getHistory(): string[];
}

abstract class BaseService {
    protected name: string;
    private static instanceCount: number = 0;

    constructor(name: string) {
        this.name = name;
        BaseService.instanceCount++;
    }

    abstract execute(): void;

    getStatus(): string {
        return `${this.name} is ready`;
    }

    static getInstanceCount(): number {
        return BaseService.instanceCount;
    }
}

class UserService extends BaseService implements Loggable {
    private users: Map<number, string>;
    private history: string[];

    constructor(name: string) {
        super(name);
        this.users = new Map();
        this.history = [];
    }

    addUser(id: number, username: string): void {
        this.users.set(id, username);
        this.log(`Added user: ${username}`);
    }

    getUser(id: number): string | undefined {
        return this.users.get(id);
    }

    removeUser(id: number): boolean {
        const deleted = this.users.delete(id);
        if (deleted) {
            this.log(`Removed user with id: ${id}`);
        }
        return deleted;
    }

    execute(): void {
        console.log(`Executing ${this.name} with ${this.users.size} users`);
    }

    log(message: string): void {
        const entry = `[${new Date().toISOString()}] ${message}`;
        this.history.push(entry);
        console.log(entry);
    }

    getHistory(): string[] {
        return [...this.history];
    }

    get userCount(): number {
        return this.users.size;
    }
}

class ConfigService {
    static readonly VERSION = "1.0.0";
    private _env: string;

    constructor(env: string = "development") {
        this._env = env;
    }

    get env(): string {
        return this._env;
    }

    set env(value: string) {
        this._env = value;
    }
}

export function formatUser(user: UserService): string {
    return `${user.getUser(1)}`;
}

const helper = (x: number): number => x * 2;

export async function fetchData(url: string): Promise<void> {
    // fetch
}
