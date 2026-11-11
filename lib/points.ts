export type PointPerson = { role: string; program: string; programs?: string[] | null };
export function pointsFor(author: PointPerson, recipient: PointPerson) {
  if (recipient.role !== "employee") return 0;
  const authorPrograms = author.programs?.length ? author.programs : [author.program];
  const recipientPrograms = recipient.programs?.length ? recipient.programs : [recipient.program];
  const recipientSet = new Set(recipientPrograms.map((program) => program.toLocaleLowerCase()));
  const outside = !authorPrograms.some((program) => recipientSet.has(program.toLocaleLowerCase()));
  if (author.role === "employee") return outside ? 3 : 1;
  if (author.role === "supervisor") return outside ? 3 : 2;
  return outside ? 4 : 3;
}
