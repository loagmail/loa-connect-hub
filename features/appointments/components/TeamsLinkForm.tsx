"use client"

interface TeamsLinkSlot {
  key: string
  date: string
  startTime: string
  endTime: string
}

interface TeamsLinkFormProps {
  teamsLinkMode: "single" | "per-slot"
  onModeChange: (mode: "single" | "per-slot") => void
  singleLink: string
  onSingleLinkChange: (value: string) => void
  slotLinks: Record<string, string>
  onSlotLinkChange: (key: string, value: string) => void
  timeSlots: TeamsLinkSlot[]
  error?: string
  label?: string
}

export default function TeamsLinkForm({
  teamsLinkMode,
  onModeChange,
  singleLink,
  onSingleLinkChange,
  slotLinks,
  onSlotLinkChange,
  timeSlots,
  error,
  label = "Microsoft Teams Links",
}: TeamsLinkFormProps) {
  const showPerSlotOption = timeSlots.length > 1

  return (
    <div className="mb-4 space-y-3">
      <p className="text-xs text-tertiary font-medium uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="teams-link-mode"
            checked={teamsLinkMode === "single"}
            onChange={() => onModeChange("single")}
            className="accent-gold-600"
          />
          <span className="text-sm text-secondary">One single link for all time slots</span>
        </label>
        {showPerSlotOption && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="teams-link-mode"
              checked={teamsLinkMode === "per-slot"}
              onChange={() => onModeChange("per-slot")}
              className="accent-gold-600"
            />
            <span className="text-sm text-secondary">Assign each slot its own link</span>
          </label>
        )}
      </div>

      <div className="space-y-3">
        {teamsLinkMode === "single" && (
          <div>
            <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">
              Single meeting link for all time slots
            </p>
            <input
              type="url"
              value={singleLink}
              onChange={(e) => onSingleLinkChange(e.target.value)}
              placeholder="https://teams.microsoft.com/l/meetup-join/..."
              className="input text-xs py-2 w-full"
            />
          </div>
        )}

        {teamsLinkMode === "per-slot" && (
          <div className="space-y-3">
            {timeSlots.map((slot) => (
              <div key={slot.key}>
                <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-1">
                  {slot.date} {slot.startTime}–{slot.endTime}
                </p>
                <input
                  type="url"
                  value={slotLinks[slot.key] || ""}
                  onChange={(e) => onSlotLinkChange(slot.key, e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  className="input text-xs py-2 w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  )
}
