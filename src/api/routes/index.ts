import { Request, RequestHandler, Response, Router } from "express"
import PingController from "../controllers/ping"
import UserRouter from "./user"

const router = Router()

router.get("/ping/:message", (async (_req: Request, res: Response) => {
    const controller = new PingController()
    const response = await controller.getMessage(_req.params.message)
    return res.send(response)
}) as RequestHandler)

router.use("/user", UserRouter)
// router.use("/room", RoomRouter)
// router.use("/auth", AuthRouter)
// router.use("/invite", InviteRouter)
// router.use("/media", MediaRouter)
// router.use("/", RootRouter)

export default router
