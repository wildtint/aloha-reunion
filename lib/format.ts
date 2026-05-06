export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(t: string | null | undefined) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${period}`;
}

export function mealLabel(pref: string | null | undefined) {
  if (!pref) return "Not specified";
  const map: Record<string, string> = {
    veg: "Vegetarian",
    "non-veg": "Non-vegetarian",
    vegan: "Vegan",
    jain: "Jain",
  };
  return map[pref] || pref;
}
