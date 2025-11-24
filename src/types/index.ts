export type Category =
  | 'STEM'
  | 'Humanitar'
  | 'İncəsənət'
  | 'İdman'
  | 'Sahibkarlıq'
  | 'Texnologiya / IT'
  | 'Startap və innovasiya'
  | 'Sosial fəaliyyət'
  | 'Media və yaradıcılıq';

export type Faculty = string;

export type AchievementLevel =
  | 'Beynəlxalq'
  | 'Respublika'
  | 'Regional'
  | 'Universitet';
  
export type CertificateLevel =
  | 'Beynəlxalq'
  | 'Respublika'
  | 'Regional'
  | 'Universitet';
  
export type SkillLevel = 'Başlanğıc' | 'Orta' | 'İrəli';

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface Project {
  id: string;
  ownerId: string; // Owner ID (can be student or organization)
  ownerType: 'student' | 'organization';
  title: string;
  description: string;
  role: string;
  link?: string;
  mediaLink?: string;
  teamMembers?: string[];
  teamMemberIds?: string[];
  invitedStudentIds?: string[];
  applicantIds?: string[];
  status: 'davam edir' | 'tamamlanıb';
}

export interface Achievement {
  id: string;
  studentId: string;
  name: string;
  description?: string;
  position: string;
  date: string; // ISO 8601 format
  level: AchievementLevel;
  link?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  name: string;
  certificateURL: string;
  level: CertificateLevel;
}

export type UserRole = 'student' | 'student-organization' | 'admin';

export interface BaseUser {
    id: string;
    role: UserRole;
    email: string;
    createdAt?: any;
}

export type StudentStatus = 'təsdiqlənmiş' | 'gözləyir' | 'arxivlənmiş';

export interface Student extends BaseUser {
  role: 'student';
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  courseYear: number;
  educationForm?: string;
  gpa?: number | null;
  skills: Skill[];
  category: string;
  projectIds?: string[];
  achievementIds?: string[];
  certificateIds?: string[];
  linkedInURL?: string;
  githubURL?: string;
  behanceURL?: string;
  instagramURL?: string;
  portfolioURL?: string;
  googleScholarURL?: string;
  youtubeURL?: string;
  talentScore?: number;
  profilePictureUrl?: string;
  profilePictureHint?: string;
  status: StudentStatus;
  successStory?: string;
}

export interface Admin extends BaseUser {
    role: 'admin';
    firstName: string;
    lastName: string;
}

export type StudentOrganizationStatus = 'təsdiqlənmiş' | 'gözləyir' | 'arxivlənmiş';
export interface StudentOrganization extends BaseUser {
  role: 'student-organization';
  name: string;
  description: string;
  logoUrl?: string;
  faculty?: string;
  leaderId?: string; // student id
  memberIds: string[]; // array of student ids
  status: StudentOrganizationStatus;
}

export interface News {
  id: string;
  slug: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  updatedAt?: any;
}

export interface StudentOrgUpdate {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface FacultyData {
    id: string;
    name: string;
}

export interface CategoryData {
    id: string;
    name: string;
}

export type InvitationStatus = 'gözləyir' | 'qəbul edildi' | 'rədd edildi' | 'müraciət';
export interface Invitation {
    id: string;
    organizationId: string;
    studentId: string;
    projectId: string;
    status: InvitationStatus;
    createdAt: Date;
}

export type AppUser = Student | StudentOrganization | Admin;
