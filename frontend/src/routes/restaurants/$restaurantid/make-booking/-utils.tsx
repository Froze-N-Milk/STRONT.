export function timeFromMaskValue(maskvalue: number): string {
  const mins = maskvalue % 2 == 0 ? "00 " : "30 ";
  let hours = "";
  let ampm = "";
  if (maskvalue >= 24) {
    hours =
      maskvalue > 25 ? Math.floor(maskvalue / 2 - 12).toString() + ":" : "12:";
    ampm = "PM";
  } else {
    hours += maskvalue > 1 ? Math.floor(maskvalue / 2).toString() + ":" : "00:";
    ampm = "AM";
  }
  return hours + mins + ampm;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
