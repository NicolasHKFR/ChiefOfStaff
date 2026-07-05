import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import Documents from "./pages/Documents";
import OrgChartPage from "./pages/OrgChartPage";
import Positions from "./pages/Positions";
import Presence from "./pages/Presence";
import Settings from "./pages/Settings";
import Skills from "./pages/Skills";
import Teams from "./pages/Teams";
import WorkerProfile from "./pages/WorkerProfile";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/workers/:id" element={<WorkerProfile />} />
        <Route path="/org-chart" element={<OrgChartPage />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/presence" element={<Presence />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
