import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Node, NodeType } from "../types";
import { Less, More } from "./svgs";
import {
    Modal,
    Typography,
    Box,
    MenuItem,
    Menu,
    TextField,
    Button,
} from "@mui/material";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useValue } from "../hooks/useValue";
import axios from "axios";

export interface ITreeProps {
    data: Node;
    lock: boolean;
    fullyExpanded: boolean;
}

export interface ITreeHelperProps {
    node: Node;
    setAnchorElement: React.Dispatch<React.SetStateAction<EventTarget | null>>;
    index: number;
    marginLeft: number;
    parentData: {
        node: Node;
        children: Node[];
        setChildren: React.Dispatch<React.SetStateAction<Node[]>>;
    };
}

interface IDragContext {
    nodeType: NodeType | "";
    setNodeType: React.Dispatch<React.SetStateAction<NodeType | "">>;
    dragOverItemIndex: number;
    setDragOverItemIndex: React.Dispatch<React.SetStateAction<number>>;
    dropOnSameParentSibling: boolean;
    setDropOnSameParentSibling: React.Dispatch<React.SetStateAction<boolean>>;
}

const DragContext = createContext<IDragContext>({
    nodeType: "",
    setNodeType: () => {},
    dragOverItemIndex: -1,
    setDragOverItemIndex: () => {},
    dropOnSameParentSibling: false,
    setDropOnSameParentSibling: () => {},
});

interface IPayload {
    nodeId: string;
    index: number;
    afterNodeId: string;
    parentId: "";
    setParentChildren: React.Dispatch<React.SetStateAction<Node[]>>;
    setChildren: React.Dispatch<React.SetStateAction<Node[]>>;
    nodeType: NodeType;
}

interface ITreeContext {
    payloadData: React.MutableRefObject<IPayload | null>;
    lock: boolean;
    fullyExpanded: boolean;
}

const TreeContext = createContext<ITreeContext>({
    payloadData: {
        current: {
            nodeId: "",
            setParentChildren: () => {},
            setChildren: () => {},
            index: -1,
            parentId: "",
            afterNodeId: "",
            nodeType: NodeType.Workbook,
        },
    },
    lock: false,
    fullyExpanded: false,
});

const useDrag = () => {
    return useContext(DragContext);
};

const useTree = () => {
    return useContext(TreeContext);
};

const Tree = ({ data, lock, fullyExpanded }: ITreeProps) => {
    // anchor element for the menu
    const [anchorElement, setAnchorElement] = useState<null | EventTarget>(
        null
    );
    const [modalOpen, setModalOpen] = useState(false);
    const open = Boolean(anchorElement);
    //states for dragContext
    const [nodeType, setNodeType] = useState<NodeType | "">("");
    const [dragOverItemIndex, setDragOverItemIndex] = useState<number>(-1);
    const [dropOnSameParentSibling, setDropOnSameParentSibling] =
        useState<boolean>(true);

    //states for tree context
    const payloadData = useRef<IPayload | null>(null);

    //states for this component
    const { value, onValueChange, setValue } = useValue("");
    const [children, setChildren] = useState<Node[]>(data.children);

    const handleSubmit = async (_event: React.FormEvent<HTMLButtonElement>) => {
        const toastId = toast.loading("Processing request...");
        const response = await axios.post(
            `/api/nodes/${payloadData.current?.nodeId}/newChild`,
            { name: value }
        );
        payloadData.current?.setChildren((prev) => {
            return [...prev, { ...response.data, children: [] }];
        });
        toast.success(`New child with name: ${value} is added`, {
            id: toastId,
        });
        setAnchorElement(null);
        setModalOpen(false);
        setValue("");
    };

    const handleDelete = async (_event: React.MouseEvent<HTMLLIElement>) => {
        const toastId = toast.loading("Processing request...");
        const response = await axios.delete(
            `/api/nodes/${payloadData.current?.nodeId}`
        );
        if (!response.data.error) {
            payloadData.current?.setParentChildren((prev) =>
                prev.filter(
                    (prevItem) => prevItem._id !== payloadData.current?.nodeId
                )
            );
            toast.success("Deleted node", { id: toastId });
        }
        setAnchorElement(null);
    };

    const getPath = async (_event: React.MouseEvent<HTMLLIElement>) => {
        const toastId = toast("Getting path...");
        const response = await axios.get(
            `/api/nodes/${payloadData.current?.nodeId}/path`
        );
        toast.success(`The path is: ${response.data.path}`, { id: toastId });
    };

    const getCount = async (_event: React.MouseEvent<HTMLLIElement>) => {
        const toastId = toast("Getting count...");
        const response = await axios.get(
            `/api/nodes/${payloadData.current?.nodeId}/count`
        );
        toast.success(
            `The number of nodes in the subtree is: ${response.data.count}`,
            { id: toastId }
        );
    };

    return (
        <TreeContext.Provider value={{ payloadData, lock, fullyExpanded }}>
            <DragContext.Provider
                value={{
                    nodeType,
                    setNodeType,
                    dragOverItemIndex,
                    setDragOverItemIndex,
                    dropOnSameParentSibling,
                    setDropOnSameParentSibling,
                }}
            >
                <div className="flex flex-col justify-center gap-2 w-auto mt-3">
                    <TreeHelper
                        node={data}
                        setAnchorElement={setAnchorElement}
                        marginLeft={0}
                        index={0}
                        key={data._id}
                        parentData={{
                            node: data,
                            children,
                            setChildren,
                        }}
                    />
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorElement as HTMLElement}
                        open={open}
                        onClose={() => setAnchorElement(null)}
                    >
                        {payloadData.current?.nodeType?.toString() !==
                        NodeType[NodeType.Workbook].toString() ? (
                            <MenuItem onClick={(e) => setModalOpen(true)}>
                                New child
                            </MenuItem>
                        ) : null}
                        <MenuItem onClick={handleDelete}>Delete node</MenuItem>
                        <MenuItem onClick={getPath}>Get Path</MenuItem>
                        <MenuItem onClick={getCount}>Get Count</MenuItem>
                    </Menu>
                    <Modal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                    >
                        <Box
                            sx={{
                                height: "200px",
                                width: "200px",
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            <Typography
                                id="new-child-modal"
                                variant="h6"
                                sx={{ color: "white" }}
                            >
                                Enter new child name
                            </Typography>
                            <TextField
                                id="filled-basic"
                                label="Name"
                                variant="filled"
                                sx={{
                                    input: {
                                        color: "#66b2ff",
                                    },
                                    "& .MuiFormLabel-root": {
                                        color: "#66b2ff",
                                    },
                                }}
                                placeholder="Enter child name"
                                value={value}
                                onChange={onValueChange}
                            />
                            <Button
                                variant="contained"
                                sx={{ marginTop: "5px" }}
                                onClick={handleSubmit}
                            >
                                Submit
                            </Button>
                        </Box>
                    </Modal>
                </div>
            </DragContext.Provider>
        </TreeContext.Provider>
    );
};

const TreeHelper = ({
    node,
    marginLeft = 0,
    setAnchorElement,
    index,
    parentData,
}: ITreeHelperProps) => {
    const [show, setShow] = useState(false);
    const [children, setChildren] = useState(node.children);
    const [dragItemIndex, setDragItemIndex] = useState(-1);
    const {
        nodeType,
        setNodeType,
        dragOverItemIndex,
        setDragOverItemIndex,
        dropOnSameParentSibling,
        setDropOnSameParentSibling,
    } = useDrag();

    const { payloadData, lock, fullyExpanded } = useTree();

    useEffect(() => {
        node.children = children;
    }, [children]);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorElement(event.currentTarget);
        payloadData.current = {
            ...payloadData.current,
            nodeId: node._id,
            setChildren,
            setParentChildren: parentData.setChildren,
            nodeType: node.type,
        } as IPayload;
    };

    const dragStart = (event: React.DragEvent, index: number) => {
        event.stopPropagation();
        setDragItemIndex(index);
        event.dataTransfer.setData("node", JSON.stringify(node));
        event.dataTransfer.setData(parentData.node.type.toString(), ""); // set parent
        event.dataTransfer.setData("id", (event.target as Element).id);
        event.dataTransfer.setData("parent", JSON.stringify(parentData.node));
        event.dataTransfer.setData("index", `${index}`);
        setNodeType(node.type);
    };

    const dragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const dragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (
            event.dataTransfer.types.includes(
                node.type.toString().toLowerCase()
            )
        ) {
            (event.target as Element).classList.add("black");
            (event.target as Element).classList.remove("text-[#027fff]");
        }

        setTimeout(() => {
            setDragOverItemIndex(index);
        }, 2);
    };

    const dragLeave = (
        event: React.DragEvent<HTMLLIElement> | React.DragEvent<HTMLDivElement>
    ) => {
        event.stopPropagation();
        if (
            event.dataTransfer.types.includes(
                node.type.toString().toLowerCase()
            )
        ) {
            (event.target as Element).classList.remove("black");
            (event.target as Element).classList.add("text-[#027fff]");
        }
        setDragOverItemIndex(-1);
    };

    const dragEnd = async (event: React.DragEvent) => {
        if (!dropOnSameParentSibling) {
            parentData.setChildren((prev) => {
                return [
                    ...(prev.slice(0, index) || []),
                    ...(prev.slice(index + 1) || []),
                ];
            });
        }

        const response = await axios.patch(
            `/api/nodes/${payloadData.current?.nodeId}/changeParent`,
            {
                parentId: payloadData.current?.parentId,
                afterNodeId: payloadData.current?.afterNodeId,
            }
        );

        setDropOnSameParentSibling(true);
        setDragItemIndex(-1);
    };

    const drop = async (event: React.DragEvent) => {
        const draggedNode: Node = JSON.parse(
            event.dataTransfer.getData("node")
        );
        const draggedNodeIndex: number = +event.dataTransfer.getData("index");
        const draggedNodeParent: Node = JSON.parse(
            event.dataTransfer.getData("parent")
        );
        if (
            (NodeType[draggedNode.type] as unknown as number) -
                (NodeType[node.type] as unknown as number) === //drop on parent
            1
        ) {
            setDropOnSameParentSibling(false);
            let index = children.length;
            await setChildren((prev) => [
                ...prev.filter((child) => {
                    if (child._id === draggedNode._id) {
                        setDropOnSameParentSibling(true);
                        index--;
                    }
                    return child._id !== draggedNode._id;
                }),
                draggedNode,
            ]);
            payloadData.current = {
                ...payloadData.current,
                nodeId: draggedNode._id,
                index,
                parentId: node._id,
                afterNodeId: "",
            } as IPayload;
        } else if (draggedNode.type === node.type) {
            payloadData.current = {
                ...payloadData.current,
                nodeId: draggedNode._id,
                index,
                parentId: parentData.node._id,
                afterNodeId: node._id,
            } as IPayload;
            parentData.setChildren((prev) => {
                if (draggedNodeParent._id !== parentData.node._id) {
                    setDropOnSameParentSibling(false);
                    return [
                        ...prev.slice(0, index),
                        draggedNode,
                        ...prev.slice(index, prev.length),
                    ];
                } else {
                    setDropOnSameParentSibling(true);
                    const insert = [
                        ...prev.slice(0, index),
                        draggedNode,
                        ...prev.slice(index, prev.length),
                    ];

                    return [
                        ...insert.slice(
                            0,
                            draggedNodeIndex +
                                (draggedNodeIndex >= index ? 1 : 0)
                        ),
                        ...insert.slice(
                            draggedNodeIndex +
                                1 +
                                (draggedNodeIndex >= index ? 1 : 0),
                            insert.length
                        ),
                    ];
                }
            });
        }
        setDragOverItemIndex(-1);
    };

    return (
        <div className={"inline-block bg-sky-400"}>
            <div className="flex align-center">
                {node.type !== NodeType.Root ? (
                    <div
                        className={`w-auto p-3 text-[#027fff] ${node.type}`}
                        style={{ marginLeft }}
                        onDragEnter={dragEnter}
                        onDragLeave={dragLeave}
                        onDrop={drop}
                        onClick={handleClick}
                        draggable={!lock}
                        onDragStart={(e) => dragStart(e, index)}
                        onDragOver={(e) => dragOver(e)}
                        onDragEnd={dragEnd}
                    >
                        {node.value}
                    </div>
                ) : null}
                {!fullyExpanded ? (
                    <div
                        className="flex items-center"
                        onClick={() => setShow((prev) => !prev)}
                    >
                        <AnimatePresence
                            initial={false}
                            mode="wait"
                        >
                            <motion.div
                                id={node.value}
                                key={show ? "less" : "more"}
                                initial={{
                                    rotate: show ? -90 : 90,
                                }}
                                animate={{
                                    rotate: 0,
                                    transition: {
                                        type: "tween",
                                        duration: 0.15,
                                        ease: "circOut",
                                    },
                                }}
                                exit={{
                                    rotate: show ? -90 : 90,
                                    transition: {
                                        type: "tween",
                                        duration: 0.15,
                                        ease: "circIn",
                                    },
                                }}
                            >
                                {children.length > 0 ? (
                                    show ? (
                                        <Less className="text-[#027faa]" />
                                    ) : (
                                        <More className="text-[#027faa]" />
                                    )
                                ) : null}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : null}
            </div>
            {children.length > 0 && (show ? show : fullyExpanded) && (
                <ul>
                    {children.map((child, index) => {
                        if (!child) return null;
                        return (
                            <li key={child.value}>
                                <TreeHelper
                                    node={child}
                                    marginLeft={marginLeft + 10}
                                    setAnchorElement={setAnchorElement}
                                    index={index}
                                    parentData={{
                                        node,
                                        children: children,
                                        setChildren: setChildren,
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

const quickLogger = (...args: any[]) => {
    console.log(args || "hi");
    return false;
};

export default Tree;
