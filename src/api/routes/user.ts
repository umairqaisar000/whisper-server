import { Router } from "express"
import loginUser from "../controllers/auth/login"


const router = Router()

router.post("/api/auth/login", loginUser)

export default router
