"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import { getEcho } from "@/lib/echo";
import { addNotification } from "@/lib/notificationsSlice";
import type { AppDispatch } from "@/lib/store";

interface TournamentEndedPayload {
  tournament_id: number;
  tournament_name: string;
}

export function useTournamentNotifications(userId: number | null) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    const channel = echo
      .channel("tournaments")
      .listen(".tournament.ended", (payload: TournamentEndedPayload) => {
        const title = "Турнир завершён";
        const message = `«${payload.tournament_name}» подошёл к концу. Проверьте результаты!`;
        notifications.show({ title, message, color: "blue", autoClose: 10000 });
        dispatch(addNotification({ title, message, color: "blue" }));
      });

    return () => {
      channel.stopListening(".tournament.ended");
      echo.leave("tournaments");
    };
  }, [userId, dispatch]);
}
