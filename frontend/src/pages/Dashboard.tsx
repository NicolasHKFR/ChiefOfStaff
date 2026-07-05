import { Card, Group, RingProgress, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { useHeadcountReport, useTeams, useWorkers } from "../api/hooks";

export default function Dashboard() {
  const { data: workers } = useWorkers();
  const { data: headcount } = useHeadcountReport();
  const { data: teams } = useTeams();

  const teamMap = Object.fromEntries((teams || []).map((t) => [t.id, t.name]));

  const activeWorkers = workers?.filter((w) => w.status === "Active") || [];
  const employeeCount = activeWorkers.filter((w) => w.type === "Employee").length;
  const contractorCount = activeWorkers.filter((w) => w.type === "Contractor").length;
  const total = activeWorkers.length;

  return (
    <div>
      <Title order={2} mb="md">Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Total Active</Text>
          <Text fw={700} size="xl">{headcount?.total ?? total}</Text>
        </Card>
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Employees</Text>
          <Text fw={700} size="xl" c="blue">{employeeCount}</Text>
        </Card>
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Contractors</Text>
          <Text fw={700} size="xl" c="orange">{contractorCount}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Card withBorder>
          <Title order={4} mb="sm">Headcount Distribution</Title>
          {total > 0 && (
            <Group justify="center">
              <RingProgress
                size={180}
                thickness={20}
                sections={[
                  { value: (employeeCount / total) * 100, color: "blue" },
                  { value: (contractorCount / total) * 100, color: "orange" },
                ]}
              />
            </Group>
          )}
        </Card>

        <Card withBorder>
          <Title order={4} mb="sm">Headcount by Team</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team</Table.Th>
                <Table.Th>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(headcount?.by_team || []).map((s: any, i: number) => (
                <Table.Tr key={i}>
                  <Table.Td>{teamMap[s.team_id] || "Unassigned"}</Table.Td>
                  <Table.Td>{s.count}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>
    </div>
  );
}
