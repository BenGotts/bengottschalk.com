import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "@cubing/icons";
import { ReactCountryFlag } from "react-country-flag";
import { WCA_ID } from "@/consts";
import type { WcaCompetition } from "@/lib/types";

interface CompetitionCardProps {
    competition: WcaCompetition;
    isOngoing?: boolean;
}

export default function CompetitionCard({ competition, isOngoing = false }: CompetitionCardProps) {
    // Check if I'm a delegate or organizer for this competition
    const isMyDelegate = competition.delegates?.some(delegate => delegate.wca_id === WCA_ID);
    const isMyOrganizer = competition.organizers?.some(organizer => organizer.wca_id === WCA_ID);

    return (
        <Card className={`relative border transition-all cursor-pointer group bg-white hover:bg-gray-50 ${
            isOngoing 
                ? 'border-red-400 hover:border-red-500 animate-pulse-border' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}>
            <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                    {/* Competition Name */}
                    <div className="font-semibold text-sm sm:text-base line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 pr-2">
                            {isOngoing && (
                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse shrink-0"></span>
                            )}
                            <a href={competition.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 after:content-['']">
                                {competition.name}
                            </a>
                        </div>
                        <span className="text-blue-500 text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            Click to view →
                        </span>
                    </div>

                    {/* Date and Location */}
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div className="font-medium">{competition.date_range}</div>
                        <div className="flex items-center space-x-1">
                            <span>{competition.city}</span>
                            <ReactCountryFlag
                                countryCode={competition.country_iso2}
                                svg
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Role Badges */}
                    <div className="flex flex-wrap gap-1">
                        {isMyDelegate && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                                Delegate
                            </Badge>
                        )}
                        {isMyOrganizer && (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                                Organizer
                            </Badge>
                        )}
                    </div>

                    {/* Events - Show all events */}
                    <div className="flex flex-wrap gap-1">
                        {competition.event_ids.map((id) => (
                            <span
                                key={id}
                                className={`text-lg sm:text-xl cubing-icon event-${id} text-gray-700`}
                                title={id}
                            ></span>
                        ))}
                    </div>
                </div>

                {/* Footer with Results Links */}
                <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
                    {isOngoing && (
                        <a
                            href={`https://live.worldcubeassociation.org/link/competitions/${competition.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 flex items-center justify-center text-red-600 hover:text-red-800 text-xs sm:text-sm font-semibold cursor-pointer group"
                        >
                            <span>[Live] Results</span>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}

                    {competition.results_posted_at && (
                        <a
                            href={`https://www.worldcubeassociation.org/competitions/${competition.id}/results/all`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 flex items-center justify-center text-green-700 hover:text-green-900 text-xs sm:text-sm font-medium cursor-pointer group"
                        >
                            <span>View Results</span>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-400 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
