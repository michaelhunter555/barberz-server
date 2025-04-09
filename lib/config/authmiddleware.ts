import { getSession } from "@auth/express";
import { NextFunction, Request, Response  } from "express";
import  { authConfig } from "./auth.config"

export async function authenticatedUser (
    req: Request,
    res: Response,
    next: NextFunction
) {
    const session = res.locals.session ?? (await getSession(req, authConfig));
    if(!session?.user) {
        res.redirect("/login")
    } else {
        next();
    }
}

export async function currentSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const session = (await getSession(req, authConfig)) ?? undefined
    res.locals.session = session
    return next()
  }