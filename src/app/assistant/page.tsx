import ChatPanel from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        Career Assistant
      </h1>
      <ChatPanel />
    </main>
  );
}
