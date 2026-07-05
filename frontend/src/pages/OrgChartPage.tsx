import { Alert, LoadingOverlay, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useOrgChart } from "../api/hooks";
import OrgChart from "../components/OrgChart";

export default function OrgChartPage() {
  const { data, isLoading, error } = useOrgChart();
  const navigate = useNavigate();

  if (isLoading) return <LoadingOverlay visible />;
  if (error) return <Alert color="red">Failed to load org chart</Alert>;
  if (!data) return <Alert color="yellow">No data — seed the database first</Alert>;

  return (
    <div>
      <Title order={2} mb="md">Organization Chart</Title>
      <OrgChart data={data} onNodeClick={(id) => navigate(`/workers/${id}`)} />
    </div>
  );
}
