import mongoose, { Schema } from "mongoose";
import { NodeType } from "./NodeType";

export interface INode {
    type: NodeType;
    value: string;
    path?: string;
    humanReadablePath: string;
    order: number;
    belongsTo?: mongoose.Schema.Types.ObjectId;
}

export interface INodeDoc extends INode, mongoose.Document {
    buildChild(value: string): Promise<
        | (INodeDoc & {
              _id: mongoose.Types.ObjectId;
          })
        | void
    >;

    changeParent(
        newParentId: mongoose.Schema.Types.ObjectId,
        afterNodeId: mongoose.Schema.Types.ObjectId | ""
    ): Promise<void>;

    buildSubtree(): Promise<
        mongoose.LeanDocument<
            INodeDoc & {
                _id: mongoose.Types.ObjectId;
            }
        >
    >;
    children: mongoose.LeanDocument<
        INodeDoc & {
            _id: mongoose.Types.ObjectId;
        }
    >[];
}

const nodeSchema = new mongoose.Schema<INodeDoc>({
    type: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        default: "",
    },

    humanReadablePath: {
        type: String,
        default: "",
    },
    order: {
        type: Number,
        required: true,
    },
    belongsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

nodeSchema.set("toJSON", {
    transform(_doc, ret) {
        delete ret.path;
        delete ret.humanReadablePath;
        delete ret.order;
    },
});

nodeSchema.methods.buildChild = async function (value: string) {
    if (this.type == NodeType[NodeType.Workbook].toString()) return;

    const order: any = await Node.find({
        path: new RegExp(`${this._id},$`, "gi"),
        belongsTo: this.belongsTo,
    })
        .sort({
            order: -1,
        })
        .limit(1);

    const node = new Node({
        type: NodeType[(NodeType[this.type] + 1) as unknown as NodeType],
        value,
        path: `${this.path ?? ","}${this._id},`,
        humanReadablePath: `${this.humanReadablePath ?? "/"}${this.value}/`,
        order: order.length === 0 ? 0 : order[0].order + 1,
        belongsTo: this.belongsTo,
    });

    return node;
};

nodeSchema.methods.changeParent = async function (
    newParentId: mongoose.Schema.Types.ObjectId,
    afterNodeId: mongoose.Schema.Types.ObjectId | ""
): Promise<void> {
    const regex = new RegExp("," + this._id.toString() + ",");
    const paths = this.path.split(",");
    const parentId = paths[paths.length - 2];

    const newParent = await Node.findById(newParentId);
    if (!newParent) return;

    const oldPath = this.path;
    const oldHumanReadablePath = this.humanReadablePath;

    this.path = `${newParent.path ?? ","}${newParent._id},`;
    // "" means it was dropped on parent so find the largest order and increment by 1
    if (afterNodeId === "") {
        this.order =
            (
                await Node.find({
                    path: new RegExp(`${newParentId},$`, "gi"),
                    belongsTo: this.belongsTo,
                })
                    .sort({
                        order: -1,
                    })
                    .limit(1)
            )[0].order + 1;
    } else {
        this.order = (await Node.findById(afterNodeId))!.order;
    }
    this.humanReadablePath = `${newParent.humanReadablePath ?? "/"}${
        newParent.value
    }/`;

    await Promise.all([
        Node.updateMany({ path: regex }, [
            {
                $set: {
                    path: {
                        $replaceOne: {
                            input: "$path",
                            find: `${oldPath}`,
                            replacement: `${this.path}`,
                        },
                    },
                    humanReadablePath: {
                        $replaceOne: {
                            input: "$humanReadablePath",
                            find: `${oldHumanReadablePath}`,
                            replacement: `${this.humanReadablePath}`,
                        },
                    },
                },
            },
        ]),
        Node.updateMany(
            { path: new RegExp(`${parentId},`, "gi") },
            { $inc: { order: 1 } }
        )
            .where("order")
            .gte(this.order),
    ]);

    await this.save();
};

nodeSchema.methods.buildSubtree = async function (): Promise<
    mongoose.LeanDocument<
        INodeDoc & {
            _id: mongoose.Types.ObjectId;
        }
    >
> {
    const root = await Node.findById(this._id).lean();
    root!.children = [];
    const parents = new Map<string, typeof root[]>();
    parents.set(root!._id.toString(), root!.children);

    const docs = await Node.find(
        { path: new RegExp(`,${this._id},`, "gi"), belongsTo: this.belongsTo },
        { humanReadablePath: 0 }
    )
        .sort({ path: 1 })
        .lean();
    for (const doc of docs) {
        doc.children = [];
        parents.set(doc._id.toString(), doc.children);
        const path = doc.path!.split(",");
        const parent = path[path.length - 2];
        parents.get(parent)!.push(doc);

        delete doc.path;
        delete doc.belongsTo;
    }

    return root!;
};

const Node = mongoose.model<INodeDoc>("Node", nodeSchema);

export { Node };

// nodeSchema.methods.buildSubtree = async function (): Promise<
//     mongoose.LeanDocument<
//         INodeDoc & {
//             _id: mongoose.Types.ObjectId;
//         }
//     >
// > {
//     const root = await Node.findById(this._id).lean();

//     root!.children = await buildSubtreeHelper(root!);
//     return root!;
// };

// function buildSubtreeHelper(
//     root: mongoose.LeanDocument<
//         INodeDoc & {
//             _id: mongoose.Types.ObjectId;
//         }
//     >
// ) {
//     return new Promise<
//         mongoose.LeanDocument<
//             INodeDoc & {
//                 _id: mongoose.Types.ObjectId;
//             }
//         >[]
//     >(function (resolve, reject) {
//         Node.find({
//             path: new RegExp(`${root._id},$`),
//         })
//             .lean()
//             .exec(async function (err, docs) {
//                 if (err) reject(err);
//                 root.children = docs;
//                 await Promise.all(
//                     root.children.map(async (child) => {
//                         return (child.children = buildSubtreeHelper(
//                             child
//                         ) as unknown as mongoose.LeanDocument<
//                             INodeDoc & {
//                                 _id: mongoose.Types.ObjectId;
//                             }
//                         >[]);
//                     })
//                 );

//                 resolve(root.children);
//             });
//     });
// }
