import { EntityBase } from "./EntityBase";

export class EntityManager
{
    private entities: EntityBase[] = [];

    public add(entity: EntityBase) { this.entities.push(entity); }

    public remove(entity: EntityBase) { this.entities = this.entities.filter(e => e !== entity); }

    public update(delta: number): void
    {
        for(let entity of this.entities)
            entity.update(delta);
    }

    public dispose(): void
    {
        for(let entity of this.entities)
            entity.dispose();
        this.entities = [];
    }
}