export type PointPerson = { role: string; program: string };
export function pointsFor(author: PointPerson, recipient: PointPerson) {
  if (recipient.role !== "employee") return 0;
  const outside = author.program.toLocaleLowerCase() !== recipient.program.toLocaleLowerCase();
  if (author.role === "employee") return outside ? 3 : 1;
  if (author.role === "supervisor") return outside ? 3 : 2;
  return outside ? 4 : 3;
}
