export interface GradeScaleRange {
  gradeLabel: string;
  minPercentage: number;
  maxPercentage: number;
}

export function calculatePercentage(obtained: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  return Number(((obtained / maxMarks) * 100).toFixed(2));
}

export function resolveGrade(percentage: number, scales: GradeScaleRange[]): string {
  const ordered = [...scales].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const scale of ordered) {
    if (percentage >= scale.minPercentage && percentage <= scale.maxPercentage) {
      return scale.gradeLabel;
    }
  }
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
}
