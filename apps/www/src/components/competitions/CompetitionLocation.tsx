import { ReactCountryFlag } from "react-country-flag";
import { LuGlobe } from "react-icons/lu";
import { isMultiLocation } from "@/lib/wca/competitions";

/** City and flag, or "Multiple locations" for multi-venue competitions like FMC. */
export default function CompetitionLocation({ city, countryIso2 }: { city: string; countryIso2: string }) {
  if (isMultiLocation({ country_iso2: countryIso2 })) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted">
        <LuGlobe aria-hidden="true" /> Multiple locations
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted">
      {city}
      <ReactCountryFlag countryCode={countryIso2} svg aria-label={countryIso2} />
    </span>
  );
}
