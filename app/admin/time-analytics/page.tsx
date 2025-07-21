'use client';

import { useEffect, useState } from 'react';
import { getTimeTrackingAnalytics } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { AdminLayout } from '@/components/admin-layout';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042'];

function formatDuration(ms: number) {
  if (!ms) return '0s';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  let str = '';
  if (h > 0) str += `${h}h `;
  if (m > 0 || h > 0) str += `${m}m `;
  str += `${s}s`;
  return str.trim();
}

interface AnalyticsData {
  stageAverages: Record<string, number>;
  totalCases: number;
  // Optionally, add: allCases: Array<{ caseId: string, stageTimes: Record<string, number>, totalTime: number }>
}

export default function TimeAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTimeTrackingAnalytics().then(res => {
      if (res.success) setAnalytics(res.data);
      else setError(res.error || 'Failed to load analytics');
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading time analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!analytics) return <div>No analytics data available.</div>;

  const { stageAverages, totalCases } = analytics;
  const stageData = Object.entries(stageAverages).map(([stage, avg], i) => ({
    stage,
    avg,
    color: COLORS[i % COLORS.length],
  }));
  // Pie chart data
  const totalAvg = Object.values(stageAverages).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(stageAverages).map(([stage, avg], i) => ({
    name: stage,
    value: avg,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <AdminLayout>

    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Time Tracking Analytics</h1>
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold">Total Cases</div>
          <div className="text-3xl font-bold">{totalCases}</div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold">Total Avg Time</div>
          <div className="text-3xl font-bold">{formatDuration(totalAvg)}</div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold">Slowest Stage</div>
          <div className="text-3xl font-bold">
            {stageData.reduce((max, curr) => curr.avg > max.avg ? curr : max, stageData[0]).stage}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Average Time per Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis tickFormatter={formatDuration} />
              <Tooltip formatter={formatDuration} />
              <Bar dataKey="avg">
                {stageData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Proportion of Time per Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-pie-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 mt-8">
        <h2 className="text-lg font-semibold mb-2">Average Time per Stage (Table)</h2>
        <table className="min-w-full border mt-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">Stage</th>
              <th className="border px-2 py-1">Average Time</th>
            </tr>
          </thead>
          <tbody>
            {stageData.map(({ stage, avg }) => (
              <tr key={stage}>
                <td className="border px-2 py-1 font-semibold">{stage}</td>
                <td className="border px-2 py-1">{formatDuration(avg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </AdminLayout>
  );
} 