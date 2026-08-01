// ENUMS
export enum GameMode
{
    Metroidvania,
    Isometric,
    FPS
}

//INTERFACES
export interface IEntityState
{
    enter(): void;
    update(delta: number): void;
    exit(): void;
}