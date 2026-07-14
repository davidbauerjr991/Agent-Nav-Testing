import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Panel } from "../panel";
import { Button } from "../button";
import { Input } from "../input";

const meta: Meta<typeof Panel> = {
  title: "Atoms/Panel",
  component: Panel,
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Interior: Story = {
  name: "Interior Panel",
  render: () => (
    <div className="h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <div className="flex-1 bg-lyra-bg-surface-base" />
      <Panel
        variant="interior"
        side="right"
        open
        headerTitle="Dialog Title"
        onClose={() => {}}
        footer={<><Button variant="outline">Cancel</Button><Button>Save</Button></>}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Input label="Name" placeholder="Enter name" />
          <Input label="Description" placeholder="Enter description" />
          <Input label="Value" placeholder="Enter value" />
        </div>
      </Panel>
    </div>
  ),
};

export const Side: Story = {
  name: "Side Panel",
  render: () => {
    const [open, setOpen] = useState(true);
    const [pinned, setPinned] = useState(true);
    return (
      <div className="relative h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
        <Panel
          variant="side"
          side="left"
          open={open}
          pinned={pinned}
          headerTitle="Designer"
          onPinToggle={() => setPinned((v) => !v)}
        >
          <div className="px-4 py-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
          </div>
        </Panel>
        <div className="flex flex-1 flex-col bg-lyra-bg-surface-base p-4 gap-2">
          <Button onClick={() => setOpen((v) => !v)} variant="outline">
            {open ? "Close Panel" : "Open Panel"}
          </Button>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            {pinned ? "Pinned — pushes content" : "Unpinned — hovers as overlay"}
          </p>
        </div>
      </div>
    );
  },
};

export const InteriorLeft: Story = {
  name: "Interior Panel — Left",
  render: () => (
    <div className="h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <Panel
        variant="interior"
        side="left"
        open
        headerTitle="Filters"
        onClose={() => {}}
        footer={<><Button variant="outline">Reset</Button><Button>Apply</Button></>}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Input label="Search" placeholder="Filter by name..." />
          <Input label="Category" placeholder="Select category..." />
        </div>
      </Panel>
      <div className="flex-1 bg-lyra-bg-surface-base" />
    </div>
  ),
};

export const SideRight: Story = {
  name: "Side Panel — Right",
  render: () => {
    const [open, setOpen] = useState(true);
    const [pinned, setPinned] = useState(false);
    return (
      <div className="relative h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
        <div className="flex flex-1 flex-col bg-lyra-bg-surface-base p-4 gap-2">
          <Button onClick={() => setOpen((v) => !v)} variant="outline">
            {open ? "Close Panel" : "Open Panel"}
          </Button>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            {pinned ? "Pinned" : "Overlay"}
          </p>
        </div>
        <Panel
          variant="side"
          side="right"
          open={open}
          pinned={pinned}
          headerTitle="Details"
          onPinToggle={() => setPinned((v) => !v)}
        >
          <div className="px-4 py-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Right side panel content.</p>
          </div>
        </Panel>
      </div>
    );
  },
};
