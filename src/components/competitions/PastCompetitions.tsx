"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import "@cubing/icons";
import ReactCountryFlag from "react-country-flag";
import { useState } from "react";
import { WCA_ID } from "@/consts";
import { Competition } from "@/lib/types";

interface PastCompetitionsProps {
  competitions: Competition[];
}

export default function PastCompetitions({ competitions }: PastCompetitionsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate stats
    const myDelegateCount = competitions.filter(comp => 
        comp.delegates?.some(delegate => delegate.wca_id === WCA_ID)
    ).length;
    
    const myOrganizerCount = competitions.filter(comp => 
        comp.organizers?.some(organizer => organizer.wca_id === WCA_ID)
    ).length;

    if (competitions.length === 0) {
        return <div className="text-center text-gray-500 py-8">No past competitions found.</div>;
    }

    return (
        <div className="w-full">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="past-competitions" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <span className="text-lg sm:text-xl font-semibold">Past Competitions</span>
                                    <Badge variant="secondary">
                                        {competitions.length} total
                                    </Badge>
                                    {myDelegateCount > 0 && (
                                        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            {myDelegateCount} Delegate
                                        </Badge>
                                    )}
                                    {myOrganizerCount > 0 && (
                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                            {myOrganizerCount} Organizer
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                    {isExpanded ? "Click to collapse" : "Click to expand"}
                                </div>
                            </div>
                            
                            {/* Preview when collapsed */}
                            {!isExpanded && (
                                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs sm:text-sm text-gray-600 mb-2">Recent competitions:</div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {competitions.slice(0, 8).map((comp) => (
                                            <div
                                                key={comp.id}
                                                className="inline-flex items-center space-x-1 px-1.5 sm:px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
                                                onClick={() => window.open(comp.url, '_blank')}
                                                title={`${comp.name} - ${comp.date_range}`}
                                            >
                                                <ReactCountryFlag 
                                                    countryCode={comp.country_iso2} 
                                                    svg 
                                                    className="text-xs" 
                                                />
                                                <span className="truncate max-w-16 sm:max-w-24">{comp.name}</span>
                                                <span className="text-gray-500 hidden sm:inline">({comp.date_range})</span>
                                            </div>
                                        ))}
                                        {competitions.length > 8 && (
                                            <span className="text-xs text-gray-500 self-center px-2">
                                                +{competitions.length - 8} more...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                        {/* Full expanded view */}
                        <Card className="w-full border-0 shadow-none">
                            <CardContent className="p-2 sm:p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                                    {competitions.map((comp) => {
                                        const isMyDelegate = comp.delegates?.some(delegate => delegate.wca_id === WCA_ID);
                                        const isMyOrganizer = comp.organizers?.some(organizer => organizer.wca_id === WCA_ID);
                                        
                                        return (
                                            <div
                                                key={comp.id}
                                                className="border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group bg-white hover:bg-gray-50"
                                                onClick={() => window.open(comp.url, '_blank')}
                                            >
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    {/* Competition Name */}
                                                    <div className="font-medium text-xs sm:text-sm line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                                                        <span className="flex-1 pr-1 sm:pr-2">{comp.name}</span>
                                                        <span className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                            Click to view →
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Date and Location */}
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                        <div className="font-medium">{comp.date_range}</div>
                                                        <div className="flex items-center space-x-1">
                                                            <span>{comp.city}</span>
                                                            <ReactCountryFlag 
                                                                countryCode={comp.country_iso2} 
                                                                svg 
                                                                className="text-xs sm:text-sm" 
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
                                                    
                                                    {/* Events */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {comp.event_ids.slice(0, 6).map((id) => (
                                                            <span 
                                                                key={id} 
                                                                className={`text-base sm:text-lg cubing-icon event-${id}`}
                                                                title={id}
                                                            ></span>
                                                        ))}
                                                        {comp.event_ids.length > 6 && (
                                                            <span className="text-xs text-gray-500 self-center">
                                                                +{comp.event_ids.length - 6} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Footer with Results Link */}
                                                {comp.results_posted_at && (
                                                    <div className="pt-2 mt-2 border-t border-gray-100">
                                                        <div
                                                            className="flex items-center justify-center text-green-600 hover:text-green-800 text-xs font-medium cursor-pointer group"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`https://www.worldcubeassociation.org/competitions/${comp.id}/results/by_person#2016GOTT01`, '_blank');
                                                            }}
                                                        >
                                                            <span>View My Results</span>
                                                            <svg className="w-3 h-3 ml-1 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}