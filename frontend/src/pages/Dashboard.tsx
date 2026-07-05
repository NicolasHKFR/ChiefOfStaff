import { useMemo, useState } from "react";
import {
  Badge, Card, Group, RingProgress, Select, SimpleGrid, Table, Text, Title,
} from "@mantine/core";
import { useTeams, useWorkers, useLocations, useWorkerTypes } from "../api/hooks";
import dayjs from "dayjs";

export default function Dashboard() {
  const { data: workers = [] } = useWorkers();
  const { data: teams = [] } = useTeams();
  const { data: locations = [] } = useLocations();
  const { data: workerTypes = [] } = useWorkerTypes();

  const [filters, setFilters] = useState<Record<string, string | null>>({
    team_id: null,
    type: null,
    status: null,
    country: null,
  });

  const locationCountryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const loc of locations) {
      if (loc.name && loc.country) m.set(loc.name, loc.country);
    }
    return m;
  }, [locations]);

  const allCountries = useMemo(() => {
    const s = new Set<string>();
    for (const loc of locations) {
      if (loc.country) s.add(loc.country);
    }
    for (const w of workers) {
      if (w.office_location) {
        const c = locationCountryMap.get(w.office_location);
        if (c) s.add(c);
      }
    }
    return [...s].sort();
  }, [locations, workers, locationCountryMap]);

  const filteredWorkers = useMemo(() => {
    let list = workers;
    if (filters.team_id) {
      list = list.filter((w) => String(w.team_id) === filters.team_id);
    }
    if (filters.type) {
      list = list.filter((w) => w.type === filters.type);
    }
    if (filters.status) {
      list = list.filter((w) => w.status === filters.status);
    }
    if (filters.country) {
      list = list.filter((w) => {
        if (!w.office_location) return false;
        const c = locationCountryMap.get(w.office_location);
        return c === filters.country;
      });
    }
    return list;
  }, [workers, filters, locationCountryMap]);

  const teamMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of teams) m.set(t.id, t.name);
    return m;
  }, [teams]);

  const statusCounts = useMemo(() => {
    let active = 0, onLeave = 0, terminated = 0;
    for (const w of filteredWorkers) {
      if (w.status === "Active") active++;
      else if (w.status === "On Leave") onLeave++;
      else if (w.status === "Terminated") terminated++;
    }
    return { active, onLeave, terminated };
  }, [filteredWorkers]);

  const teamCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of filteredWorkers) {
      const name = (w.team_id != null && teamMap.get(w.team_id)) || "Unassigned";
      m.set(name, (m.get(name) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredWorkers, teamMap]);

  const countryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of filteredWorkers) {
      if (!w.office_location) continue;
      const c = locationCountryMap.get(w.office_location) || w.office_location;
      m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredWorkers, locationCountryMap]);

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of filteredWorkers) {
      m.set(w.type, (m.get(w.type) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredWorkers]);

  const contractAlerts = useMemo(() => {
    const today = dayjs();
    const in30 = today.add(30, "day");
    const rows: { name: string; type: string; date: string; kind: "expired" | "ending" | "onleave" }[] = [];
    for (const w of filteredWorkers) {
      if (w.status === "On Leave") {
        rows.push({ name: `${w.first_name} ${w.last_name}`, type: w.type, date: "", kind: "onleave" });
      }
      if (w.end_date) {
        const end = dayjs(w.end_date);
        if (end.isBefore(today)) {
          rows.push({ name: `${w.first_name} ${w.last_name}`, type: w.type, date: w.end_date, kind: "expired" });
        } else if (end.isBefore(in30)) {
          rows.push({ name: `${w.first_name} ${w.last_name}`, type: w.type, date: w.end_date, kind: "ending" });
        }
      }
    }
    return rows;
  }, [filteredWorkers]);

  const filteredTotal = filteredWorkers.length;
  const total = workers.length;
  const { active, onLeave, terminated } = statusCounts;

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed" size="sm">{filteredTotal} of {total} workers</Text>
      </Group>

      <Card withBorder mb="md" p="sm">
        <Group grow>
          <Select
            label="Team"
            clearable
            searchable
            placeholder="All teams"
            data={teams.filter((t) => t.name !== "Root").map((t) => ({ value: String(t.id), label: t.name }))}
            value={filters.team_id}
            onChange={(v) => setFilters((f) => ({ ...f, team_id: v }))}
          />
          <Select
            label="Type"
            clearable
            searchable
            placeholder="All types"
            data={workerTypes.map((t) => ({ value: t.name, label: t.name }))}
            value={filters.type}
            onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
          />
          <Select
            label="Status"
            clearable
            placeholder="All statuses"
            data={["Active", "On Leave", "Terminated"]}
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
          <Select
            label="Country"
            clearable
            searchable
            placeholder="All countries"
            data={allCountries}
            value={filters.country}
            onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
          />
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Total</Text>
          <Text fw={700} size="xl">{filteredTotal}</Text>
        </Card>
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Active</Text>
          <Text fw={700} size="xl" c="green">{active}</Text>
        </Card>
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">On Leave</Text>
          <Text fw={700} size="xl" c="yellow">{onLeave}</Text>
        </Card>
        <Card withBorder ta="center">
          <Text c="dimmed" size="sm">Terminated</Text>
          <Text fw={700} size="xl" c="red">{terminated}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <Card withBorder>
          <Title order={4} mb="sm">Status Distribution</Title>
          {filteredTotal > 0 ? (
            <Group justify="center">
              <RingProgress
                size={180}
                thickness={20}
                sections={[
                  ...(active > 0 ? [{ value: (active / filteredTotal) * 100, color: "green" as const }] : []),
                  ...(onLeave > 0 ? [{ value: (onLeave / filteredTotal) * 100, color: "yellow" as const }] : []),
                  ...(terminated > 0 ? [{ value: (terminated / filteredTotal) * 100, color: "red" as const }] : []),
                ]}
              />
            </Group>
          ) : (
            <Text c="dimmed" ta="center" py="xl">No workers match filters</Text>
          )}
        </Card>

        <Card withBorder>
          <Title order={4} mb="sm">Headcount by Team</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Team</Table.Th>
                <Table.Th ta="right">Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teamCounts.map(([name, count]) => (
                <Table.Tr key={name}>
                  <Table.Td fw={500}>{name}</Table.Td>
                  <Table.Td ta="right">{count}</Table.Td>
                </Table.Tr>
              ))}
              {teamCounts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={2}><Text c="dimmed" ta="center">No data</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <Card withBorder>
          <Title order={4} mb="sm">Headcount by Country</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countryCounts.map(([country, count]) => (
                <Table.Tr key={country}>
                  <Table.Td fw={500}>{country}</Table.Td>
                  <Table.Td ta="right">{count}</Table.Td>
                </Table.Tr>
              ))}
              {countryCounts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={2}><Text c="dimmed" ta="center">No data</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Card withBorder>
          <Title order={4} mb="sm">Contract Alerts</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Worker</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Alert</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {contractAlerts.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td fw={500}>{r.name}</Table.Td>
                  <Table.Td>{r.type}</Table.Td>
                  <Table.Td>{r.date || "—"}</Table.Td>
                  <Table.Td>
                    {r.kind === "expired" && <Badge color="red">Expired</Badge>}
                    {r.kind === "ending" && <Badge color="yellow">Ending soon</Badge>}
                    {r.kind === "onleave" && <Badge color="gray">On Leave</Badge>}
                  </Table.Td>
                </Table.Tr>
              ))}
              {contractAlerts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed" ta="center">All clear — no alerts</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      <Card withBorder>
        <Title order={4} mb="sm">Headcount by Type</Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th ta="right">Count</Table.Th>
              <Table.Th ta="right">%</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {typeCounts.map(([type, count]) => (
              <Table.Tr key={type}>
                <Table.Td fw={500}>{type}</Table.Td>
                <Table.Td ta="right">{count}</Table.Td>
                <Table.Td ta="right">{filteredTotal > 0 ? ((count / filteredTotal) * 100).toFixed(0) : 0}%</Table.Td>
              </Table.Tr>
            ))}
            {typeCounts.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3}><Text c="dimmed" ta="center">No data</Text></Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </div>
  );
}
