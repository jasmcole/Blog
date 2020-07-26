import { SunParams, AverageParams } from "./calculate";

function* refine(start: number, stop: number) {
  let next = [start, 0.5 * (start + stop), stop];

  yield start;
  yield stop;

  while (true) {
    for (let i = 1; i < next.length; i += 2) {
      yield next[i];
    }

    const refined = [];
    for (let i = 0; i < next.length - 1; i++) {
      refined.push(next[i]);
      refined.push(0.5 * (next[i] + next[i + 1]));
    }
    refined.push(next[next.length - 1]);
    next = refined;
  }
}

export function* dayRefiner(sunParams: SunParams, avParams: AverageParams) {
  const hours = refine(0, 24);
  let i = 0;

  for (const hour of hours) {
    if (i > avParams.numIter) {
      break;
    }
    const thisParams = { ...sunParams, hour_of_day: hour };
    yield { sunParams: thisParams, i, numIter: avParams.numIter };
    i += 1;
  }
}

export function* yearRefiner(sunParams: SunParams, avParams: AverageParams) {
  const days = refine(0, 364);
  let i = 0;

  for (const day of days) {
    if (i > avParams.numIter) {
      break;
    }
    const day_of_year = Math.floor(day);
    const hour_of_day = 24 * (day - day_of_year);
    const thisParams = { ...sunParams, hour_of_day, day_of_year };
    yield { sunParams: thisParams, i, numIter: avParams.numIter };
    i += 1;
  }
}
