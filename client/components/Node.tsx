import React from "react";

export interface INodeProps {
    title: string;
    body: React.ReactNode;
}

const Node = ({ title, body }: INodeProps) => {
    return <div>Node</div>;
};

export default Node;
