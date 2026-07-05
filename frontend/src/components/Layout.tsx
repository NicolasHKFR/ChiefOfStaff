import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarTime, IconChartBar, IconFileDescription, IconHierarchy2, IconPaperclip, IconServer2, IconSun, IconTools, IconUsers, IconUsersGroup } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Directory", icon: IconUsers, path: "/" },
  { label: "Org Chart", icon: IconHierarchy2, path: "/org-chart" },
  { label: "Teams", icon: IconUsersGroup, path: "/teams" },
  { label: "Positions", icon: IconServer2, path: "/positions" },
  { label: "Presence", icon: IconCalendarTime, path: "/presence" },
  { label: "Skills", icon: IconTools, path: "/skills" },
  { label: "Documents", icon: IconPaperclip, path: "/documents" },
  { label: "Dashboard", icon: IconChartBar, path: "/dashboard" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Chief of Staff</Text>
          </Group>
          <Group>
            <TextInput
              placeholder="Search..."
              size="sm"
              w={200}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) navigate(`/?q=${encodeURIComponent(val)}`);
                }
              }}
            />
            <IconSun
              size={20}
              style={{ cursor: "pointer" }}
              onClick={() => toggleColorScheme()}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            onClick={() => {
              navigate(item.path);
              if (opened) toggle();
            }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
