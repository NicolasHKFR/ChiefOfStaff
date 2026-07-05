import { Badge, Button, Card, Group, Modal, SimpleGrid, Table, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { usePositions, useCreatePosition } from "../api/hooks";

const statusColors: Record<string, string> = { Filled: "green", Vacant: "orange", Planned: "blue" };

export default function Positions() {
  const { data: positions, isLoading } = usePositions();
  const createPos = useCreatePosition();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: { job_title: "", employment_type: "", status: "Vacant" },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await createPos.mutateAsync(values as any);
    form.reset();
    close();
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Positions</Title>
        <Button onClick={open}>Add Position</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Job Title</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {positions?.map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>{p.job_title}</Table.Td>
              <Table.Td>{p.employment_type || "—"}</Table.Td>
              <Table.Td>
                <Badge color={statusColors[p.status] || "gray"}>{p.status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Position">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Job Title" required {...form.getInputProps("job_title")} mb="sm" />
          <TextInput label="Employment Type" {...form.getInputProps("employment_type")} mb="sm" />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
