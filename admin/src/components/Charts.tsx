import React from 'react';

type TierKey = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';
type DailyPoint = { date: string; count: number; tiers?: Record<string, number> };

const TIER_COLORS: Record<TierKey, string> = {
    FREE: '#94A3B8',
    BRONZE: '#F59E0B',
    SILVER: '#64748B',
    GOLD: '#FBBF24',
};

export const SignupsTrendChart: React.FC<{ data: DailyPoint[] }> = ({ data }) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState<number>(700);
    const height = 140;
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
    const [visibleTiers, setVisibleTiers] = React.useState<Record<string, boolean>>({ FREE: true, BRONZE: true, SILVER: true, GOLD: true });

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => setWidth(Math.max(300, el.clientWidth));
        resize();
        const ro = new (window as any).ResizeObserver(resize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    if (!data || data.length === 0) return <div className="text-sm text-zinc-500">No signup data</div>;

    const max = Math.max(...data.map(d => {
        if (d.tiers) return Object.entries(d.tiers).reduce((s, [,v]) => s + v, 0);
        return d.count;
    }), 1);

    const stepX = width / Math.max(1, data.length - 1);

    const stackPointsByTier: Record<string, string> = {};
    const cumulative: number[] = new Array(data.length).fill(0);

    (['FREE','BRONZE','SILVER','GOLD'] as TierKey[]).forEach((tier) => {
        const points = data.map((d, i) => {
            const v = d.tiers ? (d.tiers[tier] ?? 0) : 0;
            cumulative[i] += v;
            return `${i * stepX},${height - (cumulative[i] / max) * (height - 20)}`;
        });
        const areaPath = `M0,${height} L${points.join(' L ')} L${width},${height} Z`;
        stackPointsByTier[tier] = areaPath;
    });

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.round(x / stepX);
        setHoverIndex(Math.max(0, Math.min(data.length -1, idx)));
    };

    return (
        <div ref={containerRef}>
            <div className="flex items-center gap-4 mb-2">
                {(Object.keys(TIER_COLORS) as TierKey[]).map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm text-zinc-600">
                        <input type="checkbox" checked={visibleTiers[t]} onChange={() => setVisibleTiers(s => ({ ...s, [t]: !s[t] }))} />
                        <span style={{ width: 12, height: 12, background: TIER_COLORS[t], display: 'inline-block', borderRadius: 3 }} />
                        {t}
                    </label>
                ))}
            </div>
            <div style={{ position: 'relative' }}>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
                    {/* y-axis ticks */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <g key={i}>
                            <line x1={0} x2={width} y1={height - p * (height - 20)} y2={height - p * (height - 20)} stroke="#EEF2FF" />
                            <text x={2} y={height - p * (height - 20) - 4} fontSize={10} fill="#94A3B8">{Math.round(p * max)}</text>
                        </g>
                    ))}

                    {/* stacked areas */}
                    {(Object.keys(stackPointsByTier) as TierKey[]).map((tier) => (
                        visibleTiers[tier] ? (
                            <path key={tier} d={stackPointsByTier[tier]} fill={TIER_COLORS[tier]} opacity={0.85} />
                        ) : null
                    ))}

                    {/* hover line & markers */}
                    {hoverIndex !== null && (
                        <g>
                            <line x1={hoverIndex * stepX} x2={hoverIndex * stepX} y1={0} y2={height} stroke="#CBD5E1" strokeDasharray="4 4" />
                        </g>
                    )}
                </svg>

                {hoverIndex !== null && (
                    <div className="absolute right-0 top-0 bg-white dark:bg-[#0B0D12] border rounded shadow p-3 text-xs" style={{ transform: 'translateX(-100%)' }}>
                        <div className="font-semibold mb-1">{data[hoverIndex].date}</div>
                        {(Object.keys(TIER_COLORS) as TierKey[]).map(t => (
                            <div key={t} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2"><span style={{ width:10, height:10, background: TIER_COLORS[t], display:'inline-block' }} /> <span className="text-zinc-700">{t}</span></div>
                                <div className="font-bold">{data[hoverIndex].tiers ? (data[hoverIndex].tiers![t] ?? 0) : 0}</div>
                            </div>
                        ))}
                        <div className="mt-2 text-sm text-zinc-500">Total: <strong className="text-zinc-900">{data[hoverIndex].count}</strong></div>
                    </div>
                )}
            </div>
            <div className="mt-2 text-xs text-zinc-500">X: date (last 30 days) • Y: signups</div>
        </div>
    );
};

export const RetentionCurveChart: React.FC<{ retention: { day1?: number; day7?: number; day30?: number } }> = ({ retention }) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState<number>(400);
    const height = 140;

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const resize = () => setWidth(Math.max(260, el.clientWidth));
        resize();
        const ro = new (window as any).ResizeObserver(resize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const days = [1, 7, 30];
    const values = [retention?.day1 ?? 0, retention?.day7 ?? 0, retention?.day30 ?? 0];
    const max = Math.max(...values, 1);

    const points = values.map((v, i) => `${(i / (days.length - 1)) * width},${height - (v / max) * (height - 20)}`).join(' ');
    const linePath = `M${points.split(' ').join(' L ')}`;

    return (
        <div ref={containerRef} className="flex items-start gap-4">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
                <path d={linePath} fill="none" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {values.map((v, i) => {
                    const x = (i / (days.length - 1)) * width;
                    const y = height - (v / max) * (height - 20);
                    return <circle key={i} cx={x} cy={y} r={4} fill="#10B981" />;
                })}
                {/* x-axis labels */}
                {days.map((d, i) => (
                    <text key={i} x={(i / (days.length - 1)) * width} y={height} fontSize={11} fill="#94A3B8" textAnchor="middle">D{d}</text>
                ))}
            </svg>
            <div className="text-sm text-zinc-600">
                <div>Day 1: <strong className="text-zinc-900">{values[0]}%</strong></div>
                <div>Day 7: <strong className="text-zinc-900">{values[1]}%</strong></div>
                <div>Day 30: <strong className="text-zinc-900">{values[2]}%</strong></div>
            </div>
        </div>
    );
};

export default {};
