import { Badge, Button, Card, Group, Modal, Table, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useSkills, useCreateSkill } from "../api/hooks";

export default function Skills() {
  const { data: skills, isLoading } = useSkills();
  const createSkill = useCreateSkill();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({ initialValues: { name: "", category: "" } });

  const handleSubmit = async (values: typeof form.values) => {
    await createSkill.mutateAsync(values);
    form.reset();
    close();
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Skills</Title>
        <Button onClick={open}>Add Skill</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Category</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {skills?.map((s) => (
            <Table.Tr key={s.id}>
              <Table.Td>{s.name}</Table.Td>
              <Table.Td><Badge variant="light">{s.category || "Uncategorized"}</Badge></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Skill">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <TextInput label="Category" {...form.getInputProps("category")} mb="sm" />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
