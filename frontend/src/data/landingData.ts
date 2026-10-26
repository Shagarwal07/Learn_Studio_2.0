export interface MemoryItem {
  id: string;
  defaultText: string;
  angle: string;
  imageSrc: string;
}

export interface TestimonialItem {
  stars: number;
  text: string;
  role: string;
}

export interface InstituteContact {
  name: string;
  brandTitle: string;
  tagline: string;
  email: string;
  phone: string;
  phoneFormatted: string;
  googleReviewsUrl: string;
  location: string;
}

export const INSTITUTE_CONTACT: InstituteContact = {
  name: "R.K Coaching Classes",
  brandTitle: "R.K Coaching Classes — LearnStudio",
  tagline: "Providing Balotra's students with premium, CBSE-focused conceptual tutoring in Mathematics and Science for more than ten years.",
  email: "rk.coachings20@gmail.com",
  phone: "+919414668795",
  phoneFormatted: "+91 9414668795",
  googleReviewsUrl: "https://share.google/5jqTmP4v5U1thBhQT",
  location: "Balotra, Rajasthan"
};

export const MEMORIES_DATA: MemoryItem[] = [
  { id: "mem-1", defaultText: "Creative Play & Learning", angle: "-5deg", imageSrc: "/images/memory1.jpg" },
  { id: "mem-2", defaultText: "Hands-On Mathematics", angle: "3deg", imageSrc: "/images/memory2.jpg" },
  { id: "mem-3", defaultText: "RK Classroom Smiles", angle: "-2deg", imageSrc: "/images/memory3.jpg" },
  { id: "mem-4", defaultText: "Science Experiments", angle: "4deg", imageSrc: "/images/memory4.jpg" },
  { id: "mem-5", defaultText: "Creative Expression", angle: "-3deg", imageSrc: "/images/memory5.jpg" }
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    stars: 5,
    text: "Concept clarity is amazing here. The way Rakesh Sir explains complex mathematics from playgroup to Class V is wonderful. My child cleared all core basics easily!",
    role: "Parent of Class X Student"
  },
  {
    stars: 5,
    text: "The small batch size and personal attention from Rekha Ma'am helped my daughter secure 87.33% in Class 10th. Highly structured weekly tests and feedback build real exam temperament.",
    role: "Parent"
  },
  {
    stars: 5,
    text: "Friendly teachers who explain each scientific concept with diagrams and real-life examples. I never felt hesitant to ask doubts here. My board exam fear was completely removed.",
    role: "Class IX Student"
  },
  {
    stars: 5,
    text: "Excellent parent communication. We receive attendance logs and weekly test reports regularly. The tutors are highly supportive, and their concept-driven approach is outstanding.",
    role: "Guardian"
  }
];
