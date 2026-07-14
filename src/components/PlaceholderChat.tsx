import { ConversationMessage, ConversationDateStamp, AIInput } from "@nicecxone/lyra-ui";
import { cn } from "@/lib/utils";

/**
 * Placeholder chat conversation shown below the record `PageHeader` in the
 * Customer container whenever an assignment is open, across every Option
 * page — none of these pages have a real transcript/messaging backend
 * wired up yet, so this is static sample content built from lyra-ui's
 * `ConversationMessage`/`ConversationDateStamp` bubbles (see the
 * `FullThread` story in lyra-ui's own Storybook) plus its `AIInput`
 * composer, just so the record view doesn't read as completely blank. Not
 * wired to any real send/receive logic — `AIInput`'s `onSubmit` is a no-op
 * here.
 *
 * Only two of `ConversationMessage`'s four variants are used, per
 * instruction ("only use 2 colors"): `"agent"` (left-aligned, gray) for
 * the customer's side and `"dark"` (right-aligned, primary blue) for the
 * agent's side. The customer avatar/label is the generic "Customer"
 * (initials "C"). The agent is named "John Smith" — its avatar's initials
 * ("JS") are computed from that name in JS (see `getInitials` below)
 * rather than a hardcoded icon or literal string.
 */

const AGENT_NAME = "John Smith";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CustomerAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lyra-bg-surface-shell text-lyra-fg-secondary lyra-label">
      C
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lyra-bg-primary text-lyra-fg-on-primary lyra-label">
      {getInitials(AGENT_NAME)}
    </div>
  );
}

export interface PlaceholderChatProps {
  className?: string;
}

export function PlaceholderChat({ className }: PlaceholderChatProps) {
  return (
    <div className={cn("flex flex-1 flex-col min-h-0", className)}>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5">
          <ConversationDateStamp label="Today" />

          <ConversationMessage
            variant="agent"
            senderName="Customer"
            timestamp="10:41 AM"
            avatar={<CustomerAvatar />}
          >
            Hi, I can't seem to access my account.
          </ConversationMessage>

          <ConversationMessage
            variant="dark"
            senderName={AGENT_NAME}
            timestamp="10:43 AM"
            avatar={<AgentAvatar />}
          >
            I'm happy to help — could you tell me what error message you're seeing?
          </ConversationMessage>

          <ConversationMessage
            variant="agent"
            senderName="Customer"
            timestamp="10:44 AM"
            avatar={<CustomerAvatar />}
            alert="Frustrated sentiment detected"
          >
            It just says "access denied" every single time. Very frustrating.
          </ConversationMessage>

          <ConversationMessage
            variant="dark"
            senderName={AGENT_NAME}
            timestamp="10:45 AM"
            avatar={<AgentAvatar />}
          >
            Your temporary access code is <strong>7829-XK</strong>. Valid for 15 minutes.
          </ConversationMessage>

          <ConversationMessage
            variant="agent"
            senderName="Customer"
            timestamp="10:46 AM"
            avatar={<CustomerAvatar />}
          >
            That worked! Thank you so much.
          </ConversationMessage>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[800px] shrink-0 px-6 pb-4">
        <AIInput placeholder="Type a message..." onSubmit={() => {}} />
      </div>
    </div>
  );
}
