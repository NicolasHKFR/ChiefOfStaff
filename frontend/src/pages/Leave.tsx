import { Badge, Button, Card, Group, Modal, Select, Table, Textarea, TextInput, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useLeaveRequests, useLeaveTypes, useCreateLeaveRequest, useUpdateLeaveStatus, useWorkers } from "../api/hooks";

const statusColors: Record<string, string> = { Pending: "yellow", Approved: "green", Rejected: "red" };

export default function Leave() {
  const { data: requests, isLoading } = useLeaveRequests();
  const { data: leaveTypes } = useLeaveTypes();
  const { data: workers } = useWorkers();
  const createLeave = useCreateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: { worker_id: "", leave_type_id: "", start_date: null as Date | null, end_date: null as Date | null, comment: "" },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await createLeave.mutateAsync({
      worker_id: Number(values.worker_id),
      leave_type_id: Number(values.leave_type_id),
      start_date: values.start_date?.toISOString().split("T")[0],
      end_date: values.end_date?.toISOString().split("T")[0],
      comment: values.comment || undefined,
    } as any);
    form.reset();
    close();
  };

  const typeMap = Object.fromEntries((leaveTypes || []).map((t) => [t.id, t.name]));
  const workerMap = Object.fromEntries((workers || []).map((w) => [w.id, `${w.first_name} ${w.last_name}`]));

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Leave Requests</Title>
        <Button onClick={open}>New Request</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Worker</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Start</Table.Th>
            <Table.Th>End</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {requests?.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>{workerMap[r.worker_id] || `#${r.worker_id}`}</Table.Td>
              <Table.Td>{typeMap[r.leave_type_id] || `#${r.leave_type_id}`}</Table.Td>
              <Table.Td>{r.start_date}</Table.Td>
              <Table.Td>{r.end_date}</Table.Td>
              <Table.Td>
                <Badge color={statusColors[r.status]}>{r.status}</Badge>
              </Table.Td>
              <Table.Td>
                {r.status === "Pending" && (
                  <Group gap="xs">
                    <Button size="xs" color="green" onClick={() => updateStatus.mutate({ id: r.id, status: "Approved", approver_id: 1 })}>
                      Approve
                    </Button>
                    <Button size="xs" color="red" onClick={() => updateStatus.mutate({ id: r.id, status: "Rejected", approver_id: 1 })}>
                      Reject
                    </Button>
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="New Leave Request">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Select
            label="Worker"
            data={(workers || []).map((w) => ({ value: String(w.id), label: `${w.first_name} ${w.last_name}` }))}
            {...form.getInputProps("worker_id")}
            mb="sm"
          />
          <Select
            label="Leave Type"
            data={(leaveTypes || []).map((t) => ({ value: String(t.id), label: t.name }))}
            {...form.getInputProps("leave_type_id")}
            mb="sm"
          />
          <DatePickerInput label="Start Date" {...form.getInputProps("start_date")} mb="sm" />
          <DatePickerInput label="End Date" {...form.getInputProps("end_date")} mb="sm" />
          <Textarea label="Comment" {...form.getInputProps("comment")} mb="sm" />
          <Button type="submit">Submit</Button>
        </form>
      </Modal>
    </div>
  );
}
