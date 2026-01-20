// lib/subject-icons.ts
export const SUBJECT_ICON_MAP: { [key: string]: string } = {
  // --- Arts, Humanities & Social Sciences ---
  "Anthropology": "UserSearch",
  "Archaeology": "LandPlot",
  "Classics": "Trophy",
  "Communication": "MessagesSquare",
  "Criminology": "Gavel",
  "Cultural Studies": "Globe",
  "Development Studies": "TrendingUp",
  "Economics": "DollarSign",
  "Education": "GraduationCap",
  "English Language & Literature": "BookOpenText",
  "Ethics & Philosophy": "Lightbulb",
  "Gender Studies": "Users",
  "History": "Scroll",
  "International Relations": "Earth",
  "Law": "Scale",
  "Linguistics": "Speech",
  "Media Studies / Media Production": "MonitorPlay",
  "Political Science": "Vote",
  "Psychology": "Brain",
  "Religion / Theology": "Church",
  "Sociology": "Users",

  // --- Science & Mathematics ---
  "Astronomy": "Telescope",
  "Biology": "Dna",
  "Chemistry": "Atom",
  "Earth Science": "Mountain",
  "Ecology": "Leaf",
  "Environmental Science": "Recycle",
  "Geography": "Map",
  "Mathematics": "Sigma",
  "Physics": "Zap",
  "Statistics": "AreaChart",

  // --- Computer & Technology ---
  "Computer Science": "Code",
  "Data Science": "Database",
  "Information Technology (IT)": "Server",
  "Robotics": "Bot",
  "Artificial Intelligence": "Sparkles",
  "Cybersecurity": "ShieldCheck",
  "Software Engineering": "CodeSquare",

  // --- Engineering ---
  "Engineering": "Cog",
  "Mechanical Engineering": "Wrench",
  "Electrical Engineering": "Bolt",
  "Civil Engineering": "Building",
  "Chemical Engineering": "Beaker",
  "Aerospace Engineering": "Rocket",

  // --- Health & Life Sciences ---
  "Health Sciences": "HeartPulse",
  "Medicine": "Stethoscope",
  "Nursing": "FirstAid",
  "Pharmacy": "Pill",
  "Public Health": "Users",
  "Biotechnology": "Microscope",
  "Neuroscience": "Brain",
  "Nutrition & Dietetics": "Apple",

  // --- Design & Creative ---
  "Architecture": "Ruler",
  "Art & Design": "Palette",
  "Drama / Theater": "Mask",
  "Music": "Music",
  "Film Studies": "Clapperboard",
  "Animation & Visual Effects": "Image",
  "Fashion Design": "Shirt",

  // --- Business & Management ---
  "Business Studies": "Briefcase",
  "Finance": "Wallet",
  "Accounting": "ClipboardList",
  "Management / MBA": "Users",
  "Marketing": "Megaphone",
  "Entrepreneurship": "Rocket",
  "Supply Chain / Operations": "Truck",
  "Human Resource Management": "UserCheck",

  // --- Interdisciplinary & Applied ---
  "Behavioral Science": "Users",
  "Cognitive Science": "Brain",
  "Environmental Studies": "TreePine",
  "Sustainability Studies": "Leaf",
  "Sports Science": "Dumbbell",
  "Urban Studies & Planning": "MapPin",
  "Forensic Science": "MagnifyingGlass",
  "Game Design": "Gamepad2"
};

// Fallback logic for use in the component
export const getIconForSubject = (subject: string): string => {
  if (!subject) return "BookOpen";

  const normalizedSubject = subject.toLowerCase().trim();
  const keys = Object.keys(SUBJECT_ICON_MAP);

  // 1. Try Exact Match (Case-Insensitive)
  const exactMatch = keys.find(k => k.toLowerCase() === normalizedSubject);
  if (exactMatch) return SUBJECT_ICON_MAP[exactMatch];

  // 2. Try Keyword Match (if 'Mathematics' is inside 'Advanced Mathematics')
  const keywordMatch = keys.find(k => {
    const kLow = k.toLowerCase();
    return normalizedSubject.includes(kLow) || kLow.includes(normalizedSubject);
  });
  if (keywordMatch) return SUBJECT_ICON_MAP[keywordMatch];

  // 3. Try "Partial Word" Match (Split by spaces/slashes)
  const words = normalizedSubject.split(/[\s/]+/);
  for (const word of words) {
    if (word.length < 3) continue; // Skip small words like "of", "and"
    const partialMatch = keys.find(k => k.toLowerCase().includes(word));
    if (partialMatch) return SUBJECT_ICON_MAP[partialMatch];
  }

  // Fallback
  return "BookOpen";
};