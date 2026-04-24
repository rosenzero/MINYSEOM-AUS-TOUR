import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TRIP, getAllEventsSorted, formatDayLabel } from '@/lib/trip';
import { EventDetail } from '@/components/EventDetail';

export function generateStaticParams() {
  return getAllEventsSorted().map((e) => ({ uid: e.uid }));
}

export function generateMetadata({
  params,
}: {
  params: { uid: string };
}): Metadata {
  const event = getAllEventsSorted().find((e) => e.uid === params.uid);
  if (!event) return {};
  const day = TRIP.days[event.dayIdx];
  const desc = `DAY ${event.dayIdx + 1} · ${day.date} (${day.day}) · ${event.start}–${event.end}${
    event.location ? ` · ${event.location}` : ''
  }`;
  const title = event.title;
  return {
    title,
    description: desc,
    openGraph: {
      title: `${title} · ${TRIP.info.title}`,
      description: desc,
    },
    twitter: {
      title: `${title} · ${TRIP.info.title}`,
      description: desc,
    },
  };
}

export default function Page({ params }: { params: { uid: string } }) {
  const all = getAllEventsSorted();
  const event = all.find((e) => e.uid === params.uid);
  if (!event) return notFound();
  const day = TRIP.days[event.dayIdx];
  return (
    <EventDetail
      uid={event.uid}
      dayLabel={formatDayLabel(day)}
      dayIdx={event.dayIdx}
      title={event.title}
      location={event.location}
      start={event.start}
      end={event.end}
      startISO={event.startDate.toISOString()}
      endISO={event.endDate.toISOString()}
    />
  );
}
