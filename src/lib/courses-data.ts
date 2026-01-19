import { Course } from './types';

export const DEFAULT_COURSES: Course[] = [
    {
        id: 'default-1',
        name: '기본 파크골프장',
        courseName: '기본 파크골프장',
        location: '서울',
        courses: [
            { name: 'A', pars: [3, 3, 3, 3, 4, 4, 3, 3, 5] },
            { name: 'B', pars: [3, 3, 3, 3, 4, 4, 3, 3, 5] },
            { name: 'C', pars: [3, 3, 3, 3, 4, 4, 3, 3, 5] },
            { name: 'D', pars: [3, 3, 3, 3, 4, 4, 3, 3, 5] },
        ],
    },
];
