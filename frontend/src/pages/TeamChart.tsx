import { Alert, LoadingOverlay, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useOrgChart } from "../api/hooks";
import TeamChart from "../components/TeamChart";

export default function TeamChartPage() {
  const { data, isLoading, error } = useOrgChart();
  const navigate = useNavigate();

  if (isLoading) return <LoadingOverlay visible />;
  if (error) return <Alert color="red">Failed to load team chart</Alert>;
  if (!data || data.length === 0) return <Alert color="yellow">No data — seed the database first</Alert>;

  const roots = data[0]?.children ?? [];

  if (roots.length === 0) return <Alert color="yellow">No teams found</Alert>;

  return (
    <div>
      <Title order={2} mb="md">Team Hierarchy</Title>
      <TeamChart
        data={roots}
        onTeamClick={(id) => navigate(`/teams?id=${id}`)}
        onWorkerClick={(id) => navigate(`/workers/${id}`)}
      />
    </div>
  );
}
