import { Button, Card, Group, Modal, Table, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useDepartments, useCreateDepartment } from "../api/hooks";

export default function Departments() {
  const { data: departments, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({ initialValues: { organization_id: 1, name: "", cost_center_id: "" } });

  const handleSubmit = async (values: typeof form.values) => {
    await createDept.mutateAsync(values);
    form.reset();
    close();
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Departments</Title>
        <Button onClick={open}>Add Department</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Cost Center</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {departments?.map((d) => (
            <Table.Tr key={d.id}>
              <Table.Td>{d.name}</Table.Td>
              <Table.Td>{d.cost_center_id || "—"}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Department">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <TextInput label="Cost Center ID" {...form.getInputProps("cost_center_id")} mb="sm" />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
