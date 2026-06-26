-- Clean lesson seed (run once)


INSERT INTO lessons (course_id, title, position, video_url, duration) VALUES
(1, 'Introduction to HTML',            1, '', '15 min'),
(1, 'HTML Semantic Elements',          2, '', '22 min'),
(1, 'CSS Box Model & Flexbox',         3, '', '35 min'),
(1, 'CSS Grid Layout',                 4, '', '28 min'),
(1, 'Responsive Design',               5, '', '30 min'),
(1, 'JS Variables & Data Types',       6, '', '20 min'),
(1, 'Functions & Arrow Functions',     7, '', '25 min'),
(1, 'DOM Manipulation',                8, '', '40 min'),
(1, 'React Introduction & Setup',      9, '', '18 min'),

(2, 'Python Basics',                   1, '', '25 min'),
(2, 'NumPy Intro',                     2, '', '30 min'),
(2, 'Pandas',                          3, '', '40 min'),
(2, 'Scikit-learn',                    4, '', '35 min'),
(2, 'Linear Regression',               5, '', '45 min'),
(2, 'Decision Trees',                  6, '', '30 min'),
(2, 'Neural Networks',                 7, '', '50 min'),
(2, 'TensorFlow Basics',               8, '', '60 min'),
(2, 'Model Deployment',                9, '', '20 min'),

(3, 'Figma Basics',                    1, '', '20 min'),
(3, 'Prototyping',                     2, '', '25 min'),
(3, 'User Research',                   3, '', '30 min'),

(4, 'AWS Cloud Practitioner – Full Course Overview',  1, 'https://www.youtube.com/watch?v=SOTamWNgDKc', '12 min'),
(4, 'Cloud Computing Concepts & AWS Global Infrastructure', 2, 'https://www.youtube.com/watch?v=M988_fsOSWo', '18 min'),
(4, 'IAM – Users, Groups, Roles & Policies',           3, 'https://www.youtube.com/watch?v=iF9fs8Rw4Uo', '22 min'),
(4, 'Amazon EC2 – Instances, Types & Pricing',         4, 'https://www.youtube.com/watch?v=TsRBftzZsQo', '25 min'),
(4, 'Amazon S3 – Buckets, Storage Classes & Policies', 5, 'https://www.youtube.com/watch?v=77lMCiiMilo', '20 min'),
(4, 'Amazon RDS & DynamoDB – Managed Databases',       6, 'https://www.youtube.com/watch?v=eMzCI7S1P9M', '24 min'),
(4, 'Amazon VPC – Networking & Security Groups',       7, 'https://www.youtube.com/watch?v=fpxDGU2KdkA', '28 min'),
(4, 'AWS Lambda & Serverless Architecture',            8, 'https://www.youtube.com/watch?v=eOBq__h4OJ4', '22 min'),
(4, 'CloudWatch, CloudTrail & AWS Monitoring',         9, 'https://www.youtube.com/watch?v=a4dhoTQCyRA', '18 min'),
(4, 'AWS Pricing, Billing & Support Plans',           10, 'https://www.youtube.com/watch?v=oiAFbDQmFAI', '15 min'),
(4, 'AWS Well-Architected Framework & Best Practices',11, 'https://www.youtube.com/watch?v=vTjasx3ajjo', '20 min'),
(4, 'Exam Tips & Practice Questions',                 12, 'https://www.youtube.com/watch?v=SOTamWNgDKc', '30 min');

(5, 'Flutter Intro',                   1, '', '20 min'),
(5, 'Dart Language',                   2, '', '25 min'),

(6, 'Kali Linux Setup',                1, '', '30 min'),
(6, 'Metasploit Basics',               2, '', '35 min'),

(7, 'Docker Basics',                   1, '', '25 min'),
(7, 'Kubernetes Intro',                2, '', '40 min'),

(8, 'Pandas for Data',                 1, '', '30 min'),
(8, 'Data Visualization',              2, '', '25 min'),

(9, 'React Hooks',                     1, '', '20 min'),
(9, 'Redux State Management',          2, '', '30 min');

SELECT CONCAT('Seeded ', COUNT(*), ' lessons!') AS status FROM lessons;
