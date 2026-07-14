import type { Meta, StoryObj } from "@storybook/react";
import { MessageSquare, PhoneIncoming, Voicemail, ClipboardList } from "lucide-react";
import { DashboardQueue, type DashboardQueueItem } from "../dashboard-queue";

const meta = {
  title: "UI/DashboardQueue",
  component: DashboardQueue,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    items: { table: { disable: true } },
  },
} satisfies Meta<typeof DashboardQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Reference-screenshot data — same four queues, same Skills/Contacts/wait
   values as the actual reference screenshots for each story below. */
const QUEUE_ITEMS: DashboardQueueItem[] = [
  { id: "1", name: "Digital",       icon: MessageSquare, wait: "1m", skillsCount: 3, contactsCount: 9 },
  { id: "2", name: "Inbound Voice", icon: PhoneIncoming, wait: "3m", skillsCount: 1, contactsCount: 25 },
  { id: "3", name: "Voicemail",     icon: Voicemail,     wait: "2m", skillsCount: 3, contactsCount: 29 },
  { id: "4", name: "Work Item",     icon: ClipboardList, wait: "3m", skillsCount: 5, contactsCount: 31 },
];

/* ── QueueCards ──
   Row of queue widgets, each its own DashboardCard with "contained"
   Skills/Contacts metrics — the "cards" variant. */

export const QueueCards: Story = {
  name: "QueueCards",
  render: () => <DashboardQueue variant="cards" items={QUEUE_ITEMS} />,
};

/* ── QueueAccordion ──
   The same four queues as expandable Accordion rows instead — the
   "accordion" variant. No `content` supplied per item here (nothing to
   expand into in this story), so each row just shows its chevron. */

export const QueueAccordion: Story = {
  name: "QueueAccordion",
  render: () => <DashboardQueue variant="accordion" items={QUEUE_ITEMS} />,
};
