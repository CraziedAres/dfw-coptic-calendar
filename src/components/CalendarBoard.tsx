"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventContentArg, DayCellContentArg } from "@fullcalendar/core";
import { CATEGORIES, CATEGORY_SLUGS, GROUPS, getCategory, primaryGroup } from "@/lib/categories";
import { toCoptic, fastFor } from "@/lib/coptic-date";

export type ClientEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  categories: string[];
  churchSlug: string;
  churchName: string;
  location: string | null;
  description: string | null;
  sourceUrl: string | null;
};

type Props = { events: ClientEvent[]; churches: { slug: string; name: string }[] };

export function CalendarBoard({ events, churches }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selected = useMemo(() => {
    const raw = params.get("c");
    return new Set(raw === null ? CATEGORY_SLUGS : raw.split(",").filter(Boolean));
  }, [params]);
  const church = params.get("church") ?? "";
  const allSelected = selected.size === CATEGORY_SLUGS.length;

  function setQuery(next: { c?: Set<string>; church?: string }) {
    const q = new URLSearchParams(params.toString());
    if (next.c) {
      if (next.c.size === CATEGORY_SLUGS.length) q.delete("c");
      else q.set("c", CATEGORY_SLUGS.filter((s) => next.c!.has(s)).join(","));
    }
    if (next.church !== undefined) {
      if (next.church) q.set("church", next.church);
      else q.delete("church");
    }
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setQuery({ c: next });
  }

  const visible = useMemo(
    () =>
      events.filter((e) => {
        if (church && e.churchSlug !== church) return false;
        // Uncategorized events only appear when every category is on.
        if (!e.categories.length) return allSelected;
        return e.categories.some((c) => selected.has(c));
      }),
    [events, church, selected, allSelected],
  );

  const fcEvents = useMemo(
    () =>
      visible.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end ?? undefined,
        allDay: e.allDay,
        classNames: [`g-${primaryGroup(e.categories)}`],
        extendedProps: e,
      })),
    [visible],
  );

  // Month grid on wide screens, agenda list on phones.
  const [narrow, setNarrow] = useState<boolean | null>(null);
  useEffect(() => setNarrow(window.matchMedia("(max-width: 640px)").matches), []);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<ClientEvent | null>(null);
  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  return (
    <>
      <div className="chip-groups">
        {GROUPS.map((g) => (
          <div className="chip-group" key={g.id}>
            <span className="chip-group-label small-caps">{g.label}</span>
            {CATEGORIES.filter((c) => c.group === g.id).map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`chip g-${g.id}`}
                aria-pressed={selected.has(c.slug)}
                onClick={() => toggle(c.slug)}
              >
                <span className="dot" />
                {c.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="chip-toolbar">
        <button type="button" className="linklike" onClick={() => setQuery({ c: new Set(CATEGORY_SLUGS) })}>
          Show all
        </button>
        <button type="button" className="linklike" onClick={() => setQuery({ c: new Set() })}>
          Clear
        </button>
        <select aria-label="Church" value={church} onChange={(e) => setQuery({ church: e.target.value })}>
          <option value="">All churches</option>
          {churches.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="muted">
          {visible.length} event{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="calendar-wrap">
        {narrow !== null && (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView={narrow ? "listMonth" : "dayGridMonth"}
            headerToolbar={
              narrow
                ? { left: "prev,next", center: "title", right: "today" }
                : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" }
            }
            buttonText={{ today: "Today", month: "Month", week: "Week", list: "List" }}
            height="auto"
            dayMaxEvents={4}
            events={fcEvents}
            eventContent={renderEvent}
            dayCellContent={renderDayCell}
            eventClick={(arg: EventClickArg) => {
              arg.jsEvent.preventDefault();
              setOpen(arg.event.extendedProps as ClientEvent);
            }}
            noEventsContent="No events for these filters this month."
          />
        )}
      </div>

      <dialog ref={dialogRef} className="event-dialog" onClose={() => setOpen(null)}>
        {open && <EventDetail event={open} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}

function renderEvent(arg: EventContentArg) {
  const isList = arg.view.type.startsWith("list");
  if (isList) {
    const e = arg.event.extendedProps as ClientEvent;
    return (
      <span>
        {arg.event.title} <span className="muted">· {e.churchName}</span>
      </span>
    );
  }
  return (
    <div className="fc-event-chip">
      <span className="bar" />
      {arg.timeText && <span className="time">{arg.timeText}</span>}
      <span className="title">{arg.event.title}</span>
    </div>
  );
}

function renderDayCell(arg: DayCellContentArg) {
  if (arg.view.type !== "dayGridMonth") return arg.dayNumberText;
  const c = toCoptic(arg.date);
  const fast = fastFor(arg.date);
  return (
    <span>
      <span className="day-coptic">
        {c.day} {c.monthName}
      </span>
      {arg.dayNumberText}
      {fast && (
        <span className="day-fast" title={fast}>
          fast
        </span>
      )}
    </span>
  );
}

function EventDetail({ event, onClose }: { event: ClientEvent; onClose: () => void }) {
  const start = new Date(event.start);
  const date = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = event.allDay
    ? "All day"
    : start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) +
      (event.end ? ` – ${new Date(event.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "");
  return (
    <div>
      <h2>{event.title}</h2>
      <p className="event-meta">
        {date} · {time}
      </p>
      <p className="event-meta">
        <a href={`/churches/${event.churchSlug}`}>{event.churchName}</a>
        {event.location ? ` · ${event.location}` : ""}
      </p>
      <div>
        {event.categories.map((c) => (
          <span key={c} className="tag">
            {getCategory(c)?.label ?? c}
          </span>
        ))}
      </div>
      {event.description && <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>}
      <div className="admin-actions">
        {event.sourceUrl && (
          <a className="btn ghost" href={event.sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        )}
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
