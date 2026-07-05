import { Badge, Card, Group, Table, Text, TextInput, Title } from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkers } from "../api/hooks";

const statusColors: Record<string, string> = {
  Active: "green",
  "On Leave": "yellow",
  Terminated: "red",
};

export default function Directory() {
  const [params] = useSearchParams();
  const q = params.get("q") || undefined;
  const { data: workers, isLoading } = useWorkers({ q });
  const navigate = useNavigate();

  return (
    <div>
      <Title order={2} mb="md">Employee Directory</Title>
      <Card withBorder mb="md">
        <Group>
          <TextInput
            placeholder="Search by name, email, or title..."
            defaultValue={q || ""}
            onChange={(e) => {
              const val = e.currentTarget.value;
              navigate(val ? `/?q=${encodeURIComponent(val)}` : "/", { replace: true });
            }}
            style={{ flex: 1 }}
          />
        </Group>
      </Card>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Job Title</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed">Loading...</Text>
              </Table.Td>
            </Table.Tr>
          )}
          {workers?.map((w) => (
            <Table.Tr
              key={w.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/workers/${w.id}`)}
            >
              <Table.Td>
                <Text fw={500}>{w.first_name} {w.last_name}</Text>
              </Table.Td>
              <Table.Td>{w.job_title || "—"}</Table.Td>
              <Table.Td>{w.email || "—"}</Table.Td>
              <Table.Td>{w.type}</Table.Td>
              <Table.Td>
                <Badge color={statusColors[w.status] || "gray"}>{w.status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
          {workers?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center">No workers found</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
