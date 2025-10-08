import { User } from '@/types';

export const mockUsers: User[] = [
  // User regular
  {
    id: '1',
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'USER',
    phone: '+2250712345678',
    avatar: '👤',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },

  // User with complete profile
  {
    id: '2',
    email: 'marie.kouame@example.com',
    firstName: 'Marie',
    lastName: 'Kouamé',
    role: 'USER',
    phone: '+2250776543210',
    avatar: '👩‍💼',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-20'),
  },

  // Insurer account
  {
    id: '3',
    email: 'nsia@assurances.ci',
    firstName: 'Thomas',
    lastName: 'Konan',
    role: 'INSURER',
    phone: '+2250722334455',
    avatar: '🏢',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
  },

  // Another insurer
  {
    id: '4',
    email: 'sunu@contact.ci',
    firstName: 'Fatou',
    lastName: 'Diop',
    role: 'INSURER',
    phone: '+2250733445566',
    avatar: '🛡️',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-28'),
  },

  // Admin account
  {
    id: '5',
    email: 'admin@noli.ci',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    phone: '+2250700000000',
    avatar: '🔧',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-30'),
  },

  // Additional test users
  {
    id: '6',
    email: 'test@user.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    phone: '+2250711122333',
    avatar: '🧪',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },

  {
    id: '7',
    email: 'demo@insurer.ci',
    firstName: 'Demo',
    lastName: 'Assurance',
    role: 'INSURER',
    phone: '+2250744455667',
    avatar: '📊',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-10'),
  },
];

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const validateCredentials = (email: string, password: string): User | undefined => {
  // Mock validation - in real app, you'd hash and compare passwords
  const user = getUserByEmail(email);

  // Simple mock password validation (same as email or common test passwords)
  const validPasswords = [
    'password123',
    'test123',
    'demo123',
    email.split('@')[0], // username part of email
    'Noli2024',
  ];

  if (user && validPasswords.includes(password)) {
    return user;
  }

  return undefined;
};

export const getUserRole = (email: string): string | null => {
  const user = getUserByEmail(email);
  return user ? user.role : null;
};