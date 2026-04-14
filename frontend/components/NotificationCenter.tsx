"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { AlertTriangle, Award, CheckCircle, Info, Zap } from "@deemlol/next-icons";
import {
  selectNotifications,
  selectUnreadCount,
  markAllRead,
  clearAll,
  type AppNotification,
} from "@/lib/notificationsSlice";
import type { AppDispatch } from "@/lib/store";

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  teal: "#14b8a6",
  blue: "#3b82f6",
  gray: "#6b7280",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  red:    <Zap size={15} />,
  orange: <AlertTriangle size={15} />,
  teal:   <CheckCircle size={15} />,
  blue:   <Award size={15} />,
  gray:   <Info size={15} />,
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function NotificationItem({ item }: { item: AppNotification }) {
  const color = COLOR_MAP[item.color] ?? COLOR_MAP.gray;
  const icon = ICON_MAP[item.color] ?? ICON_MAP.gray;

  return (
    <Box
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: item.read ? "transparent" : "rgba(255,255,255,0.04)",
        borderLeft: `3px solid ${item.read ? "transparent" : color}`,
        transition: "background 0.2s",
      }}
    >
      <Box style={{ color, flexShrink: 0, marginTop: 2 }}>{icon}</Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={600} c="white" style={{ lineHeight: 1.3 }}>
          {item.title}
        </Text>
        <Text size="xs" c="dimmed" mt={2} style={{ lineHeight: 1.4 }}>
          {item.message}
        </Text>
        <Text size="xs" c="dimmed" mt={4} style={{ opacity: 0.5 }}>
          {timeAgo(item.createdAt)}
        </Text>
      </Box>
      {!item.read && (
        <Box
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            marginTop: 4,
          }}
        />
      )}
    </Box>
  );
}

export default function NotificationCenter() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);
  const [opened, setOpened] = useState(false);

  function handleOpen(val: boolean) {
    setOpened(val);
    if (val && unread > 0) {
      // Mark all read after a short delay so the user sees the badge disappear
      setTimeout(() => dispatch(markAllRead()), 600);
    }
  }

  return (
    <Popover
      opened={opened}
      onChange={handleOpen}
      position="bottom-end"
      offset={8}
      width={340}
      shadow="xl"
      radius="md"
    >
      <Popover.Target>
        <Indicator
          label={unread > 9 ? "9+" : String(unread)}
          size={16}
          disabled={unread === 0}
          color="red"
          offset={4}
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={() => handleOpen(!opened)}
            aria-label="Уведомления"
            style={{ color: opened ? "white" : undefined }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown
        style={{
          background: "#0f1923",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text size="sm" fw={600} c="white">
              Уведомления
            </Text>
            {unread > 0 && (
              <Badge size="xs" color="red" variant="filled">
                {unread}
              </Badge>
            )}
          </Box>
          {items.length > 0 && (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={() => dispatch(clearAll())}
              style={{ fontSize: 11 }}
            >
              Очистить
            </Button>
          )}
        </Box>

        {/* List */}
        {items.length === 0 ? (
          <Stack align="center" gap={6} py={40}>
            <Text size="xl">🔔</Text>
            <Text size="sm" c="dimmed">
              Нет уведомлений
            </Text>
          </Stack>
        ) : (
          <ScrollArea.Autosize mah={420} scrollbarSize={4}>
            <Stack gap={0} p={6}>
              {items.map((item) => (
                <NotificationItem key={item.id} item={item} />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
