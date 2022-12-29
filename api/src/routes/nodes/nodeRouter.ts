import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { Node } from "../../models/node";
import { NodeType } from "../../models/NodeType";
import { validateRequest } from "../../middlewares/validateRequest";
import { currentUser } from "../../middlewares/currentUser";

const router = express.Router();

router.get("/", currentUser, async (req: Request, res: Response) => {
    if (!req.currentUser) return res.send({});
    const node = await Node.findOne({
        value: "Subjects",
        belongsTo: req.currentUser!.id,
    });

    if (!node) {
        const root = new Node({
            type: NodeType[NodeType.Root],
            value: "Subjects",
            path: null,
            order: 0,
            belongsTo: req.currentUser.id,
        });
        await root.save();
        return res.send(await root.buildSubtree());
    }

    const root = await node.buildSubtree();

    res.send(root);
});

router.post(
    "/:id/newchild",
    [
        body("name")
            .notEmpty()
            .trim()
            .isLength({ min: 4, max: 20 })
            .withMessage("Child name must be between 4 and 20 characters"),
    ],
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
        const { name } = req.body;
        const { id } = req.params;

        const parent = await Node.findById(id);
        const child = await parent?.buildChild(name);
        await child?.save();
        res.send(child);
    }
);

router.delete("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    await Node.findOneAndDelete({ _id: id });
    await Node.deleteMany({ path: new RegExp(`${id}`, "ig") });
    res.send({ error: null });
});

router.get("/:id/path", async (req: Request, res: Response) => {
    const { id } = req.params;
    const node = await Node.findById(id);
    res.send({ path: node?.humanReadablePath });
});

router.get("/:id/count", async (req: Request, res: Response) => {
    const { id } = req.params;
    const nodes = await Node.find({ path: new RegExp(`${id}`) });
    res.send({ count: nodes.length });
});

router.patch(
    "/:id/changeParent",
    [body("parentId").notEmpty().trim(), body("afterNodeId").exists()],
    validateRequest,
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { parentId, afterNodeId } = req.body;

        const node = await Node.findById(id);
        await node?.changeParent(parentId, afterNodeId);
        res.send({});
    }
);

router.get("/search", currentUser, async (req: Request, res: Response) => {
    const { value } = req.query;
    const nodes = await Node.find({
        value: new RegExp(value as string, "gi"),
        belongsTo: req.currentUser!.id,
    });
    const nodesWithSubtrees = await Promise.all(
        nodes.map((node) => node.buildSubtree())
    );
    res.send(nodesWithSubtrees);
});

export { router as nodeRouter };
