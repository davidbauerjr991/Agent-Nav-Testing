import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { PlaceholderChat } from "./PlaceholderChat";
import {
  AppHeader,
  AiPanel,
  DraggablePanel,
  NotificationsBell,
  AgentNotifications,
  AgentProfile,
  Container,
  SidePanel,
  InteriorPanel,
  PanelPinButton,
  PageHeader,
  AiSparkleIcon,
  Input,
  LeftNav,
  CreateNew,
  useOutboundAddButton,
  InteractionNavItem,
  Divider,
  Select,
  Tooltip,
  Popover,
  type SelectOption,
  type NavItem,
  type CreateNewOutboundConfig,
  type CreateNewOutboundContact,
  type InteractionChannel,
  type ChannelType,
  type AgentStatus,
  type AgentNotification,
  type DraggableVariant,
} from "@nicecxone/lyra-ui";
import { CREATE_NEW_AGENTS } from "@nicecxone/lyra-ui/agents-data";
import { CREATE_NEW_CUSTOMERS } from "@nicecxone/lyra-ui/customers-data";
import {
  Home,
  Users,
  BookUser,
  CalendarDays,
  Settings,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  User,
  PanelLeft,
  MonitorUp,
  Plus,
  Trash2,
  Search,
  MoreHorizontal,
  Pin,
  CalendarClock,
  Landmark,
  Ticket,
  GripVertical,
  LayoutDashboard,
} from "lucide-react";

/* ── Create New → Outbound config ──
   Mirrors lyra-ui's CreateNew "Create New → Outbound" story (see
   lyra-ui/src/components/__stories__/create-new-outbound-mock.tsx) — only
   "Outbound" is wired up, the rest render as coming-soon placeholders. Teams
   and skills below are small, app-specific lists kept local, but the agent
   and customer "database" records themselves come from lyra-ui's shared
   fixture files (via the /agents-data and /customers-data aliases in
   vite.config.ts) so this app's Outbound picker can't quietly drift out of
   sync with lyra-ui's own story — same records, mapped into the shape
   `CreateNew` expects exactly like lyra-ui's own mock file does. Kept fully
   populated (not emptied out) since this is lyra-ui's own shared contact
   "database," not app-specific sample content. */

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const OUTBOUND_AGENTS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = CREATE_NEW_AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  initials: initialsFor(a.name),
  subtitle: a.agentId,
  avatarClassName: a.avatarClassName,
  channels: a.channels,
  status: a.status,
}));

const OUTBOUND_CUSTOMERS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = CREATE_NEW_CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  initials: initialsFor(c.name),
  subtitle: c.customerId,
  avatarClassName: c.avatarClassName,
  channels: c.channels,
}));

const OUTBOUND_TEAMS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = [
  { id: "t1", name: "Billing Support",    initials: "BS", subtitle: "TEAM-04", avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong", channels: ["voice", "email"] },
  { id: "t2", name: "Tier 2 Escalations", initials: "T2", subtitle: "TEAM-07", avatarClassName: "bg-lyra-accent-red-soft text-lyra-accent-red-strong",       channels: ["voice", "email"] },
];

const OUTBOUND_SKILLS: NonNullable<CreateNewOutboundConfig["groups"][number]["contacts"]> = [
  { id: "s1", name: "Spanish Language",  initials: "ES", subtitle: "SKL-12", avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong", channels: ["voice", "email"], status: "available", queueCount: 4, waitTimeSeconds: 200 },
  { id: "s2", name: "Technical Support", initials: "TS", subtitle: "SKL-03", avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",   channels: ["voice", "email"], status: "busy",      queueCount: 7, waitTimeSeconds: 95 },
];

const OUTBOUND_CONFIG: CreateNewOutboundConfig = {
  outboundTitle: "New Outbound",
  groups: [
    { id: "favorites", label: "Favorites", kind: "favorites", emptyMessage: "No favorites yet" },
    { id: "agents", label: "Agents", searchPlaceholder: "Search Agents", contacts: OUTBOUND_AGENTS },
    { id: "teams", label: "Teams", searchPlaceholder: "Search teams", contacts: OUTBOUND_TEAMS },
    { id: "skills", label: "Skills", searchPlaceholder: "Search skills", contacts: OUTBOUND_SKILLS },
    { id: "customers", label: "Customers", searchPlaceholder: "Search customers", contacts: OUTBOUND_CUSTOMERS },
    { id: "dialpad", label: "Dial Pad", kind: "dialpad" },
  ],
  defaultGroupId: "agents",
  channelOptions: [
    { id: "voice",    label: "Call",     selectLabel: "Voice", icon: <Phone         className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "email",    label: "Email",                          icon: <Mail          className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "sms",      label: "SMS",                            icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "whatsapp", label: "WhatsApp",                       icon: <MessageCircle className="h-5 w-5" strokeWidth={1.5} /> },
  ],
  phoneOptions: [
    { value: "+14563833329", label: "(456) 383-3329" },
    { value: "+14565559981", label: "(456) 555-9981" },
    { value: "+14565550147", label: "(456) 555-0147" },
  ],
  skillOptions: [
    { value: "general", label: "General Support" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing" },
    { value: "sales", label: "Sales" },
    { value: "escalations", label: "Escalations" },
    { value: "vip", label: "VIP Support" },
  ],
  onQuickDial: (phoneNumber) => {
    // eslint-disable-next-line no-console
    console.log("Quick dial:", phoneNumber);
  },
  onStartCall: (selection) => {
    // eslint-disable-next-line no-console
    console.log(
      "Start call:",
      selection.channel,
      "→",
      selection.contact.name,
      `(phone: ${selection.phone}, skill: ${selection.skillId})`
    );
  },
  pageSize: 10,
};

/* ── Left nav interactions ──
   Live InteractionNavItem cards launched from CreateNew above — see
   lyra-ui's AgentNextGenTemplate.stories.tsx for the reference
   implementation this mirrors. No cards exist until the agent actually
   starts one; starting a second channel with a contact who already has a
   card folds it into that same card *only* when it's the same channel type
   on the same address (restarting its timer) — a different address on the
   same type (e.g. a second SMS thread on a different number) opens as its
   own additional row instead of replacing the first, since it's a genuinely
   separate conversation. "Unassign & Dismiss" (any channel's kebab menu)
   removes just that channel via InteractionNavItem's `onDismissChannel`
   when others are still open, or the whole card via `onDismiss` when it was
   the last one — see `handleDismissChannel`/`handleDismissInteraction`. */

/** A channel open within one live interaction — tracks when it started
 *  (in ticks of the shared clock below) rather than a fixed elapsed string,
 *  so the rendered `InteractionChannel.elapsed` keeps counting up live. */
interface TrackedChannel {
  /** Unique identity for this specific channel, so two channels of the same
   *  `type` (e.g. two SMS threads on different numbers) are tracked as
   *  separate rows instead of one overwriting the other — see
   *  `InteractionChannel.id`'s own doc comment in lyra-ui. Built from
   *  `type` + `value` (`"sms:+14565559981"`) so restarting the *same*
   *  address correctly reuses/refreshes the existing row (see
   *  `handleStartCall`) while a different address never collides with it.
   *  Quick-dialed/redialed channels (no CreateNew contact/address) just use
   *  their `type`, since those flows already fully replace `channels`
   *  rather than merging into it. */
  id: string;
  type: ChannelType;
  startTick: number;
  /** Routing skill label for this channel, shown as its body copy — looked
   *  up from OUTBOUND_CONFIG.skillOptions at start-call time. */
  preview?: string;
  /** The phone number/email address/WhatsApp handle this channel was
   *  started on (from `handleStartCall`'s `selection.phone`) — surfaced
   *  back into CreateNew's `openChannelAddresses` so reopening the outbound
   *  picker for this contact disables only that exact address in "Select
   *  Phone"/"Select Email Address"/"Select WhatsApp Handle", not the whole
   *  field. Undefined for quick-dialed channels, which don't go through
   *  CreateNew's contact flow. */
  value?: string;
  /** Human-readable version of `value` for display (e.g. "(456) 383-3329"
   *  vs. `value`'s raw "+14563833329") — looked up from
   *  `OUTBOUND_CONFIG.phoneOptions` at start-call time, same pattern as
   *  `preview`/`skillLabel` above. Shown on this channel's `ChannelTab` (see
   *  the `activeInteraction` block below) as "SMS | (456) 383-3329" —
   *  undefined just means the tab shows icon + type label with no address
   *  (e.g. a redialed voice call, which has no stored number at all). */
  addressLabel?: string;
  /** Whether the customer has sent a message on this channel that the agent
   *  hasn't replied to yet — drives the row's red/critical chip+clock
   *  styling (green/success otherwise). Always omitted (falsy) at
   *  start-call/quick-dial time: an agent-initiated outbound channel has
   *  nothing pending from the customer the moment it opens, so it should
   *  never render red immediately just because its `type` isn't voice. */
  awaitingResponse?: boolean;
  /** Total message count for this channel's conversation, shown only on this
   *  channel's `ChannelTab` tooltip, never on the tab face itself. `0` for a
   *  freshly started outbound conversation on any digital channel (the
   *  tooltip reads "0 Messages", which is correct — nothing's been
   *  exchanged yet), left `undefined` entirely for voice (no message
   *  concept at all). */
  messageCount?: number;
  /** This channel's own conversation/session id — distinct from
   *  `ActiveInteraction.recordId` below (the *customer/case* record shown in
   *  the page header): one record can have several channels open, each its
   *  own conversation with its own id. Synthesized via
   *  `generateInteractionId()` at channel-creation time; shown on this
   *  channel's `ChannelTab` tooltip as "#{interactionId}". */
  interactionId?: string;
}

/** One live interaction in the left nav — an agent/customer/team/skill
 *  contact (or, for a quick-dialed number with no contact record, the
 *  number itself) plus every channel currently open with them. Keyed by
 *  contact id (or `quickdial:<number>`) so starting a second channel with
 *  the same contact adds to this interaction's `channels` instead of
 *  creating a second card. */
interface ActiveInteraction {
  id: string;
  customerName?: string;
  /** Customer/agent/team/skill record id shown under the name on this
   *  interaction's detail page header — the contact's real id
   *  (`CreateNewOutboundContact.subtitle`, e.g. a customerId/agentId) when
   *  the interaction was started from a known record, or a freshly
   *  generated case number (`generateCaseId`) for quick-dialed numbers with
   *  no matching record. */
  recordId: string;
  channels: TrackedChannel[];
  /** Which open channel is "current" — shared source of truth between this
   *  interaction's `InteractionNavItem` card (its `currentChannelKey` prop)
   *  and its `ChannelTab` bar (each tab's `active`), so clicking either one
   *  updates the other. Kept in sync by `handleStartCall`/`handleQuickDial`
   *  (a new/refreshed channel always takes over as current, mirroring
   *  `InteractionNavItem`'s own auto-select-newest rule) and by
   *  `handleChannelSelect` (a row or tab click). */
  currentChannelId?: string;
}

/** Fallback case id for interactions with no real customer/agent/team/skill
 *  record behind them (quick-dialed numbers) — "CS-" + digits. */
function generateCaseId(): string {
  return `CS-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

/** Synthesized per-channel conversation/session id — plain-numeric shape
 *  (12 digits, no prefix) — distinct from `generateCaseId`'s "CS-" shape,
 *  which is a customer/case-level id, not a per-channel one. */
function generateInteractionId(): string {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

/** Renders a tick count (seconds since the channel/interaction started) as
 *  the "MM:SS" format InteractionNavItem's `elapsed` prop expects. */
function formatElapsedTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/* ── Left nav items ──
   Icon rail matches lyra-ui's AgentNextGenTemplate.stories.tsx "With Page
   Header" story's NAV_ITEMS exactly (Home/Contacts/Directory/Schedule/
   Settings, same icons/labels/order). Contacts and Directory have no page
   behind them yet — this app is a single blank agent page — so they render
   as plain, unwired rail icons, same as every item in that story (none of
   which have onClick/active wiring either). Home and Settings keep their
   real behavior from this page's own Desk-dashboard/blank-Settings-page
   toggle below (those two views do exist here, unlike Contacts/Directory),
   same dynamic active/onClick pattern agent-next-gen-v1 already used. */
function buildNavItems(
  hasActiveInteraction: boolean,
  onDeskClick: () => void,
  showSettings: boolean,
  onSettingsClick: () => void
): NavItem[] {
  return [
    {
      icon: <Home className="h-4 w-4" strokeWidth={1.5} />,
      label: "Home",
      active: !hasActiveInteraction && !showSettings,
      onClick: onDeskClick,
    },
    {
      icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
      label: "Contacts",
    },
    {
      icon: <BookUser className="h-4 w-4" strokeWidth={1.5} />,
      label: "Directory",
    },
    {
      icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} />,
      label: "Schedule",
    },
    {
      icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
      label: "Settings",
      active: showSettings,
      onClick: onSettingsClick,
    },
  ];
}

/* ── Left nav rail (Option 03 only) ──
   Replaces the plain buildNavItems()/`items` rail above (left as-is, unused)
   with a custom rail matching the attached reference screenshot: Home,
   Settings, Search, Directory, one "pinned" slot (defaults to WEM), and a
   "More" overflow button. `items` can't express this — LeftNav's own
   collapsed rendering is a flat icon+tooltip list with no popover/flyout
   support — so this whole rail is hand-built and rendered inside
   `pinnedHeader` instead (same reasoning/pattern as Option01's own
   relocated Home button), with `items={[]}` passed to LeftNav so its
   built-in rail slot renders nothing.

   The pinned slot holds exactly one of the four "pinnable" records below at
   a time; "More" opens a popover listing whichever three aren't currently
   pinned, each with a trailing Pin icon. Clicking one *swaps* it into the
   pinned slot in place of whatever was there — not appended alongside it —
   per explicit correction ("when an item is pinned it replaces the last
   item in the list"), so the rail never grows past its fixed 6 slots. */
type PinnableNavId = "wem" | "customers" | "accounts" | "tickets";

const PINNABLE_NAV_META: Record<PinnableNavId, { label: string; icon: React.ReactNode }> = {
  wem:       { label: "WEM",       icon: <CalendarClock className="h-4 w-4" strokeWidth={1.5} /> },
  customers: { label: "Customers", icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
  accounts:  { label: "Accounts",  icon: <Landmark className="h-4 w-4" strokeWidth={1.5} /> },
  tickets:   { label: "Tickets",   icon: <Ticket className="h-4 w-4" strokeWidth={1.5} /> },
};

/** Every static (non-interaction) page this rail can show — Home/Settings/
 *  Search/Directory plus whichever record type currently occupies the
 *  rail's pinned slot. Selecting any nav item (including a More-menu row,
 *  see below) just swaps this and shows a "{label}" PageHeader — it does
 *  *not* touch `pinnedNavId`/the rail's pinned-slot icon. Only the pin
 *  action does that (see the More popover's own comment). */
type StaticPageId = "home" | "settings" | "search" | "directory" | PinnableNavId;

const STATIC_PAGE_LABELS: Record<StaticPageId, string> = {
  home: "Dashboard",
  settings: "Settings",
  search: "Search",
  directory: "Directory",
  wem: PINNABLE_NAV_META.wem.label,
  customers: PINNABLE_NAV_META.customers.label,
  accounts: PINNABLE_NAV_META.accounts.label,
  tickets: PINNABLE_NAV_META.tickets.label,
};

/** The rail's 5 always-present rows, reorderable by the agent (see
 *  `railOrder`/drag handlers below) — "More" is deliberately left out of
 *  this list and stays pinned as the rail's last row, same as most
 *  overflow-menu conventions (it's a utility control, not one of the
 *  record-type rows being reordered). */
type RailItemId = "home" | "settings" | "search" | "directory" | "pinned";

/** One row in the "More" popover — a `<div role="button">` (not a real
 *  `<button>`, same reason lyra-ui's own `ContactRow` in create-new.tsx
 *  isn't one either) with a nested, independently-clickable Pin `<button>`.
 *  Two real `<button>`s can't nest validly, and lyra-ui's own `Menu` rows
 *  *are* a single `<button>` per item — which can't support this row's two
 *  separate actions (select vs. pin) — so this is hand-built instead of
 *  reusing `Menu`, matching `ContactRow`/`FavoriteButton`'s own established
 *  pattern for exactly this "row click vs. inline button click" split. */
function MoreMenuRow({
  icon,
  label,
  active,
  onSelect,
  onPin,
}: {
  icon: React.ReactNode;
  label: string;
  /** This row's own record is the currently active page (selected without
      being pinned) — same active treatment `NavRailButton`'s expanded rows
      use, so a More-menu selection reads as "selected" here too, not just
      on the rail's own "More" button (see its own comment below). */
  active?: boolean;
  onSelect: () => void;
  onPin: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lyra-sm px-3 py-2.5 text-left lyra-body-md transition-colors",
        "focus:outline-none focus-visible:bg-lyra-state-hover",
        active
          ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
          : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
      )}
    >
      <span aria-hidden="true" className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center", active ? "text-lyra-fg-active-strong" : "text-lyra-fg-secondary")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {/* Pins this record into the rail's single pinned slot — swaps
          whatever was there, per instruction, and deliberately does *not*
          also select/navigate to it (that's the row's own onClick above).
          `stopPropagation` keeps this click from also bubbling up and
          firing the row's `onSelect`. */}
      {/* placement="right" (arrow points back left, at the pin icon) —
          "top" let Radix's own collision-avoidance flip it sideways since
          there wasn't room above inside the popover, which is what pushed
          it out from behind the More panel's own edge in the first place.
          z-[10004]: this tooltip is nested inside the "More" Popover, which
          already sits at the z-[10003] "nested popover" tier (see that
          Popover's own className) — one tier higher than this Tooltip's
          z-[10000] default, so without an override the Popover's own panel
          rendered on top of it, clipping most of the tooltip. */}
      <Tooltip content="Pin to left nav" placement="right" className="z-[10004]">
        <button
          type="button"
          aria-label={`Pin ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        >
          <Pin className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

/** One rail row — compact icon+tooltip when collapsed, icon+label when the
 *  nav is open. Same markup as Option01's own hand-built Home row
 *  (tree-menu.tsx/left-nav.tsx's own leaf-item styling, copied since neither
 *  of those render paths support this rail's "More" popover). */
function NavRailButton({
  icon,
  label,
  active,
  expanded,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip content={label} placement="right" disabled={expanded}>
      <button
        type="button"
        aria-label={label}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        className={cn(
          "relative flex w-full flex-shrink-0 items-center rounded-lyra-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
          expanded ? "h-9 gap-2.5 px-2.5 lyra-body-md justify-start" : "h-8 w-8 justify-center",
          active
            ? cn(
                "bg-lyra-bg-active-moderate text-lyra-fg-active-strong",
                expanded && "lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
              )
            : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
        )}
      >
        {icon}
        {expanded && <span className="flex-1 truncate text-left">{label}</span>}
      </button>
    </Tooltip>
  );
}

/* ── Option03Page ──
   No login gate or welcome modal in this prototype — every page (this one
   and its sibling Option pages) loads its content directly. */

type Page = "option-01" | "option-02" | "option-03" | "option-04" | "option-05";

const AI_PANEL_DEFAULT_WIDTH = 360;

// Screen Pop — external apps an agent can pop the current contact/record
// into. Dummy list; wiring an actual screen-pop integration per app is out
// of scope for now.
const SCREEN_POP_APPS: SelectOption[] = [
  { value: "salesforce", label: "Salesforce" },
  { value: "zendesk",    label: "Zendesk" },
  { value: "servicenow", label: "ServiceNow" },
  { value: "hubspot",    label: "HubSpot" },
  { value: "freshdesk",  label: "Freshdesk" },
];

export function Option03Page({
  showPageHeader = false,
  showPanelToggle = false,
  showInteriorPanel = true,
  onNavigate,
  initialInteraction,
  sidePanelToggleLabel,
}: {
  showPageHeader?: boolean;
  showPanelToggle?: boolean;
  showInteriorPanel?: boolean;
  onNavigate?: (page: Page) => void;
  /**
   * Seeds `interactions`/`activeInteractionId` with an already-active call
   * instead of starting empty — mirrors lyra-ui's `AgentNextGenTemplate`
   * "Active Interaction" story prop of the same name. Not passed anywhere in
   * this app today — kept as an opt-in capability so this component stays
   * in sync with the canonical template's shape, not to change default
   * behavior.
   */
  initialInteraction?: ActiveInteraction;
  /**
   * Overrides the record-header `PanelPinButton`'s tooltip (both pinned and
   * unpinned label, since "Toggle Overview" describes the action generically
   * rather than a pin/unpin pair) — mirrors lyra-ui's `AgentNextGenTemplate`
   * prop of the same name. Defaults to "Toggle Overview" here too, matching
   * that template's current copy; pass a different string to override it.
   */
  sidePanelToggleLabel?: string;
}) {
  const [navOpen, setNavOpen] = useState(!!initialInteraction);
  // Left nav rail's single "pinned" slot (see the rail's own comment above
  // buildNavItems) — defaults to WEM, matching the reference screenshot.
  const [pinnedNavId, setPinnedNavId] = useState<PinnableNavId>("wem");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  // "More" now opens on hover instead of a click — same treatment Option01's
  // Home flyout uses: open immediately on enter, close after a short delay
  // on leave (so moving the cursor from the button into the flyout itself
  // doesn't prematurely close it), same dual-region hover handling
  // `OutboundContactRow`'s own flyout uses in lyra-ui/create-new.tsx.
  const moreMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMoreMenu = () => {
    if (moreMenuCloseTimeoutRef.current) {
      clearTimeout(moreMenuCloseTimeoutRef.current);
      moreMenuCloseTimeoutRef.current = null;
    }
    setMoreMenuOpen(true);
  };
  const scheduleCloseMoreMenu = () => {
    if (moreMenuCloseTimeoutRef.current) clearTimeout(moreMenuCloseTimeoutRef.current);
    moreMenuCloseTimeoutRef.current = setTimeout(() => setMoreMenuOpen(false), 150);
  };
  useEffect(() => () => {
    if (moreMenuCloseTimeoutRef.current) clearTimeout(moreMenuCloseTimeoutRef.current);
  }, []);
  // Rail row order — press-and-drag reorderable (see the rail's own drag
  // handlers below), "More" excluded (see `RailItemId`'s own comment).
  const [railOrder, setRailOrder] = useState<RailItemId[]>(["home", "settings", "search", "directory", "pinned"]);
  // Which row is currently being dragged, if any — used only to dim it
  // while it's picked up; the actual reordering happens live in
  // `handleRailDragOver` as the drag passes over each other row (the
  // common "reorder on hover" drag-list pattern), so nothing else needs to
  // happen on drop/dragend beyond clearing this back to null.
  const [draggedRailId, setDraggedRailId] = useState<RailItemId | null>(null);
  const handleRailDragStart = (id: RailItemId) => (e: React.DragEvent) => {
    setDraggedRailId(id);
    e.dataTransfer.effectAllowed = "move";
    // Firefox requires data to actually be set for the drag to start at all.
    e.dataTransfer.setData("text/plain", id);
  };
  const handleRailDragOver = (overId: RailItemId) => (e: React.DragEvent) => {
    e.preventDefault(); // required for onDrop to be a valid drop target
    if (!draggedRailId || draggedRailId === overId) return;
    setRailOrder((prev) => {
      const from = prev.indexOf(draggedRailId);
      const to = prev.indexOf(overId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggedRailId);
      return next;
    });
  };
  const handleRailDragEnd = () => setDraggedRailId(null);
  // No interactions exist until the agent launches one from the CreateNew
  // menu (Start Interaction / quick dial) — see handleStartCall/handleQuick
  // Dial below. Click any resulting InteractionNavItem card to make it the
  // active one. `initialInteraction` (see above) seeds this instead, for
  // callers that want to start already mid-call.
  const [interactions, setInteractions] = useState<ActiveInteraction[]>(
    () => (initialInteraction ? [initialInteraction] : [])
  );
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(
    () => initialInteraction?.id ?? null
  );
  // Drives the main content area: whenever an interaction is active, the
  // Desk dashboard is replaced by that interaction's blank detail page (see
  // the PageHeader "record header" mode below) — starting/quick-dialing a
  // new assignment always sets this, so the screen switches over
  // automatically the moment one is added.
  const activeInteraction = interactions.find((i) => i.id === activeInteractionId) ?? null;
  // Shared clock powering every open channel's live "MM:SS since it
  // started" elapsed display — independent of `elapsedSeconds` below, which
  // is the agent's own status timer and resets on status change.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const [activeDeskTab, setActiveDeskTab] = useState<"home" | "customers" | "accounts" | "tickets" | "interactions" | "wem">("home");
  /* Settings — a third top-level view alongside Desk/interaction-record,
     shown in place of both in the content column when the Settings rail
     item is clicked. Mutually exclusive with an active interaction: opening
     one closes the other. Interaction → Settings is enforced below via an
     effect (selecting/starting any interaction always takes over the
     content column, same "one primary view at a time" rule Desk already
     follows per `buildNavItems`'s `active: !hasActiveInteraction`); Settings
     → interaction is enforced the other way, directly in the `LeftNav`
     `onSettingsClick` handler, since there's only that one call site. */
  // Which static (non-interaction) page the rail is currently showing — see
  // `StaticPageId`'s own comment above. Replaces the old plain `showSettings`
  // boolean now that Search/Directory/the pinned-slot item need their own
  // pages too, not just Home/Settings.
  const [activeStaticPage, setActiveStaticPage] = useState<StaticPageId>("home");

  // Effect rather than touching every `setActiveInteractionId` call site
  // individually. Same "an active interaction takes priority" rule the old
  // `showSettings` boolean followed — reverting to "home" here just means
  // "get out of the way", since the content column's own branch below shows
  // the interaction whenever one is active and `activeStaticPage === "home"`.
  useEffect(() => {
    if (activeInteractionId) setActiveStaticPage("home");
  }, [activeInteractionId]);
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  // Left intentionally empty — no sample notifications shipped with this
  // scaffold (see the task's "leave out the actual mock records" note).
  // The panel/bell wiring below is fully functional; wire a real
  // notifications source (or add sample entries) whenever this prototype
  // needs some to look at.
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("offline");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  };

  /* Panel animation state machine — see AgentNextGenTemplate.stories.tsx for full comment */
  type PanelState = "closed" | "open" | "closing";

  /* AI panel state */
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<PanelState>("closed");
  // Defaults to "float" (a transient, portal-positioned panel anchored
  // under the trigger button — same behavior lyra-ui's own
  // `AppHeader.stories.tsx`/`AgentNextGenTemplate.stories.tsx` demonstrate
  // for this exact button): `ReactDOM.createPortal` + `getBoundingClientRect()`-
  // derived fixed position, not a layout-pushing docked panel. "docked" is
  // still reachable afterward (dragging the panel to the edge, same as
  // Notifications), just not the default on first open.
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("float");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(860);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiFloatLeft  = useRef<number | null>(null);
  const aiFloatTop   = useRef<number | null>(null);
  const aiPanelRef   = useRef<HTMLDivElement>(null);
  const aiAnimTimer  = useRef<ReturnType<typeof setTimeout>>();

  /* Notifications panel state */
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifMounted,    setNotifMounted]    = useState(false);
  const [notifState,      setNotifState]      = useState<PanelState>("closed");
  const [notifVariant,    setNotifVariant]    = useState<DraggableVariant>("float");
  const [notifWidth,      setNotifWidth]      = useState(360);
  const [notifHeight,     setNotifHeight]     = useState(860);
  const [notifIsResizing, setNotifIsResizing] = useState(false);
  const notifFloatLeft = useRef<number | null>(null);
  const notifFloatTop  = useRef<number | null>(null);
  const notifPanelRef  = useRef<HTMLDivElement>(null);
  const notifAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Conversations panel state — blank `DraggablePanel` (lyra-ui), same
     open/mounted/state/variant/size/position shape as AI and Notifications
     above (see the shared `dockPanelExclusively`/`getFloatStyle` helpers
     below, which generalize the single-dock rule across all four panels
     instead of hand-duplicating pairwise checks a third and fourth time). */
  const [convOpen,       setConvOpen]       = useState(false);
  const [convMounted,    setConvMounted]    = useState(false);
  const [convState,      setConvState]      = useState<PanelState>("closed");
  const [convVariant,    setConvVariant]    = useState<DraggableVariant>("float");
  const [convWidth,      setConvWidth]      = useState(360);
  const [convHeight,     setConvHeight]     = useState(860);
  const [convIsResizing, setConvIsResizing] = useState(false);
  const convFloatLeft = useRef<number | null>(null);
  const convFloatTop  = useRef<number | null>(null);
  const convPanelRef  = useRef<HTMLDivElement>(null);
  const convAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Schedule panel state — same shape as Conversations above */
  const [schedOpen,       setSchedOpen]       = useState(false);
  const [schedMounted,    setSchedMounted]    = useState(false);
  const [schedState,      setSchedState]      = useState<PanelState>("closed");
  const [schedVariant,    setSchedVariant]    = useState<DraggableVariant>("float");
  const [schedWidth,      setSchedWidth]      = useState(360);
  const [schedHeight,     setSchedHeight]     = useState(860);
  const [schedIsResizing, setSchedIsResizing] = useState(false);
  const schedFloatLeft = useRef<number | null>(null);
  const schedFloatTop  = useRef<number | null>(null);
  const schedPanelRef  = useRef<HTMLDivElement>(null);
  const schedAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Screen Pop panel state — same shape as Conversations/Schedule above */
  const [popOpen,       setPopOpen]       = useState(false);
  const [popMounted,    setPopMounted]    = useState(false);
  const [popState,      setPopState]      = useState<PanelState>("closed");
  const [popVariant,    setPopVariant]    = useState<DraggableVariant>("float");
  const [popWidth,      setPopWidth]      = useState(360);
  const [popHeight,     setPopHeight]     = useState(860);
  const [popIsResizing, setPopIsResizing] = useState(false);
  const popFloatLeft = useRef<number | null>(null);
  const popFloatTop  = useRef<number | null>(null);
  const popPanelRef  = useRef<HTMLDivElement>(null);
  const popAnimTimer = useRef<ReturnType<typeof setTimeout>>();
  const [screenPopApp, setScreenPopApp] = useState("");

  /* z-index "bring to front" ordering, shared by all five draggable panels */
  const [topPanel, setTopPanel] = useState<"ai" | "notif" | "conversations" | "schedule" | "screenpop" | null>(null);

  /* Interior panel (right) */
  const [interiorPanelOpen, setInteriorPanelOpen] = useState(false);

  /* Interior panel — left ("Customer Information"), toggled from the icon
     next to the customer record header's own Assignments-panel toggle (see
     the divider between them there). Started out as a "Filters" panel
     mirroring lyra-ui's own "Interior Panel — Left" story (Search/Category
     inputs, Reset/Apply footer) — repurposed per instruction into a blank
     customer-info panel instead (headerTitle + headerSubhead only, no
     body/footer content), keeping the same open/close plumbing. */
  const [customerInfoPanelOpen, setCustomerInfoPanelOpen] = useState(false);

  /* Side panel — a single "Assignments" panel shared by every page
     (Desk dashboard, Settings/Search/Directory/pinned-slot, and the
     interaction record view alike). Per instruction, the old separate
     per-interaction `CustomerInformationPanel` (with its own pin/hover-
     preview state) has been removed entirely — this is now the only left
     panel, holding the live `InteractionNavItem` cards that used to live in
     the left nav (see the `header` render below). Plain open/closed
     boolean, no pin/unpin, no hover-preview overlay — defaults closed. */
  const [sidePanelResizing,  setSidePanelResizing]  = useState(false);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(256);
  const [assignmentsPanelOpen, setAssignmentsPanelOpen] = useState(false);

  // Track window width for nav overlay breakpoint
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNavNarrow = windowWidth < 1280;

  // Auto-collapse the expanded nav when viewport drops below 1280px
  useEffect(() => {
    if (isNavNarrow && navOpen) setNavOpen(false);
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Reveal the full nav (labels, cards, the rail's row labels, the "More"
     menu at full width, etc.) on hover once the nav has gone into LeftNav's
     own `overlay` mode (narrow viewport) — see the wrapping div around
     `<LeftNav>` below. LeftNav's overlay branch tracks its own internal
     `hoverOpen` purely to animate the sliding panel's width and to
     auto-inject an `expanded` prop into `pinnedHeader`/`header`'s
     *top-level* children — but nearly everything this file renders there
     is hand-built raw JSX (buttons/Popovers/draggable rows), not a
     component that actually reads an `expanded` prop, so that
     auto-injection silently does nothing for it. Every bit of this file's
     own layout is driven by `navOpen` instead, so the fix is to drive
     `navOpen` itself from hovering the same physical area LeftNav already
     treats as its hover target — kept a no-op outside `isNavNarrow` so the
     normal (wide) layout's click-to-toggle nav behavior is completely
     unaffected. Can't just pass these handlers as props to `<LeftNav>`
     itself — its overlay branch spreads its own `...props` *after* its own
     hardcoded `onMouseEnter`/`onMouseLeave` on the `<aside>`, so anything
     passed in would silently replace (not compose with) LeftNav's own
     hover-driven width animation. */
  const navHoverCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleNavHoverEnter = () => {
    if (!isNavNarrow) return;
    clearTimeout(navHoverCloseTimerRef.current);
    setNavOpen(true);
  };
  const handleNavHoverLeave = () => {
    if (!isNavNarrow) return;
    navHoverCloseTimerRef.current = setTimeout(() => setNavOpen(false), 300);
  };

  // Close and undock any docked panels when viewport drops below 1280px
  useEffect(() => {
    if (isNavNarrow) {
      if (aiVariant === "docked") {
        setAiVariant("float");
        setAiPanelOpen(false);
      }
      if (notifVariant === "docked") {
        setNotifVariant("float");
        setNotifOpen(false);
      }
    }
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_PANEL_HEIGHT = 860;
  const BOTTOM_PADDING   = 8;

  const computePanelHeight = () => {
    if (!containerRef.current) return MAX_PANEL_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);
  };

  /* Timer */
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const formattedTimer = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const handleStatusChange = (status: AgentStatus) => {
    setAgentStatus(status);
    setElapsedSeconds(0);
  };

  /* ── Launching interactions from CreateNew ──
     Overrides OUTBOUND_CONFIG's default onStartCall/onQuickDial (which just
     console.log) so this page actually surfaces what gets launched as
     InteractionNavItem cards in the Assignments panel (see the `header`
     render below — cards no longer live in the left nav itself). Each
     handler below also opens that panel (`setAssignmentsPanelOpen(true)`)
     — a collapsed/closed panel would otherwise hide the card it just
     launched/updated from view entirely, so starting a call always
     surfaces it regardless of whether the panel happened to be closed at
     the time. */
  const handleStartCall = (selection: {
    contact: CreateNewOutboundContact;
    channel: ChannelType;
    phone: string;
    skillId: string;
  }) => {
    const skillLabel = OUTBOUND_CONFIG.skillOptions.find((o) => o.value === selection.skillId)?.label;
    // `phoneOptions` only has a value→label mapping for phone numbers (raw
    // digits → formatted display string) — email/WhatsApp addresses are
    // already human-readable as-is, so falling back to `selection.phone`
    // itself is correct there, not a placeholder.
    const addressLabel = OUTBOUND_CONFIG.phoneOptions.find((o) => o.value === selection.phone)?.label ?? selection.phone;
    const newChannel: TrackedChannel = {
      id: `${selection.channel}:${selection.phone}`,
      type: selection.channel,
      startTick: clockTick,
      preview: skillLabel,
      value: selection.phone,
      addressLabel,
      // A freshly started outbound conversation hasn't exchanged any
      // messages yet — `0` (not omitted) so the tooltip actually reads "0
      // Messages" instead of showing nothing. Voice has no message concept
      // at all, so it's left `undefined` there.
      messageCount: selection.channel === "voice" ? undefined : 0,
      interactionId: generateInteractionId(),
    };

    setInteractions((prev) => {
      const idx = prev.findIndex((i) => i.id === selection.contact.id);
      // No existing interaction with this contact — start a new card.
      if (idx === -1) {
        return [...prev, {
          id: selection.contact.id,
          customerName: selection.contact.name,
          // `subtitle` is the contact's real id (customerId/agentId/
          // TEAM-.../SKL-...) whenever CreateNew's record set one — only
          // missing for records that genuinely have none.
          recordId: selection.contact.subtitle ?? generateCaseId(),
          channels: [newChannel],
          currentChannelId: newChannel.id,
        }];
      }
      // Same contact already has an interaction open — restart the matching
      // channel's timer if this is the *same* type+address (e.g. redialing
      // the same SMS number), or add a new row alongside the existing ones
      // if it's a different address on the same type (e.g. a second SMS
      // thread on a different number) — those are genuinely separate
      // conversations, not a duplicate of the first, so they shouldn't
      // overwrite it.
      return prev.map((interaction, i) => {
        if (i !== idx) return interaction;
        const chIdx = interaction.channels.findIndex((c) => c.id === newChannel.id);
        const channels = chIdx === -1
          ? [...interaction.channels, newChannel]
          : interaction.channels.map((c, j) => (j === chIdx ? newChannel : c));
        // The channel just started/restarted always takes over as current —
        // mirrors InteractionNavItem's own auto-select-newest rule.
        return { ...interaction, channels, currentChannelId: newChannel.id };
      });
    });
    setActiveInteractionId(selection.contact.id);
    setAssignmentsPanelOpen(true);
  };

  const handleQuickDial = (phoneNumber: string) => {
    // No contact record for a quick-dialed number — key the card off the
    // number itself so redialing the same number restarts its card rather
    // than stacking up duplicates.
    const id = `quickdial:${phoneNumber}`;
    // Voice has no message concept at all, so `messageCount` is left
    // undefined here (not `0`).
    const newChannel: TrackedChannel = {
      id: "voice",
      type: "voice",
      startTick: clockTick,
      value: phoneNumber,
      addressLabel: phoneNumber,
      interactionId: generateInteractionId(),
    };
    setInteractions((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return [...prev, { id, recordId: generateCaseId(), channels: [newChannel], currentChannelId: newChannel.id }];
      return prev.map((interaction, i) => (i === idx ? { ...interaction, channels: [newChannel], currentChannelId: newChannel.id } : interaction));
    });
    setActiveInteractionId(id);
    setAssignmentsPanelOpen(true);
  };

  /* ── "New Outbound" now places a card immediately ──
     Per instruction: clicking "New Outbound" should no longer open
     CreateNew's own picker (Favorites/Agents/Teams/Skills/Customers/Dial
     Pad) — it should place a live InteractionNavItem straight into the left
     nav instead. CreateNew itself has no "skip the picker" mode/prop (see
     lyra-ui's create-new.tsx), and per this repo's standing rule this
     prototype never modifies a lyra-ui component to add one — so CreateNew
     stays mounted exactly as-is below (just its own trigger hidden via
     `style={{ display: "none" }}`, the same surface-level pattern already
     used for Screen Pop) so its `launchRequest`/`onLaunchRequestHandled`
     wiring keeps powering each card's own "+" Add Outbound flyout
     unchanged. This handler backs a new, separate trigger button that
     bypasses CreateNew entirely — same shape as `handleQuickDial` (no
     contact record, a fresh generated case id) so every click places its
     own distinct card. */
  const handleQuickAddOutbound = () => {
    const id = `outbound:${generateInteractionId()}`;
    const newChannel: TrackedChannel = {
      id: "chat",
      type: "chat",
      startTick: clockTick,
      messageCount: 0,
      interactionId: generateInteractionId(),
    };
    setInteractions((prev) => [
      ...prev,
      { id, recordId: generateCaseId(), channels: [newChannel], currentChannelId: newChannel.id },
    ]);
    setActiveInteractionId(id);
    setAssignmentsPanelOpen(true);
  };

  /* "Unassign & Dismiss" — `InteractionNavItem` itself decides which of
     these two applies (based on how many channels the card has open when
     it's clicked), so these just need to implement each half:
     `onDismiss` (whole card, only called when just one channel was open —
     nothing would be left of the card otherwise) removes the interaction
     entirely, clearing `activeInteractionId` too if it was the active one so
     the side panel/content area doesn't keep pointing at a card that no
     longer exists. `onDismissChannel` (only called when more than one
     channel was open) drops just that one channel, leaving the rest of the
     card and its other channels open. The `ChannelTab` bar's own kebab wires
     to the same two handlers (see the `activeInteraction` block below), so
     dismissing from a tab behaves identically to dismissing from the card. */
  const handleDismissInteraction = (id: string) => {
    setInteractions((prev) => prev.filter((interaction) => interaction.id !== id));
    setActiveInteractionId((current) => (current === id ? null : current));
  };

  const handleDismissChannel = (id: string, channel: Pick<InteractionChannel, "id" | "type">) => {
    // Match on `id` (falling back to `type`, same as InteractionNavItem's
    // own `channelKey` convention) rather than `type` alone — two open
    // channels can share a `type` (e.g. two SMS threads on different
    // numbers), and filtering by `type` would drop *both* instead of just
    // the one the agent actually dismissed.
    const dismissedKey = channel.id ?? channel.type;
    setInteractions((prev) =>
      prev.map((interaction) => {
        if (interaction.id !== id) return interaction;
        const channels = interaction.channels.filter((c) => (c.id ?? c.type) !== dismissedKey);
        // Dismissing the currently-selected channel needs to hand "current"
        // to another remaining one (the new last channel, same fallback
        // InteractionNavItem itself uses) — otherwise the card/tab bar would
        // keep pointing at a channel that no longer exists.
        const currentChannelId = interaction.currentChannelId === dismissedKey
          ? channels[channels.length - 1]?.id
          : interaction.currentChannelId;
        return { ...interaction, channels, currentChannelId };
      })
    );
  };

  /** Fired by a card row's `onCurrentChannelChange` or a `ChannelTab`'s
   *  `onClick` — both point at this same setter so either one updates the
   *  other (see `ActiveInteraction.currentChannelId`'s own doc comment). */
  const handleChannelSelect = (interactionId: string, channelKey: string) => {
    setInteractions((prev) =>
      prev.map((interaction) =>
        interaction.id === interactionId ? { ...interaction, currentChannelId: channelKey } : interaction
      )
    );
  };

  /* ── Preventing duplicate channels from the CreateNew picker ──
     A contact already reachable via a currently-open channel (e.g. Jamie
     Torres has an SMS interaction open on a specific number) still shows
     that channel in "Select Channel" and every address in the detail
     screen's second field ("Select Phone"/"Select Email Address"/"Select
     WhatsApp Handle") — except whichever exact address(es) are already in
     use, which are disabled so starting another interaction on one of them
     wouldn't just duplicate the one already running (a different outbound
     line for the same channel — or a second, still-unused one, even when
     one SMS number is already open — stays selectable).
     `CreateNewOutboundContact.openChannelAddresses` is exactly the
     mechanism `CreateNew` exposes for this, so rather than adding new
     disabling logic to that shared component, this derives a per-render
     copy of OUTBOUND_CONFIG that tags each contact with every address in
     use for whichever channels they already have open in `interactions`
     (read off each `TrackedChannel.value`, set at start-call time), across
     every group. Recomputed whenever `interactions` changes so an address
     re-enables the moment its interaction is dismissed. */
  const outboundConfig = useMemo<CreateNewOutboundConfig>(() => {
    const openAddressesByContactId = new Map<string, Partial<Record<ChannelType, string[]>>>(
      interactions.map((interaction) => {
        const byType: Partial<Record<ChannelType, string[]>> = {};
        for (const c of interaction.channels) {
          if (!c.value) continue;
          (byType[c.type] ??= []).push(c.value);
        }
        return [interaction.id, byType];
      })
    );
    return {
      ...OUTBOUND_CONFIG,
      groups: OUTBOUND_CONFIG.groups.map((group) => {
        if (!group.contacts) return group;
        return {
          ...group,
          contacts: group.contacts.map((contact) => {
            const openChannelAddresses = openAddressesByContactId.get(contact.id);
            if (!openChannelAddresses || Object.keys(openChannelAddresses).length === 0) return contact;
            return { ...contact, openChannelAddresses };
          }),
        };
      }),
    };
  }, [interactions]);

  // Every "Agent Next Gen" consumer (agent-next-gen-v1, AgentNextGenTemplate.
  // stories.tsx, LeftNav.stories.tsx's "Agent Next Gen Left Nav" story, and
  // this app) wants the exact same "+" behavior on each InteractionNavItem
  // card — look up that interaction's underlying outbound contact, scope
  // the flyout to whatever channels it actually supports (falling back to
  // the full unfiltered list for quick-dialed numbers with no matching
  // contact record), and deep-link a picked channel into CreateNew's
  // `launchRequest`. That's `useOutboundAddButton` (lyra-ui) — a single
  // shared implementation instead of hand-copied ones that could (and did)
  // quietly drift out of sync.
  const { launchRequest: outboundLaunchRequest, onLaunchRequestHandled, getHeaderAction } = useOutboundAddButton(outboundConfig);

  /* Generic open/close state machine, shared by all five draggable panels
     (AI, Notifications, Conversations, Schedule, Screen Pop) — mounts on
     open, transitions through the shared fade/slide animation on close,
     then unmounts. */
  const usePanelOpenEffect = (
    open: boolean,
    setMounted: (v: boolean) => void,
    setState: (v: PanelState) => void,
    setHeight: (v: number) => void,
    setTop: (v: "ai" | "notif" | "conversations" | "schedule" | "screenpop" | null) => void,
    topKey: "ai" | "notif" | "conversations" | "schedule" | "screenpop",
    floatLeft: React.MutableRefObject<number | null>,
    width: number,
    animTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>
  ) => {
    useEffect(() => {
      clearTimeout(animTimer.current);
      if (open) {
        if (containerRef.current && floatLeft.current === null) {
          const r = containerRef.current.getBoundingClientRect();
          floatLeft.current = r.left + containerRef.current.offsetWidth - width - 16;
        }
        setHeight(computePanelHeight());
        setMounted(true);
        setState("open");
        setTop(topKey);
      } else {
        setState("closing");
        animTimer.current = setTimeout(() => setState("closed"), 150);
      }
      return () => clearTimeout(animTimer.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Shrink panel height with viewport when open
    useEffect(() => {
      if (!open) return;
      const onResize = () => setHeight(computePanelHeight());
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
  };

  usePanelOpenEffect(aiPanelOpen, setAiMounted, setAiState, setAiHeight, setTopPanel, "ai", aiFloatLeft, aiWidth, aiAnimTimer);
  usePanelOpenEffect(notifOpen,   setNotifMounted, setNotifState, setNotifHeight, setTopPanel, "notif", notifFloatLeft, notifWidth, notifAnimTimer);
  usePanelOpenEffect(convOpen,     setConvMounted, setConvState, setConvHeight, setTopPanel, "conversations", convFloatLeft, convWidth, convAnimTimer);
  usePanelOpenEffect(schedOpen,   setSchedMounted, setSchedState, setSchedHeight, setTopPanel, "schedule", schedFloatLeft, schedWidth, schedAnimTimer);
  usePanelOpenEffect(popOpen,     setPopMounted, setPopState, setPopHeight, setTopPanel, "screenpop", popFloatLeft, popWidth, popAnimTimer);

  /* Single-dock rule (documented in lyra-ui's draggable.tsx): only one
     panel may be docked at a time. Generalized across all five panels
     instead of pairwise "if AI is docked, force it to float" checks — each
     panel here would otherwise need four near-identical checks (one per
     sibling), which stops scaling the moment a third (or fifth) panel is
     added. `dockPanelExclusively` looks at every *other* panel and floats
     whichever one is currently docked. */
  const dockPanelExclusively = (dockingKey: "ai" | "notif" | "conversations" | "schedule" | "screenpop") => {
    const panels: Record<
      "ai" | "notif" | "conversations" | "schedule" | "screenpop",
      { variant: DraggableVariant; setVariant: (v: DraggableVariant) => void; width: number; floatLeft: React.MutableRefObject<number | null>; floatTop: React.MutableRefObject<number | null> }
    > = {
      ai:            { variant: aiVariant,    setVariant: setAiVariant,    width: aiWidth,    floatLeft: aiFloatLeft,    floatTop: aiFloatTop },
      notif:         { variant: notifVariant, setVariant: setNotifVariant, width: notifWidth, floatLeft: notifFloatLeft, floatTop: notifFloatTop },
      conversations: { variant: convVariant,  setVariant: setConvVariant,  width: convWidth,  floatLeft: convFloatLeft,  floatTop: convFloatTop },
      schedule:      { variant: schedVariant, setVariant: setSchedVariant, width: schedWidth, floatLeft: schedFloatLeft, floatTop: schedFloatTop },
      screenpop:     { variant: popVariant,   setVariant: setPopVariant,   width: popWidth,   floatLeft: popFloatLeft,   floatTop: popFloatTop },
    };
    (Object.keys(panels) as Array<keyof typeof panels>).forEach((key) => {
      if (key === dockingKey) return;
      const p = panels[key];
      if (p.variant === "docked" && containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        p.floatLeft.current = r.left + containerRef.current.offsetWidth - p.width - 16;
        p.floatTop.current  = null; // use computed default top
        p.setVariant("float");
      }
    });
  };

  // When docking: capture actual rendered position (includes CSS transform
  // drag offset) before the float wrapper unmounts — restored when undocking.
  const captureFloatPosition = (
    panelRef: React.RefObject<HTMLDivElement | null>,
    floatLeft: React.MutableRefObject<number | null>,
    floatTop: React.MutableRefObject<number | null>
  ) => {
    if (panelRef.current) {
      const r = panelRef.current.getBoundingClientRect();
      floatLeft.current = r.left;
      floatTop.current  = r.top;
    }
  };

  const handleAiVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(aiPanelRef, aiFloatLeft, aiFloatTop);
      dockPanelExclusively("ai");
    }
    setAiVariant(v);
  };
  const handleNotifVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(notifPanelRef, notifFloatLeft, notifFloatTop);
      dockPanelExclusively("notif");
    }
    setNotifVariant(v);
  };
  const handleConvVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(convPanelRef, convFloatLeft, convFloatTop);
      dockPanelExclusively("conversations");
    }
    setConvVariant(v);
  };
  const handleSchedVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(schedPanelRef, schedFloatLeft, schedFloatTop);
      dockPanelExclusively("schedule");
    }
    setSchedVariant(v);
  };
  const handlePopVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      captureFloatPosition(popPanelRef, popFloatLeft, popFloatTop);
      dockPanelExclusively("screenpop");
    }
    setPopVariant(v);
  };

  // Float position — absolute viewport coordinates, same formula every
  // panel uses (anchored via its own `floatLeft`/`floatTop` refs once set).
  const getFloatStyle = (
    floatLeft: React.MutableRefObject<number | null>,
    floatTop: React.MutableRefObject<number | null>,
    width: number,
    key: "ai" | "notif" | "conversations" | "schedule" | "screenpop"
  ): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = floatLeft.current !== null
      ? floatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - width - 16
        : 0;
    const top = floatTop.current !== null
      ? floatTop.current
      : (rect?.top ?? 0);
    return {
      position: "fixed",
      top,
      left,
      zIndex: topPanel === key ? 10000 : 9999,
    };
  };
  const getAiFloatStyle    = () => getFloatStyle(aiFloatLeft, aiFloatTop, aiWidth, "ai");
  const getNotifFloatStyle = () => getFloatStyle(notifFloatLeft, notifFloatTop, notifWidth, "notif");
  const getConvFloatStyle   = () => getFloatStyle(convFloatLeft, convFloatTop, convWidth, "conversations");
  const getSchedFloatStyle = () => getFloatStyle(schedFloatLeft, schedFloatTop, schedWidth, "schedule");
  const getPopFloatStyle   = () => getFloatStyle(popFloatLeft, popFloatTop, popWidth, "screenpop");

  const notifPanel = notifMounted ? (
    <AgentNotifications
      ref={notifPanelRef}
      notifications={notifications}
      draggableVariant={notifVariant}
      onVariantChange={handleNotifVariantChange}
      onWidthChange={setNotifWidth}
      onResizeStateChange={setNotifIsResizing}
      onInteract={() => setTopPanel("notif")}
      onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
      onClearAll={() => setNotifications([])}
      onDismiss={(id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      onNotificationClick={(n: AgentNotification) =>
        setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))
      }
      onClose={() => setNotifOpen(false)}
      defaultWidth={notifWidth}
      height={notifHeight}
    />
  ) : null;

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      onInteract={() => setTopPanel("ai")}
      userName="John"
      suggestions={[
        { id: "1", label: "Summarise this contact's history" },
        { id: "2", label: "Suggest a response to the customer" },
        { id: "3", label: "What changed since yesterday?" },
      ]}
      onClose={() => setAiPanelOpen(false)}
      className={aiVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  // Conversations/Schedule — blank `DraggablePanel` (lyra-ui), same shape as
  // AI/Notifications above but with no content of its own yet.
  const conversationsPanel = convMounted ? (
    <DraggablePanel
      ref={convPanelRef}
      title="Conversations"
      draggableVariant={convVariant}
      onVariantChange={handleConvVariantChange}
      defaultWidth={convWidth}
      height={convHeight}
      onWidthChange={setConvWidth}
      onResizeStateChange={setConvIsResizing}
      onInteract={() => setTopPanel("conversations")}
      onClose={() => setConvOpen(false)}
      className={convVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  const schedulePanel = schedMounted ? (
    <DraggablePanel
      ref={schedPanelRef}
      title="Schedule"
      draggableVariant={schedVariant}
      onVariantChange={handleSchedVariantChange}
      defaultWidth={schedWidth}
      height={schedHeight}
      onWidthChange={setSchedWidth}
      onResizeStateChange={setSchedIsResizing}
      onInteract={() => setTopPanel("schedule")}
      onClose={() => setSchedOpen(false)}
      className={schedVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  // Screen Pop — `DraggablePanel` (lyra-ui), same shape as
  // Conversations/Schedule above, with a Select to choose which external
  // app to pop the current contact/record into. The Select lives in
  // `headerContent` (fixed above the divider, alongside the title row)
  // rather than the scrollable body, so it stays put — no `label` since
  // the field sits in the header, not a body form, where a label would be
  // redundant.
  const screenPopPanel = popMounted ? (
    <DraggablePanel
      ref={popPanelRef}
      title="Screen Pop"
      draggableVariant={popVariant}
      onVariantChange={handlePopVariantChange}
      defaultWidth={popWidth}
      height={popHeight}
      onWidthChange={setPopWidth}
      onResizeStateChange={setPopIsResizing}
      onInteract={() => setTopPanel("screenpop")}
      onClose={() => setPopOpen(false)}
      className={popVariant === "docked" ? "h-full" : undefined}
      headerContent={
        <Select
          placeholder="Select an app..."
          options={SCREEN_POP_APPS}
          value={screenPopApp}
          onValueChange={setScreenPopApp}
        />
      }
    />
  ) : null;

  /* Assignments panel — toggled closed by the agent doesn't mean "nothing
     to show": with one or more live interactions, it collapses to a narrow
     icon rail (same width as LeftNav's own collapsed rail, 52px) showing
     each InteractionNavItem in its compact avatar-tile form, rather than
     disappearing entirely. Only actually hides (width 0) when there's
     nothing in it to show. */
  const hasAssignments = interactions.length > 0;
  const assignmentsPanelVisible = assignmentsPanelOpen || hasAssignments;
  const ASSIGNMENTS_PANEL_COLLAPSED_WIDTH = 52;

  return (
    <div className="flex flex-col h-screen bg-lyra-bg-surface-shell overflow-hidden animate-in fade-in-0 duration-500">

      {/* ── App Header ──
          Blind-test requirement: no in-app way to tell which "option"
          variant this is, or switch to another one — a plain, static,
          non-interactive brand label (no dropdown, no chevron, no popover),
          unlike lyra-ui's own `AppName` (always a button with a hardcoded
          chevron — see its source's `!compact` branch — so it's hand-built
          here instead rather than fighting that with CSS). Each variant is
          only ever reached via its own direct URL (see App.tsx's router). */}
      <AppHeader
        appName={
          <span className="inline-flex items-center gap-2.5 rounded-lyra-sm p-2 lyra-body-lg-emphasis text-lyra-fg-default">
            Agent Nav Test
          </span>
        }
        actions={
          <>
            {/* Screen Pop / Conversations / Schedule — same hand-rolled
                trigger shape as Notifications/Ask AI (`h-10 w-10
                rounded-lyra-lg text-lyra-fg-default`, Tooltip-wrapped) and
                open the same blank, draggable/dockable `DraggablePanel`
                (lyra-ui) each titled to match its own trigger's label. */}
            <Tooltip content="Screen Pop" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Screen Pop"
                aria-expanded={popOpen}
                onClick={() => setPopOpen((v) => !v)}
                style={{ display: "none" }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                  popOpen && "bg-lyra-state-hover"
                )}
              >
                <MonitorUp className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip content="Conversations" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Conversations"
                aria-expanded={convOpen}
                onClick={() => setConvOpen((v) => !v)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                  convOpen && "bg-lyra-state-hover"
                )}
              >
                <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip content="Schedule" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Schedule"
                aria-expanded={schedOpen}
                onClick={() => setSchedOpen((v) => !v)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                  schedOpen && "bg-lyra-state-hover"
                )}
              >
                <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </Tooltip>
            <NotificationsBell
              notifications={notifications}
              open={notifOpen}
              onOpenChange={setNotifOpen}
              renderPanel={false}
            />
            {/* Sole "Ask AI" entry point. Matches lyra-ui's canonical markup
                exactly, not an approximation: a hand-rolled `<button>`
                (`h-10 w-10 rounded-lyra-lg text-lyra-fg-default`, identical
                to `NotificationsBell`'s own trigger) wrapped in a real
                `Tooltip`, rendering lyra-ui's exported `AiSparkleIcon`. */}
            <Tooltip content="Ask AI" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Ask AI"
                aria-expanded={aiPanelOpen}
                onClick={() => setAiPanelOpen((v) => !v)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                  aiPanelOpen && "bg-lyra-state-hover"
                )}
              >
                <AiSparkleIcon />
              </button>
            </Tooltip>
            {/* Separator between the icon-button row (Screen Pop through Ask
                AI) and AgentProfile — `orientation="vertical"` + `h-auto
                self-stretch` is the same sizing lyra-ui's own vertical
                Divider usage uses so it stretches to match the row's height
                inside AppHeader's `flex items-center` actions container. */}
            <Divider orientation="vertical" className="h-auto self-stretch" />
            <AgentProfile
              name="John Smith"
              initials="JS"
              status={agentStatus}
              onStatusChange={handleStatusChange}
              onDarkModeToggle={handleDarkModeToggle}
              isDarkMode={darkMode}
              timer={formattedTimer}
              // Standalone AppHeader "?" icon removed — this app uses
              // `AgentProfile`'s own conditional "Help" row instead (renders
              // below "Agent Leg Disconnected" whenever `onHelpClick` is
              // passed).
              onHelpClick={() => window.open("https://help.nicecxone.com/content/agent/cxoneagent/cxoneagent.htm?cshid=CXoneAgent", "_blank", "noopener,noreferrer")}
              onLogOut={() => onNavigate?.("option-01")}
              className="ml-1"
            />
          </>
        }
      />

      {/* ── Body: LeftNav + Content ── */}
      {/* overflow-hidden ensures docked panels never push layout past the viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Wraps just `<LeftNav>` (not its siblings — the content column
            next to it) so hovering this exact footprint — the 52px
            collapsed strip, and LeftNav's own absolutely-positioned 256px
            overlay panel once it slides open, both still DOM descendants
            of this div regardless of how far they visually escape its own
            box — can drive `navOpen` itself. See handleNavHoverEnter/
            handleNavHoverLeave's own comment above for why this can't just
            be `onMouseEnter`/`onMouseLeave` props on `<LeftNav>` directly.
            `flex` (not just `flex-shrink-0`) matters here: in overlay mode
            LeftNav's own `<aside>` has no in-flow children of its own (its
            sliding panel is `position: absolute`, so it contributes no
            intrinsic height) — it only gets a real height at all because
            it's normally a *direct* flex item of the row below, stretched
            by that row's default `align-items: stretch`. Wrapping it in a
            plain (non-flex) div broke that stretch chain one level early
            and collapsed the whole rail to zero height; making this
            wrapper itself a flex container passes the stretch through to
            `<LeftNav>` again. */}
        <div className="flex flex-shrink-0" onMouseEnter={handleNavHoverEnter} onMouseLeave={handleNavHoverLeave}>
        <LeftNav
          // This rail is hand-built in `pinnedHeader` below instead (see its
          // own comment) so the "More" button can open a popover — LeftNav's
          // own `items` rendering has no flyout support. `buildNavItems`
          // above is left as unused dead code rather than deleted.
          items={[]}
          open={navOpen}
          onToggle={() => setNavOpen((v) => !v)}
          overlay={isNavNarrow}
          pinnedHeader={
            <>
              {/* New Outbound — per instruction, clicking this no longer
                  opens CreateNew's own picker; it places a fresh
                  InteractionNavItem straight into the nav instead (see
                  handleQuickAddOutbound above). Visually identical to
                  CreateNew's own trigger (same classes/icon/label), copied
                  rather than reused since it's wired to a completely
                  different click behavior. */}
              <Tooltip content="Add Outbound" placement="right" disabled={navOpen}>
                <button
                  type="button"
                  aria-label="New Outbound"
                  onClick={handleQuickAddOutbound}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lyra-sm overflow-hidden",
                    "bg-lyra-bg-primary text-lyra-fg-on-primary transition-all duration-200",
                    "hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                    navOpen ? "w-full px-4" : "w-9 px-0"
                  )}
                >
                  <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span
                    aria-hidden={!navOpen}
                    className={cn(
                      "lyra-body-md overflow-hidden whitespace-nowrap transition-all duration-200",
                      navOpen ? "max-w-[200px] ml-2 opacity-100" : "max-w-0 ml-0 opacity-0"
                    )}
                  >
                    New Outbound
                  </span>
                </button>
              </Tooltip>
              {/* CreateNew stays mounted (hidden) purely to keep each card's
                  own "+" Add Outbound flyout working — see
                  handleQuickAddOutbound's comment above. Hidden on this
                  wrapping div, not via a `style` prop on CreateNew itself:
                  the pinned-header rail is a `flex flex-col gap-2` — a
                  `display:none` on just CreateNew's own inner trigger button
                  still leaves its outer Tooltip/Popover wrapper mounted as a
                  second flex child, so `gap-2` inserted a visible empty gap
                  below the New Outbound button above. A `display:none` div
                  wrapping the whole thing drops out of the flex layout
                  entirely instead, so no gap is reserved for it. */}
              <div style={{ display: "none" }}>
                <CreateNew
                  title="New Outbound"
                  outbound={{
                    ...outboundConfig,
                    onStartCall: handleStartCall,
                    onQuickDial: handleQuickDial,
                    launchRequest: outboundLaunchRequest,
                    onLaunchRequestHandled,
                  }}
                  expanded={navOpen}
                />
              </div>
            </>
          }
          header={
            <>
              {/* The live InteractionNavItem cards used to render here —
                  per instruction, they now live in the "Assignments" side
                  panel instead (see the unified `Panel` render below), so
                  this scroll region holds only the nav rail itself. */}
              {/* Nav rail — sticky to the bottom of this scroll region,
                  same as LeftNav's own native `items` rendering (see
                  left-nav.tsx's own "sticky bottom-0 ... px-2 pb-3" nav-item
                  wrapper): sits in normal flow right after the cards above
                  when there's few of them, then sticks to the bottom of the
                  visible rail once a longer card list would otherwise push
                  it out of view. Hand-built (not `items`) since "More"
                  needs a popover — LeftNav's own built-in rail rendering
                  has no flyout support. */}
              <div
                className={cn(
                  "sticky bottom-0 flex flex-shrink-0 flex-col gap-0.5 bg-lyra-bg-surface-shell pb-3",
                  // Expanded only, extra left room (20px vs. the usual 8px)
                  // for the hover-revealed drag indicator below to sit
                  // fully in the gutter, outside each row's own
                  // hover-background box — the scroll region's own
                  // `overflow-x-hidden` (see left-nav.tsx) clips anything
                  // further left than this padding allows, so the plain
                  // `px-2` used everywhere else isn't wide enough for it.
                  navOpen ? "pl-5 pr-2" : "px-2 items-center"
                )}
              >
                {/* Nav rail — Home, Settings, Search, Directory, the single
                    pinned slot (in whatever order the agent has dragged them
                    to, see `railOrder`), then More (see the rail's own
                    top-of-file comment for why this replaces `items`
                    entirely). No separate drag-handle icon — per
                    instruction, each row is itself the drag surface: press
                    and hold anywhere on a row, then move it up or down. The
                    wrapping `div` (not `NavRailButton` itself) carries the
                    `draggable`/drag event props, so the button underneath
                    stays exactly as it is everywhere else in this file. */}
                {(() => {
                  const railItemMeta: Record<
                    RailItemId,
                    { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }
                  > = {
                    home: {
                      icon: <LayoutDashboard className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />,
                      label: "Dashboard",
                      active: activeStaticPage === "home" && !activeInteraction,
                      onClick: () => { setActiveInteractionId(null); setActiveStaticPage("home"); },
                    },
                    settings: {
                      icon: <Settings className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />,
                      label: "Settings",
                      active: activeStaticPage === "settings",
                      onClick: () => { setActiveInteractionId(null); setActiveStaticPage("settings"); },
                    },
                    // Search/Directory/the pinned record type all show the
                    // same "just a header, blank body" placeholder page as
                    // Settings — see the content column's branch below.
                    search: {
                      icon: <Search className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />,
                      label: "Search",
                      active: activeStaticPage === "search",
                      onClick: () => { setActiveInteractionId(null); setActiveStaticPage("search"); },
                    },
                    directory: {
                      icon: <BookUser className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />,
                      label: "Directory",
                      active: activeStaticPage === "directory",
                      onClick: () => { setActiveInteractionId(null); setActiveStaticPage("directory"); },
                    },
                    pinned: {
                      icon: PINNABLE_NAV_META[pinnedNavId].icon,
                      label: PINNABLE_NAV_META[pinnedNavId].label,
                      active: activeStaticPage === pinnedNavId,
                      onClick: () => { setActiveInteractionId(null); setActiveStaticPage(pinnedNavId); },
                    },
                  };
                  return railOrder.map((id) => (
                    <div
                      key={id}
                      draggable
                      onDragStart={handleRailDragStart(id)}
                      onDragOver={handleRailDragOver(id)}
                      onDrop={(e) => e.preventDefault()}
                      onDragEnd={handleRailDragEnd}
                      className={cn("group relative w-full", draggedRailId === id && "opacity-40")}
                    >
                      {/* Drag indicator — expanded only, hidden until this
                          row is hovered, and positioned in the gutter to
                          the row's *left* rather than inside its own
                          rounded/hover-background box (see the sticky
                          wrapper's own `pl-5` above for why there's room).
                          `pointer-events-none` so it's purely visual — the
                          drag/click surface stays the row itself, unchanged. */}
                      {navOpen && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[-18px] top-1/2 -translate-y-1/2 text-lyra-fg-disabled opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                        </span>
                      )}
                      <NavRailButton
                        icon={railItemMeta[id].icon}
                        label={railItemMeta[id].label}
                        expanded={navOpen}
                        active={railItemMeta[id].active}
                        onClick={railItemMeta[id].onClick}
                      />
                    </div>
                  ));
                })()}
                {/* More — popover listing whichever pinnable records aren't
                    currently in the rail's pinned slot, each with a trailing
                    Pin icon. Picking one swaps it into that slot in place of
                    whatever was there (see this rail's top comment). Tooltip
                    wraps Popover from the outside (not the other way around)
                    — same nesting CreateNew's own trigger uses and documents
                    in lyra-ui's create-new.tsx: Popover's trigger clones its
                    click/ref/aria props onto its immediate child via Radix
                    Slot, which Tooltip can't sit between and still forward. */}
                {/* The actual bug behind "still wrapped in a radix popper"
                    wasn't the Tooltip nesting at all — it was that `Popover`'s
                    own Content box (rounded-lyra-lg/border/shadow, see
                    popover.tsx) and `Menu`'s own root box (the exact same
                    rounded/border/shadow, see menu.tsx) were BOTH rendering
                    their own full chrome at once: a rounded/bordered/shadowed
                    Menu sitting inside an identically rounded/bordered/
                    shadowed Popover.Content, i.e. a real visible box nested in
                    another real visible box. lyra-ui's own create-new.tsx hits
                    this exact combination for `OutboundContactRow`'s channel
                    flyout and solves it by stripping the *inner* Menu's own
                    box styling down to transparent so only Popover.Content's
                    frame is visible — that's what `Menu`'s className below
                    does. The Tooltip is restored (same outside-wrapping
                    pattern CreateNew's own trigger uses), since removing it
                    fixed nothing — the double-box was never a Tooltip
                    problem. */}
                {/* This rail's "More" button itself reflects an unpinned
                    selection too — per instruction, picking a More-menu row
                    that *isn't* the rail's own pinned slot should make "More"
                    read as active and show that row's label in place of the
                    word "More", the same way the pinned slot's own icon
                    already shows whichever record is pinned. Only applies to
                    a pinnable record id that's currently active *and* not the
                    one already pinned — if it were the pinned one, the
                    dedicated pinned-slot button above already shows it as
                    active instead. */}
                {(() => {
                  const isMoreActive =
                    (Object.keys(PINNABLE_NAV_META) as PinnableNavId[]).includes(activeStaticPage as PinnableNavId) &&
                    activeStaticPage !== pinnedNavId;
                  const moreLabel = isMoreActive ? STATIC_PAGE_LABELS[activeStaticPage as PinnableNavId] : "More";
                  return (
                <Tooltip content={moreLabel} placement="right" disabled={navOpen || moreMenuOpen}>
                  <span className="flex w-full justify-center" onMouseEnter={openMoreMenu} onMouseLeave={scheduleCloseMoreMenu}>
                    <Popover
                      open={moreMenuOpen}
                      onOpenChange={setMoreMenuOpen}
                      placement="right"
                      align="end"
                      sideOffset={8}
                      showArrow={false}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      className="z-[10003] w-56 p-1"
                      content={
                        // `MoreMenuRow` (not `Menu`) — see its own comment for
                        // why: each row needs two independent actions.
                        // Clicking the row itself just navigates (sets
                        // `activeStaticPage` to a "{label}" PageHeader,
                        // per instruction) and leaves the rail's pinned slot
                        // untouched. Clicking the Pin button swaps that
                        // record into the pinned slot instead, and
                        // deliberately does *not* navigate/change the page.
                        // `onMouseEnter`/`onMouseLeave` here too — same
                        // dual-region hover handling as the trigger's own
                        // wrapping span above, so moving the cursor off the
                        // button and into this flyout doesn't close it.
                        <div className="flex flex-col" onMouseEnter={openMoreMenu} onMouseLeave={scheduleCloseMoreMenu}>
                          {(Object.keys(PINNABLE_NAV_META) as PinnableNavId[])
                            .filter((id) => id !== pinnedNavId)
                            .map((id) => (
                              <MoreMenuRow
                                key={id}
                                icon={PINNABLE_NAV_META[id].icon}
                                label={PINNABLE_NAV_META[id].label}
                                active={activeStaticPage === id}
                                onSelect={() => {
                                  setActiveInteractionId(null);
                                  setActiveStaticPage(id);
                                  setMoreMenuOpen(false);
                                }}
                                onPin={() => {
                                  setPinnedNavId(id);
                                  setMoreMenuOpen(false);
                                }}
                              />
                            ))}
                        </div>
                      }
                    >
                      {/* No manual onClick here — Radix's own Popover.Trigger
                          (which `<Popover>` wraps this button in via asChild)
                          already composes its own click handler that calls
                          `onOpenChange`/toggles `open` on click alone (see
                          @radix-ui/react-popover's Trigger: `onClick:
                          composeEventHandlers(props.onClick,
                          context.onOpenToggle)`). Adding a second onClick here
                          that also flips `moreMenuOpen` fired both on every
                          click — usually a no-op net toggle, but an
                          unreliable one since Radix's own toggle reads `open`
                          from this render's prop rather than a functional
                          update. Relying on Radix's own composed handler
                          alone (plus `onOpenChange={setMoreMenuOpen}` above)
                          is the single source of truth. */}
                      <button
                        type="button"
                        aria-label={moreLabel}
                        aria-expanded={moreMenuOpen}
                        aria-haspopup="true"
                        className={cn(
                          "relative flex w-full flex-shrink-0 items-center rounded-lyra-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                          navOpen ? "h-9 gap-2.5 px-2.5 lyra-body-md justify-start" : "h-8 w-8 justify-center",
                          isMoreActive
                            ? cn("bg-lyra-bg-active-moderate text-lyra-fg-active-strong", navOpen && "lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle")
                            : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        {navOpen && <span className="flex-1 truncate text-left">{moreLabel}</span>}
                      </button>
                    </Popover>
                  </span>
                </Tooltip>
                  );
                })()}
              </div>
            </>
          }
        />
        </div>

        {/* Content area — flex-1 shrinks to give space to docked panels.
            ref used to position float panels. */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0 overflow-hidden pr-3 pb-3">

          {/* Main Container — flex row so pinned Panel sits left of PageHeader + content.
              relative so unpinned Panel can overlay the full surface. */}
          <Container className="flex flex-1 overflow-hidden relative">

            {/* Assignments panel — the single left panel shared by every
                page (Desk dashboard, Settings/Search/Directory/the pinned
                record, and the interaction record view alike). Per
                instruction the old separate `CustomerInformationPanel`
                (with its own per-interaction pin/hover-preview state) has
                been removed entirely; this is now the only left panel, and
                it holds the live `InteractionNavItem` cards that used to
                render in the left nav's `header` (see LeftNav above).

                No pin button (no `onPinToggle`) and no hover-preview
                handlers — a plain open/closed toggle driven by
                `assignmentsPanelOpen`/`setAssignmentsPanelOpen`, controlled
                by the icon button next to each page's header label.
                Defaults closed. Not gated on `activeInteraction` — it stays
                open/closed independently of which page or interaction is
                showing, so switching between assignments works the same
                whether you're on Desk or already inside one.

                Toggled closed with one or more live interactions doesn't
                hide this panel — it collapses to a narrow icon rail instead
                (`ASSIGNMENTS_PANEL_COLLAPSED_WIDTH`, same as LeftNav's own
                collapsed width) showing each card in compact form
                (`expanded={assignmentsPanelOpen}` below). `pinned` is
                hardcoded true (not tied to `assignmentsPanelOpen`) so this
                always renders through Panel's inline/pushed-layout branch,
                never the absolute-overlay one — a persistent rail, not a
                hover flyout.

                Always mounted (no `assignmentsPanelVisible &&` gate on this
                element itself) — SidePanel's own open/close width transition
                only animates on an already-mounted node; conditionally
                rendering the whole `<SidePanel>` away instead of just letting
                `open` go false made it pop in/out instantly with no
                animation whenever there were zero assignments (the
                regression this comment is fixing). `open={
                assignmentsPanelVisible}` still drives the true "fully
                hidden" case (nothing toggled on, nothing to show as a
                rail) — SidePanel's own inline-pinned branch forces width to 0
                and drops its border exactly when `open` is false, same as
                it always has. Resizing is disabled while collapsed —
                dragging a 52px icon rail wider doesn't make sense. */}
            {showPanelToggle && (
              <SidePanel
                side="left"
                open={assignmentsPanelVisible}
                pinned
                resizable={assignmentsPanelOpen}
                width={assignmentsPanelOpen ? sidePanelWidth : ASSIGNMENTS_PANEL_COLLAPSED_WIDTH}
                onWidthChange={setSidePanelWidth}
                onResizeStateChange={setSidePanelResizing}
              >
                {/* Hand-built in place of `headerTitle` — SidePanel's own header
                    only takes a plain string, which can't render the "(N
                    active)" count in the secondary text color the way
                    01/02's own Assignments label does. Same chrome as
                    SidePanel's built-in header (ContainerHeader, `bordered`
                    off) otherwise: px-4 py-5, lyra-heading-md. */}
                {assignmentsPanelOpen && (
                  <div className="px-4 py-5 shrink-0">
                    <h2 className="lyra-heading-md text-lyra-fg-default truncate">
                      Assignments{" "}
                      <span className="text-lyra-fg-secondary">({interactions.length} active)</span>
                    </h2>
                  </div>
                )}
                {/* Equal left/right padding on this cards container itself
                    (not the "Assignments" header above) — `PanelContent` has
                    no horizontal padding of its own, so without this the
                    cards would sit flush against both edges. Collapsed rail
                    centers the compact tiles instead, matching the nav
                    rail's own icon-only layout. */}
                <div className={cn("flex flex-col", assignmentsPanelOpen ? "px-3" : "items-center px-2 pt-2")}>
                {/* No cards until the agent actually starts one — each card
                    is one contact (or quick-dialed number), with every
                    channel they're being reached on folded into that same
                    card unless it's a different address on an already-open
                    type, which opens as its own row instead (see
                    handleStartCall's merge-by-type+address logic). */}
                {interactions.map((interaction) => {
                  const mostRecentId = interaction.channels[interaction.channels.length - 1]?.id;
                  const currentId = interaction.currentChannelId ?? mostRecentId;
                  const channels: InteractionChannel[] = interaction.channels.map((c) => ({
                    id: c.id,
                    type: c.type,
                    elapsed: formatElapsedTime(clockTick - c.startTick),
                    preview: c.preview,
                    current: c.id === currentId,
                    // Read straight off the tracked channel — not derived
                    // from `type` — so a freshly-started outbound channel
                    // never renders red just for being SMS/chat/email/
                    // WhatsApp instead of voice.
                    awaitingResponse: c.awaitingResponse ?? false,
                  }));
                  const earliestStart = Math.min(...interaction.channels.map((c) => c.startTick));
                  return (
                    <InteractionNavItem
                      key={interaction.id}
                      customerName={interaction.customerName}
                      active={activeInteractionId === interaction.id}
                      onClick={() => setActiveInteractionId(interaction.id)}
                      awaitingResponse={channels.some((c) => c.awaitingResponse)}
                      elapsed={formatElapsedTime(clockTick - earliestStart)}
                      // Compact avatar tile when the panel is collapsed to
                      // its icon rail, full detail card when expanded —
                      // same prop LeftNav's own rail used to drive this
                      // before the cards moved into this panel.
                      expanded={assignmentsPanelOpen}
                      channels={channels}
                      onDismiss={() => handleDismissInteraction(interaction.id)}
                      onDismissChannel={(channel) => handleDismissChannel(interaction.id, channel)}
                      headerAction={
                        <Tooltip content="Delete" placement="top">
                          <button
                            type="button"
                            aria-label="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissInteraction(interaction.id);
                            }}
                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </Tooltip>
                      }
                      // Kept in sync with the ChannelTab bar under this
                      // interaction's record-header PageHeader.
                      currentChannelKey={currentId}
                      onCurrentChannelChange={(key) => handleChannelSelect(interaction.id, key)}
                    />
                  );
                })}
                </div>
              </SidePanel>
            )}

            {/* Content column: PageHeader + page body */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              {activeStaticPage !== "home" ? (
                // ── Settings/Search/Directory/the pinned record's own page
                // — blank for now (no real per-page content built yet),
                // same "just the header, blank body below" placeholder
                // pattern the interaction record view below uses. Takes
                // priority over both Desk and an active interaction, same
                // as the old Settings-only version of this branch did.
                <>
                  {/* Toggle icon for the blank "Assignments" panel above —
                      a plain open/closed switch (no pin/unpin distinction,
                      no hover-preview), driven by `assignmentsPanelOpen`. */}
                  {showPageHeader && (
                    <PageHeader
                      icon={
                        <PanelPinButton
                          pinned={assignmentsPanelOpen}
                          onToggle={() => setAssignmentsPanelOpen((v) => !v)}
                          icon={<PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                          pinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                          unpinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                        />
                      }
                      iconAriaHidden={false}
                      title={STATIC_PAGE_LABELS[activeStaticPage]}
                    />
                  )}
                  <div className="flex-1 overflow-y-auto" />
                </>
              ) : activeInteraction ? (
                // ── Active interaction's detail page — replaces the Desk
                // dashboard the moment a new assignment is started/quick-
                // dialed (see `activeInteraction` above). Just the record
                // header for now; the blank body below is where a real
                // case/contact detail view will go. Reverts back to the
                // dashboard automatically once the interaction is dismissed
                // (`activeInteractionId` clears).
                <>
                  {showPageHeader && (
                    // Hand-built in place of `PageHeader` here: `PageHeader`
                    // always renders its own fixed divider between the
                    // `icon` slot and the title (see lyra-ui's page-header.tsx,
                    // `<div className="h-8 w-px ..." />` — unconditional
                    // whenever `icon` is passed, no prop to suppress it).
                    // Per instruction that divider needs to go, and since
                    // lyra-ui's own source can't be touched, this replicates
                    // PageHeader's exact markup/classes minus that one div —
                    // same pattern already used for the Assignments panel's
                    // hand-built header elsewhere in this file.
                    <div className="flex min-h-[68px] items-center justify-between border-b border-lyra-border-subtle px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center text-lyra-fg-default shrink-0">
                          <div className="flex items-center gap-2">
                            <PanelPinButton
                              pinned={assignmentsPanelOpen}
                              onToggle={() => setAssignmentsPanelOpen((v) => !v)}
                              icon={<PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                              pinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                              unpinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                            />
                            <Divider orientation="vertical" className="h-5" />
                            <PanelPinButton
                              pinned={customerInfoPanelOpen}
                              onToggle={() => setCustomerInfoPanelOpen((v) => !v)}
                              icon={<User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                              pinnedLabel="Customer Information"
                              unpinnedLabel="Customer Information"
                            />
                          </div>
                        </span>
                        <div className="flex flex-col justify-center min-w-0">
                          <h1 className="lyra-heading-lg text-lyra-fg-default leading-tight truncate">
                            {activeInteraction.customerName ?? "Customer"}
                          </h1>
                          <span className="lyra-body-sm text-lyra-fg-secondary truncate">
                            {activeInteraction.recordId}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Per instruction, no channel-tab bar under customer
                      record headers anymore — just the record header above
                      and the body row below (now with the blank "Customer
                      Information" interior panel — left — and a placeholder
                      chat conversation filling the rest; see PlaceholderChat
                      — no real transcript backend yet). */}
                  <div className="relative flex flex-1 overflow-hidden">
                    {showInteriorPanel && (
                      <InteriorPanel
                        side="left"
                        open={customerInfoPanelOpen}
                        headerTitle="Customer Information"
                        headerSubhead={`${activeInteraction.customerName ?? "Customer"} · ${activeInteraction.recordId}`}
                        onClose={() => setCustomerInfoPanelOpen(false)}
                      />
                    )}
                    <PlaceholderChat />
                  </div>
                </>
              ) : (
                <>
                  {/* Same "Assignments" panel toggle icon as the other
                      static-page header above. */}
                  {showPageHeader && (
                    <PageHeader
                      icon={
                        <PanelPinButton
                          pinned={assignmentsPanelOpen}
                          onToggle={() => setAssignmentsPanelOpen((v) => !v)}
                          icon={<PanelLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                          pinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                          unpinnedLabel={sidePanelToggleLabel ?? "Toggle Assignments"}
                        />
                      }
                      iconAriaHidden={false}
                      title="Dashboard"
                    />
                  )}
                  {/* Body row: main content + interior panel.
                      Left intentionally blank — no dashboard sample content
                      shipped with this scaffold (see the task's "leave out
                      the actual mock records" note); this is the "single
                      blank agent page" the app scaffolds to. */}
                  <div className="relative flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto" />
                    {showInteriorPanel && (
                      <InteriorPanel
                        side="right"
                        open={interiorPanelOpen}
                        headerTitle="Case Details"
                        onClose={() => setInteriorPanelOpen(false)}
                      >
                        <div className="flex flex-col gap-4 px-4 py-4">
                          <Input label="Subject" placeholder="Enter subject" />
                          <Input label="Priority" placeholder="Select priority" />
                          <Input label="Assignee" placeholder="Search agents" />
                          <Input label="Tags" placeholder="Add tags" />
                        </div>
                      </InteriorPanel>
                    )}
                  </div>
                </>
              )}
            </div>

          </Container>

          {/* Notifications — float (CSS transitions, not keyframe animations — avoids compositor fill-mode flash) */}
          {notifVariant === "float" && notifMounted && (
            <div
              style={{
                ...getNotifFloatStyle(),
                pointerEvents: "none",
                visibility: notifState === "closed" ? "hidden" : "visible",
                opacity: notifState === "open" ? 1 : 0,
                transform: notifState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: notifState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {notifPanel}
            </div>
          )}

          {/* AI Panel — float (same CSS transition pattern as Notifications) */}
          {aiVariant === "float" && aiMounted && (
            <div
              style={{
                ...getAiFloatStyle(),
                pointerEvents: "none",
                visibility: aiState === "closed" ? "hidden" : "visible",
                opacity: aiState === "open" ? 1 : 0,
                transform: aiState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: aiState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {aiPanel}
            </div>
          )}

          {/* Conversations — float (same CSS transition pattern as Notifications/AI) */}
          {convVariant === "float" && convMounted && (
            <div
              style={{
                ...getConvFloatStyle(),
                pointerEvents: "none",
                visibility: convState === "closed" ? "hidden" : "visible",
                opacity: convState === "open" ? 1 : 0,
                transform: convState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: convState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {conversationsPanel}
            </div>
          )}

          {/* Schedule — float (same CSS transition pattern as Notifications/AI) */}
          {schedVariant === "float" && schedMounted && (
            <div
              style={{
                ...getSchedFloatStyle(),
                pointerEvents: "none",
                visibility: schedState === "closed" ? "hidden" : "visible",
                opacity: schedState === "open" ? 1 : 0,
                transform: schedState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: schedState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {schedulePanel}
            </div>
          )}

          {/* Screen Pop — float (same CSS transition pattern as Notifications/AI) */}
          {popVariant === "float" && popMounted && (
            <div
              style={{
                ...getPopFloatStyle(),
                pointerEvents: "none",
                visibility: popState === "closed" ? "hidden" : "visible",
                opacity: popState === "open" ? 1 : 0,
                transform: popState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: popState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {screenPopPanel}
            </div>
          )}

        </div>

        {/* Notifications — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {notifVariant === "docked" && (
          <div className="pb-3" style={{
            width: notifState === "open" ? notifWidth : 0,
            marginRight: notifState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: notifIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: notifWidth,
                display: notifState === "open" ? "block" : "none",
              }}
            >
              {notifPanel}
            </div>
          </div>
        )}

        {/* Screen Pop — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {popVariant === "docked" && (
          <div className="pb-3" style={{
            width: popState === "open" ? popWidth : 0,
            marginRight: popState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: popIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: popWidth,
                display: popState === "open" ? "block" : "none",
              }}
            >
              {screenPopPanel}
            </div>
          </div>
        )}

        {/* AI Panel — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {aiVariant === "docked" && (
          <div className="pb-3" style={{
            width: aiState === "open" ? aiWidth : 0,
            marginRight: aiState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: aiIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: aiWidth,
                display: aiState === "open" ? "block" : "none",
              }}
            >
              {aiPanel}
            </div>
          </div>
        )}

        {/* Conversations — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {convVariant === "docked" && (
          <div className="pb-3" style={{
            width: convState === "open" ? convWidth : 0,
            marginRight: convState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: convIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: convWidth,
                display: convState === "open" ? "block" : "none",
              }}
            >
              {conversationsPanel}
            </div>
          </div>
        )}

        {/* Schedule — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {schedVariant === "docked" && (
          <div className="pb-3" style={{
            width: schedState === "open" ? schedWidth : 0,
            marginRight: schedState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: schedIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: schedWidth,
                display: schedState === "open" ? "block" : "none",
              }}
            >
              {schedulePanel}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
