import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ChatLayout } from "@/components/chat/ChatLayout";

export default function EmployeeChat() {
  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Team Chat</h1>
        <ChatLayout />
      </div>
    </EmployeeLayout>
  );
}
