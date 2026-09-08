'use client';

import { useMemo } from 'react';
import { useTheme } from '@/src/context/ThemeContext';
import { getChartTheme, type ChartTheme } from './theme';

/** The chart palette for whichever theme the site is currently in. */
export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  return useMemo(() => getChartTheme(theme), [theme]);
}
