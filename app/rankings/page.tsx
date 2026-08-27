'use client';

import { useState } from 'react';

// Types for structured rankings
type TeamRanking = {
  rank: number;
  team: string;
  record: string;
  previousRank: string; // e.g. "1", "3", "NR"
  notes?: string;
};

type ClassificationData = {
  [classification: string]: TeamRanking[];
};

type WeeklyRankingsData = {
  [week: string]: ClassificationData;
};

// PRE-POPULATED WPIAL RANKINGS DATA STRUCTURE
const weeklyRankingsData: WeeklyRankingsData = {
  'Week 1': {
    '6A': [
      { rank: 1, team: 'Pittsburgh Central Catholic', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'North Allegheny', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Canon-Mac', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'Seneca Valley', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'Norwin', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Mt. Lebanon', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'Hempfield', record: '0-0', previousRank: '7' },
    ],
    '5A': [
      { rank: 1, team: 'Pine-Richland', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'Peters Township', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Upper St. Clair', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'Penn-Trafford', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'Moon', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Bethel Park', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'Thomas Jefferson', record: '0-0', previousRank: '7' },
      { rank: 8, team: 'North Hills', record: '0-0', previousRank: '8' },
      { rank: 9, team: 'Gateway', record: '0-0', previousRank: '9' },
      { rank: 10, team: 'West Allegheny', record: '0-0', previousRank: '10' },
      { rank: 11, team: 'Woodland Hills', record: '0-0', previousRank: '11' },
      { rank: 12, team: 'Penn Hills', record: '0-0', previousRank: '12' },
      { rank: 13, team: 'Plum', record: '0-0', previousRank: '13' },
      { rank: 14, team: 'Franklin Regional', record: '0-0', previousRank: '14' },
      { rank: 15, team: 'Armstrong', record: '0-0', previousRank: '15' },
      { rank: 16, team: 'Latrobe', record: '0-0', previousRank: '16' },
      { rank: 17, team: 'Trinity', record: '0-0', previousRank: '17' },
      { rank: 18, team: 'Fox Chapel', record: '0-0', previousRank: '18' },
      { rank: 19, team: 'Connellsville', record: '0-0', previousRank: '19' },
    ],
    '4A': [
      { rank: 1, team: 'McKeesport', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'South Fayette', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Montour', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'New Castle', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'Mars', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Central Valley', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'Shaler', record: '0-0', previousRank: '7' },
      { rank: 8, team: 'Kiski Area', record: '0-0', previousRank: '8' },
      { rank: 9, team: 'Chartiers Valley', record: '0-0', previousRank: '9' },
      { rank: 10, team: 'Ringgold', record: '0-0', previousRank: '10' },
      { rank: 11, team: 'Hampton', record: '0-0', previousRank: '11' },
      { rank: 12, team: 'Blackhawk', record: '0-0', previousRank: '12' },
      { rank: 13, team: 'Indiana', record: '0-0', previousRank: '13' },
      { rank: 14, team: 'Albert Gallatin', record: '0-0', previousRank: '14' },
      { rank: 15, team: 'Laurel Highlands', record: '0-0', previousRank: '15' },
      { rank: 16, team: 'Uniontown', record: '0-0', previousRank: '16' },
    ],
    '3A': [
      { rank: 1, team: 'Avonworth', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'Aliquippa', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Propel Braddock', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'Belle Vernon', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'West Mifflin', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Hopewell', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'North Catholic', record: '0-0', previousRank: '7' },
      { rank: 8, team: 'Beaver', record: '0-0', previousRank: '8' },
      { rank: 9, team: 'Highlands', record: '0-0', previousRank: '9' },
      { rank: 10, team: 'Elizabeth Forward', record: '0-0', previousRank: '10' },
      { rank: 11, team: 'Freeport', record: '0-0', previousRank: '11' },
      { rank: 12, team: 'Derry', record: '0-0', previousRank: '12' },
      { rank: 13, team: 'Ambridge', record: '0-0', previousRank: '13' },
      { rank: 14, team: 'South Park', record: '0-0', previousRank: '14' },
      { rank: 15, team: 'Deer Lakes', record: '0-0', previousRank: '15' },
      { rank: 16, team: 'Mt. Pleasant', record: '0-0', previousRank: '16' },
      { rank: 17, team: 'Burrell', record: '0-0', previousRank: '17' },
      { rank: 18, team: 'OLSH', record: '0-0', previousRank: '18' },
      { rank: 19, team: 'Ellwood City', record: '0-0', previousRank: '19' },
      { rank: 20, team: 'Greensburg Salem', record: '0-0', previousRank: '20' },
      { rank: 21, team: 'Shady Side Academy', record: '0-0', previousRank: '21' },
      { rank: 22, team: 'Southmoreland', record: '0-0', previousRank: '22' },
      { rank: 23, team: 'Yough', record: '0-0', previousRank: '23' },
      { rank: 24, team: 'Waynesburg Central', record: '0-0', previousRank: '24' },
      { rank: 25, team: 'Knoch', record: '0-0', previousRank: '25' },
      { rank: 26, team: 'Valley', record: '0-0', previousRank: '26' },
    ],
    '2A': [
      { rank: 1, team: 'Seton LaSalle', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'Steel Valley', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Bishop Canevin', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'South Allegheny', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'Mohawk', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Keystone Oaks', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'McGuffey', record: '0-0', previousRank: '7' },
      { rank: 8, team: 'Quaker Valley', record: '0-0', previousRank: '8' },
      { rank: 9, team: 'Western Beaver', record: '0-0', previousRank: '9' },
      { rank: 10, team: 'Neshannock', record: '0-0', previousRank: '10' },
      { rank: 11, team: 'Apollo Ridge', record: '0-0', previousRank: '11' },
      { rank: 12, team: 'Beaver Falls', record: '0-0', previousRank: '12' },
      { rank: 13, team: 'Chartiers-Houston', record: '0-0', previousRank: '13' },
      { rank: 14, team: 'Riverside', record: '0-0', previousRank: '14' },
      { rank: 15, team: 'Ligonier Valley', record: '0-0', previousRank: '15' },
      { rank: 16, team: 'East Allegheny', record: '0-0', previousRank: '16' },
      { rank: 17, team: 'New Brighton', record: '0-0', previousRank: '17' },
      { rank: 18, team: 'Freedom', record: '0-0', previousRank: '18' },
      { rank: 19, team: 'Carlynton', record: '0-0', previousRank: '19' },
      { rank: 20, team: 'Brownsville', record: '0-0', previousRank: '20' },
      { rank: 21, team: 'Charleroi', record: '0-0', previousRank: '21' },
    ],
    '1A': [
      { rank: 1, team: 'Clairton', record: '0-0', previousRank: '1' },
      { rank: 2, team: 'Washington', record: '0-0', previousRank: '2' },
      { rank: 3, team: 'Laurel', record: '0-0', previousRank: '3' },
      { rank: 4, team: 'Jeannette', record: '0-0', previousRank: '4' },
      { rank: 5, team: 'Fort Cherry', record: '0-0', previousRank: '5' },
      { rank: 6, team: 'Greensburg Central Catholic', record: '0-0', previousRank: '6' },
      { rank: 7, team: 'Leechburg', record: '0-0', previousRank: '7' },
      { rank: 8, team: 'South Side Beaver', record: '0-0', previousRank: '8' },
      { rank: 9, team: 'Brentwood', record: '0-0', previousRank: '9' },
      { rank: 10, team: 'California', record: '0-0', previousRank: '10' },
      { rank: 11, team: 'Monessen', record: '0-0', previousRank: '11' },
      { rank: 12, team: 'Shenango', record: '0-0', previousRank: '12' },
      { rank: 13, team: 'Cornell', record: '0-0', previousRank: '13' },
      { rank: 14, team: 'Jefferson Morgan', record: '0-0', previousRank: '14' },
      { rank: 15, team: 'Serra Catholic', record: '0-0', previousRank: '15' },
      { rank: 16, team: 'Rochester', record: '0-0', previousRank: '16' },
      { rank: 17, team: 'Northgate', record: '0-0', previousRank: '17' },
      { rank: 18, team: 'Frazier', record: '0-0', previousRank: '18' },
      { rank: 19, team: 'Avella', record: '0-0', previousRank: '19' },
      { rank: 20, team: 'Riverview', record: '0-0', previousRank: '20' },
      { rank: 21, team: 'Burgettstown', record: '0-0', previousRank: '21' },
      { rank: 22, team: 'Bentworth', record: '0-0', previousRank: '22' },
      { rank: 23, team: 'Sto Rox', record: '0-0', previousRank: '23' },
      { rank: 24, team: 'Union', record: '0-0', previousRank: '24' },
      { rank: 25, team: 'West Greene', record: '0-0', previousRank: '25' },
      { rank: 26, team: 'Beth Center', record: '0-0', previousRank: '26' },
      { rank: 27, team: 'Carmichaels', record: '0-0', previousRank: '27' },
      { rank: 28, team: 'Summit Academy', record: '0-0', previousRank: '28' },
      { rank: 29, team: 'Springdale', record: '0-0', previousRank: '29' },
      { rank: 30, team: 'Mapletown', record: '0-0', previousRank: '30' },
    ],
  },
};

const classifications = ['6A', '5A', '4A', '3A', '2A', '1A'];
const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

export default function RankingsPage() {
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  const [selectedClass, setSelectedClass] = useState('6A');

  const currentRankings =
    weeklyRankingsData[selectedWeek]?.[selectedClass] || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-bold">
            WPIAL Football Central
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Official WPIAL Rankings & Analytics
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Title Block */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            2026 Season
          </p>
          <h2 className="mt-2 text-4xl font-bold">
            WPIAL Rankings Room
          </h2>
          <p className="mt-2 text-slate-400">
            Weekly official team rankings across all six WPIAL classifications.
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Classification Tabs */}
          <div className="flex flex-wrap gap-2">
            {classifications.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="week-select" className="text-sm font-medium text-slate-400">
              Week:
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-blue-500"
            >
              {weeks.map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rankings Table */}
        {currentRankings.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Team</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-2 text-center">Prev Rank</div>
              <div className="col-span-2 text-right">Notes</div>
            </div>

            {/* Table Body */}
            {currentRankings.map((item) => (
              <div
                key={item.team}
                className="grid grid-cols-12 items-center border-b border-slate-800 px-6 py-5 last:border-b-0 hover:bg-slate-800/50"
              >
                {/* Rank */}
                <div className="col-span-1 text-lg font-bold text-blue-400">
                  #{item.rank}
                </div>

                {/* Team Name */}
                <div className="col-span-5 font-semibold text-white">
                  {item.team}
                </div>

                {/* Record */}
                <div className="col-span-2 text-center font-semibold text-slate-300">
                  {item.record}
                </div>

                {/* Previous Rank */}
                <div className="col-span-2 text-center text-slate-400">
                  {item.previousRank ? `#${item.previousRank}` : '-'}
                </div>

                {/* Notes/Tier */}
                <div className="col-span-2 text-right text-xs text-slate-400 truncate">
                  {item.notes || '—'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold">
              No Rankings Posted Yet
            </h3>
            <p className="mt-2 text-slate-400">
              Rankings for {selectedClass} ({selectedWeek}) will be released soon.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}