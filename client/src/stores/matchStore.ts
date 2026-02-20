import { create } from 'zustand';
import { matchAPI } from '../services/api.js';
import { Match, SportType, MatchStatus } from '../../../shared/types/index.js';

interface MatchState {
  matches: Match[];
  currentMatch: Match | null;
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loadMatches: (params?: any) => Promise<void>;
  loadMatch: (id: string) => Promise<void>;
  createMatch: (matchData: any) => Promise<void>;
  updateMatch: (id: string, matchData: any) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  updateMatchStatus: (id: string, status: string) => Promise<void>;
  lockMatch: (id: string, isLocked: boolean) => Promise<void>;
  setCurrentMatch: (match: Match | null) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  currentMatch: null,
  isLoading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  loadMatches: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await matchAPI.getMatches(params);
      set({
        matches: response.matches,
        pagination: response.pagination,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadMatch: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await matchAPI.getMatch(id);
      set({
        currentMatch: response.match,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createMatch: async (matchData) => {
    set({ isLoading: true });
    try {
      const response = await matchAPI.createMatch(matchData);
      const { matches } = get();
      set({
        matches: [response.match, ...matches],
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateMatch: async (id, matchData) => {
    set({ isLoading: true });
    try {
      const response = await matchAPI.updateMatch(id, matchData);
      const { matches, currentMatch } = get();
      
      const updatedMatches = matches.map(match =>
        match.id === id ? response.match : match
      );
      
      set({
        matches: updatedMatches,
        currentMatch: currentMatch?.id === id ? response.match : currentMatch,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteMatch: async (id: string) => {
    set({ isLoading: true });
    try {
      await matchAPI.deleteMatch(id);
      const { matches } = get();
      set({
        matches: matches.filter(match => match.id !== id),
        currentMatch: get().currentMatch?.id === id ? null : get().currentMatch,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateMatchStatus: async (id, status) => {
    try {
      const response = await matchAPI.updateMatchStatus(id, status);
      const { matches, currentMatch } = get();
      
      const updatedMatches = matches.map(match =>
        match.id === id ? response.match : match
      );
      
      set({
        matches: updatedMatches,
        currentMatch: currentMatch?.id === id ? response.match : currentMatch
      });
    } catch (error) {
      throw error;
    }
  },

  lockMatch: async (id, isLocked) => {
    try {
      const response = await matchAPI.lockMatch(id, isLocked);
      const { matches, currentMatch } = get();
      
      const updatedMatches = matches.map(match =>
        match.id === id ? response.match : match
      );
      
      set({
        matches: updatedMatches,
        currentMatch: currentMatch?.id === id ? response.match : currentMatch
      });
    } catch (error) {
      throw error;
    }
  },

  setCurrentMatch: (match) => {
    set({ currentMatch: match });
  }
}));
