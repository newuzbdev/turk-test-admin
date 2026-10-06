import { lazy } from "react";
export const OfficialExams = lazy(() => import("../pages/official-exams/official-exams"));
export const Login = lazy(() => import("../pages/auth/login"));
export const IELTS = lazy(() => import("../pages/ielts/ielts"));
export const Banner = lazy(() => import("../pages/banner/banner"));
export const Product = lazy(() => import("../pages/product/product"));
export const TestCoinPrice = lazy(() => import("../pages/test-coin-price/test-coin-price"));
export const UserCoin = lazy(() => import("../pages/user-coin/user-coin"));
export const Subscriptions = lazy(() => import("../pages/subscriptions/subscriptions"));
export const AiCosts = lazy(() => import("../pages/ai-costs/ai-costs"));
export const SystemServices = lazy(() => import("../pages/system-services/system-services"));
export const UpdateAdmin = lazy(() => import("../pages/profile/update-admin"));
export const ReadingPractice = lazy(
  () => import("../pages/reading-practice/reading-practice")
);
export const LearnCourseList = lazy(
  () => import("../pages/learn/learn-course-list")
);
export const WorkbookList = lazy(() => import("../pages/learn/workbook/workbook-list"));
export const WorkbookEditor = lazy(() => import("../pages/learn/workbook/workbook-editor-page"));
export const LearnCourseForm = lazy(
  () => import("../pages/learn/learn-course-form")
);
export const LearnSkillTagList = lazy(
  () => import("../pages/learn/learn-skill-tag-list")
);

export const Students=lazy(()=>import("../pages/students/students"));
export const StudentDetail=lazy(()=>import("../pages/students/student-detail"));
