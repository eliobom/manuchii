import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Datos de ejemplo
const userGrowthData = [
  { month: 'Ene', usuarios: 40, activos: 24 },
  { month: 'Feb', usuarios: 65, activos: 45 },
  { month: 'Mar', usuarios: 85, activos: 60 },
  { month: 'Abr', usuarios: 120, activos: 85 },
  { month: 'May', usuarios: 150, activos: 110 },
  { month: 'Jun', usuarios: 180, activos: 140 },
];

const classesData = [
  { name: 'Matemáticas', value: 35, color: '#3b82f6' },
  { name: 'Español', value: 25, color: '#10b981' },
  { name: 'Inglés', value: 20, color: '#f59e0b' },
  { name: 'Ciencias', value: 20, color: '#8b5cf6' },
];

const engagementData = [
  { day: 'Lun', engagement: 65 },
  { day: 'Mar', engagement: 72 },
  { day: 'Mié', engagement: 68 },
  { day: 'Jue', engagement: 85 },
  { day: 'Vie', engagement: 92 },
  { day: 'Sab', engagement: 78 },
  { day: 'Dom', engagement: 55 },
];

export const UserGrowthChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={userGrowthData}>
      <defs>
        <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="month" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      />
      <Legend />
      <Area
        type="monotone"
        dataKey="usuarios"
        stroke="#3b82f6"
        fillOpacity={1}
        fill="url(#colorUsuarios)"
        name="Total Usuarios"
      />
      <Area
        type="monotone"
        dataKey="activos"
        stroke="#10b981"
        fillOpacity={1}
        fill="url(#colorActivos)"
        name="Usuarios Activos"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const ClassesDistributionChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={classesData}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, value }) => `${name}: ${value}%`}
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
      >
        {classesData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      />
    </PieChart>
  </ResponsiveContainer>
);

export const EngagementChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={engagementData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="day" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      />
      <Bar dataKey="engagement" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Engagement %" />
    </BarChart>
  </ResponsiveContainer>
);

export const RevenueChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={userGrowthData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="month" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="usuarios"
        stroke="#f59e0b"
        strokeWidth={2}
        dot={{ fill: '#f59e0b', r: 4 }}
        activeDot={{ r: 6 }}
        name="Ingresos"
      />
    </LineChart>
  </ResponsiveContainer>
);
