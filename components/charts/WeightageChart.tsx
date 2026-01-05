'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5856d6'];

interface DataItem {
    name: string;
    value: number;
    [key: string]: any;
}

export default function WeightageChart({ data }: { data: DataItem[] }) {
    if (!data || data.length === 0) return <div className="text-muted-foreground text-sm flex items-center justify-center h-64">No data available</div>;

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
