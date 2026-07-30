import { BaseEntity } from "./BaseEntity";

export class EntityManager
{
    private entities: BaseEntity[] = [];

    public add(entity: BaseEntity) { this.entities.push(entity); }

    public remove(entity: BaseEntity) { this.entities = this.entities.filter(e => e !== entity); }

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