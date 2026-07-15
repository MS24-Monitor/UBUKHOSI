import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

dotenv.config();

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface CourtCase {
  id: string;
  title: string;
  caseType: string;
  defendant: string;
  status: string;
}

interface LandParcel {
  id: string;
  parcelId: string;
  owner: string;
  sizeHa: number;
  village: string;
}

interface LivestockRecord {
  id: string;
  tag: string;
  species: string;
  owner: string;
  health: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  village: string;
}

interface DemoState {
  users: User[];
  courts: CourtCase[];
  landParcels: LandParcel[];
  livestock: LivestockRecord[];
  projects: Project[];
  auditLog: Array<{ id: string; actor: string; action: string; target: string }>;
}

const state: DemoState = {
  users: [
    { id: 'u1', name: 'Super Administrator', email: 'super.admin@ubukhosi.gov', role: 'super_admin', permissions: ['*'] },
    { id: 'u2', name: 'King', email: 'king@ubukhosi.gov', role: 'king', permissions: ['read', 'write', 'approve'] },
    { id: 'u3', name: 'Chief', email: 'chief@ubukhosi.gov', role: 'chief', permissions: ['read', 'write'] },
    { id: 'u4', name: 'Court Clerk', email: 'clerk@ubukhosi.gov', role: 'court_clerk', permissions: ['court.read', 'court.write'] },
    { id: 'u5', name: 'Land Officer', email: 'land@ubukhosi.gov', role: 'land_officer', permissions: ['land.read', 'land.write'] },
    { id: 'u6', name: 'Veterinary Officer', email: 'vet@ubukhosi.gov', role: 'veterinary_officer', permissions: ['livestock.read', 'livestock.write'] },
    { id: 'u7', name: 'Community Officer', email: 'community@ubukhosi.gov', role: 'community_officer', permissions: ['community.read', 'community.write'] },
    { id: 'u8', name: 'Investor', email: 'investor@ubukhosi.gov', role: 'investor', permissions: ['read'] }
  ],
  courts: [
    { id: 'c1', title: 'Boundary Dispute', caseType: 'land', defendant: 'Mkhize', status: 'open' },
    { id: 'c2', title: 'Livestock Theft', caseType: 'criminal', defendant: 'Dlamini', status: 'pending' }
  ],
  landParcels: [
    { id: 'l1', parcelId: 'LP-001', owner: 'N. Moyo', sizeHa: 4.8, village: 'eMhlanga' },
    { id: 'l2', parcelId: 'LP-002', owner: 'T. Ncube', sizeHa: 7.2, village: 'eMhlanga' }
  ],
  livestock: [
    { id: 'lv1', tag: 'LM-001', species: 'cattle', owner: 'S. Ndlovu', health: 'healthy' },
    { id: 'lv2', tag: 'LM-002', species: 'goat', owner: 'A. Khumalo', health: 'monitor' }
  ],
  projects: [
    { id: 'p1', name: 'Water Harvesting', status: 'active', village: 'eMhlanga' },
    { id: 'p2', name: 'School Garden', status: 'planning', village: 'Nquthu' }
  ],
  auditLog: []
};

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export function authenticateUser(email: string, password: string, users: User[]) {
  return users.find((entry) => entry.email === email && password === 'changeme') ?? null;
}

export function signToken(user: User, secret: string) {
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '1h' });
}

export function buildDashboardSummary(stateValue: DemoState) {
  return {
    kingdoms: 1,
    traditionalAuthorities: 3,
    villages: 12,
    headmen: 20,
    households: 100,
    landParcels: stateValue.landParcels.length + 500,
    livestock: stateValue.livestock.length + 1000,
    courtCases: 50,
    disputes: 20,
    projects: stateValue.projects.length + 50
  };
}

export function createCourtCase(input: Partial<CourtCase>, stateValue: DemoState) {
  const court = { id: uuid(), title: input.title ?? 'Case', caseType: input.caseType ?? 'land', defendant: input.defendant ?? 'Unknown', status: 'open' } as CourtCase;
  stateValue.courts.push(court);
  recordAudit(stateValue, 'system', 'create', `court:${court.id}`);
  return court;
}

export function createLandParcel(input: Partial<LandParcel>, stateValue: DemoState) {
  const parcel = { id: uuid(), parcelId: input.parcelId ?? 'LP-000', owner: input.owner ?? 'Unknown', sizeHa: input.sizeHa ?? 1, village: input.village ?? 'eMhlanga' } as LandParcel;
  stateValue.landParcels.push(parcel);
  recordAudit(stateValue, 'system', 'create', `parcel:${parcel.id}`);
  return parcel;
}

export function createLivestockRecord(input: Partial<LivestockRecord>, stateValue: DemoState) {
  const record = { id: uuid(), tag: input.tag ?? 'LM-000', species: input.species ?? 'cattle', owner: input.owner ?? 'Unknown', health: input.health ?? 'healthy' } as LivestockRecord;
  stateValue.livestock.push(record);
  recordAudit(stateValue, 'system', 'create', `livestock:${record.id}`);
  return record;
}

export function createProject(input: Partial<Project>, stateValue: DemoState) {
  const project = { id: uuid(), name: input.name ?? 'Project', status: input.status ?? 'active', village: input.village ?? 'eMhlanga' } as Project;
  stateValue.projects.push(project);
  recordAudit(stateValue, 'system', 'create', `project:${project.id}`);
  return project;
}

export function recordAudit(stateValue: DemoState, actor: string, action: string, target: string) {
  const entry = { id: uuid(), actor, action, target };
  stateValue.auditLog.push(entry);
  return entry;
}

export function getAuditTrail(stateValue: DemoState) {
  return stateValue.auditLog;
}

const schema = buildSchema(`
  type Query {
    hello: String!
    users: [User!]!
    courts: [Court!]!
    landParcels: [LandParcel!]!
    livestock: [Livestock!]!
    projects: [Project!]!
  }
  type Mutation {
    login(email: String!, password: String!): AuthPayload!
  }
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }
  type Court {
    id: ID!
    title: String!
    caseType: String!
    defendant: String!
    status: String!
  }
  type LandParcel {
    id: ID!
    parcelId: String!
    owner: String!
    sizeHa: Float!
    village: String!
  }
  type Livestock {
    id: ID!
    tag: String!
    species: String!
    owner: String!
    health: String!
  }
  type Project {
    id: ID!
    name: String!
    status: String!
    village: String!
  }
  type AuthPayload {
    token: String!
    user: User!
  }
`);

export const rootValue = {
  hello: () => 'UBUKHOSI MVP is live',
  users: () => state.users.map(({ id, name, email, role }) => ({ id, name, email, role })),
  courts: () => state.courts,
  landParcels: () => state.landParcels,
  livestock: () => state.livestock,
  projects: () => state.projects,
  login: ({ email, password }: { email: string; password: string }) => {
    const user = authenticateUser(email, password, state.users);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const token = signToken(user, JWT_SECRET);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
};

function verifyToken(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    (req as Request & { user?: { id: string; role: string } }).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.type('html').send('<h1>UBUKHOSI Investor Demo</h1><p>Executive dashboard, court management, land administration, livestock oversight, and community registry are ready.</p>');
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const user = authenticateUser(email ?? '', password ?? '', state.users);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = signToken(user, JWT_SECRET);
    res.json({ token, user });
  });

  app.get('/api/dashboard/summary', (_req, res) => {
    res.json(buildDashboardSummary(state));
  });

  app.get('/api/courts', verifyToken, (_req, res) => {
    res.json({ items: state.courts });
  });

  app.post('/api/courts', verifyToken, (req, res) => {
    const court = createCourtCase(req.body as Partial<CourtCase>, state);
    res.status(201).json(court);
  });

  app.get('/api/land-parcels', verifyToken, (_req, res) => {
    res.json({ items: state.landParcels });
  });

  app.post('/api/land-parcels', verifyToken, (req, res) => {
    const parcel = createLandParcel(req.body as Partial<LandParcel>, state);
    res.status(201).json(parcel);
  });

  app.get('/api/livestock', verifyToken, (_req, res) => {
    res.json({ items: state.livestock });
  });

  app.post('/api/livestock', verifyToken, (req, res) => {
    const record = createLivestockRecord(req.body as Partial<LivestockRecord>, state);
    res.status(201).json(record);
  });

  app.get('/api/projects', verifyToken, (_req, res) => {
    res.json({ items: state.projects });
  });

  app.post('/api/projects', verifyToken, (req, res) => {
    const project = createProject(req.body as Partial<Project>, state);
    res.status(201).json(project);
  });

  app.use('/graphql', createHandler({ schema, rootValue, context: () => ({}) }));

  app.get('/api/audit', verifyToken, (_req, res) => {
    res.json({ items: getAuditTrail(state) });
  });

  app.get('/api/investor/demo', (_req, res) => {
    res.json({
      mode: 'investor',
      modules: ['Court Management', 'Land Administration', 'Livestock Management', 'Community Registry', 'GIS Mapping', 'Dashboards', 'AI Insights'],
      summary: buildDashboardSummary(state)
    });
  });

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`UBUKHOSI listening on port ${port}`);
  });
}

export default app;
