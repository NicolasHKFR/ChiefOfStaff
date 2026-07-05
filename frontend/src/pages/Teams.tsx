import { useState } from "react";
import {
  ActionIcon, Box, Button, Card, Group, Modal, Select, Table, Text, TextInput, Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTeams, useCreateTeam, useUpdateTeam, useWorkers } from "../api/hooks";
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

function TeamRow({ node, depth, workerMap, onEdit }: {
  node: TreeNode;
  depth: number;
  workerMap: Record<number, string>;
  onEdit: (t: Team) => void;
}) {
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
          <ActionIcon variant="subtle" onClick={() => onEdit(node)}>
            <Text fw={700}>✎</Text>
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
      {node.children.map((child) => (
        <TeamRow key={child.id} node={child} depth={depth + 1} workerMap={workerMap} onEdit={onEdit} />
      ))}
    </>
  );
}

export default function Teams() {
  const { data: teams, isLoading } = useTeams();
  const { data: workers } = useWorkers();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const [opened, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);

  const workerMap = Object.fromEntries(
    (workers || []).map((w) => [w.id, `${w.first_name} ${w.last_name}`])
  );

  const form = useForm({
    initialValues: { name: "", manager_id: null as number | null, parent_team_id: null as number | null },
  });

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

  const tree = teams ? buildTree(teams) : [];

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
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tree.map((node) => (
            <TeamRow key={node.id} node={node} depth={0} workerMap={workerMap} onEdit={openEdit} />
          ))}
          {!isLoading && tree.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={3}>
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
            data={(teams || []).filter((t) => t.id !== editTarget?.id).map((t) => ({ value: String(t.id), label: t.name }))}
            value={form.values.parent_team_id !== null ? String(form.values.parent_team_id) : null}
            onChange={(v) => form.setFieldValue("parent_team_id", v ? Number(v) : null)}
            mb="sm"
          />
          <Button type="submit">{editTarget ? "Save" : "Create"}</Button>
        </form>
      </Modal>
    </div>
  );
}
