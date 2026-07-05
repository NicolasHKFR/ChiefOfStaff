import {
  Alert,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeleteWorker, useUpdateWorker, useWorker } from "../api/hooks";

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const workerId = Number(id);
  const { data: worker, isLoading } = useWorker(workerId);
  const updateWorker = useUpdateWorker();
  const navigate = useNavigate();
  const deleteWorker = useDeleteWorker();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const form = useForm({
    initialValues: {
      first_name: "", last_name: "", email: "", phone: "",
      type: "Employee",
      status: "Active", office_location: "",
    },
  });

  useEffect(() => {
    if (worker) form.setValues(worker as any);
  }, [worker]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await updateWorker.mutateAsync({ id: workerId, data: values as any });
      notifications.show({ title: "Saved", message: "Profile updated", color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to save", color: "red" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorker.mutateAsync(workerId);
      notifications.show({ title: "Deleted", message: "Worker removed", color: "orange" });
      navigate("/");
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (!worker) return <Alert color="red">Worker not found</Alert>;

  return (
    <div style={{ position: "relative", maxWidth: 800 }}>
      <Title order={2} mb="md">{worker.first_name} {worker.last_name}</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Card withBorder mb="md">
          <Title order={4} mb="sm">Personal Info</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="First Name" {...form.getInputProps("first_name")} />
            <TextInput label="Last Name" {...form.getInputProps("last_name")} />
            <TextInput label="Email" {...form.getInputProps("email")} />
            <TextInput label="Phone" {...form.getInputProps("phone")} />
          </SimpleGrid>
        </Card>

        <Card withBorder mb="md">
          <Title order={4} mb="sm">Details</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select label="Type" data={["Employee", "Contractor"]} {...form.getInputProps("type")} />
            <Select label="Status" data={["Active", "On Leave", "Terminated"]} {...form.getInputProps("status")} />
            <TextInput label="Office Location" {...form.getInputProps("office_location")} />
          </SimpleGrid>
        </Card>

        <Group>
          <Button type="submit" loading={updateWorker.isPending}>Save</Button>
          <Button variant="light" onClick={() => navigate("/")}>Back</Button>
          <Button color="red" variant="outline" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
        </Group>
      </form>

      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion" centered>
        <Text mb="lg">Remove {worker.first_name} {worker.last_name} from the system?</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button color="red" loading={deleteWorker.isPending} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </div>
  );
}
