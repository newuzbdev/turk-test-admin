import { lazy } from "react";

export const Reading = lazy(() => import('../pages/reading/reading'))
export const Listening = lazy(() => import('../pages/listening/listening'))
export const Login = lazy(() => import('../pages/auth/login'))
export const IELTS = lazy(() => import('../pages/ielts/ielts'))
export const Test = lazy(() => import('../pages/test/test'))
export const Writing = lazy(() => import('../pages/writing/writing'))