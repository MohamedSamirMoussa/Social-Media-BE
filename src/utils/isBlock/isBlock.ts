import { Types } from "mongoose";
import { BlockRepository } from "../../DB";

export const isBlockedBetweenUsers = async ({
    blockModel,
    userOneId,
    userTwoId,
}: {
    blockModel: BlockRepository;
    userOneId: Types.ObjectId | string;
    userTwoId: Types.ObjectId | string;
}) => {
    const block =
        await blockModel.findOne({
            filter: {
                $or: [
                    {
                        blockerId: userOneId,
                        blockedId: userTwoId,
                    },
                    {
                        blockerId: userTwoId,
                        blockedId: userOneId,
                    },
                ],
            },
        });

    return Boolean(block);
};