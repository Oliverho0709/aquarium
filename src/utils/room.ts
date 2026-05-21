import { DEFAULT_ROOM_ID } from "../constants";

export function getRoomIdFromUrl() {
  const roomId = new URLSearchParams(window.location.search).get("roomId");
  return roomId?.trim() || DEFAULT_ROOM_ID;
}
