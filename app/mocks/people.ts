/**
 * Mock employee directory. Hand-built (no Math.random / no faker) so SSR
 * and client render the exact same strings.
 *
 * Sized at 60 rows -- enough to exercise pagination, multi-page filter
 * results, and density choices without bloating the SSR payload. Names
 * span a mix of regions so the avatar-initials look representative.
 *
 * Salary is stored as an annualised number in USD; the column hides for
 * non-admin personas. Status uses three values so the multi-select
 * filter has interesting state to scroll through.
 *
 * Photo URLs deliberately omitted -- AvatarFallback renders initials.
 * Real consumers can swap the shape to add `photoUrl?: string` and
 * supply CDN paths in their own mock layer.
 */

export type EmployeeStatus = 'active' | 'on-leave' | 'offboarded'
export type EmploymentType = 'full-time' | 'part-time' | 'contractor' | 'intern'

export interface Employee {
  id: string
  name: string
  initials: string
  email: string
  title: string
  department: string
  location: string
  manager: string
  startDate: string // ISO yyyy-mm-dd, sortable as string
  status: EmployeeStatus
  employmentType: EmploymentType
  salary: number // annual USD
  tenureMonths: number
}

export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Sales', 'Marketing', 'Operations', 'Finance', 'People'] as const
export const LOCATIONS = ['San Francisco', 'New York', 'London', 'Berlin', 'Sydney', 'Remote'] as const
export const STATUSES: EmployeeStatus[] = ['active', 'on-leave', 'offboarded']
export const EMPLOYMENT_TYPES: EmploymentType[] = ['full-time', 'part-time', 'contractor', 'intern']

export const EMPLOYEES: Employee[] = [
  { id: 'E-0001', name: 'Paige Nelson', initials: 'PN', email: 'paige.nelson@uipkge-hrms.dev', title: 'Senior Backend Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Sarah Connor', startDate: '2026-04-25', status: 'active', employmentType: 'full-time', salary: 142000, tenureMonths: 1 },
  { id: 'E-0002', name: 'Marcus Rivera', initials: 'MR', email: 'marcus.rivera@uipkge-hrms.dev', title: 'Staff Frontend Engineer', department: 'Engineering', location: 'New York', manager: 'Sarah Connor', startDate: '2024-08-12', status: 'active', employmentType: 'full-time', salary: 198000, tenureMonths: 21 },
  { id: 'E-0003', name: 'Diane Cho', initials: 'DC', email: 'diane.cho@uipkge-hrms.dev', title: 'Head of Talent', department: 'People', location: 'New York', manager: 'CEO', startDate: '2023-02-01', status: 'active', employmentType: 'full-time', salary: 215000, tenureMonths: 39 },
  { id: 'E-0004', name: 'Sarah Connor', initials: 'SC', email: 'sarah.connor@uipkge-hrms.dev', title: 'VP Engineering', department: 'Engineering', location: 'San Francisco', manager: 'CEO', startDate: '2022-06-20', status: 'active', employmentType: 'full-time', salary: 285000, tenureMonths: 47 },
  { id: 'E-0005', name: 'Kyle Newman', initials: 'KN', email: 'kyle.newman@uipkge-hrms.dev', title: 'Senior Designer', department: 'Design', location: 'San Francisco', manager: 'Laura Reed', startDate: '2024-03-04', status: 'on-leave', employmentType: 'full-time', salary: 124000, tenureMonths: 26 },
  { id: 'E-0006', name: 'Aaron Morgan', initials: 'AM', email: 'aaron.morgan@uipkge-hrms.dev', title: 'Engineering Manager', department: 'Engineering', location: 'San Francisco', manager: 'Sarah Connor', startDate: '2023-09-15', status: 'active', employmentType: 'full-time', salary: 195000, tenureMonths: 32 },
  { id: 'E-0007', name: 'Laura Reed', initials: 'LR', email: 'laura.reed@uipkge-hrms.dev', title: 'Head of Design', department: 'Design', location: 'London', manager: 'CEO', startDate: '2022-11-08', status: 'active', employmentType: 'full-time', salary: 235000, tenureMonths: 42 },
  { id: 'E-0008', name: 'Mark Vincent', initials: 'MV', email: 'mark.vincent@uipkge-hrms.dev', title: 'Senior Product Manager', department: 'Product', location: 'San Francisco', manager: 'Diane Cho', startDate: '2023-05-22', status: 'active', employmentType: 'full-time', salary: 168000, tenureMonths: 36 },
  { id: 'E-0009', name: 'Paula Ingram', initials: 'PI', email: 'paula.ingram@uipkge-hrms.dev', title: 'Senior Backend Engineer', department: 'Engineering', location: 'Berlin', manager: 'Aaron Morgan', startDate: '2024-01-15', status: 'active', employmentType: 'full-time', salary: 138000, tenureMonths: 28 },
  { id: 'E-0010', name: 'Ryan Shaw', initials: 'RS', email: 'ryan.shaw@uipkge-hrms.dev', title: 'Site Reliability Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Aaron Morgan', startDate: '2024-07-08', status: 'active', employmentType: 'full-time', salary: 152000, tenureMonths: 22 },
  { id: 'E-0011', name: 'Elena Volkov', initials: 'EV', email: 'elena.volkov@uipkge-hrms.dev', title: 'Senior Sales Rep', department: 'Sales', location: 'New York', manager: 'Hugo Park', startDate: '2024-02-20', status: 'active', employmentType: 'full-time', salary: 165000, tenureMonths: 27 },
  { id: 'E-0012', name: 'Hugo Park', initials: 'HP', email: 'hugo.park@uipkge-hrms.dev', title: 'VP Sales', department: 'Sales', location: 'New York', manager: 'CEO', startDate: '2022-09-15', status: 'active', employmentType: 'full-time', salary: 245000, tenureMonths: 44 },
  { id: 'E-0013', name: 'Naomi Tan', initials: 'NT', email: 'naomi.tan@uipkge-hrms.dev', title: 'Marketing Lead', department: 'Marketing', location: 'Sydney', manager: 'Jessica Park', startDate: '2024-04-10', status: 'active', employmentType: 'full-time', salary: 142000, tenureMonths: 25 },
  { id: 'E-0014', name: 'Jessica Park', initials: 'JP', email: 'jessica.park@uipkge-hrms.dev', title: 'Head of Marketing', department: 'Marketing', location: 'New York', manager: 'CEO', startDate: '2023-04-03', status: 'active', employmentType: 'full-time', salary: 218000, tenureMonths: 37 },
  { id: 'E-0015', name: 'Daniel Wright', initials: 'DW', email: 'daniel.wright@uipkge-hrms.dev', title: 'Operations Lead', department: 'Operations', location: 'London', manager: 'Liam Brooks', startDate: '2023-11-15', status: 'active', employmentType: 'full-time', salary: 138000, tenureMonths: 30 },
  { id: 'E-0016', name: 'Liam Brooks', initials: 'LB', email: 'liam.brooks@uipkge-hrms.dev', title: 'COO', department: 'Operations', location: 'London', manager: 'CEO', startDate: '2022-08-01', status: 'active', employmentType: 'full-time', salary: 295000, tenureMonths: 45 },
  { id: 'E-0017', name: 'Sofia Russo', initials: 'SR', email: 'sofia.russo@uipkge-hrms.dev', title: 'Finance Analyst', department: 'Finance', location: 'Berlin', manager: 'Owen Park', startDate: '2024-10-01', status: 'active', employmentType: 'full-time', salary: 115000, tenureMonths: 19 },
  { id: 'E-0018', name: 'Owen Park', initials: 'OP', email: 'owen.park@uipkge-hrms.dev', title: 'CFO', department: 'Finance', location: 'New York', manager: 'CEO', startDate: '2022-05-10', status: 'active', employmentType: 'full-time', salary: 305000, tenureMonths: 48 },
  { id: 'E-0019', name: 'Amy Knight', initials: 'AK', email: 'amy.knight@uipkge-hrms.dev', title: 'Designer', department: 'Design', location: 'San Francisco', manager: 'Kyle Newman', startDate: '2024-09-09', status: 'active', employmentType: 'full-time', salary: 96000, tenureMonths: 20 },
  { id: 'E-0020', name: 'Tomás García', initials: 'TG', email: 'tomas.garcia@uipkge-hrms.dev', title: 'Backend Engineer', department: 'Engineering', location: 'Berlin', manager: 'Aaron Morgan', startDate: '2024-11-15', status: 'active', employmentType: 'full-time', salary: 118000, tenureMonths: 18 },
  { id: 'E-0021', name: 'Mira Hassan', initials: 'MH', email: 'mira.hassan@uipkge-hrms.dev', title: 'Frontend Engineer', department: 'Engineering', location: 'London', manager: 'Marcus Rivera', startDate: '2024-12-02', status: 'active', employmentType: 'full-time', salary: 122000, tenureMonths: 17 },
  { id: 'E-0022', name: 'Yuki Tanaka', initials: 'YT', email: 'yuki.tanaka@uipkge-hrms.dev', title: 'Designer', department: 'Design', location: 'Remote', manager: 'Kyle Newman', startDate: '2025-01-13', status: 'active', employmentType: 'full-time', salary: 102000, tenureMonths: 16 },
  { id: 'E-0023', name: 'Olivia James', initials: 'OJ', email: 'olivia.james@uipkge-hrms.dev', title: 'Product Manager', department: 'Product', location: 'Sydney', manager: 'Mark Vincent', startDate: '2025-02-10', status: 'active', employmentType: 'full-time', salary: 138000, tenureMonths: 15 },
  { id: 'E-0024', name: 'Wei Chen', initials: 'WC', email: 'wei.chen@uipkge-hrms.dev', title: 'Data Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Aaron Morgan', startDate: '2024-06-17', status: 'active', employmentType: 'full-time', salary: 145000, tenureMonths: 23 },
  { id: 'E-0025', name: 'Hanna Kowalski', initials: 'HK', email: 'hanna.kowalski@uipkge-hrms.dev', title: 'Sales Rep', department: 'Sales', location: 'Berlin', manager: 'Elena Volkov', startDate: '2025-03-04', status: 'active', employmentType: 'full-time', salary: 96000, tenureMonths: 14 },
  { id: 'E-0026', name: 'Simon Keller', initials: 'SK', email: 'simon.keller@uipkge-hrms.dev', title: 'Mobile Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Marcus Rivera', startDate: '2025-04-21', status: 'active', employmentType: 'full-time', salary: 132000, tenureMonths: 13 },
  { id: 'E-0027', name: 'Camila Souza', initials: 'CS', email: 'camila.souza@uipkge-hrms.dev', title: 'QA Engineer', department: 'Engineering', location: 'Remote', manager: 'Aaron Morgan', startDate: '2025-05-19', status: 'active', employmentType: 'full-time', salary: 108000, tenureMonths: 12 },
  { id: 'E-0028', name: 'Noah Schmidt', initials: 'NS', email: 'noah.schmidt@uipkge-hrms.dev', title: 'Marketing Designer', department: 'Marketing', location: 'Berlin', manager: 'Naomi Tan', startDate: '2025-06-09', status: 'active', employmentType: 'full-time', salary: 98000, tenureMonths: 11 },
  { id: 'E-0029', name: 'Priscilla Adams', initials: 'PA', email: 'priscilla.adams@uipkge-hrms.dev', title: 'Account Manager', department: 'Sales', location: 'New York', manager: 'Hugo Park', startDate: '2024-04-08', status: 'active', employmentType: 'full-time', salary: 128000, tenureMonths: 25 },
  { id: 'E-0030', name: 'Felix Müller', initials: 'FM', email: 'felix.muller@uipkge-hrms.dev', title: 'DevOps Engineer', department: 'Engineering', location: 'Berlin', manager: 'Ryan Shaw', startDate: '2025-07-14', status: 'active', employmentType: 'full-time', salary: 134000, tenureMonths: 10 },
  { id: 'E-0031', name: 'Isla Murphy', initials: 'IM', email: 'isla.murphy@uipkge-hrms.dev', title: 'People Ops Specialist', department: 'People', location: 'London', manager: 'Diane Cho', startDate: '2024-05-13', status: 'active', employmentType: 'full-time', salary: 92000, tenureMonths: 24 },
  { id: 'E-0032', name: 'Drew Palmer', initials: 'DP', email: 'drew.palmer@uipkge-hrms.dev', title: 'Senior Sales Engineer', department: 'Sales', location: 'San Francisco', manager: 'Hugo Park', startDate: '2024-08-21', status: 'active', employmentType: 'full-time', salary: 158000, tenureMonths: 21 },
  { id: 'E-0033', name: 'Megan Sutton', initials: 'MS', email: 'megan.sutton@uipkge-hrms.dev', title: 'Content Strategist', department: 'Marketing', location: 'San Francisco', manager: 'Naomi Tan', startDate: '2025-08-11', status: 'active', employmentType: 'full-time', salary: 88000, tenureMonths: 9 },
  { id: 'E-0034', name: 'Lucas Bernard', initials: 'LB', email: 'lucas.bernard@uipkge-hrms.dev', title: 'Junior Designer', department: 'Design', location: 'Remote', manager: 'Yuki Tanaka', startDate: '2025-09-22', status: 'active', employmentType: 'full-time', salary: 72000, tenureMonths: 8 },
  { id: 'E-0035', name: 'Alice King', initials: 'AK', email: 'alice.king@uipkge-hrms.dev', title: 'Recruiter', department: 'People', location: 'New York', manager: 'Diane Cho', startDate: '2025-10-13', status: 'active', employmentType: 'full-time', salary: 89000, tenureMonths: 7 },
  { id: 'E-0036', name: 'Ross Jenkins', initials: 'RJ', email: 'ross.jenkins@uipkge-hrms.dev', title: 'Backend Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Paula Ingram', startDate: '2025-11-03', status: 'active', employmentType: 'full-time', salary: 115000, tenureMonths: 6 },
  { id: 'E-0037', name: 'Ines Costa', initials: 'IC', email: 'ines.costa@uipkge-hrms.dev', title: 'Frontend Engineer', department: 'Engineering', location: 'Berlin', manager: 'Marcus Rivera', startDate: '2025-11-24', status: 'on-leave', employmentType: 'full-time', salary: 112000, tenureMonths: 6 },
  { id: 'E-0038', name: 'Bryan Olsen', initials: 'BO', email: 'bryan.olsen@uipkge-hrms.dev', title: 'Sales Operations', department: 'Sales', location: 'New York', manager: 'Hugo Park', startDate: '2026-01-12', status: 'active', employmentType: 'full-time', salary: 105000, tenureMonths: 4 },
  { id: 'E-0039', name: 'Chen Liu', initials: 'CL', email: 'chen.liu@uipkge-hrms.dev', title: 'Product Designer', department: 'Design', location: 'Sydney', manager: 'Laura Reed', startDate: '2026-02-02', status: 'active', employmentType: 'full-time', salary: 124000, tenureMonths: 3 },
  { id: 'E-0040', name: 'Zara Ahmed', initials: 'ZA', email: 'zara.ahmed@uipkge-hrms.dev', title: 'Data Analyst', department: 'Operations', location: 'London', manager: 'Daniel Wright', startDate: '2026-02-16', status: 'active', employmentType: 'full-time', salary: 102000, tenureMonths: 3 },
  { id: 'E-0041', name: 'Tariq Hassan', initials: 'TH', email: 'tariq.hassan@uipkge-hrms.dev', title: 'Engineering Intern', department: 'Engineering', location: 'Remote', manager: 'Aaron Morgan', startDate: '2026-03-02', status: 'active', employmentType: 'intern', salary: 36000, tenureMonths: 2 },
  { id: 'E-0042', name: 'Bella Romano', initials: 'BR', email: 'bella.romano@uipkge-hrms.dev', title: 'Marketing Intern', department: 'Marketing', location: 'Berlin', manager: 'Noah Schmidt', startDate: '2026-03-09', status: 'active', employmentType: 'intern', salary: 32000, tenureMonths: 2 },
  { id: 'E-0043', name: 'Kareem Mansour', initials: 'KM', email: 'kareem.mansour@uipkge-hrms.dev', title: 'Customer Success Mgr', department: 'Operations', location: 'New York', manager: 'Daniel Wright', startDate: '2025-04-07', status: 'active', employmentType: 'full-time', salary: 118000, tenureMonths: 13 },
  { id: 'E-0044', name: 'Lina Hoffmann', initials: 'LH', email: 'lina.hoffmann@uipkge-hrms.dev', title: 'Senior Designer', department: 'Design', location: 'Berlin', manager: 'Laura Reed', startDate: '2024-12-17', status: 'active', employmentType: 'full-time', salary: 132000, tenureMonths: 17 },
  { id: 'E-0045', name: 'Theo Walsh', initials: 'TW', email: 'theo.walsh@uipkge-hrms.dev', title: 'Senior Engineer', department: 'Engineering', location: 'London', manager: 'Aaron Morgan', startDate: '2024-02-12', status: 'active', employmentType: 'full-time', salary: 162000, tenureMonths: 27 },
  { id: 'E-0046', name: 'Holly Russell', initials: 'HR', email: 'holly.russell@uipkge-hrms.dev', title: 'Sr. Product Manager', department: 'Product', location: 'San Francisco', manager: 'Mark Vincent', startDate: '2023-12-04', status: 'active', employmentType: 'full-time', salary: 165000, tenureMonths: 29 },
  { id: 'E-0047', name: 'Carmen Diaz', initials: 'CD', email: 'carmen.diaz@uipkge-hrms.dev', title: 'PR Manager', department: 'Marketing', location: 'New York', manager: 'Jessica Park', startDate: '2024-03-11', status: 'on-leave', employmentType: 'full-time', salary: 128000, tenureMonths: 26 },
  { id: 'E-0048', name: 'Kevin Porter', initials: 'KP', email: 'kevin.porter@uipkge-hrms.dev', title: 'Engineering Manager', department: 'Engineering', location: 'San Francisco', manager: 'Sarah Connor', startDate: '2023-06-25', status: 'active', employmentType: 'full-time', salary: 198000, tenureMonths: 35 },
  { id: 'E-0049', name: 'Stella Park', initials: 'SP', email: 'stella.park@uipkge-hrms.dev', title: 'Recruiter', department: 'People', location: 'Sydney', manager: 'Alice King', startDate: '2025-06-22', status: 'active', employmentType: 'part-time', salary: 64000, tenureMonths: 11 },
  { id: 'E-0050', name: 'Aaron Cho', initials: 'AC', email: 'aaron.cho@uipkge-hrms.dev', title: 'Senior Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Kevin Porter', startDate: '2024-03-25', status: 'active', employmentType: 'full-time', salary: 158000, tenureMonths: 26 },
  { id: 'E-0051', name: 'Beatrice Lyon', initials: 'BL', email: 'beatrice.lyon@uipkge-hrms.dev', title: 'BizOps Analyst', department: 'Operations', location: 'New York', manager: 'Daniel Wright', startDate: '2023-08-30', status: 'offboarded', employmentType: 'full-time', salary: 0, tenureMonths: 33 },
  { id: 'E-0052', name: 'Mateo Silva', initials: 'MS', email: 'mateo.silva@uipkge-hrms.dev', title: 'Contractor – Brand', department: 'Marketing', location: 'Remote', manager: 'Jessica Park', startDate: '2025-11-20', status: 'active', employmentType: 'contractor', salary: 95000, tenureMonths: 6 },
  { id: 'E-0053', name: 'Akiko Nakamura', initials: 'AN', email: 'akiko.nakamura@uipkge-hrms.dev', title: 'Senior PM', department: 'Product', location: 'Remote', manager: 'Holly Russell', startDate: '2024-09-30', status: 'active', employmentType: 'full-time', salary: 162000, tenureMonths: 20 },
  { id: 'E-0054', name: 'Niamh O\'Brien', initials: 'NO', email: 'niamh.obrien@uipkge-hrms.dev', title: 'Sr. Engineer', department: 'Engineering', location: 'London', manager: 'Theo Walsh', startDate: '2023-07-12', status: 'active', employmentType: 'full-time', salary: 168000, tenureMonths: 34 },
  { id: 'E-0055', name: 'Henry Wei', initials: 'HW', email: 'henry.wei@uipkge-hrms.dev', title: 'Engineering Intern', department: 'Engineering', location: 'San Francisco', manager: 'Kevin Porter', startDate: '2026-01-26', status: 'active', employmentType: 'intern', salary: 34000, tenureMonths: 4 },
  { id: 'E-0056', name: 'Iris Park', initials: 'IP', email: 'iris.park@uipkge-hrms.dev', title: 'Talent Sourcer', department: 'People', location: 'New York', manager: 'Alice King', startDate: '2025-12-15', status: 'active', employmentType: 'part-time', salary: 56000, tenureMonths: 5 },
  { id: 'E-0057', name: 'Caleb Roberts', initials: 'CR', email: 'caleb.roberts@uipkge-hrms.dev', title: 'Senior Sales Rep', department: 'Sales', location: 'Sydney', manager: 'Hugo Park', startDate: '2024-01-22', status: 'offboarded', employmentType: 'full-time', salary: 0, tenureMonths: 28 },
  { id: 'E-0058', name: 'Tara Williams', initials: 'TW', email: 'tara.williams@uipkge-hrms.dev', title: 'Compensation Analyst', department: 'Finance', location: 'New York', manager: 'Owen Park', startDate: '2025-03-25', status: 'active', employmentType: 'full-time', salary: 112000, tenureMonths: 14 },
  { id: 'E-0059', name: 'Ian Stewart', initials: 'IS', email: 'ian.stewart@uipkge-hrms.dev', title: 'Mobile Engineer', department: 'Engineering', location: 'San Francisco', manager: 'Simon Keller', startDate: '2025-10-06', status: 'active', employmentType: 'full-time', salary: 124000, tenureMonths: 7 },
  { id: 'E-0060', name: 'Zoe Reyes', initials: 'ZR', email: 'zoe.reyes@uipkge-hrms.dev', title: 'Product Marketing', department: 'Marketing', location: 'New York', manager: 'Jessica Park', startDate: '2024-10-15', status: 'active', employmentType: 'full-time', salary: 135000, tenureMonths: 19 },
]

export const STATUS_TONE: Record<EmployeeStatus, 'success' | 'warning' | 'muted'> = {
  active: 'success',
  'on-leave': 'warning',
  offboarded: 'muted',
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Active',
  'on-leave': 'On leave',
  offboarded: 'Offboarded',
}

export const TYPE_LABELS: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contractor: 'Contractor',
  intern: 'Intern',
}

export function formatSalary(usd: number): string {
  if (!usd) return '—'
  return `$${Math.round(usd / 1000)}k`
}

export function findEmployee(id: string): Employee | undefined {
  return EMPLOYEES.find((e) => e.id === id)
}
