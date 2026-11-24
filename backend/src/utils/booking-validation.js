export const isValidUTCTimestamp = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const pattern =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

  const match = value.match(pattern);

  if (!match) {
    return false;
  }

  const [, year, month, day, hour, minute, second, fraction = ""] = match;

  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second) &&
    date.getUTCMilliseconds() === Number(fraction.padEnd(3, "0"))
  );
};

export const isValidBookingTimeGrid = (value) => {
  if (!isValidUTCTimestamp(value)) {
    return false;
  }

  const date = new Date(value);

  return (
    (date.getUTCMinutes() === 0 || date.getUTCMinutes() === 30) &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
};

export const isValidBookingDuration = (startTime, endTime) => {
  if (!isValidBookingTimeGrid(startTime) || !isValidBookingTimeGrid(endTime)) {
    return false;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const durationMinutes = (end - start) / (1000 * 60);

  return durationMinutes >= 30 && durationMinutes <= 240;
};

export const isValidBookingDateRange = (startTime, now = new Date()) => {
  if (!isValidBookingTimeGrid(startTime)) {
    return false;
  }

  const start = new Date(startTime);

  const maxAllowedDate = new Date(now);
  maxAllowedDate.setUTCDate(maxAllowedDate.getUTCDate() + 30);

  return start > now && start <= maxAllowedDate;
};

export const validateBookingTimeRange = (
  startTime,
  endTime,
  now = new Date(),
) => {
  if (!isValidUTCTimestamp(startTime) || !isValidUTCTimestamp(endTime)) {
    return "Both timestamps must be valid ISO 8601 UTC timestamps.";
  }

  if (!isValidBookingTimeGrid(startTime) || !isValidBookingTimeGrid(endTime)) {
    return "Booking times must follow the 30-minute UTC grid with zero seconds and milliseconds.";
  }

  if (!isValidBookingDuration(startTime, endTime)) {
    return "Booking duration must be between 30 and 240 minutes.";
  }

  if (!isValidBookingDateRange(startTime, now)) {
    return "Booking start time must be in the future and within 30 days.";
  }

  return null;
};

