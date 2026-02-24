import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Students } from "./pages/Students";
import { AuditLogs } from "./pages/AuditLogs";
import { RecycleBin } from "./pages/RecycleBin";
import { UserManagement } from "./pages/UserManagement";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "students", Component: Students },
      { path: "audit", Component: AuditLogs },
      { path: "recycle-bin", Component: RecycleBin },
      { path: "users", Component: UserManagement },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);