import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Directory from "./pages/Directory";
import Documents from "./pages/Documents";
import OrgChartPage from "./pages/OrgChartPage";
import Presence from "./pages/Presence";
import QualityChecks from "./pages/QualityChecks";
import Settings from "./pages/Settings";
import Skills from "./pages/Skills";
import Teams from "./pages/Teams";
import WorkerProfile from "./pages/WorkerProfile";
import MapWorld from "./pages/MapWorld";
import TeamChartPage from "./pages/TeamChart";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/workers/:id" element={<WorkerProfile />} />
        <Route path="/org-chart" element={<OrgChartPage />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/team-chart" element={<TeamChartPage />} />
        <Route path="/presence" element={<Presence />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/quality-checks" element={<QualityChecks />} />
        <Route path="/map-world" element={<MapWorld />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
