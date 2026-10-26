export interface Topper {
  name: string;
  score: string;
  rankText: string;
  image?: string;
  scienceMarks?: string;
  mathMarks?: string;
  englishMarks?: string;
  colorClass: string;
}

export interface BatchData {
  year: string;
  title: string;
  studentCount: number;
  avgScore: string;
  toppers: Topper[];
}

export const batchResultsData: Record<string, BatchData> = {
  '2025-26': {
    year: '2025-26',
    title: 'Class 10th Results',
    studentCount: 5,
    avgScore: '83.33%',
    toppers: [
      {
        name: 'Purva Gehlot',
        score: '88.83%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/Purva.jpeg',
        englishMarks: '100/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Bhumi Salecha',
        score: '87.33%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Bhumi.jpeg',
        englishMarks: '96/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Rinkesh Gehlot',
        score: '84.17%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Rinkesh.jpeg',
        englishMarks: '95/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  },
  '2024-25': {
    year: '2024-25',
    title: 'Class 10th Results',
    studentCount: 8,
    avgScore: '85.5%',
    toppers: [
      {
        name: 'Gunjan Salecha',
        score: '92.0%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/GunjanSalecha.jpg',
        scienceMarks: '86/100',
        mathMarks: '94/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Yashvi Jain',
        score: '90.0%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/YashviJain.jpg',
        scienceMarks: '97/100',
        mathMarks: '94/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Vanshika Choudhary',
        score: '84.0%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Vanshikach.jpg',
        scienceMarks: '97/100',
        mathMarks: '82/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  },
  '2023-24': {
    year: '2023-24',
    title: 'Class 10th Results',
    studentCount: 7,
    avgScore: '88%',
    toppers: [
      {
        name: 'Hardik Lunker',
        score: '93.67%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/Hardik.png',
        scienceMarks: '90/100',
        mathMarks: '97/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Harshil Sharma',
        score: '89.5%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Harshil.png',
        scienceMarks: '86/100',
        mathMarks: '96/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Varsha',
        score: '87.83%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Varsha.png',
        scienceMarks: '87/100',
        mathMarks: '93/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  },
  '2022-23': {
    year: '2022-23',
    title: 'Class 10th Results',
    studentCount: 7,
    avgScore: '91.04%',
    toppers: [
      {
        name: 'Jinal Gogar',
        score: '93.83%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/Jinal.png',
        scienceMarks: '93/100',
        mathMarks: '95/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Dushyant Jatol',
        score: '92.5%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Dushyant.png',
        scienceMarks: '94/100',
        mathMarks: '100/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Kusum Panwar',
        score: '91.67%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Kusum.png',
        scienceMarks: '90/100',
        mathMarks: '98/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  }
};
