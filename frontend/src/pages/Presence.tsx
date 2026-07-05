import { useState } from "react";
import { Box, Button, Group, LoadingOverlay, Modal, Table, Text, Title, useMantineTheme } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { usePresence, useUpdateWorker } from "../api/hooks";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function cellColor(present: boolean, end_idx: number | null, idx: number, theme: any): string {
  if (!present) return theme.colors.gray[2];
  if (end_idx !== null && end_idx - idx <= 3 && end_idx - idx >= 0) return theme.colors.yellow[4];
  return theme.colors.blue[5];
}

export default function Presence() {
  const { data, isLoading } = usePresence();
  const updateWorker = useUpdateWorker();
  const theme = useMantineTheme();
  const [editWorker, setEditWorker] = useState<any | null>(null);

  const form = useForm({
    initialValues: { start_date: null as Date | null, end_date: null as Date | null },
  });

  const openEdit = (w: any) => {
    form.setValues({
      start_date: w.start_date ? dayjs(w.start_date).toDate() : null,
      end_date: w.end_date ? dayjs(w.end_date).toDate() : null,
    });
    setEditWorker(w);
  };

  const handleSave = async (values: typeof form.values) => {
    if (!editWorker) return;
    try {
      await updateWorker.mutateAsync({
        id: editWorker.id,
        data: {
          start_date: values.start_date ? dayjs(values.start_date).format("YYYY-MM-DD") : null,
          end_date: values.end_date ? dayjs(values.end_date).format("YYYY-MM-DD") : null,
        } as any,
      });
      notifications.show({ title: "Updated", message: "Dates saved", color: "green" });
      setEditWorker(null);
    } catch {
      notifications.show({ title: "Error", message: "Failed to save dates", color: "red" });
    }
  };

  if (isLoading) return <LoadingOverlay visible />;

  const months: string[] = data?.months ?? [];
  const workers: any[] = data?.workers ?? [];
  const summary: number[] = data?.summary ?? [];

  const yearMonths: { year: number; count: number }[] = [];
  if (months.length > 0) {
    let currentYear = parseInt(months[0].split("-")[0], 10);
    let count = 0;
    for (const m of months) {
      const y = parseInt(m.split("-")[0], 10);
      if (y !== currentYear) {
        yearMonths.push({ year: currentYear, count });
        currentYear = y;
        count = 1;
      } else {
        count++;
      }
    }
    yearMonths.push({ year: currentYear, count });
  }

  const colWidth = 48;

  return (
    <div>
      <Title order={2} mb="md">Employee Presence Forecast</Title>
      <Text c="dimmed" mb="md">
        Monthly headcount projection — blue = present, yellow = ending within 3 months, gray = not active.
        Click a worker row to edit their start/end dates.
      </Text>

      <Box style={{ overflow: "auto", maxHeight: "calc(100vh - 200px)" }}>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead style={{ position: "sticky", top: 0, zIndex: 2, background: "white" }}>
            <Table.Tr>
              <Table.Th style={{ position: "sticky", left: 0, zIndex: 3, background: "white", minWidth: 260 }}>
                Worker
              </Table.Th>
              {yearMonths.map((ym) => (
                <Table.Th
                  key={ym.year}
                  colSpan={ym.count}
                  ta="center"
                  style={{ borderLeft: "2px solid #dee2d6" }}
                >
                  {ym.year}
                </Table.Th>
              ))}
            </Table.Tr>
            <Table.Tr>
              <Table.Th style={{ position: "sticky", left: 0, zIndex: 3, background: "white" }} />
              {months.map((m) => {
                const [, monthNum] = m.split("-");
                return (
                  <Table.Th
                    key={m}
                    ta="center"
                    fw={400}
                    fz="xs"
                    p={4}
                    style={{ width: colWidth, minWidth: colWidth }}
                  >
                    {MONTH_LABELS[parseInt(monthNum, 10) - 1]}
                  </Table.Th>
                );
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {workers.map((w: any) => (
              <Table.Tr
                key={w.id}
                onClick={() => openEdit(w)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td
                  style={{ position: "sticky", left: 0, zIndex: 1, background: "white", minWidth: 260 }}
                >
                  <Text size="sm" fw={500}>
                    {w.first_name} {w.last_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {w.type}
                  </Text>
                  <Text size="xs" c="gray">
                    {w.start_date ? `Start: ${w.start_date}` : "No start date"}
                    {w.end_date ? ` · End: ${w.end_date}` : ""}
                  </Text>
                </Table.Td>
                {w.presence.map((present: boolean, i: number) => (
                  <Table.Td
                    key={i}
                    p={0}
                    style={{
                      width: colWidth,
                      minWidth: colWidth,
                      backgroundColor: cellColor(present, w.end_idx, i, theme),
                      border: "1px solid #fff",
                    }}
                  >
                    <Box style={{ height: 32 }} />
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>

          <Table.Tfoot style={{ position: "sticky", bottom: 0, zIndex: 2, background: "white" }}>
            <Table.Tr>
              <Table.Th style={{ position: "sticky", left: 0, zIndex: 3, background: "white" }}>
                Total
              </Table.Th>
              {summary.map((count: number, i: number) => (
                <Table.Th
                  key={i}
                  ta="center"
                  fw={600}
                  p={4}
                  style={{ width: colWidth, minWidth: colWidth }}
                >
                  {count}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </Box>

      <Modal
        opened={!!editWorker}
        onClose={() => setEditWorker(null)}
        title={`Edit Dates — ${editWorker?.first_name} ${editWorker?.last_name}`}
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <DatePickerInput
            label="Start Date"
            placeholder="When they started / will start"
            clearable
            {...form.getInputProps("start_date")}
            mb="sm"
          />
          <DatePickerInput
            label="End Date"
            placeholder="When they leave (empty = no end)"
            clearable
            {...form.getInputProps("end_date")}
            mb="lg"
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setEditWorker(null)}>Cancel</Button>
            <Button type="submit" loading={updateWorker.isPending}>Save</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
