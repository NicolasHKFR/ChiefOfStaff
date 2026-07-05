import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ActionIcon, Box, Button, Card, Group, Modal, Select, Table, Text, TextInput, Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam, useUpdateWorker, useWorkers } from "../api/hooks";
import type { Team } from "../types";

interface TreeNode extends Team {
  children: TreeNode[];
}

function buildTree(teams: Team[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  for (const t of teams) {
    map.set(t.id, { ...t, children: [] });
  }
  for (const t of teams) {
    const node = map.get(t.id);
    if (node && t.parent_team_id && map.has(t.parent_team_id)) {
      map.get(t.parent_team_id)!.children.push(node);
    } else if (node) {
      roots.push(node);
    }
  }
  return roots;
}

function TeamRow({ node, depth, workerMap, teamWorkers, onEdit, onDelete, onAddMember }: {
  node: TreeNode;
  depth: number;
  workerMap: Record<number, string>;
  teamWorkers: Record<number, { id: number; first_name: string; last_name: string }[]>;
  onEdit: (t: Team) => void;
  onDelete: (t: Team) => void;
  onAddMember: (t: Team) => void;
}) {
  const members = teamWorkers[node.id] || [];
  return (
    <>
      <Table.Tr>
        <Table.Td>
          <Box style={{ paddingLeft: depth * 24 }}>
            {depth > 0 && "↳ "}{node.name}
          </Box>
        </Table.Td>
        <Table.Td>{workerMap[node.manager_id ?? -1] || "—"}</Table.Td>
        <Table.Td>
          {members.length > 0
            ? members.map((m) => `${m.first_name} ${m.last_name}`).join(", ")
            : "—"}
        </Table.Td>
        <Table.Td>
          <Group gap={4}>
            <ActionIcon variant="subtle" onClick={() => onEdit(node)}>
              <Text fw={700}>✎</Text>
            </ActionIcon>
            <ActionIcon variant="subtle" color="blue" onClick={() => onAddMember(node)}>
              <Text fw={700}>+</Text>
            </ActionIcon>
            <ActionIcon color="red" variant="subtle" onClick={() => onDelete(node)}>
              <Text component="span" fw={700}>×</Text>
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
      {node.children.map((child) => (
        <TeamRow key={child.id} node={child} depth={depth + 1} workerMap={workerMap} teamWorkers={teamWorkers} onEdit={onEdit} onDelete={onDelete} onAddMember={onAddMember} />
      ))}
    </>
  );
}

export default function Teams() {
  const { data: teams, isLoading } = useTeams();
  const { data: workers } = useWorkers();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const [opened, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [addMemberTarget, setAddMemberTarget] = useState<Team | null>(null);
  const [addMemberWorkerId, setAddMemberWorkerId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const updateWorker = useUpdateWorker();

  const form = useForm({
    initialValues: { name: "", manager_id: null as number | null, parent_team_id: null as number | null },
  });

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && teams) {
      const team = teams.find((t) => t.id === Number(idParam));
      if (team) {
        form.setValues({ name: team.name, manager_id: team.manager_id ?? null, parent_team_id: team.parent_team_id ?? null });
        setEditTarget(team);
        open();
        setSearchParams({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, teams]);

  const workerMap = Object.fromEntries(
    (workers || []).map((w) => [w.id, `${w.first_name} ${w.last_name}`])
  );

  const teamWorkers: Record<number, { id: number; first_name: string; last_name: string }[]> = {};
  for (const w of workers || []) {
    if (w.team_id) {
      if (!teamWorkers[w.team_id]) teamWorkers[w.team_id] = [];
      teamWorkers[w.team_id].push({ id: w.id, first_name: w.first_name, last_name: w.last_name });
    }
  }

  const openCreate = () => {
    form.reset();
    setEditTarget(null);
    open();
  };

  const openEdit = (t: Team) => {
    form.setValues({ name: t.name, manager_id: t.manager_id ?? null, parent_team_id: t.parent_team_id ?? null });
    setEditTarget(t);
    open();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editTarget) {
        await updateTeam.mutateAsync({ id: editTarget.id, data: values as any });
        notifications.show({ title: "Updated", message: "Team updated", color: "green" });
      } else {
        await createTeam.mutateAsync(values as any);
        notifications.show({ title: "Created", message: "Team created", color: "green" });
      }
      form.reset();
      close();
    } catch {
      notifications.show({ title: "Error", message: "Failed to save team", color: "red" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeam.mutateAsync(deleteTarget.id);
      notifications.show({ title: "Deleted", message: "Team removed", color: "orange" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete team", color: "red" });
    }
    setDeleteTarget(null);
  };

  const handleAddMember = async () => {
    if (!addMemberTarget || !addMemberWorkerId) return;
    try {
      await updateWorker.mutateAsync({ id: Number(addMemberWorkerId), data: { team_id: addMemberTarget.id } });
      notifications.show({ title: "Added", message: "Member added to team", color: "green" });
      setAddMemberTarget(null);
      setAddMemberWorkerId(null);
    } catch {
      notifications.show({ title: "Error", message: "Failed to add member", color: "red" });
    }
  };

  const workersNotInTeam = (workers || []).filter(
    (w) => w.team_id !== addMemberTarget?.id && w.status !== "Terminated"
  );

  const teamsWithoutRoot = (teams || []).filter((t) => t.name !== "Root");
  const tree = buildTree(teamsWithoutRoot);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Teams</Title>
        <Button onClick={openCreate}>Add Team</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Manager</Table.Th>
            <Table.Th>Members</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tree.map((node) => (
            <TeamRow key={node.id} node={node} depth={0} workerMap={workerMap} teamWorkers={teamWorkers} onEdit={openEdit} onDelete={setDeleteTarget} onAddMember={setAddMemberTarget} />
          ))}
          {!isLoading && tree.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed" ta="center">No teams yet</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editTarget ? "Edit Team" : "Add Team"}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <Select
            label="Manager"
            clearable
            searchable
            data={(workers || []).map((w) => ({ value: String(w.id), label: `${w.first_name} ${w.last_name}` }))}
            value={form.values.manager_id !== null ? String(form.values.manager_id) : null}
            onChange={(v) => form.setFieldValue("manager_id", v ? Number(v) : null)}
            mb="sm"
          />
          <Select
            label="Parent Team"
            clearable
            data={(teamsWithoutRoot).filter((t) => t.id !== editTarget?.id).map((t) => ({ value: String(t.id), label: t.name }))}
            value={form.values.parent_team_id !== null ? String(form.values.parent_team_id) : null}
            onChange={(v) => form.setFieldValue("parent_team_id", v ? Number(v) : null)}
            mb="sm"
          />
          <Button type="submit">{editTarget ? "Save" : "Create"}</Button>
        </form>
      </Modal>

      <Modal opened={!!addMemberTarget} onClose={() => { setAddMemberTarget(null); setAddMemberWorkerId(null); }} title={`Add Member to ${addMemberTarget?.name}`}>
        <Select
          label="Worker"
          placeholder="Select a worker"
          searchable
          data={workersNotInTeam.map((w) => ({ value: String(w.id), label: `${w.first_name} ${w.last_name}` }))}
          value={addMemberWorkerId}
          onChange={setAddMemberWorkerId}
          mb="sm"
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={() => { setAddMemberTarget(null); setAddMemberWorkerId(null); }}>Cancel</Button>
          <Button onClick={handleAddMember} loading={updateWorker.isPending} disabled={!addMemberWorkerId}>Add</Button>
        </Group>
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion" centered>
        <Text mb="lg">
          Remove team "{deleteTarget?.name}"?
          {deleteTarget && (teamWorkers[deleteTarget.id]?.length ?? 0) > 0 && (
            <Text size="sm" c="red" mt="xs">
              {teamWorkers[deleteTarget.id].length} member(s) will be unassigned.
            </Text>
          )}
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" loading={deleteTeam.isPending} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </div>
  );
}
