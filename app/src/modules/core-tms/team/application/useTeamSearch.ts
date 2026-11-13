'use client';
import { useEffect, useState } from 'react';
export function useTeamSearch() {
  const [search,setSearch] = useState(''), [query,setQuery] = useState('');
  useEffect(() => { const timer = window.setTimeout(() => setQuery(search.trim()), 220); return () => window.clearTimeout(timer); }, [search]);
  return {search,query,setSearch};
}
