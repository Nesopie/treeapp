export interface User {
    username: string;
}

export enum NodeType {
    Root,
    Subject,
    Lesson,
    Module,
    Workbook,
}

export interface Node {
    _id: string;
    type: NodeType;
    value: string;
    path: string | null;
    children: Array<Node>;
    order: number;
}
