import { useState } from "react";
import {
  Accordion, Badge, Button, Card, Group, Modal, Table, Text, TextInput, Textarea, Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  useCreateQualityCheck,
  useDeleteQualityCheck,
  useQualityCheck,
  useQualityChecks,
  useUploadQCFile,
} from "../api/hooks";
import type { QualityCheck } from "../types";

function statusColor(status: string) {
  switch (status) {
    case "completed": return "green";
    case "in_progress": return "blue";
    default: return "gray";
  }
}

export default function QualityChecks() {
  const { data: qcs, isLoading } = useQualityChecks();
  const createQC = useCreateQualityCheck();
  const deleteQC = useDeleteQualityCheck();
  const uploadFile = useUploadQCFile();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedQcId, setSelectedQcId] = useState<number | null>(null);
  const { data: qcDetail } = useQualityCheck(selectedQcId ?? 0);

  const form = useForm({
    initialValues: { name: "", description: "" },
  });

  const handleCreate = async (values: typeof form.values) => {
    try {
      await createQC.mutateAsync(values);
      form.reset();
      close();
      notifications.show({ title: "Created", message: "Quality check created", color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to create quality check", color: "red" });
    }
  };

  const handleUpload = async (qcId: number, file: File | null) => {
    if (!file) return;
    try {
      await uploadFile.mutateAsync({ qcId, file });
      notifications.show({ title: "Uploaded", message: `File "${file.name}" uploaded`, color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to upload file", color: "red" });
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Quality Checks</Title>
        <Button onClick={open}>New Quality Check</Button>
      </Group>

      <Modal opened={opened} onClose={close} title="New Quality Check">
        <form onSubmit={form.onSubmit(handleCreate)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <Textarea label="Description" {...form.getInputProps("description")} mb="sm" />
          <Button type="submit" loading={createQC.isPending}>Create</Button>
        </form>
      </Modal>

      {isLoading && <Text c="dimmed">Loading...</Text>}

      {qcs && qcs.length === 0 && (
        <Card withBorder>
          <Text c="dimmed" ta="center">No quality checks yet. Create one to start.</Text>
        </Card>
      )}

      {qcs && qcs.length > 0 && (
        <Accordion onChange={(value) => setSelectedQcId(value ? Number(value) : null)}>
          {qcs.map((qc: QualityCheck) => (
            <Accordion.Item key={qc.id} value={String(qc.id)}>
              <Accordion.Control>
                <Group justify="space-between">
                  <Text fw={500}>{qc.name}</Text>
                  <Group gap={8}>
                    <Badge color={statusColor(qc.status)} size="sm">{qc.status}</Badge>
                    <Text size="xs" c="dimmed">
                      {qc.created_at ? new Date(qc.created_at).toLocaleDateString() : ""}
                    </Text>
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                {qc.description && <Text size="sm" mb="sm" c="dimmed">{qc.description}</Text>}

                <Group mb="sm">
                  <Button
                    size="xs"
                    component="label"
                  >
                    Upload Excel File
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      hidden
                      onChange={(e) => {
                        handleUpload(qc.id, e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="outline"
                    onClick={async () => {
                      await deleteQC.mutateAsync(qc.id);
                      notifications.show({ title: "Deleted", message: "Quality check removed", color: "orange" });
                    }}
                  >
                    Delete
                  </Button>
                </Group>

                {selectedQcId === qc.id && qcDetail && (
                  <>
                    {qcDetail.files.length > 0 && (
                      <>
                        <Title order={6} mb="xs">Uploaded Files</Title>
                        <Table striped highlightOnHover withTableBorder mb="md">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>File</Table.Th>
                              <Table.Th>Rows</Table.Th>
                              <Table.Th>Uploaded</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {qcDetail.files.map((f) => (
                              <Table.Tr key={f.id}>
                                <Table.Td>{f.original_filename}</Table.Td>
                                <Table.Td>{f.row_count ?? "—"}</Table.Td>
                                <Table.Td>{f.uploaded_at ? new Date(f.uploaded_at).toLocaleString() : "—"}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </>
                    )}

                    {qcDetail.checks.length > 0 && (
                      <>
                        <Title order={6} mb="xs">Check Results</Title>
                        <Table striped highlightOnHover withTableBorder>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Check</Table.Th>
                              <Table.Th>Result</Table.Th>
                              <Table.Th>Summary</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {qcDetail.checks.map((c) => (
                              <Table.Tr key={c.id}>
                                <Table.Td>{c.check_type}</Table.Td>
                                <Table.Td>
                                  <Badge color={c.status === "pass" ? "green" : c.status === "fail" ? "red" : "yellow"}>
                                    {c.status}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>{c.summary ?? "—"}</Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </>
                    )}

                    {qcDetail.files.length === 0 && qcDetail.checks.length === 0 && (
                      <Text size="sm" c="dimmed">No files uploaded yet. Upload an Excel file to begin.</Text>
                    )}
                  </>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
}
