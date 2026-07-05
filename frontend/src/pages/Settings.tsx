import { Card, Text, Title } from "@mantine/core";

export default function Settings() {
  return (
    <div>
      <Title order={2} mb="md">Settings</Title>
      <Card withBorder>
        <Text c="dimmed">Organization settings and configuration will be available here.</Text>
      </Card>
    </div>
  );
}
