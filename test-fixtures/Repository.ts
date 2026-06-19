interface Identifiable {
    id: number;
}

class Entity implements Identifiable {
    private id: number;
    protected createdAt: Date;
    public name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.createdAt = new Date();
    }

    public getId(): number {
        return this.id;
    }

    protected serialize(): string {
        return JSON.stringify(this);
    }
}

class User extends Entity {
    private email: string;
    public isActive: boolean;

    constructor(id: number, name: string, email: string) {
        super(id, name);
        this.email = email;
        this.isActive = true;
    }

    public deactivate(): void {
        this.isActive = false;
    }

    public getEmail(): string {
        return this.email;
    }
}

export { Entity, User };
