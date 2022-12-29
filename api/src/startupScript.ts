import { Node } from "./models/node";
import { User } from "./models/user";
import { NodeType } from "./models/NodeType";
import { Password } from "./services/Password";

const startup = async () => {
    await Node.deleteMany({});
    await User.deleteMany({});

    const user = new User({
        username: "testUser",
        password: await Password.toHash("password"),
    });

    await user.save();

    const root = new Node({
        type: NodeType[NodeType.Root],
        value: "Subjects",
        path: null,
        order: 0,
        belongsTo: user._id,
    });
    await root.save();

    const subject1 = await root.buildChild("Subject1");
    await subject1!.save();

    const subject2 = await root.buildChild("Subject2");
    await subject2!.save();

    const lesson1 = await subject1!.buildChild("lesson1");
    await lesson1!.save();

    const lesson2 = await subject1!.buildChild("lesson2");
    await lesson2!.save();

    const module1 = await lesson1!.buildChild("module1");
    await module1!.save();

    const module2 = await lesson1!.buildChild("module2");
    await module2!.save();

    const workbook1 = await module1!.buildChild("workbook1");
    await workbook1!.save();

    const workbook2 = await module1!.buildChild("workbook2");
    await workbook2!.save();

    const workbook3 = await module1!.buildChild("workbook3");
    await workbook3!.save();

    const workbook4 = await module2!.buildChild("workbook4");
    await workbook4!.save();
};

const startupMega = async () => {
    await User.deleteMany({});
    await Node.deleteMany({});

    const user = new User({
        username: "testUser",
        password: await Password.toHash("password"),
    });

    await user.save();

    const root = new Node({
        type: NodeType[NodeType.Root],
        value: "Subjects",
        path: null,
        order: 0,
        belongsTo: user._id,
    });
    await root.save();

    for (let i = 0; i < 6; i++) {
        const subject = await root.buildChild("Subject " + `${i}`);
        await subject!.save();
        for (let j = 0; j < 6; j++) {
            const lesson = await subject!.buildChild("Lesson " + `${i}.${j}`);
            await lesson!.save();
            for (let k = 0; k < 6; k++) {
                const module = await lesson!.buildChild(
                    "Module " + `${i}.${j}.${k}`
                );
                await module!.save();
                for (let l = 0; l < 6; l++) {
                    const workbook = await module!.buildChild(
                        "Workbook " + `${i}.${j}.${k}.${l}`
                    );
                    await workbook!.save();
                }
            }
        }
    }
};

export { startup, startupMega };
