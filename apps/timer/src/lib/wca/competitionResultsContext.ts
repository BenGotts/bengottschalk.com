"use client";

import { createContext, useContext } from "react";
import type { CompetitionResultsState } from "./useCompetitionResults";

/**
 * The WCA results state from TimerApp's useCompetitionResults, for the
 * account menu and Settings (which show and refresh it next to cloud sync).
 * Null outside TimerApp.
 */
export const CompetitionResultsContext = createContext<CompetitionResultsState | null>(null);

export const useCompetitionResultsState = () => useContext(CompetitionResultsContext);
