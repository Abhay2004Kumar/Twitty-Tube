//promises
const asynchHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}



export {asynchHandler}

//try-catch
// const asynchHandler = (func) => async (req,res,next) => {
// try {
//     await func(res,res,next)
// } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,
//         message: err.message
//     })
// }
// }