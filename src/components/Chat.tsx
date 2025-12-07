import { useCallback, useEffect, useRef, useState } from "react";
import {
  GatewayGroup,
  GatewayGroupMember,
  GroupChatMessage,
} from "../types/gateway";
import { ChatEmojiIcon, ChatSendIcon } from "./icons/Chat";
import { gateway } from "../utils/gateway";
import toast from "react-hot-toast";
import { User } from "../types/api";
import { Op } from "@puff-social/commons";

interface Props {
  group: GatewayGroup;
  members: GatewayGroupMember[];
  chatBoxOpen: boolean;
  user?: User;
}

export function ChatBox(props: Props) {
  const messagesBox = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>();
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);

  const sendMessage = useCallback(() => {
    gateway.send(Op.SendMessage, { content });
    setContent("");
  }, [content]);

  function onMessage(message: GroupChatMessage) {
    setMessages((messages) => {
      if (messages.length == 20) messages.shift();
      setTimeout(
        () =>
          messagesBox.current.scroll({
            behavior: "smooth",
            top: messagesBox.current.scrollHeight,
          }),
        50,
      );
      return [...messages, message];
    });
  }

  function onRateLimit() {
    toast("Rate limited", {
      position: "top-right",
      duration: 2000,
      icon: "❌",
    });
  }

  useEffect(() => {
    messagesBox.current.scroll({
      behavior: "auto",
      top: messagesBox.current.scrollHeight,
    });
  }, [props.chatBoxOpen]);

  useEffect(() => {
    gateway.on("group_message", onMessage);
    gateway.on("rate_limited", onRateLimit);

    return () => {
      gateway.removeListener("group_message", onMessage);
      gateway.removeListener("rate_limited", onRateLimit);
    };
  }, []);

  return (
    <div className="flex flex-col text-black bg-neutral-100 dark:text-white dark:bg-neutral-800 drop-shadow-xl rounded-md m-4 p-2 w-96 justify-center">
      <div className="flex">
        <h1 className="text-lg text-black dark:text-white font-bold">Chat</h1>
      </div>

      <span className="flex flex-col border border-slate-500/10 dark:border-slate-300/10 overflow-hidden rounded-md">
        <div
          className="p-2 pr-4 space-y-2 h-96 overflow-y-scroll"
          ref={messagesBox}
        >
          {messages.map((message) => (
            <div className="flex flex-col" key={message.message.timestamp}>
              <div className="flex justify-between">
                <span>
                  {props.members.find(
                    (mem) => mem.session_id == message.author_session_id,
                  )?.user?.display_name ||
                    props.user?.display_name ||
                    "Unknown User"}
                </span>
                <span>
                  {new Date(message.message.timestamp).toLocaleTimeString(
                    navigator.language || "en-US",
                    { timeStyle: "short" },
                  )}
                </span>
              </div>
              <span>{message.message.content}</span>
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="flex justify-center items-center w-full rounded-md p-2 m-2 border-2 border-slate-500/10 dark:border-slate-300/10 text-black dark:text-white">
            <ChatEmojiIcon className="mx-2 text-neutral-400 hover:text-neutral-900 cursor-pointer" />
            <input
              className="w-full rounded-md bg-transparent text-black dark:text-white outline-none"
              placeholder="Enter a message..."
              value={content}
              maxLength={1024}
              onChange={({ target: { value } }) => setContent(value)}
              onKeyDown={({ code }) => (code == "Enter" ? sendMessage() : null)}
              autoFocus
            />
            <ChatSendIcon
              className="mx-2 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              onClick={() => sendMessage()}
            />
          </div>
        </div>
      </span>
    </div>
  );
}
