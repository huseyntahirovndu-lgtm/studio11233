'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  getDocsFromCache,
  getDocsFromServer,
} from 'firebase/firestore';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

// CACHE
const queryCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

function getQueryKey(query: any): string {
  if (query.type === 'collection') {
    return (query as CollectionReference).path;
  }

  return (query as unknown as InternalQuery)._query.path.canonicalString();
}

export function useCollectionOptimized<T = any>(
  memoizedTargetRefOrQuery:
    | ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean })
    | null
    | undefined,
  options?: {
    enableCache?: boolean;
    disableRealtimeOnInit?: boolean;
  }
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const isInitialMount = useRef(true);
  const enableCache = options?.enableCache ?? true;
  const disableRealtimeOnInit = options?.disableRealtimeOnInit ?? false;

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const queryKey = getQueryKey(memoizedTargetRefOrQuery);

    // 1️⃣ FIRST: Try cache
    if (enableCache && isInitialMount.current) {
      const cached = queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Cache hit:', queryKey);
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    // 2️⃣ FIRST LOAD WITHOUT REALTIME
    if (disableRealtimeOnInit && isInitialMount.current) {
      isInitialMount.current = false;

      getDocsFromCache(memoizedTargetRefOrQuery)
        .then((snapshot) => {
          const results: ResultItemType[] = [];
          snapshot.forEach((doc) => results.push({ ...(doc.data(
