export interface SubCourse {
  name: string; // 'A', 'B', 'C'
  pars: (number | string)[]; // Can be string during input
}

export interface Course {
  id: string;
  name: string;
  courses: SubCourse[];
}

export interface GameRecord {
  id: string;
  date: string; // ISO string
  courseId: string;
  courseName: string;
  playerNames: string[];
  allScores: string[][][];
  signatures: (string | null)[][];
  playedCourses: SubCourse[];
}

export interface Competition {
  id: string;
  title: string;
  location: string;
  applyStartDate: string;
  applyEndDate: string;
  eventDate: string;
  sourceUrl: string;
  content?: string;
  status: 'active' | 'closed' | 'upcoming';
  createdAt: string;
}
