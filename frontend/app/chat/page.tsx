import { Button, Input } from "@mantine/core";
import { Send } from "@deemlol/next-icons";

const Chat = () => {
  return (
    <div className="mx-10 my-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Your Personal trading analyst</h1>
      </div>
      <div className="border border-white min-h-100 rounded-2xl"></div>
      <div className="mt-5 flex w-full gap-5">
        <Input />
        <Button variant="outline" color="lime" size="md">
          <Send />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
