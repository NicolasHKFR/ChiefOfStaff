import { Button, Card, Group, Modal, Select, Table, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useDepartments, useTeams, useCreateTeam } from "../api/hooks";

export default function Teams() {
  const { data: teams, isLoading } = useTeams();
  const { data: departments } = useDepartments();
  const createTeam = useCreateTeam();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({ initialValues: { department_id: "", name: "" } });

  const handleSubmit = async (values: typeof form.values) => {
    await createTeam.mutateAsync({ ...values, department_id: Number(values.department_id) } as any);
    form.reset();
    close();
  };

  const deptMap = Object.fromEntries((departments || []).map((d) => [d.id, d.name]));

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Teams</Title>
        <Button onClick={open}>Add Team</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Department</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {teams?.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>{deptMap[t.department_id] || "—"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Team">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <Select
            label="Department"
            data={(departments || []).map((d) => ({ value: String(d.id), label: d.name }))}
            {...form.getInputProps("department_id")}
            mb="sm"
          />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
