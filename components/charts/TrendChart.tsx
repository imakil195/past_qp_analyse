'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de'];

interface TrendData {
    year: number;
    [topic: string]: number; // Dynamic topic keys
}

export default function TrendChart({ data, topics }: { data: TrendData[], topics: string[] }) {
    if (!data || data.length === 0) return <div className="text-muted-foreground text-sm flex items-center justify-center h-64">No data available</div>;

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {topics.slice(0, 5).map((topic, index) => (
                        <Line
                            key={topic}
                            type="monotone"
                            dataKey={topic}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 0, fill: COLORS[index % COLORS.length] }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
