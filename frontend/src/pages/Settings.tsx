import { useState } from "react";
import {
  ActionIcon, Alert, Button, Card, Group, Modal, NumberInput, Table, Text, TextInput, Textarea, Title, Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useBackups, useCreateBackup, useCreateLocation, useDeleteLocation, useLocations, useRestoreBackup, useUpdateLocation, useCreateWorkerType, useDeleteWorkerType, useWorkerTypes, useUpdateWorkerType } from "../api/hooks";
import type { BackupInfo, Location, WorkerType } from "../types";

function LocationManager() {
  const { data: locations, isLoading } = useLocations();
  const createLoc = useCreateLocation();
  const updateLoc = useUpdateLocation();
  const deleteLoc = useDeleteLocation();
  const [opened, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const form = useForm({
    initialValues: { name: "", address: "", country: "", latitude: "" as unknown as number | "", longitude: "" as unknown as number | "" },
  });

  const openCreate = () => {
    form.reset();
    setEditTarget(null);
    open();
  };

  const openEdit = (loc: Location) => {
    form.setValues({
      name: loc.name,
      address: loc.address ?? "",
      country: loc.country ?? "",
      latitude: loc.latitude ?? "",
      longitude: loc.longitude ?? "",
    });
    setEditTarget(loc);
    open();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        name: values.name,
        address: values.address || undefined,
        country: values.country || undefined,
        latitude: values.latitude !== "" ? Number(values.latitude) : undefined,
        longitude: values.longitude !== "" ? Number(values.longitude) : undefined,
      };
      if (editTarget) {
        await updateLoc.mutateAsync({ id: editTarget.id, data: payload as any });
        notifications.show({ title: "Updated", message: "Location updated", color: "green" });
      } else {
        await createLoc.mutateAsync(payload as any);
        notifications.show({ title: "Created", message: "Location created", color: "green" });
      }
      form.reset();
      close();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to save location";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLoc.mutateAsync(deleteTarget.id);
      notifications.show({ title: "Deleted", message: "Location removed", color: "orange" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete location", color: "red" });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={4}>Locations</Title>
        <Button onClick={openCreate}>Add Location</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Address</Table.Th>
            <Table.Th>Country</Table.Th>
            <Table.Th>Lat</Table.Th>
            <Table.Th>Lng</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={6}><Text c="dimmed">Loading...</Text></Table.Td>
            </Table.Tr>
          )}
          {locations?.map((loc) => (
            <Table.Tr key={loc.id}>
              <Table.Td fw={500}>{loc.name}</Table.Td>
              <Table.Td>{loc.address || "—"}</Table.Td>
              <Table.Td>{loc.country || "—"}</Table.Td>
              <Table.Td>{loc.latitude ?? "—"}</Table.Td>
              <Table.Td>{loc.longitude ?? "—"}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" onClick={() => openEdit(loc)}>
                    <Text fw={700}>✎</Text>
                  </ActionIcon>
                  <ActionIcon color="red" variant="subtle" onClick={() => setDeleteTarget(loc)}>
                    <Text component="span" fw={700}>×</Text>
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {!isLoading && locations?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6}><Text c="dimmed" ta="center">No locations yet</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editTarget ? "Edit Location" : "Add Location"} size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <Textarea label="Address" {...form.getInputProps("address")} mb="sm" />
          <TextInput label="Country" placeholder="e.g. Japan" {...form.getInputProps("country")} mb="sm" />
          <Group grow>
            <NumberInput label="Latitude" {...form.getInputProps("latitude")} mb="sm" />
            <NumberInput label="Longitude" {...form.getInputProps("longitude")} mb="sm" />
          </Group>
          <Button type="submit">{editTarget ? "Save" : "Create"}</Button>
        </form>
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion" centered>
        <Text mb="lg">Remove location "{deleteTarget?.name}"?</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" loading={deleteLoc.isPending} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </>
  );
}

function WorkerTypeManager() {
  const { data: types, isLoading } = useWorkerTypes();
  const createWT = useCreateWorkerType();
  const updateWT = useUpdateWorkerType();
  const deleteWT = useDeleteWorkerType();
  const [opened, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<WorkerType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerType | null>(null);
  const form = useForm({ initialValues: { name: "" } });

  const openCreate = () => {
    form.reset();
    setEditTarget(null);
    open();
  };

  const openEdit = (wt: WorkerType) => {
    form.setValues({ name: wt.name });
    setEditTarget(wt);
    open();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editTarget) {
        await updateWT.mutateAsync({ id: editTarget.id, data: values });
        notifications.show({ title: "Updated", message: "Worker type updated", color: "green" });
      } else {
        await createWT.mutateAsync(values);
        notifications.show({ title: "Created", message: "Worker type created", color: "green" });
      }
      form.reset();
      close();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to save worker type";
      notifications.show({ title: "Error", message: msg, color: "red" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWT.mutateAsync(deleteTarget.id);
      notifications.show({ title: "Deleted", message: "Worker type removed", color: "orange" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete worker type", color: "red" });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={4}>Worker Types</Title>
        <Button onClick={openCreate}>Add Type</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={2}><Text c="dimmed">Loading...</Text></Table.Td>
            </Table.Tr>
          )}
          {types?.map((wt) => (
            <Table.Tr key={wt.id}>
              <Table.Td fw={500}>{wt.name}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" onClick={() => openEdit(wt)}>
                    <Text fw={700}>✎</Text>
                  </ActionIcon>
                  <ActionIcon color="red" variant="subtle" onClick={() => setDeleteTarget(wt)}>
                    <Text component="span" fw={700}>×</Text>
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {!isLoading && types?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={2}><Text c="dimmed" ta="center">No worker types yet</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editTarget ? "Edit Worker Type" : "Add Worker Type"}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Name" required {...form.getInputProps("name")} mb="sm" />
          <Button type="submit">{editTarget ? "Save" : "Create"}</Button>
        </form>
      </Modal>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion" centered>
        <Text mb="lg">Remove worker type "{deleteTarget?.name}"?</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="red" loading={deleteWT.isPending} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </>
  );
}

function DatabaseBackupManager() {
  const { data: backups, isLoading } = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const [restoreTarget, setRestoreTarget] = useState<BackupInfo | null>(null);

  const handleCreate = async () => {
    try {
      await createBackup.mutateAsync();
      notifications.show({ title: "Backup created", message: "Database snapshot saved", color: "green" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to create backup", color: "red" });
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreBackup.mutateAsync(restoreTarget.filename);
      notifications.show({ title: "Restored", message: "Database restored. Reload the page.", color: "blue" });
    } catch {
      notifications.show({ title: "Error", message: "Failed to restore backup", color: "red" });
    }
    setRestoreTarget(null);
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={4}>Database Backups</Title>
        <Button onClick={handleCreate} loading={createBackup.isPending}>Save Backup</Button>
      </Group>

      <Text c="dimmed" size="sm" mb="md">
        Backups are full snapshots of the SQLite database. Restoring overwrites current data —
        refresh the page after restoring.
      </Text>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Filename</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={4}><Text c="dimmed">Loading...</Text></Table.Td>
            </Table.Tr>
          )}
          {backups?.map((b) => {
            const sizeKb = (b.size / 1024).toFixed(1);
            return (
              <Table.Tr key={b.filename}>
                <Table.Td fw={500}>{b.filename}</Table.Td>
                <Table.Td>{dayjs(b.created_at).format("YYYY-MM-DD HH:mm:ss")}</Table.Td>
                <Table.Td>{sizeKb} KB</Table.Td>
                <Table.Td>
                  <Tooltip label="Restore this backup">
                    <Button size="xs" variant="light" color="orange" onClick={() => setRestoreTarget(b)}>
                      Restore
                    </Button>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {!isLoading && backups?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}><Text c="dimmed" ta="center">No backups yet</Text></Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="Confirm Restore" centered>
        <Text mb="lg">
          Restore from <b>{restoreTarget?.filename}</b>? This will replace all current data with the backup snapshot.
        </Text>
        <Alert color="orange" mb="md">
          You must refresh the page after restoring to reload data from the restored database.
        </Alert>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setRestoreTarget(null)}>Cancel</Button>
          <Button color="orange" loading={restoreBackup.isPending} onClick={handleRestore}>Restore</Button>
        </Group>
      </Modal>
    </>
  );
}

export default function Settings() {
  return (
    <div>
      <Title order={2} mb="md">Settings</Title>

      <Card withBorder mb="md">
        <LocationManager />
      </Card>

      <Card withBorder>
        <WorkerTypeManager />
      </Card>

      <Card withBorder mt="md">
        <DatabaseBackupManager />
      </Card>
    </div>
  );
}
