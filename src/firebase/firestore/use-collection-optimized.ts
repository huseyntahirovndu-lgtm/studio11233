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
    }
  }
}

const queryCache = new Map<string, {
  data: any[];
  timestamp: number;
}>();

const CACHE_DURATION = 5000;

function getQueryKey(query: any): string {
  if (query.type === 'collection') {
    return (query as CollectionReference).path;
  }
  return (query as unknown as InternalQuery)._query.path.canonicalString();
}

export function useCollectionOptimized<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean}) | null | undefined,
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
    
    if (enableCache && isInitialMount.current) {
      const cached = queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    const setupRealtimeListener = () => {
      const unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery!,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: ResultItemType[] = [];
          snapshot.forEach((doc) => {
            results.push({ ...(doc.data() as T), id: doc.id });
          });
          
          setData(results);
          setError(null);
          setIsLoading(false);
          
          queryCache.set(queryKey, { data: results, timestamp: Date.now() });
        },
        (error: FirestoreError) => {
          const path = memoizedTargetRefOrQuery!.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();
          
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          });
          
          setError(contextualError);
          setData(null);
          setIsLoading(false);
          errorEmitter.emit('permission-error', contextualError);
        }
      );
      
      return unsubscribe;
    };

    if (disableRealtimeOnInit && isInitialMount.current) {
      isInitialMount.current = false;
      
      getDocsFromCache(memoizedTargetRefOrQuery)
        .then((snapshot) => {
          const results: ResultItemType[] = [];
          snapshot.forEach((doc) => {
            results.push({ ...(doc.data() as T), id: doc.id });
          });
          
          if (results.length > 0) {
            setData(results);
            setIsLoading(false);
            queryCache.set(queryKey, { data: results, timestamp: Date.now() });
          } else {
             // If cache is empty, fetch from server and then set up listener.
            getDocsFromServer(memoizedTargetRefOrQuery).then(serverSnapshot => {
               const serverResults: ResultItemType[] = [];
               serverSnapshot.forEach((doc) => {
                 serverResults.push({ ...(doc.data() as T), id: doc.id });
               });
               setData(serverResults);
               setIsLoading(false);
               queryCache.set(queryKey, { data: serverResults, timestamp: Date.now() });
               setupRealtimeListener(); // Set up listener after initial server fetch
            }).catch(() => {
                // If server fetch fails, still set up the listener
                setupRealtimeListener();
            });
          }
        })
        .catch(() => {
          // If getting from cache fails, directly set up the listener
          setupRealtimeListener();
        });
      
      return;
    }

    const unsubscribe = setupRealtimeListener();
    isInitialMount.current = false;

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [memoizedTargetRefOrQuery, enableCache, disableRealtimeOnInit]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(String(memoizedTargetRefOrQuery) + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}
