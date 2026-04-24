import { TRIP, getAllEventsSorted, getCurrentEvent, getNextEvent } from './trip';

const all = getAllEventsSorted();
console.log('title:', TRIP.info.title);
console.log('events.length:', all.length);
console.log('first:', all[0]?.title, all[0]?.startDate.toISOString());
console.log('last:', all.at(-1)?.title, all.at(-1)?.endDate.toISOString());

const now = new Date();
console.log('now:', now.toISOString());
console.log('current:', getCurrentEvent(now)?.title ?? '(none)');
console.log('next:', getNextEvent(now)?.title ?? '(none)');
