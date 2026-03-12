'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';

// ============================================================================
// Types
// ============================================================================

interface StatBadgeProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface AvatarImageProps {
  src?: string;
  alt: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface PositionTagProps {
  position: string;
}

interface TableHeaderCellProps {
  label: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | 'none';
  onClick?: () => void;
}

interface TableDataCellProps {
  value: string | number;
  emphasis?: boolean;
}

interface SectionHeadingProps {
  title: string;
}

interface PlayerProfileCardProps {
  playerName: string;
  team: string;
  position: string;
  jerseyNumber: number;
  avatarSrc?: string;
  stats: {
    avg: string;
    hr: number;
    rbi: number;
    ops: string;
  };
}

interface GameStat {
  date: string;
  opponent: string;
  result: 'W' | 'L';
  atBats: number;
  hits: number;
  hr: number;
  rbi: number;
  avg: string;
}

interface StatsTableRowProps {
  game: GameStat;
}

interface ChartTooltipProps {
  date: string;
  avg: string;
  hits: number;
  hr: number;
  rbi: number;
}

interface PerformanceChartBarProps {
  label: string;
  value: number; // 0 to 1
  rawValue: string | number;
  color?: string;
  tooltipData: ChartTooltipProps;
}

interface PlayerStatsTableProps {
  rows: GameStat[];
}

interface PerformanceChartProps {
  games: GameStat[];
}

interface DashboardHeaderProps {
  title?: string;
  onSearch?: (query: string) => void;
  onThemeToggle?: () => void;
  isDark?: boolean;
}

// ============================================================================
// Atoms
// ============================================================================

const StatBadge = ({ label, value, highlight }: StatBadgeProps) => {
  return (
    <div
      role="listitem"
      aria-label={`Stat badge showing ${label}: ${value}`}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl ${highlight ? 'bg-indigo-600' : 'bg-gray-800'} text-white min-w-[72px]`}
    >
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-extrabold tabular-nums">{value}</span>
    </div>
  );
};

const AvatarImage = ({ src, alt, initials, size = 'md' }: AvatarImageProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl'
  };

  return (
    <div
      role="img"
      aria-label={`Player photo of ${alt}`}
      className={`inline-flex items-center justify-center rounded-full overflow-hidden bg-indigo-600 text-white font-bold select-none ${sizeClasses[size]}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || alt.substring(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
};

const PositionTag = ({ position }: PositionTagProps) => {
  return (
    <span
      role="note"
      aria-label={`Position: ${position}`}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
    >
      {position}
    </span>
  );
};

const TableHeaderCell = ({ label, sortable, sortDirection = 'none', onClick }: TableHeaderCellProps) => {
  return (
    <th
      role="columnheader"
      aria-label={`${label} column header`}
      aria-sort={sortDirection === 'none' ? 'none' : sortDirection === 'asc' ? 'ascending' : 'descending'}
      onClick={sortable ? onClick : undefined}
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900 select-none ${sortable ? 'cursor-pointer hover:bg-gray-800' : ''}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortable && sortDirection !== 'none' && (
          <span className="text-indigo-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

const TableDataCell = ({ value, emphasis }: TableDataCellProps) => {
  return (
    <td
      role="cell"
      className={`px-4 py-3 text-sm whitespace-nowrap ${emphasis ? 'font-bold text-white' : 'text-gray-200'}`}
    >
      {value}
    </td>
  );
};

const SectionHeading = ({ title }: SectionHeadingProps) => {
  return (
    <h2
      role="heading"
      aria-level={2}
      className="flex items-center gap-3 text-lg font-bold text-white border-l-4 border-indigo-500 pl-3 mb-4"
    >
      {title}
    </h2>
  );
};

// ============================================================================
// Molecules
// ============================================================================

const PlayerProfileCard = ({
  playerName,
  team,
  position,
  jerseyNumber,
  avatarSrc,
  stats
}: PlayerProfileCardProps) => {
  return (
    <section
      role="region"
      aria-label={`Player profile card for ${playerName}`}
      className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gray-800 rounded-2xl shadow-lg w-full"
    >
      <AvatarImage src={avatarSrc} alt={playerName} size="lg" />
      
      <div className="flex-1 flex flex-col items-center sm:items-start w-full">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{playerName}</h1>
          <span className="text-2xl font-bold text-gray-500">#{jerseyNumber}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <span className="text-gray-400 font-medium">{team}</span>
          <span className="text-gray-600">•</span>
          <PositionTag position={position} />
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <StatBadge label="AVG" value={stats.avg} />
          <StatBadge label="HR" value={stats.hr} />
          <StatBadge label="RBI" value={stats.rbi} />
          <StatBadge label="OPS" value={stats.ops} />
        </div>
      </div>
    </section>
  );
};

const StatsTableRow = ({ game }: StatsTableRowProps) => {
  return (
    <tr
      role="row"
      aria-label={`Game stats row: ${game.date} vs ${game.opponent}`}
      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-150 cursor-default"
    >
      <TableDataCell value={game.date} />
      <TableDataCell value={game.opponent} />
      <TableDataCell value={game.result} emphasis={game.result === 'W'} />
      <TableDataCell value={game.atBats} />
      <TableDataCell value={game.hits} emphasis={game.hits > 0} />
      <TableDataCell value={game.hr} emphasis={game.hr > 0} />
      <TableDataCell value={game.rbi} emphasis={game.rbi > 0} />
      <TableDataCell value={game.avg} emphasis />
    </tr>
  );
};

const ChartTooltip = ({ date, avg, hits, hr, rbi }: ChartTooltipProps) => {
  return (
    <div
      role="tooltip"
      aria-label={`Stats for ${date}`}
      className="hidden group-hover:flex flex-col gap-1 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-600 text-white text-xs rounded-lg p-3 shadow-xl z-10 whitespace-nowrap pointer-events-none"
    >
      <div className="font-bold border-b border-gray-700 pb-1 mb-1">{date}</div>
      <div className="flex justify-between gap-4"><span>AVG:</span> <span>{avg}</span></div>
      <div className="flex justify-between gap-4"><span>Hits:</span> <span>{hits}</span></div>
      <div className="flex justify-between gap-4"><span>HR:</span> <span>{hr}</span></div>
      <div className="flex justify-between gap-4"><span>RBI:</span> <span>{rbi}</span></div>
    </div>
  );
};

const PerformanceChartBar = ({ label, value, rawValue, color = 'bg-indigo-500', tooltipData }: PerformanceChartBarProps) => {
  const heightPercent = Math.max(5, value * 100);
  
  return (
    <div
      role="graphics-symbol"
      aria-label={`Bar for ${label}: ${rawValue}`}
      className="flex flex-col items-center justify-end gap-1 flex-1 group relative h-full"
    >
      <ChartTooltip {...tooltipData} />
      <div 
        className={`w-full max-w-[40px] rounded-t-sm transition-all duration-300 ${color} group-hover:brightness-125`}
        style={{ height: `${heightPercent}%` }}
      />
      <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center mt-1">
        {label}
      </span>
    </div>
  );
};

// ============================================================================
// Organisms
// ============================================================================

const PlayerStatsTable = ({ rows }: PlayerStatsTableProps) => {
  const [sortColumn, setSortColumn] = useState<keyof GameStat>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  const handleSort = (column: keyof GameStat) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(0);
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = sortColumn === 'avg' ? parseFloat(aVal) : aVal;
        bVal = sortColumn === 'avg' ? parseFloat(bVal) : bVal;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const columns: { key: keyof GameStat; label: string; sortable: boolean }[] = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'opponent', label: 'OPP', sortable: true },
    { key: 'result', label: 'Res', sortable: true },
    { key: 'atBats', label: 'AB', sortable: true },
    { key: 'hits', label: 'H', sortable: true },
    { key: 'hr', label: 'HR', sortable: true },
    { key: 'rbi', label: 'RBI', sortable: true },
    { key: 'avg', label: 'AVG', sortable: true },
  ];

  return (
    <section
      role="region"
      aria-label="Recent game statistics table"
      className="flex flex-col gap-0 bg-gray-800 rounded-2xl shadow-lg overflow-hidden w-full h-full"
    >
      <div className="p-6 pb-2">
        <SectionHeading title="Game Logs" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              {columns.map(col => (
                <TableHeaderCell
                  key={col.key}
                  label={col.label}
                  sortable={col.sortable}
                  sortDirection={sortColumn === col.key ? sortDirection : 'none'}
                  onClick={() => handleSort(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <StatsTableRow key={`${row.date}-${idx}`} game={row} />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No games found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-auto border-t border-gray-700 bg-gray-900 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors border border-gray-600"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors border border-gray-600"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

type MetricType = 'avg' | 'hits' | 'hr' | 'rbi';

const PerformanceChart = ({ games }: PerformanceChartProps) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('avg');
  
  const chartGames = [...games].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  const getMetricValue = (game: GameStat, metric: MetricType) => {
    if (metric === 'avg') return parseFloat(game.avg);
    return game[metric];
  };

  const maxVal = Math.max(
    ...chartGames.map(g => getMetricValue(g, activeMetric) as number),
    activeMetric === 'avg' ? 0.400 : 1
  );

  const metrics: { id: MetricType; label: string }[] = [
    { id: 'avg', label: 'AVG' },
    { id: 'hits', label: 'Hits' },
    { id: 'hr', label: 'HR' },
    { id: 'rbi', label: 'RBI' },
  ];

  return (
    <section
      role="region"
      aria-label="Recent game performance chart"
      className="flex flex-col gap-4 bg-gray-800 rounded-2xl shadow-lg p-6 w-full h-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeading title="Performance Trends" />
        
        <div className="flex p-1 bg-gray-900 rounded-lg w-fit border border-gray-700">
          {metrics.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeMetric === m.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[200px] mt-4 flex items-end justify-between gap-1 sm:gap-2">
        {chartGames.length > 0 ? (
          chartGames.map((game, i) => {
            const rawVal = getMetricValue(game, activeMetric);
            const normalized = maxVal === 0 ? 0 : (rawVal as number) / maxVal;
            const dateLabel = game.date.split('-').slice(1).join('/'); // MM/DD
            
            return (
              <PerformanceChartBar
                key={`${game.date}-${i}`}
                label={dateLabel}
                value={normalized}
                rawValue={game[activeMetric]}
                color={activeMetric === 'avg' ? 'bg-indigo-500' : 'bg-emerald-500'}
                tooltipData={{
                  date: game.date,
                  avg: game.avg,
                  hits: game.hits,
                  hr: game.hr,
                  rbi: game.rbi
                }}
              />
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm h-full">
            No data available
          </div>
        )}
      </div>
    </section>
  );
};

const DashboardHeader = ({ title = 'Baseball Stats', onSearch, onThemeToggle, isDark = true }: DashboardHeaderProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <header
      role="banner"
      aria-label="Dashboard header"
      className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-900 border-b border-gray-700 rounded-xl shadow-md w-full col-span-1 lg:col-span-12"
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
          <path d="M6 12h12" />
          <path d="M12 6v12" />
        </svg>
        <span className="text-lg font-bold text-white hidden sm:inline-block">{title}</span>
      </div>

      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full p-2 pl-10 text-sm text-white bg-gray-800 border border-gray-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
            placeholder="Search player..."
          />
        </form>
      </div>

      <button
        onClick={onThemeToggle}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </header>
  );
};

// ============================================================================
// Page
// ============================================================================

const MOCK_PLAYER_DATA = {
  playerName: "Shohei Ohtani",
  team: "LAD",
  position: "DH",
  jerseyNumber: 17,
  avatarSrc: "https://i.pravatar.cc/150?u=shohei",
  stats: {
    avg: ".310",
    hr: 54,
    rbi: 130,
    ops: "1.036"
  }
};

const MOCK_GAMES: GameStat[] = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date(2026, 2, 30 - i);
  const hits = Math.floor(Math.random() * 4);
  const atBats = hits + Math.floor(Math.random() * 3) + 1;
  const hr = hits > 0 ? Math.floor(Math.random() * 2) : 0;
  const rbi = hr * 1 + Math.floor(Math.random() * 3);
  
  return {
    date: date.toISOString().split('T')[0],
    opponent: ['NYY', 'SF', 'SD', 'ARI', 'BOS', 'HOU'][Math.floor(Math.random() * 6)],
    result: Math.random() > 0.4 ? 'W' : 'L',
    atBats,
    hits,
    hr,
    rbi,
    avg: (Math.random() * 0.15 + 0.250).toFixed(3).replace('0.', '.')
  };
});

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (query: string) => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div 
      role="main" 
      aria-label="Baseball player statistics dashboard"
      className={`${isDark ? 'dark text-white' : 'text-gray-900'} p-4 sm:p-6 lg:p-10`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        <DashboardHeader 
          onSearch={handleSearch} 
          onThemeToggle={toggleTheme} 
          isDark={isDark} 
        />
        
        <div className="col-span-1 lg:col-span-12">
          {isLoading ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gray-800 rounded-2xl shadow-lg w-full animate-pulse">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-8 bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-700 rounded w-1/4" />
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-16 bg-gray-700 rounded-xl" />)}
                </div>
              </div>
            </div>
          ) : (
            <PlayerProfileCard {...MOCK_PLAYER_DATA} />
          )}
        </div>
        
        <div className="col-span-1 lg:col-span-5 flex h-full min-h-[350px]">
          {isLoading ? (
            <div className="bg-gray-800 rounded-2xl p-6 w-full h-full animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-gray-700 rounded w-1/2" />
              <div className="flex-1 bg-gray-700/50 rounded-lg mt-4" />
            </div>
          ) : (
            <PerformanceChart games={MOCK_GAMES} />
          )}
        </div>
        
        <div className="col-span-1 lg:col-span-7 flex h-full min-h-[350px]">
          {isLoading ? (
            <div className="bg-gray-800 rounded-2xl p-6 w-full h-full animate-pulse flex flex-col gap-4">
              <div className="h-6 bg-gray-700 rounded w-1/3" />
              <div className="space-y-3 mt-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-700/50 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <PlayerStatsTable rows={MOCK_GAMES} />
          )}
        </div>
      </div>
    </div>
  );
}
