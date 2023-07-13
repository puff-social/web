import { EventEmitter } from "events";
import { inflate, deflate } from "pako";

import { store } from "../state/store";
import { APIGroup } from "../types/api";
import {
  GatewayError,
  GatewayGroup,
  GatewayGroupCreate,
  GatewayGroupAction,
  GroupActionInitiator,
  GroupReaction,
  GroupUserDeviceDisconnect,
  GroupUserDeviceUpdate,
  GroupUserJoin,
  GroupUserLeft,
  GroupUserUpdate,
  GroupChatMessage,
  GatewayGroupUserAwayState,
  GroupHeatBegin,
  GroupHeatInquire,
  GroupState,
  GatewayWatchedDeviceUpdate,
} from "../types/gateway";
import { Event, Op } from "@puff-social/commons";
import {
  GroupState as GroupStateInterface,
  addGroupMember,
  removeGroupMember,
  resetGroupState,
  setGroupState,
  updateGroupMember,
  updateGroupMemberDevice,
  updateGroupState,
} from "../state/slices/group";
import { instance } from "../pages/[id]";
import { PuffLightMode } from "./puffco/constants";

interface SocketData {
  session_id?: string;
  session_token?: string;
  heartbeat_interval?: number;
}

interface SocketMessage {
  op: Op;
  t?: Event;
  d?: SocketData | { [key: string]: any };
}

export interface Gateway {
  ws: WebSocket;
  heartbeat: NodeJS.Timer;

  new_session_id: string;
  session_id: string;
  session_token: string;

  connectionAttempt: number;
  connectionTimeout: NodeJS.Timeout | null;

  url: string;
  encoding: string; // 'etf' | 'json'
  compression: string; // 'zlib' | 'none'

  on(event: "init", listener: () => void): this;
  on(event: "connected", listener: () => void): this;
  on(event: "hello", listener: () => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "joined_group", listener: (group: GatewayGroup) => void): this;
  on(event: "group_join_error", listener: (error: GatewayError) => void): this;
  on(
    event: "group_visibility_change",
    listener: (action: GroupActionInitiator & { visibility: string }) => void
  ): this;
  on(event: "group_user_join", listener: (group: GroupUserJoin) => void): this;
  on(event: "group_user_left", listener: (group: GroupUserLeft) => void): this;
  on(
    event: "group_create",
    listener: (group: GatewayGroupCreate) => void
  ): this;
  on(event: "group_update", listener: (group: GatewayGroup) => void): this;
  on(
    event: "group_delete",
    listener: (group: GatewayGroupAction) => void
  ): this;
  on(
    event: "group_user_update",
    listener: (group: GroupUserUpdate) => void
  ): this;
  on(
    event: "group_user_device_update",
    listener: (group: GroupUserDeviceUpdate) => void
  ): this;
  on(
    event: "group_user_device_disconnect",
    listener: (group: GroupUserDeviceDisconnect) => void
  ): this;
  on(
    event: "group_action_error",
    listener: (error: GatewayError) => void
  ): this;
  on(
    event: "group_heat_inquiry",
    listener: (group: GroupHeatInquire) => void
  ): this;
  on(event: "group_heat_begin", listener: (heat: GroupHeatBegin) => void): this;
  on(
    event: "group_user_ready",
    listener: (action: GroupActionInitiator) => void
  ): this;
  on(
    event: "group_user_unready",
    listener: (action: GroupActionInitiator) => void
  ): this;
  on(
    event: "public_groups_update",
    listener: (groups: APIGroup[]) => void
  ): this;
  on(
    event: "group_create_error",
    listener: (error: GatewayError) => void
  ): this;
  on(
    event: "group_message",
    listener: (message: GroupChatMessage) => void
  ): this;
  on(
    event: "group_reaction",
    listener: (reaction: GroupReaction) => void
  ): this;
  on(
    event: "group_user_kicked",
    listener: (group: GatewayGroupAction) => void
  ): this;
  on(
    event: "group_user_away_state",
    listener: (group: GatewayGroupUserAwayState) => void
  ): this;
  on(event: "internal_error", listener: (error: any) => void): this;
  on(event: "syntax_error", listener: (error: any) => void): this;
  on(event: "rate_limited", listener: () => void): this;
  on(event: "session_resumed", listener: () => void): this;
  on(event: "resume_failed", listener: (code: string) => void): this;
  on(event: "op_deprecated", listener: () => void): this;
  on(event: "user_update_error", listener: (error: GatewayError) => void): this;
  on(
    event: "watched_device_update",
    listener: (data: GatewayWatchedDeviceUpdate) => void
  ): this;
}
export class Gateway extends EventEmitter {
  constructor(
    url = "wss://rosin.puff.social",
    encoding = "json",
    compression = "none"
  ) {
    super();

    this.compression = compression;
    this.encoding = encoding;
    this.url = url;

    this.connectionAttempt = 0;

    this.init();
  }

  private init(): void {
    this.ws = new WebSocket(
      `${this.url}/socket?encoding=${this.encoding}&compression=${this.compression}`
    );
    if (this.compression != "none") this.ws.binaryType = "arraybuffer";

    if (typeof window != "undefined") window["ws"] = this.ws;

    // Socket open handler
    this.ws.addEventListener("open", () => this.opened());

    if (typeof window != "undefined") {
      window.addEventListener("beforeunload", () => {
        store.dispatch(resetGroupState());
        this.send(Op.LeaveGroup);
        this.ws.close(4006);
      });
    }

    // Message listener
    this.ws.addEventListener("message", (e) => {
      const message =
        this.compression != "none"
          ? JSON.parse(inflate(e.data, { to: "string" }))
          : JSON.parse(e.data);

      try {
        this.message(message);
      } catch (error) {}
    });

    // Close event for websocket
    this.ws.addEventListener("close", (event) =>
      this.closed(event.code, event.reason)
    );
  }

  private resetConnectionThrottle(): void {
    this.connectionAttempt = 0;
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
  }

  private reconnectThrottle(): void {
    this.connectionAttempt++;
    this.connectionTimeout = setTimeout(
      () => this.init(),
      this.connectionAttempt == 1
        ? 1000 * 2
        : this.connectionAttempt == 2
        ? 1000 * 5
        : this.connectionAttempt == 3
        ? 1000 * 10
        : 1000 * 15
    );
  }

  send(op: Op, d?: any): void {
    if (this.ws.readyState != this.ws.OPEN) return;
    const data =
      this.compression != "none"
        ? deflate(JSON.stringify({ op, d }))
        : JSON.stringify({ op, d });
    return this.ws.send(data);
  }

  private sendHeartbeat(): void {
    return this.send(Op.Heartbeat);
  }

  private message(data: SocketMessage): void {
    switch (data.op) {
      case Op.Hello:
        this.heartbeat = setInterval(
          () => this.sendHeartbeat(),
          data.d.heartbeat_interval
        );

        if (this.session_token && this.session_id) {
          this.new_session_id = data.d.session_id;

          this.send(Op.ResumeSession, {
            session_id: this.session_id,
            session_token: this.session_token,
          });
        }

        this.session_id = data.d.session_id;
        this.session_token = data.d.session_token;

        if (
          typeof localStorage != "undefined" &&
          localStorage.getItem("puff-social-auth")
        )
          gateway.send(Op.LinkUser, {
            token: localStorage.getItem("puff-social-auth"),
          });

        this.emit("init");

        break;

      case Op.Event:
        switch (data.t) {
          case Event.JoinedGroup: {
            store.dispatch(setGroupState({ group: data.d }));
            this.emit("joined_group", data.d);
            break;
          }
          case Event.GroupCreate: {
            this.emit("group_create", data.d);
            break;
          }
          case Event.GroupDelete: {
            this.emit("group_delete", data.d);
            break;
          }
          case Event.GroupUpdate: {
            store.dispatch(updateGroupState(data.d as GatewayGroup));

            const {
              group: { group },
            }: { group: GroupStateInterface } = store.getState();

            if (group) {
              if (group.state == GroupState.Chilling) {
                instance.setLightMode(PuffLightMode.Default);
              }
            }

            this.emit("group_update", data.d);
            break;
          }
          case Event.GroupUserJoin: {
            store.dispatch(addGroupMember(data.d as GroupUserJoin));
            this.emit("group_user_join", data.d);
            break;
          }
          case Event.GroupUserLeft: {
            this.emit("group_user_left", data.d);
            store.dispatch(removeGroupMember(data.d.session_id));
            break;
          }
          case Event.GroupUserUpdate: {
            store.dispatch(updateGroupMember(data.d as GroupUserJoin));
            this.emit("group_user_update", data.d);
            break;
          }
          case Event.GroupUserDeviceUpdate: {
            store.dispatch(
              updateGroupMemberDevice(data.d as GroupUserDeviceUpdate)
            );
            this.emit("group_user_device_update", data.d);
            break;
          }
          case Event.GroupHeatInquiry: {
            this.emit("group_heat_inquiry", data.d);
            break;
          }
          case Event.GroupHeatBegin: {
            this.emit("group_heat_begin", data.d);
            break;
          }
          case Event.GroupUserReady: {
            this.emit("group_user_ready", data.d);
            break;
          }
          case Event.GroupJoinError: {
            const parsed = data.d as unknown as GatewayError;
            switch (parsed.code) {
              case "INVALID_GROUP_ID": {
                store.dispatch(
                  setGroupState({
                    joinErrorMessage: "Unknown or invalid group ID",
                  })
                );
                break;
              }
            }
            this.emit("group_join_error", data.d);
            break;
          }
          case Event.GroupVisibilityChange: {
            this.emit("group_visibility_change", data.d);
            break;
          }
          case Event.PublicGroupsUpdate: {
            this.emit("public_groups_update", data.d);
            break;
          }
          case Event.GroupActionError: {
            this.emit("group_action_error", data.d);
            break;
          }
          case Event.GroupCreateError: {
            this.emit("group_create_error", data.d);
            break;
          }
          case Event.UserUpdateError: {
            this.emit("user_update_error", data.d);
            break;
          }
          case Event.GroupUserDeviceDisconnect: {
            store.dispatch(
              updateGroupMemberDevice({
                ...data.d,
                device_state: null,
              } as GroupUserDeviceUpdate)
            );
            this.emit("group_user_device_disconnect", data.d);
            break;
          }
          case Event.GroupUserUnready: {
            this.emit("group_user_unready", data.d);
            break;
          }
          case Event.GroupMessage: {
            this.emit("group_message", data.d);
            break;
          }
          case Event.GroupReaction: {
            this.emit("group_reaction", data.d);
            break;
          }
          case Event.SessionResumed: {
            this.session_id = data.d.session_id;
            this.emit("session_resumed", data.d);
            break;
          }
          case Event.Deprecated: {
            this.emit("op_deprecated");
            break;
          }
          case Event.SessionResumeError: {
            const { code } = data.d as typeof data.d & { code: string };
            this.session_id = this.new_session_id;
            delete this.new_session_id;
            this.emit("resume_failed", code);
            break;
          }
          case Event.GroupUserKicked: {
            this.emit("group_user_kicked", data.d);
            break;
          }
          case Event.GroupUserAwayState: {
            this.emit("group_user_away_state", data.d);
            break;
          }
          case Event.RateLimited: {
            this.emit("rate_limited");
            break;
          }
          case Event.InternalError: {
            this.emit("internal_error", data.d);
            break;
          }
          case Event.InvalidSyntax: {
            this.emit("syntax_error", data.d);
            break;
          }
          case Event.WatchedDeviceUpdate: {
            this.emit("watched_device_update", data.d);
            break;
          }
        }

        break;

      default:
        break;
    }
  }

  private opened(): void {
    console.log(
      `%c${
        SOCKET_URL.includes("puff.social")
          ? SOCKET_URL.split(".")[0].split("//")[1]
          : "Local"
      }%c Socket connection opened`,
      "padding: 10px; text-transform: capitalize; font-size: 1em; line-height: 1.4em; color: white; background: #151515; border-radius: 15px;",
      "font-size: 1em;"
    );
    this.emit("connected");
    this.resetConnectionThrottle();
  }

  private closed(code: number, reason: string): void {
    if (code != 4006) this.emit("close");

    console.log(
      `%c${
        SOCKET_URL.includes("puff.social")
          ? SOCKET_URL.split(".")[0].split("//")[1]
          : "Local"
      }%c Socket connection closed ${code} - ${reason || "no reason"}`,
      "padding: 10px; text-transform: capitalize; font-size: 1em; line-height: 1.4em; color: white; background: #151515; border-radius: 15px;",
      "font-size: 1em;"
    );

    clearInterval(this.heartbeat);
    if (code == 4003) return;
    this.reconnectThrottle();
  }
}

export const SOCKET_URL =
  typeof location != "undefined" &&
  ["localhost", "beta.puff.social"].includes(location.hostname)
    ? location.hostname == "beta.puff.social"
      ? "wss://flower.puff.social"
      : "ws://127.0.0.1:9000"
    : "wss://rosin.puff.social";
export const gateway = typeof window != "undefined" && new Gateway(SOCKET_URL);

if (typeof window != "undefined") window["gateway"] = gateway;
