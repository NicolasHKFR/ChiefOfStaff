import { Button, Card, Group, Modal, Select, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useDocuments, useUploadDocument, useWorkers } from "../api/hooks";

export default function Documents() {
  const [workerId, setWorkerId] = useState<number | undefined>(undefined);
  const { data: documents, isLoading } = useDocuments(workerId);
  const { data: workers } = useWorkers();
  const uploadDoc = useUploadDocument();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>("Contract");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !selectedWorker) return;
    await uploadDoc.mutateAsync({
      worker_id: Number(selectedWorker),
      category: category ?? "Other",
      file,
    });
    close();
    setFile(null);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Documents</Title>
        <Button onClick={open}>Upload Document</Button>
      </Group>

      <Select
        label="Filter by worker"
        placeholder="All workers"
        data={(workers || []).map((w) => ({ value: String(w.id), label: `${w.first_name} ${w.last_name}` }))}
        value={workerId ? String(workerId) : null}
        onChange={(v) => setWorkerId(v ? Number(v) : undefined)}
        clearable
        mb="md"
        searchable
      />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Category</Table.Th>
            <Table.Th>File</Table.Th>
            <Table.Th>Uploaded</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {documents?.map((d) => (
            <Table.Tr key={d.id}>
              <Table.Td>{d.category}</Table.Td>
              <Table.Td>
                <a href={d.file_url} target="_blank" rel="noreferrer">
                  {d.file_url.split("/").pop()}
                </a>
              </Table.Td>
              <Table.Td>{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : "—"}</Table.Td>
            </Table.Tr>
          ))}
          {documents?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={3}><Text c="dimmed" ta="center">No documents</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Upload Document">
        <Select
          label="Worker"
          data={(workers || []).map((w) => ({ value: String(w.id), label: `${w.first_name} ${w.last_name}` }))}
          value={selectedWorker}
          onChange={setSelectedWorker}
          searchable
          mb="sm"
        />
        <Select
          label="Category"
          data={["Contract", "NDA", "Work Permit", "Visa", "Certification", "Other"]}
          value={category}
          onChange={setCategory}
          mb="sm"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 12 }}
        />
        <Button onClick={handleUpload} loading={uploadDoc.isPending} disabled={!file || !selectedWorker}>
          Upload
        </Button>
      </Modal>
    </div>
  );
}
