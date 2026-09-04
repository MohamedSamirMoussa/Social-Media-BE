import type { ISuccessHandler } from "../types/common.types"



export const successHandler = ({
    res,
    data = {},
    status = 200,
    message = 'Done'
}:ISuccessHandler) => {

    return res.status(status).json({
        message,
        data,
        status
    })

 }