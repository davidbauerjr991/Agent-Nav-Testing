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
  CustomerInformationPanel,
  PanelPinButton,
  PageHeader,
  AiSparkleIcon,
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
  MonitorUp,
  Plus,
  Trash2,
  Search,
  MoreHorizontal,
  Pin,
  CalendarClock,
  Landmark,
  Ticket,
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

/* ── Left nav rail (Option 02 only) ──
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

/** Every row the "More" popover lists — per instruction, *all 9* are
 *  pinnable: Settings/Search/Directory/WEM/Customers/Accounts/Tickets, plus
 *  Conversations and Schedule themselves (so the two header slots' own
 *  current defaults show up "pinned" in this same list, not just whatever
 *  got swapped in). Shared between `MoreMenuRow`'s own icon/label props and
 *  the header's two slot buttons (see `pinnedConversationsSlot`/
 *  `pinnedScheduleSlot` below), so both stay in sync off one source of
 *  truth. */
type MoreMenuId = "conversations" | "schedule" | "settings" | "search" | "directory" | PinnableNavId;

const MORE_MENU_META: Record<MoreMenuId, { label: string; icon: React.ReactNode }> = {
  conversations: { label: "Conversations", icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} /> },
  schedule:      { label: "Schedule",      icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} /> },
  settings:  { label: "Settings",  icon: <Settings className="h-4 w-4" strokeWidth={1.5} /> },
  search:    { label: "Search",    icon: <Search className="h-4 w-4" strokeWidth={1.5} /> },
  directory: { label: "Directory", icon: <BookUser className="h-4 w-4" strokeWidth={1.5} /> },
  wem:       PINNABLE_NAV_META.wem,
  customers: PINNABLE_NAV_META.customers,
  accounts:  PINNABLE_NAV_META.accounts,
  tickets:   PINNABLE_NAV_META.tickets,
};

/** Every static (non-interaction) page the content column can show —
 *  Home/Settings/Search/Directory/whichever record type is pinned, plus
 *  (per instruction) every app-header nav item now opens here too instead
 *  of as a floating/dockable panel: Conversations/Schedule/Screen Pop
 *  (still just a header + blank body, same as Settings/Search/Directory)
 *  and Notifications/Ask AI (which render their own real lyra-ui
 *  components inline — see the content column's own branch below).
 *  Selecting any of these just swaps this and shows the corresponding
 *  page — it does *not* touch `pinnedConversationsSlot`/`pinnedScheduleSlot`/
 *  the "More" popover's pinned rows. Only the pin action does that (see
 *  the More popover's own comment). */
type StaticPageId =
  | "home"
  | "settings"
  | "search"
  | "directory"
  | PinnableNavId
  | "conversations"
  | "schedule"
  | "screenpop"
  | "notifications"
  | "ai";

const STATIC_PAGE_LABELS: Record<StaticPageId, string> = {
  home: "Dashboard",
  settings: "Settings",
  search: "Search",
  directory: "Directory",
  wem: PINNABLE_NAV_META.wem.label,
  customers: PINNABLE_NAV_META.customers.label,
  accounts: PINNABLE_NAV_META.accounts.label,
  tickets: PINNABLE_NAV_META.tickets.label,
  conversations: "Conversations",
  schedule: "Schedule",
  screenpop: "Screen Pop",
  notifications: "Notifications",
  ai: "Ask AI",
};

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
  pinnable = false,
  pinned = false,
  onSelect,
  onPin,
}: {
  icon: React.ReactNode;
  label: string;
  /** This row's own record is the currently active page (selected without
      being pinned) — same active treatment the header's own "Home" button
      uses, so a More-menu selection reads as "selected" here too, not just
      on the header's own "More" trigger (see its own comment below). */
  active?: boolean;
  /** All 9 "More" rows are pinnable (Settings/Search/Directory/Conversations/
   *  Schedule included, not just the 4 record types) — set per-row by the
   *  caller. */
  pinnable?: boolean;
  /** Whether this is the row currently occupying one of the header's two
   *  swappable slots (see `pinnedConversationsSlot`/`pinnedScheduleSlot`) —
   *  true by default for the Conversations/Schedule rows themselves (each
   *  slot's own initial occupant), same as any other row once pinned in.
   *  Option02's rail promoted the pinned record into its own dedicated
   *  rail slot, separate from "More"; here pinning swaps one of the
   *  header's two slots instead — it doesn't move this row anywhere within
   *  the list, just marks it (filled Pin icon). */
  pinned?: boolean;
  onSelect: () => void;
  onPin?: () => void;
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
      {/* Pins this record — filled Pin icon marks whichever one is
          currently pinned (see `pinned` above), and deliberately does *not*
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
      {pinnable && (
        <Tooltip content={pinned ? "Pinned" : "Pin"} placement="right" className="z-[10004]">
          <button
            type="button"
            aria-label={pinned ? `${label} pinned` : `Pin ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onPin?.();
            }}
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lyra-sm transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
              pinned ? "text-lyra-fg-active-strong" : "text-lyra-fg-secondary"
            )}
          >
            <Pin className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" fill={pinned ? "currentColor" : "none"} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

/* ── Option05Page ──
   No login gate or welcome modal in this prototype — every page (this one
   and its sibling Option pages) loads its content directly. Cloned from
   Option02Page.tsx as a starting point, then diverges: Home and the
   Settings/Search/Directory/WEM/Customers/Accounts/Tickets "More" menu both
   move out of the left nav rail into the app header (see the header
   `actions` block below), and the interior "Home" view becomes a
   dockable right-side DraggablePanel that can accompany an active
   interaction instead of being mutually exclusive with it. */

type Page = "option-01" | "option-02" | "option-03" | "option-04" | "option-05";

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

export function Option05Page({
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
  // The app header's two swappable icon slots — the Conversations and
  // Schedule positions each independently accept a pin from any of the 9
  // "More" popover rows (including Conversations/Schedule themselves),
  // replacing that slot's occupant with whichever one is pinned there.
  // Unlike the single-slot mechanic this replaced, there's no "unpinned"
  // `null` state — each slot's own default occupant (Conversations for one,
  // Schedule for the other) is just its *initial* value, and is exactly
  // what these MoreMenuRow reflects as "pinned" by default too (see the
  // More popover's own comment below). Notifications is a separate,
  // ordinary, non-pinnable header icon — not a slot.
  // `togglePinnedHeaderId` (below) is the single entry point every row's
  // Pin button calls; it decides which of these two slots a click affects.
  const [pinnedConversationsSlot, setPinnedConversationsSlot] = useState<MoreMenuId>("conversations");
  const [pinnedScheduleSlot, setPinnedScheduleSlot] = useState<MoreMenuId>("schedule");
  // Single entry point for every "More" row's own Pin button (there's just
  // one per row — no separate "which slot" picker): clicking a row that's
  // already occupying one of the two slots reverts *that* slot back to its
  // own default (Conversations/Schedule respectively) — not to some
  // "nothing pinned" state, since every slot always shows something.
  // Clicking a row that isn't in either slot always pins it into the
  // Conversations slot, shifting whatever was there into the Schedule slot
  // (dropping whatever was in Schedule) — same "always wins, single most-
  // recent pin per slot" behavior the earlier single-slot mechanic used,
  // just spread across two slots now ("allow a user to pin 2 items").
  const togglePinnedHeaderId = (id: MoreMenuId) => {
    if (pinnedConversationsSlot === id) { setPinnedConversationsSlot("conversations"); return; }
    if (pinnedScheduleSlot === id) { setPinnedScheduleSlot("schedule"); return; }
    setPinnedScheduleSlot(pinnedConversationsSlot);
    setPinnedConversationsSlot(id);
  };
  // Left-to-right order of the header's own icon-button group (Conversations
  // through Home) — user-draggable, mirrors Option02's original vertical
  // rail reordering but applied horizontally. "More" and the trailing
  // Divider/AgentProfile are NOT part of this array — they stay fixed at
  // the front/end respectively. A second, static `Divider` is rendered
  // between the "schedule" and "notifications" entries regardless of where
  // dragging has moved them, marking them as the two pinnable slots.
  const [headerIconOrder, setHeaderIconOrder] = useState<string[]>([
    "conversations",
    "schedule",
    "notifications",
    "ai",
    "home",
  ]);
  const [draggedHeaderIconId, setDraggedHeaderIconId] = useState<string | null>(null);
  const handleHeaderIconDragStart = (id: string) => setDraggedHeaderIconId(id);
  const handleHeaderIconDragOver = (overId: string) => {
    setHeaderIconOrder((prev) => {
      if (draggedHeaderIconId === null || draggedHeaderIconId === overId) return prev;
      const fromIndex = prev.indexOf(draggedHeaderIconId);
      const toIndex = prev.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedHeaderIconId);
      return next;
    });
  };
  const handleHeaderIconDragEnd = () => setDraggedHeaderIconId(null);
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
  // Which static (non-interaction) page the app-header nav is currently
  // showing — see `StaticPageId`'s own comment above. Persists across an
  // interaction starting/ending (per instruction: "when a new assignment
  // is opened the navigation should stay the same, not go back to home") —
  // there's deliberately no effect here resetting this to "home" anymore.
  // With no interaction active, this fills the whole content column (see
  // `renderActivePage("full")` below); with one active, it instead docks
  // to the right of the interaction's own record view (`renderActivePage
  // ("docked")`) — same content, just repositioned/resized, not a
  // separate "Home-only" side panel.
  const [activeStaticPage, setActiveStaticPage] = useState<StaticPageId>("home");

  /* ── Right panel (docked, alongside an active interaction) ──
     Whichever static page is active (see above) renders here once an
     interaction starts, instead of being replaced by it. `rightPanelOpen`
     only matters while an interaction is active — with no interaction, the
     active static page is just the plain main view and isn't a separate,
     closable panel at all. Forced back to `true` the moment there's no
     active interaction, so the next interaction always starts with the
     right panel visible again. Per instruction, closing this panel
     (see `renderActivePage`'s own `closeRightPanel`) no longer resets
     `activeStaticPage` back to "home" — it just hides the panel, leaving
     whatever page was showing untouched. So if the last interaction ends
     while this panel is closed, there's still always something to look
     at: `activeStaticPage`'s own last value (not necessarily "home"
     anymore) is what fills the whole column via "full" mode. */
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  useEffect(() => {
    if (!activeInteractionId) setRightPanelOpen(true);
  }, [activeInteractionId]);

  // Dock/undock + drag for the right panel — only meaningful while an
  // assignment is open (see `renderActivePage`'s "docked" mode below;
  // "full" mode, filling the whole content column with nothing to dock
  // beside, stays permanently docked with its chrome hidden). "float"
  // escapes the content row's `overflow-hidden` via a `position: fixed`
  // wrapper positioned at `rightPanelFloatPos` (captured from the docked
  // panel's own on-screen rect at the instant it's undocked) — Draggable's
  // own transform-based float positioning doesn't remove the panel from
  // normal layout flow, so without this it would get clipped the moment
  // it's dragged outside that ancestor.
  const [rightPanelVariant, setRightPanelVariant] = useState<DraggableVariant>("docked");
  const [rightPanelFloatPos, setRightPanelFloatPos] = useState<{ left: number; top: number } | null>(null);
  const rightPanelDockedRef = useRef<HTMLDivElement>(null);
  const handleRightPanelVariantChange = (variant: DraggableVariant) => {
    if (variant === "float" && rightPanelDockedRef.current) {
      const rect = rightPanelDockedRef.current.getBoundingClientRect();
      setRightPanelFloatPos({ left: rect.left, top: rect.top });
    }
    setRightPanelVariant(variant);
  };
  // Reset to docked whenever there's no assignment open, so the next one
  // opened doesn't inherit a stale floated position.
  useEffect(() => {
    if (!activeInteractionId) setRightPanelVariant("docked");
  }, [activeInteractionId]);

  // Last known width of the right panel — persisted independently of which
  // *component* is currently rendering it. AI Assistant/Notifications use
  // real lyra-ui components (`AiPanel`/`AgentNotifications`) that are each
  // a different element type than the generic `DraggablePanel` every other
  // static page shares (and different from each other), so switching to
  // either of them (or back) unmounts/remounts a brand new `Draggable`
  // instance — one whose own internal width state would otherwise always
  // re-initialize from `rightPanelDefaultWidth` (the computed "fill the
  // row" default) rather than whatever width the user had actually left
  // the panel at. Feeding that last-known width back in as each one's own
  // `defaultWidth`/`defaultDraggableWidth` (see `renderActivePage` below)
  // makes it read as the *same* panel keeping its size across those
  // swaps, not a fresh one snapping back to the default — and since every
  // one of them (docked or floating alike) reports back through the same
  // `onWidthChange` here, this one value is shared across dock ⇄ float
  // too, per instruction ("same width for both dragged and docked").
  // `null` until the user (or the initial fill) ever actually sets a
  // width, at which point `renderActivePage` falls back to
  // `rightPanelDefaultWidth` instead.
  const [rightPanelWidth, setRightPanelWidth] = useState<number | null>(null);

  // Selecting any app-header nav destination (Home, a "More" popover row,
  // Conversations/Schedule/Screen Pop/Notifications/Ask AI) — just updates
  // `activeStaticPage` and makes sure the right panel is open if there's an
  // interaction to dock beside; per instruction it no longer also clears
  // `activeInteractionId` the way it used to (that used to be how Settings/
  // Search/etc. "left" the interaction — now the interaction and whichever
  // static page is selected coexist instead).
  //
  // Also captures the *currently rendered* right panel's actual on-screen
  // width (via `rightPanelDockedRef`, whatever it's really measuring right
  // now — not a recomputed theoretical default) into `rightPanelWidth`
  // before swapping pages. Switching to/from AI Assistant or Notifications
  // remounts a brand new `Draggable` instance (different component types —
  // see `rightPanelWidth`'s own comment above), and merely feeding it
  // *the same computed default* isn't reliable: the actual rendered width
  // can differ slightly from that formula (e.g. ordinary flex-shrink while
  // docked), so only reading the real DOM width guarantees the new page
  // starts out truly the same size as whatever was on screen a moment ago
  // — not just "the same size it would have been by default".
  const selectStaticPage = (page: StaticPageId) => {
    if (rightPanelDockedRef.current) {
      const measuredWidth = rightPanelDockedRef.current.getBoundingClientRect().width;
      if (measuredWidth > 0) setRightPanelWidth(measuredWidth);
    }
    setActiveStaticPage(page);
    setRightPanelOpen(true);
  };

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

  const containerRef = useRef<HTMLDivElement>(null);

  // Screen Pop's own "Select an app..." field — previously lived in a
  // `DraggablePanel`'s `headerContent`; now Screen Pop is just another
  // static page (see `activeStaticPage`'s content-column branch below), so
  // this is now plain page state.
  const [screenPopApp, setScreenPopApp] = useState("");

  /* Side panel */
  const [sidePanelOpen,      setSidePanelOpen]      = useState(false);
  const [sidePanelPinned,    setSidePanelPinned]    = useState(false);
  const [sidePanelResizing,  setSidePanelResizing]  = useState(false);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(256);
  const [containerWidth,     setContainerWidth]     = useState(9999);
  const sidePanelTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track container width to force unpinned below 768px
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isNarrowContainer = containerWidth < 768;
  // When narrow: force overlay mode and hide pin button
  const effectivePinned = isNarrowContainer ? false : sidePanelPinned;

  // Docked-only resize direction: per instruction, the *docked* right
  // panel's own width now owns the row's flex-grow (anchoring its right
  // edge to the row's own right edge, same as the page edge) while the
  // interaction column instead absorbs whatever's left — the opposite of
  // the old fixed-420-customer/flex-grow-panel split, and the opposite of
  // resizing "into" the customer column from a left edge that used to sit
  // wherever the customer column's own fixed width happened to end.
  // Floating is deliberately excluded (and left exactly as it already
  // was) — that one keeps the interaction column at flex-1 for its own,
  // different reason (the panel isn't in this row at all once floated),
  // not because of anything to do with docked resize direction.
  const isDockedRightPanel = !!activeInteraction && rightPanelOpen && rightPanelVariant === "docked";
  // The interaction column fills the whole row whenever there's an
  // interaction open, full stop — there's no longer a case where it should
  // sit at a fixed 420px instead. While docked, the *panel*'s own width now
  // owns the resize handle and stays anchored to the row's right edge
  // (`isDockedRightPanel`'s own comment covers that relationship) — this
  // column is the one that grows/shrinks to absorb whatever space the
  // panel *doesn't* take, so it has to be `flex-1` right alongside it, not
  // instead of it. While floating (the panel isn't in this row at all —
  // it renders as its own `position: fixed` overlay below) or closed
  // outright (`rightPanelOpen` false, nothing else in the row at all)
  // there's even less reason for it to stay narrow.
  const interactionColumnFillsRow = !!activeInteraction;

  // Approximates the width the *docked* right panel should start at so it
  // still "fills the row" by default (per the earlier "Notifications
  // should be full screen" requirement), without permanently overriding
  // Draggable's own internal width state the way the old `flex-1` trick
  // did — that made every render force the panel to 100% width regardless
  // of any left-edge resize, which is exactly why it could never be
  // shrunk. This is only ever used as an *initial* value (`defaultWidth`
  // is only read once, at mount), so it doesn't fight subsequent resizing.
  // 420 (interaction column) + 12 (its `pl-3` gap) + 12 (the row's own
  // `pr-3`) = 444px of other content in the row.
  const rightPanelDefaultWidth = Math.max(400, containerWidth - 444);

  // Close (and fully unpin) the Designer panel the moment the container
  // drops below 768px — same "reset state on narrow, don't just hide it
  // visually" pattern as the nav/docked-panel effects below.
  useEffect(() => {
    if (isNarrowContainer) {
      setSidePanelOpen(false);
      setSidePanelPinned(false);
    }
  }, [isNarrowContainer]);

  // The Designer panel belongs to the interaction it was opened from — its
  // only trigger is the record icon on the interaction `PageHeader`, which
  // doesn't exist on the Desk dashboard at all. Leaving the interaction
  // (dismissing it, or navigating to Desk/another tab) must close it the
  // same way narrowing the container does above.
  useEffect(() => {
    if (!activeInteractionId) {
      setSidePanelOpen(false);
      setSidePanelPinned(false);
    }
  }, [activeInteractionId]);

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

  // Undock the right panel when the viewport drops below 1280px, so it
  // doesn't force the (already-narrower) content row down further — same
  // intent as Option02's original per-panel version of this effect, ported
  // to this file's single shared `rightPanelVariant` now that AI/
  // Notifications/every other static page share one right panel instead of
  // each having their own separate docked/floating state. Left over from
  // before that rearchitecture, this used to reference `aiVariant`/
  // `setAiPanelOpen`/`notifVariant`/`setNotifOpen` etc., which no longer
  // exist at all — a stale reference that threw a `ReferenceError` the
  // moment the viewport actually crossed this breakpoint, which is what
  // was crashing the whole page ("everything disappears") on any resize
  // below 1280px. `handleRightPanelVariantChange` (not the raw setter) so
  // this reuses the exact same float-position capture a manual undock
  // click gets.
  useEffect(() => {
    if (isNavNarrow && rightPanelVariant === "docked") {
      handleRightPanelVariantChange("float");
    }
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hovering the icon previews the panel while it's unpinned, exactly like
  // lyra-ui's `Panel.stories.tsx` "Side Panel" story — but per instruction,
  // once pinned this becomes click-only: hover must do *nothing* (not open
  // it back up) while pinned, whether it's currently open or the agent has
  // clicked it closed, so both hover handlers below are guarded on
  // `sidePanelPinned` now, not just the close side.
  const onSidePanelHoverStart = () => {
    if (sidePanelPinned) return;
    clearTimeout(sidePanelTimer.current);
    setSidePanelOpen(true);
  };
  const onSidePanelHoverEnd = () => {
    if (sidePanelPinned) return;
    sidePanelTimer.current = setTimeout(() => setSidePanelOpen(false), 300);
  };
  const handleSidePanelPinToggle = () => {
    setSidePanelPinned((v) => !v);
    setSidePanelOpen(true);
  };
  /* Click on the interaction record icon (see the `icon` prop on that
     PageHeader below) — distinct from `handleSidePanelPinToggle` above
     (the panel's own internal pin button). First click (from the default
     unpinned state) pins the Designer panel open. Once pinned, further
     clicks are a plain open/closed toggle that leaves `pinned` alone — per
     instruction, closing it while pinned must stay pinned (not also
     unpin), so it goes back to being click-only to reopen, not hover
     (see the guards on both hover handlers above). Unpinning is a
     separate, explicit action — the panel's own internal pin button
     (`handleSidePanelPinToggle`), not this icon. */
  const handleSidePanelIconToggle = () => {
    clearTimeout(sidePanelTimer.current);
    if (!sidePanelPinned) {
      setSidePanelPinned(true);
      setSidePanelOpen(true);
      return;
    }
    setSidePanelOpen((wasOpen) => !wasOpen);
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
     InteractionNavItem cards in the left nav. Each handler below also
     expands the nav (`setNavOpen(true)`) — a collapsed rail would otherwise
     hide the card it just launched/updated from view entirely, so starting
     a call always surfaces it regardless of whether the nav happened to be
     collapsed at the time. */
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
    setNavOpen(true);
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
    setNavOpen(true);
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
    setNavOpen(true);
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

  /* ── Unified "active page" container ──
     Per instruction: every app-header nav destination (Home, the "More"
     popover's 7 rows, Conversations/Schedule/Screen Pop/Notifications/Ask
     AI) now renders through this one function, in one of two positions:
     "full" (the sole content, filling the whole content column — no
     interaction active) or "docked" (a panel to the right of the active
     interaction's own, now-narrower record view — same content, just
     relocated/resized, not a separate "Home-only" side panel; see the
     Container/content-column JSX below). Notifications/Ask AI keep their
     own real lyra-ui components (`AgentNotifications`/`AiPanel`); every
     other destination shares one generic `DraggablePanel` shell (with
     Screen Pop's app picker as its only real body content) so they all
     read as "the same container type", per instruction.
     Closability: "docked" (an assignment is open) is always closable —
     per instruction, closing it just hides the panel outright
     (`rightPanelOpen` → false; the interaction itself stays, and
     `activeStaticPage` is deliberately left alone rather than reset to
     "home", so whichever page was showing is what reappears if the panel
     is reopened, or what fills the whole column via "full" mode below if
     the interaction ends while the panel is still closed). "full" (no
     assignment open at all) is never closable — nothing to close it back
     to but itself, regardless of which page it's showing. Every panel's own
     close button stays mounted at all times (`onClose` is always passed,
     never conditionally omitted) — non-closable states hide it with
     `display:none` via the `option05-not-closable` class instead (see
     index.css), same reasoning the earlier Home-only panel used.
     Dock/undock + drag chrome: "full" mode (nothing to dock beside) keeps
     it hidden unconditionally via `.option05-inline-panel` (index.css) —
     nothing there is meant to be dragged loose or floated away. "docked"
     mode (the right panel, alongside an open assignment) instead leaves
     that chrome visible and wires it to `rightPanelVariant`/
     `handleRightPanelVariantChange` above, so it can be undocked and
     dragged — see those two's own comments for why floating needs a
     `position: fixed` wrapper (added at this function's call site, not
     here) rather than relying on Draggable's own in-place transform.
     Width: "full" mode still uses `flex-1` (an explicit `flex-basis`,
     which — per draggable.tsx — takes priority over `width` on the main
     axis of a *row-direction* flex parent) to permanently force it to
     fill the whole content column, since it's the sole view there and was
     never meant to be resized. The "docked"/floating right panel
     deliberately does NOT get `flex-1` any more — that permanently
     overrides Draggable's own internal width state on every render, which
     is exactly why it could never be shrunk; it instead gets
     `rightPanelWidth` (falling back to a computed `rightPanelDefaultWidth`
     the very first time) as each component's own *initial* value, and
     reports every subsequent resize back into that same shared state via
     `onWidthChange` — see `rightPanelWidth`'s own comment above for why a
     plain one-time default isn't enough on its own (AI Assistant/
     Notifications are different component types than the generic
     `DraggablePanel`, so switching to/from them remounts a fresh
     `Draggable` that would otherwise forget any manual resize). Both call
     sites below wrap this in a `flex` (row) div regardless, so "full"'s
     `flex-1` override still applies correctly. */
  const renderActivePage = (mode: "full" | "docked") => {
    const isRightPanel = mode === "docked";
    // Only the right panel (an assignment is open) is ever closable — see
    // this function's own comment above. Closing it hides the panel
    // entirely (`rightPanelOpen` → false) rather than navigating back to
    // Home; "full" mode has nowhere else to go, so it's never closable at
    // all, regardless of `activeStaticPage`.
    const isClosable = isRightPanel;
    const closeRightPanel = () => setRightPanelOpen(false);
    const panelClassName = cn(
      "h-full min-w-0",
      !isRightPanel && "flex-1",
      !isRightPanel && "option05-inline-panel",
      !isClosable && "option05-not-closable"
    );
    const draggableVariant: DraggableVariant = isRightPanel ? rightPanelVariant : "docked";
    const onVariantChange = isRightPanel ? handleRightPanelVariantChange : undefined;
    const resolvedRightPanelWidth = rightPanelWidth ?? rightPanelDefaultWidth;
    const onWidthChange = isRightPanel ? setRightPanelWidth : undefined;

    if (activeStaticPage === "ai") {
      return (
        <AiPanel
          userName="John"
          suggestions={[
            { id: "1", label: "Summarise this contact's history" },
            { id: "2", label: "Suggest a response to the customer" },
            { id: "3", label: "What changed since yesterday?" },
          ]}
          onClose={closeRightPanel}
          className={panelClassName}
          draggable={isRightPanel}
          draggableVariant={draggableVariant}
          onVariantChange={onVariantChange}
          defaultDraggableWidth={isRightPanel ? resolvedRightPanelWidth : undefined}
          onWidthChange={onWidthChange}
        />
      );
    }

    if (activeStaticPage === "notifications") {
      return (
        <AgentNotifications
          notifications={notifications}
          draggableVariant={draggableVariant}
          onVariantChange={onVariantChange}
          defaultWidth={isRightPanel ? resolvedRightPanelWidth : undefined}
          onWidthChange={onWidthChange}
          className={panelClassName}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onClearAll={() => setNotifications([])}
          onDismiss={(id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
          onNotificationClick={(n: AgentNotification) =>
            setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))
          }
          onClose={closeRightPanel}
        />
      );
    }

    // Home/Settings/Search/Directory/pinnable/Conversations/Schedule/Screen Pop
    return (
      <DraggablePanel
        title={STATIC_PAGE_LABELS[activeStaticPage]}
        defaultWidth={isRightPanel ? resolvedRightPanelWidth : undefined}
        onWidthChange={onWidthChange}
        draggableVariant={draggableVariant}
        onVariantChange={onVariantChange}
        className={panelClassName}
        onClose={closeRightPanel}
      >
        {activeStaticPage === "screenpop" ? (
          <div className="max-w-xs">
            <Select
              placeholder="Select an app..."
              options={SCREEN_POP_APPS}
              value={screenPopApp}
              onValueChange={setScreenPopApp}
            />
          </div>
        ) : undefined}
      </DraggablePanel>
    );
  };

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
            {/* "More" — per instruction, Settings/Search/Directory/WEM/
                Customers/Accounts/Tickets (and the rail's old pin
                mechanism) move out of the left nav entirely and into the
                app header, as its own leftmost action icon. Same
                Popover-on-hover + `MoreMenuRow` list this used to render
                inside LeftNav's own bottom rail (see `MoreMenuRow`'s own
                comment) — just relocated here, with all 7 destinations
                always listed (not "whichever 3 aren't pinned") since there's
                no longer a separate dedicated rail slot for the pinned one
                to occupy instead. */}
            {(() => {
              // Deliberately just these 7 (not Conversations/Schedule,
              // which — even though they're *also* listed as rows in this
              // same popover now — have their own dedicated header slot
              // buttons below and should read as active there instead; nor
              // Screen Pop/Notifications/Ask AI, which have their own
              // dedicated header buttons too). Also excludes whichever one
              // is currently pinned into either of the header's two
              // swappable slots below — those buttons (not "More") are
              // what should read as active when showing that page,
              // matching Option02's "pins don't display as active [on
              // More], they just switch out of the menu" behavior.
              const MORE_MENU_PAGES: StaticPageId[] = ["settings", "search", "directory", "wem", "customers", "accounts", "tickets"];
              const isMoreActive =
                (MORE_MENU_PAGES as string[]).includes(activeStaticPage) &&
                activeStaticPage !== pinnedConversationsSlot &&
                activeStaticPage !== pinnedScheduleSlot;
              const moreLabel = isMoreActive ? STATIC_PAGE_LABELS[activeStaticPage] : "More";
              return (
                <Tooltip content={moreLabel} placement="bottom" asLabel disabled={moreMenuOpen}>
                  <span onMouseEnter={openMoreMenu} onMouseLeave={scheduleCloseMoreMenu}>
                    <Popover
                      open={moreMenuOpen}
                      onOpenChange={setMoreMenuOpen}
                      placement="bottom"
                      align="start"
                      sideOffset={8}
                      showArrow={false}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      className="z-[10003] w-56 p-1"
                      content={
                        <div className="flex flex-col" onMouseEnter={openMoreMenu} onMouseLeave={scheduleCloseMoreMenu}>
                          {/* All 9 rows (including Conversations/Schedule
                              themselves) are pinnable — pinning one always
                              lands it in the Conversations slot, shifting
                              whatever was there into the Schedule slot
                              (dropping whatever was in Schedule); clicking a
                              row that's already in either slot reverts just
                              that slot to its own default instead. See
                              `togglePinnedHeaderId`'s own comment above for
                              the exact rule. Conversations/Schedule show as
                              "pinned" by default here since they're each
                              slot's own initial occupant — same
                              single-slot-replace semantics Option02's rail
                              pin used, just split across two slots now
                              ("allow a user to pin 2 items"). */}
                          {(Object.keys(MORE_MENU_META) as MoreMenuId[]).map((id) => (
                            <MoreMenuRow
                              key={id}
                              icon={MORE_MENU_META[id].icon}
                              label={MORE_MENU_META[id].label}
                              active={activeStaticPage === id}
                              pinnable
                              pinned={pinnedConversationsSlot === id || pinnedScheduleSlot === id}
                              onSelect={() => { selectStaticPage(id); setMoreMenuOpen(false); }}
                              onPin={() => togglePinnedHeaderId(id)}
                            />
                          ))}
                        </div>
                      }
                    >
                      {/* No manual onClick — Radix's own Popover.Trigger
                          (via asChild) already composes the click→toggle
                          handler; see the rail's original More button for
                          why a second one here would double-fire. */}
                      <button
                        type="button"
                        aria-label={moreLabel}
                        aria-expanded={moreMenuOpen}
                        aria-haspopup="true"
                        className={cn(
                          "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                          isMoreActive
                            ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
                            : cn("text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed", moreMenuOpen && "bg-lyra-state-hover")
                        )}
                      >
                        <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </Popover>
                  </span>
                </Tooltip>
              );
            })()}
            {/* Screen Pop — still hidden (`display: none`), not part of the
                draggable icon group below since there's nothing visible to
                reorder. Per instruction, every app-header nav item opens in
                the main content area (see `activeStaticPage`'s content-
                column branch) instead of as a floating/dockable panel. */}
            <Tooltip content="Screen Pop" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Screen Pop"
                aria-expanded={activeStaticPage === "screenpop"}
                onClick={() => selectStaticPage("screenpop")}
                style={{ display: "none" }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                  activeStaticPage === "screenpop" && "bg-lyra-state-hover"
                )}
              >
                <MonitorUp className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </Tooltip>
            {/* The draggable icon group: Conversations, Schedule,
                Notifications, Ask AI, Home — user can drag any of these to
                reorder them (see `headerIconOrder`/`handleHeaderIcon
                Drag*` above); "More" (before this group) and the trailing
                Divider/AgentProfile (after it) stay fixed. Each button keeps
                its own hand-rolled shape/Tooltip as before — only now
                looked up by id and rendered in `headerIconOrder`'s
                sequence, wrapped in a `draggable` div that dims
                (`opacity-40`) whichever one is mid-drag. A second, static
                `Divider` (see the end of this `.map()`) always renders
                right after "schedule", marking the Conversations/Schedule
                pair as the two pinnable slots regardless of where dragging
                has moved them. */}
            {headerIconOrder.map((id) => {
              let content: React.ReactNode;

              // Shared active/inactive class pair every header icon button
              // below now uses — per instruction, "use the same active
              // background... as the Home active state (primary blue)"
              // for all of them, not just Home: a persistent
              // `bg-lyra-bg-active-moderate`/`text-lyra-fg-active-strong`
              // treatment while active, instead of the transient
              // hover-only tint these used before.
              const headerIconButtonClassName = (isActive: boolean) => cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                isActive
                  ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
                  : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
              );

              if (id === "conversations") {
                // Swappable slot #1 (per instruction: "allow a user to pin
                // 2 items" — this is one of the two). Defaults to
                // Conversations when nothing else is pinned; any "More" row
                // (including the Conversations/Schedule rows themselves)
                // can be pinned here instead (see the More popover above
                // and `togglePinnedHeaderId`), replacing this icon/label/
                // destination.
                content = (
                  <Tooltip content={MORE_MENU_META[pinnedConversationsSlot].label} placement="bottom" asLabel>
                    <button
                      type="button"
                      aria-label={MORE_MENU_META[pinnedConversationsSlot].label}
                      aria-expanded={activeStaticPage === pinnedConversationsSlot}
                      onClick={() => selectStaticPage(pinnedConversationsSlot)}
                      className={headerIconButtonClassName(activeStaticPage === pinnedConversationsSlot)}
                    >
                      {MORE_MENU_META[pinnedConversationsSlot].icon}
                    </button>
                  </Tooltip>
                );
              } else if (id === "schedule") {
                // Swappable slot #2 — same mechanic as "conversations"
                // above, just defaulting to Schedule instead.
                content = (
                  <Tooltip content={MORE_MENU_META[pinnedScheduleSlot].label} placement="bottom" asLabel>
                    <button
                      type="button"
                      aria-label={MORE_MENU_META[pinnedScheduleSlot].label}
                      aria-expanded={activeStaticPage === pinnedScheduleSlot}
                      onClick={() => selectStaticPage(pinnedScheduleSlot)}
                      className={headerIconButtonClassName(activeStaticPage === pinnedScheduleSlot)}
                    >
                      {MORE_MENU_META[pinnedScheduleSlot].icon}
                    </button>
                  </Tooltip>
                );
              } else if (id === "notifications") {
                // Ordinary, non-pinnable header icon — not a slot. Its
                // active-state background comes from a CSS override (see
                // `.option05-primary-active-icons` in index.css) instead of
                // a `className` prop — `NotificationsBell` hardcodes its
                // own `open && "bg-lyra-state-hover"` internally with no
                // way to override just that piece from here.
                content = (
                  <NotificationsBell
                    notifications={notifications}
                    open={activeStaticPage === "notifications"}
                    onOpenChange={(next) => selectStaticPage(next ? "notifications" : "home")}
                    renderPanel={false}
                    className="option05-primary-active-icon"
                  />
                );
              } else if (id === "ai") {
                content = (
                  <Tooltip content="Ask AI" placement="bottom" asLabel>
                    <button
                      type="button"
                      aria-label="Ask AI"
                      aria-expanded={activeStaticPage === "ai"}
                      onClick={() => selectStaticPage("ai")}
                      className={headerIconButtonClassName(activeStaticPage === "ai")}
                    >
                      <AiSparkleIcon />
                    </button>
                  </Tooltip>
                );
              } else {
                // "home"
                const isHomeActive = activeStaticPage === "home";
                content = (
                  <Tooltip content="Dashboard" placement="bottom" asLabel>
                    <button
                      type="button"
                      aria-label="Dashboard"
                      aria-current={isHomeActive ? "page" : undefined}
                      onClick={() => selectStaticPage("home")}
                      className={headerIconButtonClassName(isHomeActive)}
                    >
                      <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </Tooltip>
                );
              }

              return (
                <React.Fragment key={id}>
                  <div
                    draggable
                    onDragStart={() => handleHeaderIconDragStart(id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleHeaderIconDragOver(id);
                    }}
                    onDrop={(e) => e.preventDefault()}
                    onDragEnd={handleHeaderIconDragEnd}
                    className={cn(draggedHeaderIconId === id && "opacity-40")}
                  >
                    {content}
                  </div>
                  {/* Static marker for the two pinnable slots — always
                      rendered right after "schedule" regardless of where
                      dragging has moved either of them, per instruction
                      ("add a divider between notifications and schedule
                      icon"). */}
                  {id === "schedule" && (
                    <Divider orientation="vertical" className="h-5 self-center" />
                  )}
                </React.Fragment>
              );
            })}
            {/* Separator between the icon-button row (More through Home)
                and AgentProfile — `orientation="vertical"` + `h-auto
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
              {/* Section label + divider above the cards — collapsed nav has
                  no room for either (matches every other text label in the
                  pinned header/rail, which also only appears when
                  `navOpen`). Divider sits below the label here (per
                  instruction) rather than above it like 01's. Sticky to the
                  top of this scroll region (not the cards below it) so it
                  stays put — flush under the pinned "New Outbound" button
                  above, which lives outside this scrollable area entirely —
                  rather than scrolling away with the cards. Own background
                  so scrolled-under cards don't show through. */}
              {navOpen && (
                <div className="sticky top-0 z-10 bg-lyra-bg-surface-shell">
                  <div className="pb-2 lyra-heading-sm">
                    <span className="text-lyra-fg-default font-semibold">Assignments</span>{" "}
                    <span className="text-lyra-fg-secondary">({interactions.length} active)</span>
                  </div>
                  <Divider className="mb-2" />
                </div>
              )}
              {/* No cards until the agent actually starts one above — each
                  card is one contact (or quick-dialed number), with every
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
                  // Read straight off the tracked channel — not derived from
                  // `type` — so a freshly-started outbound channel never
                  // renders red just for being SMS/chat/email/WhatsApp
                  // instead of voice.
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
                    expanded={navOpen}
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
            </>
          }
        />
        </div>

        {/* Content area — flex-1 shrinks to give space to docked panels.
            ref used to position float panels. */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0 overflow-hidden pr-3 pb-3">

          {/* Main Container — flex row so pinned Panel sits left of the
              interaction's own record view. relative so an unpinned Panel
              can overlay the full surface. Per instruction, this no longer
              grows to fill the whole content area once an interaction is
              active (`flex-shrink-0` + a fixed width on its content column
              below instead) — it shrinks down to just the interaction's own
              compact record view, and `renderActivePage("docked")` (see its
              own comment above) takes the rest of the row as a separate
              sibling card, matching the reference screenshot's "customer
              card + separate Home card to its right" layout, rather than
              being squeezed inside this same Container as a narrow sidebar.
              Per instruction, that no longer holds whenever there's a right
              panel to make room for (`interactionColumnFillsRow` above) —
              docked (its width now owns the row's resize handle instead —
              see `isDockedRightPanel`'s own comment) or floating (it isn't
              occupying any space in this row at all once undocked — see
              its own `position: fixed` render below) — so this container
              instead takes the whole row back in both cases, same as
              having no right panel at all. `min-w-[380px]` matters for the
              same reason the interior column below needs its own copy —
              `overflow-hidden` on a flex item resolves its *automatic*
              min-width to 0 (the min-content size only applies when
              overflow is `visible`), so without an explicit floor *here
              too*, this Container itself can still get squeezed thinner
              than 380px by the row's other flex items (like `LeftNav`
              expanding) — its interior column's own `min-w-[380px]` alone
              can't prevent that, since it only stops *that div* from
              shrinking, not the `overflow-hidden` `Container` clipping it
              from the outside once `Container` itself has already been
              squeezed narrower. */}
          <Container className={cn("flex overflow-hidden relative min-w-[380px]", activeInteraction && !interactionColumnFillsRow ? "flex-shrink-0" : "flex-1")}>

            {/* Customer Information Panel — one instance whose `pinned` prop
                just flips Panel's own internal inline-vs-overlay branch.
                Gated on `activeInteraction`, not just `showPanelToggle` —
                its only trigger is the record icon on the interaction
                `PageHeader` below, which doesn't exist on the Desk
                dashboard. */}
            {showPanelToggle && activeInteraction && (
              <CustomerInformationPanel
                side="left"
                open={sidePanelOpen}
                pinned={effectivePinned}
                person={{ name: activeInteraction.customerName ?? "Customer", id: activeInteraction.recordId }}
                onPinToggle={isNarrowContainer ? undefined : handleSidePanelPinToggle}
                width={sidePanelWidth}
                onWidthChange={setSidePanelWidth}
                onResizeStateChange={setSidePanelResizing}
                onMouseEnter={onSidePanelHoverStart}
                onMouseLeave={sidePanelResizing ? undefined : onSidePanelHoverEnd}
              />
            )}

            {activeInteraction ? (
              // ── Active interaction's detail page — a fixed-width
              // (not flex-1 — see the `Container` comment above), compact
              // record view now that `renderActivePage("docked")` occupies
              // the rest of the row as its own card instead of squeezing in
              // here. Replaces the Desk dashboard the moment a new
              // assignment is started/quick-dialed (see `activeInteraction`
              // above); reverts back to `renderActivePage("full")` filling
              // the whole content column automatically once the
              // interaction is dismissed (`activeInteractionId` clears).
              // Also stretches to fill the row (`interactionColumnFillsRow`,
              // same condition as the `Container` wrapper above) whenever a
              // right panel is present — docked (per instruction, dragging
              // its own left edge now grows/shrinks *this* column instead
              // of the panel keeping a fixed 420px regardless — see
              // `isDockedRightPanel`'s own comment) or floating (unchanged;
              // it isn't sitting beside this column in the row at all).
              // `min-w-[380px]` (not `min-w-0`) so a newly-opened
              // assignment never gets squeezed thinner than that — with a
              // brand new interaction, `LeftNav` is opening (`navOpen`) in
              // the same render pass, and without a floor here this column
              // (a `flex-1` item competing for the same, now-narrower row)
              // could get momentarily scrunched well below a usable width
              // while that reflows in.
              <div className={cn("flex flex-col overflow-hidden", interactionColumnFillsRow ? "flex-1 min-w-[380px]" : "w-[420px] flex-shrink-0")}>
                {showPageHeader && (
                  <PageHeader
                    // Hovering this record icon reveals the Designer side
                    // panel. Clicking it is a real on/off toggle —
                    // `handleSidePanelIconToggle` — pins it open on the
                    // first click, and unpins *and closes* it on the next.
                    // The button itself is `PanelPinButton` — the exact
                    // same trigger `Panel`'s own internal pin button uses,
                    // just with its `icon` swapped from `Pin` to `User`.
                    icon={
                      <span
                        onMouseEnter={onSidePanelHoverStart}
                        onMouseLeave={sidePanelResizing ? undefined : onSidePanelHoverEnd}
                      >
                        <PanelPinButton
                          pinned={sidePanelPinned}
                          onToggle={handleSidePanelIconToggle}
                          icon={<User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
                          pinnedLabel={sidePanelToggleLabel ?? "Toggle Overview"}
                          unpinnedLabel={sidePanelToggleLabel ?? "Toggle Overview"}
                        />
                      </span>
                    }
                    iconAriaHidden={false}
                    title={activeInteraction.customerName ?? "Customer"}
                    subtitle={activeInteraction.recordId}
                  />
                )}
                {/* Per instruction, no channel-tab bar under customer
                    record headers anymore — just the record header above
                    and a placeholder chat conversation below (see
                    PlaceholderChat — no real transcript backend yet). */}
                <PlaceholderChat />
              </div>
            ) : (
              // ── No interaction at all — `renderActivePage("full")` is
              // the sole view, filling the whole content column. Wrapped in
              // a row-direction flex div (not flex-col) so its own
              // `flex-1 min-w-0` can actually override the panel's fixed
              // docked width (see `renderActivePage`'s own comment above).
              <div className="flex flex-1 min-w-0 overflow-hidden">
                {renderActivePage("full")}
              </div>
            )}

          </Container>

          {/* Whichever static page is active — docked to the right of the
              interaction's own (now compact) record view above, as its own
              separate card, instead of a narrow sidebar squeezed inside
              `Container`. Closable here (closing it just hides this panel,
              it doesn't touch the interaction) — comes back automatically
              the moment there's no interaction left at all (`activeStatic-
              Page`'s own default of "home" then fills the whole content
              column instead — see `rightPanelOpen`'s own effect above), and
              can always be reopened sooner via the header's own nav
              buttons. Also now dockable/undockable/draggable (see
              `rightPanelVariant` above) — while docked it's this flex
              sibling like before (`rightPanelDockedRef` measures it here so
              `handleRightPanelVariantChange` knows where to float it from);
              once undocked it instead renders as a `position: fixed`
              overlay at that captured position, entirely outside this row
              (and its `overflow-hidden` ancestor), so it can be dragged
              anywhere on screen instead of being clipped at this row's
              edge. Per instruction, this wrapper is deliberately NOT
              `flex-1` any more while docked — the interaction column now
              owns the row's flex-grow instead (`interactionColumnFillsRow`
              above), so this one just sizes to its own content (the panel's
              own `defaultWidth`/resized width, set inside `renderActive
              Page`), which is what anchors its right edge flush with the
              row's own right edge (the last, non-growing item in the row)
              and makes dragging its left-edge resize handle grow/shrink
              *it* while the interaction column grows/shrinks the opposite
              way to compensate — this doesn't apply to the floating branch
              above at all, which is unrelated to this row's flex sizing in
              the first place. */}
          {activeInteraction && rightPanelOpen && (
            rightPanelVariant === "float" && rightPanelFloatPos ? (
              <div
                style={{ position: "fixed", left: rightPanelFloatPos.left, top: rightPanelFloatPos.top, zIndex: 9999 }}
              >
                {renderActivePage("docked")}
              </div>
            ) : (
              <div ref={rightPanelDockedRef} className="flex min-w-0 pl-3">
                {renderActivePage("docked")}
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}
