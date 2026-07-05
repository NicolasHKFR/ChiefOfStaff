import { ActionIcon, Badge, Button, Card, Group, Modal, Select, Table, Text, TextInput, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateWorker, useDeleteWorker, useLocations, useTeams, useWorkerTypes, useWorkers } from "../api/hooks";

const statusColors: Record<string, string> = {
  Active: "green",
  "On Leave": "yellow",
  Terminated: "red",
};

export default function Directory() {
  const [params] = useSearchParams();
  const q = params.get("q") || undefined;
  const { data: workers, isLoading } = useWorkers({ q });
  const { data: teams } = useTeams();
  const { data: locations } = useLocations();
  const { data: workerTypes } = useWorkerTypes();
  const navigate = useNavigate();
  const deleteWorker = useDeleteWorker();
  const createWorker = useCreateWorker();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const createForm = useForm({
    initialValues: {
      first_name: "", last_name: "",
      type: "Employee", status: "Active", office_location: "",
      start_date: null as string | null,
      end_date: null as string | null,
      team_id: null as number | null,
    },
  });

  const handleCreate = async (values: typeof createForm.values) => {
    try {
      const clean = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])
      ) as any;
      await createWorker.mutateAsync(clean);
      notifications.show({ title: "Created", message: "Employee added", color: "green" });
      createForm.reset();
      setCreateOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Unknown error";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorker.mutateAsync(deleteTarget.id);
      notifications.show({ title: "Deleted", message: "Worker removed", color: "orange" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Employee Directory</Title>
        <Button onClick={() => setCreateOpen(true)}>Add Employee</Button>
      </Group>
      <Card withBorder mb="md">
        <Group>
          <TextInput
            placeholder="Search by name..."
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
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
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
              <Table.Td>{w.type}</Table.Td>
              <Table.Td>
                <Badge color={statusColors[w.status] || "gray"}>{w.status}</Badge>
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: w.id, name: `${w.first_name} ${w.last_name}` });
                  }}
                >
                  <Text component="span" fw={700}>×</Text>
                </ActionIcon>
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

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion" centered>
        <Text mb="lg">Remove {deleteTarget?.name} from the system?</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" loading={deleteWorker.isPending} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Add Employee">
        <form onSubmit={createForm.onSubmit(handleCreate)}>
          <TextInput label="First Name" required {...createForm.getInputProps("first_name")} mb="sm" />
          <TextInput label="Last Name" required {...createForm.getInputProps("last_name")} mb="sm" />
          <Select
            label="Type"
            data={(workerTypes || []).map((t) => ({ value: t.name, label: t.name }))}
            {...createForm.getInputProps("type")}
            mb="sm"
          />
          <Select
            label="Team"
            clearable
            searchable
            data={(teams || []).filter((t) => t.name !== "Root").map((t) => ({ value: String(t.id), label: t.name }))}
            value={createForm.values.team_id !== null ? String(createForm.values.team_id) : null}
            onChange={(v) => createForm.setFieldValue("team_id", v ? Number(v) : null)}
            mb="sm"
          />
          <Select label="Status" data={["Active", "On Leave"]} {...createForm.getInputProps("status")} mb="sm" />
          <DatePickerInput
            label="Start Date"
            clearable
            value={createForm.values.start_date ? dayjs(createForm.values.start_date).toDate() : null}
            onChange={(v) => createForm.setFieldValue("start_date", v ? dayjs(v).format("YYYY-MM-DD") : null)}
            mb="sm"
          />
          <DatePickerInput
            label="End Date"
            clearable
            value={createForm.values.end_date ? dayjs(createForm.values.end_date).toDate() : null}
            onChange={(v) => createForm.setFieldValue("end_date", v ? dayjs(v).format("YYYY-MM-DD") : null)}
            mb="sm"
          />
          <Select
            label="Office Location"
            clearable
            searchable
            data={(locations || []).map((l) => ({ value: l.name, label: l.name }))}
            {...createForm.getInputProps("office_location")}
            mb="lg"
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createWorker.isPending}>Create</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
